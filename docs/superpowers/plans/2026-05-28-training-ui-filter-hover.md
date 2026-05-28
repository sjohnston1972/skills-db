# Training UI Filter Pills + Hover Stats — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a status filter to the assignments list, a per-segment names tooltip to the certification status chart, and a hover popover listing assigned users on each catalogue card.

**Architecture:** A single shared in-memory aggregation (`trainingState.byTrainingId`) populated from `/api/trainings/assignments/all` on Training-view load and refreshed after every assignment write. The chart, catalogue, and (transitively) the new filter all read from this map. Frontend-only — no backend changes.

**Tech Stack:** Vanilla JS, Chart.js 4.x, plain CSS. No build step. Single-file `frontend/script.js`; styles in `frontend/styles.css`; markup in `frontend/index.html`.

**Spec:** [docs/superpowers/specs/2026-05-28-training-ui-filter-hover-design.md](../specs/2026-05-28-training-ui-filter-hover-design.md)

**Deployment:** Frontend files only — hot-swap via `docker cp` into `/usr/share/nginx/html/` on the `skills-matrix-db` container. No process restart needed. nginx serves static files directly. Always `pg_dump` first per the project's no-volume-mount workflow, even though this change does not touch the DB.

---

## File map

| File | Action | Purpose |
|---|---|---|
| `frontend/script.js` | Modify | All JS changes: state additions, aggregation helper, fetch + refresh hooks, filter pill behavior, chart tooltip callbacks, catalogue popover logic |
| `frontend/index.html` | Modify | Add filter pill markup above `#trainingAssignmentsList`; add `data-training-id` on catalogue cards (rendered from JS, no HTML change there) |
| `frontend/styles.css` | Modify | New `.training-status-filter` styles, new `.training-card-popover` styles |

No new files. All three features share one aggregation, so they belong in the same script.js module that already owns the Training view.

---

## Task 1: Add shared aggregation state + loader

**Files:**
- Modify: `frontend/script.js` (state object at line ~4185; `renderTraining` at line ~4196; `loadAssignmentsForCurrent` at line ~4513; `saveTrainingAssignment` at line ~4684; `confirmDeleteAssignment` at line ~4614; `confirmDeleteTraining` at line ~4430)

This task adds the data layer that every subsequent task reads from. No UI changes yet — after this task, `trainingState.byTrainingId` is populated and refreshed, but nothing displays it. Verification is "open devtools console, type `trainingState.byTrainingId`, see a populated object".

- [ ] **Step 1.1: Extend `trainingState` with three new fields**

In `frontend/script.js`, replace the `trainingState` literal (around line 4185-4193):

```js
let trainingState = {
    catalogue: [],
    assignmentsResourceId: '',     // '' = ALL resources (default)
    assignments: [],
    activeTab: 'assignments',
    editingTrainingId: null,
    editingAssignmentId: null,
    catalogueSearch: '',
    // --- NEW (shared aggregation for filter / chart tooltip / catalogue popover) ---
    allAssignments: [],            // raw rows from /trainings/assignments/all
    byTrainingId: {},              // { [tid]: { achieved: [names], 'in-progress': [], planned: [], expired: [] } }
    statusFilter: new Set(['planned', 'in-progress', 'achieved', 'expired']),
};
```

- [ ] **Step 1.2: Add the aggregation helper + loader**

Insert these two functions immediately above `loadAssignmentsForCurrent` (currently at line ~4513). Place them so they are defined before any caller uses them:

```js
// Build the trainingId → { status: [resource_name, ...] } lookup used by the
// status-filter pills, the chart tooltip, and the catalogue card popover.
function buildByTrainingId(rows) {
    const out = {};
    for (const r of rows) {
        const bucket = out[r.training_id] || (out[r.training_id] = {
            achieved: [], 'in-progress': [], planned: [], expired: [],
        });
        if (bucket[r.status]) bucket[r.status].push(r.resource_name);
    }
    // Sort names alphabetically within each bucket for stable display.
    for (const tid of Object.keys(out)) {
        for (const k of Object.keys(out[tid])) {
            out[tid][k].sort((a, b) => a.localeCompare(b));
        }
    }
    return out;
}

// Always fetches the full team-wide assignment list (independent of the
// per-resource filter on the Assignments sub-tab). Populates trainingState
// fields used by the cert chart tooltip and catalogue card popover.
async function loadAllAssignmentsForOverview() {
    try {
        trainingState.allAssignments = await TrainingsAPI.assignmentsAll();
        trainingState.byTrainingId = buildByTrainingId(trainingState.allAssignments);
    } catch (err) {
        console.warn('loadAllAssignmentsForOverview failed:', err);
        // Keep previous values so existing tooltips/popovers still work.
    }
}
```

- [ ] **Step 1.3: Wire the loader into `renderTraining()`**

`renderTraining` currently calls `loadAssignmentsForCurrent()` then renders. Add a parallel fetch of the overview data. Replace lines 4206-4210:

```js
    bindTrainingListeners();
    await Promise.all([
        loadAssignmentsForCurrent(),
        loadAllAssignmentsForOverview(),
    ]);
    renderTrainingCatalogue();
    renderTrainingAssignments();
    applyTrainingTabState();
```

- [ ] **Step 1.4: Wire the loader into the three assignment-write paths**

In each of the following places, add `await loadAllAssignmentsForOverview();` AFTER `await loadAssignmentsForCurrent();` and BEFORE the existing render calls.

**(a) `saveTrainingAssignment` — around line 4684:**

Replace:
```js
        await loadAssignmentsForCurrent();
        renderTrainingAssignments();
        renderCertifications().catch(() => {});
        closeTrainingAssignModal();
        showToast(trainingState.editingAssignmentId ? 'Assignment updated' : 'Assignment created', 'success');
```
With:
```js
        await loadAssignmentsForCurrent();
        await loadAllAssignmentsForOverview();
        renderTrainingAssignments();
        renderCertifications().catch(() => {});
        closeTrainingAssignModal();
        showToast(trainingState.editingAssignmentId ? 'Assignment updated' : 'Assignment created', 'success');
```

(No `renderTrainingCatalogue()` call — catalogue cards carry only static training fields plus `data-training-id`. Hover popovers read `trainingState.byTrainingId` live at hover time, which we just refreshed.)

**(b) `confirmDeleteAssignment` — around line 4614:**

Replace:
```js
        await TrainingsAPI.deleteAssignment(id);
        await loadAssignmentsForCurrent();
        renderTrainingAssignments();
        renderCertifications().catch(() => {});
        showToast('Unassigned', 'success');
```
With:
```js
        await TrainingsAPI.deleteAssignment(id);
        await loadAssignmentsForCurrent();
        await loadAllAssignmentsForOverview();
        renderTrainingAssignments();
        renderCertifications().catch(() => {});
        showToast('Unassigned', 'success');
```

**(c) `confirmDeleteTraining` — around line 4430:**

Replace:
```js
        await TrainingsAPI.delete(id);
        trainingState.catalogue = trainingState.catalogue.filter(t => t.id !== id);
        renderTrainingCatalogue();
        // Refresh current resource's assignments — one may have just disappeared
        await loadAssignmentsForCurrent();
        renderTrainingAssignments();
        showToast(`Deleted "${item.name}"`, 'success');
```
With:
```js
        await TrainingsAPI.delete(id);
        trainingState.catalogue = trainingState.catalogue.filter(t => t.id !== id);
        // Refresh current resource's assignments + the team-wide overview —
        // a delete cascades to resource_trainings.
        await loadAssignmentsForCurrent();
        await loadAllAssignmentsForOverview();
        renderTrainingCatalogue();
        renderTrainingAssignments();
        renderCertifications().catch(() => {});
        showToast(`Deleted "${item.name}"`, 'success');
```

- [ ] **Step 1.5: Manual verification**

1. Reload the Training view in the browser.
2. Open devtools console, run `trainingState.byTrainingId` — expect an object keyed by numeric training ids, each value an object with four status keys mapping to arrays of resource names.
3. Spot-check one entry against the DB. Steven Johnston should appear under the Meraki training's `achieved` bucket.

Expected console output shape:
```js
{ 1: { achieved: ['Alice Tan', 'Steven Johnston'], 'in-progress': [], planned: [], expired: [] },
  2: { ... }, ... }
```

- [ ] **Step 1.6: Commit**

```bash
git add frontend/script.js
git commit -m "feat(training): add shared byTrainingId aggregation + overview loader"
```

---

## Task 2: Cert chart tooltip — show names per hovered status

**Files:**
- Modify: `frontend/script.js` — `renderCertifications` at lines ~4265-4358

After this task, hovering a bar segment shows the list of resources in that (training, status) cell.

- [ ] **Step 2.1: Capture training_id when aggregating chart entries**

In `renderCertifications`, the inner loop builds `byTraining` keyed by training name. Add the training id so the tooltip callback can look it up in `trainingState.byTrainingId`.

Replace the existing byTraining build (currently around lines 4279-4285):
```js
    // Group by training_name, count statuses
    const byTraining = new Map();
    assignments.forEach(a => {
        const key = a.training_name;
        if (!byTraining.has(key)) byTraining.set(key, { planned: 0, 'in-progress': 0, achieved: 0, expired: 0, code: a.training_code, vendor: a.vendor });
        const bucket = byTraining.get(key);
        if (bucket[a.status] !== undefined) bucket[a.status] += 1;
    });
```
With:
```js
    // Group by training_name, count statuses, and record one training_id per
    // bucket so tooltip callbacks can look the row up in byTrainingId.
    const byTraining = new Map();
    assignments.forEach(a => {
        const key = a.training_name;
        if (!byTraining.has(key)) byTraining.set(key, {
            id: a.training_id,
            planned: 0, 'in-progress': 0, achieved: 0, expired: 0,
            code: a.training_code, vendor: a.vendor,
        });
        const bucket = byTraining.get(key);
        if (bucket[a.status] !== undefined) bucket[a.status] += 1;
    });
```

(The `.map([name, c]) => ({ name, ...c, total: ... })` immediately below already spreads everything in the bucket, so `id` will flow through to `entries[].id` with no further changes.)

- [ ] **Step 2.2: Add tooltip callbacks to the Chart.js options**

In `renderCertifications`, the `new Chart(...)` call (around lines 4307-4328) has a `plugins: { legend: { position: 'bottom' } }` block. Replace that block to add tooltip callbacks. The full replaced options object is:

```js
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: { stacked: true, ticks: { precision: 0 } },
                    y: { stacked: true },
                },
                plugins: {
                    legend: { position: 'bottom' },
                    tooltip: {
                        callbacks: {
                            title(items) {
                                if (!items.length) return '';
                                const { label, dataset } = items[0];
                                // dataset.label = 'Achieved' | 'In progress' | 'Planned' | 'Expired'
                                const count = items[0].parsed.x;
                                return `${label} · ${dataset.label} (${count})`;
                            },
                            label() {
                                // Suppress the default "Achieved: 5" line — we put it in the title instead.
                                return '';
                            },
                            afterBody(items) {
                                if (!items.length) return [];
                                const { dataIndex, datasetIndex } = items[0];
                                const statuses = ['achieved', 'in-progress', 'planned', 'expired'];
                                const status = statuses[datasetIndex];
                                const entry = entries[dataIndex];
                                const names = (trainingState.byTrainingId[entry.id] || {})[status] || [];
                                if (!names.length) return ['(no resources)'];
                                // Show up to 25 names then "+N more" — keeps the tooltip from blowing up.
                                const MAX = 25;
                                if (names.length <= MAX) return names.map(n => '• ' + n);
                                return [...names.slice(0, MAX).map(n => '• ' + n), `…and ${names.length - MAX} more`];
                            },
                        },
                    },
                },
            },
```

Note: `entries` is the local `const entries = Array.from(...)` defined above the chart creation — it is in scope inside the callbacks because they close over it.

- [ ] **Step 2.3: Manual verification**

1. Hot-swap script.js into the container (deferred to the final deploy step) OR open the local file via browser if you have a dev setup.
2. On the Certifications sub-tab, hover the green Achieved segment on "CCNP Enterprise". The tooltip header should read `CCNP Enterprise · Achieved (5)` and below it a bullet list of the 5 names including Steven Johnston.
3. Hover the blue In-progress segment of the same bar. Steven Johnston should NOT appear (he is achieved). For Steven, the only in-progress training is "Cisco SD-WAN Implementation".
4. Hover a segment with zero count (if any are visible) — should not crash; tooltip stays usable.

- [ ] **Step 2.4: Commit**

```bash
git add frontend/script.js
git commit -m "feat(training): cert chart tooltip lists resources per status"
```

---

## Task 3: Catalogue card hover popover

**Files:**
- Modify: `frontend/script.js` — `renderTrainingCatalogue` at line ~4389; new functions for popover lifecycle; new listener bindings in `bindTrainingListeners` at line ~4213
- Modify: `frontend/styles.css` — add `.training-card-popover` block

After this task, hovering a catalogue card shows a popover beside it listing every resource on that training, grouped by status.

- [ ] **Step 3.1: Add `data-training-id` to each catalogue card**

In `renderTrainingCatalogue`, the per-card template (around line 4394) currently reads:
```js
                    <div class="training-card" data-id="${t.id}">
```
Change it to:
```js
                    <div class="training-card" data-id="${t.id}" data-training-id="${t.id}">
```

(`data-id` is kept for the existing Edit/Delete button delegation which reads `dataset.id` on those inner buttons; the new `data-training-id` is for the hover handler.)

- [ ] **Step 3.2: Add popover element + lifecycle functions**

Append these functions to `frontend/script.js` immediately after `renderTrainingCatalogue` (i.e. before `onCatalogueClick` at line ~4415):

```js
// One reusable popover node, lazily created and appended to <body>.
let trainingCardPopoverEl = null;
function getTrainingCardPopover() {
    if (trainingCardPopoverEl) return trainingCardPopoverEl;
    const el = document.createElement('div');
    el.className = 'training-card-popover';
    el.setAttribute('role', 'tooltip');
    el.style.display = 'none';
    document.body.appendChild(el);
    trainingCardPopoverEl = el;
    return el;
}

function buildTrainingCardPopoverHtml(tid) {
    const buckets = trainingState.byTrainingId[tid];
    if (!buckets) return '<p class="empty">No one has been assigned this training yet.</p>';

    const order = [
        ['achieved',    'Achieved'],
        ['in-progress', 'In progress'],
        ['planned',     'Planned'],
        ['expired',     'Expired'],
    ];
    const sections = order
        .filter(([k]) => (buckets[k] || []).length > 0)
        .map(([k, label]) => `
            <div class="tcp-section tcp-${k}">
                <h5>${label} <span class="tcp-count">${buckets[k].length}</span></h5>
                <ul>${buckets[k].map(n => `<li>${escapeHtml(n)}</li>`).join('')}</ul>
            </div>
        `).join('');

    if (!sections) return '<p class="empty">No one has been assigned this training yet.</p>';
    return sections;
}

function showTrainingCardPopover(cardEl) {
    const tid = parseInt(cardEl.dataset.trainingId, 10);
    if (!Number.isFinite(tid)) return;
    const pop = getTrainingCardPopover();
    pop.innerHTML = buildTrainingCardPopoverHtml(tid);
    pop.style.display = 'block';

    // Position: prefer to the right of the card; if no room, drop below it.
    const r = cardEl.getBoundingClientRect();
    const popW = 280;          // matches CSS max-width
    const margin = 8;
    let left = r.right + margin;
    let top = r.top;
    if (left + popW > window.innerWidth - margin) {
        // No room on the right — place below.
        left = Math.max(margin, Math.min(r.left, window.innerWidth - popW - margin));
        top = r.bottom + margin;
    }
    pop.style.left = (left + window.scrollX) + 'px';
    pop.style.top  = (top  + window.scrollY) + 'px';
}

function hideTrainingCardPopover() {
    if (trainingCardPopoverEl) trainingCardPopoverEl.style.display = 'none';
}
```

- [ ] **Step 3.3: Bind delegated hover listeners**

In `bindTrainingListeners` (line ~4213), the catalogue list already has a delegated click handler bound (line ~4256: `document.getElementById('trainingCatalogueList').addEventListener('click', onCatalogueClick);`). Add hover delegation immediately after that line:

```js
    const cat = document.getElementById('trainingCatalogueList');
    cat.addEventListener('mouseover', (e) => {
        const card = e.target.closest('.training-card[data-training-id]');
        if (!card) return;
        if (cat._lastHoverCard === card) return;   // avoid re-show on inner mouseover
        cat._lastHoverCard = card;
        showTrainingCardPopover(card);
    });
    cat.addEventListener('mouseout', (e) => {
        const card = e.target.closest('.training-card[data-training-id]');
        if (!card) return;
        // Only hide when the cursor genuinely leaves the card (not when crossing children).
        if (e.relatedTarget && card.contains(e.relatedTarget)) return;
        cat._lastHoverCard = null;
        hideTrainingCardPopover();
    });
```

(Use `mouseover`/`mouseout` because they bubble through delegation; `mouseenter`/`mouseleave` do not.)

- [ ] **Step 3.4: Add popover CSS**

Append to `frontend/styles.css`:

```css
/* ---------- Catalogue card hover popover ---------- */
.training-card-popover {
    position: absolute;
    max-width: 280px;
    max-height: 360px;
    overflow-y: auto;
    background: var(--bg-elevated, #1f2230);
    color: var(--text-primary, #e5e7eb);
    border: 1px solid var(--border-color, rgba(255,255,255,0.08));
    border-radius: 8px;
    padding: 0.75rem 0.9rem;
    box-shadow: 0 12px 32px rgba(0,0,0,0.45);
    z-index: 1000;
    font-size: 0.85rem;
    line-height: 1.35;
    pointer-events: none;  /* hover-only — the user shouldn't have to chase it */
}
.training-card-popover .empty {
    margin: 0;
    color: var(--text-secondary, #9aa3b2);
    font-style: italic;
}
.training-card-popover .tcp-section { margin-bottom: 0.6rem; }
.training-card-popover .tcp-section:last-child { margin-bottom: 0; }
.training-card-popover .tcp-section h5 {
    margin: 0 0 0.25rem;
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--text-secondary, #9aa3b2);
    display: flex;
    align-items: center;
    gap: 0.4rem;
}
.training-card-popover .tcp-count {
    background: rgba(255,255,255,0.08);
    color: var(--text-primary, #e5e7eb);
    border-radius: 999px;
    padding: 0 0.4rem;
    font-size: 0.7rem;
    font-weight: 600;
}
.training-card-popover ul {
    list-style: none;
    margin: 0;
    padding: 0;
}
.training-card-popover li { padding: 0.1rem 0; }
.training-card-popover .tcp-achieved h5    { color: rgb(34, 197, 94); }
.training-card-popover .tcp-in-progress h5 { color: rgb(96, 165, 250); }
.training-card-popover .tcp-planned h5     { color: rgb(160, 174, 192); }
.training-card-popover .tcp-expired h5     { color: rgb(239, 68, 68); }
```

- [ ] **Step 3.5: Manual verification**

1. Hover the "Cisco Meraki Solutions Specialist" card — popover appears beside the card listing Steven Johnston under Achieved.
2. Move the cursor off the card — popover disappears.
3. Hover a card whose training has no assignments (e.g. add a new training in the catalogue) — popover shows "No one has been assigned this training yet."
4. Hover a card near the right edge of the viewport — popover drops below the card instead of overflowing.
5. Hover a card with many assignees — popover scrolls within its 360px max-height.

- [ ] **Step 3.6: Commit**

```bash
git add frontend/script.js frontend/styles.css
git commit -m "feat(training): catalogue card hover shows assigned users by status"
```

---

## Task 4: Status filter pills on the assignments list

**Files:**
- Modify: `frontend/index.html` — add filter pill markup above `#trainingAssignmentsList` (line ~356)
- Modify: `frontend/script.js` — bind pill click handlers in `bindTrainingListeners`; filter groups in `renderTrainingAssignments` at line ~4549
- Modify: `frontend/styles.css` — add `.training-status-filter` block

After this task, four toggle pills sit above the assignments list. All four are active by default. Clicking a pill hides the corresponding group; clicking again brings it back.

- [ ] **Step 4.1: Add the filter pill markup**

In `frontend/index.html`, the assignments sub-tab currently has:
```html
            <!-- Assignments sub-view -->
            <div class="t-pane t-pane-active" data-t-pane="assignments">
                <div class="flex-row-gap" style="margin-bottom: 1rem;">
                    <div class="hm-control-group">
                        <span class="hm-label">Resource:</span>
                        <select id="trainingResourceSelect"></select>
                    </div>
                    <button class="btn-primary" id="trainingAssignBtn">Assign</button>
                </div>
                <div id="trainingAssignmentsList" class="training-assignments"></div>
            </div>
```

Insert the filter row between the resource-selector row and the list. The final block is:

```html
            <!-- Assignments sub-view -->
            <div class="t-pane t-pane-active" data-t-pane="assignments">
                <div class="flex-row-gap" style="margin-bottom: 1rem;">
                    <div class="hm-control-group">
                        <span class="hm-label">Resource:</span>
                        <select id="trainingResourceSelect"></select>
                    </div>
                    <button class="btn-primary" id="trainingAssignBtn">Assign</button>
                </div>
                <div class="training-status-filter" role="group" aria-label="Filter by status">
                    <span class="tsf-label">Show:</span>
                    <button class="tsf-pill is-on" data-status="planned"     type="button">Planned</button>
                    <button class="tsf-pill is-on" data-status="in-progress" type="button">In progress</button>
                    <button class="tsf-pill is-on" data-status="achieved"    type="button">Achieved</button>
                    <button class="tsf-pill is-on" data-status="expired"     type="button">Expired</button>
                </div>
                <div id="trainingAssignmentsList" class="training-assignments"></div>
            </div>
```

- [ ] **Step 4.2: Bind pill click handlers**

In `bindTrainingListeners` (line ~4213), add this after the existing tab-switching block (just below the closing `});` of the tab-switching forEach, around line 4223):

```js
    // Status filter pills (assignments sub-tab only).
    document.querySelectorAll('#training-view .tsf-pill').forEach(btn => {
        btn.addEventListener('click', () => {
            const s = btn.dataset.status;
            if (trainingState.statusFilter.has(s)) {
                trainingState.statusFilter.delete(s);
                btn.classList.remove('is-on');
            } else {
                trainingState.statusFilter.add(s);
                btn.classList.add('is-on');
            }
            renderTrainingAssignments();
        });
    });
```

- [ ] **Step 4.3: Filter groups in `renderTrainingAssignments`**

`renderTrainingAssignments` currently (line ~4549) calls `Object.entries(groups).filter(([, arr]) => arr.length).map(...)`. Extend the filter to also drop statuses not in `statusFilter`:

Replace:
```js
    list.innerHTML = Object.entries(groups).filter(([, arr]) => arr.length).map(([status, arr]) => `
```
With:
```js
    const visibleGroups = Object.entries(groups)
        .filter(([status, arr]) => arr.length && trainingState.statusFilter.has(status));

    if (visibleGroups.length === 0 && items.length > 0) {
        list.innerHTML = '<p class="empty">No assignments match the current status filter.</p>';
        return;
    }

    list.innerHTML = visibleGroups.map(([status, arr]) => `
```

(The existing empty-state path for `items.length === 0` higher up in the function is untouched — it handles the "no assignments at all" case.)

- [ ] **Step 4.4: Add filter pill CSS**

Append to `frontend/styles.css`:

```css
/* ---------- Status filter pills (assignments sub-tab) ---------- */
.training-status-filter {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
    margin-bottom: 1rem;
}
.training-status-filter .tsf-label {
    color: var(--text-secondary, #9aa3b2);
    font-size: 0.85rem;
    margin-right: 0.2rem;
}
.tsf-pill {
    appearance: none;
    border: 1px solid var(--border-color, rgba(255,255,255,0.12));
    background: transparent;
    color: var(--text-secondary, #9aa3b2);
    padding: 0.3rem 0.75rem;
    border-radius: 999px;
    font-size: 0.85rem;
    cursor: pointer;
    transition: background 0.12s, color 0.12s, border-color 0.12s, opacity 0.12s;
    opacity: 0.55;
}
.tsf-pill:hover { opacity: 0.85; }
.tsf-pill.is-on { opacity: 1; }
.tsf-pill.is-on[data-status="achieved"]    { background: rgba(22, 163, 74, 0.22); color: rgb(34, 197, 94); border-color: rgba(34, 197, 94, 0.5); }
.tsf-pill.is-on[data-status="in-progress"] { background: rgba(37, 99, 235, 0.22); color: rgb(96, 165, 250); border-color: rgba(96, 165, 250, 0.5); }
.tsf-pill.is-on[data-status="planned"]     { background: rgba(160, 174, 192, 0.22); color: rgb(203, 213, 225); border-color: rgba(203, 213, 225, 0.5); }
.tsf-pill.is-on[data-status="expired"]     { background: rgba(220, 38, 38, 0.22); color: rgb(239, 68, 68); border-color: rgba(239, 68, 68, 0.5); }
```

- [ ] **Step 4.5: Manual verification**

1. Open the Training view → Assignments sub-tab. Four colored pills sit above the list, all "on".
2. Click "Planned" — pill dims; the Planned section of the list disappears. Other sections remain.
3. Click "Planned" again — section returns.
4. Click all four pills off — list shows "No assignments match the current status filter."
5. Re-enable one pill — corresponding group returns.
6. Switch to Catalogue or Certifications sub-tab — filter pills are NOT shown there. Switch back — pills retain their previous on/off state (in-memory).
7. Reload the page — pills reset to all-on (no persistence by design).

- [ ] **Step 4.6: Commit**

```bash
git add frontend/index.html frontend/script.js frontend/styles.css
git commit -m "feat(training): add status filter pills to assignments list"
```

---

## Task 5: End-to-end manual verification + deploy

**Files:** none (verification + deploy only)

- [ ] **Step 5.1: Final integration test**

Walk through the spec's acceptance checks, in order:

1. **Filter pills** — toggle each pill independently; only its group disappears. Toggle all four off → empty-state message. Re-enable any → that group returns.
2. **Chart tooltip** — on Certifications sub-tab, hover the green "Achieved" segment of "CCNP Enterprise". Tooltip header reads `CCNP Enterprise · Achieved (5)`. Bullet list includes Steven Johnston. Hover the blue "In progress" segment — Steven is absent (only "Cisco SD-WAN Implementation" is in-progress for him).
3. **Catalogue popover** — hover the "Cisco Meraki Solutions Specialist" card. Popover appears showing Steven Johnston under "Achieved".
4. **Refresh integration** — edit one of Steven's assignments via the Assignments tab modal, change status, save. Without switching tabs, switch to Catalogue → hover that training's card → popover reflects the new status. Switch to Certifications → chart reflects the new status. Switch to Assignments → list reflects the new status (and respects the current filter).
5. **No regressions** — Resource filter dropdown still scopes the assignments list correctly. Edit/Delete training still work from the catalogue cards. Edit/Unassign still work from the assignment cards.

- [ ] **Step 5.2: Pre-deploy backup**

Per the no-volume-mount workflow:

```bash
mkdir -p backups
docker exec skills-matrix-db pg_dump -U skillsuser skills_matrix > "backups/skills_matrix_$(date +%Y%m%d_%H%M%S).sql"
ls -lh backups/ | tail -3
```

Expected: a fresh `.sql` file, non-empty (likely 50–500 KB).

- [ ] **Step 5.3: Hot-swap frontend files into the container**

```bash
docker cp frontend/script.js  skills-matrix-db:/usr/share/nginx/html/script.js
docker cp frontend/index.html skills-matrix-db:/usr/share/nginx/html/index.html
docker cp frontend/styles.css skills-matrix-db:/usr/share/nginx/html/styles.css
```

No process restart — nginx serves these directly. Hard-reload the browser tab (Ctrl+F5) to bust any client-side cache.

- [ ] **Step 5.4: Health check**

```bash
curl -s http://localhost:8098/api/health
```

Expected: `{"status":"ok",...}` or equivalent — confirms the backend is still alive (this change shouldn't have touched it, but verify).

- [ ] **Step 5.5: Commit nothing** — this task is verification only. All code commits happened in tasks 1–4. If the manual integration test surfaced a bug, return to the relevant task, fix, and amend that task's commit (or add a new commit on top).

---

## Out of scope (re-stated from the spec)

- No backend endpoint changes.
- No persistence of filter state across sessions.
- No keyboard activation for the popover.
- No tooltip on assignment cards themselves.
- No filter UI on the Catalogue or Certifications sub-tabs.
