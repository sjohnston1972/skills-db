# Skills Matrix DB - Quick Start Guide

## TL;DR

Your skills matrix has been migrated to PostgreSQL! Everything is ready to deploy.

**To run it:**

```bash
cd /host-projects/web-projects/skills-db
docker run -d \
  --name skills-matrix-db \
  -p 8095:80 \
  -v skills_db_data:/var/lib/postgresql/data \
  --restart unless-stopped \
  skills-matrix-db:latest
```

**To access:** `http://your-server-ip:8095`

## What Changed?

### Before (localStorage)
- ❌ Data lost when browser cache cleared
- ❌ No sync between devices
- ❌ Limited to single browser/device
- ❌ No backup/restore capability

### After (PostgreSQL)
- ✅ Data persists in database
- ✅ Auto-sync across all devices
- ✅ Multi-user capable
- ✅ Easy backup/restore
- ✅ RESTful API for integrations

## Migration from Old Version

### Step 1: Export Your Data

On a device with your 15 engineers:

1. Open the OLD skills matrix website
2. Press F12 (open browser console)
3. Run this command:
   ```javascript
   copy(JSON.stringify(JSON.parse(localStorage.getItem('skillsMatrixData'))))
   ```
4. Paste into a file named `my-skills-data.json`

### Step 2: Deploy New Version

```bash
cd /host-projects/web-projects/skills-db
docker run -d \
  --name skills-matrix-db \
  -p 8095:80 \
  -v skills_db_data:/var/lib/postgresql/data \
  --restart unless-stopped \
  skills-matrix-db:latest
```

Wait 15 seconds for startup, then verify:

```bash
docker logs skills-matrix-db
```

Look for:
```
✅ Server is running on port 3000
```

### Step 3: Import Your Data

```bash
curl -X POST http://your-server:8095/api/data \
  -H "Content-Type: application/json" \
  -d @my-skills-data.json
```

Or through browser console on the NEW site:

```javascript
// Paste your exported data here
const myData = { /* your data */ };

fetch('/api/data', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(myData)
}).then(r => r.json()).then(console.log);
```

### Step 4: Verify

Refresh the page - you should see all 15 engineers!

## Deployment Options

### Option 1: Run on Current Server (Recommended)

```bash
docker run -d \
  --name skills-matrix-db \
  -p 8095:80 \
  -v skills_db_data:/var/lib/postgresql/data \
  --restart unless-stopped \
  skills-matrix-db:latest
```

Access: `http://skills.clydeford.net:8095`

### Option 2: Move to Linux VM

1. **Export the image:**
   ```bash
   docker save skills-matrix-db:latest | gzip > skills-matrix-db.tar.gz
   ```

2. **Transfer to Linux VM:**
   ```bash
   scp skills-matrix-db.tar.gz user@linuxvm:/tmp/
   ```

3. **On Linux VM:**
   ```bash
   gunzip -c skills-matrix-db.tar.gz | docker load
   docker run -d \
     --name skills-matrix-db \
     -p 8095:80 \
     -v skills_db_data:/var/lib/postgresql/data \
     --restart unless-stopped \
     skills-matrix-db:latest
   ```

### Option 3: Using Docker Compose

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

volumes:
  skills_db_data:
```

Then:
```bash
docker-compose up -d
```

## Common Commands

### View Logs
```bash
docker logs -f skills-matrix-db
```

### Restart Container
```bash
docker restart skills-matrix-db
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

### Test API
```bash
# Health check
curl http://localhost:8095/api/health

# Get all data
curl http://localhost:8095/api/data

# List resources
curl http://localhost:8095/api/resources
```

## Troubleshooting

### Container won't start

```bash
docker logs skills-matrix-db
```

Look for errors in the output.

### Database issues

```bash
# Check PostgreSQL status
docker exec skills-matrix-db supervisorctl status postgres

# Restart PostgreSQL
docker exec skills-matrix-db supervisorctl restart postgres
```

### Backend not responding

```bash
# Check backend status
docker exec skills-matrix-db supervisorctl status backend

# View backend logs
docker exec skills-matrix-db tail -50 /var/log/supervisor/backend.log

# Restart backend
docker exec skills-matrix-db supervisorctl restart backend
```

### Nginx issues

```bash
# Check nginx status
docker exec skills-matrix-db supervisorctl status nginx

# View nginx logs
docker exec skills-matrix-db tail -50 /var/log/nginx/error.log

# Restart nginx
docker exec skills-matrix-db supervisorctl restart nginx
```

### Start completely fresh

```bash
docker stop skills-matrix-db
docker rm skills-matrix-db
docker volume rm skills_db_data
# Then start again
```

## API Documentation

See `README.md` for complete API documentation.

Quick reference:
- `GET /api/data` - Get all resources with skills
- `POST /api/data` - Import/save data
- `GET /api/resources` - List all engineers
- `POST /api/resources` - Add new engineer
- `PUT /api/resources/:id` - Update engineer
- `DELETE /api/resources/:id` - Remove engineer
- `GET /api/skills` - List all skills
- `POST /api/skills` - Add new skill category

## Security Notes

**Important:** The default database password is `changeme123`.

For production use:
1. Edit `.env` file before building
2. Change `DB_PASSWORD=changeme123` to a strong password
3. Rebuild: `docker build -t skills-matrix-db:latest .`

## Success Criteria

After deployment, verify:
- ✅ Health endpoint returns "healthy": `curl http://localhost:8095/api/health`
- ✅ Dashboard loads and shows metrics
- ✅ Can add/edit/delete resources
- ✅ Changes persist after browser refresh
- ✅ Changes visible on different devices

## Support

For issues, check:
1. Container logs: `docker logs skills-matrix-db`
2. Service status: `docker exec skills-matrix-db supervisorctl status`
3. Health check: `curl http://localhost:8095/api/health`

## What's Next?

After successful deployment:

1. **Update DNS** (optional)
   - Point `skills.clydeford.net` to port 8095
   - Or keep existing site on 8094 during transition

2. **Set up backups**
   - Create a cron job for daily database backups
   - Store backups off-server

3. **Monitor**
   - Check health endpoint periodically
   - Set up alerts for downtime

4. **Retire old version**
   - Once you're confident, stop the old localStorage version
   - Keep a final export as backup

Enjoy your new database-backed skills matrix! 🚀
