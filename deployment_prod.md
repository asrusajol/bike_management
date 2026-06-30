# BikeTrack — Production Deployment Guide

Target OS: **Ubuntu 22.04 LTS** (also works on Debian 12).  
All commands run as a non-root user with `sudo` access unless stated otherwise.

---

## Table of Contents

1. [Server Requirements](#1-server-requirements)
2. [Install Dependencies](#2-install-dependencies)
3. [Create a Deploy User](#3-create-a-deploy-user)
4. [Clone the Repository](#4-clone-the-repository)
5. [Configure Environment Variables](#5-configure-environment-variables)
6. [Build and Start Containers](#6-build-and-start-containers)
7. [Configure Nginx Reverse Proxy](#7-configure-nginx-reverse-proxy)
8. [SSL Certificate with Let's Encrypt](#8-ssl-certificate-with-lets-encrypt)
9. [Firewall](#9-firewall)
10. [Database Backups](#10-database-backups)
11. [Viewing Logs](#11-viewing-logs)
12. [Updating the Application](#12-updating-the-application)
13. [Security Checklist](#13-security-checklist)
14. [Troubleshooting](#14-troubleshooting)

---

## 1. Server Requirements

| Resource | Minimum | Recommended |
|---|---|---|
| CPU | 1 vCPU | 2 vCPU |
| RAM | 1 GB | 2 GB |
| Disk | 20 GB SSD | 40 GB SSD |
| OS | Ubuntu 22.04 LTS | Ubuntu 22.04 LTS |
| Open ports | 22, 80, 443 | 22, 80, 443 |

---

## 2. Install Dependencies

### Docker

```bash
# Remove old versions if any
sudo apt-get remove -y docker docker-engine docker.io containerd runc 2>/dev/null

# Install Docker via official script
curl -fsSL https://get.docker.com | sudo sh

# Add your user to the docker group (log out and back in after this)
sudo usermod -aG docker $USER
```

### Docker Compose (plugin)

Docker Compose v2 ships with Docker Desktop and the script above. Verify:

```bash
docker compose version
# Should show: Docker Compose version v2.x.x
```

### Nginx and Certbot

```bash
sudo apt-get update
sudo apt-get install -y nginx certbot python3-certbot-nginx
```

---

## 3. Create a Deploy User

Running the app as root is a security risk. Create a dedicated user:

```bash
sudo adduser biketrack
sudo usermod -aG docker biketrack
# Switch to the new user for all subsequent steps
sudo su - biketrack
```

---

## 4. Clone the Repository

```bash
cd /home/biketrack
git clone https://github.com/YOUR_USERNAME/bike_management.git app
cd app
```

---

## 5. Configure Environment Variables

### Backend `.env`

```bash
cp backend/.env.example backend/.env
nano backend/.env
```

Fill in every value — do **not** leave defaults in production:

```env
# App
APP_NAME="BikeTrack"
DEBUG=false
# Generate: python3 -c "import secrets; print(secrets.token_hex(32))"
SECRET_KEY=REPLACE_WITH_64_CHAR_RANDOM_HEX

# Database — service name "db" is the Docker Compose hostname
DATABASE_URL=postgresql://bikeuser:STRONG_PASSWORD@db:5432/bikedb
ASYNC_DATABASE_URL=postgresql+asyncpg://bikeuser:STRONG_PASSWORD@db:5432/bikedb

# Redis — service name "redis"
REDIS_URL=redis://redis:6379/0

# Workers (2 × CPU cores + 1)
WEB_CONCURRENCY=3

# CORS — must match your public domain exactly
FRONTEND_URL=https://yourdomain.com

# Postgres credentials (used by Docker Compose to initialise the DB)
POSTGRES_USER=bikeuser
POSTGRES_PASSWORD=STRONG_PASSWORD
POSTGRES_DB=bikedb

# AWS S3 (optional — for receipt uploads)
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_BUCKET_NAME=
AWS_REGION=ap-southeast-1

# SMTP (optional — for reminder emails)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=
EMAILS_FROM=noreply@yourdomain.com
```

> **Important:** `POSTGRES_PASSWORD` in `.env` and `@STRONG_PASSWORD` in `DATABASE_URL` must be the **same value**.

---

## 6. Build and Start Containers

```bash
# Build all images (takes 3–5 minutes on first run)
docker compose build

# Start in detached mode
docker compose up -d

# Verify all four containers are running
docker compose ps
```

Expected output:

```
NAME                 STATUS          PORTS
app-backend-1        Up (healthy)    127.0.0.1:8000->8000/tcp
app-db-1             Up (healthy)    127.0.0.1:5434->5432/tcp
app-frontend-1       Up              127.0.0.1:3000->80/tcp
app-redis-1          Up              127.0.0.1:6379->6379/tcp
```

The `backend` entrypoint automatically runs `alembic upgrade head` before starting uvicorn. Check migration output:

```bash
docker compose logs backend | head -20
# Should show: [entrypoint] Running Alembic migrations…
#              INFO  [alembic.runtime.migration] Running upgrade  -> 0001, initial schema
#              [entrypoint] Starting server (workers: 3)…
```

---

## 7. Configure Nginx Reverse Proxy

The frontend container (port 3000) serves the React app **and** proxies `/api/*` to the backend internally. Your host nginx only needs to forward everything to port 3000.

### Create the site config

```bash
sudo nano /etc/nginx/sites-available/biketrack
```

Paste the following (HTTP only for now — SSL is added in step 8):

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Allow large file uploads (receipts / bike photos)
    client_max_body_size 10M;

    location / {
        proxy_pass         http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header   Host              $host;
        proxy_set_header   X-Real-IP         $remote_addr;
        proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_read_timeout 60s;

        # WebSocket support (for future features)
        proxy_set_header   Upgrade    $http_upgrade;
        proxy_set_header   Connection "upgrade";
    }
}
```

### Enable and reload

```bash
sudo ln -s /etc/nginx/sites-available/biketrack /etc/nginx/sites-enabled/
sudo nginx -t          # must print "syntax is ok"
sudo systemctl reload nginx
```

The app is now reachable at `http://yourdomain.com`.

---

## 8. SSL Certificate with Let's Encrypt

Your domain's DNS A record must already point to this server's IP before running certbot.

```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com \
  --non-interactive --agree-tos -m admin@yourdomain.com
```

Certbot rewrites your nginx config automatically to add HTTPS and the HTTP→HTTPS redirect.

### Verify auto-renewal

```bash
sudo certbot renew --dry-run
```

Certbot installs a systemd timer that renews certs automatically. Check it:

```bash
sudo systemctl status certbot.timer
```

---

## 9. Firewall

Allow only SSH, HTTP, and HTTPS. All other ports (8000, 3000, 5434, 6379) remain bound to `127.0.0.1` and are not reachable from the internet.

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
sudo ufw status
```

Expected:

```
Status: active
To                         Action      From
--                         ------      ----
OpenSSH                    ALLOW       Anywhere
Nginx Full                 ALLOW       Anywhere
```

---

## 10. Database Backups

### Manual backup

```bash
# Dump to a timestamped file
docker compose exec db pg_dump -U bikeuser bikedb \
  | gzip > ~/backups/bikedb_$(date +%Y%m%d_%H%M%S).sql.gz
```

### Automated daily backup (cron)

```bash
mkdir -p ~/backups

# Open crontab
crontab -e
```

Add this line to run at 02:00 every night and keep the last 30 dumps:

```cron
0 2 * * * cd /home/biketrack/app && \
  docker compose exec -T db pg_dump -U bikeuser bikedb \
  | gzip > /home/biketrack/backups/bikedb_$(date +\%Y\%m\%d_\%H\%M\%S).sql.gz && \
  find /home/biketrack/backups -name "*.sql.gz" -mtime +30 -delete
```

### Restore from backup

```bash
gunzip -c ~/backups/bikedb_20260630_020000.sql.gz \
  | docker compose exec -T db psql -U bikeuser bikedb
```

---

## 11. Viewing Logs

```bash
# All services together (last 100 lines, then follow)
docker compose logs -f --tail=100

# Single service
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f db

# Only errors
docker compose logs backend 2>&1 | grep -i "error\|exception\|traceback"
```

### Nginx access / error logs

```bash
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

---

## 12. Updating the Application

Zero-downtime update procedure (Docker handles container replacement):

```bash
cd /home/biketrack/app

# 1. Pull latest code
git pull origin main

# 2. Rebuild only changed images (--no-cache for a full clean build)
docker compose build

# 3. Restart with new images — Docker stops old containers and starts new ones
#    The backend entrypoint runs alembic upgrade head automatically
docker compose up -d

# 4. Verify new containers are healthy
docker compose ps

# 5. Watch backend startup for migration output
docker compose logs -f backend
```

### Roll back

If something breaks, roll back to the previous image by checking out the previous commit and rebuilding:

```bash
git log --oneline -5        # find the previous commit hash
git checkout <commit_hash>
docker compose build
docker compose up -d
```

---

## 13. Security Checklist

Before going live, verify each item:

- [ ] `SECRET_KEY` is a 64-character random hex string — **not** the placeholder
- [ ] `POSTGRES_PASSWORD` is strong (16+ chars, mixed) — not `bikepass`
- [ ] `DEBUG=false` in `backend/.env`
- [ ] `FRONTEND_URL` is the exact production domain (no trailing slash)
- [ ] Firewall is active — only ports 22, 80, 443 open
- [ ] All service ports (5434, 6379, 8000, 3000) are bound to `127.0.0.1` only
- [ ] SSL certificate is installed and HTTP redirects to HTTPS
- [ ] `backend/.env` is **not** committed to git (`.gitignore` covers it)
- [ ] Daily database backup cron is set up and verified
- [ ] `certbot renew --dry-run` passes

---

## 14. Troubleshooting

### Backend fails to start — "could not connect to server"

The backend container cannot reach PostgreSQL. Check:

```bash
# Is the db container healthy?
docker compose ps db

# Check backend .env — host must be "db", not "localhost"
grep DATABASE_URL backend/.env
# ✓ correct:   postgresql+asyncpg://bikeuser:...@db:5432/bikedb
# ✗ wrong:     postgresql+asyncpg://bikeuser:...@localhost:5434/bikedb
```

### 405 Method Not Allowed on POST /api/...

The frontend nginx isn't proxying API calls. Ensure `frontend/nginx.conf` has the `/api/` proxy block, then rebuild:

```bash
docker compose build frontend
docker compose up -d frontend
```

### Alembic migration error on startup

```bash
# View the full error
docker compose logs backend | grep -A 20 "alembic"

# Run migration manually for a detailed trace
docker compose exec backend alembic upgrade head
```

If the database has a stale `alembic_version` from the old incremental migrations, reset it:

```bash
docker compose exec db psql -U bikeuser bikedb \
  -c "DELETE FROM alembic_version;"
docker compose restart backend
```

### Frontend shows blank page / 404 on reload

React Router requires that all routes fall back to `index.html`. Verify the nginx config inside the frontend container has `try_files $uri $uri/ /index.html;`. If not, rebuild the frontend image after fixing `frontend/nginx.conf`.

### Check disk usage

```bash
# Docker images and volumes
docker system df

# Clean up unused images (safe after a successful deploy)
docker image prune -f
```

### Inspect a running container

```bash
docker compose exec backend sh    # open a shell in the backend container
docker compose exec db psql -U bikeuser bikedb   # connect to postgres directly
```
