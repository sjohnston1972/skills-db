# Department Switcher Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add multiple departments (Projects Team + Sales, Cyber, Engineering) to the Skills Matrix, each owning its own people/skills/trainings under the same schema, with a per-browser switcher, editable department names, and a subtle per-department accent theme.

**Architecture:** A new `departments` table plus a `department_id` foreign key on the three root tables (`resources`, `main_skills`, `trainings`); child tables inherit scope through JOINs. The active department travels from the browser to the backend in an `X-Department` header, resolved once by middleware into `req.departmentId`, and every query filters by it. The frontend stores the active slug in `localStorage`, themes off a `data-department` attribute, and renames via a small departments API.

**Tech Stack:** Node.js + Express (backend), PostgreSQL (`pg`), vanilla JS frontend, Docker (single container bundling Postgres + Node via supervisord). No test framework exists — verification uses `node --test` (built into Node, no new deps) for pure logic, and `docker exec ... psql` + `curl` for DB/API checks.

## Global Constraints

- **No new runtime dependencies.** Use only what's in `package.json` (express, pg, dotenv, cors, bcrypt) plus Node built-ins.
- **All migrations idempotent.** The server's auto-migration runner re-applies every `.sql` in `backend/migrations/` on each boot (`server.js:148-167`); statements are split on `;`. Guard everything with `IF NOT EXISTS` / `ON CONFLICT` / existence checks. Each statement must be individually runnable (no multi-statement functions split mid-body — keep the existing single-statement style).
- **Preserve existing data.** No `DROP TABLE` or unscoped `DELETE` against data tables. Existing rows become the `projects-team` department.
- **DB access pattern (from `restore.sh`):** container is `skills-matrix-db`, db `skills_matrix`, user `skillsuser`. Run SQL with `docker exec -i skills-matrix-db psql -U skillsuser -d skills_matrix -c "..."`.
- **App URL:** `http://localhost:8098` (nginx → app). API base `/api`. Endpoints sit behind htpasswd basic auth; pass `-u <user>:<pass>` to curl using creds from `.htpasswd`/`creds.txt` when needed.
- **Department slugs are fixed:** `projects-team`, `sales`, `cyber`, `engineering`. Only `name` is editable from the UI; `slug` and `accent` are immutable from the UI.
- **Scope filter pattern:** filter only root tables — `resources.department_id = $deptId`, `main_skills.department_id = $deptId`, `trainings.department_id = $deptId`. Children (`sub_skills`, `resource_sub_skills`, `resource_trainings`) are constrained via their joined/parent root.
- **ID namespacing:** `resources.id` and `main_skills.id` are global VARCHAR PKs. Any generated id (seed or `POST /api/data`) MUST be prefixed with the department slug to avoid cross-department collisions (e.g. `cyber-cloud-security`).
- **Branch:** `feat/department-switcher` (already created and checked out; spec committed).

---

## Task 1: Backup + departments migration

**Files:**
- Create: `backend/migrations/009_departments.sql`
- Create (output): `backups/pre-departments-<timestamp>.sql`

**Interfaces:**
- Produces: `departments(id, slug, name, accent, sort_order, created_at)` table seeded with 4 rows; `department_id INTEGER` column on `resources`, `main_skills`, `trainings`, all backfilled to the `projects-team` id; per-department UNIQUE constraints on `main_skills(department_id, name)` and `trainings(department_id, name)`.

- [ ] **Step 1: Take a timestamped backup (insurance before any schema change)**

```bash
docker exec skills-matrix-db pg_dump --clean --if-exists --no-owner -U skillsuser skills_matrix \
  > "backups/pre-departments-$(date +%Y%m%d_%H%M%S).sql"
ls -la backups/pre-departments-*.sql   # confirm a non-empty file exists
```

- [ ] **Step 2: Record current Projects Team baseline counts (for the safety assertion in Step 6)**

```bash
docker exec -i skills-matrix-db psql -U skillsuser -d skills_matrix -c \
"SELECT 'resources' t, COUNT(*) FROM resources
 UNION ALL SELECT 'main_skills', COUNT(*) FROM main_skills
 UNION ALL SELECT 'sub_skills', COUNT(*) FROM sub_skills
 UNION ALL SELECT 'resource_sub_skills', COUNT(*) FROM resource_sub_skills
 UNION ALL SELECT 'trainings', COUNT(*) FROM trainings
 UNION ALL SELECT 'resource_trainings', COUNT(*) FROM resource_trainings;"
```

Note the numbers; they must be unchanged after migration.

- [ ] **Step 3: Write the migration**

Create `backend/migrations/009_departments.sql`:

```sql
-- Departments: multi-department support. Additive + idempotent.

CREATE TABLE IF NOT EXISTS departments (
    id          SERIAL PRIMARY KEY,
    slug        VARCHAR(50)  NOT NULL UNIQUE,
    name        VARCHAR(255) NOT NULL,
    accent      VARCHAR(20),
    sort_order  INTEGER DEFAULT 0,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO departments (slug, name, accent, sort_order) VALUES
    ('projects-team', 'Projects Team', '#00a3ff', 0),
    ('sales',         'Sales',         '#f5a524', 1),
    ('cyber',         'Cyber',         '#10b981', 2),
    ('engineering',   'Engineering',   '#7c5cff', 3)
ON CONFLICT (slug) DO NOTHING;

ALTER TABLE resources   ADD COLUMN IF NOT EXISTS department_id INTEGER REFERENCES departments(id);
ALTER TABLE main_skills ADD COLUMN IF NOT EXISTS department_id INTEGER REFERENCES departments(id);
ALTER TABLE trainings   ADD COLUMN IF NOT EXISTS department_id INTEGER REFERENCES departments(id);

UPDATE resources   SET department_id = (SELECT id FROM departments WHERE slug='projects-team') WHERE department_id IS NULL;
UPDATE main_skills SET department_id = (SELECT id FROM departments WHERE slug='projects-team') WHERE department_id IS NULL;
UPDATE trainings   SET department_id = (SELECT id FROM departments WHERE slug='projects-team') WHERE department_id IS NULL;

ALTER TABLE main_skills DROP CONSTRAINT IF EXISTS main_skills_name_key;
ALTER TABLE trainings   DROP CONSTRAINT IF EXISTS trainings_name_key;
ALTER TABLE main_skills ADD CONSTRAINT main_skills_dept_name_key UNIQUE (department_id, name);
ALTER TABLE trainings   ADD CONSTRAINT trainings_dept_name_key   UNIQUE (department_id, name);

CREATE INDEX IF NOT EXISTS idx_resources_dept   ON resources(department_id);
CREATE INDEX IF NOT EXISTS idx_main_skills_dept ON main_skills(department_id);
CREATE INDEX IF NOT EXISTS idx_trainings_dept   ON trainings(department_id);

GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO skillsuser;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO skillsuser;
```

> The `ADD CONSTRAINT ... UNIQUE` lines are not natively idempotent. If a re-run errors with "already exists", that is harmless — the auto-runner logs and continues (`server.js:160`). The actual constraint names (`main_skills_name_key`, `trainings_name_key`) are Postgres's defaults for a column-level `UNIQUE`; confirm in Step 4 and adjust the `DROP` if your DB used a different name.

- [ ] **Step 4: Apply the migration manually (the app user may not own the tables)**

```bash
docker exec -i skills-matrix-db psql -U skillsuser -d skills_matrix < backend/migrations/009_departments.sql
```

If the `DROP CONSTRAINT` lines no-op because the real names differ, list them:

```bash
docker exec -i skills-matrix-db psql -U skillsuser -d skills_matrix -c \
"SELECT conname FROM pg_constraint WHERE conrelid IN ('main_skills'::regclass,'trainings'::regclass) AND contype='u';"
```

- [ ] **Step 5: Verify the departments table + backfill**

```bash
docker exec -i skills-matrix-db psql -U skillsuser -d skills_matrix -c "SELECT slug,name,accent,sort_order FROM departments ORDER BY sort_order;"
docker exec -i skills-matrix-db psql -U skillsuser -d skills_matrix -c \
"SELECT COUNT(*) AS unscoped_resources FROM resources WHERE department_id IS NULL;"
```
Expected: 4 department rows; `unscoped_resources = 0`.

- [ ] **Step 6: Verify Projects Team data is untouched**

Re-run the Step 2 count query. Expected: **identical** numbers, and every existing row now carries the `projects-team` `department_id`:

```bash
docker exec -i skills-matrix-db psql -U skillsuser -d skills_matrix -c \
"SELECT d.slug, COUNT(r.*) FROM resources r JOIN departments d ON r.department_id=d.id GROUP BY d.slug;"
```
Expected: all existing resources under `projects-team`; no other dept has resources yet.

- [ ] **Step 7: Commit**

```bash
git add backend/migrations/009_departments.sql
git commit -m "feat(departments): add departments table + department_id scoping (migration 009)"
```

---

## Task 2: Department resolver middleware

**Files:**
- Create: `backend/middleware/department.js`
- Create: `backend/middleware/department.test.js`
- Modify: `backend/server.js` (add `require` + `app.use` before route registration)

**Interfaces:**
- Produces: `resolveDepartmentId(slug, deptsBySlug, fallbackSlug)` — pure function returning an integer id. `departmentMiddleware(db)` — Express middleware factory that sets `req.departmentId` (integer) and `req.departmentSlug` (string) on every request, defaulting to `projects-team`.
- Consumes: `backend/db.js` `query`.

- [ ] **Step 1: Write the failing unit test for the pure resolver**

Create `backend/middleware/department.test.js`:

```js
const { test } = require('node:test');
const assert = require('node:assert');
const { resolveDepartmentId } = require('./department');

const map = { 'projects-team': 1, 'sales': 2, 'cyber': 3, 'engineering': 4 };

test('returns the id for a known slug', () => {
  assert.strictEqual(resolveDepartmentId('sales', map, 'projects-team'), 2);
});

test('falls back when slug is unknown', () => {
  assert.strictEqual(resolveDepartmentId('nope', map, 'projects-team'), 1);
});

test('falls back when slug is missing/empty', () => {
  assert.strictEqual(resolveDepartmentId(undefined, map, 'projects-team'), 1);
  assert.strictEqual(resolveDepartmentId('', map, 'projects-team'), 1);
});
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `node --test backend/middleware/department.test.js`
Expected: FAIL — `Cannot find module './department'`.

- [ ] **Step 3: Implement the middleware**

Create `backend/middleware/department.js`:

```js
const DEFAULT_SLUG = 'projects-team';

// Pure: resolve a slug to a department id, falling back when missing/unknown.
function resolveDepartmentId(slug, deptsBySlug, fallbackSlug = DEFAULT_SLUG) {
  if (slug && Object.prototype.hasOwnProperty.call(deptsBySlug, slug)) {
    return deptsBySlug[slug];
  }
  return deptsBySlug[fallbackSlug];
}

// Express middleware factory. Caches the slug->id map in memory; refreshes on a miss.
function departmentMiddleware(db) {
  let cache = null; // { [slug]: id }

  async function load() {
    const r = await db.query('SELECT id, slug FROM departments');
    cache = {};
    for (const row of r.rows) cache[row.slug] = row.id;
    return cache;
  }

  return async function (req, res, next) {
    try {
      const slug = (req.get('X-Department') || DEFAULT_SLUG).trim();
      if (!cache) await load();
      // Refresh once if an otherwise-plausible slug isn't cached yet.
      if (!Object.prototype.hasOwnProperty.call(cache, slug) && slug !== DEFAULT_SLUG) {
        await load();
      }
      req.departmentId = resolveDepartmentId(slug, cache, DEFAULT_SLUG);
      req.departmentSlug = Object.keys(cache).find(s => cache[s] === req.departmentId) || DEFAULT_SLUG;
      next();
    } catch (err) {
      next(err);
    }
  };
}

module.exports = { resolveDepartmentId, departmentMiddleware, DEFAULT_SLUG };
```

- [ ] **Step 4: Run the test to confirm it passes**

Run: `node --test backend/middleware/department.test.js`
Expected: PASS (3 tests).

- [ ] **Step 5: Wire the middleware into `server.js`**

In `backend/server.js`, after the request-logging middleware block (ends `server.js:32`) and **before** the first `app.use('/api/...')` (`server.js:35`), add:

```js
const { departmentMiddleware } = require('./middleware/department');
app.use('/api', departmentMiddleware(db));
```

`db` is already required at `server.js:6`.

- [ ] **Step 6: Commit**

```bash
git add backend/middleware/department.js backend/middleware/department.test.js backend/server.js
git commit -m "feat(departments): department resolver middleware (X-Department header)"
```

---

## Task 3: Departments API route

**Files:**
- Create: `backend/routes/departments.js`
- Modify: `backend/server.js` (require + mount at `/api/departments`)

**Interfaces:**
- Consumes: `backend/db.js`.
- Produces: `GET /api/departments` → `{ success, data: [{ id, slug, name, accent, sortOrder }] }` ordered by `sort_order`; `PATCH /api/departments/:id` body `{ name }` → `{ success, data: { id, slug, name, accent, sortOrder } }`. Empty/blank name → 400.

- [ ] **Step 1: Implement the route**

Create `backend/routes/departments.js`:

```js
const express = require('express');
const router = express.Router();
const db = require('../db');

function shape(row) {
  return { id: row.id, slug: row.slug, name: row.name, accent: row.accent, sortOrder: row.sort_order };
}

// GET /api/departments — list for the switcher
router.get('/', async (req, res) => {
  try {
    const r = await db.query('SELECT id, slug, name, accent, sort_order FROM departments ORDER BY sort_order, name');
    res.json({ success: true, data: r.rows.map(shape) });
  } catch (error) {
    console.error('Error fetching departments:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PATCH /api/departments/:id — rename only
router.patch('/:id', async (req, res) => {
  try {
    const name = (req.body && req.body.name || '').trim();
    if (!name) {
      return res.status(400).json({ success: false, error: 'Department name is required' });
    }
    const r = await db.query(
      'UPDATE departments SET name = $1 WHERE id = $2 RETURNING id, slug, name, accent, sort_order',
      [name, req.params.id]
    );
    if (r.rowCount === 0) {
      return res.status(404).json({ success: false, error: 'Department not found' });
    }
    res.json({ success: true, data: shape(r.rows[0]) });
  } catch (error) {
    console.error('Error renaming department:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
```

- [ ] **Step 2: Mount the route in `server.js`**

In `backend/server.js`, add a `require` alongside the other route requires (after `server.js:18`):

```js
const departmentsRoutes = require('./routes/departments');
```

And mount it alongside the other `app.use` lines (after `server.js:44`):

```js
app.use('/api/departments', departmentsRoutes);
```

- [ ] **Step 3: Restart the app and verify GET**

```bash
docker restart skills-matrix-db   # or: npm start, if running locally against the DB
curl -s -u <user>:<pass> http://localhost:8098/api/departments | head -c 400
```
Expected: JSON with 4 departments, `projects-team` first, each with `accent`.

- [ ] **Step 4: Verify PATCH rename + validation**

```bash
# rename Sales (id 2) -> "Sales & BD", then back
curl -s -u <user>:<pass> -X PATCH http://localhost:8098/api/departments/2 \
  -H 'Content-Type: application/json' -d '{"name":"Sales & BD"}'
curl -s -u <user>:<pass> -X PATCH http://localhost:8098/api/departments/2 \
  -H 'Content-Type: application/json' -d '{"name":"Sales"}'
# empty name -> 400
curl -s -o /dev/null -w "%{http_code}\n" -u <user>:<pass> -X PATCH http://localhost:8098/api/departments/2 \
  -H 'Content-Type: application/json' -d '{"name":"  "}'
```
Expected: first two return the updated row; last prints `400`.

- [ ] **Step 5: Commit**

```bash
git add backend/routes/departments.js backend/server.js
git commit -m "feat(departments): GET list + PATCH rename API"
```

---

## Task 4: Scope `data.js` (core read + department-scoped writes)

**Files:**
- Modify: `backend/routes/data.js`

**Interfaces:**
- Consumes: `req.departmentId` (Task 2).
- Produces: `GET /api/data` returns only the active department's resources/skills; `POST /api/data` replaces only the active department's rows; `POST /api/data/reset` is left unchanged (explicit full reset, out of scope).

- [ ] **Step 1: Scope the four GET queries**

In `backend/routes/data.js` `GET /` handler:
- `data.js:18-20` resources query → add the filter:
  ```js
  const resourcesResult = await db.query(
      'SELECT id, name, email, job_role FROM resources WHERE department_id = $1 ORDER BY name', [req.departmentId]
  );
  ```
- `data.js:23-25` main_skills query → `... FROM main_skills WHERE department_id = $1 ORDER BY name`, params `[req.departmentId]`.
- `data.js:28-33` sub_skills query → constrain via parent:
  ```sql
  SELECT ss.id, ss.name, ss.main_skill_id, ms.name as main_skill_name
  FROM sub_skills ss
  JOIN main_skills ms ON ss.main_skill_id = ms.id
  WHERE ms.department_id = $1
  ORDER BY ms.name, ss.name
  ```
  params `[req.departmentId]`.
- `data.js:36-44` mappings query → add `WHERE ms.department_id = $1` before `ORDER BY`, params `[req.departmentId]`.

- [ ] **Step 2: Make `POST /api/data` department-scoped (replaces the whole-DB wipe)**

In the `POST /` handler, replace the four unscoped deletes (`data.js:149-152`) with deletes limited to the active department (children first, via parent membership):

```js
const deptId = req.departmentId;
await client.query(
  `DELETE FROM resource_sub_skills WHERE resource_id IN (SELECT id FROM resources WHERE department_id = $1)`, [deptId]);
await client.query(`DELETE FROM resources WHERE department_id = $1`, [deptId]);
await client.query(
  `DELETE FROM sub_skills WHERE main_skill_id IN (SELECT id FROM main_skills WHERE department_id = $1)`, [deptId]);
await client.query(`DELETE FROM main_skills WHERE department_id = $1`, [deptId]);
```

- [ ] **Step 3: Namespace generated ids + set `department_id` on inserts in `POST /api/data`**

- main_skills id generation (`data.js:176-184`): prefix the id with the department slug and set `department_id`:
  ```js
  const mainSkillId = `${req.departmentSlug}-` + mainSkillName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  mainSkillIds.set(mainSkillName, mainSkillId);
  await client.query(
    'INSERT INTO main_skills (id, name, department_id) VALUES ($1, $2, $3)',
    [mainSkillId, mainSkillName, req.departmentId]
  );
  ```
- resources insert (`data.js:205-208`): add `department_id`:
  ```js
  await client.query(
    'INSERT INTO resources (id, name, email, department_id) VALUES ($1, $2, $3, $4)',
    [resource.id, resource.name, resource.email || null, req.departmentId]
  );
  ```
- `sub_skills` inserts (`data.js:192-195`) need no change — they reference a dept-owned `main_skill_id`.

- [ ] **Step 4: Verify GET is scoped (Projects Team only, until others are seeded)**

```bash
curl -s -u <user>:<pass> http://localhost:8098/api/data -H 'X-Department: projects-team' \
  | python -c "import sys,json;d=json.load(sys.stdin)['data'];print('resources',len(d['resources']),'skills',len(d['skills']))"
curl -s -u <user>:<pass> http://localhost:8098/api/data -H 'X-Department: cyber' \
  | python -c "import sys,json;d=json.load(sys.stdin)['data'];print('resources',len(d['resources']),'skills',len(d['skills']))"
```
Expected: `projects-team` shows the real counts; `cyber` shows `0 / 0` (not yet seeded).

- [ ] **Step 5: Verify the scoped write does not leak (isolation smoke test)**

```bash
# Save an empty resources set to the 'cyber' dept; Projects Team must be unaffected.
curl -s -u <user>:<pass> -X POST http://localhost:8098/api/data -H 'X-Department: cyber' \
  -H 'Content-Type: application/json' -d '{"resources":[]}'
docker exec -i skills-matrix-db psql -U skillsuser -d skills_matrix -c \
"SELECT d.slug, COUNT(r.*) FROM departments d LEFT JOIN resources r ON r.department_id=d.id GROUP BY d.slug ORDER BY d.slug;"
```
Expected: `projects-team` count unchanged from Task 1 Step 2; `cyber` = 0.

- [ ] **Step 6: Commit**

```bash
git add backend/routes/data.js
git commit -m "feat(departments): scope /api/data reads + writes by department"
```

---

## Task 5: Scope `resources.js`

**Files:**
- Modify: `backend/routes/resources.js`

**Interfaces:**
- Consumes: `req.departmentId`.
- Produces: all resource CRUD scoped to the active department.

- [ ] **Step 1: Scope reads and existence checks**

Add `department_id = $N` (with `req.departmentId` appended to params) to each query that touches `resources` directly:
- `resources.js:21` list → `... FROM resources WHERE department_id = $1 ORDER BY name`, `[req.departmentId]`.
- `resources.js:45` get-by-id → `... WHERE id = $1 AND department_id = $2`, `[id, req.departmentId]`.
- `resources.js:63` sub-skill join for a resource → add `AND r.department_id = $N` (join `resources r` if not already; if the query selects from `resource_sub_skills` by `resource_id`, the id was already validated by the get-by-id check above — keep behavior, just ensure the resource lookup that precedes it is scoped).
- `resources.js:131` create existence check → `SELECT id FROM resources WHERE id = $1 AND department_id = $2`.
- `resources.js:186`, `resources.js:284`, `resources.js:312` existence/update/delete checks → add `AND department_id = $N`.

- [ ] **Step 2: Set `department_id` on create**

`resources.js:144` insert → add the column:
```js
'INSERT INTO resources (id, name, email, password_hash, job_role, department_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, name, email, job_role, created_at'
```
Append `req.departmentId` to the params array.

- [ ] **Step 3: Scope the sub-skill validation join**

`resources.js:226` (`SELECT ss.id FROM sub_skills ss ...`) — ensure the joined `main_skills` is constrained to the department so a resource can't be assigned another department's skill:
```sql
SELECT ss.id FROM sub_skills ss
JOIN main_skills ms ON ss.main_skill_id = ms.id
WHERE /* existing predicate */ AND ms.department_id = $N
```
Append `req.departmentId`.

- [ ] **Step 4: Verify**

```bash
# A resource id from projects-team must NOT be visible under cyber.
RID=$(curl -s -u <user>:<pass> http://localhost:8098/api/resources -H 'X-Department: projects-team' \
  | python -c "import sys,json;print(json.load(sys.stdin)['data'][0]['id'])")
curl -s -o /dev/null -w "%{http_code}\n" -u <user>:<pass> \
  "http://localhost:8098/api/resources/$RID" -H 'X-Department: cyber'
```
Expected: `404` under `cyber`; `200` under `projects-team`.

- [ ] **Step 5: Commit**

```bash
git add backend/routes/resources.js
git commit -m "feat(departments): scope resources CRUD by department"
```

---

## Task 6: Scope `skills.js`

**Files:**
- Modify: `backend/routes/skills.js`

**Interfaces:**
- Consumes: `req.departmentId`, `req.departmentSlug`.
- Produces: all skill/sub-skill CRUD scoped to the active department; generated `main_skills.id` namespaced by slug.

- [ ] **Step 1: Scope main_skills reads + existence checks**

Add `department_id = $N` to: `skills.js:10` (list), `skills.js:67` (get-by-id), `skills.js:162` (duplicate check — match within department), `skills.js:252`, `skills.js:339`, `skills.js:390` (existence checks before sub-skill ops/delete). Append `req.departmentId` to each param list.

- [ ] **Step 2: Scope sub_skills reads via parent**

`skills.js:16` (list join), `skills.js:82`, `skills.js:110`, `skills.js:284`, `skills.js:403`, `skills.js:455`, `skills.js:499` all filter by `main_skill_id`. The `main_skill_id` is validated against the department in Step 1's existence checks, so these stay correct. For the list join at `skills.js:16`, add `WHERE ms.department_id = $1` (it joins `main_skills ms`), `[req.departmentId]`.

- [ ] **Step 3: Namespace + scope main_skills create**

`skills.js:176` insert. Generate the id with the slug prefix and store `department_id`:
```js
const mainSkillId = `${req.departmentSlug}-` + name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
// ...
'INSERT INTO main_skills (id, name, category, weight, skill_type, department_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, name, category, weight, skill_type, created_at'
```
Append `req.departmentId`. (If the route currently takes the id from the request body, switch to the generated namespaced id.)

- [ ] **Step 4: Verify isolation**

```bash
# Create "Cloud" under cyber and under engineering — both must succeed with distinct ids.
curl -s -u <user>:<pass> -X POST http://localhost:8098/api/skills -H 'X-Department: cyber' \
  -H 'Content-Type: application/json' -d '{"name":"Cloud"}'
curl -s -u <user>:<pass> -X POST http://localhost:8098/api/skills -H 'X-Department: engineering' \
  -H 'Content-Type: application/json' -d '{"name":"Cloud"}'
docker exec -i skills-matrix-db psql -U skillsuser -d skills_matrix -c \
"SELECT id, department_id FROM main_skills WHERE name='Cloud' ORDER BY id;"
```
Expected: two rows with ids `cyber-cloud` and `engineering-cloud`, different `department_id`s. (Delete these test rows afterward, or leave for the seed task to manage.)

- [ ] **Step 5: Commit**

```bash
git add backend/routes/skills.js
git commit -m "feat(departments): scope skills CRUD + namespace skill ids by department"
```

---

## Task 7: Scope `trainings.js`

**Files:**
- Modify: `backend/routes/trainings.js`

**Interfaces:**
- Consumes: `req.departmentId`.
- Produces: training catalogue + assignments scoped to the active department.

- [ ] **Step 1: Scope the catalogue queries**

- `trainings.js:9` (list) → `... FROM trainings WHERE department_id = $1 ORDER BY vendor, name`, `[req.departmentId]`.
- `trainings.js:20` (get-by-id) → `SELECT * FROM trainings WHERE id = $1 AND department_id = $2`, `[id, req.departmentId]`.
- `trainings.js:80` (delete) → `DELETE FROM trainings WHERE id = $1 AND department_id = $2 RETURNING id`.

- [ ] **Step 2: Set `department_id` on training create**

`trainings.js:35` insert → add `department_id` column + `req.departmentId` param.

- [ ] **Step 3: Scope assignment queries via resource membership**

`trainings.js:102`, `:124`, `:148` (`FROM resource_trainings rt ...`) join to `resources` and/or `trainings`. Add `AND r.department_id = $N` (joining `resources r` on `rt.resource_id`) so one department's training dashboard never shows another's assignments. For `trainings.js:169` (assignment insert) and `:220` (delete), validate the target resource + training belong to the active department before writing:
```js
// before INSERT/DELETE of resource_trainings:
const ok = await db.query(
  `SELECT 1 FROM resources r, trainings t
   WHERE r.id = $1 AND t.id = $2 AND r.department_id = $3 AND t.department_id = $3`,
  [resourceId, trainingId, req.departmentId]);
if (ok.rowCount === 0) return res.status(404).json({ success:false, error:'Resource or training not in this department' });
```

- [ ] **Step 4: Verify**

```bash
curl -s -u <user>:<pass> http://localhost:8098/api/trainings -H 'X-Department: cyber' | head -c 200
curl -s -u <user>:<pass> http://localhost:8098/api/trainings -H 'X-Department: projects-team' | head -c 200
```
Expected: `cyber` empty (until seeded), `projects-team` shows existing trainings.

- [ ] **Step 5: Commit**

```bash
git add backend/routes/trainings.js
git commit -m "feat(departments): scope trainings catalogue + assignments by department"
```

---

## Task 8: Scope `insights.js`

**Files:**
- Modify: `backend/routes/insights.js`

**Interfaces:**
- Consumes: `req.departmentId`.
- Produces: all insights aggregations computed only over the active department.

- [ ] **Step 1: Scope every root-table query**

Add the department filter to each site (append `req.departmentId` to params; if a query has no params today, use `$1`):
- `resources` sources: `insights.js:17`, `:272`, `:431`, `:562` → `WHERE r.department_id = $N` (alias `r`; the bare `FROM resources` at `:17` becomes `FROM resources WHERE department_id = $1`).
- `main_skills` sources: `insights.js:21`, `:310`, `:549`, `:698` → `WHERE ms.department_id = $N`.
- `resource_sub_skills` sources: `insights.js:27`, `:709` → join is already through `sub_skills`→`main_skills` or `resources`; add `AND ms.department_id = $N` (or `AND r.department_id = $N`) using whichever root the query already joins.
- `resource_trainings` sources: `insights.js:34`, `:39`, `:263`, `:719` → join `resources r ON rt.resource_id=r.id` and add `AND r.department_id = $N`.

> Because several of these are in `Promise.all` batches, keep each query's params self-contained — pass `[req.departmentId]` (and existing params) per call.

- [ ] **Step 2: Verify no cross-department bleed**

```bash
curl -s -u <user>:<pass> http://localhost:8098/api/insights -H 'X-Department: cyber' | head -c 300
```
Expected: empty/zeroed insights for `cyber` until seeded; `projects-team` unchanged from before this task (compare a couple of headline numbers against a pre-change capture).

- [ ] **Step 3: Commit**

```bash
git add backend/routes/insights.js
git commit -m "feat(departments): scope insights aggregations by department"
```

---

## Task 9: Scope `staffing.js`, `dataquality.js`, `export.js`

**Files:**
- Modify: `backend/routes/staffing.js`, `backend/routes/dataquality.js`, `backend/routes/export.js`

**Interfaces:**
- Consumes: `req.departmentId`.
- Produces: staffing search, data-quality report, and export all scoped to the active department.

- [ ] **Step 1: Scope `staffing.js`**

`staffing.js:35` (`FROM resources r ...`) → add `AND r.department_id = $N` (append `req.departmentId`). If the search builds a parameterized query dynamically, add the dept predicate as the first WHERE term and shift the placeholder indices accordingly.

- [ ] **Step 2: Scope `dataquality.js`**

In the `Promise.all`:
- `dataquality.js:24` (`FROM resources r`) → `WHERE r.department_id = $1`.
- `dataquality.js:30` (`FROM resources WHERE email IS NULL OR email=''`) → add `AND department_id = $1` (or wrap existing OR in parentheses: `WHERE (email IS NULL OR email='') AND department_id = $1`).
- `dataquality.js:33` (`FROM main_skills ms`) → `WHERE ms.department_id = $1`.
- `dataquality.js:44` (`FROM resource_sub_skills rss`) → join the owning root and add the filter (`JOIN resources r ON rss.resource_id=r.id ... AND r.department_id = $1`).
- `dataquality.js:57` (`FROM resource_trainings rt`) → `JOIN resources r ON rt.resource_id=r.id ... AND r.department_id = $1`.

Pass `[req.departmentId]` to each.

- [ ] **Step 3: Scope `export.js`**

- `export.js:27` (`SELECT id,name,email FROM resources`) → `WHERE department_id = $1 ORDER BY name`, `[req.departmentId]`.
- `export.js:21` (`FROM sub_skills ss`) → constrain via `JOIN main_skills ms ON ss.main_skill_id=ms.id WHERE ms.department_id = $1`.
- `export.js:31` (`FROM resource_sub_skills`) → `WHERE resource_id IN (SELECT id FROM resources WHERE department_id = $1)`.

- [ ] **Step 4: Verify**

```bash
curl -s -u <user>:<pass> "http://localhost:8098/api/data-quality?staleDays=365" -H 'X-Department: cyber' | head -c 200
curl -s -u <user>:<pass> -X POST http://localhost:8098/api/staffing/search -H 'X-Department: projects-team' \
  -H 'Content-Type: application/json' -d '{"requirements":[],"mode":"match"}' | head -c 200
```
Expected: data-quality for `cyber` shows zero/empty issues until seeded; staffing for `projects-team` returns existing people.

- [ ] **Step 5: Commit**

```bash
git add backend/routes/staffing.js backend/routes/dataquality.js backend/routes/export.js
git commit -m "feat(departments): scope staffing, data-quality, export by department"
```

---

## Task 10: Frontend API layer — send `X-Department` + DepartmentsAPI

**Files:**
- Modify: `frontend/api.js`

**Interfaces:**
- Produces: every `apiRequest` sends `X-Department: <activeSlug>`; `window.DepartmentsAPI.getAll()` and `window.DepartmentsAPI.rename(id, name)`; `window.getActiveDepartment()` / `window.setActiveDepartment(slug)` backed by `localStorage` key `activeDepartment` (default `projects-team`).

- [ ] **Step 1: Add active-department helpers + header injection**

At the top of `frontend/api.js` (after `const API_BASE = '/api';`):

```js
const ACTIVE_DEPT_KEY = 'activeDepartment';
const DEFAULT_DEPT_SLUG = 'projects-team';
function getActiveDepartment() {
  return localStorage.getItem(ACTIVE_DEPT_KEY) || DEFAULT_DEPT_SLUG;
}
function setActiveDepartment(slug) {
  localStorage.setItem(ACTIVE_DEPT_KEY, slug);
}
```

In `apiRequest`, add the header to `options.headers` (currently `api.js:15-19`):

```js
headers: {
  'Content-Type': 'application/json',
  'X-Department': getActiveDepartment()
},
```

- [ ] **Step 2: Add DepartmentsAPI**

After `StaffingAPI` / `DataQualityAPI` definitions:

```js
const DepartmentsAPI = {
  async getAll() { return await apiRequest('/departments', 'GET'); },
  async rename(id, name) { return await apiRequest(`/departments/${id}`, 'PATCH', { name }); }
};
```

- [ ] **Step 3: Export the new globals**

In the export block (`api.js:228-234`) add:

```js
window.DepartmentsAPI = DepartmentsAPI;
window.getActiveDepartment = getActiveDepartment;
window.setActiveDepartment = setActiveDepartment;
```

- [ ] **Step 4: Verify in the browser console**

Load `http://localhost:8098`, open devtools console:
```js
await DepartmentsAPI.getAll();        // -> array of 4 departments
getActiveDepartment();                // -> 'projects-team'
```
Network tab: confirm requests carry the `X-Department` header.

- [ ] **Step 5: Commit**

```bash
git add frontend/api.js
git commit -m "feat(departments): send X-Department header + DepartmentsAPI client"
```

---

## Task 11: Frontend switcher UI + rename + data reload

**Files:**
- Modify: `frontend/index.html` (header markup)
- Modify: `frontend/script.js` (init + handlers)

**Interfaces:**
- Consumes: `DepartmentsAPI`, `getActiveDepartment`/`setActiveDepartment`, the existing initial data-load function.
- Produces: a header switcher; selecting a department reloads data views and applies the theme; an inline rename control persists via `DepartmentsAPI.rename`.

- [ ] **Step 1: Find the existing header + initial-load entry point**

Search `frontend/script.js` for the function that runs on load and fetches data (e.g. `DataAPI.getAll()` / a `loadData`/`init` function). Note its name — call it `<loadAll>` below. Search `frontend/index.html` for the header container (where the theme toggle lives — search `theme-toggle`).

- [ ] **Step 2: Add the switcher markup**

In `frontend/index.html`, inside the header near the theme toggle, add:

```html
<div class="dept-switcher">
  <select id="deptSelect" class="dept-select" aria-label="Department"></select>
  <button id="deptRenameBtn" class="dept-rename-btn" title="Rename department" aria-label="Rename department">✎</button>
</div>
```

- [ ] **Step 3: Populate + wire the switcher in `script.js`**

Add an init function and call it from the existing on-load path (before/after `<loadAll>`):

```js
let DEPARTMENTS = [];

async function initDepartments() {
  DEPARTMENTS = await DepartmentsAPI.getAll();
  const sel = document.getElementById('deptSelect');
  const active = getActiveDepartment();
  sel.innerHTML = DEPARTMENTS.map(d =>
    `<option value="${d.slug}" data-id="${d.id}" ${d.slug === active ? 'selected' : ''}>${d.name}</option>`
  ).join('');
  applyDepartmentTheme(active);

  sel.addEventListener('change', async () => {
    setActiveDepartment(sel.value);
    applyDepartmentTheme(sel.value);
    await <loadAll>();           // re-fetch all views for the new department
  });

  document.getElementById('deptRenameBtn').addEventListener('click', renameActiveDepartment);
}

function applyDepartmentTheme(slug) {
  document.documentElement.setAttribute('data-department', slug);
}

async function renameActiveDepartment() {
  const sel = document.getElementById('deptSelect');
  const opt = sel.options[sel.selectedIndex];
  const id = opt.getAttribute('data-id');
  const current = opt.textContent;
  const name = window.prompt('Rename department:', current);
  if (!name || !name.trim() || name.trim() === current) return;
  const updated = await DepartmentsAPI.rename(id, name.trim());
  opt.textContent = updated.name;
  const d = DEPARTMENTS.find(x => String(x.id) === String(id));
  if (d) d.name = updated.name;
}
```

- [ ] **Step 4: Call `initDepartments()` on load**

In the existing DOM-ready / init sequence, call `await initDepartments();` before `<loadAll>()` so the active slug + theme are set before the first data fetch.

- [ ] **Step 5: Verify in the browser**

- Load the app: switcher shows 4 departments, Projects Team selected, blue accent.
- Switch to Cyber: views reload (empty until seed), accent shifts (after Task 12).
- Click ✎, rename Cyber → "Cyber Security": label updates, persists across reload.
- Reload page: previously selected department is still active (localStorage).

- [ ] **Step 6: Commit**

```bash
git add frontend/index.html frontend/script.js
git commit -m "feat(departments): header switcher + inline rename + theme apply"
```

---

## Task 12: Per-department accent theme

**Files:**
- Modify: `frontend/styles.css`

**Interfaces:**
- Consumes: `data-department` attribute on `<html>` (set in Task 11).
- Produces: subtle accent override per department slug; `projects-team` unchanged.

- [ ] **Step 1: Add department accent overrides**

Append to `frontend/styles.css` (after the `[data-theme=...]` blocks):

```css
/* Per-department accent overrides (subtle). projects-team keeps the default blue. */
[data-department="sales"]       { --accent: #f5a524; --accent-2: #f7b955; --accent-grad: #d98a10; }
[data-department="cyber"]       { --accent: #10b981; --accent-2: #34d399; --accent-grad: #0e8f6a; }
[data-department="engineering"] { --accent: #7c5cff; --accent-2: #9d86ff; --accent-grad: #5d3fe0; }

/* Optional: tint the switcher control with the active accent */
.dept-switcher { display: inline-flex; align-items: center; gap: 6px; }
.dept-select { background: transparent; color: var(--accent); border: 1px solid var(--accent); border-radius: 6px; padding: 4px 8px; }
.dept-rename-btn { background: transparent; border: 1px solid var(--accent); color: var(--accent); border-radius: 6px; cursor: pointer; padding: 4px 8px; }
.dept-rename-btn:hover { background: var(--accent); color: #fff; }
```

- [ ] **Step 2: Verify**

Switch departments in the UI and confirm: accent-colored elements (active tab underline, buttons, chart accents) shift per department; dark/light toggle still works under each; Projects Team is the original blue. Re-check the captured `__accent_snap.png`-style elements visually.

- [ ] **Step 3: Commit**

```bash
git add frontend/styles.css
git commit -m "feat(departments): subtle per-department accent themes"
```

---

## Task 13: Seed Sales, Cyber, Engineering (rich, UK names)

**Files:**
- Create: `backend/seed-departments.js`

**Interfaces:**
- Consumes: `backend/db.js`, the `departments` table, the scoped schema.
- Produces: ~10–14 resources (UK names), ~8–12 skill categories with sub-skills, ~8–12 trainings, and skill-level + training assignments for each of `sales`, `cyber`, `engineering`. Idempotent: skips a department that already has resources.

- [ ] **Step 1: Write the seeder engine**

Create `backend/seed-departments.js`:

```js
// Seeds Sales, Cyber, Engineering with realistic content (UK names).
// Idempotent: a department that already has resources is skipped.
// Run: node backend/seed-departments.js
const db = require('./db');

// Deterministic 1..5 level from a string (stable across runs).
function hashLevel(str, lo = 2, hi = 5) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return lo + (h % (hi - lo + 1));
}
const slugify = (dept, name) => `${dept}-` + name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

async function seedDept(client, dept, spec) {
  const d = await client.query('SELECT id FROM departments WHERE slug=$1', [dept]);
  if (d.rowCount === 0) throw new Error(`Department ${dept} missing — run migration 009 first`);
  const deptId = d.rows[0].id;

  const existing = await client.query('SELECT COUNT(*) c FROM resources WHERE department_id=$1', [deptId]);
  if (parseInt(existing.rows[0].c, 10) > 0) { console.log(`Skip ${dept}: already seeded`); return; }

  // main_skills + sub_skills
  const subIdByKey = {}; // `${mainName}::${subName}` -> sub_skill id
  for (const s of spec.skills) {
    const msId = slugify(dept, s.name);
    await client.query(
      'INSERT INTO main_skills (id, name, category, weight, skill_type, department_id) VALUES ($1,$2,$3,$4,$5,$6)',
      [msId, s.name, s.category || null, s.weight || 5, s.type || 'technical', deptId]);
    for (const sub of s.subs) {
      const r = await client.query(
        'INSERT INTO sub_skills (main_skill_id, name) VALUES ($1,$2) RETURNING id', [msId, sub]);
      subIdByKey[`${s.name}::${sub}`] = r.rows[0].id;
    }
  }

  // trainings
  const trainingIdByName = {};
  for (const t of spec.trainings) {
    const r = await client.query(
      'INSERT INTO trainings (name, code, vendor, category, type, department_id) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id',
      [t.name, t.code || null, t.vendor || null, t.category || 'other', t.type || 'certification', deptId]);
    trainingIdByName[t.name] = r.rows[0].id;
  }

  // people + skill levels + a couple of trainings each
  let i = 0;
  for (const p of spec.people) {
    const rid = slugify(dept, p.name) + '-' + (++i);
    await client.query(
      'INSERT INTO resources (id, name, email, job_role, department_id) VALUES ($1,$2,$3,$4,$5)',
      [rid, p.name, p.email || null, p.role || null, deptId]);
    for (const s of spec.skills) {
      for (const sub of s.subs) {
        const level = hashLevel(rid + s.name + sub);
        await client.query(
          'INSERT INTO resource_sub_skills (resource_id, sub_skill_id, level) VALUES ($1,$2,$3)',
          [rid, subIdByKey[`${s.name}::${sub}`], level]);
      }
    }
    // assign 2 trainings deterministically
    const tNames = Object.keys(trainingIdByName);
    const t1 = tNames[hashLevel(rid + 'a', 0, tNames.length - 1)];
    const t2 = tNames[hashLevel(rid + 'b', 0, tNames.length - 1)];
    for (const tn of new Set([t1, t2])) {
      await client.query(
        `INSERT INTO resource_trainings (resource_id, training_id, status)
         VALUES ($1,$2,$3) ON CONFLICT (resource_id, training_id) DO NOTHING`,
        [rid, trainingIdByName[tn], 'achieved']);
    }
  }
  console.log(`Seeded ${dept}: ${spec.people.length} people, ${spec.skills.length} skills, ${spec.trainings.length} trainings`);
}

async function main() {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');
    await seedDept(client, 'sales', require('./seed-data/sales'));
    await seedDept(client, 'cyber', require('./seed-data/cyber'));
    await seedDept(client, 'engineering', require('./seed-data/engineering'));
    await client.query('COMMIT');
    console.log('Seeding complete.');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('Seeding failed:', e.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await db.pool.end();
  }
}
main();
```

- [ ] **Step 2: Create the Sales data module**

Create `backend/seed-data/sales.js`:

```js
module.exports = {
  skills: [
    { name: 'Pipeline Management', category: 'Sales Process', subs: ['Lead Qualification', 'Forecasting', 'Pipeline Hygiene', 'Deal Review'] },
    { name: 'Negotiation', category: 'Selling', subs: ['Commercial Terms', 'Objection Handling', 'Closing Techniques'] },
    { name: 'CRM', category: 'Tools', subs: ['Salesforce', 'HubSpot', 'Reporting & Dashboards'] },
    { name: 'Solution Selling', category: 'Selling', subs: ['Discovery', 'Value Proposition', 'Demos & POCs'] },
    { name: 'Account Management', category: 'Post-Sale', subs: ['Renewals', 'Upsell & Cross-sell', 'QBRs'] },
    { name: 'Bid & Tender Management', category: 'Sales Process', subs: ['RFP Response', 'Pricing Strategy', 'Proposal Writing'] },
    { name: 'Commercial Awareness', category: 'Business', subs: ['Market Analysis', 'Competitor Intel', 'Margin Management'] },
    { name: 'Prospecting', category: 'Selling', subs: ['Cold Outreach', 'Social Selling', 'Networking'] },
  ],
  trainings: [
    { name: 'Salesforce Certified Administrator', vendor: 'Salesforce', category: 'crm', type: 'certification' },
    { name: 'MEDDIC Fundamentals', vendor: 'MEDDIC Academy', category: 'methodology', type: 'course' },
    { name: 'SPIN Selling', vendor: 'Huthwaite', category: 'methodology', type: 'course' },
    { name: 'Miller Heiman Strategic Selling', vendor: 'Korn Ferry', category: 'methodology', type: 'course' },
    { name: 'APMP Foundation (Bid Management)', vendor: 'APMP', category: 'bid', type: 'certification' },
    { name: 'HubSpot Sales Software', vendor: 'HubSpot', category: 'crm', type: 'certification' },
    { name: 'Negotiation Mastery', vendor: 'Harvard Online', category: 'skills', type: 'course' },
    { name: 'Challenger Sale', vendor: 'Gartner', category: 'methodology', type: 'course' },
  ],
  people: [
    { name: 'Oliver Bennett', role: 'Sales Director' },
    { name: 'Amelia Clarke', role: 'Account Executive' },
    { name: 'Harry Thompson', role: 'Business Development Manager' },
    { name: 'Sophie Walsh', role: 'Account Executive' },
    { name: 'Jack Robinson', role: 'Sales Development Rep' },
    { name: 'Charlotte Hughes', role: 'Key Account Manager' },
    { name: 'George Patel', role: 'Solutions Consultant' },
    { name: 'Emily Carter', role: 'Account Executive' },
    { name: 'Thomas Wright', role: 'Bid Manager' },
    { name: 'Isla Murray', role: 'Sales Development Rep' },
    { name: 'William Foster', role: 'Commercial Manager' },
    { name: 'Grace Edwards', role: 'Account Executive' },
  ],
};
```

- [ ] **Step 3: Create the Cyber data module**

Create `backend/seed-data/cyber.js`:

```js
module.exports = {
  skills: [
    { name: 'Security Operations', category: 'Defensive', subs: ['SIEM (Splunk/Sentinel)', 'Log Analysis', 'Alert Triage', 'SOAR'] },
    { name: 'Incident Response', category: 'Defensive', subs: ['Containment', 'Forensics', 'Root Cause Analysis', 'Playbooks'] },
    { name: 'Threat Intelligence', category: 'Defensive', subs: ['IOC Analysis', 'MITRE ATT&CK', 'Threat Hunting'] },
    { name: 'Penetration Testing', category: 'Offensive', subs: ['Web App Testing', 'Network Testing', 'Active Directory', 'Reporting'] },
    { name: 'Cloud Security', category: 'Cloud', subs: ['AWS Security', 'Azure Security', 'Container Security', 'IaC Scanning'] },
    { name: 'Identity & Access Management', category: 'Architecture', subs: ['SSO & MFA', 'Privileged Access', 'Zero Trust'] },
    { name: 'Governance Risk & Compliance', category: 'GRC', subs: ['ISO 27001', 'Risk Assessment', 'Audit', 'Policy'] },
    { name: 'Network Security', category: 'Infrastructure', subs: ['Firewalls', 'IDS/IPS', 'VPN', 'Segmentation'] },
    { name: 'Application Security', category: 'Offensive', subs: ['SAST/DAST', 'Secure Code Review', 'OWASP Top 10'] },
  ],
  trainings: [
    { name: 'CISSP', vendor: 'ISC2', category: 'security', type: 'certification' },
    { name: 'CISM', vendor: 'ISACA', category: 'security', type: 'certification' },
    { name: 'CEH (Certified Ethical Hacker)', vendor: 'EC-Council', category: 'security', type: 'certification' },
    { name: 'OSCP', vendor: 'OffSec', category: 'security', type: 'certification' },
    { name: 'CompTIA Security+', vendor: 'CompTIA', category: 'security', type: 'certification' },
    { name: 'ISO 27001 Lead Auditor', vendor: 'BSI', category: 'grc', type: 'certification' },
    { name: 'Microsoft SC-200 (Security Operations Analyst)', vendor: 'Microsoft', category: 'cloud', type: 'certification' },
    { name: 'AWS Certified Security – Specialty', vendor: 'AWS', category: 'cloud', type: 'certification' },
    { name: 'GIAC GCIH (Incident Handler)', vendor: 'GIAC', category: 'security', type: 'certification' },
  ],
  people: [
    { name: 'Daniel Okafor', role: 'Head of Cyber' },
    { name: 'Priya Sharma', role: 'SOC Analyst' },
    { name: 'Ryan MacLeod', role: 'Penetration Tester' },
    { name: 'Hannah Lewis', role: 'Incident Responder' },
    { name: 'Mohammed Iqbal', role: 'Security Engineer' },
    { name: 'Lucy Fairweather', role: 'GRC Analyst' },
    { name: 'Callum Reid', role: 'Threat Intelligence Analyst' },
    { name: 'Aisha Khan', role: 'Cloud Security Engineer' },
    { name: 'Nathan Brooks', role: 'SOC Analyst' },
    { name: 'Freya Donnelly', role: 'Security Architect' },
    { name: 'Samuel Owusu', role: 'Penetration Tester' },
    { name: 'Chloe Ashworth', role: 'IAM Specialist' },
    { name: 'Adam Pickering', role: 'AppSec Engineer' },
  ],
};
```

- [ ] **Step 4: Create the Engineering data module**

Create `backend/seed-data/engineering.js`:

```js
module.exports = {
  skills: [
    { name: 'Software Engineering', category: 'Development', subs: ['JavaScript/TypeScript', 'Python', 'Java', 'Code Review'] },
    { name: 'Cloud Platforms', category: 'Cloud', subs: ['AWS', 'Azure', 'GCP', 'Cost Optimisation'] },
    { name: 'DevOps & CI/CD', category: 'Platform', subs: ['Docker', 'Kubernetes', 'Terraform', 'Pipelines (GitHub Actions)'] },
    { name: 'Systems Design', category: 'Architecture', subs: ['Scalability', 'Resilience', 'API Design', 'Event-Driven'] },
    { name: 'Databases', category: 'Data', subs: ['PostgreSQL', 'Query Optimisation', 'Data Modelling', 'NoSQL'] },
    { name: 'Testing & QA', category: 'Quality', subs: ['Unit Testing', 'Integration Testing', 'Test Automation', 'Performance Testing'] },
    { name: 'Networking', category: 'Infrastructure', subs: ['TCP/IP', 'DNS', 'Load Balancing', 'CDN'] },
    { name: 'Observability', category: 'Platform', subs: ['Logging', 'Metrics', 'Tracing', 'Alerting'] },
    { name: 'Security Engineering', category: 'Quality', subs: ['Secure Defaults', 'Secrets Management', 'Dependency Scanning'] },
  ],
  trainings: [
    { name: 'AWS Certified Solutions Architect – Associate', vendor: 'AWS', category: 'cloud', type: 'certification' },
    { name: 'Microsoft Azure Administrator (AZ-104)', vendor: 'Microsoft', category: 'cloud', type: 'certification' },
    { name: 'Certified Kubernetes Administrator (CKA)', vendor: 'CNCF', category: 'platform', type: 'certification' },
    { name: 'HashiCorp Terraform Associate', vendor: 'HashiCorp', category: 'platform', type: 'certification' },
    { name: 'TOGAF 9 Foundation', vendor: 'The Open Group', category: 'architecture', type: 'certification' },
    { name: 'Professional Scrum Developer', vendor: 'Scrum.org', category: 'process', type: 'certification' },
    { name: 'Google Professional Cloud Architect', vendor: 'Google', category: 'cloud', type: 'certification' },
    { name: 'Chartered Engineer (CEng) Pathway', vendor: 'Engineering Council', category: 'professional', type: 'training' },
  ],
  people: [
    { name: 'James Whitfield', role: 'Engineering Lead' },
    { name: 'Sarah Donovan', role: 'Senior Software Engineer' },
    { name: 'Ben Carmichael', role: 'DevOps Engineer' },
    { name: 'Olivia Hartley', role: 'Software Engineer' },
    { name: 'Raj Malhotra', role: 'Cloud Architect' },
    { name: 'Megan Pryce', role: 'QA Engineer' },
    { name: 'Tom Ellingham', role: 'Platform Engineer' },
    { name: 'Niamh Gallagher', role: 'Software Engineer' },
    { name: 'David Sinclair', role: 'Database Engineer' },
    { name: 'Rebecca Nolan', role: 'Site Reliability Engineer' },
    { name: 'Aaron Whitcombe', role: 'Software Engineer' },
    { name: 'Lauren Beckett', role: 'Senior Software Engineer' },
    { name: 'Kieran Doyle', role: 'DevOps Engineer' },
    { name: 'Hannah Stirling', role: 'Engineering Manager' },
  ],
};
```

- [ ] **Step 5: Run the seeder**

```bash
# Run inside the container so it uses the container's DB + env:
docker exec -i skills-matrix-db node /app/backend/seed-departments.js
# (Adjust /app path to the container's working dir; check Dockerfile if unsure.)
```
Expected: three "Seeded …" lines, then "Seeding complete." Re-running prints "Skip … already seeded" for each.

- [ ] **Step 6: Verify seeded counts + isolation**

```bash
docker exec -i skills-matrix-db psql -U skillsuser -d skills_matrix -c \
"SELECT d.slug, COUNT(DISTINCT r.id) people, COUNT(DISTINCT ms.id) skills, COUNT(DISTINCT t.id) trainings
 FROM departments d
 LEFT JOIN resources r ON r.department_id=d.id
 LEFT JOIN main_skills ms ON ms.department_id=d.id
 LEFT JOIN trainings t ON t.department_id=d.id
 GROUP BY d.slug ORDER BY d.slug;"
```
Expected: each new department shows its people/skills/trainings counts; `projects-team` unchanged from Task 1 baseline.

- [ ] **Step 7: Commit**

```bash
git add backend/seed-departments.js backend/seed-data/
git commit -m "feat(departments): rich seed data for Sales/Cyber/Engineering (UK names)"
```

---

## Task 14: End-to-end verification

**Files:** none (verification only)

- [ ] **Step 1: Run the middleware unit tests**

Run: `node --test backend/middleware/department.test.js`
Expected: PASS.

- [ ] **Step 2: Cross-department isolation sweep**

For each endpoint, confirm switching the `X-Department` header changes the result and never leaks:

```bash
for D in projects-team sales cyber engineering; do
  echo "== $D =="
  curl -s -u <user>:<pass> http://localhost:8098/api/data -H "X-Department: $D" \
    | python -c "import sys,json;d=json.load(sys.stdin)['data'];print('resources',len(d['resources']),'skills',len(d['skills']))"
done
```
Expected: four distinct, non-empty results; counts match Task 13 Step 6.

- [ ] **Step 3: Destructive-path isolation**

```bash
# Capture all counts, POST empty data to 'sales', re-check — only 'sales' changes.
docker exec -i skills-matrix-db psql -U skillsuser -d skills_matrix -c \
"SELECT department_id, COUNT(*) FROM resources GROUP BY department_id ORDER BY department_id;"
# (Run only if you are willing to wipe sales; otherwise skip — covered functionally in Task 4.)
```

- [ ] **Step 4: Full UI walk-through**

In the browser at `http://localhost:8098`:
- Switcher lists 4 departments; each loads its own people/skills/trainings.
- Each department shows its accent; dark/light toggle works under each.
- Rename a department; reload — name persists, accent unchanged, data intact.
- Insights / heatmap / radar / trainings views render per department without console errors.
- Projects Team data matches what was there before this feature.

- [ ] **Step 5: Final commit / branch ready for PR**

```bash
git status   # clean
git log --oneline main..HEAD
```
Confirm the task commits are present, then open a PR to `main` when ready.

---

## Self-Review Notes (coverage check against the spec)

- Data model (departments table, department_id, constraint swap) → Task 1. ✅
- Backup-first → Task 1 Step 1. ✅
- Scoping middleware (X-Department) → Task 2. ✅
- Departments API (GET + PATCH rename, name-only) → Task 3. ✅
- Query scoping across all 8 route files (~65 sites) → Tasks 4–9. ✅
- `POST /api/data` whole-DB-wipe → department-scoped fix → Task 4. ✅
- ID collision (main_skills/resources global PKs) namespaced by slug → Tasks 4, 6, 13. ✅
- Frontend header injection + DepartmentsAPI + localStorage → Task 10. ✅
- Switcher UI + inline rename + reload → Task 11. ✅
- Per-department accent theme keyed off slug → Task 12. ✅
- Rich UK seed data, idempotent → Task 13. ✅
- Migration safety / isolation / rename / theme testing → Tasks 1, 14. ✅
