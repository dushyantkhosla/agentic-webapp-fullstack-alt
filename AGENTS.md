# AGENTS.md

Guide for agentic coding sessions in this repository.

## Purpose

Full Stack FastAPI Template — a production-ready starter for building web apps with a FastAPI backend, SvelteKit frontend, PostgreSQL, and Docker deployment. Ships with user auth, item CRUD as a sample domain, admin panel, and CI/CD.

## Stack

| Layer | Tech |
|-------|------|
| Backend | Python 3.10+, FastAPI, SQLModel (ORM), Pydantic, Alembic |
| Frontend | SvelteKit (Svelte 5 runes), TypeScript, Tailwind CSS v4, shadcn-svelte |
| Database | PostgreSQL |
| Auth | JWT (PyJWT), Argon2 + Bcrypt hashing (pwdlib) |
| Infra | Docker Compose, Caddy (dev proxy), npm |
| Testing | Pytest (backend), Playwright (frontend E2E) |
| Package Mgmt | `uv` (Python), `npm` (Node.js) |

## Architecture

```
Caddy (reverse proxy, port 80)
  /api/*  →  backend:8000
  /*      →  frontend:3000 (prod) / :5173 (dev)

Backend (FastAPI)  →  PostgreSQL
Frontend (SvelteKit)  →  Backend API
```

Auth flow: Frontend stores JWT in httpOnly cookie → SvelteKit `hooks.server.ts` reads cookie, fetches `/api/v1/users/me` → populates `event.locals.user` → `+layout.server.ts` guards routes.

## Backend Routes

Routes live in `backend/app/api/routes/`. Each file creates an `APIRouter`:

```python
# backend/app/api/routes/items.py
router = APIRouter(prefix="/items", tags=["items"])
```

Register in `backend/app/api/main.py`:

```python
api_router.include_router(items.router)
```

This mounts at `/api/v1/items/` (prefix from `main.py`).

**To add a new route:**
1. Create `backend/app/api/routes/myroute.py` with `router = APIRouter(prefix="/myroute", tags=["myroute"])`
2. Add endpoints using `@router.get(...)`, `@router.post(...)`, etc.
3. Import and include in `backend/app/api/main.py`
4. Add models/schemas to `backend/app/models.py`
5. Add CRUD functions to `backend/app/crud.py`

Dependencies: `SessionDep` for DB session, `CurrentUser` for authenticated user, `get_current_active_superuser` for admin-only endpoints. Defined in `backend/app/api/deps.py`.

## Frontend Routes

SvelteKit filesystem routing under `frontend/src/routes/`:

```
routes/
  +layout.server.ts    # Auth guard (redirects unauthenticated → /login)
  +layout.svelte       # App shell (sidebar, header, footer)
  +page.svelte         # Dashboard (/)
  login/               # /login
  signup/              # /signup
  items/               # /items
  settings/            # /settings
  admin/               # /admin (superuser only)
  recover-password/    # /recover-password
  reset-password/      # /reset-password
```

**To add a new page:**
1. Create `frontend/src/routes/myroute/+page.svelte`
2. Optionally create `frontend/src/routes/myroute/+page.server.ts` for server-side data loading or form actions
3. If it's a protected route, no changes needed (auth guard handles it)
4. If it's a public route, add to `PUBLIC_ROUTES` in `+layout.server.ts`
5. Add sidebar link in `frontend/src/lib/components/sidebar.svelte`

**To add a form action:** Use named actions in `+page.server.ts`:

```typescript
export const actions: Actions = {
    myAction: async ({ request, cookies }) => { ... }
};
```

Call from svelte: `<form method="post" action="?/myAction">`

API client is auto-generated in `frontend/src/lib/api/` from OpenAPI spec. Regenerate with `npm run generate-client` (requires `openapi.json`).

## User Management

**Models** (`backend/app/models.py`):
- `User` — DB table with `id` (UUID), `email`, `hashed_password`, `is_active`, `is_superuser`, `full_name`, `created_at`
- `UserCreate`, `UserRegister`, `UserUpdate`, `UserUpdateMe`, `UserPublic` — Pydantic schemas

**Roles:**
- Regular user (`is_superuser=False`): manage own items, update own profile
- Superuser (`is_superuser=True`): manage all users/items, admin panel access

**Auth endpoints:**
- `POST /api/v1/users/signup` — public registration
- `POST /api/v1/login/access-token` — OAuth2 form login, returns JWT
- `POST /api/v1/password-recovery/{email}` — sends reset email
- `POST /api/v1/reset-password/` — reset with token
- `PATCH /api/v1/users/me/password` — change own password

**First superuser** is seeded at startup from `FIRST_SUPERUSER` / `FIRST_SUPERUSER_PASSWORD` in `.env`.

## Database

**ORM:** SQLModel (SQLAlchemy + Pydantic hybrid). Models in `backend/app/models.py` with `table=True`.

**Tables:** `user` (users), `item` (items with FK to user, cascade delete).

**Migrations:** Alembic in `backend/app/alembic/`. Run `alembic upgrade head` to apply. Create new migration with `alembic revision --autogenerate -m "description"`.

**Prestart script** (`scripts/prestart.sh`): waits for DB → runs migrations → seeds superuser. Runs automatically on `docker compose up`.

## Development Setup

```bash
docker compose watch
```

| Service | Port | Purpose |
|---------|------|---------|
| backend | 8000 | FastAPI (--reload) |
| frontend | 5173 | SvelteKit dev server |
| db | 5432 | PostgreSQL |
| adminer | 8080 | DB admin UI |
| mailcatcher | 1080 | Email catch-all |
| caddy | 80 | Reverse proxy |

**Without Docker:**
- Backend: `cd backend && uv pip install -e . && fastapi dev app/main.py`
- Frontend: `cd frontend && npm install && npm run dev`

**Environment:** All config in `.env` (root). Key vars: `SECRET_KEY`, `FIRST_SUPERUSER`, `POSTGRES_PASSWORD`, `DOMAIN`.

## Deployment

Production uses Docker Compose with `compose.yml` + `compose.caddy.yml` (Caddy reverse proxy with HTTPS).

**Startup order:** db (healthy) → prestart (migrations + seed) → backend → frontend.

**CI/CD:** GitHub Actions auto-deploys staging on push to `master`, production on release. Uses self-hosted runners.

**Production URLs:** `dashboard.{DOMAIN}`, `api.{DOMAIN}`, `adminer.{DOMAIN}`.

**Important:** Change `SECRET_KEY`, `POSTGRES_PASSWORD`, and `FIRST_SUPERUSER_PASSWORD` before deploying to production.
