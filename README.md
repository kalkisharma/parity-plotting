# Parity Compare

A single-file browser tool for comparing two datasets on a parity plot (y = x). Drop two CSV files, pick a shared identifier column to join them, choose the columns to compare, and get an interactive plot with statistics — no installation, no server, no internet connection required.

**Maintainer:** Kalki Sharma — kalkijsharma@gmail.com

---

## Download

Go to the [latest release](https://github.com/kalkisharma/parity-plotting/releases/latest) and download **parity-compare.html**. That single file is the entire tool.

---

## How to use

1. Open `parity-compare.html` in any modern browser (Chrome, Edge, Firefox)
2. Drop or browse to **Dataset A** (your reference / baseline CSV)
3. Drop or browse to **Dataset B** (your comparison / model output CSV)
4. Select the **Join Key** — the column that uniquely identifies each row and exists in both files (e.g. a sample ID)
5. Select the **X column** (from A) and **Y column** (from B) to plot against each other
6. Click **Render plot**

The tool joins the two files on the key column, plots B values against A values, and draws the y = x parity line. Points that fall on the line are in perfect agreement.

### CSV format

- Any delimiter-separated file with a header row
- Both files must share at least one column with matching values (the join key)
- Numeric columns are used for axes and continuous colour-by; text columns can be used for categorical colour-by
- Missing values and non-numeric entries are excluded with a warning

### Controls

| Control | What it does |
|---|---|
| Join Key | Column used to match rows between the two files |
| X / Y column | Columns to plot (X from Dataset A, Y from Dataset B) |
| Color By | Optional third column — continuous (colorscale) or categorical (per-category colours) |
| ±5% / ±10% bands | Shaded tolerance bands around the parity line |
| Best fit line | Linear regression line with R² |
| Style presets | Save and reload your visual settings as a JSON file |
| Save plot | Snapshot the current plot to the strip below for comparison |
| ↓ ZIP | Export all saved plots as a ZIP of PNGs |

---

## Statistics panel

| Stat | Description |
|---|---|
| N matched | Rows successfully joined and plotted |
| N excluded | Rows dropped due to non-numeric or missing values |
| Parity R² (NSE) | Nash-Sutcliffe Efficiency — 1.0 is perfect agreement; < 0 means the mean is a better predictor than the model |
| MAE | Mean Absolute Error |
| RMSE | Root Mean Square Error |
| Max \|error\| | Largest single-point deviation |
| Mean bias | Average of (B − A) |
| Best-fit line | Slope, intercept, and R² of the linear regression |

---

## Requirements

- **Runtime:** any modern browser — no server, no npm, no internet
- **Build (developers only):** Node.js (any recent version, no packages needed)

Designed for use in air-gapped and restricted environments.

---

## Building from source

The distributable `parity-compare.html` is generated from the files in `src/` and `lib/`. To rebuild after editing source files:

```
node build.js
```

### Project structure

```
src/
  index.html          HTML template
  style.css           All styling
  js/
    state.js          App state + session/tab management
    data.js           CSV parsing + inner join logic
    ui.js             Column dropdowns + label sync
    chart.js          Plotly rendering, stats, exports
    saves.js          Saved plots panel
    stats.js          Stats panel renderer
    wiring.js         Event wiring + initialisation
lib/
  papaparse.min.js         PapaParse 5.4.1 — CSV parsing
  plotly-cartesian.min.js  Plotly.js 2.32.0 (cartesian bundle) — charting
  jszip.min.js             JSZip 3.10.1 — ZIP export
build.js              Build script — runs in under a second
parity-compare.html   Distributable output (generated, committed for direct download)
sample_data/          Example CSVs for testing
```

To update a library, replace the file in `lib/` and run `node build.js`.

---

## Versioning

Releases follow [semantic versioning](https://semver.org/). Each GitHub release has `parity-compare.html` attached as a direct download.
