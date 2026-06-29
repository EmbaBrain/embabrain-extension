<p align="center">
  <img src="icons/icon128.png" alt="EmbaBrain capture" width="80" height="80">
</p>

<h1 align="center">EmbaBrain capture</h1>

<p align="center">
  <strong>Save any web page as clean, readable markdown. One click.</strong>
</p>

<p align="center">
  <a href="#install">Install</a> ·
  <a href="#how-it-works">How it works</a> ·
  <a href="#customize-for-any-site">Customize</a> ·
  <a href="#privacy">Privacy</a>
</p>

---

EmbaBrain capture turns the page you're reading into clean,
readable markdown with one click — and stays out of the way.

**Fully local.** No network calls, no telemetry, no analytics, no
account, no upsell. Page content never leaves your browser.

**Tuned for the hard pages.** Generic "page to markdown" tools
struggle with profile pages and modern single-page apps —
sidebars, feed widgets, video players, and promoted content all
leak into the output. EmbaBrain capture supports curated cleanup
rules so the result is readable prose rather than UI chrome.
Article-style pages use Mozilla Readability for clean
main-content extraction.

**Yours to extend.** Every cleanup rule is editable, and you can
add your own rules for sites you visit often. A built-in help
section walks you through writing them — no CSS-selector
experience required.

---

## Install

**From the Chrome Web Store** (recommended):
→ _coming soon — store URL appears here after approval_

Works in Chrome, Edge, Brave, Arc, and other Chromium-based browsers
unchanged.

**Or install manually:**

1. Download the latest `embabrain-extension-v*.zip` from the
   [Releases page](../../releases)
2. Unzip it
3. Open `chrome://extensions/`
4. Toggle **Developer mode** on (top-right)
5. Click **Load unpacked** and select the unzipped folder

The brain icon appears in your toolbar. Pin it for quick access.

---

## How it works

Click the brain icon → click **Extract page** → the popup shows
the page as markdown. Copy it to your clipboard or download it as
a `.md` file with one click.

The captured markdown includes a YAML frontmatter block with the
source URL, the capture timestamp, and which extraction mode
produced the file. Ready to drop into Obsidian, Notion, or any
markdown-aware tool.

### Two extraction paths

**For articles and blog posts**, the extension uses
[Mozilla Readability](https://github.com/mozilla/readability) (the
engine behind Firefox's Reader View) to identify the main content
and strip away navigation, sidebars, ads, and other chrome.

**For sites with cleanup rules**, the extension uses a different
path tuned to the site's structure. It captures the full page, then
applies that site's cleanup rules — removing top navigation,
sidebars, feed widgets, promoted content. The result is much richer
than Readability would produce on a profile-style page, with the
same low-noise quality.

Default rules ship with the extension and additional rules can be
added by the user. See **Customize for any site** below.

A small **Verbose** checkbox in the popup gives you a raw escape
hatch when needed.

---

## Customize for any site

Every cleanup rule is editable, and you can add your own rules for
sites you visit often.

Open the Options page (**⚙ Manage rules** at the bottom of the popup,
or `chrome://extensions → EmbaBrain capture → Extension options`) to:

- See and edit the rules that shipped with the extension
- Add rules for any site you want cleaner captures on
- Delete rules you don't want
- Export your rules as JSON for backup or sharing
- Import rules from a JSON file

The Options page includes a **How to write rules** help section with
worked examples. You don't need to know CSS selectors going in — the
help walks you through finding them by right-clicking on a noisy page
element and choosing Inspect.

Rules are **removal-only** by design. They cannot add content, click
buttons, scroll the page, or do anything other than remove specific
elements you don't want in your captures. This keeps the extension
predictable and safe.

---

## Privacy

Zero data collection. Zero network calls.

The extension reads page content only when you explicitly click
Extract, and only of the page you are currently viewing. Your
customization rules are stored locally in your browser's storage
and never transmitted anywhere.

Full [privacy policy](PRIVACY.md).

### Permissions

| Permission | What it does |
|---|---|
| `activeTab` | Read the current tab's content when you click the icon — required to capture anything |
| `scripting` | Inject the bundled Readability + Turndown libraries into the active tab |
| `storage` | Save your customization rules locally on your device |

The extension does not request `<all_urls>` or any other broad host
permission. It runs only when you click the icon.

---

## Part of EmbaBrain

EmbaBrain capture is the companion tool for
**[EmbaBrain](https://embabrain.com)** — an AI-powered business
development brain for technical founders, startup teams, and BD
professionals. EmbaBrain's vault stores your company's knowledge:
contacts, conversations, pipeline, notes. The AI reads from the
vault to help you draft outreach, update the pipeline, and remember
context across conversations.

This extension is how you **feed the vault**. Read a useful page —
a prospect bio, a market analysis, a conference write-up — click
the brain icon, and you have clean markdown ready to drop into
your EmbaBrain vault.

You don't need an EmbaBrain account to use this extension; it
works fully on its own. But if you're building your company's BD
brain, that's what we built EmbaBrain for. Learn more at
[embabrain.com](https://embabrain.com).

---

## License

[Mozilla Public License 2.0](LICENSE). The bundled
`vendor/Readability.js` is also MPL 2.0 (by Mozilla), and
`vendor/turndown.js` is MIT — both compatible with the extension's
overall MPL 2.0 license.

---

<p align="center">
  EmbaBrain capture is part of <a href="https://embabrain.com"><strong>EmbaBrain</strong></a> —<br>
  your company's business developer brain.
</p>

<p align="center">
  <em>Less guessing. More closing.</em>
</p>
