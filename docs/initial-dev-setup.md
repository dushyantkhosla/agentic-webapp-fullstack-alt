# Initial Dev Setup — Changes Log

A record of every change needed to get this template running on a headless Linux server (192.168.1.44) accessed from a laptop on the same network.

---

## 1. Port Conflict Resolution

**Problem:** Default ports 5432 and 8080 were already in use by other Docker containers on the host.

**Changes:**

```yaml
# compose.override.yml
# DB: host port 5433 → container port 5432 (container internal port stays 5432)
- "5432:5432"  →  "${HOST_PORT_DB:-5433}:5432"

# Adminer: host port 8081 → container port 8080
- "8080:8080"  →  "8081:8080"
```

```env
# .env
HOST_PORT_DB=5433
```

**Why:** Docker port mappings are `host:container`. The container always listens on its internal port (5432 for PostgreSQL, 8080 for Adminer). The host port is what you access from your machine. Changing only the host side avoids touching any application code.

---

## 2. Dependency Upgrades

**Problem:** `npm ci` failed with peer dependency conflict — `@sveltejs/vite-plugin-svelte@5.x` only supports `vite@^6.0.0`, but `package.json` had `vite@^7.3.0`.

**Changes in `frontend/package.json`:**

| Package | Old | New | Reason |
|---------|-----|-----|--------|
| `vite` | `^7.3.0` | `^8.0.0` | Latest stable |
| `@sveltejs/vite-plugin-svelte` | `^5.0.0` | `^7.0.0` | Supports vite 7+8 |
| `@sveltejs/kit` | `^2.21.0` | `^2.61.0` | Latest, supports vite 5-8 |
| `@sveltejs/adapter-node` | `^5.0.0` | `^5.5.0` | Latest compatible |
| `svelte` | `^5.28.0` | `^5.46.0` | Required by plugin v7 |
| `svelte-check` | `^4.0.0` | `^4.4.0` | Latest |

**Changes in `backend/pyproject.toml`:**

| Package | Old | New |
|---------|-----|-----|
| `fastapi` | `>=0.114.2` | `>=0.136.0` |
| `sqlmodel` | `>=0.0.21` | `>=0.0.38` |
| `pydantic-settings` | `>=2.2.1` | `>=2.14.0` |
| `httpx` | `>=0.25.1` | `>=0.28.0` |
| `tenacity` | `>=8.2.3` | `>=9.0.0` |
| `pytest` | `>=7.4.3` | `>=9.0.0` |
| `mypy` | `>=1.8.0` | `>=2.0.0` |
| `ruff` | `>=0.2.2` | `>=0.15.0` |

**Lock files regenerated:**
- `frontend/package-lock.json` — deleted and regenerated via `npm install`
- `backend/uv.lock` — regenerated via `uv lock --upgrade`

---

## 3. Secret Rotation

**Problem:** Default secrets (`changethis`) are a security risk and trigger warnings.

**Changes in `.env`:**

```env
SECRET_KEY=CJ_flkqp9Xkh8HInN8seD1sPp-EkX-gDA8JzynRIPqQ
FIRST_SUPERUSER_PASSWORD=UTCHok4GMNKJZELt9FvG4A
POSTGRES_PASSWORD=Th9lhfkSTzcqSvoklw0GJg
```

Generated with: `python3 -c "import secrets; print(secrets.token_urlsafe(32))"`

---

## 4. Host Port Parameterization

**Problem:** If a host port is occupied, you had to manually edit multiple files. Wanted a single `.env` change.

**New env vars in `.env`:**

```env
HOST_PORT_FRONTEND=5173
HOST_PORT_BACKEND=8000
HOST_PORT_DB=5433
```

**`compose.override.yml` — port mappings now use env vars:**

```yaml
db:
  ports:
    - "${HOST_PORT_DB:-5433}:5432"
backend:
  ports:
    - "${HOST_PORT_BACKEND:-8000}:8000"
frontend:
  ports:
    - "${HOST_PORT_FRONTEND:-5173}:3000"
```

**`frontend/vite.config.ts` — dev server port reads from env:**

```typescript
server: {
  port: Number(process.env.HOST_PORT_FRONTEND) || 5173,
}
```

**`frontend/playwright.config.ts` — test runner uses env port:**

```typescript
const frontendPort = process.env.HOST_PORT_FRONTEND || '5173';
const baseURL = `http://localhost:${frontendPort}`;
```

**Why:** One `.env` change cascades everywhere. No touching compose files or app code.

---

## 5. Container Port Decoupling (POSTGRES_PORT fix)

**Problem:** `POSTGRES_PORT` in `.env` was passed to containers via `compose.yml`. Setting it to `5433` (the host port) broke container-to-container connections — PostgreSQL listens on `5432` inside its container.

**Key insight:** Inside Docker, containers communicate via **service names** (DNS), not port mappings. The `5433:5432` mapping only affects host access.

**Changes in `compose.yml`:**

```yaml
# Hardcoded to 5432 — this is PostgreSQL's internal listening port
- POSTGRES_PORT=5432  # was: ${POSTGRES_PORT}
```

```env
# .env — fixed to 5432 (the internal port, not the host port)
POSTGRES_PORT=5432
```

---

## 6. Caddy Production Profile

**Problem:** Caddy reverse proxy was always started, even in local dev where it's unnecessary.

**Change in `compose.override.yml`:**

```yaml
caddy:
  image: caddy:2
  profiles:
    - production  # only starts with --profile production
```

**Usage:**

```bash
# Dev (no Caddy)
docker compose up -d db backend frontend

# Production (with Caddy)
docker compose --profile production up -d
```

---

## 7. CORS Update for Network Access

**Problem:** Frontend served from `192.168.1.44:5173` was blocked by backend CORS — only `localhost` was allowed.

**Changes in `.env`:**

```env
BACKEND_CORS_ORIGINS="http://localhost,http://localhost:5173,...,http://192.168.1.44:5173"
FRONTEND_HOST=http://192.168.1.44:5173
```

**Why:** `BACKEND_CORS_ORIGINS` controls which origins the FastAPI backend accepts requests from. `FRONTEND_HOST` is used to generate links in emails (e.g., password reset).

---

## 8. Frontend → Backend Connectivity (SDK baseUrl)

**Problem:** Login failed with "Incorrect email or password". The auto-generated API SDK used a **relative URL** (`/api/v1/login/access-token`), which hit the frontend server (port 5173), not the backend (port 8000). Without Caddy as a reverse proxy in dev, the frontend has no `/api` route.

**Root cause:** `client.gen.ts` had no `baseUrl` — requests went to the wrong server.

**Changes in `frontend/src/lib/api/client.gen.ts`:**

```typescript
const envUrl = typeof process !== 'undefined' && process.env
  ? process.env.PUBLIC_API_URL
  : undefined;
export const client = createClient(createConfig<ClientOptions2>({
  baseUrl: envUrl || 'http://localhost:8000',
}));
```

**Changes in `frontend/Dockerfile`:**

```dockerfile
ARG PUBLIC_API_URL=http://backend:8000
ENV PUBLIC_API_URL=$PUBLIC_API_URL
```

**Changes in `compose.override.yml` — frontend service:**

```yaml
environment:
  - PORT=3000
  - PUBLIC_API_URL=http://backend:8000  # added
```

**Why:** `import.meta.env.PUBLIC_API_URL` is a Vite **build-time** replacement and only works with `VITE_`-prefixed vars. Using `process.env.PUBLIC_API_URL` reads the env var at **runtime** in the Node.js server. The `ARG`/`ENV` in Dockerfile makes it available during build; the `environment` section makes it available at runtime.

---

## 9. HTTP Cookie Fix (secure flag)

**Problem:** Login appeared to succeed (200 + redirect) but the browser immediately showed the login page again with cleared fields.

**Root cause:** The JWT cookie was set with `secure: true`, meaning the browser only sends it over HTTPS. Accessing via `http://192.168.1.44:5173` (plain HTTP) — the cookie was set but never sent back. `hooks.server.ts` couldn't find the token, `locals.user` stayed null, and the layout redirect sent the user back to `/login`.

**Change in `frontend/src/lib/auth.ts`:**

```typescript
cookies.set(TOKEN_COOKIE, token, {
  path: '/',
  httpOnly: true,
  secure: false,  // was: true — allows cookie over HTTP
  sameSite: 'lax',
  maxAge: TOKEN_MAX_AGE
});
```

**Why:** `secure: true` is correct for production (HTTPS), but breaks local dev over HTTP. For a dev environment, `secure: false` is necessary. In production, this should be `secure: true` (handled by the Caddy HTTPS termination).

---

## 10. Documentation Updates

**`development.md`:**
- Adminer port: `8080` → `8081`
- Traefik references → Caddy
- `bun run dev` → `npm run dev`
- Added `--profile production` for Caddy usage

**`deployment.md`:**
- Removed entire "Public Traefik" section (Traefik is not used)
- Deployment command: `docker compose -f compose.yml` → `docker compose --profile production`
- Fixed `FIRST_SUPER_USER_PASSWORD` typo → `FIRST_SUPERUSER_PASSWORD`
- Secret examples: `"changethis"` → `"<your-generated-secret>"`
- Updated `POSTGRES_PORT` description

---

## Summary: Quick Reference

| What | Where | Change |
|------|-------|--------|
| Host ports | `.env` | `HOST_PORT_FRONTEND`, `HOST_PORT_BACKEND`, `HOST_PORT_DB` |
| DB internal port | `compose.yml` | Hardcoded `5432` |
| CORS | `.env` | Add your server IP to `BACKEND_CORS_ORIGINS` |
| Caddy | `compose.override.yml` | Behind `--profile production` |
| SDK → backend | `client.gen.ts` | Reads `process.env.PUBLIC_API_URL` |
| Cookie over HTTP | `auth.ts` | `secure: false` for dev |
| Secrets | `.env` | Generate with `python3 -c "import secrets; print(secrets.token_urlsafe(32))"` |
