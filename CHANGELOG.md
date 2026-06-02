# Changelog

All notable changes to parity-compare are documented here.

---

## [1.2.0] — 2026-06-02

### Fixed
- **Categorical color-by broken for text columns** — `colVals()` was converting all cell values via `Number()`, turning strings like `'Steel'` or `'Aluminum'` into NaN. The categorical branch received an array of NaN values, produced an empty category list, and rendered all points gray. A separate `cRawStr` path now preserves original string values for categorical coloring.
- **XSS via saved plot title** — `mkCard()` injected `snap.title` directly into an `innerHTML` attribute (`value="${snap.title}"`). A title containing `"` could break out of the attribute context. `escHtml()` is now applied consistently.
- **RangeError crash on large datasets** — `Math.max(...array)` and `Math.min(...array)` in `computeStats`, `renderPlot`, and `downloadColorbar` throw when the array exceeds ~65k elements. Replaced with `reduce`-based equivalents.
- **`plotly_relayout` listener accumulation** — `pd.on('plotly_relayout', handler)` was called on every render without removing the previous handler, causing listeners to pile up across re-renders. The previous handler is now deregistered before re-adding.
- **`beforeunload` only checked active session** — Closing the tab with saved plots in an inactive session showed no warning. The guard now checks all sessions.
- **Preset loader opacity label missing `%`** — `loadPreset`'s `sl()` helper had no `'pct'` format branch, so marker opacity showed `88` instead of `88%` after loading a preset file.
- **O(n²) categorical index loops** — `nanCatIdxs` and per-category index arrays were built with `reduce((a,v,i) => [...a,i])`, allocating a new array every iteration. Replaced with `forEach` + `push`.
- **Shallow copy of saved snap data on session capture** — `captureCurrentSession` used `{...p}` for each saved plot, leaving `snap.data` and `snap.layout` as shared references. Plotly's in-place layout mutations could corrupt archived plots when switching sessions. Both fields are now deep-cloned.
- **Version badge showing `%%VERSION%%` in header** — `build.js` used `String.replace('%%VERSION%%', ...)` which only replaces the first occurrence (the HTML comment). The visible header `<div>` was the second occurrence and stayed literal. Changed to `/%%VERSION%%/g`.

---

## [1.1.0] — 2026-05-26

### Added
- PNG filename is derived from the plot title, sanitised for filesystem safety (special characters stripped, spaces replaced with underscores). Falls back to `parity_compare` when the title is empty.
- README filled in: usage guide, CSV format notes, controls reference, statistics panel explanation, build instructions, and project structure.

---

## [1.0.9] — 2026-05-25

### Changed
- Swapped `plotly.min.js` (3.5 MB) for `plotly-cartesian.min.js` (1.3 MB) — the cartesian bundle covers all chart types used by this tool. Distributable size reduced from ~3.7 MB to ~1.5 MB.

---

## [1.0.8] — 2026-05-24

### Changed
- Split the monolithic `parity-compare.html` into maintainable source files under `src/` (`index.html`, `style.css`, `js/state.js`, `js/data.js`, `js/ui.js`, `js/chart.js`, `js/saves.js`, `js/stats.js`, `js/wiring.js`).
- Added `build.js` — concatenates `src/` + `lib/` into the single distributable `parity-compare.html` in under a second (`node build.js`).

---

## [1.0.7] — 2026-05-23

### Changed
- Added maintainer name and contact to HTML `<meta>` tags and file header comment.
- Annotated non-obvious code paths with explanatory comments (join key null-byte encoding, NSE vs R², lockstep array invariant, etc.).

---

## [1.0.6] — 2026-05-22

### Changed
- All JavaScript libraries (PapaParse, Plotly, JSZip) inlined directly into `parity-compare.html` — no external script tags, no CDN, fully self-contained for air-gapped use.

---

## [1.0.5] — 2026-05-21

### Added
- Security Engineer role added to `TEAM.md`.

### Changed
- All dependencies localised to `lib/` directory.

---

## [1.0.4] — 2026-05-20

### Fixed
- Strip non-breaking spaces (` `) from CSV column headers in `transformHeader`.
- `beforeunload` warning when saved plots exist (was missing).
- ZIP button shows `Nothing saved` feedback when export queue is empty.
- Saved plot cards are keyboard-accessible (`tabindex`, `role=button`, Enter/Space to restore).

### Added
- Tooltip on Join Key input explaining the join concept.

---

## [1.0.3] — 2026-05-19

### Fixed
- Hide stale plot and show empty state when all-NaN column causes early return in `renderPlot`.
- Warn when color column numeric ratio is 40–60% — ambiguous classification notified to user.

---

## [1.0.2] — 2026-05-18

### Added
- `.gitignore`.

---

## [1.0.1] — 2026-05-17

### Fixed
- Reset `xLabelLocked` / `yLabelLocked` when X/Y column is cleared, so auto-label resumes on next selection.
- Filter `'NaN'` and `''` out of categorical color categories — empty cells no longer create a spurious `NaN` category.
- Additional bug fixes from initial team review (5 total).

---

## [1.0.0] — 2026-05-16

### Added
- Initial full-featured release.
- Two-file CSV comparison with inner join on a shared identifier column.
- Interactive parity plot (y = x) via Plotly, with ±5% / ±10% error bands.
- Continuous and categorical color-by column support.
- Stats panel: N matched, N excluded, NSE/parity R², MAE, RMSE, max error, mean bias, best-fit line.
- Draggable stats annotation box on the plot.
- Named session tabs with inline rename, reorder, and close.
- Auto-updating plot title, axis labels, and colorbar label with individual lock toggles.
- Colorbar visibility toggle and standalone colorbar PNG export.
- Saved plots strip with thumbnails; ZIP export of all saved plots.
- Style presets — save and load visual settings as JSON.
- Reference line style controls (color, width, dash) for the parity line and best-fit line.
- Fully self-contained single HTML file — no server, no internet connection, no installation.
