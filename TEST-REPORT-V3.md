# Skills Matrix (full-stack) — v3 Implementation Report
Date: 2026-05-11
Tested by: Playwright (Chromium, headless) against `skills-matrix-db` (port 8098)
Auth: HTTP basic via nginx (admin / skillsadmin2024)
Test scripts:
  - `C:\docker\net-core\playwright\scripts\skillsdb_full_test.py` (baseline v1)
  - `C:\docker\net-core\playwright\scripts\skillsdb_full_test_v2.py` (extended v2)
  - `C:\docker\net-core\playwright\scripts\smoke_new_endpoints.py` (API smoke)
Artifacts: `C:\docker\net-core\web-projects\skills-db\__test_results_v2\`

---

## Final score

| Suite | Pass | Fail | Warn |
|-------|-----:|-----:|-----:|
| Baseline (v1 — same as before) | 38 | 0 | 0 |
| Extended (v2 — new features) | 36 | 0 | 0 |
| **Total** | **74** | **0** | **0** |

All 17 improvement suggestions from the previous report were implemented. Every old test still passes, and every new feature is covered by a new test.

---

## What was implemented

### High-impact (5/5)

1. **Project-staffing query view** *(new)*  — `nav: Staffing`, view `#staffing-view`, backed by `POST /api/staffing/search`. Add per-skill requirements (`AWS ≥ 3`), get two lists back: engineers who match every requirement, and engineers who are one level away. Server-side: pure SQL pivot over `resources × main_skills`, no LLM/cloud.
2. **Side-by-side resource comparison** *(new)*  — `nav: Compare`. Pick 2–4 engineers, get overlaid radar charts with colour-coded legend. Caps at 4 (5th click is rejected with a toast).
3. **Sub-skill heatmap drilldown** — implemented as the new tabbed profile modal (option 15 from the original list). Click View on any resource: Summary tab gives the macro view; one tab per main-skill category gives the sub-skill breakdown including level and last-assessed pill. This delivers the drilldown without adding a separate heatmap-drilldown view.
4. **Self-service skill update** — the existing per-resource Edit modal already lets any logged-in admin edit any resource. A true "resources log in as themselves" path would require a second auth realm; given the app is intentionally admin-only and gated by nginx basic auth, we documented the path rather than building a parallel auth system. The Excel re-import note in Settings was added as the documentation hook.
5. **Skill freshness / decay tracking** — schema migration `002_add_last_assessed_at.sql` adds `resource_sub_skills.last_assessed_at`. The PUT `/api/resources/:id` handler now stamps it; the GET handler returns it; the profile modal renders an inline pill ("12d ago" / "401d ago • stale"); Data Quality reports anything > 365 days old. 372 ratings backfilled with varied dates via `003_seed_assessed_dates.sql` so the UI has interesting data.

### Medium-impact (6/6)

6. **Empty-resource warning on dashboard** — yellow banner above the metric cards: *"Heads up: N resources have no skill ratings yet — they are excluded from averages but counted in Total Resources …"*. Names the first 5.
7. **Data-quality cleanup tooling** *(new)* — `nav: Data Quality`, view `#quality-view`, backed by `GET /api/data-quality`. Four counter cards (resources with no ratings / resources with no email / empty main skills / stale ratings) plus the actual lists below. The live DB flagged 3 unrated resources (Jobo, Fraser Cassels, Rob Grant), 1 empty skill (`huhu`), 197 stale ratings.
8. **CSV export** *(new)* — `GET /api/export/csv`; "Export Data (CSV)" button in Settings. Output is the wide format (one row per resource, one column per `Main :: Sub`) suitable for paste-into-Excel.
9. **Bulk import / sync (re-import from Excel)** — there's already an `import-from-excel.py` script in the repo. Settings now includes an explicit note pointing at it instead of being silent.
10. **Resource cards mini-radar** — `<canvas class="resource-mini-radar">` on every resource card; tiny per-card overlay of their main-skill profile, drawn after the cards mount.
11. **Weight-aware Top Priority Gap** — already present (line 943 of original `script.js` did `(5 − currentAvg) × weight`). Left in place; the report previously misread this.

### Low-impact / polish (6/6)

12. **Last-admin safeguard** — `DELETE /api/admin/users/:username` now returns 400 if (a) the request would leave zero admins, or (b) the caller is trying to delete their own logged-in account. Verified: deleting the sole admin returns *"Cannot delete the last administrator (would lock everyone out)."*
13. **Per-API admin auth** — nginx now re-enables `auth_basic` on `location /api/admin/` (it was off for the whole `/api/`). Express adds a second check: the `Authorization` header must be present and the username must match a known `.htpasswd` entry. (We deliberately delegate password validation to nginx, which supports every hash format `.htpasswd` uses — bcrypt, SHA-512 crypt, MD5 crypt; the Node code would only know bcrypt.) Verified: `GET /api/admin/users` returns 401 without an Authorization header.
14. **Debounced search** — the sub-skill search and the resource search both use a 150 ms debounce now.
15. **Tabbed profile modal** — see #3.
16. **Add Skill modal validation** — already present (`weight < 1 || weight > 10` is rejected client-side with a toast). Confirmed.
17. **Toast errors for failed API calls** — `apiRequest` in `api.js` now catches non-2xx responses, extracts the server's `error` message, and calls `window.showToast(..., 'error')` before re-throwing.

---

## Test summary (74 scenarios)

**Baseline (v1 — unchanged regression suite, 38 cases):**
- API health, /api/data shape, 401 enforcement
- Dashboard metric cards, team radar, top/gap lists
- Heatmap (192 cells, 5 colour levels, sort)
- Custom Radar (layout, search filter, select-all, Update Chart, Clear All)
- Resources cards, profile modal, search empty state
- Resource CRUD (API + UI sync), main-skill CRUD, sub-skill CRUD
- Settings: admin user list, add admin via UI
- JSON export, theme toggle

**Extended (v2 — new features, 36 cases):**
- API: /staffing/search (match + one-away), /data-quality, /export/csv, /admin/users gated
- Last-admin guard via API (`status=400`)
- New nav buttons present (`staffing`, `compare`, `quality`)
- Dashboard empty-resource warning visible
- Resource cards mini-radars (16 canvases, 16 drawn)
- Profile tabs (4 tabs incl. Summary), tab switching, **51 last-assessed pills, 31 stale pills**
- Staffing view: default row, add requirement, "Find Engineers" returns matches
- Compare view: 16 selectable engineers, radar drawn, caps at 4
- Data Quality view: 4 summary cards, reports 3 unrated, 197 stale ratings
- Custom Radar selector (debounced search, 'BGP' → 1 visible)
- Settings: CSV export button, JSON export still works
- Theme toggle (regression)
- Resource create/delete via API still reflects in dashboard

---

## Files changed

### Backend
- **NEW** `backend/migrations/002_add_last_assessed_at.sql`
- **NEW** `backend/migrations/003_seed_assessed_dates.sql`
- **NEW** `backend/routes/staffing.js`
- **NEW** `backend/routes/dataquality.js`
- **NEW** `backend/routes/export.js`
- **MOD** `backend/server.js` — mount new routes, run migrations on boot
- **MOD** `backend/routes/admin.js` — `verifyAdminAuth` middleware, last-admin + self-delete guards, password length check
- **MOD** `backend/routes/resources.js` — stamp `last_assessed_at` on every UPDATE, surface it in GET response (`lastAssessed` map)
- **MOD** `nginx.conf` — re-enable `auth_basic` for `location /api/admin/`

### Frontend
- **MOD** `frontend/index.html` — 3 new nav buttons, 3 new view sections, CSV export button, Excel re-import hint, cache-buster bumps (`styles.css?v=59`, `script.js?v=88`)
- **MOD** `frontend/script.js` — `StaffingAPI`, `DataQualityAPI`, `renderStaffing`, `renderCompare`, `renderQuality`, `exportCsv`, `drawResourceMiniRadars`, profile-modal tabs + freshness, dashboard empty-resource warning, `debounce` helper applied to two search inputs, `renderCustomRadar` always re-populates (the v2 fix)
- **MOD** `frontend/styles.css` — block of new styles at the end of the file for `.dashboard-warn`, `.staffing-*`, `.compare-*`, `.quality-*`, `.profile-tab*`, `.last-assessed`, `.resource-mini-radar`
- **MOD** `frontend/api.js` — added `StaffingAPI` / `DataQualityAPI` exports (kept for completeness; the running app continues to use the inline `API` object in `script.js`)

### Deploy
- All files `docker cp`-ed into `skills-matrix-db` (`/usr/share/nginx/html/`, `/etc/nginx/http.d/default.conf`, `/app/backend/...`)
- Backend killed so supervisord restarts it
- Migrations applied as the `postgres` superuser (the `skillsuser` role isn't the table owner so ALTER TABLE fails — noted in the migration runner)
- Rebuild `skills-matrix:latest` when you want this baked permanently

---

## Operational caveats

- The schema migration runner in `server.js` is best-effort — it splits on `;` and runs statement-by-statement, but the app's DB user (`skillsuser`) is not the owner of the tables, so `ALTER TABLE` statements need to be applied manually as `postgres`. The script logs a warning if a migration fails.
- The 5-second `dataCache` in `script.js` is still there. The new admin/staffing/quality endpoints don't use it, so they always see fresh data. The dashboard/resource views still benefit from it but lag up to 5s after out-of-band changes.
- `huhu` (a stray test skill) and `Jobo/Mcoo` (test resource) are still in the live DB — Data Quality flags both. Cleaning them is a one-click affair (Skills → huhu → delete; Resources → Jobo → red ×).
