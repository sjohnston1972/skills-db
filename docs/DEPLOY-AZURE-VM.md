# Deploy Skills Matrix to an Azure Linux VM (container model)

The Skills Matrix runs as a **single self-contained Docker image** (PostgreSQL +
Node.js + Nginx). On Azure it runs on one Linux VM on a **private network with no
public hostname** — no Cloudflare Tunnel, no Let's Encrypt, plain HTTP on the
private network.

This supersedes `MIGRATION-TO-LINUX-VM.md` (which described a native, non-container
install and is no longer the chosen approach).

## 1. Provision the VM
- **OS image:** Debian 12 "Bookworm" (Gen2) from the official Debian publisher in the Azure Marketplace. (Lean, stable, no snap — a good minimal Docker host. Ubuntu 22.04 LTS also works unchanged if you prefer it.)
- **Size:** B-series burstable (internal tools sit near-idle, so you pay for low average use). Start with **B2s** (2 vCPU / 4 GB) for this app plus one or two others; choose **B2ms** (2 vCPU / 8 GB) if you're committing to a shared multi-app host — RAM, not CPU/disk, is the limiter since each tool runs its own Postgres + Node. You can resize later (stop → change size → start) with no data loss.
- **Disk:** 30 GB **Standard SSD** OS disk is ample (the whole app footprint is <0.5 GB). Bump to 64 GB only if you'll accumulate many images/logical backups. Avoid Standard HDD (poor for a DB host); Premium SSD is overkill here.
- Attach to the private vNet/subnet. No public IP / no inbound 80/443 from the internet.
- Allow inbound port 8098 (or 80) **only from the private network** via the NSG.

## 2. Install Docker Engine + git
The convenience script auto-detects Debian 12 (and Ubuntu) and adds Docker's official
apt repo, so these steps are identical on either distro:
```bash
sudo apt update && sudo apt install -y git ca-certificates curl
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker "$USER"   # use your provisioning username; log out/in for it to take effect
docker --version && docker compose version
```

## 3. Clone and configure
```bash
git clone <your-repo-url> skills-db
cd skills-db
# Create .env with production values (NOT committed — .env is gitignored):
#   DB_HOST=localhost
#   DB_PORT=5432
#   DB_NAME=skills_matrix
#   DB_USER=skillsuser
#   DB_PASSWORD=<the password baked into the image / your chosen value>
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
On first start the named volume `skills_db_data` is created and seeded from the
image's initialised cluster (role + empty database). The application schema is NOT
auto-created — it arrives with the data restore in step 5.

## 5. One-time data migration from the old host (laptop)
On the **old host** (laptop), produce a dump (the `--no-owner` flag avoids harmless
ownership errors on restore):
```bash
docker exec skills-matrix-db pg_dump --clean --if-exists --no-owner -U skillsuser skills_matrix > migrate.sql
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
- Optional logical backup (off by default): on a schedule, run
  `docker exec skills-matrix-db pg_dump --clean --if-exists --no-owner -U skillsuser skills_matrix > backups/$(date +%F).sql`
  via cron.

## 7. Updating the app later
```bash
cd ~/skills-db
git pull
docker compose build
docker compose up -d   # the named volume is retained — data is safe across rebuilds
```
