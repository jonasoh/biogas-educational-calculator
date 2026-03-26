/* ============================================================
   codigestion.js — Samrötning (Co-digestion) Tab
   Entry point: buildCodigestionPanel(panelEl, tab)
   Called by app.js when tab.type === "codigestion"

   All user-visible strings, thresholds, and colors come from
   the tab object defined in content.js (tab.labels, tab.warnings,
   tab.colors, tab.defaults). This file contains only logic.
   ============================================================ */

const CODIG_CHART_CONFIG = { responsive: true, displayModeBar: false };

/* ---- Entry point ----------------------------------------- */

function buildCodigestionPanel(panelEl, tab) {
  const L = tab.labels   || {};
  const C = tab.colors   || { substrate1: "#2a6b3c", substrate2: "#e07b35" };
  const D = tab.defaults || { substrate1: "notflytgodsel", proportion2: 30 };

  // Substrate pickers
  const { pickersEl, sel1, propDisplay1, inp2, sel2, propDisplay2 } =
    buildSubstratePickers(L, D);
  panelEl.appendChild(pickersEl);

  // Charts (must be in DOM before Plotly renders)
  const { chartsEl, chartDiv1, chartDiv2, chartDiv3 } = buildChartCards(L);
  panelEl.appendChild(chartsEl);

  // Results table
  const { resultsCard, tableBody } = buildResultsCard(L);
  panelEl.appendChild(resultsCard);

  // Commentary box
  const commentaryBox = buildCommentaryBox();
  panelEl.appendChild(commentaryBox);

  // Wire events
  function onChange() {
    const s1 = getSubstrate(sel1.value);
    const s2 = getSubstrate(sel2.value);
    const p2 = s2 ? Math.max(1, Math.min(99, parseFloat(inp2.value) || D.proportion2)) : 0;

    renderProps(propDisplay1, s1, L, false);
    renderProps(propDisplay2, s2, L, true);

    // Sync proportion inputs
    inp2.disabled = !s2;
    if (!s2) inp2.value = D.proportion2;

    const calc = calculateCodigestion(s1, s2, p2);
    renderResultsTable(tableBody, calc, s1, s2, L);
    renderCommentary(commentaryBox, tab, calc, s1, s2, L);
    renderChart1(chartDiv1, calc, s1, s2, L, C);
    renderChart2(chartDiv2, calc, s2, L, C);
    renderChart3(chartDiv3, calc, s2, L, C);
  }

  sel1.addEventListener("change", onChange);
  sel2.addEventListener("change", onChange);
  inp2.addEventListener("input", onChange);

  // Pre-select substrate 1 default
  sel1.value = D.substrate1;

  // Plotly cannot measure a hidden element — defer the initial render until
  // the panel is first made visible (the tab is clicked for the first time).
  if (!panelEl.hidden) {
    onChange();
  } else {
    const observer = new MutationObserver(() => {
      if (!panelEl.hidden) {
        observer.disconnect();
        onChange();
      }
    });
    observer.observe(panelEl, { attributes: true, attributeFilter: ["hidden"] });
  }
}

/* ---- Substrate lookup ------------------------------------ */

function getSubstrate(id) {
  return (typeof CODIGESTION_SUBSTRATES !== "undefined")
    ? CODIGESTION_SUBSTRATES.find(s => s.id === id) || null
    : null;
}

/* ---- Build substrate pickers ----------------------------- */

function buildSubstratePickers(L, D) {
  const pickersEl = document.createElement("div");
  pickersEl.className = "codig-pickers";

  // --- Card 1 ---
  const card1 = document.createElement("div");
  card1.className = "codig-picker-card";
  card1.innerHTML = `<h3>${escapeHtml(L.substrate1_heading)}</h3>`;

  const sel1 = document.createElement("select");
  sel1.className = "codig-select";
  populateSubstrateSelect(sel1, false, L);
  card1.appendChild(sel1);

  const prop1Row = document.createElement("div");
  prop1Row.className = "codig-proportion-row";
  prop1Row.innerHTML =
    `<label>${escapeHtml(L.proportion_label)}</label>` +
    `<input type="number" id="codig-prop1-inp" value="${100 - D.proportion2}" min="1" max="99" disabled>` +
    `<span class="codig-pct-label">%</span>`;
  card1.appendChild(prop1Row);

  const propDisplay1 = document.createElement("div");
  propDisplay1.className = "codig-props";
  card1.appendChild(propDisplay1);

  pickersEl.appendChild(card1);

  // --- Card 2 ---
  const card2 = document.createElement("div");
  card2.className = "codig-picker-card";
  card2.innerHTML = `<h3>${escapeHtml(L.substrate2_heading)}</h3>`;

  const sel2 = document.createElement("select");
  sel2.className = "codig-select";
  populateSubstrateSelect(sel2, true, L);
  card2.appendChild(sel2);

  const prop2Row = document.createElement("div");
  prop2Row.className = "codig-proportion-row";
  prop2Row.innerHTML =
    `<label>${escapeHtml(L.proportion_label)}</label>` +
    `<input type="number" id="codig-prop2-inp" value="${D.proportion2}" min="1" max="99" disabled>` +
    `<span class="codig-pct-label">%</span>`;
  card2.appendChild(prop2Row);

  const propDisplay2 = document.createElement("div");
  propDisplay2.className = "codig-props";
  card2.appendChild(propDisplay2);

  pickersEl.appendChild(card2);

  const inp2 = prop2Row.querySelector("input");
  const inp1 = prop1Row.querySelector("input");

  // Keep inp1 synced as mirror of inp2
  inp2.addEventListener("input", () => {
    const v = Math.max(1, Math.min(99, parseFloat(inp2.value) || D.proportion2));
    inp1.value = 100 - v;
  });

  sel2.addEventListener("change", () => {
    const s2 = getSubstrate(sel2.value);
    inp2.disabled = !s2;
    if (!s2) {
      inp2.value = D.proportion2;
      inp1.value = 100 - D.proportion2;
    } else {
      inp1.value = 100 - (parseFloat(inp2.value) || D.proportion2);
    }
  });

  return { pickersEl, sel1, propDisplay1, inp2, sel2, propDisplay2 };
}

function populateSubstrateSelect(sel, includeBlank, L) {
  if (includeBlank) {
    const opt = document.createElement("option");
    opt.value = "";
    opt.textContent = L.substrate2_blank_option;
    sel.appendChild(opt);
  }
  (CODIGESTION_SUBSTRATES || []).forEach(s => {
    const opt = document.createElement("option");
    opt.value = s.id;
    opt.textContent = s.name;
    sel.appendChild(opt);
  });
}

function renderProps(container, substrate, L, isSecond) {
  container.innerHTML = "";
  if (!substrate) {
    if (isSecond) {
      const hint = document.createElement("div");
      hint.className = "codig-empty-hint";
      hint.textContent = L.empty_hint_s2;
      container.appendChild(hint);
    }
    return;
  }
  const pills = [
    { label: L.prop_ts,    value: substrate.ts + " %" },
    { label: L.prop_vs_ts, value: (substrate.vs_ts * 100).toFixed(0) + " %" },
    { label: L.prop_bmp,   value: substrate.bmp + " " + L.prop_bmp_unit },
    { label: L.prop_cn,    value: substrate.cn },
  ];
  pills.forEach(({ label, value }) => {
    const pill = document.createElement("div");
    pill.className = "codig-prop";
    pill.innerHTML =
      `<span class="codig-prop-label">${escapeHtml(label)}</span>` +
      `<span class="codig-prop-value">${escapeHtml(String(value))}</span>`;
    container.appendChild(pill);
  });
  if (substrate.note) {
    const noteEl = document.createElement("div");
    noteEl.className = "codig-prop-note";
    noteEl.textContent = substrate.note;
    container.appendChild(noteEl);
  }
}

/* ---- Calculations ---------------------------------------- */

function calculateCodigestion(s1, s2, p2) {
  // All per 1000 kg wet weight total feed
  const m1 = s2 ? (1 - p2 / 100) * 1000 : 1000;
  const m2 = s2 ? (p2 / 100) * 1000 : 0;

  // Mono (s1 only, 1000 kg)
  const ts_mono_kg = 1000 * (s1.ts / 100);
  const vs_mono_kg = ts_mono_kg * s1.vs_ts;
  const ch4_mono   = vs_mono_kg * s1.bmp / 1000;  // Nm³
  const cn_mono    = s1.cn;

  if (!s2) {
    return {
      s2: null,
      ts_mono_kg, vs_mono_kg, ch4_mono, cn_mono,
      ts_mono_pct: s1.ts,
      ts_codig_kg: null, vs_codig_kg: null, ch4_codig: null, cn_codig: null,
      ts_codig_pct: null, ch4_change_pct: null,
      sub1_wet_pct: 100, sub1_ts_pct: 100, sub1_vs_pct: 100, sub1_ch4_pct: 100,
    };
  }

  // Co-dig
  const ts1_kg      = m1 * (s1.ts / 100);
  const ts2_kg      = m2 * (s2.ts / 100);
  const ts_codig_kg  = ts1_kg + ts2_kg;
  const ts_codig_pct = ts_codig_kg / 10;  // per 1000 kg → %

  const vs1_kg      = ts1_kg * s1.vs_ts;
  const vs2_kg      = ts2_kg * s2.vs_ts;
  const vs_codig_kg = vs1_kg + vs2_kg;

  const ch4_1     = vs1_kg * s1.bmp / 1000;
  const ch4_2     = vs2_kg * s2.bmp / 1000;
  const ch4_codig = ch4_1 + ch4_2;

  // C/N: harmonic mean weighted by VS
  const cn_codig = (vs1_kg + vs2_kg) / (vs1_kg / s1.cn + vs2_kg / s2.cn);

  // CH₄ change vs mono (used by warning rules)
  const ch4_change_pct = ((ch4_codig - ch4_mono) / ch4_mono) * 100;

  // Stacked bar %s
  const sub1_wet_pct = (m1 / 1000) * 100;
  const sub1_ts_pct  = ts_codig_kg > 0 ? (ts1_kg / ts_codig_kg) * 100 : 100;
  const sub1_vs_pct  = vs_codig_kg > 0 ? (vs1_kg / vs_codig_kg) * 100 : 100;
  const sub1_ch4_pct = ch4_codig   > 0 ? (ch4_1  / ch4_codig)   * 100 : 100;

  return {
    s2,
    ts_mono_kg, vs_mono_kg, ch4_mono, cn_mono,
    ts_mono_pct: s1.ts,
    ts_codig_kg, vs_codig_kg, ch4_codig, cn_codig,
    ts_codig_pct, ch4_change_pct,
    sub1_wet_pct, sub1_ts_pct, sub1_vs_pct, sub1_ch4_pct,
  };
}

/* ---- Results table --------------------------------------- */

function buildResultsCard(L) {
  const resultsCard = document.createElement("div");
  resultsCard.className = "codig-results-card";
  resultsCard.innerHTML =
    `<h3>${escapeHtml(L.results_heading)}</h3>` +
    `<table class="codig-table">` +
      `<thead><tr>` +
        `<th>${escapeHtml(L.col_parameter)}</th>` +
        `<th>${escapeHtml(L.col_mono)}</th>` +
        `<th>${escapeHtml(L.col_codig)}</th>` +
        `<th>${escapeHtml(L.col_change)}</th>` +
      `</tr></thead>` +
      `<tbody id="codig-tbody"></tbody>` +
    `</table>`;
  const tableBody = resultsCard.querySelector("#codig-tbody");
  return { resultsCard, tableBody };
}

function renderResultsTable(tbody, calc, s1, s2, L) {
  const fmt1 = v => v.toFixed(1);

  const rows = [
    {
      label: L.row_ts,
      mono:  fmt1(calc.ts_mono_pct),
      codig: s2 ? fmt1(calc.ts_codig_pct) : "—",
      delta: s2 ? pctDelta(calc.ts_mono_pct, calc.ts_codig_pct) : null,
    },
    {
      label: L.row_vs,
      mono:  fmt1(calc.vs_mono_kg),
      codig: s2 ? fmt1(calc.vs_codig_kg) : "—",
      delta: s2 ? pctDelta(calc.vs_mono_kg, calc.vs_codig_kg) : null,
    },
    {
      label: L.row_cn,
      mono:  fmt1(calc.cn_mono),
      codig: s2 ? fmt1(calc.cn_codig) : "—",
      delta: s2 ? pctDelta(calc.cn_mono, calc.cn_codig) : null,
    },
    {
      label: L.row_ch4,
      mono:  fmt1(calc.ch4_mono),
      codig: s2 ? fmt1(calc.ch4_codig) : "—",
      delta: s2 ? pctDelta(calc.ch4_mono, calc.ch4_codig) : null,
    },
  ];

  tbody.innerHTML = rows.map(r => {
    const deltaCell = r.delta !== null
      ? `<td class="${r.delta.cls}">${r.delta.text}</td>`
      : `<td class="codig-delta-neutral">—</td>`;
    return `<tr>` +
      `<td>${escapeHtml(r.label)}</td>` +
      `<td>${r.mono}</td>` +
      `<td>${r.codig}</td>` +
      deltaCell +
    `</tr>`;
  }).join("");
}

function pctDelta(mono, codig) {
  const diff = ((codig - mono) / Math.abs(mono)) * 100;
  const sign = diff >= 0 ? "+" : "";
  const text = sign + diff.toFixed(1) + "%";
  const cls  = diff > 0.5 ? "codig-delta-pos" : diff < -0.5 ? "codig-delta-neg" : "codig-delta-neutral";
  return { text, cls };
}

/* ---- Commentary ------------------------------------------ */

function buildCommentaryBox() {
  const box = document.createElement("div");
  box.className = "codig-commentary no-warnings";
  return box;
}

function evalWarnings(rules, context, calc, s1) {
  return (rules || [])
    .filter(r => r.context === context)
    .filter(r => {
      const val = calc[r.variable];
      return val !== null && val !== undefined &&
             (r.operator === ">" ? val > r.threshold : val < r.threshold);
    })
    .map(r => {
      const val = calc[r.variable];
      return r.text
        .replace(/{name}/g,      s1.name)
        .replace(/{value}/g,     parseFloat(val.toFixed(1)))
        .replace(/{abs_value}/g, parseFloat(Math.abs(val).toFixed(1)));
    });
}

function renderCommentary(box, tab, calc, s1, s2, L) {
  const context  = s2 ? "codig" : "mono";
  const warnings = evalWarnings(tab.warnings, context, calc, s1);
  const hasWarnings = warnings.length > 0;
  box.className = "codig-commentary " + (hasWarnings ? "has-warnings" : "no-warnings");
  let html = hasWarnings
    ? "<ul>" + warnings.map(w => `<li>${escapeHtml(w)}</li>`).join("") + "</ul>"
    : `<p>${L.no_warnings}</p>`;
  html += `<p class="codig-disclaimer">${L.disclaimer}</p>`;
  box.innerHTML = html;
}

/* ---- Chart cards ----------------------------------------- */

function buildChartCards(L) {
  const chartsEl = document.createElement("div");
  chartsEl.className = "codig-charts";

  function makeCard(title, idSuffix) {
    const card = document.createElement("div");
    card.className = "codig-chart-card";
    const h4 = document.createElement("h4");
    h4.textContent = title;
    card.appendChild(h4);
    const div = document.createElement("div");
    div.className = "codig-chart-div";
    div.id = "codig-chart-" + idSuffix;
    card.appendChild(div);
    chartsEl.appendChild(card);
    return div;
  }

  const chartDiv1 = makeCard(L.chart1_title, "1");
  const chartDiv2 = makeCard(L.chart2_title, "2");
  const chartDiv3 = makeCard(L.chart3_title, "3");

  return { chartsEl, chartDiv1, chartDiv2, chartDiv3 };
}

/* ---- Chart 1: Stacked contribution bars ------------------ */

function renderChart1(div, calc, s1, s2, L, C) {
  const categories = L.chart1_categories;
  const s1vals = [
    calc.sub1_wet_pct,
    calc.sub1_ts_pct,
    calc.sub1_vs_pct,
    calc.sub1_ch4_pct,
  ];
  const s2vals = s2 ? s1vals.map(v => 100 - v) : [0, 0, 0, 0];

  const data = [
    {
      name: s1.name,
      x: categories,
      y: s1vals,
      type: "bar",
      marker: { color: C.substrate1, line: { color: "#000", width: 1 } },
      hovertemplate: "%{y:.1f}%<extra>" + s1.name + "</extra>",
    },
  ];

  if (s2) {
    data.push({
      name: s2.name,
      x: categories,
      y: s2vals,
      type: "bar",
      marker: { color: C.substrate2, line: { color: "#000", width: 1 } },
      hovertemplate: "%{y:.1f}%<extra>" + s2.name + "</extra>",
    });
  }

  const layout = codigLayout({
    barmode: "stack",
    yaxis: { range: [0, 100], ticksuffix: "%" },
    showlegend: true,
    legend: { orientation: "h", y: -0.28, x: 0.5, xanchor: "center" },
    margin: { t: 10, r: 10, b: 65, l: 46 },
  });

  Plotly.react(div, data, layout, CODIG_CHART_CONFIG);
}

/* ---- Chart 2: CH₄ comparison bars ----------------------- */

function renderChart2(div, calc, s2, L, C) {
  const x      = s2 ? [L.chart_mono_bar, L.chart_codig_bar] : [L.chart_mono_bar];
  const y      = s2 ? [calc.ch4_mono, calc.ch4_codig] : [calc.ch4_mono];
  const colors = s2 ? [C.substrate1, C.substrate2] : [C.substrate1];

  const data = [{
    x, y,
    type: "bar",
    marker: { color: colors, line: { color: "#000", width: 1 } },
    hovertemplate: "%{y:.2f} Nm³/ton<extra></extra>",
  }];

  const layout = codigLayout({
    yaxis: { title: { text: L.chart2_y_label } },
  });

  Plotly.react(div, data, layout, CODIG_CHART_CONFIG);
}

/* ---- Chart 3: TS comparison bars ------------------------- */

function renderChart3(div, calc, s2, L, C) {
  const x      = s2 ? [L.chart_mono_bar, L.chart_codig_bar] : [L.chart_mono_bar];
  const y      = s2 ? [calc.ts_mono_pct, calc.ts_codig_pct] : [calc.ts_mono_pct];
  const colors = s2 ? [C.substrate1, C.substrate2] : [C.substrate1];

  const data = [{
    x, y,
    type: "bar",
    marker: { color: colors, line: { color: "#000", width: 1 } },
    hovertemplate: "%{y:.1f}%<extra></extra>",
  }];

  const layout = codigLayout({
    yaxis: { title: { text: L.chart3_y_label } },
  });

  Plotly.react(div, data, layout, CODIG_CHART_CONFIG);
}

/* ---- Shared Plotly layout helper ------------------------- */

function codigLayout(overrides) {
  return Object.assign({
    margin: { t: 10, r: 10, b: 40, l: 46 },
    paper_bgcolor: "transparent",
    plot_bgcolor:  "transparent",
    font: { family: "inherit", size: 11 },
    showlegend: false,
    transition: { duration: 400, easing: "cubic-in-out" },
    xaxis: { fixedrange: true },
    yaxis: { fixedrange: true },
  }, overrides);
}
