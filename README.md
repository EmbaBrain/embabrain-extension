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

EmbaBrain capture turns the page you're reading into a structured
markdown document — title, headings, content, all intact — without
copy-paste gymnastics. Built for the people doing BD research,
saving article reads, or building reference notes from public sources.

The extension never sends anything to a server. Everything happens
inside your browser.

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

**For known sites** like LinkedIn profiles, the extension uses a
different path tuned to the site's structure. It captures the full
page, then applies a set of cleanup rules — removing top navigation,
sidebars, feed widgets, promoted content. The result is much richer
than Readability would produce on a profile page, with the same
low-noise quality.

A small **Verbose** checkbox in the popup gives you a raw escape
hatch when needed.

---

## Customize for any site

Every cleanup rule is editable, and you can add your own rules for
sites you visit often.

Open the Options page (**⚙ Manage rules** at the bottom of the popup,
or `chrome://extensions → EmbaBrain capture → Extension options`) to:

- See and edit the default LinkedIn rule
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
