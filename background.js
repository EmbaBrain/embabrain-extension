// Background service worker.
//
// Runs only when needed (Manifest V3 service workers are event-driven).
// Its single job: seed the default rules into storage on first install
// of the extension. After that, all rules are managed by the user via
// the Options UI. See ADR-0004.

importScripts("site-rules.js");

chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === "install") {
    // Fresh install — populate userRules with the shipped defaults.
    // Updates and reloads do NOT auto-add defaults; that's what the
    // "Restore defaults" button in the Options UI is for.
    await seedDefaultsOnFreshInstall();
  }
});
