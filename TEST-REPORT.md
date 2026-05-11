# Skills Matrix (full-stack) — Test Report & Improvement Ideas
Date: 2026-05-11
Tested by: Playwright (Chromium, headless) against `skills-matrix-db` (port 8098)
Auth: HTTP basic via nginx (admin / skillsadmin2024)
Test scripts: `C:\docker\net-core\playwright\scripts\skillsdb_full_test.py`, `skillsdb_inspect.py`
Artifacts: `C:\docker\net-core\web-projects\skills-db\__test_results\`

---

## Final score

**38 pass / 0 fail / 0 warn** (of 38) — after one frontend bug was fixed.

API-level smoke tests, dashboard, heatmap, custom radar, resources, skills, settings/admin-users, export, theme toggle — all green. Auth is enforced (`401` without creds, `200` with).

---

## Relationship to `web-projects/skills`

Two separate codebases that share an origin (both generated from `Project Services Engineers Skills Matrix.xlsx`). They are **not** filesystem-linked — different `styles.css` hashes (`1fe8e8…` vs `ab8d55…`), different layouts, different storage. The fix you made on `web-projects/skills/` happened to resolve the page you were viewing (`skills.clydeford.net`, served from that folder by the `web-projects` nginx) but had no effect on `skills-matrix-db` (port 8098), which has its own polished frontend that does **not** have the same flex-shrink bug — it uses a `max-height` transition instead.

---

## Bug found and fixed

### Custom Radar sub-skill selector goes stale after the first visit
- **Location:** `skills-db\frontend\script.js` (line ~840), `renderCustomRadar()`.
- **Symptom:** First visit to **Custom Radar** populates the sub-skill checkbox tree from the API. Every subsequent visit short-circuits because `customRadarInitialized` is `true`, so newly added/renamed/deleted sub-skills are invisible there until you hard-reload the page.
- **Fix applied:**
  ```js
  async function renderCustomRadar() {
      await populateSubSkillCheckboxes();   // always refresh
      if (!customRadarInitialized) {
          setupCustomChartEventListeners(); // attach only once
          customRadarInitialized = true;
      }
  }
  ```
- The file was also copied into the running container; `index.html` cache-buster bumped to `?v=87`.
- **Verified:** test step *"Custom-radar selector picks up new sub-skill"* now passes.

---

## What was tested (38 scenarios)

| Area | Coverage |
|------|----------|
| **API** | `/api/health` (DB connected), `/api/data` (shape + counts), basic-auth 401 enforcement, CRUD endpoints for resources / skills / sub-skills / admin users |
| **Dashboard** | All 4 metric cards populated (resources, skills, avg, top gap), team radar drawn, top/gap lists |
| **Heatmap** | 192 cells render across 5 distinct level classes, sort-by-avg works, dash-coded "no rating" cells |
| **Custom Radar** | Sub-skill selector layout intact (10 categories, none crushed), select-all per category, search filter, Update Chart draws, Clear All clears |
| **Resources view** | 16 cards render, search empty-state, **View** opens profile modal with per-resource radar chart |
| **Skills view** | All 11 skill cards render |
| **Settings** | Admin user list, add admin via UI (verified appears in list), API-side delete |
| **Resource CRUD** | API-created resource appears in dashboard count + resources list; edit modal opens with all 193 skill inputs; API-side delete returns dashboard count to baseline |
| **Skill CRUD** | API-created skill appears in Skills view, excluded from Custom Radar selector when empty, included after sub-skill is added (regression for the fix above), API-side delete cascades |
| **Misc** | Theme toggle (dark→light), JSON export (`skills-matrix-2026-05-11.json`) |

---

## Findings worth your attention (not test failures)

### Architecture / behaviour

1. **5-second client-side data cache.** `getData()` in `script.js` caches all data for 5000 ms. The UI invalidates correctly on its own mutations (every mutating function calls `clearDataCache()`), but if a second admin makes changes via the API or a second browser, your view will lag up to 5 seconds. Acceptable for single-admin use; flag it if you ever go multi-admin.

2. **`/api/admin/*` is not API-authenticated** — only protected by the nginx layer (`auth_basic` is *not* turned off for `/admin/`, so it stays gated). That's fine. But the nginx config does turn auth off for `/api/`, so if the network ever sees `/api/admin/users` directly (e.g. from a sibling container), it's wide open. Worth a `127.0.0.1`-only listener or an `allow/deny` block.

3. **`DELETE /api/admin/users/:username` has no last-user safeguard.** You can lock yourself out by deleting the only admin (including yourself) — there's no `if (lines.length <= 1) return 400`.

4. **No "are you the user you say you are?" check on /api/admin.** Once past the basic-auth gate, anyone authenticated can add or delete *any* admin user. For a self-hosted internal tool this is acceptable, but the API should probably check `req.headers.authorization` matches a known admin.

### Data quality (live DB right now)

- **`huhu`** is a real skill in production data (`skill-1773327718048`, 0 sub-skills) — looks like a left-over test entry.
- **`Jobo / Mcoo`** resource (`eng-1773327691921`) — also test data.
- **3 resources rated for nothing** (Fraser Cassels, Jobo, Rob Grant). The dashboard's "Avg Team Skill" / "Top Priority Gap" silently treats them as zeros, which drags averages and skews gap analysis.

### Things that are fine but worth knowing

- **bcrypt passwords**, plus nginx-level basic auth. Much better than the static version's localStorage hash.
- **All mutating endpoints use Postgres transactions** with rollback on error — good.
- **Cache-control on JS/CSS** is `max-age=3600` (not `immutable`) — manual `?v=` bumps work and won't strand users on stale code.

---

## Improvement ideas (ranked by impact / effort)

### High impact

1. **Project-staffing query view.** This is the use case the data is begging for. Let an admin pick a "project profile" (e.g. `AWS ≥ 3 AND Azure ≥ 3 AND Security Products ≥ 2`) and return the matching engineers, with a second list of who's *one course away*. This is pure local SQL — no AI/LLM/cloud needed.

2. **Side-by-side resource comparison.** Pick 2–4 engineers, get overlaid radar charts in the same canvas. Single biggest UX upgrade for staffing decisions.

3. **Sub-skill heatmap drilldown.** The current heatmap is main-category × resource. Click a cell → second heatmap of *that* resource's sub-skills in *that* category. The data exists, just isn't surfaced.

4. **Self-service skill update for resources.** Resources can already log in via basic auth, but the UI doesn't surface "edit your own skills." A `me` view where a resource sees only their own profile + edit form would mean engineers can keep their data fresh without an admin in the loop.

5. **Skill freshness / decay.** Add `last_assessed_at` to `resource_sub_skills`. The heatmap dims (or flags) cells > 12 months stale. Real-world skill levels change; treating a 2024 rating as still-true in 2026 misleads project planners.

### Medium impact

6. **Empty-resource warning on dashboard.** Right now, resources with no skills rated silently drag the team average toward zero. Show a small "3 resources have no ratings — averages exclude them" caption, and either exclude them from `avgTeamSkill` or call them out separately.

7. **Data-quality cleanup tooling.** Surface "weight=5 but no sub-skills" skills (like `huhu`) and "0 sub-skills rated" resources on a Data Quality tab so an admin can spot junk without scrolling the heatmap.

8. **CSV export.** Managers paste into Excel — JSON is for re-imports.

9. **Bulk import / sync.** The Excel that seeded this should be re-importable. There's an `import-from-excel.py` script in the repo; surface it as a "Re-import from Excel" button in Settings (with confirm + dry-run).

10. **Resource cards should show a mini-radar** (60×60 px) instead of just a sub-skill count. Drastically improves at-a-glance scanning.

11. **Weight-aware top gap.** "Top Priority Gap" currently picks the skill with the lowest average. Multiplying `(5 − avg) × weight` would push high-demand-and-low-supply skills to the top of the list — far more decision-useful.

### Low impact / polish

12. **Last-admin safeguard** on `DELETE /api/admin/users/:username` (locking yourself out).

13. **Per-API auth** on `/api/admin/*` (don't rely on the nginx gate alone).

14. **Debounce the sub-skill search** — currently re-renders on every keystroke.

15. **Profile modal long lists** — with 193 sub-skills, the modal becomes a long scroll. Tabbed view per main-skill category.

16. **Form validation on Add Skill modal** — type defaults to "technical", weight defaults to 5; no client-side check that weight is 1–10 (server does, but error message is generic).

17. **Toast errors for failed API calls.** When the backend returns `{success: false, error: "..."}`, the frontend mostly swallows it. Centralised error toast on `apiRequest` failure.

---

## Files changed in this session (skills-db)

- `C:\docker\net-core\web-projects\skills-db\frontend\script.js` — `renderCustomRadar` always re-populates the selector now.
- `C:\docker\net-core\web-projects\skills-db\frontend\index.html` — bumped `script.js?v=87`.
- Files also `docker cp`-ed into `skills-matrix-db:/usr/share/nginx/html/` so the running container picked them up without a rebuild. (Persist by rebuilding the `skills-matrix:latest` image when convenient.)

## New test artifacts

- `C:\docker\net-core\playwright\scripts\skillsdb_full_test.py` — 38-scenario Playwright suite.
- `C:\docker\net-core\playwright\scripts\skillsdb_inspect.py` — API-level data-quality probe.
- `C:\docker\net-core\web-projects\skills-db\__test_results\` — screenshots + `report.json`.
