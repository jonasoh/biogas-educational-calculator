# Biogas Educational Calculator

An interactive teaching tool for biogas plant operators. Students enter measured values and instantly see calculated results, range indicators, and educational explanations. The content is written in Swedish, but the framework can be adapted for any language or subject.

The tool runs directly in a browser — no build step, no server required. All educational content lives in a single file, `content.js`, which is the only file educators need to edit.

## Live Version

A live version of the calculator is [available](https://vansinne.se/biogas/).

## Editing Locally

Open `index.html` in a browser. Open `content.js` in a text editor with syntax highlighting (Notepad++, VS Code, etc.).

After every edit, save `content.js` and refresh the browser. If the page goes blank or an equation disappears, you have a typo — undo and try again.

## Content Structure Overview

Everything lives inside `CALCULATOR_CONTENT.tabs`, an array of tab objects. Each tab has an `equations` array. Equations come in two forms: **standalone** (with their own `parameters`) and **groups** (with a shared `parameters` array and a nested `equations` sub-array).

```js
const CALCULATOR_CONTENT = {
  tabs: [
    {                       // ← one TAB
      id: "biomass-loading",
      title: "Driftparametrar",
      intro: "...",
      equations: [
        {                   // ← EQUATION GROUP (shared inputs + sub-equations)
          id: "dry-matter",
          title: "...",
          parameters: [...],  // entered once, shared by all sub-equations
          equations: [
            { id: "ts", ... },   // sub-equation 1 — result "TS" available below
            { id: "vs", ... },   // sub-equation 2 — result "VS" available below
            { id: "vsts", ... }  // sub-equation 3 — uses TS and VS from above
          ]
        },
        {                   // ← STANDALONE EQUATION (has its own parameters)
          id: "hrt",
          title: "...",
          parameters: [...],
          formula_latex: "...",
          ...
        }
      ]
    },
    {                       // ← another TAB
      id: "nitrogen",
      ...
    }
  ]
};
```

The structure should be self-evident from this translated example:

```js
{
  id: "hrt",
  title: "Retention Time (Hydraulic Retention Time, HRT)",
  intro: `The retention time is the average time that material stays inside
the digester before it is removed as digestate. HRT is given in days.`,

  formula_latex:   "HRT = \\frac{V_{reactor}}{V_{feed}}",
  formula_filled:  "HRT = {v_reactor} m³ ÷ {q_feed} m³/d",
  formula_calc:    "v_reactor / q_feed",

  result_symbol:   "HRT",
  result_unit:     "days",
  result_decimals: 1,

  parameters: [
    {
      id:          "v_reactor",
      name:        "Reactor volume",
      unit:        "m³",
      description: "Active volume of the digester",
      min: 0, step: 10, decimals: 0
    },
    {
      id:          "q_feed",
      name:        "Daily feed volume",
      unit:        "m³/d",
      description: "Volume of substrate added to the reactor per day",
      min: 0, step: 5, decimals: 0
    }
  ],

  typical_range: {
    min:         15,
    max:         40,
    unit:        "days",
    low_text:    "Low HRT — material moves quickly through the digester. Substrate breakdown will be incomplete.",
    normal_text: "HRT is within the typical operating range.",
    high_text:   "High HRT — long residence time, which favours high breakdown efficiency."
  },

  educational_text: `The retention time is a fundamental parameter for a
continuously fed digester. It describes how long substrate stays in the
reactor on average before leaving with the effluent.`
},
```

## Example

Here is a screenshot showing off some of the features of the interactive calculator.

<img width="838" height="735" alt="image" src="https://github.com/user-attachments/assets/c405fd4d-a14f-4b7a-a4ab-1f57edd5a67b" />


## Writing KaTeX formulas

KaTeX renders beautiful mathematical formulas. Quick reference:

| What you want | KaTeX syntax | Result |
|---|---|---|
| Fraction | `\frac{a}{b}` | a/b (stacked) |
| Subscript | `m_{dry}` | m with "dry" subscript |
| Superscript | `10^{pK_a}` | 10 to the power pKa |
| Multiplication dot | `\times` | × |
| Greek letters | `\alpha` `\beta` `\mu` | α β μ |
| Percent sign | `\%` | % |

**Important:** In JavaScript strings, backslashes must be doubled. Write `\\frac` not `\frac`, `\\times` not `\times`.

**Examples from the current content:**
```
"TS\\,(\\%) = \\frac{m_{dry}}{m_{wet}} \\times 100"
"VS\\,(\\%) = \\frac{m_{dry} - m_{ash}}{m_{wet}} \\times 100"
"HRT = \\frac{V_{reactor}}{V_{feed}}"
"pK_a = 0.09018 + \\frac{2729.92}{T + 273.15}"
"NH_3\\,(\\text{mg/L}) = \\frac{TAN}{1 + 10^{\\,pK_a - pH}}"
```

Test formulas [here](https://katex.org/#demo).
