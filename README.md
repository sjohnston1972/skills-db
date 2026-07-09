# Skills Matrix - Database Edition

**⚠️ IMPORTANT:** This is the **full-stack PostgreSQL version** (`skills-db`), NOT the static localStorage version (`skills`).

PostgreSQL-backed skills matrix application with Node.js/Express API backend, served in a single self-contained Docker container.

**Key Differences from Static Version:**
- ✅ PostgreSQL database (persistent, multi-user capable)
- ✅ RESTful API backend (Node.js/Express)
- ✅ Real-time data sync across devices
- ✅ Production-ready architecture
- ❌ Not using localStorage (browser-only storage)

## Features

- **PostgreSQL Database**: Persistent storage for all skills data
- **RESTful API**: Full CRUD operations for resources and skills
- **Auto-sync**: Changes sync across all devices in real-time
- **Portable**: Self-contained Docker image can run anywhere
- **No External Dependencies**: All services (PostgreSQL, Node.js, Nginx) run in one container

## Architecture

```
┌─────────────────────────────────────────┐
│         Docker Container                │
│                                         │
│  ┌──────────┐  ┌──────────┐  ┌──────┐ │
│  │ PostgreSQL│  │  Node.js │  │ Nginx│ │
│  │  (5432)  │  │  (3000)  │  │ (80) │ │
│  └────┬─────┘  └────┬─────┘  └───┬──┘ │
│       │             │              │    │
│       └─────────────┴──────────────┘    │
│                                         │
└─────────────────────────────────────────┘
              Port 80 (External)
```

## Quick Start

### 0. One-Time Setup (fresh clone)

The image build needs a `.htpasswd` file (basic-auth users for nginx). It is
gitignored, so create it first:

```bash
# With apache2-utils installed:
htpasswd -Bc .htpasswd admin

# Or without installing anything:
docker run --rm httpd:2.4-alpine htpasswd -nbB admin 'yourpassword' > .htpasswd
```

For local development outside Docker (`npm start`), copy the env template:

```bash
cp .env.example .env
```

The Docker image does **not** include `.env` — runtime defaults come from the
Dockerfile's `ENV` block, so no `.env` is needed to build or run the container.

### 1. Build the Image

```bash
cd /host-projects/web-projects/skills-db
docker build -t skills-matrix-db:latest .
```

### 2. Run the Container

```bash
docker run -d \
  --name skills-matrix-db \
  --network net_core \
  -p 8098:80 \
  --restart unless-stopped \
  skills-matrix-db:latest
```

**Note:** Data persists in the PostgreSQL database inside the container. For external persistence, add volume mount:
`-v skills_db_data:/var/lib/postgresql/data`

### 3. Access the Application

**Local Access:** `http://localhost:8098`
**Cloudflare Tunnel:** `https://skill.clydeford.net` → `http://skills-matrix-db:80`

**Authentication:** Basic auth is enabled. Credentials in `sitecreds.txt` or `.htpasswd`

### 4. Health Check

Check if the API is healthy:

```bash
curl http://localhost:8098/api/health
```

Expected response:
```json
{
  "success": true,
  "status": "healthy",
  "timestamp": "2026-01-22T...",
  "database": "connected"
}
```

## Data Migration

### Export Data from localStorage Version

On a browser with existing data (the old version):

1. Open browser console (F12)
2. Run:
   ```javascript
   copy(JSON.stringify(JSON.parse(localStorage.getItem('skillsMatrixData')), null, 2))
   ```
3. Paste into a file named `migration-data.json`

### Import Data to Database Version

Using curl:

```bash
curl -X POST http://localhost:8095/api/data \
  -H "Content-Type: application/json" \
  -d @migration-data.json
```

Or use the browser console on the new version:

```javascript
fetch('/api/data', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: localStorage.getItem('skillsMatrixData')
}).then(r => r.json()).then(console.log)
```

## Container Management

### View Logs

```bash
# All logs
docker logs skills-matrix-db

# Follow logs
docker logs -f skills-matrix-db

# Specific service logs (inside container)
docker exec skills-matrix-db tail -f /var/log/supervisor/backend.log
docker exec skills-matrix-db tail -f /var/log/supervisor/postgres.log
docker exec skills-matrix-db tail -f /var/log/supervisor/nginx.log
```

### Stop/Start Container

```bash
# Stop
docker stop skills-matrix-db

# Start
docker start skills-matrix-db

# Restart
docker restart skills-matrix-db
```

### Remove Container (Keep Data)

```bash
docker stop skills-matrix-db
docker rm skills-matrix-db
# Data is preserved in the 'skills_db_data' volume
```

### Backup Database

```bash
docker exec skills-matrix-db \
  su postgres -c "pg_dump -U skillsuser skills_matrix" \
  > backup-$(date +%Y%m%d).sql
```

### Restore Database

```bash
cat backup-20260122.sql | \
docker exec -i skills-matrix-db \
  su postgres -c "psql -U skillsuser skills_matrix"
```

## API Endpoints

### Data Endpoints
- `GET /api/data` - Get all data (resources with skills)
- `POST /api/data` - Save/import complete data
- `POST /api/data/export` - Export as JSON
- `POST /api/data/reset` - Reset to sample data

### Resource Endpoints
- `GET /api/resources` - List all resources
- `GET /api/resources/:id` - Get single resource
- `POST /api/resources` - Create resource
- `PUT /api/resources/:id` - Update resource
- `DELETE /api/resources/:id` - Delete resource

### Skills Endpoints
- `GET /api/skills` - List all skills
- `GET /api/skills/:id` - Get single skill
- `POST /api/skills` - Create main skill
- `PUT /api/skills/:id` - Update main skill
- `DELETE /api/skills/:id` - Delete main skill
- `POST /api/skills/:id/sub-skills` - Add sub-skill
- `PUT /api/skills/:id/sub-skills/:subId` - Update sub-skill
- `DELETE /api/skills/:id/sub-skills/:subId` - Delete sub-skill

## Database Schema

### Tables
- `resources` - Engineer/team member records
- `main_skills` - Main skill categories
- `sub_skills` - Detailed sub-skills
- `resource_sub_skills` - Junction table with proficiency levels (0-5)
- `metadata` - App-level settings

### Key Features
- Foreign key relationships with CASCADE delete
- Automatic timestamp updates
- Level constraints (0-5)
- Indexed for performance

## Deployment to Production

### Option 1: Using Docker Compose

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  skills-matrix-db:
    image: skills-matrix-db:latest
    container_name: skills-matrix-db
    ports:
      - "8095:80"
    volumes:
      - skills_db_data:/var/lib/postgresql/data
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "--spider", "-q", "http://localhost/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  skills_db_data:
    driver: local
```

Then:

```bash
docker-compose up -d
```

### Option 2: Export/Import Image

On development machine:

```bash
docker save skills-matrix-db:latest | gzip > skills-matrix-db.tar.gz
```

Transfer to production server, then:

```bash
gunzip -c skills-matrix-db.tar.gz | docker load
docker run -d \
  --name skills-matrix-db \
  -p 8095:80 \
  -v skills_db_data:/var/lib/postgresql/data \
  --restart unless-stopped \
  skills-matrix-db:latest
```

## Migration to Linux VM

When moving to a Linux VM:

1. **Export the database**:
   ```bash
   docker exec skills-matrix-db \
     su postgres -c "pg_dump -U skillsuser skills_matrix" \
     > skills-matrix-backup.sql
   ```

2. **Transfer files**:
   - Option A: Transfer the Docker image (tar.gz)
   - Option B: Transfer this entire source directory and rebuild

3. **On Linux VM**:
   ```bash
   # Option A: Load image
   docker load < skills-matrix-db.tar.gz

   # Option B: Rebuild from source
   cd skills-db
   docker build -t skills-matrix-db:latest .
   ```

4. **Run container and restore data**:
   ```bash
   docker run -d --name skills-matrix-db -p 8095:80 \
     -v skills_db_data:/var/lib/postgresql/data \
     skills-matrix-db:latest

   cat skills-matrix-backup.sql | \
     docker exec -i skills-matrix-db \
       su postgres -c "psql -U skillsuser skills_matrix"
   ```

## Troubleshooting

### Container won't start

Check logs:
```bash
docker logs skills-matrix-db
```

Check supervisord status:
```bash
docker exec skills-matrix-db supervisorctl status
```

### Database connection errors

Restart PostgreSQL:
```bash
docker exec skills-matrix-db supervisorctl restart postgres
```

### API not responding

Restart backend:
```bash
docker exec skills-matrix-db supervisorctl restart backend
```

### Clear all data and start fresh

```bash
docker stop skills-matrix-db
docker rm skills-matrix-db
docker volume rm skills_db_data
# Then start container again
```

## Security Notes

**Important**: The default database password is `changeme123`. For production:

1. Change password in `.env` before building
2. Rebuild the image with new credentials
3. Consider adding authentication to the API

## Development

### Running Tests

The jest suite (unit + API integration tests) needs a disposable PostgreSQL
on port 55433 — it drops and recreates the schema every run, so never point
it at real data:

```bash
docker run -d --name skillsdb-test-pg \
  -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=skills_matrix_test \
  -p 55433:5432 postgres:16-alpine

npm install
npm test
```

Defaults (override via env): `DB_HOST=localhost DB_PORT=55433
DB_NAME=skills_matrix_test DB_USER=postgres DB_PASSWORD=postgres
HTPASSWD_FILE=backend/__tests__/fixtures/htpasswd`.

### Run Backend Locally (without Docker)

```bash
# Install PostgreSQL locally
# Create database and user

cd /host-projects/web-projects/skills-db

# Install dependencies
npm install

# Update .env with local settings
# DB_HOST=localhost

# Start backend
npm start

# In another terminal, serve frontend
cd frontend
python3 -m http.server 8080
```

### Rebuild After Code Changes

```bash
docker stop skills-matrix-db
docker rm skills-matrix-db
docker build -t skills-matrix-db:latest .
docker run -d --name skills-matrix-db -p 8095:80 \
  -v skills_db_data:/var/lib/postgresql/data \
  skills-matrix-db:latest
```

## File Structure

```
skills-db/
├── Dockerfile              # Container definition
├── docker-compose.yml      # Optional: compose configuration
├── package.json            # Node.js dependencies
├── .env                    # Environment variables
├── .dockerignore          # Files to exclude from build
├── nginx.conf             # Nginx web server config
├── supervisord.conf       # Process manager config
├── backend/
│   ├── server.js          # Express app entry
│   ├── db.js              # PostgreSQL connection
│   ├── init-db.sql        # Database schema
│   └── routes/
│       ├── data.js        # Data endpoints
│       ├── resources.js   # Resource CRUD
│       └── skills.js      # Skills CRUD
└── frontend/
    ├── index.html         # Main page
    ├── script.js          # Frontend logic
    ├── styles.css         # Styles
    └── api.js             # API client
```

## License

Internal use only.

## Support

For issues, check:
1. Container logs: `docker logs skills-matrix-db`
2. Health endpoint: `curl http://localhost:8095/api/health`
3. Supervisor status: `docker exec skills-matrix-db supervisorctl status`
