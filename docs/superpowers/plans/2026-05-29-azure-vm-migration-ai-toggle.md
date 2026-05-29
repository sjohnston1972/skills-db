# Azure VM Migration + Master AI Switch Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the Skills Matrix to a dedicated Azure Linux VM as the same single self-contained Docker image with durable Postgres persistence, and add a master AI on/off switch in Settings.

**Architecture:** Two workstreams. (A) **Migration** — ops/runbook changes: a named Docker volume for Postgres data on the VM's managed disk, Azure disk snapshots for backup, build-on-VM-from-git, and a one-time `pg_dump`/restore data move. The image and app code are unchanged. (B) **Master AI switch** — a single `ai_enabled` boolean stored in the existing `metadata` key/value table, enforced server-side in both AI endpoints (zero Anthropic spend when off) and surfaced as a Settings toggle that hides the chatbot launcher and the AI-match button.

**Tech Stack:** Docker / docker-compose, PostgreSQL, Node.js/Express, vanilla JS frontend, Nginx, Azure managed disks. No test runner exists — verification is integration-style (`curl` against a running container) and manual browser checks, matching the project's existing approach.

**Spec:** `docs/superpowers/specs/2026-05-29-azure-vm-migration-ai-toggle-design.md`

**Conventions for this plan:**
- The running container is named `skills-matrix-db` (per `docker-compose.yml` / `container_name`).
- DB defaults (from `backend/db.js`): database `skills_matrix`, user `skillsuser`.
- "Rebuild & run" means: `docker compose down && docker compose build && docker compose up -d` from the project root.
- The image tag in `docker-compose.yml` is `skills-matrix:latest`; keep using it.

---

## Part B first (AI switch) — it's self-contained code and testable locally before you touch the VM

> Build and verify the AI switch on the laptop/dev container first, commit it, *then* do the migration (Part A) so the VM gets the finished image.

---

### Task 1: Backend — add `ai_enabled` flag storage + flags API

**Files:**
- Modify: `backend/routes/settings.js`

- [ ] **Step 1: Add the flag allow-list, defaults, and `getFlag` helper**

In `backend/routes/settings.js`, just below the existing line
`const API_KEY_META_KEYS = ['anthropic_api_key'];`, add:

```js
// Boolean feature flags stored as text 'true'/'false' in the metadata table.
const FLAG_KEYS = ['ai_enabled'];
const FLAG_DEFAULTS = { ai_enabled: true };

// Read a boolean flag, DB-first, falling back to the supplied default.
async function getFlag(name, def) {
    const r = await db.query(`SELECT value FROM metadata WHERE key = $1`, [name]);
    if (r.rows.length && r.rows[0].value != null) return r.rows[0].value === 'true';
    return def;
}
```

- [ ] **Step 2: Add the `GET /flags` and `PUT /flags/:name` routes**

In `backend/routes/settings.js`, immediately **before** the line
`// Internal helper: get an API key, DB-first then env fallback`, add:

```js
/** GET /api/settings/flags — current feature-flag values. */
router.get('/flags', async (req, res) => {
    try {
        const out = {};
        for (const k of FLAG_KEYS) out[k] = await getFlag(k, FLAG_DEFAULTS[k]);
        res.json({ success: true, data: out });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

/** PUT /api/settings/flags/:name  body { value: boolean } — set a flag. */
router.put('/flags/:name', async (req, res) => {
    try {
        const { name } = req.params;
        if (!FLAG_KEYS.includes(name)) {
            return res.status(400).json({ success: false, error: 'Unknown flag name' });
        }
        const { value } = req.body || {};
        if (typeof value !== 'boolean') {
            return res.status(400).json({ success: false, error: 'value must be a boolean' });
        }
        await db.query(
            `INSERT INTO metadata (key, value) VALUES ($1, $2)
             ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP`,
            [name, String(value)]
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});
```

- [ ] **Step 3: Export `getFlag` so other routes can read it**

At the bottom of `backend/routes/settings.js`, find:

```js
module.exports = router;
module.exports.getApiKey = getApiKey;
```

Change it to:

```js
module.exports = router;
module.exports.getApiKey = getApiKey;
module.exports.getFlag = getFlag;
```

- [ ] **Step 4: Rebuild & run, then verify the flags API round-trips**

Rebuild & run the container, then:

```bash
# Default should be true (no row yet)
curl -s http://localhost:8098/api/settings/flags
# Expected: {"success":true,"data":{"ai_enabled":true}}

# Turn it off
curl -s -X PUT http://localhost:8098/api/settings/flags/ai_enabled \
  -H 'Content-Type: application/json' -d '{"value":false}'
# Expected: {"success":true}

curl -s http://localhost:8098/api/settings/flags
# Expected: {"success":true,"data":{"ai_enabled":false}}

# Reject unknown flag and non-boolean value
curl -s -X PUT http://localhost:8098/api/settings/flags/bogus \
  -H 'Content-Type: application/json' -d '{"value":true}'
# Expected: {"success":false,"error":"Unknown flag name"}

curl -s -X PUT http://localhost:8098/api/settings/flags/ai_enabled \
  -H 'Content-Type: application/json' -d '{"value":"yes"}'
# Expected: {"success":false,"error":"value must be a boolean"}

# Turn it back on for the next tasks
curl -s -X PUT http://localhost:8098/api/settings/flags/ai_enabled \
  -H 'Content-Type: application/json' -d '{"value":true}'
```

> Note: `/api/` requires nginx Basic Auth in some setups. If the curls return `401`, add `-u <user>:<pass>` (a `.htpasswd` user) to each command.

- [ ] **Step 5: Commit**

```bash
git add backend/routes/settings.js
git commit -m "feat(settings): add ai_enabled flag storage + /flags API"
```

---

### Task 2: Backend — enforce `ai_enabled` in both AI endpoints

**Files:**
- Modify: `backend/routes/insights.js` (import at line 4; guards in `/match/ai` and `/chat` handlers)

- [ ] **Step 1: Import `getFlag`**

In `backend/routes/insights.js`, change line 4 from:

```js
const { getApiKey } = require('./settings');
```

to:

```js
const { getApiKey, getFlag } = require('./settings');
```

- [ ] **Step 2: Guard `POST /match/ai`**

In `backend/routes/insights.js`, in the `router.post('/match/ai', ...)` handler, the body starts with:

```js
    try {
        const apiKey = await getApiKey('anthropic_api_key');
```

Insert the guard so it reads:

```js
    try {
        if (!(await getFlag('ai_enabled', true))) {
            return res.status(403).json({ success: false, error: 'AI features are disabled in Settings.' });
        }
        const apiKey = await getApiKey('anthropic_api_key');
```

- [ ] **Step 3: Guard `POST /chat`**

In the same file, in the `router.post('/chat', ...)` handler, the body also starts with:

```js
    try {
        const apiKey = await getApiKey('anthropic_api_key');
```

Insert the same guard so it reads:

```js
    try {
        if (!(await getFlag('ai_enabled', true))) {
            return res.status(403).json({ success: false, error: 'AI features are disabled in Settings.' });
        }
        const apiKey = await getApiKey('anthropic_api_key');
```

> There are two `try { const apiKey = await getApiKey('anthropic_api_key');` occurrences (match/ai and chat). Edit **both**. The guard runs *before* `getApiKey`, so no Anthropic call can happen when AI is off.

- [ ] **Step 4: Rebuild & run, then verify enforcement**

```bash
# Turn AI off
curl -s -X PUT http://localhost:8098/api/settings/flags/ai_enabled \
  -H 'Content-Type: application/json' -d '{"value":false}'

# Both AI endpoints must refuse with 403 and make NO Anthropic call
curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:8098/api/insights/chat \
  -H 'Content-Type: application/json' -d '{"messages":[{"role":"user","content":"hi"}]}'
# Expected: 403

curl -s -X POST http://localhost:8098/api/insights/match/ai \
  -H 'Content-Type: application/json' -d '{"spec":"need a senior pm"}'
# Expected: {"success":false,"error":"AI features are disabled in Settings."}

# Turn AI back on — endpoints behave as before (503 if no key, or real reply if key set)
curl -s -X PUT http://localhost:8098/api/settings/flags/ai_enabled \
  -H 'Content-Type: application/json' -d '{"value":true}'
curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:8098/api/insights/chat \
  -H 'Content-Type: application/json' -d '{"messages":[{"role":"user","content":"hi"}]}'
# Expected: 503 if no key configured, 200 if a key is set
```

- [ ] **Step 5: Commit**

```bash
git add backend/routes/insights.js
git commit -m "feat(insights): gate chat + match/ai behind ai_enabled flag"
```

---

### Task 3: Frontend — Settings toggle markup

**Files:**
- Modify: `frontend/index.html` (AI / API Keys card, around lines 568–585)

- [ ] **Step 1: Add the toggle to the "AI / API Keys" management card**

In `frontend/index.html`, find the AI/API Keys card. The closing of the `apikey-row` div and card looks like:

```html
                        <button type="button" class="btn-primary" id="anthropicSaveBtn">Save</button>
                    </div>
                </div>
```

Insert a new block **between** the `apikey-row` closing `</div>` and the card's closing `</div>`, so it becomes:

```html
                        <button type="button" class="btn-primary" id="anthropicSaveBtn">Save</button>
                    </div>

                    <div class="ai-toggle-row" style="margin-top:1.25rem; display:flex; align-items:center; gap:0.6rem;">
                        <input type="checkbox" id="aiEnabledToggle">
                        <label for="aiEnabledToggle" style="margin:0; cursor:pointer;">
                            <strong>Enable AI features</strong>
                            <span style="color: var(--text-secondary); font-size: 0.85rem;"> — floating chatbot &amp; AI project matching. When off, no requests are sent to Anthropic.</span>
                        </label>
                    </div>
                </div>
```

- [ ] **Step 2: Bump the asset version (cache-bust) for index.html's script reference**

In `frontend/index.html`, find the `<script src="script.js?v=NNN">` tag and increment `NNN` by 1 (this project bumps versions manually). Note the new value — use the same new value in Task 4's commit.

> If `styles.css?v=NNN` is also referenced and you add CSS later, bump it too. This task adds no CSS (inline styles used), so only the script tag needs bumping if you stop here — but you will also edit script.js in Task 4, so a single bump after Task 4 is fine. Defer the bump to Task 4 Step 4 to avoid double-bumping.

- [ ] **Step 3: Commit**

```bash
git add frontend/index.html
git commit -m "feat(settings-ui): add Enable AI features toggle markup"
```

---

### Task 4: Frontend — wire the toggle + hide chatbot launcher & AI-match button when off

**Files:**
- Modify: `frontend/script.js` (`renderManagement` ~line 2767; new `loadAiFlag`/`saveAiFlag`; `Chat` object ~line 5056; new `applyAiMatchVisibility`)
- Modify: `frontend/index.html` (version bump)

- [ ] **Step 1: Load + save the flag from the Settings view**

In `frontend/script.js`, in `renderManagement()` (~line 2767), find:

```js
function renderManagement() {
    loadAdminUsers();
    loadApiKeyStatus();
```

Change to:

```js
function renderManagement() {
    loadAdminUsers();
    loadApiKeyStatus();
    loadAiFlag();
```

Then, in the same `renderManagement()`, inside the `if (!managementListenersInit) { ... }` block, just after:

```js
        document.getElementById('anthropicRevokeBtn').addEventListener('click', () => revokeApiKey('anthropic_api_key'));
```

add:

```js
        document.getElementById('aiEnabledToggle').addEventListener('change', (e) => saveAiFlag(e.target.checked));
```

- [ ] **Step 2: Add `loadAiFlag` and `saveAiFlag` functions**

In `frontend/script.js`, immediately **after** the `revokeApiKey` function (ends ~line 2845 with its closing `}`), add:

```js
async function loadAiFlag() {
    try {
        const r = await fetch(`${API_BASE}/settings/flags`);
        const j = await r.json();
        if (!j.success) throw new Error(j.error || 'failed');
        const toggle = document.getElementById('aiEnabledToggle');
        if (toggle) toggle.checked = j.data.ai_enabled !== false;
    } catch (err) {
        showToast(`Could not load AI setting: ${err.message}`, 'error');
    }
}

async function saveAiFlag(value) {
    try {
        const r = await fetch(`${API_BASE}/settings/flags/ai_enabled`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ value }),
        });
        const j = await r.json();
        if (!r.ok || !j.success) throw new Error(j.error || `HTTP ${r.status}`);
        showToast(`AI features ${value ? 'enabled' : 'disabled'}`, 'success');
        Chat.applyEnabled(value);
        applyAiMatchVisibility();
    } catch (err) {
        showToast(`Save failed: ${err.message}`, 'error');
        loadAiFlag(); // resync toggle with server state on failure
    }
}
```

- [ ] **Step 3: Gate the chatbot launcher in the `Chat` object**

In `frontend/script.js`, in the `Chat` object (~line 5056), find the property block:

```js
    bound: false,
    history: [],   // [{role:'user'|'assistant', content}]
    busy: false,
    keyChecked: false,
    keyConfigured: false,
```

Add an `aiEnabled` property:

```js
    bound: false,
    history: [],   // [{role:'user'|'assistant', content}]
    busy: false,
    keyChecked: false,
    keyConfigured: false,
    aiEnabled: true,
```

Then find the end of `init()` — the last statement before its closing `},`:

```js
        this.renderEmpty();
    },
```

Change it to also check the flag on load:

```js
        this.renderEmpty();
        this.checkEnabled();
    },

    async checkEnabled() {
        try {
            const r = await fetch(`${API_BASE}/settings/flags`);
            const j = await r.json();
            this.applyEnabled(!(j && j.data && j.data.ai_enabled === false));
        } catch {
            this.applyEnabled(true); // fail open — never hide due to a transient error
        }
    },

    applyEnabled(enabled) {
        this.aiEnabled = enabled;
        const widget = document.getElementById('chatWidget');
        if (widget) widget.style.display = enabled ? '' : 'none';
        if (!enabled) this.close();
    },
```

- [ ] **Step 4: Add `applyAiMatchVisibility` and call it where the match button binds**

In `frontend/script.js`, find where `matchSpecAiBtn` is bound (~line 4935):

```js
        document.getElementById('matchSpecBtn').addEventListener('click', runProjectMatch);
        document.getElementById('matchSpecAiBtn').addEventListener('click', runProjectMatchAI);
```

Immediately after those two lines (still inside the `if (!insightsBound)` block), add:

```js
        applyAiMatchVisibility();
```

Then add the function itself immediately **before** the `async function runProjectMatchAI()` definition (~line 4942):

```js
async function applyAiMatchVisibility() {
    const btn = document.getElementById('matchSpecAiBtn');
    if (!btn) return;
    try {
        const r = await fetch(`${API_BASE}/settings/flags`);
        const j = await r.json();
        btn.style.display = (j && j.data && j.data.ai_enabled === false) ? 'none' : '';
    } catch { /* leave visible on error */ }
}
```

Now bump the asset version: in `frontend/index.html` increment the `script.js?v=NNN` value by 1 (the deferred bump from Task 3 Step 2).

- [ ] **Step 5: Rebuild & run, then verify in the browser**

Rebuild & run, then in a browser at `http://localhost:8098`:

1. Open **Settings** → the "Enable AI features" checkbox reflects the current flag (on by default).
2. **Uncheck it.** Confirm: toast "AI features disabled"; the floating chat launcher (bottom corner) disappears; in **Project Matching**, the AI match button is hidden (the rule-based match button remains).
3. Reload the page. Confirm the launcher stays hidden and the toggle is still unchecked (persisted in DB).
4. **Re-check it.** Confirm the launcher reappears and the AI match button returns.

Also re-run the backend curls from Task 2 Step 4 to confirm the endpoints still agree with the toggle.

- [ ] **Step 6: Commit**

```bash
git add frontend/script.js frontend/index.html
git commit -m "feat(settings-ui): wire AI toggle; hide chatbot + AI-match when disabled"
```

---

## Part A — Migration (run after Part B is committed and the image is final)

> These tasks change deployment artifacts and add a runbook. There is no automated test; verification is running the container and observing data survival.

---

### Task 5: Add a named Postgres volume to the deployment

**Files:**
- Modify: `docker-compose.yml`

- [ ] **Step 1: Declare the volume and mount it**

Replace the contents of `docker-compose.yml` with:

```yaml
version: '3.8'

services:
  skills-matrix-db:
    image: skills-matrix:latest
    container_name: skills-matrix-db
    restart: unless-stopped
    networks:
      - net_core
    ports:
      - "8098:80"
    volumes:
      - skills_db_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost/api/health"]
      interval: 30s
      timeout: 10s
      start_period: 40s
      retries: 3

networks:
  net_core:
    external: true

volumes:
  skills_db_data:
```

> The volume keeps Postgres data outside the image. The image stays a single rebuildable artifact — "self-contained" is preserved. On the VM this volume lives on the managed disk and is captured by disk snapshots.

- [ ] **Step 2: Verify data survives a rebuild (the whole point)**

```bash
# Start fresh, make a visible change through the UI or API (e.g. add a resource),
# then prove it survives a full rebuild:
docker compose up -d
# ... add a resource named "VOLUME-TEST" via the UI or:
curl -s -X POST http://localhost:8098/api/resources -H 'Content-Type: application/json' \
  -d '{"name":"VOLUME-TEST","role":"Test"}'

docker compose down            # containers removed, volume retained
docker compose build
docker compose up -d
sleep 15
curl -s http://localhost:8098/api/resources | grep -c "VOLUME-TEST"
# Expected: 1  (data survived the rebuild)
```

> ⚠️ If the count is `0`, the image initialises a fresh DB over the mount (init-db.sql re-seeding). Stop and investigate the Dockerfile's Postgres init before continuing — do NOT proceed to the VM. (Postgres only runs init scripts on an empty data dir, so a populated volume should be left untouched.)

- [ ] **Step 3: Clean up the test row and commit**

```bash
# remove the test resource via UI, or DELETE /api/resources/:id
git add docker-compose.yml
git commit -m "feat(deploy): add named Postgres volume for durable persistence"
```

---

### Task 6: Add a restore helper for the one-time data move

**Files:**
- Create: `restore.sh`

- [ ] **Step 1: Create `restore.sh`**

Create `restore.sh` in the project root:

```bash
#!/usr/bin/env bash
# Restore a Skills Matrix pg_dump into the running container's Postgres.
# Usage: ./restore.sh <dump-file.sql>
# The dump should be produced with: pg_dump --clean --if-exists (see README migration section).
set -euo pipefail

DUMP="${1:?Usage: ./restore.sh <dump-file.sql>}"
CONTAINER="${CONTAINER:-skills-matrix-db}"
DB_NAME="${DB_NAME:-skills_matrix}"
DB_USER="${DB_USER:-skillsuser}"

if [ ! -f "$DUMP" ]; then
  echo "Dump file not found: $DUMP" >&2
  exit 1
fi

echo "Restoring $DUMP into $CONTAINER ($DB_NAME as $DB_USER)..."
docker exec -i "$CONTAINER" psql -v ON_ERROR_STOP=1 -U "$DB_USER" -d "$DB_NAME" < "$DUMP"
echo "Restore complete."
```

- [ ] **Step 2: Make it executable and smoke-test the dump side locally**

```bash
chmod +x restore.sh

# Produce a clean dump from the currently running (laptop) container:
docker exec skills-matrix-db pg_dump --clean --if-exists -U skillsuser skills_matrix > backups/migrate-test.sql

# Confirm the dump is non-empty and contains expected tables
grep -c "CREATE TABLE\|COPY public" backups/migrate-test.sql
# Expected: a positive number (tables + data present)
```

> `backups/` is gitignored, so the dump won't be committed. That's intended.

- [ ] **Step 3: Commit the helper**

```bash
git add restore.sh
git commit -m "chore(deploy): add restore.sh for one-time data migration"
```

---

### Task 7: Write the Azure VM deployment runbook (supersede the native-install doc)

**Files:**
- Create: `docs/DEPLOY-AZURE-VM.md`
- Modify: `MIGRATION-TO-LINUX-VM.md` (mark superseded)

- [ ] **Step 1: Create `docs/DEPLOY-AZURE-VM.md`**

Create the file with this content:

````markdown
# Deploy Skills Matrix to an Azure Linux VM (container model)

The Skills Matrix runs as a **single self-contained Docker image** (PostgreSQL +
Node.js + Nginx). On Azure it runs on one Linux VM on a **private network with no
public hostname** — no Cloudflare Tunnel, no Let's Encrypt, plain HTTP on the
private network.

This supersedes `MIGRATION-TO-LINUX-VM.md` (which described a native, non-container
install and is no longer the chosen approach).

## 1. Provision the VM
- Ubuntu 22.04 LTS, 2 vCPU / 4 GB RAM / 30 GB managed disk.
- Attach to the private vNet/subnet. No public IP / no inbound 80/443 from the internet.
- Allow inbound port 8098 (or 80) **only from the private network** via the NSG.

## 2. Install Docker Engine + git
```bash
sudo apt update && sudo apt install -y git ca-certificates curl
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker "$USER"   # log out/in for group to take effect
docker --version && docker compose version
```

## 3. Clone and configure
```bash
git clone <your-repo-url> skills-db
cd skills-db
cp .env.example .env 2>/dev/null || true   # if present
# Create/edit .env with the production values (NOT committed — .env is gitignored):
#   DB_HOST=localhost
#   DB_PORT=5432
#   DB_NAME=skills_matrix
#   DB_USER=skillsuser
#   DB_PASSWORD=<a strong password>
#   NODE_ENV=production
nano .env
```
> The Anthropic API key is NOT set here — it lives in the database (`metadata` table)
> and arrives with the data restore in step 5, or is entered later via
> Settings → AI / API Keys.

## 4. Build and start
```bash
docker compose build
docker compose up -d
docker compose ps   # wait for healthy
```
On first start with the empty named volume, the image initialises a fresh database.

## 5. One-time data migration from the laptop
On the **laptop**:
```bash
docker exec skills-matrix-db pg_dump --clean --if-exists -U skillsuser skills_matrix > migrate.sql
scp migrate.sql <vm-user>@<vm-private-ip>:~/skills-db/migrate.sql
```
On the **VM**:
```bash
cd ~/skills-db
./restore.sh migrate.sql
```
Verify: browse to `http://<vm-private-ip>:8098` and confirm your real data is present.

## 6. Backups (Azure disk snapshots — primary mechanism)
- In the Azure portal, create a **Snapshot** of the VM's managed disk, or attach the
  disk to **Azure Backup** with a daily policy. This captures the whole disk including
  the `skills_db_data` volume — no application changes needed.
- Recovery: restore the disk from a snapshot and reattach, or create a new VM from it.
- Optional logical backup (off by default): `docker exec skills-matrix-db pg_dump
  --clean --if-exists -U skillsuser skills_matrix > backups/$(date +%F).sql` via cron.

## 7. Updating the app later
```bash
cd ~/skills-db
git pull
docker compose build
docker compose up -d   # volume retained — data is safe across rebuilds
```
````

- [ ] **Step 2: Mark the old migration doc superseded**

At the very top of `MIGRATION-TO-LINUX-VM.md`, add this banner as the first lines:

```markdown
> **⚠️ SUPERSEDED (2026-05-29):** This native-install plan is no longer the chosen
> approach — it decomposes the app into separate OS services and abandons the
> single self-contained container model. Use `docs/DEPLOY-AZURE-VM.md` (container on
> the VM + named volume + Azure snapshots) instead. Kept for historical reference.

```

- [ ] **Step 3: Commit**

```bash
git add docs/DEPLOY-AZURE-VM.md MIGRATION-TO-LINUX-VM.md
git commit -m "docs(deploy): Azure VM container runbook; supersede native-install plan"
```

---

## Self-Review (completed during planning)

**Spec coverage:**
- Migration target architecture (container + volume + snapshots) → Tasks 5, 7 ✅
- Build on VM from git → Task 7 step 2–4 ✅
- One-time pg_dump/restore data move → Tasks 6, 7 step 5 ✅
- Azure disk snapshots primary, logical pg_dump optional/off → Task 7 step 6 ✅
- No TLS / no API auth / no CORS-helmet (private net) → not implemented, by design ✅
- Supersede `MIGRATION-TO-LINUX-VM.md` → Task 7 step 2 ✅
- `ai_enabled` flag in `metadata`, default true → Task 1 ✅
- GET/PUT flags endpoints with allow-list validation → Task 1 ✅
- Server-side enforcement in `/chat` AND `/match/ai` before Anthropic call → Task 2 ✅
- Settings toggle governing both features → Tasks 3, 4 ✅
- Hide chatbot launcher + AI-match button when off → Task 4 ✅
- `.env` gitignored / provided on VM → Task 7 step 3 ✅

**Type/name consistency:** `getFlag` (defined Task 1, used Task 2), `ai_enabled` flag key,
`applyEnabled`/`checkEnabled` on `Chat`, `loadAiFlag`/`saveAiFlag`/`applyAiMatchVisibility`,
`aiEnabledToggle` element id — all consistent across tasks. ✅

**Placeholder scan:** no TBD/TODO; every code step shows complete code. ✅
