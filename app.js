/**
 * ============================================================
 * BIOGAS PLANT CALCULATOR — Application Engine
 * ============================================================
 *
 * This file handles all rendering, interaction, and calculation.
 * You should NOT need to edit this file to change content —
 * edit content.js instead.
 * ============================================================
 */

/* ============================================================
   Initialisation
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {
  // KaTeX may still be loading asynchronously; wait for it
  waitForKaTeX(() => {
    buildApp();
    buildConverter();
  });
});

/**
 * Poll until KaTeX is available (loaded from CDN), then call callback.
 * Gives up after 5 seconds and renders without KaTeX as a fallback.
 */
function waitForKaTeX(callback, attempts = 0) {
  if (typeof katex !== "undefined") {
    callback();
  } else if (attempts < 50) {
    setTimeout(() => waitForKaTeX(callback, attempts + 1), 100);
  } else {
    console.warn("KaTeX did not load; formulas will display as plain text.");
    callback();
  }
}

/* ============================================================
   App Build
   ============================================================ */

function buildApp() {
  const navEl      = document.getElementById("tab-nav");
  const contentEl  = document.getElementById("tab-content");
  const { tabs }   = BIOGAS_CONTENT;

  tabs.forEach((tab, tabIndex) => {
    // --- Build tab button ---
    const btn = document.createElement("button");
    btn.textContent        = tab.title;
    btn.setAttribute("role", "tab");
    btn.setAttribute("aria-controls", `panel-${tab.id}`);
    btn.setAttribute("aria-selected", tabIndex === 0 ? "true" : "false");
    btn.setAttribute("id", `tab-${tab.id}`);
    btn.addEventListener("click", () => activateTab(tab.id, tabs));
    navEl.appendChild(btn);

    // --- Build tab panel ---
    const panel = document.createElement("section");
    panel.setAttribute("role", "tabpanel");
    panel.setAttribute("id", `panel-${tab.id}`);
    panel.setAttribute("aria-labelledby", `tab-${tab.id}`);
    panel.classList.add("tab-panel");
    if (tabIndex !== 0) panel.hidden = true;

    // Tab intro
    if (tab.intro) {
      const introDiv = document.createElement("div");
      introDiv.classList.add("tab-intro");
      introDiv.innerHTML = paragraphs(tab.intro);
      panel.appendChild(introDiv);
    }

    // Equations — detect groups (have their own equations sub-array) vs standalone
    tab.equations.forEach(item => {
      panel.appendChild(
        item.equations ? buildGroupCard(item) : buildEquationCard(item)
      );
    });

    contentEl.appendChild(panel);
  });
}

/* ============================================================
   Tab Switching
   ============================================================ */

function activateTab(activeId, tabs) {
  tabs.forEach(tab => {
    const btn   = document.getElementById(`tab-${tab.id}`);
    const panel = document.getElementById(`panel-${tab.id}`);
    const isActive = tab.id === activeId;
    btn.setAttribute("aria-selected", isActive ? "true" : "false");
    panel.hidden = !isActive;
  });
}

/* ============================================================
   Equation Card Builder
   ============================================================ */

function buildEquationCard(eq) {
  const card = document.createElement("article");
  card.classList.add("equation-card");
  card.setAttribute("id", `eq-${eq.id}`);

  // --- Card header ---
  const header = document.createElement("div");
  header.classList.add("equation-header");
  header.innerHTML = `<h2>${escapeHtml(eq.title)}</h2>`;
  card.appendChild(header);

  // --- Card body ---
  const body = document.createElement("div");
  body.classList.add("equation-body");

  // Intro text
  if (eq.intro) {
    const introEl = document.createElement("p");
    introEl.classList.add("equation-intro");
    introEl.innerHTML = paragraphs(eq.intro);
    body.appendChild(introEl);
  }

  // Abstract formula display (KaTeX)
  const formulaWrap = document.createElement("div");
  formulaWrap.classList.add("formula-display");
  const formulaLabel = document.createElement("div");
  formulaLabel.classList.add("formula-label");
  formulaLabel.textContent = "Formel";
  const formulaTarget = document.createElement("div");
  formulaTarget.setAttribute("id", `formula-abstract-${eq.id}`);
  renderKaTeX(eq.formula_latex, formulaTarget);
  formulaWrap.appendChild(formulaLabel);
  formulaWrap.appendChild(formulaTarget);
  body.appendChild(formulaWrap);

  // Parameter inputs
  const grid = document.createElement("div");
  grid.classList.add("parameters-grid");
  eq.parameters.forEach(param => {
    grid.appendChild(buildParamField(param, eq));
  });
  body.appendChild(grid);

  // Result section (hidden until all inputs valid)
  const resultSection = document.createElement("div");
  resultSection.classList.add("result-section");
  resultSection.setAttribute("id", `result-section-${eq.id}`);
  resultSection.hidden = true;
  resultSection.innerHTML = buildResultHTML(eq);
  body.appendChild(resultSection);

  card.appendChild(body);
  return card;
}

/* ============================================================
   Group Card Builder
   ============================================================ */

/**
 * Build a card for a group item — one set of shared inputs at the top,
 * then each sub-equation's formula + result stacked below.
 */
function buildGroupCard(group) {
  const card = document.createElement("article");
  card.classList.add("equation-card");
  card.setAttribute("id", `eq-${group.id}`);

  // --- Card header ---
  const header = document.createElement("div");
  header.classList.add("equation-header");
  header.innerHTML = `<h2>${escapeHtml(group.title)}</h2>`;
  card.appendChild(header);

  // --- Card body ---
  const body = document.createElement("div");
  body.classList.add("equation-body");

  // Group intro
  if (group.intro) {
    const introEl = document.createElement("p");
    introEl.classList.add("equation-intro");
    introEl.innerHTML = paragraphs(group.intro);
    body.appendChild(introEl);
  }

  // Shared parameter inputs (only if group has shared parameters)
  if (group.parameters && group.parameters.length > 0) {
    const inputsWrap = document.createElement("div");
    inputsWrap.classList.add("group-inputs");
    const grid = document.createElement("div");
    grid.classList.add("parameters-grid");
    group.parameters.forEach(param => {
      grid.appendChild(buildParamField(param, group, () => updateGroup(group)));
    });
    inputsWrap.appendChild(grid);
    body.appendChild(inputsWrap);
  }

  // Sub-equations — stacked, separated by dashed dividers
  group.equations.forEach((sub, idx) => {
    if (idx > 0) {
      const divider = document.createElement("div");
      divider.classList.add("sub-divider");
      body.appendChild(divider);
    }

    const subEl = document.createElement("div");
    subEl.classList.add("sub-equation");
    subEl.setAttribute("id", `sub-${sub.id}`);

    // Sub-equation title
    const titleEl = document.createElement("h3");
    titleEl.classList.add("sub-equation-title");
    titleEl.textContent = sub.title;
    subEl.appendChild(titleEl);

    // Sub-equation intro
    if (sub.intro) {
      const subIntro = document.createElement("p");
      subIntro.classList.add("equation-intro");
      subIntro.innerHTML = paragraphs(sub.intro);
      subEl.appendChild(subIntro);
    }

    // Sub-equation own parameters (if any)
    if (sub.parameters && sub.parameters.length > 0) {
      const subGrid = document.createElement("div");
      subGrid.classList.add("parameters-grid");
      sub.parameters.forEach(param => {
        subGrid.appendChild(buildParamField(param, sub, () => updateGroup(group)));
      });
      subEl.appendChild(subGrid);
    }

    // Formula display (KaTeX)
    const formulaWrap = document.createElement("div");
    formulaWrap.classList.add("formula-display");
    const formulaLabel = document.createElement("div");
    formulaLabel.classList.add("formula-label");
    formulaLabel.textContent = "Formel";
    const formulaTarget = document.createElement("div");
    formulaTarget.setAttribute("id", `formula-abstract-${sub.id}`);
    renderKaTeX(sub.formula_latex, formulaTarget);
    formulaWrap.appendChild(formulaLabel);
    formulaWrap.appendChild(formulaTarget);
    subEl.appendChild(formulaWrap);

    // Result area (initially hidden)
    const resultSection = document.createElement("div");
    resultSection.classList.add("result-section");
    resultSection.setAttribute("id", `result-section-${sub.id}`);
    resultSection.hidden = true;
    resultSection.innerHTML = buildResultHTML(sub);
    subEl.appendChild(resultSection);

    body.appendChild(subEl);
  });

  card.appendChild(body);
  return card;
}

/* ============================================================
   Group Update (calculation + display for all sub-equations)
   ============================================================ */

function updateGroup(group) {
  // --- Step 1: collect and validate shared group parameters ---
  const sharedPool = {};
  let sharedValid = true;

  if (group.parameters && group.parameters.length > 0) {
    group.parameters.forEach(param => {
      const input = document.getElementById(`input-${group.id}-${param.id}`);
      const raw   = input.value.trim();
      const val   = parseFloat(raw);

      if (raw === "" || isNaN(val) || (param.min !== undefined && val < param.min)) {
        sharedValid = false;
        input.classList.toggle("invalid", raw !== "");
      } else {
        input.classList.remove("invalid");
        sharedPool[param.id] = val;
      }
    });
  }

  // If any shared input is missing/invalid, hide all sub-results and stop
  if (!sharedValid) {
    group.equations.forEach(sub => {
      document.getElementById(`result-section-${sub.id}`).hidden = true;
    });
    return;
  }

  // --- Step 2: compute sub-equations, each with their own parameter pool ---
  group.equations.forEach(sub => {
    const valuePool = { ...sharedPool };
    let subValid = true;

    // Collect sub-equation-specific parameters (namespaced to sub.id)
    if (sub.parameters && sub.parameters.length > 0) {
      sub.parameters.forEach(param => {
        const input = document.getElementById(`input-${sub.id}-${param.id}`);
        const raw   = input.value.trim();
        const val   = parseFloat(raw);

        if (raw === "" || isNaN(val) || (param.min !== undefined && val < param.min)) {
          subValid = false;
          input.classList.toggle("invalid", raw !== "");
        } else {
          input.classList.remove("invalid");
          valuePool[param.id] = val;
        }
      });
    }

    const resultSection = document.getElementById(`result-section-${sub.id}`);

    if (!subValid) {
      resultSection.hidden = true;
      return;
    }

    const result = safeCalculate(sub.formula_calc, valuePool);

    if (result === null || !isFinite(result)) {
      resultSection.hidden = true;
      return;
    }

    const decimals  = sub.result_decimals !== undefined ? sub.result_decimals : 2;
    const formatted = result.toFixed(decimals);

    // Show result area
    resultSection.hidden = false;
    document.getElementById(`result-value-${sub.id}`).textContent = formatted;
    document.getElementById(`formula-filled-${sub.id}`).textContent =
      fillTemplate(sub.formula_filled, valuePool);
    updateRangeIndicator(sub, result);

    // Inject result into shared pool so subsequent sub-equations can use it
    sharedPool[sub.result_symbol] = result;
  });
}

/* ============================================================
   Parameter Field Builder
   ============================================================ */

function buildParamField(param, eq, updateCallback) {
  const field = document.createElement("div");
  field.classList.add("param-field");

  const label = document.createElement("label");
  label.classList.add("param-label");
  label.setAttribute("for", `input-${eq.id}-${param.id}`);

  const nameSpan = document.createElement("span");
  nameSpan.textContent = param.name;

  const unitSpan = document.createElement("span");
  unitSpan.classList.add("param-unit");
  unitSpan.textContent = param.unit;

  label.appendChild(nameSpan);
  label.appendChild(unitSpan);

  const input = document.createElement("input");
  input.setAttribute("type", "number");
  input.setAttribute("id", `input-${eq.id}-${param.id}`);
  input.setAttribute("data-param", param.id);
  input.setAttribute("data-eq", eq.id);
  input.setAttribute("step", param.step !== undefined ? param.step : "any");
  if (param.placeholder !== undefined) input.placeholder = param.placeholder;
  if (param.min !== undefined)         input.setAttribute("min", param.min);
  if (param.decimals !== undefined) {
    input.addEventListener("blur", () => {
      const val = parseFloat(input.value);
      if (!isNaN(val)) input.value = val.toFixed(param.decimals);
    });
  }

  const desc = document.createElement("span");
  desc.classList.add("param-desc");
  desc.innerHTML = param.description;

  input.addEventListener("input", updateCallback || (() => updateEquation(eq)));

  field.appendChild(label);
  field.appendChild(input);
  field.appendChild(desc);
  return field;
}

/* ============================================================
   Result Section HTML Template
   ============================================================ */

function buildResultHTML(eq) {
  return `
    <hr class="result-divider">
    <div class="formula-filled-display" id="formula-filled-${eq.id}"></div>
    <div class="result-box">
      <span class="result-label">${escapeHtml(eq.result_symbol)} =</span>
      <span class="result-value" id="result-value-${eq.id}">—</span>
      <span class="result-unit">${escapeHtml(eq.result_unit)}</span>
    </div>
    <div class="range-indicator" id="range-indicator-${eq.id}" hidden></div>
    ${eq.educational_text ? `
    <div class="educational-text" id="edu-text-${eq.id}">
      <div class="educational-text-label">📖 Fördjupning</div>
      ${paragraphs(eq.educational_text)}
    </div>` : ''}
  `;
}

/* ============================================================
   Calculation & Update
   ============================================================ */

function updateEquation(eq) {
  const paramValues = {};
  let allValid = true;

  eq.parameters.forEach(param => {
    const input = document.getElementById(`input-${eq.id}-${param.id}`);
    const raw   = input.value.trim();
    const val   = parseFloat(raw);

    if (raw === "" || isNaN(val) || (param.min !== undefined && val < param.min)) {
      allValid = false;
      input.classList.toggle("invalid", raw !== ""); // only mark invalid if user typed something
    } else {
      input.classList.remove("invalid");
      paramValues[param.id] = val;
    }
  });

  const resultSection = document.getElementById(`result-section-${eq.id}`);
  resultSection.hidden = !allValid;

  if (!allValid) return;

  // Calculate result
  const result = safeCalculate(eq.formula_calc, paramValues);
  if (result === null || !isFinite(result)) {
    resultSection.hidden = true;
    return;
  }

  const decimals = eq.result_decimals !== undefined ? eq.result_decimals : 2;
  const formatted = result.toFixed(decimals);

  // Update result value
  document.getElementById(`result-value-${eq.id}`).textContent = formatted;

  // Update filled formula
  document.getElementById(`formula-filled-${eq.id}`).textContent =
    fillTemplate(eq.formula_filled, paramValues);

  // Update range indicator
  updateRangeIndicator(eq, result);
}

/* ============================================================
   Safe Formula Evaluation
   ============================================================ */

/**
 * Evaluates a formula string using only the provided parameter values.
 * Uses the Function constructor rather than eval(), which is slightly
 * safer since it runs in global scope rather than local scope, but
 * content.js formulas should still only use arithmetic and Math methods.
 *
 * Allowed in formula_calc: +, -, *, /, (, ), **, Math.pow, Math.log10, numbers
 */
function safeCalculate(formula, params) {
  try {
    const paramNames  = Object.keys(params);
    const paramValues = paramNames.map(k => params[k]);
    // eslint-disable-next-line no-new-func
    const fn = new Function(...paramNames, `"use strict"; return (${formula});`);
    return fn(...paramValues);
  } catch (e) {
    console.error("Formula evaluation error:", e.message, "| formula:", formula);
    return null;
  }
}

/* ============================================================
   Template Substitution for formula_filled
   ============================================================ */

function fillTemplate(template, params) {
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    if (params[key] !== undefined) {
      // Format substituted values sensibly
      const val = params[key];
      return Number.isInteger(val) ? val : parseFloat(val.toFixed(4));
    }
    return match;
  });
}

/* ============================================================
   Typical Range Indicator
   ============================================================ */

function updateRangeIndicator(eq, result) {
  const el = document.getElementById(`range-indicator-${eq.id}`);

  if (!eq.typical_range) {
    el.hidden = true;
    return;
  }

  const { min, max, unit, low_text, normal_text, high_text } = eq.typical_range;
  el.hidden = false;
  el.classList.remove("range-low", "range-ok", "range-high");

  let cls, label, text;

  if (result < min) {
    cls   = "range-low";
    label = "Värdet är lågt";
    text  = low_text;
  } else if (result > max) {
    cls   = "range-high";
    label = "Värdet är högt";
    text  = high_text;
  } else {
    cls   = "range-ok";
    label = "Inom typiskt intervall";
    text  = normal_text;
  }

  const rangeHint = result < min
    ? `< ${min} ${escapeHtml(unit)}`
    : result > max
      ? `> ${max} ${escapeHtml(unit)}`
      : `${min}–${max} ${escapeHtml(unit)}`;

  el.classList.add(cls);
  el.innerHTML = `<span class="range-label">${label}
    (${rangeHint}):</span> ${escapeHtml(text)}`;
}

/* ============================================================
   KaTeX Rendering
   ============================================================ */

function renderKaTeX(latexStr, targetEl) {
  if (typeof katex !== "undefined") {
    try {
      katex.render(latexStr, targetEl, {
        throwOnError:    false,
        displayMode:     true,
        output:          "html"
      });
      return;
    } catch (e) {
      // Fall through to plain text fallback
    }
  }
  // Fallback: plain text
  targetEl.textContent = latexStr;
}

/* ============================================================
   Utility helpers
   ============================================================ */

/** Wrap newline-separated text blocks in <p> tags. */
function paragraphs(text) {
  if (!text) return "";
  return text
    .split(/\n\s*\n/)
    .map(block => block.trim())
    .filter(Boolean)
    .map(block => `<p>${block.replace(/\n/g, " ")}</p>`)
    .join("\n");
}

/** Escape HTML special characters to prevent XSS. */
function escapeHtml(str) {
  if (typeof str !== "string") return String(str ?? "");
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/* ============================================================
   Unit Converter
   ============================================================ */

/**
 * Unit groups with to/from base conversion functions.
 * Base unit for each group: g/L, kg, L, °C respectively.
 * Temperature uses offset formulas; all others use multipliers.
 */
const UNIT_GROUPS = [
  { id: "concentration", label: "Concentration", units: [
    { id: "g_L",   label: "g/L",   toBase: v => v,        fromBase: v => v        },
    { id: "kg_m3", label: "kg/m³", toBase: v => v,        fromBase: v => v        },
    { id: "mg_L",  label: "mg/L",  toBase: v => v / 1000, fromBase: v => v * 1000 },
    { id: "g_m3",  label: "g/m³",  toBase: v => v / 1000, fromBase: v => v * 1000 },
  ]},
  { id: "mass", label: "Mass", units: [
    { id: "mg",  label: "mg",  toBase: v => v / 1e6,  fromBase: v => v * 1e6  },
    { id: "g",   label: "g",   toBase: v => v / 1000, fromBase: v => v * 1000 },
    { id: "kg",  label: "kg",  toBase: v => v,        fromBase: v => v        },
    { id: "t",   label: "t",   toBase: v => v * 1000, fromBase: v => v / 1000 },
  ]},
  { id: "volume", label: "Volume", units: [
    { id: "mL",  label: "mL",  toBase: v => v / 1000, fromBase: v => v * 1000 },
    { id: "L",   label: "L",   toBase: v => v,        fromBase: v => v        },
    { id: "m3",  label: "m³",  toBase: v => v * 1000, fromBase: v => v / 1000 },
  ]},
  { id: "temperature", label: "Temperature", units: [
    { id: "C",  label: "°C", toBase: v => v,             fromBase: v => v             },
    { id: "K",  label: "K",  toBase: v => v - 273.15,    fromBase: v => v + 273.15    },
    { id: "F",  label: "°F", toBase: v => (v - 32) * 5/9, fromBase: v => v * 9/5 + 32 },
  ]},
];

/** Find the group and unit object for a given unit id. */
function findUnit(unitId) {
  for (const group of UNIT_GROUPS) {
    const unit = group.units.find(u => u.id === unitId);
    if (unit) return { group, unit };
  }
  return null;
}

/** Populate a <select> element with optgroups from UNIT_GROUPS. */
function populateUnitSelect(selectEl, selectedId) {
  selectEl.innerHTML = "";
  for (const group of UNIT_GROUPS) {
    const optgroup = document.createElement("optgroup");
    optgroup.label = group.label;
    for (const unit of group.units) {
      const opt = document.createElement("option");
      opt.value       = unit.id;
      opt.textContent = unit.label;
      if (unit.id === selectedId) opt.selected = true;
      optgroup.appendChild(opt);
    }
    selectEl.appendChild(optgroup);
  }
}

/**
 * Repopulate the to-unit <select> with only units in the same group
 * as the currently selected from-unit, excluding the from-unit itself.
 */
function filterToUnits(fromUnitId) {
  const toSelect = document.getElementById("conv-to-unit");
  const match    = findUnit(fromUnitId);
  if (!match) return;

  const { group }       = match;
  const currentToId     = toSelect.value;
  const compatibleUnits = group.units.filter(u => u.id !== fromUnitId);

  toSelect.innerHTML = "";
  compatibleUnits.forEach(unit => {
    const opt       = document.createElement("option");
    opt.value       = unit.id;
    opt.textContent = unit.label;
    // Keep the current selection if it's still compatible
    if (unit.id === currentToId) opt.selected = true;
    toSelect.appendChild(opt);
  });
}

/** Run the conversion and update the output field. */
function updateConverter() {
  const fromInput  = document.getElementById("conv-from-value");
  const toInput    = document.getElementById("conv-to-value");
  const fromUnitId = document.getElementById("conv-from-unit").value;
  const toUnitId   = document.getElementById("conv-to-unit").value;

  const raw = fromInput.value.trim();
  if (raw === "" || isNaN(parseFloat(raw))) {
    toInput.value = "";
    return;
  }

  const inputVal  = parseFloat(raw);
  const fromMatch = findUnit(fromUnitId);
  const toMatch   = findUnit(toUnitId);

  if (!fromMatch || !toMatch) { toInput.value = ""; return; }

  const baseVal   = fromMatch.unit.toBase(inputVal);
  const result    = toMatch.unit.fromBase(baseVal);

  // Choose decimal places: avoid unnecessary precision for large numbers
  const decimals  = Math.abs(result) >= 1000 ? 2
                  : Math.abs(result) >= 1     ? 4
                  :                             6;
  toInput.value   = parseFloat(result.toFixed(decimals));
}

/** Build and wire up the unit converter popup. */
function buildConverter() {
  const toggle    = document.getElementById("converter-toggle");
  const panel     = document.getElementById("converter-panel");
  const closeBtn  = document.querySelector(".converter-close");
  const fromSel   = document.getElementById("conv-from-unit");
  const toSel     = document.getElementById("conv-to-unit");
  const fromInput = document.getElementById("conv-from-value");

  // Populate from-unit with all units; default to mg/L
  populateUnitSelect(fromSel, "mg_L");

  // Populate to-unit with compatible units; default to g/L
  filterToUnits("mg_L");
  // Select g/L as the default to-unit
  Array.from(toSel.options).forEach(opt => {
    opt.selected = opt.value === "g_L";
  });

  // Toggle panel open/close
  function openPanel() {
    panel.hidden = false;
    toggle.setAttribute("aria-expanded", "true");
    fromInput.focus();
  }
  function closePanel() {
    panel.hidden = true;
    toggle.setAttribute("aria-expanded", "false");
  }

  toggle.addEventListener("click", e => {
    e.stopPropagation();
    panel.hidden ? openPanel() : closePanel();
  });

  closeBtn.addEventListener("click", closePanel);

  // Close when clicking outside
  document.addEventListener("click", e => {
    if (!panel.hidden && !panel.contains(e.target) && e.target !== toggle) {
      closePanel();
    }
  });

  // Close on Escape
  document.addEventListener("keydown", e => {
    if (e.key === "Escape" && !panel.hidden) closePanel();
  });

  // When from-unit changes, filter to-unit and recalculate
  fromSel.addEventListener("change", () => {
    filterToUnits(fromSel.value);
    updateConverter();
  });

  // When to-unit changes or input value changes, recalculate
  toSel.addEventListener("change", updateConverter);
  fromInput.addEventListener("input", updateConverter);
}
