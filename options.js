const userRulesEl = document.getElementById("user-rules");
const addBtn = document.getElementById("add-rule");
const restoreBtn = document.getElementById("restore-defaults");
const exportBtn = document.getElementById("export-rules");
const importBtn = document.getElementById("import-rules");
const importFile = document.getElementById("import-file");
const form = document.getElementById("rule-form");
const formTitle = document.getElementById("form-title");
const nameInput = document.getElementById("rule-name");
const patternInput = document.getElementById("rule-pattern");
const selectorsInput = document.getElementById("rule-selectors");
const headingsInput = document.getElementById("rule-headings");
const cancelBtn = document.getElementById("cancel");
const status = document.getElementById("status");

let editingIndex = null;

function setStatus(msg, kind) {
  status.textContent = msg;
  status.className = kind || "";
  if (msg) {
    setTimeout(() => {
      if (status.textContent === msg) {
        status.textContent = "";
        status.className = "";
      }
    }, 4000);
  }
}

function lines(textareaValue) {
  return textareaValue
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[c]);
}

async function renderUserRules() {
  userRulesEl.innerHTML = "";
  const rules = await loadUserRules();
  if (!rules.length) {
    const empty = document.createElement("div");
    empty.className = "empty";
    empty.textContent = "No custom rules yet. Click + Add rule to create one.";
    userRulesEl.appendChild(empty);
    return;
  }
  rules.forEach((rule, i) => {
    const card = document.createElement("div");
    card.className = "rule-card";
    card.innerHTML = `
      <div class="info">
        <div class="name">${escapeHtml(rule.name || "(unnamed)")}</div>
        <div class="meta">
          <code>${escapeHtml(rule.pattern || "")}</code>
          · ${(rule.cleanupSelectors || []).length} selectors
          · ${(rule.removeSectionsByHeading || []).length} section headings
        </div>
      </div>
      <div class="actions">
        <button data-action="edit" data-index="${i}">Edit</button>
        <button data-action="delete" data-index="${i}" class="danger">Delete</button>
      </div>
    `;
    userRulesEl.appendChild(card);
  });
  userRulesEl.querySelectorAll("button[data-action]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const action = btn.dataset.action;
      const i = Number(btn.dataset.index);
      if (action === "edit") openForm(i);
      else if (action === "delete") await deleteRule(i);
    });
  });
}

function openForm(index) {
  editingIndex = index;
  if (index === null) {
    formTitle.textContent = "Add rule";
    nameInput.value = "";
    patternInput.value = "";
    selectorsInput.value = "";
    headingsInput.value = "";
  } else {
    loadUserRules().then((rules) => {
      const rule = rules[index];
      if (!rule) return;
      formTitle.textContent = "Edit rule";
      nameInput.value = rule.name || "";
      patternInput.value = rule.pattern || "";
      selectorsInput.value = (rule.cleanupSelectors || []).join("\n");
      headingsInput.value = (rule.removeSectionsByHeading || []).join("\n");
    });
  }
  form.classList.remove("hidden");
  nameInput.focus();
  form.scrollIntoView({ behavior: "smooth", block: "center" });
}

function closeForm() {
  form.classList.add("hidden");
  editingIndex = null;
}

async function saveFormRule(ev) {
  ev.preventDefault();
  const name = nameInput.value.trim();
  const pattern = patternInput.value.trim();
  const cleanupSelectors = lines(selectorsInput.value);
  const removeSectionsByHeading = lines(headingsInput.value);
  if (!name) {
    setStatus("Name is required.", "error");
    nameInput.focus();
    return;
  }
  if (!pattern) {
    setStatus("URL pattern is required.", "error");
    patternInput.focus();
    return;
  }
  try {
    new RegExp(pattern);
  } catch (err) {
    setStatus(`Invalid URL pattern: ${err.message}`, "error");
    patternInput.focus();
    return;
  }
  const rules = await loadUserRules();
  const newRule = { name, pattern, cleanupSelectors, removeSectionsByHeading };
  if (editingIndex === null) {
    rules.push(newRule);
  } else {
    rules[editingIndex] = newRule;
  }
  await saveUserRules(rules);
  setStatus(editingIndex === null ? "Rule added." : "Rule updated.", "success");
  closeForm();
  await renderUserRules();
}

async function deleteRule(index) {
  const rules = await loadUserRules();
  const rule = rules[index];
  if (!rule) return;
  if (!confirm(`Delete rule "${rule.name}"?`)) return;
  rules.splice(index, 1);
  await saveUserRules(rules);
  setStatus("Rule deleted.", "success");
  await renderUserRules();
}

async function exportRules() {
  const rules = await loadUserRules();
  if (!rules.length) {
    setStatus("No user rules to export.", "error");
    return;
  }
  const blob = new Blob([JSON.stringify(rules, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "embabrain-extension-rules.json";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  setStatus("Exported.", "success");
}

async function importFromFile(file) {
  try {
    const text = await file.text();
    const parsed = JSON.parse(text);
    if (!Array.isArray(parsed)) {
      setStatus("Import file must be a JSON array of rules.", "error");
      return;
    }
    // Basic shape validation. Skip any entries that don't look right.
    const validated = parsed.filter((r) => {
      if (typeof r !== "object" || r === null) return false;
      if (typeof r.name !== "string" || typeof r.pattern !== "string") return false;
      try {
        new RegExp(r.pattern);
      } catch {
        return false;
      }
      return true;
    });
    if (!validated.length) {
      setStatus("No valid rules in file.", "error");
      return;
    }
    const mode = confirm(
      `Found ${validated.length} valid rule(s). ` +
        `Click OK to MERGE with existing user rules, ` +
        `or Cancel to REPLACE them.`
    )
      ? "merge"
      : "replace";
    const existing = mode === "merge" ? await loadUserRules() : [];
    const combined = [
      ...existing,
      ...validated.map((r) => ({
        name: r.name,
        pattern: r.pattern,
        cleanupSelectors: Array.isArray(r.cleanupSelectors)
          ? r.cleanupSelectors
          : [],
        removeSectionsByHeading: Array.isArray(r.removeSectionsByHeading)
          ? r.removeSectionsByHeading
          : [],
      })),
    ];
    await saveUserRules(combined);
    setStatus(
      `Imported ${validated.length} rule(s) (${mode}).`,
      "success"
    );
    await renderUserRules();
  } catch (err) {
    setStatus(`Import failed: ${err.message}`, "error");
  }
}

async function handleRestoreDefaults() {
  const defaults = await loadDefaultRules();
  if (defaults.length === 0) {
    setStatus("No defaults available to restore.", "error");
    return;
  }
  const existing = await loadUserRules();
  const defaultNames = new Set(defaults.map((d) => d.name));
  const willReplace = [
    ...new Set(
      existing.filter((r) => defaultNames.has(r.name)).map((r) => r.name)
    ),
  ];

  let msg = `Restore ${defaults.length} default rule(s) to their shipped versions.`;
  if (willReplace.length > 0) {
    msg += `\n\nThis will REPLACE your existing rule(s): ${willReplace.join(", ")}.`;
    msg += `\nOther rules you've created will not be affected.`;
  }
  msg += `\n\nContinue?`;

  if (!confirm(msg)) return;

  const { restored, replaced } = await restoreDefaults();
  const replacedNote = replaced.length
    ? ` (replaced: ${replaced.join(", ")})`
    : "";
  setStatus(`Restored ${restored} default rule(s)${replacedNote}.`, "success");
  await renderUserRules();
}

addBtn.addEventListener("click", () => openForm(null));
cancelBtn.addEventListener("click", closeForm);
form.addEventListener("submit", saveFormRule);
restoreBtn.addEventListener("click", handleRestoreDefaults);
exportBtn.addEventListener("click", exportRules);
importBtn.addEventListener("click", () => importFile.click());
importFile.addEventListener("change", (ev) => {
  const file = ev.target.files && ev.target.files[0];
  if (file) importFromFile(file);
  importFile.value = "";
});

renderUserRules();
