# EmbaBrain capture — Privacy policy

_Last updated: 2026-06-29_

EmbaBrain capture is a browser extension that converts the current
web page into readable markdown for the user. This policy describes
exactly what data the extension does and does not handle.

## What the extension does

When you click the extension icon and press **Extract page**, the
extension:

1. Reads the rendered content of the page in your current tab.
2. Runs the bundled Readability and Turndown libraries to convert
   that content to markdown.
3. Displays the markdown in the popup so you can copy it or download
   it as a `.md` file.

All of this happens locally in your browser. The page content is
read only at the moment of the click, only from the tab you are
currently viewing, and only for as long as it takes to produce the
markdown output.

## What we collect

**Nothing.** The extension does not collect, transmit, store, or
share any of the following:

- The content of pages you capture
- Your browsing history or web activity
- Your IP address, location, or any other identifying information
- Any personal data, authentication credentials, or financial data

The extension makes no network requests. It does not communicate
with any server, including EmbaBrain's own servers.

## What is stored locally

The extension stores the following on your own device only, using
the browser's `chrome.storage.local` API:

- Your customization rules (site URL patterns and CSS selectors you
  add via the Options page)

This data is scoped to the extension and to your browser profile on
this device. It never leaves your device. You can export it as JSON
from the Options page, and you can clear it by removing the
extension or by using `chrome://extensions → Details → Storage`.

## Permissions

| Permission | Purpose |
|---|---|
| `activeTab` | Read the current tab's content when you click the icon |
| `scripting` | Inject the bundled libraries into the active tab to convert its content |
| `storage` | Persist your customization rules on your device |

The extension does not request `<all_urls>` or any other broad host
permission. It does not run in the background. It activates only
when you explicitly click the icon.

## Third parties

The extension uses no third-party analytics, no telemetry, no
advertising SDKs, and no remote configuration services. The
Readability.js and Turndown.js libraries are open-source
dependencies bundled into the extension package; neither makes
network calls.

## Changes to this policy

If the extension's data practices change in any future version,
this policy will be updated and the "Last updated" date above will
change. Significant changes will also be noted in the extension's
release notes on the Chrome Web Store.

## Contact

Questions about this policy or the extension can be sent to
**hello@embabrain.com**.
