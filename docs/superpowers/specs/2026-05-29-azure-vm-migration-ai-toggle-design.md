# Design: Migrate Skills Matrix to Azure VM + Master AI Switch

**Date:** 2026-05-29
**Status:** Approved (pending spec review)
**Scope:** Spec 1 of a multi-spec effort. Follow-on specs (features, code health, UX) are out of scope here.

---

## Goal

Move the Skills Matrix from its current home (a laptop running Docker Desktop for
Windows, exposed via a Cloudflare Tunnel) to its final home: a dedicated Azure
Linux VM on a **private network with no publicly reachable hostname**.

The app's defining identity — **a single, self-contained, full-stack Docker image**
(PostgreSQL + Node.js/Express + Nginx in one container) — must be preserved. Nothing
in this migration may decompose it into separate services or add an external runtime
dependency the app cannot run without.

Two deliverables:
1. **Migration** — run the same single image on the VM with durable persistence.
2. **Master AI switch** — a Settings toggle that turns *all* AI features on/off.

---

## Constraints & Context

- **Self-contained, no external dependencies.** "Self-contained" describes the *image*
  (one portable artifact, all services inside). Live data lives in a Docker volume on
  the VM — the image stays a single rebuildable/redeployable artifact.
- **Private network, not sensitive.** No public hostname. Access is via the private
  network only. Therefore: no TLS, no API authentication changes, no CORS/helmet
  hardening, no rate limiting. These were considered and deliberately dropped.
- **Deployment workflow today:** laptop uses a hot-swap workflow because the container
  has no Postgres volume (rebuild = data loss). The migration *removes* that constraint.
- **Existing migration doc superseded:** `MIGRATION-TO-LINUX-VM.md` describes a *native*
  install (Postgres/Node/Nginx directly on the VM via PM2). That contradicts the
  single-container identity and is replaced by this container-on-VM design.

---

## Part A — Migration

### Target architecture

```
Azure Linux VM (Ubuntu, private network, no public hostname)
  └─ Docker Engine
      └─ skills-matrix-db:latest        ← the ONE image (PG + Node + Nginx), unchanged
          └─ volume: skills_db_data → /var/lib/postgresql/data   (on the VM managed disk)
  + Azure disk snapshot schedule (nightly) for backup / point-in-time restore
```

- **No Cloudflare Tunnel** on the VM (it exists to expose a public hostname; not needed
  on a private network). The `nginx.conf` notes/`absolute_redirect off` workaround tied
  to the tunnel can stay harmlessly, or be revisited — see Open Items.
- **No inbound 443 / no Certbot / no Let's Encrypt.** Nginx serves plain HTTP on port 80
  bound to the private interface.

### Steps

1. **VM prep.** Install Docker Engine and git on the Ubuntu VM.
2. **Build on VM from git.** Clone the repo on the VM, `docker build -t skills-matrix-db:latest .`,
   then `docker run` with the named volume and the port published to the private interface.
   No registry; no `docker save`/`load`.
3. **Persistence.** Add the named volume `skills_db_data` mapped to
   `/var/lib/postgresql/data`. This is the core upgrade over the laptop's no-volume model.
   Update `docker-compose.yml` (and/or the documented `docker run`) to declare it.
   **Consequence:** rebuilds/redeploys become safe and routine — the hot-swap workflow
   is no longer required.
4. **One-time data move.** `pg_dump` from the laptop container → restore into the VM's
   volume on first run. The repo already produces dumps in `backups/`. Add a small
   `restore.sh` helper and document the exact sequence (dump → copy to VM → load into the
   running container's Postgres).
5. **Backups.** Document enabling **Azure disk snapshots** (whole-disk, app-agnostic,
   includes the volume). An optional logical nightly `pg_dump` to a host-mounted path
   remains available but is **off by default** (keeps the no-external-dependency ethos).
6. **TLS.** None. Plain HTTP over the private network. (An internal self-signed cert is a
   possible later addition, not in this spec.)

### What does NOT change

- The Dockerfile's multi-service layout (supervisord running PG + Node + Nginx).
- Application code, schema, routes (except the AI-switch change in Part B).
- The `.env` handling for DB credentials (lives on the VM, not baked into the image,
  not committed). The Anthropic API key lives in the `metadata` table and travels with
  the data dump.

---

## Part B — Master AI Switch

A single Settings toggle that enables/disables **all** AI features:
- the floating chatbot widget (`/api/insights/chat`)
- AI project-matching (`/api/insights/match/ai`)

### Storage

- A boolean flag `ai_enabled` stored as a row in the existing `metadata` key/value table.
- **Default: `true`** (preserves current behaviour on upgrade).
- No new table; mirrors how `anthropic_api_key` is already stored.

### Backend (`backend/routes/settings.js` + `backend/routes/insights.js`)

- Add a read helper `getFlag(name, default)` alongside the existing `getApiKey` helper.
- Expose the flag via the settings API:
  - `GET /api/settings/flags` → returns `{ ai_enabled: <bool> }` (room for future flags).
  - `PUT /api/settings/flags/:name` body `{ value: <bool> }` → upserts into `metadata`.
    Validate `name` against an allow-list (`['ai_enabled']`).
- **Enforcement (the real control lever):** both `POST /api/insights/chat` and
  `POST /api/insights/match/ai` check `ai_enabled` first. When off, return a clear
  disabled response (e.g. `403` with `{ success:false, error:'AI features are disabled' }`)
  **before** any call to the Anthropic API. This guarantees zero spend when off, even if a
  stale page still shows the widget.

### Frontend (`frontend/script.js`, Settings view + `Chat` object)

- **Settings view:** add an "AI Features" toggle near the existing AI / API-key controls.
  Reads `GET /api/settings/flags`; writes via `PUT`. Label it clearly as governing both
  the chatbot and AI matching.
- **Chat widget:** `Chat.init` reads the flag on load and hides `#chatLauncher` when off.
- **AI matching UI:** the "AI match" action in Project Matching is hidden/disabled when
  the flag is off (falls back to the non-AI match, which already exists via `/match`).
- Reuse existing fetch/error patterns; no new dependencies.

### UX detail

- When AI is off, the chatbot launcher simply does not appear (no error state needed).
- The AI-match button, when off, is hidden or shows a tooltip "AI features are turned off
  in Settings."

---

## Explicitly Out of Scope (YAGNI)

Justified by the private-network, non-sensitive access model:
- API authentication changes (the open `/api/` stays open).
- CORS lockdown, `helmet`, security headers beyond what nginx already sets.
- Rate limiting on AI endpoints (the master switch is the cost lever instead).
- Auth consolidation (Basic Auth via `.htpasswd` is fine as-is).
- Email / SMTP notifications (external dependency).
- Frontend module split, build step, PDF export, trend charts, Cmd-K — deferred to
  later specs.

---

## Testing

- **Migration:** verify the container comes up on the VM; data from the laptop dump is
  present; stop/rebuild/restart the container and confirm data survives (volume works);
  confirm a disk snapshot can be taken.
- **AI switch — backend:** with `ai_enabled=false`, `POST /chat` and `POST /match/ai`
  return the disabled response and make **no** outbound Anthropic call; with `true`, both
  behave as before. `GET/PUT /flags` round-trips correctly and rejects unknown names.
- **AI switch — frontend:** toggling off hides the chat launcher and the AI-match action;
  toggling on restores them without a full reload (or after the documented refresh).

---

## Open Items / Risks

- **Cloudflare-tunnel nginx workaround:** `absolute_redirect off` and the welcome/signin
  redirect dance were added for the tunnel. On a private HTTP-only deployment they are
  likely harmless; confirm sign-in/sign-out still behaves on the VM and tidy only if it
  misbehaves.
- **`.env` on the VM:** ensure DB credentials are provided on the VM and not committed;
  confirm `.env` is gitignored before building from git.
- **First-run ordering:** the data restore must happen after Postgres initialises the
  fresh volume; document the sequence so an empty-then-restore race can't occur.
