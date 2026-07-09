# GitHub Issues Remediation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remediate all 20 open GitHub issues (#3–#22): API auth gaps, secret leak, docker-build breakage, lossy data import, and missing tests/CI.

**Architecture:** Node/Express + PostgreSQL + nginx in one Docker container. Work happens on branch `fix/issues-remediation` off `feat/department-switcher` (26 ahead of main; department-scoping is present). Umbrella issues #3–#7 are fully covered by granular issues #8–#22.

**Tech Stack:** Express 4, pg, jest + supertest, GitHub Actions, docker (postgres:16-alpine for test DB).

## Global Constraints

- Node 18 is the production runtime (Dockerfile `node:18-alpine`); local dev is Node 24 — code must run on both.
- All API routes are department-scoped via `req.departmentId` / `req.departmentSlug` (header `X-Department`, default `projects-team`).
- `verifyAdminAuth` deliberately does NOT verify passwords (nginx is source of truth); it checks header presence + username exists in `.htpasswd`.
- Response envelope everywhere: `{ success: true, data }` / `{ success: false, error }`.
- Existing export JSON shape must not change (only additive).
- `.dockerignore` already ships `backend/init-db.sql` (that half of #15 is done on this branch).
- Frontend `script.js` never calls `DataAPI.save/import/export/reset` — those endpoints are curl/backup flows only.
- Test env vars: `DB_HOST=localhost DB_PORT=5433 DB_NAME=skills_matrix_test DB_USER=postgres DB_PASSWORD=postgres HTPASSWD_FILE=backend/__tests__/fixtures/htpasswd`.

---

### Task 0: Branch + test database

**Files:** none (git + docker only)

- [ ] `git checkout -b fix/issues-remediation`
- [ ] Start disposable test PG: `docker run -d --name skillsdb-test-pg -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=skills_matrix_test -p 5433:5432 postgres:16-alpine`

### Task 1: Jest + supertest harness, importable app (#20)

**Files:**
- Modify: `package.json` (test script, devDeps), generate `package-lock.json`
- Modify: `backend/server.js` (require.main guard; move `/api/health` + `/api/metadata` above department middleware)
- Modify: `backend/middleware/department.test.js` (convert node:test → jest)
- Create: `jest.config.js`, `backend/__tests__/setup-env.js`, `backend/__tests__/jest.setup.js`, `backend/__tests__/global-setup.js`, `backend/__tests__/fixtures/htpasswd`, `backend/__tests__/smoke.test.js`

**Interfaces:**
- Produces: `require('backend/server')` returns the Express app without listening/migrating when not run directly.
- Produces: jest globalSetup creates role `skillsuser` if absent, runs `init-db.sql` then each `backend/migrations/*.sql` whole-file (NOT the `;`-splitting startup runner — its `startsWith('--')` filter drops statements whose chunk begins with a comment) against the test DB.
- `jest.config.js`: `testEnvironment: 'node'`, `setupFiles: ['<rootDir>/backend/__tests__/setup-env.js']`, `setupFilesAfterEach` → per-file `afterAll(() => require('../db').pool.end())` via `setupFilesAfterEach: ['<rootDir>/backend/__tests__/jest.setup.js']`, `globalSetup`, `testPathIgnorePatterns` for fixtures.
- `setup-env.js` sets DB_* + HTPASSWD_FILE defaults only when unset (CI overrides).
- Fixture htpasswd line: `testadmin:$2y$10$dummydummydummydummydummydummydummydummydummydummydu` (only username is checked).
- Smoke test: `jest.mock('../db')` with `query` resolving `{ rows: [{ id: 1, slug: 'projects-team' }] }`; assert `GET /api/nope` → 404 `{success:false,error:'API endpoint not found'}` — passes with no DB.
- server.js: wrap `startServer()` in `if (require.main === module)`; relocate health+metadata handlers above `app.use('/api', departmentMiddleware(db))` so they work when the departments table is absent (also fixes container healthcheck after a reset).

Steps: write smoke test → fails (no jest) → install jest+supertest, add config + guard → `npm test` green → `npm start` still boots → commit.

### Task 2: Extract pure logic + unit tests (#21)

**Files:**
- Create: `backend/lib/skill-levels.js`, `backend/lib/csv.js`, `backend/lib/spec-matcher.js`
- Create: `backend/__tests__/lib/skill-levels.test.js`, `csv.test.js`, `spec-matcher.test.js`
- Modify: `backend/routes/data.js`, `backend/routes/resources.js` (use lib, delete dup), `backend/routes/export.js`, `backend/routes/insights.js`

**Interfaces:**
- `skill-levels.js` → `calculateMainSkillLevel(subSkills: {[name]: number}) => number` (verbatim move).
- `csv.js` → `csvCell(v) => string` (verbatim move).
- `spec-matcher.js` → `normaliseSpec(spec) => string` (normalise + alias rewrite + re-normalise — preserve the double-normalise), `scoreSkillsAgainstSpec(normSpec, skillRows) => matches[]` where skillRows = `[{id,name,weight,skill_type,sub_names}]` and matches = `[{skill_id,skill,weight,type,hits,matched_terms}]`. Also export `ALIASES`, `STOPWORDS`, `normalise` for tests.
- insights.js `/match` keeps SQL + requirements/candidates shaping; calls the two functions.

Tests per issue #21: levels `{}`→0, `{a:3,b:4}`→4, single passthrough; csvCell null/undefined→'', quote-doubling, comma/newline wrapping, plain passthrough; matcher `dot1x`→`802.1x` phrase hit, stopword-only spec → no matches, phrase hit = 2 vs word hit = 1, regex-special alias chars don't throw.

### Task 3: Exclude secret keys from GET /api/metadata (#8)

**Files:**
- Modify: `backend/routes/settings.js` (add `module.exports.API_KEY_META_KEYS = API_KEY_META_KEYS;`)
- Modify: `backend/server.js` metadata handler: `SELECT key, value FROM metadata WHERE key <> ALL($1) ORDER BY key` with `[API_KEY_META_KEYS]`
- Test: `backend/__tests__/metadata.test.js` (mocked db: rows include `anthropic_api_key`; assert response lacks `anthropicApiKey`, still has `lastUpdated`)

### Task 4: Shared auth middleware (#9 prereq)

**Files:**
- Create: `backend/middleware/auth.js`
- Modify: `backend/routes/admin.js` (import from it; behavior identical)
- Test: `backend/__tests__/auth.test.js`

**Interfaces:**
- `auth.js` exports `{ HTPASSWD_FILE, parseBasicAuth, verifyAdminAuth }`; `HTPASSWD_FILE = process.env.HTPASSWD_FILE || '/etc/nginx/.htpasswd'` (env override is what makes tests possible).
- admin.js keeps `readLines`/`writeLines` locally but uses shared `HTPASSWD_FILE`; drops its own `parseBasicAuth`/`verifyAdminAuth`.
- Tests: no header → 401; `Basic` for unknown user → 401; known fixture user → next() called, `req.authUser` set.

### Task 5: Auth on settings mutations (#9), AI endpoints (#10), reset (#12) + honest reset (#15/#5) 

**Files:**
- Modify: `backend/routes/settings.js` — `verifyAdminAuth` on `PUT /api-keys/:name`, `DELETE /api-keys/:name`, `PUT /flags/:name` (GETs stay open at Express layer; nginx covers them — comment why)
- Modify: `backend/routes/insights.js` — `verifyAdminAuth` on `POST /match/ai`, `POST /chat`
- Create: `backend/lib/migrations.js` — `applyMigrations(query) => {applied: string[], failed: [{file, error}]}`; runs each `backend/migrations/*.sql` whole-file, per-file try/catch
- Modify: `backend/server.js` — startup migration loop replaced by `applyMigrations(db.query)`
- Modify: `backend/routes/data.js` `/reset` — `verifyAdminAuth`, require body `{confirm:'RESET'}` else 400, `const ok = await db.initDatabase(); if (!ok) 500`; then `applyMigrations` (re-adds department columns init-db.sql dropped — without this, reset leaves a schema the app can't use)
- Modify: `frontend/api.js` `DataAPI.reset()` sends `{ confirm: 'RESET' }`
- Tests: integration `backend/__tests__/security.int.test.js` — settings PUT/DELETE/flags 401 without auth, 200-path with fixture user; `/chat`+`/match/ai` 401 unauthenticated (with auth they 503/400 on missing key — assert not-401); reset: 401 no auth, 400 no confirm. Do NOT run a real confirmed reset in tests (wipes test DB mid-suite).

### Task 6: Remove wide-open CORS (#13)

**Files:** `backend/server.js` (drop require+use), `package.json` (drop `cors`), lockfile refresh.
- Test: integration asserts `GET /api/health` response has no `access-control-allow-origin` header.

### Task 7: nginx — auth on /api/, health public, settings block (#11, nginx halves of #9/#10)

**Files:** `nginx.conf`
- Remove `auth_basic off;` from `location /api/` (inherits server-level basic auth — this alone closes #10/#11's nginx layer for insights and everything else).
- Add before it:
```nginx
    # Docker HEALTHCHECK depends on this staying public.
    location = /api/health {
        auth_basic off;
        proxy_pass http://127.0.0.1:3000/api/health;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
```
- Add `/api/settings/` block mirroring `/api/admin/` (re-assert realm, defence in depth).
- Verified in Task 10's container smoke (can't be jest-tested).

### Task 8: Clean-clone docker build (#14)

**Files:** `Dockerfile` (delete `COPY .env ./` — ENV block already supplies runtime defaults), create `.env.example`, `README.md` (Quick Start prereq: create `.htpasswd` via `docker run --rm httpd:2.4-alpine htpasswd -nbB admin 'yourpassword' > .htpasswd` or `htpasswd -Bc .htpasswd admin`; local-dev `.env` from `.env.example`; new "Running tests" section).
- `.env.example` mirrors Dockerfile ENV defaults + optional `ANTHROPIC_API_KEY`/`ANTHROPIC_MODEL`.

### Task 9: Lossless import + shared export/import functions (#16, #17, #18, #19)

**Files:**
- Modify: `backend/routes/data.js` (full rework of GET /, POST /, /import, /export)
- Test: `backend/__tests__/data-roundtrip.int.test.js`

**Interfaces:**
- `async function buildExportPayload(departmentId)` → the existing `data` object (resources with `job_role`/`subSkills`/`lastAssessed`, skills with `category/weight/skillType/subSkills`, lastUpdated, metadata) — extracted verbatim from GET /.
- `function validateImportPayload(body)` → throws `{status:400,message}` on: resources not array; resource missing string id/name; rating level not integer 0–5; skills[] entry missing name, weight outside 1–10, skillType not in ('technical','non-technical'); returns `{resources, skills}`.
- `async function importData(body, departmentId, departmentSlug)` → summary `{message, resourcesCount, preservedTrainings: true}`; throws typed errors; single transaction:
  1. DELETE dept ratings, dept sub_skills, dept main_skills (ratings/skills keep replace semantics).
  2. Main skills from `skills[]` when present (payload id or `${slug}-name` fallback, category/weight/skill_type), plus auto-create any main skill only seen in resources' `subSkills` (legacy payloads) — defaults as today.
  3. Sub-skills = union of `skills[].subSkills` names (accept `{id,name}` or string) and resources' subSkill names; build `main_sub` → id map.
  4. Resources UPSERT: `INSERT (id,name,email,job_role,department_id) ON CONFLICT (id) DO UPDATE SET name/email/job_role/department_id` — `password_hash` and `resource_trainings` survive (#17, #18).
  5. `DELETE FROM resources WHERE department_id=$1 AND NOT (id = ANY($2))` — removed people still cascade away (intentional).
  6. Ratings insert with `last_assessed_at`: valid `resource.lastAssessed?.[main]?.[sub]` date → pass through, else `CURRENT_TIMESTAMP` (invalid values ignored, not fatal).
  7. metadata `last_updated` upsert; COMMIT.
- Routes: `GET /` + `POST /export` use `buildExportPayload` (export adds Content-Type + `Content-Disposition: attachment; filename=skills-matrix-export.json`, body `{success:true,data}` — same as today); `POST /` + `POST /import` both call `importData`. **Zero `router.handle` calls remain** (#19).
- Integration tests: seed resource w/ job_role+password_hash+training assignment+distinct last_assessed_at and a skill w/ weight 9/category/non-default type → export → import → re-export: deep-equal skills metadata, job_role, lastAssessed; password_hash still in DB; training assignment still present. Negative: level 7 → 400 + DB unchanged; missing resource id → 400; weight 99 in skills[] → 400. Legacy payload (resources only) imports.

### Task 10: Integration tests for CRUD + CI workflow (#22, closes #7)

**Files:**
- Create: `backend/__tests__/api.int.test.js` (resources CRUD 201/409/404/PUT/DELETE, skills invalid weight 400 + sub-skill add/rename/delete + cascade delete, trainings assignment upsert idempotence, `GET /api/data` shape)
- Create: `.github/workflows/ci.yml` — on push/PR; postgres:16-alpine service (port 5433→5432, health cmd pg_isready); setup-node 18 + npm cache; `npm ci`; `npm test` with the standard test env vars.

### Task 11: Final verification + ship

- [ ] Full `npm test` green twice in a row (schema re-init is idempotent).
- [ ] `docker build` from a **clean clone** into scratchpad (create `.htpasswd` per new README, no `.env`) — must succeed (#14).
- [ ] Run container, curl matrix: `/api/health` 200 no-auth; `/api/data` 401 no-auth / 200 with `-u`; `/api/metadata` (authed) has no `anthropicApiKey`; settings PUT 401 anon; reset anon 401, authed-no-confirm 400 (#11/#12/#8).
- [ ] Push branch, open PR to `main`... but note branch bases on `feat/department-switcher`; open PR base = `feat/department-switcher`? No — PR to main including dept work is wrong. Decision: push `fix/issues-remediation`, open PR with base `feat/department-switcher`, description `Closes #3 ... Closes #22`.

## Self-review notes
- #15's dockerignore half already fixed on branch — only reset-honesty half remains (Task 5).
- #3/#4/#5/#6/#7 fully covered by Tasks 3+5+7 / 5+6+7 / 5+8 / 9 / 1+2+10 respectively.
- Type consistency: `verifyAdminAuth` name reused everywhere; `applyMigrations(query)` consumed by server.js + reset route; lib function names match tests.
