// Site-specific cleanup rules. The extension has NO hardcoded rules
// after v0.10.0 — all rules live in chrome.storage.local under the
// `userRules` key. The defaults shipped with the extension (currently
// just LinkedIn) live as JSON in the defaults/ directory and are
// seeded into storage on first install by background.js. After
// seeding, defaults look identical to user-added rules — same shape,
// same edit/delete affordances. See ADR-0004.
//
// Rule shape:
//   {
//     name: string,                          // shown in popup tip + frontmatter mode:
//     pattern: string,                       // regex source (JSON-safe)
//     cleanupSelectors: string[],            // CSS selectors removed pre-Turndown
//     removeSectionsByHeading: string[]      // H2 headings removed post-Turndown
//   }
//
// Contract — see ADR-0002, ADR-0003, ADR-0004 for full rationale:
//   - Rules are removal-only. No JS, no DOM manipulation beyond
//     element.remove(), no markdown transforms beyond whole-section
//     removal.
//   - Malformed selectors / patterns are silent no-ops.

const DEFAULT_RULE_FILES = ["defaults/linkedin.json"];

async function loadUserRules() {
  try {
    const stored = await chrome.storage.local.get(["userRules"]);
    return stored.userRules || [];
  } catch {
    return [];
  }
}

async function saveUserRules(rules) {
  await chrome.storage.local.set({ userRules: rules });
}

function hydrateRule(rule) {
  let pattern = null;
  try {
    pattern = new RegExp(rule.pattern);
  } catch {
    return null;
  }
  return {
    name: rule.name || "Custom",
    pattern,
    cleanupSelectors: Array.isArray(rule.cleanupSelectors)
      ? rule.cleanupSelectors
      : [],
    removeSectionsByHeading: Array.isArray(rule.removeSectionsByHeading)
      ? rule.removeSectionsByHeading
      : [],
  };
}

// Returns the merged rule for a URL, combining all matching user rules
// (additive). Returns null if no rule matches. The merged rule uses the
// first matching rule's name.
async function mergedRuleForUrl(url) {
  if (!url) return null;
  const rules = (await loadUserRules())
    .map(hydrateRule)
    .filter((r) => r !== null);
  const matches = rules.filter((r) => r.pattern.test(url));
  if (!matches.length) return null;
  return {
    name: matches[0].name,
    cleanupSelectors: matches.flatMap((r) => r.cleanupSelectors || []),
    removeSectionsByHeading: matches.flatMap(
      (r) => r.removeSectionsByHeading || []
    ),
  };
}

// Fetch the default rule JSON files shipped in the extension binary.
// Returns an array of rule objects (NOT hydrated — pattern is still a
// string at this stage, ready to be saved into storage).
async function loadDefaultRules() {
  const out = [];
  for (const path of DEFAULT_RULE_FILES) {
    try {
      const url = chrome.runtime.getURL(path);
      const response = await fetch(url);
      if (!response.ok) continue;
      const rule = await response.json();
      out.push(rule);
    } catch {
      // Ignore broken default files — the extension still works.
    }
  }
  return out;
}

// Seed defaults into storage if and only if userRules is currently
// empty. Used on first install. After the user has any rules at all
// (even after deleting all of them and adding their own), we do NOT
// auto-restore — that's what the "Restore defaults" button is for.
async function seedDefaultsOnFreshInstall() {
  const existing = await loadUserRules();
  if (existing.length > 0) return;
  const defaults = await loadDefaultRules();
  if (defaults.length === 0) return;
  await saveUserRules(defaults);
}

// Restore defaults: re-apply the shipped defaults using upsert-by-name.
// Any existing user rule whose name matches a default's name is REPLACED
// by the default. Existing user rules with other names (custom sites the
// user added themselves) are left alone. This avoids duplicate rules
// when the user clicks "Restore defaults" multiple times.
//
// Returns:
//   restored:  number of default rules applied
//   replaced:  names of existing user rules that were overwritten
async function restoreDefaults() {
  const defaults = await loadDefaultRules();
  if (defaults.length === 0) return { restored: 0, replaced: [] };
  const existing = await loadUserRules();
  const defaultNames = new Set(defaults.map((d) => d.name));
  const replaced = [
    ...new Set(
      existing.filter((r) => defaultNames.has(r.name)).map((r) => r.name)
    ),
  ];
  const keptUserRules = existing.filter((r) => !defaultNames.has(r.name));
  const combined = [...keptUserRules, ...defaults];
  await saveUserRules(combined);
  return { restored: defaults.length, replaced };
}
