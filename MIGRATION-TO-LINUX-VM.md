> **⚠️ SUPERSEDED (2026-05-29):** This native-install plan is no longer the chosen
> approach — it decomposes the app into separate OS services and abandons the
> single self-contained container model. Use `docs/DEPLOY-AZURE-VM.md` (container on
> the VM + named volume + Azure snapshots) instead. Kept for historical reference.

# Skills Matrix Migration Plan: Docker Container → Linux VM (Native Installation)

## Overview

Migrate the Skills Matrix from a Docker container to a native Linux VM installation with PostgreSQL, Node.js, and Nginx running directly on the system.

---

## Prerequisites

### Linux VM Requirements
- **OS:** Ubuntu 22.04 LTS or later (or equivalent Debian-based distro)
- **RAM:** Minimum 2GB, recommended 4GB
- **Disk:** Minimum 10GB free space
- **CPU:** 2+ cores recommended
- **Network:** Static IP or domain name configured

### Access Requirements
- SSH access to Linux VM
- Sudo/root privileges
- Firewall rules allowing ports 80, 443 (and optionally 8098)

---

## Migration Plan

### Phase 1: Prepare Linux VM (30 minutes)

#### 1.1 Update System
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget git build-essential
```

#### 1.2 Install PostgreSQL
```bash
# Install PostgreSQL 15+
sudo apt install -y postgresql postgresql-contrib

# Start and enable service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Verify installation
psql --version
```

#### 1.3 Install Node.js
```bash
# Install Node.js 18.x LTS
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version  # Should show v18.x
npm --version
```

#### 1.4 Install Nginx
```bash
# Install Nginx
sudo apt install -y nginx

# Start and enable service
sudo systemctl start nginx
sudo systemctl enable nginx

# Verify installation
nginx -v
```

#### 1.5 Install Process Manager (PM2)
```bash
# Install PM2 globally for Node.js process management
sudo npm install -g pm2

# Verify installation
pm2 --version
```

---

### Phase 2: Setup Application User (10 minutes)

#### 2.1 Create Application User
```bash
# Create dedicated user for the application
sudo adduser --system --group --home /opt/skills-matrix skillsapp

# Create application directory
sudo mkdir -p /opt/skills-matrix
sudo chown skillsapp:skillsapp /opt/skills-matrix
```

---

### Phase 3: Setup Database (15 minutes)

#### 3.1 Create Database and User
```bash
# Switch to postgres user
sudo -u postgres psql

# In PostgreSQL prompt:
CREATE USER skillsuser WITH PASSWORD 'YourSecurePasswordHere123!';
CREATE DATABASE skills_matrix OWNER skillsuser;
GRANT ALL PRIVILEGES ON DATABASE skills_matrix TO skillsuser;

# Exit PostgreSQL
\q
```

#### 3.2 Configure PostgreSQL
```bash
# Edit PostgreSQL config for remote connections (if needed)
sudo nano /etc/postgresql/15/main/postgresql.conf

# Find and modify:
listen_addresses = 'localhost'  # Keep as localhost for security

# Edit authentication config
sudo nano /etc/postgresql/15/main/pg_hba.conf

# Add this line before other rules:
local   skills_matrix   skillsuser                  md5

# Restart PostgreSQL
sudo systemctl restart postgresql
```

#### 3.3 Test Database Connection
```bash
# Test connection
psql -U skillsuser -d skills_matrix -h localhost

# If successful, you'll see: skills_matrix=>
# Exit with: \q
```

---

### Phase 4: Export Data from Docker Container (10 minutes)

#### 4.1 Export Database from Container
```bash
# On current Docker host, export database
docker exec skills-matrix-db \
  su postgres -c "pg_dump -U skillsuser skills_matrix" \
  > /tmp/skills-matrix-export.sql

# Verify export
ls -lh /tmp/skills-matrix-export.sql
```

#### 4.2 Export Application Files
```bash
# Create tarball of application code
cd /host-projects/web-projects/
tar -czf skills-db-app.tar.gz skills-db/

# Files to transfer:
# - /tmp/skills-matrix-export.sql (database)
# - skills-db-app.tar.gz (application code)
```

---

### Phase 5: Transfer Files to Linux VM (10 minutes)

#### 5.1 Transfer Files via SCP
```bash
# From Docker host, transfer to Linux VM
scp /tmp/skills-matrix-export.sql username@linuxvm-ip:/tmp/
scp skills-db-app.tar.gz username@linuxvm-ip:/tmp/

# Or use SFTP, rsync, or any file transfer method you prefer
```

#### 5.2 Extract Application on Linux VM
```bash
# On Linux VM
cd /tmp
sudo tar -xzf skills-db-app.tar.gz -C /opt/skills-matrix --strip-components=1

# Set ownership
sudo chown -R skillsapp:skillsapp /opt/skills-matrix
```

---

### Phase 6: Setup Application on Linux VM (20 minutes)

#### 6.1 Install Node.js Dependencies
```bash
# Switch to application directory
cd /opt/skills-matrix

# Install dependencies as skillsapp user
sudo -u skillsapp npm install --production

# Should install: express, pg, dotenv, cors
```

#### 6.2 Configure Environment Variables
```bash
# Create production .env file
sudo -u skillsapp nano /opt/skills-matrix/.env

# Add the following:
NODE_ENV=production
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=skills_matrix
DB_USER=skillsuser
DB_PASSWORD=YourSecurePasswordHere123!

# Save and exit (Ctrl+X, Y, Enter)

# Secure the file
sudo chmod 600 /opt/skills-matrix/.env
```

#### 6.3 Initialize Database Schema
```bash
# Import database schema and data
psql -U skillsuser -d skills_matrix -h localhost -f /tmp/skills-matrix-export.sql

# Verify data imported
psql -U skillsuser -d skills_matrix -h localhost -c "SELECT COUNT(*) FROM resources;"
# Should show: 15 rows

psql -U skillsuser -d skills_matrix -h localhost -c "SELECT COUNT(*) FROM main_skills;"
# Should show: 13 rows
```

#### 6.4 Test Backend Manually
```bash
# Start backend manually for testing
cd /opt/skills-matrix
sudo -u skillsapp node backend/server.js

# In another terminal, test:
curl http://localhost:3000/api/health

# Should return: {"success":true,"status":"healthy",...}

# Stop with Ctrl+C if successful
```

---

### Phase 7: Setup PM2 Process Manager (15 minutes)

#### 7.1 Create PM2 Configuration
```bash
# Create PM2 ecosystem file
sudo -u skillsapp nano /opt/skills-matrix/ecosystem.config.js

# Add the following:
module.exports = {
  apps: [{
    name: 'skills-matrix-api',
    script: '/opt/skills-matrix/backend/server.js',
    cwd: '/opt/skills-matrix',
    instances: 2,
    exec_mode: 'cluster',
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/var/log/skills-matrix/error.log',
    out_file: '/var/log/skills-matrix/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
  }]
};

# Save and exit
```

#### 7.2 Create Log Directory
```bash
# Create log directory
sudo mkdir -p /var/log/skills-matrix
sudo chown skillsapp:skillsapp /var/log/skills-matrix
```

#### 7.3 Start Application with PM2
```bash
# Start application as skillsapp user
sudo -u skillsapp pm2 start /opt/skills-matrix/ecosystem.config.js

# Verify it's running
sudo -u skillsapp pm2 status

# Check logs
sudo -u skillsapp pm2 logs skills-matrix-api --lines 50

# Save PM2 process list
sudo -u skillsapp pm2 save
```

#### 7.4 Setup PM2 Startup Script
```bash
# Generate startup script
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u skillsapp --hp /opt/skills-matrix

# This will create a systemd service to start PM2 on boot

# Verify systemd service
sudo systemctl status pm2-skillsapp
```

---

### Phase 8: Configure Nginx (20 minutes)

#### 8.1 Copy Frontend Files
```bash
# Create web root directory
sudo mkdir -p /var/www/skills-matrix

# Copy frontend files
sudo cp -r /opt/skills-matrix/frontend/* /var/www/skills-matrix/

# Set ownership
sudo chown -R www-data:www-data /var/www/skills-matrix
```

#### 8.2 Create Nginx Configuration
```bash
# Create new site configuration
sudo nano /etc/nginx/sites-available/skills-matrix

# Add the following configuration:
```

```nginx
server {
    listen 80;
    server_name your-domain.com;  # Change to your domain or IP

    # Frontend root
    root /var/www/skills-matrix;
    index index.html;

    # Logging
    access_log /var/log/nginx/skills-matrix-access.log;
    error_log /var/log/nginx/skills-matrix-error.log;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Serve static files
    location / {
        try_files $uri $uri/ /index.html;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }

    # Proxy API requests to Node.js backend
    location /api/ {
        proxy_pass http://localhost:3000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 60s;
        proxy_connect_timeout 60s;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 7d;
        add_header Cache-Control "public, immutable";
    }
}
```

#### 8.3 Enable Site and Restart Nginx
```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/skills-matrix /etc/nginx/sites-enabled/

# Remove default site (optional)
sudo rm /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# If test passes, reload Nginx
sudo systemctl reload nginx
```

---

### Phase 9: Setup Firewall (10 minutes)

#### 9.1 Configure UFW (Ubuntu Firewall)
```bash
# Install UFW if not installed
sudo apt install -y ufw

# Allow SSH (IMPORTANT - do this first!)
sudo ufw allow OpenSSH

# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable

# Verify rules
sudo ufw status
```

---

### Phase 10: Testing & Verification (15 minutes)

#### 10.1 Test All Services
```bash
# Test PostgreSQL
psql -U skillsuser -d skills_matrix -h localhost -c "SELECT COUNT(*) FROM resources;"

# Test Node.js backend
curl http://localhost:3000/api/health
curl http://localhost:3000/api/resources | head -50

# Test Nginx
curl http://localhost/api/health
curl http://localhost/
```

#### 10.2 Test from Browser
1. Open browser to: `http://your-vm-ip/`
2. Verify all 15 engineers appear
3. Test CRUD operations:
   - Add a new engineer
   - Edit existing engineer
   - Delete a test engineer
4. Test all views:
   - Dashboard
   - Heatmap
   - Search
   - Management

#### 10.3 Verify Data Persistence
```bash
# Restart backend
sudo -u skillsapp pm2 restart skills-matrix-api

# Wait 5 seconds, then refresh browser
# Data should still be there
```

---

### Phase 11: Setup Automated Backups (15 minutes)

#### 11.1 Create Backup Script
```bash
# Create backup script
sudo nano /opt/skills-matrix/backup-db.sh

# Add the following:
```

```bash
#!/bin/bash
# Skills Matrix Database Backup Script

BACKUP_DIR="/var/backups/skills-matrix"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/skills-matrix-$DATE.sql"

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

# Perform backup
pg_dump -U skillsuser -d skills_matrix -h localhost > $BACKUP_FILE

# Compress backup
gzip $BACKUP_FILE

# Delete backups older than 30 days
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete

echo "Backup completed: ${BACKUP_FILE}.gz"
```

```bash
# Make script executable
sudo chmod +x /opt/skills-matrix/backup-db.sh

# Create .pgpass file for passwordless backups
sudo -u skillsapp nano /opt/skills-matrix/.pgpass

# Add line:
localhost:5432:skills_matrix:skillsuser:YourSecurePasswordHere123!

# Secure the file
sudo chmod 600 /opt/skills-matrix/.pgpass
sudo chown skillsapp:skillsapp /opt/skills-matrix/.pgpass
```

#### 11.2 Setup Cron Job
```bash
# Edit crontab for skillsapp user
sudo -u skillsapp crontab -e

# Add daily backup at 2 AM:
0 2 * * * /opt/skills-matrix/backup-db.sh >> /var/log/skills-matrix/backup.log 2>&1

# Save and exit
```

#### 11.3 Test Backup
```bash
# Run backup manually
sudo -u skillsapp /opt/skills-matrix/backup-db.sh

# Verify backup created
ls -lh /var/backups/skills-matrix/
```

---

### Phase 12: Setup HTTPS with Let's Encrypt (Optional, 20 minutes)

#### 12.1 Install Certbot
```bash
# Install Certbot for Nginx
sudo apt install -y certbot python3-certbot-nginx
```

#### 12.2 Obtain SSL Certificate
```bash
# Get certificate (replace with your domain)
sudo certbot --nginx -d your-domain.com

# Follow prompts:
# - Enter email address
# - Agree to terms
# - Choose redirect HTTP to HTTPS (recommended)

# Certbot will automatically configure Nginx
```

#### 12.3 Test Auto-Renewal
```bash
# Test renewal process (dry run)
sudo certbot renew --dry-run

# Certificate will auto-renew via systemd timer
sudo systemctl status certbot.timer
```

---

### Phase 13: Setup Monitoring (Optional, 15 minutes)

#### 13.1 Create Health Check Script
```bash
# Create monitoring script
sudo nano /opt/skills-matrix/health-check.sh

# Add:
```

```bash
#!/bin/bash
# Health check script

# Check backend
if ! curl -sf http://localhost:3000/api/health > /dev/null; then
    echo "$(date): Backend health check failed" >> /var/log/skills-matrix/health.log
    sudo -u skillsapp pm2 restart skills-matrix-api
fi

# Check database
if ! psql -U skillsuser -d skills_matrix -h localhost -c "SELECT 1" > /dev/null 2>&1; then
    echo "$(date): Database health check failed" >> /var/log/skills-matrix/health.log
fi
```

```bash
# Make executable
sudo chmod +x /opt/skills-matrix/health-check.sh

# Add to crontab (every 5 minutes)
sudo -u skillsapp crontab -e

# Add line:
*/5 * * * * /opt/skills-matrix/health-check.sh
```

---

## Summary of Services & Ports

| Service | Port | User | Status Check |
|---------|------|------|--------------|
| PostgreSQL | 5432 (localhost) | postgres/skillsuser | `systemctl status postgresql` |
| Node.js Backend | 3000 (localhost) | skillsapp (via PM2) | `pm2 status` |
| Nginx | 80, 443 | www-data | `systemctl status nginx` |

---

## Directory Structure on Linux VM

```
/opt/skills-matrix/           # Application root
├── backend/
│   ├── server.js
│   ├── db.js
│   ├── init-db.sql
│   └── routes/
├── frontend/                 # Copied to /var/www/skills-matrix
├── node_modules/
├── package.json
├── .env                      # Environment config (secure)
├── ecosystem.config.js       # PM2 config
└── backup-db.sh             # Backup script

/var/www/skills-matrix/       # Nginx web root
├── index.html
├── script.js
├── styles.css
└── api.js

/var/log/skills-matrix/       # Application logs
├── error.log
├── out.log
├── backup.log
└── health.log

/var/backups/skills-matrix/   # Database backups
└── skills-matrix-*.sql.gz
```

---

## Useful Management Commands

### Application Management
```bash
# View application status
sudo -u skillsapp pm2 status

# View logs
sudo -u skillsapp pm2 logs skills-matrix-api

# Restart application
sudo -u skillsapp pm2 restart skills-matrix-api

# Stop application
sudo -u skillsapp pm2 stop skills-matrix-api
```

### Database Management
```bash
# Connect to database
psql -U skillsuser -d skills_matrix -h localhost

# Manual backup
pg_dump -U skillsuser -d skills_matrix -h localhost > backup.sql

# Restore from backup
psql -U skillsuser -d skills_matrix -h localhost < backup.sql
```

### Service Management
```bash
# Restart all services
sudo systemctl restart postgresql
sudo systemctl restart nginx
sudo -u skillsapp pm2 restart all

# View service status
sudo systemctl status postgresql
sudo systemctl status nginx
sudo systemctl status pm2-skillsapp
```

---

## Rollback Plan

If migration fails, keep Docker container running on old system:

1. **Don't stop the Docker container** until VM is fully verified
2. **Test VM thoroughly** before decommissioning Docker
3. **Keep database backups** from both systems for 30 days
4. **Document any issues** encountered during migration

---

## Estimated Timeline

| Phase | Duration | Complexity |
|-------|----------|------------|
| Prepare Linux VM | 30 min | Easy |
| Setup app user | 10 min | Easy |
| Setup database | 15 min | Medium |
| Export from Docker | 10 min | Easy |
| Transfer files | 10 min | Easy |
| Setup application | 20 min | Medium |
| Setup PM2 | 15 min | Medium |
| Configure Nginx | 20 min | Medium |
| Setup firewall | 10 min | Easy |
| Testing | 15 min | Easy |
| Setup backups | 15 min | Medium |
| **Total (without HTTPS)** | **2h 50min** | - |
| Optional: HTTPS | +20 min | Easy |
| Optional: Monitoring | +15 min | Easy |

---

## Post-Migration Checklist

- [ ] All services running and enabled on boot
- [ ] Data verified (15 engineers, 13 skills)
- [ ] CRUD operations work from browser
- [ ] API endpoints accessible via Nginx
- [ ] Database backups configured and tested
- [ ] Firewall rules in place
- [ ] PM2 auto-restart working
- [ ] Logs rotating properly
- [ ] DNS/domain pointing to new VM (if applicable)
- [ ] HTTPS configured (if applicable)
- [ ] Old Docker container backed up before removal
- [ ] Documentation updated with new VM details

---

## Advantages of VM Installation vs. Docker

**Pros:**
- ✅ Traditional system administration (familiar to many)
- ✅ Direct access to all logs and configs
- ✅ Easier to troubleshoot for sysadmins
- ✅ No Docker overhead
- ✅ Can use system package manager for updates

**Cons:**
- ❌ Manual dependency management
- ❌ Less portable than container
- ❌ More complex to replicate environment
- ❌ Requires more maintenance
- ❌ No easy rollback to previous version

---

## Support & Troubleshooting

### Common Issues

**Backend won't start:**
```bash
# Check logs
sudo -u skillsapp pm2 logs skills-matrix-api

# Check database connection
psql -U skillsuser -d skills_matrix -h localhost
```

**Nginx shows 502 Bad Gateway:**
```bash
# Check if backend is running
curl http://localhost:3000/api/health

# Restart backend
sudo -u skillsapp pm2 restart skills-matrix-api
```

**Database connection errors:**
```bash
# Verify PostgreSQL is running
sudo systemctl status postgresql

# Check pg_hba.conf authentication
sudo nano /etc/postgresql/15/main/pg_hba.conf
```

---

This plan provides a complete roadmap for migrating from Docker to a traditional Linux VM installation. Follow the phases in order, and you'll have a production-ready system running natively on Linux!
