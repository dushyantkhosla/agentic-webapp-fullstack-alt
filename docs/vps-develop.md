# VPS Development Setup

Setting up a development environment on a remote VPS so you can add features from your local laptop.

## Prerequisites

- A Linux VPS (Ubuntu 22.04+ recommended) with SSH access
- Your laptop has network access to the VPS
- Domain name pointing to the VPS IP (optional for dev, required for production)

## 1. SSH into your VPS

```bash
ssh root@your-vps-ip
```

## 2. Install Docker

```bash
curl -fsSL https://get.docker.com | sh
```

Verify Docker is running:

```bash
docker --version
docker compose version
```

## 3. Clone the repository

```bash
cd /root
git clone <your-repo-url> full-stack-fastapi-template
cd full-stack-fastapi-template
```

## 4. Configure environment variables

Copy or create the `.env` file:

```bash
cp .env.example .env  # if available
# or create .env manually (see below)
```

Edit `.env` with your settings:

```bash
nano .env
```

### Required changes

**Secrets** — generate secure random values:

```bash
python3 -c "import secrets; print(secrets.token_urlsafe(32))"
```

Run this 3 times and set:

```env
SECRET_KEY=<generated-1>
FIRST_SUPERUSER_PASSWORD=<generated-2>
POSTGRES_PASSWORD=<generated-3>
```

**Superuser account:**

```env
FIRST_SUPERUSER=admin@yourdomain.com
```

**Server IP for CORS** — your VPS IP so the browser allows API calls:

```env
BACKEND_CORS_ORIGINS="http://localhost,http://localhost:5173,http://YOUR-VPS-IP:5173"
FRONTEND_HOST=http://YOUR-VPS-IP:5173
```

**Optional: Email (for password reset features)**

```env
SMTP_HOST=smtp.your-provider.com
SMTP_USER=your-email@domain.com
SMTP_PASSWORD=your-smtp-password
EMAILS_FROM_EMAIL=noreply@yourdomain.com
```

If left empty, email features won't work but the app will run fine.

### Port configuration

Default ports should work on a fresh VPS. If something is already using a port:

```env
HOST_PORT_FRONTEND=5174   # default: 5173
HOST_PORT_BACKEND=8001     # default: 8000
HOST_PORT_DB=5434          # default: 5433
```

See [initial-dev-setup.md](initial-dev-setup.md) for details on port parameterization.

## 5. Start the stack

```bash
docker compose up --build db backend frontend
```

This starts:
- **db** — PostgreSQL database on port 5433 (host) → 5432 (container)
- **prestart** — runs migrations and seeds the superuser (exits after completion)
- **backend** — FastAPI API server on port 8000 with hot reload
- **frontend** — SvelteKit app on port 5173

Wait for the "Application startup complete" message in the logs.

## 6. Access from your laptop

Open in your browser:

```
http://YOUR-VPS-IP:5173
```

Login with:
- Email: the `FIRST_SUPERUSER` email from your `.env`
- Password: the `FIRST_SUPERUSER_PASSWORD` from your `.env`

## 7. Development workflow

### Making code changes

The `backend/` and `frontend/` directories are mounted as volumes in the containers. Changes are reflected immediately:

- **Backend** — FastAPI runs with `--reload`, so Python file changes restart automatically
- **Frontend** — SvelteKit dev server watches for changes

Edit files on the VPS via your editor, or use VS Code Remote SSH:

```bash
# From your laptop
code ssh://root@your-vps-ip/root/full-stack-fastapi-template
```

### Running tests

Backend tests:

```bash
docker compose exec backend pytest
```

Frontend tests (Playwright E2E):

```bash
docker compose run --rm playwright
```

### Checking logs

```bash
# All services
docker compose logs

# Specific service
docker compose logs backend
docker compose logs frontend
docker compose logs -f backend  # follow mode
```

### Database access

Adminer is available at `http://YOUR-VPS-IP:8081`:
- System: PostgreSQL
- Server: `db`
- Username: `postgres`
- Password: from `.env` `POSTGRES_PASSWORD`
- Database: `app`

### Stopping services

```bash
# Stop all
docker compose down

# Stop and wipe database (fresh start)
docker compose down -v

# Restart just the backend
docker compose restart backend
```

## 8. Useful commands

```bash
# Rebuild after dependency changes
docker compose up --build

# Enter the backend container shell
docker compose exec backend bash

# Enter the frontend container shell
docker compose exec frontend sh

# Run Alembic migrations manually
docker compose exec backend alembic upgrade head

# Create a new migration
docker compose exec backend alembic revision --autogenerate -m "description"

# Regenerate the API client (after backend API changes)
docker compose exec frontend npm run generate-client
```

## Troubleshooting

### "Connection refused" when connecting to database

The `POSTGRES_PORT` in `.env` must be `5432` (the internal Docker port), not the host port. See [initial-dev-setup.md](initial-dev-setup.md#5-container-port-decoupling-postgres_port-fix).

### Login fails with "Incorrect email or password"

Check that the frontend can reach the backend. The SDK needs `PUBLIC_API_URL` set in the frontend container's environment. This is configured in `compose.override.yml`.

### CORS errors in browser console

Add your VPS IP (with port) to `BACKEND_CORS_ORIGINS` in `.env`:

```env
BACKEND_CORS_ORIGINS="http://YOUR-VPS-IP:5173"
```

Then restart the backend:

```bash
docker compose restart backend
```

### Port already in use

Change the host port in `.env`:

```env
HOST_PORT_FRONTEND=5174
```

Then restart:

```bash
docker compose up -d
```
