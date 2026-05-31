# VPS Production Deployment

Deploying the full stack to a production VPS with HTTPS, Caddy reverse proxy, and Let's Encrypt certificates.

## Architecture

```
Internet → Caddy (HTTPS, ports 80/443)
  ├── dashboard.yourdomain.com → frontend:3000
  ├── api.yourdomain.com       → backend:8000
  └── adminer.yourdomain.com   → adminer:8080
```

Caddy handles:
- HTTPS termination with automatic Let's Encrypt certificates
- Routing requests to the correct service based on subdomain
- HTTP to HTTPS redirect

## Prerequisites

- A Linux VPS (Ubuntu 22.04+ recommended) with SSH access
- A domain name with DNS configured
- Ports 80 and 443 open on the VPS firewall

## 1. DNS Configuration

Create DNS records pointing to your VPS IP:

| Record | Type | Value |
|--------|------|-------|
| `dashboard.yourdomain.com` | A | `YOUR-VPS-IP` |
| `api.yourdomain.com` | A | `YOUR-VPS-IP` |
| `adminer.yourdomain.com` | A | `YOUR-VPS-IP` |

Or use a wildcard:

| Record | Type | Value |
|--------|------|-------|
| `*.yourdomain.com` | A | `YOUR-VPS-IP` |

## 2. SSH into your VPS

```bash
ssh root@your-vps-ip
```

## 3. Install Docker

```bash
curl -fsSL https://get.docker.com | sh
```

## 4. Clone the repository

```bash
cd /root
git clone <your-repo-url> full-stack-fastapi-template
cd full-stack-fastapi-template
```

## 5. Create the Caddy network

The production setup uses a shared Docker network for Caddy communication:

```bash
docker network create caddy-net
```

This must exist before starting the stack.

## 6. Configure environment variables

Edit `.env`:

```bash
nano .env
```

### Production settings

```env
# Domain
DOMAIN=yourdomain.com

# Environment
ENVIRONMENT=production

# Secrets — generate with: python3 -c "import secrets; print(secrets.token_urlsafe(32))"
SECRET_KEY=<generated-secret>
POSTGRES_PASSWORD=<generated-secret>
FIRST_SUPERUSER_PASSWORD=<generated-secret>

# Superuser account
FIRST_SUPERUSER=admin@yourdomain.com

# CORS — must match your domain
BACKEND_CORS_ORIGINS="https://dashboard.yourdomain.com,https://api.yourdomain.com"
FRONTEND_HOST=https://dashboard.yourdomain.com

# Email (required for password reset)
SMTP_HOST=smtp.your-provider.com
SMTP_USER=your-email@domain.com
SMTP_PASSWORD=your-smtp-password
EMAILS_FROM_EMAIL=noreply@yourdomain.com
SMTP_PORT=587
SMTP_TLS=True
SMTP_SSL=False

# Database
POSTGRES_SERVER=db
POSTGRES_PORT=5432
POSTGRES_DB=app
POSTGRES_USER=postgres
```

### Generate secrets

```bash
# Run 3 times for SECRET_KEY, POSTGRES_PASSWORD, FIRST_SUPERUSER_PASSWORD
python3 -c "import secrets; print(secrets.token_urlsafe(32))"
```

### Email provider examples

| Provider | SMTP_HOST | SMTP_PORT |
|----------|-----------|-----------|
| Mailgun | `smtp.mailgun.org` | 587 |
| SendGrid | `smtp.sendgrid.net` | 587 |
| Postmark | `smtp.postmarkapp.com` | 587 |
| AWS SES | `email-smtp.us-east-1.amazonaws.com` | 587 |

## 7. Deploy

```bash
docker compose -f compose.yml -f compose.caddy.yml up --build -d
```

**Why this command?**

- `compose.yml` — base services (db, prestart, backend, frontend)
- `compose.caddy.yml` — Caddy reverse proxy with HTTPS
- NOT `compose.override.yml` — that file has dev-only settings (source mounts, hot reload, MailCatcher)

The stack starts in this order:
1. **db** — PostgreSQL (waits for health check)
2. **prestart** — runs migrations, seeds superuser (exits when done)
3. **backend** — FastAPI API server
4. **frontend** — SvelteKit production build
5. **caddy** — reverse proxy

## 8. Verify

Check all containers are running:

```bash
docker compose -f compose.yml -f compose.caddy.yml ps
```

You should see:

| Service | Status |
|---------|--------|
| db | Up (healthy) |
| backend | Up (healthy) |
| frontend | Up |
| caddy | Up |
| prestart | Exited (0) |

Test the backend health:

```bash
curl -k https://api.yourdomain.com/api/v1/utils/health-check/
```

Open in your browser:

```
https://dashboard.yourdomain.com
```

Login with the `FIRST_SUPERUSER` credentials.

## 9. SSL Certificates

Caddy automatically requests and renews Let's Encrypt certificates. The first time you access the site, Caddy will:

1. Verify domain ownership via HTTP-01 challenge
2. Request a certificate from Let's Encrypt
3. Serve the site over HTTPS

This takes 30-60 seconds. If it fails, check:
- DNS records point to your VPS IP
- Ports 80 and 443 are open
- Caddy logs: `docker compose -f compose.yml -f compose.caddy.yml logs caddy`

## 10. Ongoing operations

### Updating the application

```bash
cd /root/full-stack-fastapi-template
git pull

# Rebuild and restart
docker compose -f compose.yml -f compose.caddy.yml up --build -d
```

### Viewing logs

```bash
# All services
docker compose -f compose.yml -f compose.caddy.yml logs

# Follow backend logs
docker compose -f compose.yml -f compose.caddy.yml logs -f backend

# Follow Caddy logs
docker compose -f compose.yml -f compose.caddy.yml logs -f caddy
```

### Database backups

```bash
# Backup
docker compose -f compose.yml -f compose.caddy.yml exec db \
  pg_dump -U postgres app > backup_$(date +%Y%m%d).sql

# Restore
cat backup_20260531.sql | docker compose -f compose.yml -f compose.caddy.yml exec -T db \
  psql -U postgres app
```

### Restarting services

```bash
# Restart everything
docker compose -f compose.yml -f compose.caddy.yml restart

# Restart just the backend
docker compose -f compose.yml -f compose.caddy.yml restart backend
```

### Stopping

```bash
docker compose -f compose.yml -f compose.caddy.yml down
```

### Stopping and wiping data

```bash
docker compose -f compose.yml -f compose.caddy.yml down -v
```

**Warning:** `-v` deletes the database volume. All data is lost.

## 11. CI/CD with GitHub Actions

The repo includes GitHub Actions workflows for automated deployment:

- **Staging** — deploys on push to `master` branch
- **Production** — deploys on release

### Setup

1. Create a self-hosted GitHub Actions runner on your VPS
2. Configure GitHub Environments (`staging`, `production`)
3. Set environment secrets (see `deployment.md` for full list)

### Required secrets per environment

| Secret | Description |
|--------|-------------|
| `DOMAIN_PRODUCTION` | Your production domain |
| `SECRET_KEY` | JWT signing key |
| `POSTGRES_PASSWORD` | Database password |
| `FIRST_SUPERUSER` | Admin email |
| `FIRST_SUPERUSER_PASSWORD` | Admin password |
| `EMAILS_FROM_EMAIL` | Sender email |
| `LATEST_CHANGES` | GitHub token for release notes |

## Troubleshooting

### Caddy can't get SSL certificate

Check DNS and firewall:

```bash
# Verify DNS resolves to your VPS
dig dashboard.yourdomain.com

# Check if ports 80/443 are open
ss -tlnp | grep -E ':80|:443'
```

### "Connection refused" between services

Ensure all services are on the same Docker network:

```bash
docker network inspect caddy-net
```

### Backend unhealthy

Check backend logs:

```bash
docker compose -f compose.yml -f compose.caddy.yml logs backend
```

Common issues:
- Missing environment variables
- Database not ready (should auto-retry)
- Invalid `SECRET_KEY` or `POSTGRES_PASSWORD`

### Frontend can't reach backend

The frontend SDK uses `PUBLIC_API_URL` to reach the backend. In production, this should be `http://backend:8000` (Docker internal). Verify it's set:

```bash
docker compose -f compose.yml -f compose.caddy.yml exec frontend env | grep PUBLIC_API_URL
```

### Database connection issues

The backend connects to `db:5432` via Docker DNS. Verify the database is healthy:

```bash
docker compose -f compose.yml -f compose.caddy.yml exec db pg_isready -U postgres
```

## Security checklist

- [ ] `SECRET_KEY` is a random generated string (not `changethis`)
- [ ] `POSTGRES_PASSWORD` is a random generated string
- [ ] `FIRST_SUPERUSER_PASSWORD` is a random generated string
- [ ] `.env` is not committed to git (check `.gitignore`)
- [ ] Firewall only exposes ports 80, 443, and SSH
- [ ] Adminer is not publicly accessible (or has strong credentials)
- [ ] `ENVIRONMENT=production` (not `local`)
