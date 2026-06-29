const extractBtn = document.getElementById("extract");
const copyBtn = document.getElementById("copy");
const downloadBtn = document.getElementById("download");
const output = document.getElementById("output");
const status = document.getElementById("status");
const tip = document.getElementById("tip");
const verboseCheckbox = document.getElementById("verbose");

let lastTitle = "";

// Sites whose content lazy-loads as the user scrolls. We do not auto-scroll
// (see ADR-0001), so the user has to do it. The tip is a reminder, not a gate.
const LAZY_SITES = [
  { pattern: /^https:\/\/([^/]+\.)?linkedin\.com\/(in|company)\//, name: "LinkedIn" },
  { pattern: /^https:\/\/(twitter|x)\.com\//, name: "Twitter/X" },
  { pattern: /^https:\/\/([^/]+\.)?crunchbase\.com\//, name: "Crunchbase" },
  { pattern: /^https:\/\/([^/]+\.)?wellfound\.com\//, name: "Wellfound" },
];

async function maybeShowTip() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.url) return;
    const match = LAZY_SITES.find((s) => s.pattern.test(tab.url));
    const rule = await mergedRuleForUrl(tab.url);
    if (match) {
      const ruleNote = rule
        ? ` Site cleanup rules will be applied automatically.`
        : ``;
      tip.textContent =
        `Tip: ${match.name} lazy-loads content. Scroll to the bottom ` +
        `and expand any "Show more" sections before extracting.${ruleNote}`;
      tip.style.display = "block";
    }
  } catch {
    // Tab query failures are non-fatal — the extension still works.
  }
}

maybeShowTip();

const openOptionsLink = document.getElementById("open-options");
if (openOptionsLink) {
  openOptionsLink.addEventListener("click", (ev) => {
    ev.preventDefault();
    chrome.runtime.openOptionsPage();
  });
}

function setStatus(msg, kind) {
  status.textContent = msg;
  status.className = kind || "";
}

function slugify(s) {
  return (s || "page")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "page";
}

extractBtn.addEventListener("click", async () => {
  extractBtn.disabled = true;
  copyBtn.disabled = true;
  downloadBtn.disabled = true;
  output.value = "";
  setStatus("Extracting…");

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.id) {
      throw new Error("No active tab.");
    }

    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["vendor/Readability.js", "vendor/turndown.js"],
    });

    const forceVerbose = verboseCheckbox.checked;
    // If the user has explicitly checked Verbose, skip site rules and use
    // plain verbose extraction. Otherwise, prefer site rules when available;
    // fall back to Readability for unknown sites. See ADR-0002 and ADR-0003.
    const siteRule = forceVerbose ? null : await mergedRuleForUrl(tab.url);
    const useReadability = !forceVerbose && !siteRule;
    const mode = useReadability
      ? "readability"
      : siteRule
        ? siteRule.name.toLowerCase()
        : "verbose";
    const cleanupSelectors = siteRule ? siteRule.cleanupSelectors : null;
    const removeSectionsByHeading = siteRule
      ? siteRule.removeSectionsByHeading || []
      : [];

    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      args: [useReadability, cleanupSelectors, mode],
      func: (useReadability, cleanupSelectors, mode) => {
        let html;
        let title = document.title || "Untitled";
        let byline = null;

        // Generic chrome that gets stripped from every verbose extraction.
        // Site rules (cleanupSelectors) extend this list when present.
        const GENERIC_STRIP =
          "nav, header > nav, footer, aside, [role='navigation'], " +
          "[role='banner'], [role='complementary'], script, style, noscript";

        if (useReadability) {
          const doc = document.cloneNode(true);
          const article = new Readability(doc).parse();
          if (!article || !article.content) {
            return {
              ok: false,
              error:
                "Readability could not extract main content. Try Verbose mode for a fuller capture.",
            };
          }
          title = article.title || title;
          byline = article.byline;
          html = article.content;
        } else {
          // Verbose path — either site-rule-driven or user-forced.
          const root =
            document.querySelector("main") ||
            document.querySelector("article") ||
            document.body;
          const clone = root.cloneNode(true);
          // Always strip the generic chrome.
          clone.querySelectorAll(GENERIC_STRIP).forEach((el) => el.remove());
          // Then apply site-specific cleanup selectors if provided. Each
          // selector is independent; a missing selector is a no-op, not
          // an error. This is the only DOM operation rules can cause.
          if (cleanupSelectors && cleanupSelectors.length) {
            for (const selector of cleanupSelectors) {
              try {
                clone.querySelectorAll(selector).forEach((el) => el.remove());
              } catch {
                // Malformed selectors are ignored. Output stays noisier
                // rather than breaking the extraction.
              }
            }
          }
          // Strip empty list items. Verbose extraction often surfaces
          // <li> elements whose only content was buttons or links that
          // got removed by the cleanup pass — they render as standalone
          // "-" bullets in the markdown.
          clone.querySelectorAll("li").forEach((li) => {
            if (!li.textContent.trim()) li.remove();
          });
          html = clone.outerHTML;
        }

        const turndown = new TurndownService({
          headingStyle: "atx",
          codeBlockStyle: "fenced",
          bulletListMarker: "-",
        });

        // Strip images entirely. Profile/site logos and decorative photos
        // produce 200+ chars of URL noise per image with no informational
        // value in a text capture. If we ever want images, make this opt-in.
        turndown.addRule("stripImages", {
          filter: "img",
          replacement: () => "",
        });

        // Strip empty link anchors. LinkedIn and many SPA frameworks wrap
        // entire card areas in <a> tags with no rendered text; these come
        // through as `[](url)` and add nothing. Anchors whose only child is
        // an image become empty once stripImages runs above, so this also
        // covers logo-link patterns like <a><img src=logo></a>.
        turndown.addRule("stripEmptyLinks", {
          filter: (node) => node.nodeName === "A" && !node.textContent.trim(),
          replacement: () => "",
        });

        // Unwrap content-wrapping anchors. LinkedIn wraps each experience
        // card's full content in an <a> pointing at the company page. The
        // content is useful; the link wrapping is noise that surfaces as
        // multi-line `[ ...card text... ](url)`. Heuristic: if the anchor
        // contains any block-level element, treat it as a wrapper — keep
        // the inner content, drop the link syntax.
        turndown.addRule("unwrapContentLinks", {
          filter: (node) =>
            node.nodeName === "A" &&
            !!node.querySelector("p, div, li, h1, h2, h3, h4, h5, h6, ul, ol"),
          replacement: (content) => content,
        });

        // Strip horizontal rules. Used as section dividers on most sites;
        // markdown headings already imply structure, so `* * *` is just noise.
        turndown.addRule("stripHr", {
          filter: "hr",
          replacement: () => "",
        });

        let body = turndown.turndown(html);

        // Post-processing pipeline. Each step is generic — useful on any
        // site, not just the LinkedIn-rule path.
        body = body
          .split("\n")
          // Trailing whitespace on lines.
          .map((line) => line.replace(/[ \t]+$/, ""))
          // Drop standalone empty bullets ("-", "- ", "-   ") that survive
          // when their <li> had only buttons/links that got removed.
          .filter((line) => !/^\s*-\s*$/.test(line))
          // Drop standalone connection-degree markers ("· 1st", "· 2nd",
          // bare separator dots). LinkedIn DOM puts these in tiny spans
          // that render as their own line in markdown.
          .filter((line) => !/^\s*·\s*(\d+(st|nd|rd|th))?\s*$/.test(line))
          .join("\n");

        // Collapse consecutive identical non-blank lines (e.g., the same
        // "Message Peter" link rendered twice, the same company name
        // appearing back-to-back). Keep blank lines as separators.
        const seen = body.split("\n");
        const collapsed = [];
        let prev = null;
        for (const line of seen) {
          if (line.trim() && line === prev) continue;
          collapsed.push(line);
          prev = line;
        }
        body = collapsed
          .join("\n")
          .replace(/\n{3,}/g, "\n\n")
          .trim();
        const url = location.href;
        const captured = new Date().toISOString();
        const md =
          `---\n` +
          `source: ${url}\n` +
          `captured_at: ${captured}\n` +
          (byline ? `byline: ${byline}\n` : "") +
          `mode: ${mode}\n` +
          `---\n\n` +
          `# ${title}\n\n` +
          body +
          `\n`;
        return { ok: true, md, title };
      },
    });

    const result = results && results[0] && results[0].result;
    if (!result) {
      throw new Error("No result returned from page.");
    }
    if (!result.ok) {
      throw new Error(result.error || "Extraction failed.");
    }

    // Site-rule markdown post-processing. The extracted markdown comes
    // back from the page; the popup runs heading-section removal and
    // generic LinkedIn-flavoured strips that are easier to express on
    // markdown than DOM. See ADR-0002.
    let md = result.md;
    for (const heading of removeSectionsByHeading) {
      md = removeMarkdownSection(md, heading);
    }
    if (siteRule && siteRule.name === "LinkedIn") {
      md = stripLinkedInMetadataLines(md);
    }
    md = collapseDuplicateLines(md);

    output.value = md;
    lastTitle = result.title;
    copyBtn.disabled = false;
    downloadBtn.disabled = false;
    setStatus(`Extracted ${md.length.toLocaleString()} chars.`, "success");
  } catch (err) {
    setStatus(err.message || String(err), "error");
  } finally {
    extractBtn.disabled = false;
  }
});

function flashButton(btn, msg, ms = 1500) {
  const original = btn.textContent;
  btn.textContent = msg;
  btn.disabled = true;
  setTimeout(() => {
    btn.textContent = original;
    btn.disabled = false;
  }, ms);
}

// Remove a whole `## Heading` section from the markdown (case-insensitive
// match on the heading text). Everything from the matched H2 line up to —
// but not including — the next H1 or H2 line is dropped. If the matched
// heading is the last section, the rest of the document is dropped.
//
// Used by site rules that need to delete a section we cannot reliably
// target with a CSS selector (LinkedIn's Activity / Interests, etc.).
function removeMarkdownSection(md, heading) {
  const parts = md.split(/(?=^##?\s)/m);
  const keep = parts.filter((part) => {
    const firstLine = part.split("\n", 1)[0];
    const match = firstLine.match(/^##\s+(.+?)\s*$/);
    if (!match) return true; // not a section start, keep as preamble
    return match[1].toLowerCase() !== heading.toLowerCase();
  });
  return keep.join("").replace(/\n{3,}/g, "\n\n").trim() + "\n";
}

// LinkedIn-specific noise patterns easier to strip at the markdown
// level than to identify with CSS selectors:
//   - "3,002 followers" / "1 follower" — follower count lines
//   - "500+ connections" / "12 connections" — connection count lines
//   - Standalone mutual-connections links that survive selector removal
function stripLinkedInMetadataLines(md) {
  return md
    .split("\n")
    .filter((line) => {
      const t = line.trim();
      if (/^[\d,]+\s+followers?$/i.test(t)) return false;
      if (/^[\d,]+\+?\s+connections?$/i.test(t)) return false;
      if (/^\[.*mutual connections?\]\(.*\)$/i.test(t)) return false;
      return true;
    })
    .join("\n");
}

// Collapse identical consecutive non-blank lines into one, ignoring
// blank lines between them. Handles cases like duplicate "Message Peter"
// links that v0.7.0's strict-adjacent collapse missed because of a blank
// line between them.
function collapseDuplicateLines(md) {
  const out = [];
  let prevNonBlank = null;
  for (const line of md.split("\n")) {
    if (line.trim() && line === prevNonBlank) continue;
    out.push(line);
    if (line.trim()) prevNonBlank = line;
  }
  return out.join("\n").replace(/\n{3,}/g, "\n\n").trim() + "\n";
}

copyBtn.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(output.value);
    flashButton(copyBtn, "Copied!");
    setStatus("Copied to clipboard.", "success");
  } catch (err) {
    setStatus("Copy failed: " + (err.message || err), "error");
  }
});

downloadBtn.addEventListener("click", () => {
  const blob = new Blob([output.value], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${slugify(lastTitle)}.md`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  flashButton(downloadBtn, "Saved!");
  setStatus("Download started.", "success");
});
