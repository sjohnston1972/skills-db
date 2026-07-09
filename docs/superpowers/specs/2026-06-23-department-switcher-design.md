# Department Switcher — Design Spec

**Date:** 2026-06-23
**Branch (suggested):** `feat/department-switcher`
**Status:** Approved design — ready for implementation plan

## Problem

The Skills Matrix today is single-tenant: one implicit team ("Projects Team") owns
all `resources`, `main_skills`, `sub_skills`, `resource_sub_skills`, `trainings`, and
`resource_trainings`. We want to host multiple departments in the same app — **Sales**,
**Cyber**, and **Engineering** alongside the existing **Projects Team** — each with its
own people, skills, and trainings under the *same schema*, switchable from the UI, with an
editable department name and a subtle per-department accent theme.

## Goals

- Add a department concept with four departments: Projects Team (existing data), Sales, Cyber, Engineering.
- A header **switcher** to change the active department; selection persists per-browser.
- Each department's display **name is editable** (rename) without breaking anything.
- A **subtle theme change** (accent color) per department; dark/light theme otherwise unchanged.
- Seed the three new departments with **rich, realistic** content: ~10–14 mock people (UK names),
  ~8–12 skill categories with sub-skills, ~8–12 trainings/certs each.
- **Preserve all existing data.** Migration is additive and idempotent; existing rows become Projects Team.

## Non-Goals

- No per-user authentication/authorization per department (the app's existing single-credential
  auth is unchanged). Switching is a per-browser convenience, not an access-control boundary.
- No separate Postgres schemas or databases per department (rejected: too invasive for ~65 query sites).
- No cross-department reporting/roll-ups in this iteration.
- Changing a department's accent color or adding/deleting departments from the UI (slug + accent are
  fixed in seed data; only `name` is editable from the UI).

## Decisions (from brainstorming)

| Decision | Choice |
|---|---|
| Data isolation | `department_id` foreign key on root tables; single DB/schema |
| Switcher state | Per-browser (`localStorage`), sent on every request via `X-Department` header |
| Seed scale | Rich (~10–14 people, ~8–12 skill categories, ~8–12 trainings per new dept) |
| Theme | Professional & distinct accents; Projects Team keeps current blue |
| Rename | Only `name` editable from UI; `slug` + `accent` immutable from UI |

## Data Model

### New table

```sql
departments (
    id          SERIAL PRIMARY KEY,
    slug        VARCHAR(50) NOT NULL UNIQUE,   -- stable key, never changes
    name        VARCHAR(255) NOT NULL,          -- editable display label
    accent      VARCHAR(20),                    -- hex accent, e.g. '#f5a524'
    sort_order  INTEGER DEFAULT 0,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

Seeded rows:

| slug | name | accent | sort_order |
|---|---|---|---|
| `projects-team` | Projects Team | `#00a3ff` | 0 |
| `sales` | Sales | `#f5a524` | 1 |
| `cyber` | Cyber | `#10b981` | 2 |
| `engineering` | Engineering | `#7c5cff` | 3 |

### Root tables get `department_id`

```sql
ALTER TABLE resources    ADD COLUMN department_id INTEGER REFERENCES departments(id);
ALTER TABLE main_skills  ADD COLUMN department_id INTEGER REFERENCES departments(id);
ALTER TABLE trainings    ADD COLUMN department_id INTEGER REFERENCES departments(id);
```

Child tables (`sub_skills`, `resource_sub_skills`, `resource_trainings`) are **not** modified.
They are always reached through a department-owned parent via JOINs, so they inherit scope transitively.

### Constraint changes

- `main_skills`: drop global `UNIQUE(name)` → `UNIQUE(department_id, name)`.
- `trainings`: drop global `UNIQUE(name)` → `UNIQUE(department_id, name)`.
- `sub_skills` `UNIQUE(main_skill_id, name)` is unchanged (parent is already dept-scoped).

## Migrations & Seed

All migration SQL is **idempotent** (`IF NOT EXISTS`, guarded `UPDATE`s, constraint
existence checks) so the server's auto-migration runner can re-apply safely.

### Step 0 — Backup (explicit, runs before migration)

Capture a timestamped logical dump before any schema change:

```
backups/pre-departments-YYYYMMDD_HHMMSS.sql
```

Produced with the same `pg_dump` approach used elsewhere (see `restore.sh` / existing
`backups/*.sql`). Documented as the first step in the implementation plan and runbook.
This is insurance only — the migration itself does not delete data.

### `009_departments.sql`

1. `CREATE TABLE IF NOT EXISTS departments` + seed the 4 rows (`ON CONFLICT (slug) DO NOTHING`).
2. `ADD COLUMN IF NOT EXISTS department_id` on the three root tables (nullable).
3. Backfill: `UPDATE <table> SET department_id = (projects-team id) WHERE department_id IS NULL`.
4. Swap the two UNIQUE constraints (drop-if-exists old, add-if-not-exists new).
5. Re-grant privileges to `skillsuser` (consistent with existing migrations).

> Note: existing migrations warn that the app user may not own the tables, so ALTERs can
> fail under the auto-runner and may need a manual run as `postgres`. The plan will call this out.

### `010_seed_departments.sql` (or Node seeder `seed-departments.js`)

Inserts skills, sub-skills, trainings, mock people (UK names), and their skill levels /
training assignments for **Sales**, **Cyber**, and **Engineering** only. Guarded so it does
not duplicate on re-run (e.g. skip a department if it already has resources). Projects Team
is never touched.

Indicative content per new department:

- **Sales:** skills like Pipeline Management, Negotiation, CRM (Salesforce/HubSpot), Solution
  Selling, Forecasting, Bid/Tender Management, Account Management, Commercial Awareness;
  trainings/certs like Salesforce Administrator, MEDDIC, SPIN Selling, Miller Heiman, APMP (bid).
- **Cyber:** SOC/SIEM, Incident Response, Threat Intelligence, Penetration Testing, Cloud
  Security, IAM, GRC/ISO 27001, Network Security; certs like CISSP, CISM, CEH, OSCP, Security+,
  ISO 27001 Lead Auditor, SC-200.
- **Engineering:** Software/Mechanical/Electrical design as fits, CI/CD, Cloud (AWS/Azure),
  Systems Design, Testing/QA, Networking, Databases; certs like AWS/Azure associate-level,
  Kubernetes (CKA), TOGAF, Chartered Engineer (CEng) pathway.

(Exact lists finalized during implementation; the above sets the scale and flavor.)

## Backend: Scoping Mechanism

### Active-department resolution (one middleware)

A middleware (e.g. `backend/middleware/department.js`) runs before the API routes:

1. Read `X-Department` header (department slug).
2. Resolve to a department row; cache the id→slug map in memory (cheap, small, refresh on miss).
3. Fall back to `projects-team` when the header is missing or unknown.
4. Set `req.departmentId` and `req.departmentSlug` for downstream routes.

Mounted in `server.js` before `app.use('/api/...')` route registration (after JSON parsing).

### Query scoping (the bulk of the work)

There are ~65 query sites across 8 route files
(`data, dataquality, export, insights, resources, skills, staffing, trainings`).
Scope by filtering the **root** tables only:

- Any query reading/aggregating `resources` → add `AND resources.department_id = $deptId`.
- Any query reading `main_skills` → add `AND main_skills.department_id = $deptId`.
- Any query reading `trainings` → add `AND trainings.department_id = $deptId`.
- JOINed children (`sub_skills`, `resource_sub_skills`, `resource_trainings`) need no extra
  filter — they're constrained by their joined root.
- INSERTs into root tables must set `department_id = req.departmentId`.
- INSERTs into child tables are tied to a dept-owned parent id, so no change beyond
  validating the parent belongs to the active department where user-supplied ids are accepted.

Each route is audited individually during implementation; this is the highest-risk area and
gets the most careful review and testing.

### Destructive-path fix (important)

`POST /api/data` currently does `DELETE FROM resource_sub_skills / resources / sub_skills /
main_skills` across the **whole** database, then rebuilds from the request body. This must
become **department-scoped**:

- Delete only rows belonging to `req.departmentId` (children via parent membership, then roots).
- Insert new rows with `department_id = req.departmentId`.
- Other departments' data is never touched.

`POST /api/data/reset` and `init-db.sql` (`DROP TABLE`) remain explicit, opt-in actions and
are out of scope for the switcher flow.

## Backend: Departments API

New route file `backend/routes/departments.js`, mounted at `/api/departments`:

- `GET /api/departments` → `[{ id, slug, name, accent, sortOrder }]` ordered by `sort_order`.
  Powers the switcher and theme.
- `PATCH /api/departments/:id` → body `{ name }`; updates **`name` only**. `slug` and `accent`
  are immutable from the UI. Returns the updated row. Validates non-empty name.

## Frontend

### API layer (`frontend/api.js`)

- `apiRequest()` injects `X-Department: <activeSlug>` into headers on every call — single change,
  covers all existing API calls automatically.
- Add `DepartmentsAPI` with `getAll()` and `rename(id, name)`.
- Active slug stored in `localStorage` (key `activeDepartment`), default `projects-team`.

### Switcher UI (`frontend/index.html` + `script.js`)

- A switcher control in the header (dropdown listing departments by `name`).
- On change: persist slug to `localStorage`, set `data-department` on `<html>`, and refresh the
  data-driven views (re-run the existing data load — same path used on initial load).
- Inline **rename**: an edit affordance next to the active department name → text input →
  `PATCH /api/departments/:id` → update the switcher label in place (no full reload).
- On initial load: fetch departments, apply stored active slug (or default), set theme attribute.

### Theme (`frontend/styles.css`)

- Add per-department overrides keyed off the **slug** (stable), e.g.:

```css
[data-department="sales"]       { --accent: #f5a524; --accent-2: #f7b955; --accent-grad: #d98a10; }
[data-department="cyber"]       { --accent: #10b981; --accent-2: #34d399; --accent-grad: #0e8f6a; }
[data-department="engineering"] { --accent: #7c5cff; --accent-2: #9d86ff; --accent-grad: #5d3fe0; }
/* projects-team: no override — inherits existing blue */
```

- These compose with the existing `[data-theme="dark|light"]` rules; only the accent triad changes.
- Because the theme keys off `slug`, renaming a department never affects its color.

## Data Flow

1. Browser loads → frontend reads `localStorage.activeDepartment` (default `projects-team`),
   sets `data-department`, fetches `GET /api/departments` to populate the switcher.
2. Every API call sends `X-Department: <slug>`.
3. Middleware resolves slug → `req.departmentId`.
4. Routes return only that department's rows; all existing views (matrix, heatmap, insights,
   trainings, resources, staffing, data quality) render scoped data unchanged.
5. Switching department → update localStorage + `data-department` + reload data views.

## Error Handling

- Unknown/missing `X-Department` → fall back to `projects-team` (never 500).
- `PATCH` rename with empty/blank name → 400 with message.
- Department resolution failure (DB error) → standard 500 via existing error middleware.
- Frontend `apiRequest` already surfaces errors via `showToast`; no change needed.

## Testing

- **Migration safety:** before/after row counts for Projects Team are identical
  (`resources`, `main_skills`, `sub_skills`, `resource_sub_skills`, `trainings`,
  `resource_trainings`). Re-running the migration is a no-op.
- **Isolation:** each route returns only the active department's data; switching changes results.
- **Destructive-path fix:** `POST /api/data` against one department leaves the other three intact
  (assert counts unchanged for the non-active departments).
- **Rename:** `PATCH` persists; switcher label updates; accent unchanged after rename.
- **Theme:** switching applies the correct accent; dark/light toggle still works per department.
- **Seed sanity:** each new department has the expected order of magnitude of people/skills/trainings,
  and key views (radar, heatmap, insights) render without errors.

## Rollout / Runbook

1. Create branch `feat/department-switcher`.
2. **Backup** the database to `backups/pre-departments-<timestamp>.sql`.
3. Apply `009_departments.sql` (auto-runner; or manually as `postgres` if ALTERs are skipped).
4. Apply `010_seed_departments.sql` / run seeder.
5. Deploy backend (middleware + scoped routes + departments route) and frontend.
6. Verify: Projects Team data intact; three new departments populated; switcher + rename + theme work.

## Risks

- **Query scoping coverage (highest):** ~65 sites; a missed filter leaks cross-department data.
  Mitigation: per-route audit, isolation tests, and review focused on this surface.
- **Table ownership for ALTERs:** auto-migration runner may lack ownership; documented manual fallback.
- **`POST /api/data` rewrite:** must be exactly department-scoped; covered by the destructive-path test.
