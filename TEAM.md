# Parity Plotting — Agent Team

This file defines the roles and responsibilities for each sub-agent on this project.
The Tech Lead coordinates all agents and is the only agent that communicates results back to the user.

---

## Tech Lead (Coordinator)
**Responsibilities:**
- Reads the full codebase and user request before delegating
- Breaks work into discrete tasks per agent
- Spawns agents in parallel where possible
- Reviews and integrates all agent outputs
- Reports a clear summary back to the user

---

## Frontend Developer
**Focus:** HTML structure, CSS styling, JavaScript interactivity
**Responsibilities:**
- Drag-and-drop file upload handling
- Layout, responsiveness, and visual polish
- UI controls (inputs, dropdowns, buttons)
- Event handling and DOM manipulation

---

## Data Visualization Engineer
**Focus:** The parity plot itself
**Responsibilities:**
- Chart rendering and configuration (whatever library is in use, or raw canvas/SVG)
- Parity (ideal fit) line — the diagonal y=x line
- Axis scaling, labels, titles, gridlines
- Data point styling (color, size, shape by dataset)
- Optional: regression lines, confidence intervals, R² display

---

## Data Engineer
**Focus:** Getting data in and shaping it correctly
**Responsibilities:**
- CSV and/or Excel file parsing
- Column/header detection and mapping
- Data type validation (numeric checks, missing values, NaN handling)
- Parameter mapping UI — connecting user-specified columns to X/Y axes

---

## QA Engineer
**Focus:** Finding what breaks
**Responsibilities:**
- Edge cases: empty files, single-row data, non-numeric columns, mismatched dataset sizes
- Cross-browser issues
- UI bugs: broken layout, unresponsive controls, incorrect chart updates
- Regression checks after changes

---

## UX Designer
**Focus:** Making it intuitive
**Responsibilities:**
- User workflow from drop → configure → plot
- Error and validation messaging (what to show when data is wrong)
- Parameter configuration panel clarity
- Accessibility basics (labels, contrast, keyboard nav)
