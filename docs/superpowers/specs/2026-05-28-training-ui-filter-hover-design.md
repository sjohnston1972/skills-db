# Training UI: status filter + hover stats — design

**Date:** 2026-05-28
**Scope:** Frontend-only changes to `frontend/script.js`, `frontend/index.html`, `frontend/styles.css`.
**Out of scope:** Backend API changes, persistence of UI state across sessions.

## Motivation

Three small additions to the Training view, all surfaced by the user in the same request:

1. **Filter assignments by status** — when scanning the assignments list, easily hide groups the user does not currently care about (e.g. show only "Achieved").
2. **See who has each cert on the chart** — the "Certification Status Across the Team" bar chart shows counts only. Users want to know *which people* make up a given segment.
3. **See who has each cert on a catalogue card** — same need, accessed from the Catalogue sub-tab where the user is browsing trainings rather than people.

Companion to the bug fixes shipped earlier in the same session (chart now refreshes on save; chart no longer slices to top-12 trainings).

## Decisions taken during brainstorming

| Question | Answer |
|---|---|
| Filter UI style | Multi-select toggle pills (4 pills, all on by default) |
| Filter scope | Assignments list only — does not alter chart or catalogue |
| Filter persistence | In-memory for the session; not localStorage |
| Chart tooltip content | Names for the *hovered status* of the hovered training (segment-specific) |
| Catalogue card hover content | All assigned users grouped by status (Achieved / In progress / Planned / Expired) |
| Catalogue popover trigger | Hover (mouseenter / mouseleave), positioned beside the card |
| Data source | Reuse existing `/api/trainings/assignments/all` endpoint — no new backend |

## Architecture

A single shared aggregation in `trainingState`, computed once when the Training view loads and refreshed after any assignment write:

```js
trainingState.allAssignments    // raw array from TrainingsAPI.assignmentsAll()
trainingState.byTrainingId      // { [tid]: { achieved: [...names], 'in-progress': [...], planned: [...], expired: [...] } }
trainingState.statusFilter      // Set<'planned'|'in-progress'|'achieved'|'expired'> — all 4 by default
```

Aggregation lives next to `loadAssignmentsForCurrent()` in `frontend/script.js`. A new helper `loadAllAssignmentsForOverview()` fetches the team-wide list independently of the per-resource filter, then computes `byTrainingId`.

Refresh hooks (same as the earlier chart-refresh fix):
- Initial `renderTraining()`
- After `saveTrainingAssignment()` (create or update)
- After `confirmDeleteAssignment()` (unassign)
- After `confirmDeleteTraining()` (catalogue delete cascades to assignments)

The chart, catalogue, and (transitively) the filter all read from this map. No risk of one view going stale while another refreshes.

## Components

### 1. Status filter pills

**HTML:** A new `.training-status-filter` div above `#trainingAssignmentsList`, containing 4 buttons with `data-status="planned|in-progress|achieved|expired"`. Each button toggles an `is-on` class.

**JS:** Click handler bound once in `bindTrainingListeners()`. Toggles the status in `trainingState.statusFilter` (a `Set`) and calls `renderTrainingAssignments()`.

**Render integration:** `renderTrainingAssignments()` already groups by status (line ~4543). Add a filter step before rendering each group: `if (!trainingState.statusFilter.has(status)) return ''`.

**Empty state:** When the underlying list has items but the filter hides them all, show "No assignments match the current status filter."

**Default:** All four statuses in the Set. Users who never click a pill see today's behavior.

### 2. Chart tooltip extension

**Chart.js options:** Add `plugins.tooltip.callbacks.afterBody` to the existing options block.

**Lookup:** Each entry in the chart's `entries` array carries the training name today. Add the training `id` to that object (one-line change in the byTraining aggregation around line 4282). In the tooltip callback:

```js
afterBody(items) {
    const { dataIndex, datasetIndex } = items[0];
    const status = ['achieved', 'in-progress', 'planned', 'expired'][datasetIndex];
    const tid = entries[dataIndex].id;
    const names = trainingState.byTrainingId[tid]?.[status] ?? [];
    if (!names.length) return ['', '(no resources in this status)'];
    return ['', ...names.map(n => '  • ' + n)];
}
```

**Title customization (optional polish):** `tooltip.callbacks.title` already reads the y-axis label (training name); add the status label so the tooltip header reads "CCNP Enterprise · Achieved (5)".

**Styling:** Uses Chart.js's native tooltip styling — consistent with the rest of the chart, no new CSS surface.

### 3. Catalogue card hover popover

**HTML:** Each `.training-card` rendered by `renderTrainingCatalogue()` gains `data-training-id="<id>"`.

**Popover element:** A single global `<div id="trainingCardPopover">` appended to `<body>` on first hover, kept alive but hidden between hovers. Reusing one DOM node avoids per-card bloat.

**Event handling:** Delegated `mouseenter` / `mouseleave` listeners on `#trainingCatalogueList`. On enter:
- Look up `trainingState.byTrainingId[tid]`.
- Build content: for each non-empty status bucket, a heading and a bullet list of names. If all buckets are empty, show "No one has been assigned this training yet."
- Position absolutely beside the hovered card, clamping to the viewport.

On leave: hide the popover.

**Styling:** Reuse existing tooltip classes from the project's recent "compact tooltip" work (commit `1f37acb`) where possible. Add `.training-card-popover` if any specific tweaks are needed (status section headers, scroll on overflow).

## Data flow

```
User opens Training view
  └─ renderTraining()
        └─ loadAllAssignmentsForOverview()   ← NEW
        └─ buildByTrainingId()                ← NEW (pure function)
        └─ renderTrainingCatalogue()          (cards now carry data-training-id)
        └─ renderTrainingAssignments()        (now respects statusFilter)
        └─ renderCertifications() when on certs tab

User saves / deletes an assignment
  └─ saveTrainingAssignment() | confirmDeleteAssignment()
        └─ loadAllAssignmentsForOverview()    ← NEW (data is now stale)
        └─ buildByTrainingId()                ← NEW
        └─ renderCertifications()             (already wired in this session's earlier fix)
        └─ renderTrainingAssignments()

User clicks a filter pill
  └─ toggle status in trainingState.statusFilter
  └─ renderTrainingAssignments()

User hovers a chart bar segment
  └─ Chart.js fires afterBody callback
  └─ Read trainingState.byTrainingId for that (training, status)

User hovers a catalogue card
  └─ mouseenter handler reads trainingState.byTrainingId for that training
  └─ Populates and positions #trainingCardPopover
```

## Error handling

| Failure mode | Behavior |
|---|---|
| `loadAllAssignmentsForOverview()` rejects (API down) | Leave previous `byTrainingId` in place, log to console. Tooltips and popovers continue to show the last-known data. |
| Filter pill clicked with empty list | No-op visually. |
| Hover on a card whose training has no assignments | Popover shows "No one has been assigned this training yet." |
| Tooltip on a chart segment with zero count | `afterBody` returns "(no resources in this status)". Should not normally happen since zero-count segments are not hovered, but defensive against Chart.js edge cases. |

## Testing

The repo has no JS test framework today. Verification is manual via the project's `run` skill (hot-swap to the live container, open the Training view in a browser).

**Acceptance checks:**
1. Filter pills: click each pill independently; only its group's `<section>` collapses. Toggle all four off → "No assignments match the current status filter" appears. Re-enable any pill → that group returns.
2. Chart tooltip: hover the green Achieved segment on "CCNP Enterprise" → tooltip lists exactly the achieved resources (Steven Johnston should appear). Hover the blue In-progress segment of the same bar → Steven does *not* appear (since he is achieved, not in-progress).
3. Catalogue popover: hover the "Cisco Meraki Solutions Specialist" card → popover shows Steven Johnston under "Achieved" (this validates the top-12-cap fix is no longer hiding low-volume certs from the hover stats either).
4. Refresh integration: mark a new resource as "Achieved" on a training via the assignments tab → without switching tabs, switch to the Catalogue tab, hover that training's card → the new resource appears in the popover.

## Deliberate non-goals

- No backend endpoint changes.
- No persistence of filter state across sessions / page reloads.
- No keyboard activation for the popover.
- No tooltip on assignment cards themselves (the cards already show resource_name inline).
- No filter UI on the Catalogue or Certifications sub-tabs (filter scope is explicitly "assignments list only").
