# Frontend Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Restyle the skills matrix frontend with a dark/light theme toggle using a "command centre" aesthetic.

**Architecture:** CSS custom properties define two complete theme palettes (dark + light) on the `<html>` element via `data-theme` attribute. A toggle button in the header swaps themes and persists the preference to `localStorage`. HTML header is restructured to a flex row; all other HTML structure is preserved to avoid breaking existing JS.

**Tech Stack:** Vanilla HTML/CSS/JS, Chart.js (already loaded via CDN)

---

### Task 1: Add theme CSS variables and base dark-mode styles to styles.css

**Files:**
- Modify: `frontend/styles.css`

**Step 1: Replace the `:root` block with dual theme variables**

Replace the existing `:root { ... }` block (lines 8–26) with:

```css
/* ============================================================
   THEME VARIABLES
   ============================================================ */

/* Dark mode (default) */
[data-theme="dark"] {
    --bg-main: #23272a;
    --bg-nav: #1a1c1e;
    --bg-card: #2b2f33;
    --bg-input: #1a1c1e;
    --accent: #00a3ff;
    --accent-2: #00d1ff;
    --accent-grad: #4d4dff;
    --warning: #ffb000;
    --danger: #ff4d4d;
    --success: #00e676;
    --text-primary: #ffffff;
    --text-secondary: #a0aec0;
    --border: rgba(255, 255, 255, 0.08);
    --shadow: rgba(0, 0, 0, 0.4);
    --hover-overlay: rgba(255, 255, 255, 0.05);

    /* Skill level colours (dark) */
    --level-0: #2b2f33;
    --level-0-text: #a0aec0;
    --level-1: #3d1f1f;
    --level-1-text: #ff4d4d;
    --level-2: #3d2e1a;
    --level-2-text: #ffb000;
    --level-3: #2e2e1a;
    --level-3-text: #e6cc00;
    --level-4: #1a2e22;
    --level-4-text: #00e676;
    --level-5: #00e676;
    --level-5-text: #1a1c1e;
}

/* Light mode */
[data-theme="light"] {
    --bg-main: #f0f4f8;
    --bg-nav: #ffffff;
    --bg-card: #ffffff;
    --bg-input: #f8fafc;
    --accent: #00a3ff;
    --accent-2: #00d1ff;
    --accent-grad: #4d4dff;
    --warning: #ffb000;
    --danger: #ff4d4d;
    --success: #00c853;
    --text-primary: #1a1c1e;
    --text-secondary: #4a5568;
    --border: #e2e8f0;
    --shadow: rgba(0, 0, 0, 0.08);
    --hover-overlay: rgba(0, 163, 255, 0.04);

    /* Skill level colours (light) */
    --level-0: #f1f5f9;
    --level-0-text: #64748b;
    --level-1: #fee2e2;
    --level-1-text: #dc2626;
    --level-2: #fef3c7;
    --level-2-text: #d97706;
    --level-3: #fefce8;
    --level-3-text: #ca8a04;
    --level-4: #dcfce7;
    --level-4-text: #16a34a;
    --level-5: #00c853;
    --level-5-text: #ffffff;
}
```

**Step 2: Verify the file looks correct around the replaced block**

Read `frontend/styles.css` lines 1–80 to confirm the variables block is clean.

**Step 3: Commit**

```bash
git add frontend/styles.css
git commit -m "feat: add dual-theme CSS variable system"
```

---

### Task 2: Rewrite body, header, and nav styles

**Files:**
- Modify: `frontend/styles.css`

**Step 1: Replace the body/header/nav section**

Find and replace the `body`, `header`, and `nav` blocks with:

```css
/* ============================================================
   BASE
   ============================================================ */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    background-color: var(--bg-main);
    color: var(--text-primary);
    line-height: 1.6;
    transition: background-color 0.25s ease, color 0.25s ease;
}

.container {
    max-width: 1400px;
    margin: 0 auto;
    padding: 0 20px;
}

/* ============================================================
   HEADER
   ============================================================ */
header {
    background-color: var(--bg-nav);
    border-bottom: 1px solid var(--border);
    padding: 1.25rem 0;
    box-shadow: 0 2px 12px var(--shadow);
}

header .container {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
}

.header-brand h1 {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--text-primary);
    letter-spacing: -0.02em;
}

.header-brand .tagline {
    font-size: 0.85rem;
    color: var(--text-secondary);
    margin-top: 0.15rem;
}

/* Theme toggle button */
.theme-toggle {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: 999px;
    padding: 0.4rem 1rem;
    cursor: pointer;
    color: var(--text-secondary);
    font-size: 0.85rem;
    font-weight: 500;
    transition: all 0.2s ease;
}

.theme-toggle:hover {
    border-color: var(--accent);
    color: var(--accent);
    box-shadow: 0 0 8px rgba(0, 163, 255, 0.2);
}

.theme-toggle svg {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
}

.theme-toggle .icon-sun { display: none; }
.theme-toggle .icon-moon { display: block; }

[data-theme="light"] .theme-toggle .icon-sun { display: block; }
[data-theme="light"] .theme-toggle .icon-moon { display: none; }

/* ============================================================
   NAVIGATION
   ============================================================ */
nav {
    background-color: var(--bg-nav);
    border-bottom: 1px solid var(--border);
    padding: 0;
    position: sticky;
    top: 0;
    z-index: 100;
    box-shadow: 0 2px 8px var(--shadow);
}

nav .container {
    display: flex;
    align-items: stretch;
    gap: 0;
    overflow-x: auto;
    scrollbar-width: none;
}

nav .container::-webkit-scrollbar { display: none; }

.nav-btn {
    background: none;
    border: none;
    border-bottom: 3px solid transparent;
    padding: 1rem 1.5rem;
    cursor: pointer;
    font-size: 0.9rem;
    font-weight: 500;
    color: var(--text-secondary);
    white-space: nowrap;
    transition: all 0.2s ease;
    flex-shrink: 0;
}

.nav-btn:hover {
    color: var(--accent);
    background: var(--hover-overlay);
}

.nav-btn.active {
    color: var(--accent);
    border-bottom-color: var(--accent);
    font-weight: 600;
    box-shadow: inset 0 -2px 8px rgba(0, 163, 255, 0.15);
}
```

**Step 2: Commit**

```bash
git add frontend/styles.css
git commit -m "feat: redesign header and nav with theme variables"
```

---

### Task 3: Rewrite card, metric, button, and form styles

**Files:**
- Modify: `frontend/styles.css`

**Step 1: Replace the main content and card styles**

Find and replace the `main`, `h2`, `h3`, `.metrics-grid`, `.metric-card`, `.metric-value`, `.metric-label` blocks with:

```css
/* ============================================================
   MAIN CONTENT
   ============================================================ */
main {
    padding: 2rem 0;
    min-height: calc(100vh - 250px);
}

.view {
    display: none;
}

.view.active {
    display: block;
    animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
}

h2 {
    font-size: 1.5rem;
    font-weight: 700;
    margin-bottom: 1.5rem;
    color: var(--text-primary);
    letter-spacing: -0.01em;
}

h3 {
    font-size: 1.1rem;
    font-weight: 600;
    margin-bottom: 1rem;
    color: var(--text-primary);
}

/* ============================================================
   METRIC CARDS
   ============================================================ */
.metrics-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1.5rem;
    margin-bottom: 2rem;
}

.metric-card {
    background: var(--bg-card);
    padding: 1.5rem;
    border-radius: 10px;
    border: 1px solid var(--border);
    border-left: 4px solid var(--accent);
    box-shadow: 0 2px 8px var(--shadow);
    text-align: center;
    transition: all 0.2s ease;
}

.metric-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px var(--shadow);
}

.metric-card.clickable {
    cursor: pointer;
}

.metric-card.clickable:hover {
    transform: translateY(-4px);
    border-left-color: var(--accent-2);
    box-shadow: 0 6px 20px rgba(0, 163, 255, 0.2);
}

.metric-card.clickable:active {
    transform: translateY(-2px);
}

.metric-hint {
    display: block;
    margin-top: 0.5rem;
    font-size: 0.75rem;
    color: var(--text-secondary);
    font-style: italic;
}

.metric-value {
    font-size: 2.5rem;
    font-weight: 700;
    color: var(--accent);
    margin-bottom: 0.5rem;
    letter-spacing: -0.02em;
}

.metric-label {
    color: var(--text-secondary);
    font-size: 0.9rem;
    font-weight: 500;
}

/* ============================================================
   BUTTONS
   ============================================================ */
button {
    padding: 0.6rem 1.25rem;
    border: none;
    border-radius: 6px;
    font-size: 0.9rem;
    cursor: pointer;
    transition: all 0.2s ease;
    font-weight: 600;
}

.btn-primary {
    background-color: var(--accent);
    color: #ffffff;
    border: 1px solid var(--accent);
}

.btn-primary:hover {
    background-color: var(--accent-2);
    border-color: var(--accent-2);
    box-shadow: 0 0 12px rgba(0, 163, 255, 0.4);
}

.btn-secondary {
    background: transparent;
    color: var(--accent);
    border: 1px solid var(--accent);
}

.btn-secondary:hover {
    background: rgba(0, 163, 255, 0.1);
    box-shadow: 0 0 8px rgba(0, 163, 255, 0.2);
}

.btn-danger {
    background-color: var(--danger);
    color: #ffffff;
    border: 1px solid var(--danger);
}

.btn-danger:hover {
    background-color: #e03030;
    box-shadow: 0 0 12px rgba(255, 77, 77, 0.4);
}

button:disabled {
    opacity: 0.4;
    cursor: not-allowed;
}

/* ============================================================
   FORMS
   ============================================================ */
.form-group {
    margin-bottom: 1.25rem;
}

.form-group label {
    display: block;
    margin-bottom: 0.4rem;
    font-weight: 600;
    font-size: 0.875rem;
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.04em;
}

.form-group input,
.form-group select {
    width: 100%;
    padding: 0.65rem 0.9rem;
    border: 1px solid var(--border);
    border-radius: 6px;
    font-size: 0.95rem;
    background: var(--bg-input);
    color: var(--text-primary);
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.form-group input:focus,
.form-group select:focus {
    outline: none;
    border-color: var(--accent);
    box-shadow: 0 0 0 3px rgba(0, 163, 255, 0.15);
}

.form-group select option {
    background: var(--bg-card);
    color: var(--text-primary);
}

hr {
    border: none;
    border-top: 1px solid var(--border);
    margin: 1.5rem 0;
}
```

**Step 2: Commit**

```bash
git add frontend/styles.css
git commit -m "feat: restyle cards, buttons, and forms with theme variables"
```

---

### Task 4: Rewrite heatmap, search, and profile styles

**Files:**
- Modify: `frontend/styles.css`

**Step 1: Replace heatmap styles**

Find and replace the heatmap section (`.heatmap-controls` through `.skill-cell.level-5`) with:

```css
/* ============================================================
   HEATMAP
   ============================================================ */
.heatmap-controls {
    margin-bottom: 1rem;
    display: flex;
    gap: 0.5rem;
}

.heatmap-legend {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    margin-bottom: 1.5rem;
    padding: 1rem;
    background: var(--bg-card);
    border-radius: 8px;
    border: 1px solid var(--border);
}

.legend-item {
    display: flex;
    align-items: center;
    font-size: 0.8rem;
    color: var(--text-secondary);
}

.color-box {
    width: 20px;
    height: 20px;
    margin-right: 0.5rem;
    border-radius: 4px;
    border: 1px solid var(--border);
}

.color-box.level-0 { background-color: var(--level-0); }
.color-box.level-1 { background-color: var(--level-1); }
.color-box.level-2 { background-color: var(--level-2); }
.color-box.level-3 { background-color: var(--level-3); }
.color-box.level-4 { background-color: var(--level-4); }
.color-box.level-5 { background-color: var(--level-5); }

.heatmap-scroll {
    overflow-x: auto;
    background: var(--bg-card);
    border-radius: 10px;
    border: 1px solid var(--border);
}

.heatmap-table {
    width: 100%;
    border-collapse: collapse;
    min-width: 800px;
}

.heatmap-table th,
.heatmap-table td {
    padding: 0.65rem 0.75rem;
    text-align: center;
    border: 1px solid var(--border);
    font-size: 0.85rem;
}

.heatmap-table th {
    background-color: var(--bg-nav);
    color: var(--text-primary);
    font-weight: 600;
    font-size: 0.8rem;
    letter-spacing: 0.03em;
    position: sticky;
    top: 0;
    z-index: 10;
}

.heatmap-table td.resource-name {
    text-align: left;
    font-weight: 600;
    background-color: var(--bg-card);
    color: var(--text-primary);
    position: sticky;
    left: 0;
    z-index: 5;
}

.heatmap-table td.skill-cell {
    cursor: pointer;
    transition: all 0.15s ease;
    font-weight: 700;
}

.heatmap-table td.skill-cell:hover {
    transform: scale(1.1);
    box-shadow: 0 0 8px var(--shadow);
    z-index: 20;
    position: relative;
}

.skill-cell.level-0 { background-color: var(--level-0); color: var(--level-0-text); }
.skill-cell.level-1 { background-color: var(--level-1); color: var(--level-1-text); }
.skill-cell.level-2 { background-color: var(--level-2); color: var(--level-2-text); }
.skill-cell.level-3 { background-color: var(--level-3); color: var(--level-3-text); }
.skill-cell.level-4 { background-color: var(--level-4); color: var(--level-4-text); }
.skill-cell.level-5 { background-color: var(--level-5); color: var(--level-5-text); }
```

**Step 2: Replace search and resource card styles**

Find and replace `.search-box` through `.resource-profile` with:

```css
/* ============================================================
   SEARCH & RESOURCE CARDS
   ============================================================ */
.search-box {
    margin-bottom: 2rem;
}

.search-box input {
    width: 100%;
    max-width: 600px;
    padding: 0.75rem 1rem;
    font-size: 0.95rem;
    border: 1px solid var(--border);
    border-radius: 8px;
    background: var(--bg-card);
    color: var(--text-primary);
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.search-box input:focus {
    outline: none;
    border-color: var(--accent);
    box-shadow: 0 0 0 3px rgba(0, 163, 255, 0.15);
}

.search-results {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 1rem;
    margin-bottom: 2rem;
}

.resource-card {
    background: var(--bg-card);
    padding: 1.25rem;
    border-radius: 10px;
    border: 1px solid var(--border);
    box-shadow: 0 2px 8px var(--shadow);
    transition: all 0.2s ease;
    position: relative;
}

.resource-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 6px 20px var(--shadow);
    border-color: var(--accent);
}

.resource-card h4 {
    color: var(--accent);
    margin-bottom: 0.4rem;
    font-size: 1rem;
}

.resource-card p {
    color: var(--text-secondary);
    font-size: 0.85rem;
}

.resource-card-actions {
    display: flex;
    gap: 0.5rem;
    margin-top: 1rem;
}

.resource-card-actions button {
    flex: 1;
    padding: 0.35rem 0.6rem;
    font-size: 0.78rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    border-radius: 5px;
    cursor: pointer;
    transition: all 0.2s ease;
}

.btn-view {
    background: transparent;
    color: var(--accent);
    border: 1px solid var(--accent);
}

.btn-view:hover {
    background: var(--accent);
    color: #ffffff;
    box-shadow: 0 0 8px rgba(0, 163, 255, 0.35);
}

.btn-edit {
    background: transparent;
    color: var(--success);
    border: 1px solid var(--success);
}

.btn-edit:hover {
    background: var(--success);
    color: #1a1c1e;
    box-shadow: 0 0 8px rgba(0, 230, 118, 0.35);
}

.resource-profile {
    background: var(--bg-card);
    padding: 2rem;
    border-radius: 10px;
    border: 1px solid var(--border);
    box-shadow: 0 2px 8px var(--shadow);
    margin-top: 2rem;
}

.profile-header {
    margin-bottom: 2rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid var(--border);
}

.profile-header h3 {
    color: var(--accent);
    font-size: 1.4rem;
}

.profile-chart {
    max-width: 600px;
    margin: 2rem auto;
}

.skills-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 0.75rem;
    margin-top: 1.5rem;
}

.skill-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.65rem 0.9rem;
    background: var(--bg-main);
    border: 1px solid var(--border);
    border-radius: 6px;
    font-size: 0.9rem;
    color: var(--text-primary);
}

.skill-level-badge {
    padding: 0.2rem 0.6rem;
    border-radius: 10px;
    font-size: 0.8rem;
    font-weight: 700;
}
```

**Step 3: Commit**

```bash
git add frontend/styles.css
git commit -m "feat: restyle heatmap, search, and resource cards"
```

---

### Task 5: Rewrite modal, management, chart section, and rating scale styles

**Files:**
- Modify: `frontend/styles.css`

**Step 1: Replace modal styles**

Find and replace the `.modal` through `.confirm-modal-actions button` section with:

```css
/* ============================================================
   MODALS
   ============================================================ */
.modal {
    display: none;
    position: fixed;
    z-index: 20000;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.7);
    overflow-y: auto;
}

.modal.show {
    display: block;
}

.modal-content {
    background: var(--bg-card);
    margin: 3% auto;
    padding: 0;
    border-radius: 12px;
    max-width: 900px;
    width: 90%;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
    max-height: 85vh;
    display: flex;
    flex-direction: column;
    border: 1px solid var(--border);
}

.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.25rem 1.75rem;
    border-bottom: 1px solid var(--border);
}

.modal-header h3 {
    margin: 0;
    color: var(--text-primary);
    font-size: 1.25rem;
}

.modal-close {
    background: none;
    border: none;
    font-size: 1.5rem;
    color: var(--text-secondary);
    cursor: pointer;
    line-height: 1;
    padding: 0;
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    transition: all 0.2s;
}

.modal-close:hover {
    background: var(--hover-overlay);
    color: var(--text-primary);
}

.modal-body {
    padding: 1.75rem;
    overflow-y: auto;
    flex: 1;
}

.modal-email {
    color: var(--text-secondary);
    margin-bottom: 1.5rem;
    font-size: 0.9rem;
}

.modal-actions {
    display: flex;
    gap: 0.75rem;
    margin-bottom: 1.5rem;
    padding-bottom: 1.25rem;
    border-bottom: 1px solid var(--border);
}

.modal-actions-bottom {
    position: sticky;
    bottom: 0;
    background: var(--bg-card);
    margin-bottom: 0;
    margin-top: 1.5rem;
    padding: 1.25rem 0 0 0;
    border-top: 1px solid var(--border);
    z-index: 10;
}

.modal-skills-container {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
}

.modal-category {
    background: var(--bg-main);
    border-radius: 8px;
    padding: 1.25rem;
    border: 1px solid var(--border);
}

.modal-category-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
    cursor: pointer;
    user-select: none;
}

.modal-category-header h4 {
    margin: 0;
    color: var(--text-primary);
    font-size: 1rem;
}

.modal-category-toggle {
    font-size: 1.1rem;
    color: var(--text-secondary);
    transition: transform 0.2s;
}

.modal-category.collapsed .modal-category-toggle {
    transform: rotate(-90deg);
}

.modal-category-content {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 0.65rem;
}

.modal-category.collapsed .modal-category-content {
    display: none;
}

.modal-skill-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.6rem 0.75rem;
    background: var(--bg-card);
    border-radius: 6px;
    border: 1px solid var(--border);
}

.modal-skill-name {
    flex: 1;
    font-size: 0.875rem;
    color: var(--text-primary);
}

.modal-skill-controls {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.modal-skill-input {
    width: 55px;
    padding: 0.25rem 0.4rem;
    border: 1px solid var(--border);
    border-radius: 4px;
    text-align: center;
    font-size: 0.875rem;
    background: var(--bg-input);
    color: var(--text-primary);
}

.modal-skill-remove {
    background: rgba(255, 77, 77, 0.1);
    color: var(--danger);
    border: none;
    padding: 0.2rem 0.4rem;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.8rem;
    transition: background 0.2s;
}

.modal-skill-remove:hover {
    background: rgba(255, 77, 77, 0.25);
}

/* Confirmation Modal */
#confirmModal {
    z-index: 30000 !important;
}

.confirm-modal-content {
    max-width: 500px;
    width: 90%;
}

.confirm-modal-header {
    background: var(--danger);
    color: white;
    border-bottom: none;
    border-radius: 12px 12px 0 0;
}

.confirm-modal-header h3 {
    color: white;
}

.confirm-modal-message {
    font-size: 1rem;
    color: var(--text-primary);
    margin-bottom: 1.5rem;
    line-height: 1.6;
}

.confirm-modal-actions {
    display: flex;
    gap: 0.75rem;
    justify-content: flex-end;
    margin-bottom: 0;
    padding-bottom: 0;
    border-bottom: none;
}

.confirm-modal-actions button {
    min-width: 110px;
}

/* Profile Modal */
#profileModal {
    display: none;
    align-items: center;
    justify-content: center;
}

.modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.7);
    z-index: 1;
}

.profile-modal-content {
    position: relative;
    z-index: 2;
    max-width: 1000px;
    width: 95%;
    max-height: 90vh;
    overflow-y: auto;
    padding: 2rem;
    background: var(--bg-card);
    border: 1px solid var(--border);
}

.profile-modal-content .modal-close {
    position: absolute;
    top: 1rem;
    right: 1rem;
    z-index: 3;
}

#modalProfileContent .profile-header {
    margin-bottom: 2rem;
}

#modalProfileContent .profile-header h3 {
    font-size: 1.6rem;
    color: var(--text-primary);
    margin-bottom: 0.4rem;
}

#modalProfileContent .profile-header p {
    color: var(--text-secondary);
    font-size: 0.95rem;
}

#modalProfileContent .profile-chart {
    margin: 2rem 0;
    background: var(--bg-card);
    padding: 1.25rem;
    border-radius: 8px;
    border: 1px solid var(--border);
}

#modalProfileContent h4 {
    font-size: 1.1rem;
    margin-top: 1.5rem;
    margin-bottom: 0.75rem;
    color: var(--text-primary);
}

#modalProfileContent .skills-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 0.65rem;
}

#modalProfileContent .skill-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.65rem 0.9rem;
    background: var(--bg-main);
    border: 1px solid var(--border);
    border-radius: 6px;
}

#modalProfileContent .skill-level-badge {
    padding: 0.2rem 0.6rem;
    border-radius: 4px;
    font-size: 0.8rem;
    font-weight: 700;
}
```

**Step 2: Replace management, chart, rating scale, weighted gaps, and remaining sections**

Find and replace `.management-grid` through end-of-file with:

```css
/* ============================================================
   MANAGEMENT
   ============================================================ */
.management-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
    gap: 2rem;
    margin-bottom: 2rem;
}

.management-card {
    background: var(--bg-card);
    padding: 1.75rem;
    border-radius: 10px;
    border: 1px solid var(--border);
    box-shadow: 0 2px 8px var(--shadow);
}

.data-actions {
    background: var(--bg-card);
    padding: 1.75rem;
    border-radius: 10px;
    border: 1px solid var(--border);
    box-shadow: 0 2px 8px var(--shadow);
}

.data-actions button {
    margin-right: 0.75rem;
    margin-bottom: 0.75rem;
}

/* ============================================================
   RATING SCALE
   ============================================================ */
.rating-scale-display {
    background: var(--bg-card);
    padding: 1.5rem;
    border-radius: 10px;
    border: 1px solid var(--border);
    box-shadow: 0 2px 8px var(--shadow);
    margin-bottom: 2rem;
}

.rating-scale-display h3 {
    color: var(--accent);
}

.rating-scale-grid {
    display: grid;
    gap: 0.6rem;
}

.rating-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.65rem;
    border-radius: 6px;
    transition: background-color 0.2s;
}

.rating-item:hover {
    background-color: var(--hover-overlay);
}

.rating-badge {
    flex-shrink: 0;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 1rem;
}

.rating-badge.level-0 { background-color: var(--level-0); color: var(--level-0-text); }
.rating-badge.level-1 { background-color: var(--level-1); color: var(--level-1-text); }
.rating-badge.level-2 { background-color: var(--level-2); color: var(--level-2-text); }
.rating-badge.level-3 { background-color: var(--level-3); color: var(--level-3-text); }
.rating-badge.level-4 { background-color: var(--level-4); color: var(--level-4-text); }
.rating-badge.level-5 { background-color: var(--level-5); color: var(--level-5-text); }

.rating-text {
    flex: 1;
    font-size: 0.875rem;
    line-height: 1.4;
    color: var(--text-secondary);
}

.rating-text strong {
    color: var(--text-primary);
}

/* ============================================================
   CHART CONTAINERS
   ============================================================ */
.chart-container {
    background: var(--bg-card);
    padding: 2rem;
    border-radius: 10px;
    border: 1px solid var(--border);
    box-shadow: 0 2px 8px var(--shadow);
    margin-bottom: 2rem;
    max-width: 800px;
    margin-left: auto;
    margin-right: auto;
}

.chart-container canvas {
    max-height: 500px;
}

/* ============================================================
   SKILLS LISTS (dashboard top/gap)
   ============================================================ */
.skills-lists {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1.5rem;
    margin-bottom: 2rem;
}

.skills-column {
    background: var(--bg-card);
    padding: 1.25rem;
    border-radius: 10px;
    border: 1px solid var(--border);
    box-shadow: 0 2px 8px var(--shadow);
}

.skills-column h3.strength { color: var(--success); }
.skills-column h3.gap { color: var(--danger); }

.skills-column ul { list-style: none; }

.skills-column li {
    padding: 0.65rem 0.75rem;
    margin: 0.4rem 0;
    background: var(--bg-main);
    border-radius: 6px;
    border: 1px solid var(--border);
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.9rem;
    color: var(--text-primary);
}

.skill-score {
    font-weight: 700;
    padding: 0.2rem 0.6rem;
    border-radius: 10px;
    background: var(--accent);
    color: #ffffff;
    font-size: 0.8rem;
}

/* ============================================================
   WEIGHTED GAPS
   ============================================================ */
.weighted-gaps-section {
    margin-top: 2rem;
    padding: 1.5rem;
    background: var(--bg-card);
    border-radius: 10px;
    border: 1px solid var(--border);
    box-shadow: 0 2px 8px var(--shadow);
}

.weighted-gaps-list {
    list-style: none;
    padding: 0;
    margin-top: 1rem;
    display: grid;
    gap: 0.65rem;
}

.weighted-gap-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.85rem 1rem;
    background: var(--bg-main);
    border-radius: 8px;
    border-left: 4px solid var(--border);
    transition: all 0.2s;
    font-size: 0.9rem;
}

.weighted-gap-item:hover {
    transform: translateX(2px);
    background: var(--hover-overlay);
}

.weighted-gap-item.priority-critical { border-left-color: var(--danger); }
.weighted-gap-item.priority-high     { border-left-color: var(--warning); }
.weighted-gap-item.priority-medium   { border-left-color: #e6cc00; }
.weighted-gap-item.priority-low      { border-left-color: var(--success); }

.gap-rank {
    font-size: 1.1rem;
    font-weight: 700;
    color: var(--text-secondary);
    min-width: 36px;
    text-align: center;
}

.gap-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
}

.gap-name {
    display: flex;
    align-items: center;
    gap: 0.65rem;
    font-size: 0.95rem;
    color: var(--text-primary);
}

.weight-badge {
    display: inline-block;
    padding: 0.15rem 0.45rem;
    background: var(--accent);
    color: white;
    border-radius: 4px;
    font-size: 0.7rem;
    font-weight: 700;
}

.gap-details {
    display: flex;
    gap: 1rem;
    font-size: 0.8rem;
    color: var(--text-secondary);
}

.gap-score-badge {
    padding: 0.15rem 0.5rem;
    background: linear-gradient(135deg, var(--accent-grad) 0%, var(--accent) 100%);
    color: white;
    border-radius: 4px;
    font-weight: 700;
    font-size: 0.85rem !important;
}

/* ============================================================
   CUSTOM RADAR / SUB-SKILL SELECTOR
   ============================================================ */
.custom-chart-section {
    margin-top: 3rem;
    padding-top: 2rem;
    border-top: 1px solid var(--border);
}

.section-description {
    color: var(--text-secondary);
    margin-bottom: 1.5rem;
    font-size: 0.9rem;
}

.subskill-selector {
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 1.25rem;
    margin-bottom: 2rem;
}

.selector-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.25rem;
    flex-wrap: wrap;
    gap: 0.75rem;
}

.selector-header h4 {
    margin: 0;
    color: var(--text-primary);
    font-size: 1rem;
}

.selector-actions {
    display: flex;
    gap: 0.65rem;
}

.search-filter {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1rem;
    padding: 0.65rem 0.9rem;
    background: var(--bg-main);
    border: 1px solid var(--border);
    border-radius: 6px;
}

.search-filter input[type="text"] {
    flex: 1;
    padding: 0.4rem 0.6rem;
    border: 1px solid var(--border);
    border-radius: 4px;
    font-size: 0.9rem;
    background: var(--bg-input);
    color: var(--text-primary);
    transition: border-color 0.2s;
}

.search-filter input[type="text"]:focus {
    outline: none;
    border-color: var(--accent);
    box-shadow: 0 0 0 3px rgba(0, 163, 255, 0.15);
}

.search-count {
    font-size: 0.8rem;
    color: var(--text-secondary);
    white-space: nowrap;
    min-width: 100px;
    text-align: right;
}

.checkbox-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 0.6rem;
    max-height: 400px;
    overflow-y: auto;
    padding: 0.25rem;
}

.checkbox-item {
    display: flex;
    align-items: center;
    padding: 0.4rem 0.5rem;
    border-radius: 5px;
    transition: background 0.15s;
}

.checkbox-item:hover {
    background: var(--hover-overlay);
}

.checkbox-item input[type="checkbox"] {
    margin-right: 0.5rem;
    width: 15px;
    height: 15px;
    cursor: pointer;
    accent-color: var(--accent);
}

.checkbox-item label {
    cursor: pointer;
    font-size: 0.875rem;
    color: var(--text-primary);
    user-select: none;
    flex: 1;
}

/* ============================================================
   COLLAPSIBLE CATEGORIES (sub-skill selector)
   ============================================================ */
.collapsible-category {
    border: 1px solid var(--border);
    border-radius: 6px;
    margin-bottom: 0.65rem;
    overflow: hidden;
    background: var(--bg-card);
}

.category-header {
    display: flex;
    align-items: center;
    gap: 0.65rem;
    padding: 0.65rem 0.9rem;
    background: var(--bg-main);
    cursor: pointer;
    user-select: none;
    transition: background-color 0.15s;
}

.category-header:hover {
    background: var(--hover-overlay);
}

.toggle-icon {
    flex-shrink: 0;
    font-size: 0.75rem;
    color: var(--text-secondary);
    transition: transform 0.2s;
}

.select-all-checkbox {
    flex-shrink: 0;
    cursor: pointer;
    width: 16px;
    height: 16px;
    accent-color: var(--accent);
}

.category-name {
    flex: 1;
    font-weight: 600;
    font-size: 0.9rem;
    color: var(--text-primary);
}

.skill-count {
    flex-shrink: 0;
    font-size: 0.8rem;
    color: var(--text-secondary);
    background: var(--bg-card);
    padding: 0.2rem 0.45rem;
    border-radius: 10px;
    font-weight: 500;
    border: 1px solid var(--border);
}

.category-checkboxes {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
    gap: 0.4rem;
    padding: 0.75rem;
    max-height: 0;
    overflow: hidden;
    opacity: 0;
    transition: max-height 0.3s ease, opacity 0.3s ease, padding 0.3s ease;
}

.collapsible-category.expanded .category-checkboxes {
    max-height: 1000px;
    opacity: 1;
}

.collapsible-category:not(.expanded) .category-checkboxes {
    padding: 0 0.75rem;
}

.skill-category-header {
    grid-column: 1 / -1;
    font-weight: 700;
    color: var(--text-primary);
    padding: 0.4rem 0.5rem;
    background: var(--bg-main);
    border-radius: 4px;
    margin-top: 0.4rem;
    font-size: 0.85rem;
}

/* ============================================================
   ACCORDION (resource skill editing)
   ============================================================ */
.skills-accordion { margin-top: 1rem; }

.accordion-item {
    margin-bottom: 0.4rem;
    border: 1px solid var(--border);
    border-radius: 6px;
    overflow: hidden;
}

.accordion-header {
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.65rem 0.9rem;
    background-color: var(--bg-main);
    border: none;
    cursor: pointer;
    font-weight: 600;
    font-size: 0.9rem;
    text-align: left;
    color: var(--text-primary);
    transition: background-color 0.15s ease;
}

.accordion-header:hover {
    background-color: var(--hover-overlay);
}

.accordion-header.active {
    background-color: rgba(0, 163, 255, 0.1);
    color: var(--accent);
}

.main-skill-badge {
    padding: 0.2rem 0.6rem;
    background-color: var(--accent);
    color: white;
    border-radius: 10px;
    font-size: 0.78rem;
    font-weight: 700;
}

.accordion-icon {
    margin-left: 0.5rem;
    font-size: 0.7rem;
    color: var(--text-secondary);
}

.accordion-content {
    padding: 0.9rem;
    background-color: var(--bg-card);
}

.sub-skill-edit-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 0.4rem;
    padding: 0.4rem 0.5rem;
    border-bottom: 1px solid var(--border);
}

.sub-skill-edit-item:last-child { border-bottom: none; }

.sub-skill-edit-item label {
    flex: 1;
    margin: 0;
    font-size: 0.875rem;
    color: var(--text-primary);
    cursor: help;
}

.sub-skill-input {
    width: 65px;
    padding: 0.35rem;
    border: 1px solid var(--border);
    border-radius: 4px;
    font-size: 0.875rem;
    text-align: center;
    background: var(--bg-input);
    color: var(--text-primary);
}

.sub-skill-input:focus {
    outline: none;
    border-color: var(--accent);
}

.no-subskills {
    color: var(--text-secondary);
    font-style: italic;
    margin: 0;
    font-size: 0.875rem;
}

/* ============================================================
   SUB-SKILL MANAGEMENT TAGS
   ============================================================ */
.sub-skills-list { margin-top: 0.75rem; }

.sub-skills-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
    margin-top: 0.4rem;
}

.sub-skill-tag {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.35rem 0.65rem;
    background-color: var(--bg-main);
    border: 1px solid var(--border);
    border-radius: 20px;
    font-size: 0.85rem;
    color: var(--text-primary);
}

.delete-sub-skill-btn,
.delete-skill-btn,
.delete-resource-btn {
    padding: 0;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background-color: var(--danger);
    color: white;
    border: none;
    cursor: pointer;
    font-size: 0.85rem;
    line-height: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
}

.delete-skill-btn,
.delete-resource-btn {
    position: absolute;
    top: 6px;
    right: 6px;
    width: 17px;
    height: 17px;
    opacity: 0.6;
    z-index: 10;
}

.delete-sub-skill-btn:hover,
.delete-skill-btn:hover,
.delete-resource-btn:hover {
    background-color: #c0392b;
    opacity: 1;
    transform: scale(1.1);
}

.edit-sub-skill-btn {
    padding: 0;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background-color: var(--accent);
    color: white;
    border: none;
    cursor: pointer;
    font-size: 0.7rem;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background-color 0.2s ease;
}

.edit-sub-skill-btn:hover { background-color: var(--accent-2); }

.save-sub-skill-btn {
    padding: 0;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background-color: var(--success);
    color: #1a1c1e;
    border: none;
    cursor: pointer;
    font-size: 0.8rem;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background-color 0.2s ease;
}

.save-sub-skill-btn:hover { filter: brightness(0.9); }

.cancel-sub-skill-btn {
    padding: 0;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background-color: var(--text-secondary);
    color: white;
    border: none;
    cursor: pointer;
    font-size: 0.8rem;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background-color 0.2s ease;
}

.cancel-sub-skill-btn:hover { filter: brightness(0.85); }

.sub-skill-edit-input {
    padding: 0.2rem 0.45rem;
    border: 1px solid var(--accent);
    border-radius: 4px;
    font-size: 0.875rem;
    min-width: 140px;
    background: var(--bg-input);
    color: var(--text-primary);
}

.sub-skill-edit-input:focus {
    outline: none;
    box-shadow: 0 0 0 2px rgba(0, 163, 255, 0.15);
}

.skill-edit-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 0.65rem;
    padding: 0.4rem 0.5rem;
    background: var(--bg-main);
    border-radius: 4px;
    border: 1px solid var(--border);
}

.skill-edit-item label {
    flex: 1;
    margin: 0;
    font-size: 0.875rem;
    color: var(--text-primary);
}

.skill-edit-item input {
    width: 75px;
}

#resourceSkillsEdit {
    margin: 0.75rem 0;
    max-height: 500px;
    overflow-y: auto;
}

#subSkillsManagement {
    margin-top: 0.75rem;
    padding-top: 0.75rem;
}

#subSkillsManagement h4 {
    margin-bottom: 0.75rem;
    color: var(--text-primary);
}

/* ============================================================
   RESOURCE TOOLTIP
   ============================================================ */
.resource-tooltip {
    position: fixed;
    background: var(--bg-nav);
    color: var(--text-primary);
    border: 1px solid var(--border);
    padding: 1.1rem;
    border-radius: 8px;
    min-width: 260px;
    max-width: 380px;
    z-index: 10000;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
    display: none;
    pointer-events: none;
    opacity: 0;
    transition: opacity 250ms ease-in;
}

.resource-tooltip.show {
    display: block;
    opacity: 1;
}

.resource-tooltip h5 {
    margin: 0 0 0.65rem 0;
    font-size: 0.9rem;
    border-bottom: 1px solid var(--border);
    padding-bottom: 0.45rem;
    color: var(--accent);
}

.resource-tooltip ul {
    list-style: none;
    padding: 0;
    margin: 0;
}

.resource-tooltip li {
    padding: 0.25rem 0;
    font-size: 0.82rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    color: var(--text-secondary);
}

.resource-tooltip .skill-level {
    margin-left: 0.4rem;
    padding: 0.1rem 0.4rem;
    border-radius: 3px;
    font-size: 0.72rem;
    font-weight: 700;
    background: rgba(0, 163, 255, 0.15);
    color: var(--accent);
}

.resource-tooltip .section-divider {
    margin: 0.75rem 0;
    border-top: 1px solid var(--border);
}

.resource-tooltip .gaps-section h5 {
    color: var(--danger);
}

/* ============================================================
   FOOTER
   ============================================================ */
footer {
    background-color: var(--bg-nav);
    border-top: 1px solid var(--border);
    color: var(--text-secondary);
    padding: 1.5rem 0;
    margin-top: 4rem;
    text-align: center;
    font-size: 0.875rem;
}

/* ============================================================
   RESPONSIVE
   ============================================================ */
@media (max-width: 768px) {
    .container { padding: 0 15px; }
    .header-brand h1 { font-size: 1.2rem; }
    .nav-btn { padding: 0.75rem 1rem; font-size: 0.82rem; }
    .management-grid { grid-template-columns: 1fr; }
    .metrics-grid { grid-template-columns: 1fr; }
    .theme-toggle span { display: none; }
}

/* ============================================================
   PRINT
   ============================================================ */
@media print {
    nav, footer, .management-card, .data-actions, .theme-toggle { display: none; }
    body { background: white; color: black; }
    .view { display: block !important; }
}
```

**Step 3: Commit**

```bash
git add frontend/styles.css
git commit -m "feat: restyle modals, management, charts, and remaining components"
```

---

### Task 6: Update HTML — header restructure + toggle button

**Files:**
- Modify: `frontend/index.html`

**Step 1: Add `data-theme="dark"` to the `<html>` tag**

Change:
```html
<html lang="en">
```
To:
```html
<html lang="en" data-theme="dark">
```

**Step 2: Replace the header block**

Find:
```html
    <!-- Header -->
    <header>
        <div class="container">
            <h1>Project Team Skills Matrix</h1>
            <p class="tagline">Team Capability Tracking & Skills Gap Analysis</p>
        </div>
    </header>
```

Replace with:
```html
    <!-- Header -->
    <header>
        <div class="container">
            <div class="header-brand">
                <h1>Project Team Skills Matrix</h1>
                <p class="tagline">Team Capability Tracking &amp; Skills Gap Analysis</p>
            </div>
            <button class="theme-toggle" id="themeToggle" aria-label="Toggle theme">
                <!-- Moon icon (shown in dark mode) -->
                <svg class="icon-moon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                </svg>
                <!-- Sun icon (shown in light mode) -->
                <svg class="icon-sun" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="5"/>
                    <line x1="12" y1="1" x2="12" y2="3"/>
                    <line x1="12" y1="21" x2="12" y2="23"/>
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                    <line x1="1" y1="12" x2="3" y2="12"/>
                    <line x1="21" y1="12" x2="23" y2="12"/>
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                </svg>
                <span>Light mode</span>
            </button>
        </div>
    </header>
```

**Step 3: Update the stylesheet version cache-bust**

Change `styles.css?v=45` to `styles.css?v=46` to force browsers to reload the new CSS.

**Step 4: Commit**

```bash
git add frontend/index.html
git commit -m "feat: restructure header with theme toggle button"
```

---

### Task 7: Add theme toggle JavaScript

**Files:**
- Modify: `frontend/script.js`

**Step 1: Add theme toggle logic at the top of script.js**

Insert the following block at the very top of `script.js` (before any existing code):

```javascript
// ============================================================
// THEME TOGGLE
// ============================================================
(function () {
    const html = document.documentElement;
    const stored = localStorage.getItem('theme');
    if (stored) html.setAttribute('data-theme', stored);

    function updateToggleLabel(theme) {
        const btn = document.getElementById('themeToggle');
        if (!btn) return;
        const span = btn.querySelector('span');
        if (span) span.textContent = theme === 'dark' ? 'Light mode' : 'Dark mode';
    }

    document.addEventListener('DOMContentLoaded', function () {
        updateToggleLabel(html.getAttribute('data-theme'));

        document.getElementById('themeToggle').addEventListener('click', function () {
            const current = html.getAttribute('data-theme');
            const next = current === 'dark' ? 'light' : 'dark';
            html.setAttribute('data-theme', next);
            localStorage.setItem('theme', next);
            updateToggleLabel(next);
            // Re-render charts with correct colours if they exist
            if (typeof updateChartTheme === 'function') updateChartTheme();
        });
    });
})();
```

**Step 2: Add a `updateChartTheme` helper function**

Search `script.js` for where Chart.js radar charts are created (look for `new Chart(`). After those chart creation blocks, add:

```javascript
function updateChartTheme() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const gridColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)';
    const labelColor = isDark ? '#a0aec0' : '#4a5568';

    [window._teamRadarChart, window._customRadarChart].forEach(function (chart) {
        if (!chart) return;
        const scales = chart.options.scales;
        if (scales && scales.r) {
            scales.r.grid.color = gridColor;
            scales.r.ticks.color = labelColor;
            scales.r.pointLabels.color = labelColor;
        }
        chart.update();
    });
}
```

**Step 3: Store chart references globally**

Search `script.js` for lines like:
```javascript
const teamRadarChart = new Chart(
```
and:
```javascript
const customRadarChart = new Chart(
```

Change them to also assign to `window._teamRadarChart` and `window._customRadarChart`:
```javascript
const teamRadarChart = window._teamRadarChart = new Chart(
```
```javascript
const customRadarChart = window._customRadarChart = new Chart(
```

**Step 4: Commit**

```bash
git add frontend/script.js
git commit -m "feat: add theme toggle logic and chart theme updates"
```

---

### Task 8: Final check and version bump

**Step 1: Open the app in a browser**

```
http://localhost:8098
```

Verify:
- Dark mode loads by default
- Toggle button appears top-right of header with moon icon
- Clicking it switches to light mode (sun icon appears, backgrounds invert)
- Preference persists on page refresh
- All 5 nav views render correctly in both modes
- Heatmap colours visible in both modes
- Radar charts render with correct label colours after toggle
- Modals open/close correctly
- No white flash on load

**Step 2: If running in Docker, rebuild**

```bash
docker stop skills-matrix-db
docker rm skills-matrix-db
docker build -t skills-matrix-db:latest .
docker run -d --name skills-matrix-db --network net_core -p 8098:80 --restart unless-stopped skills-matrix-db:latest
```

**Step 3: Final commit**

```bash
git add -A
git commit -m "feat: complete frontend redesign with dark/light theme toggle"
```

---

*End of plan.*
