# Template: template-webapp-fastapi-sveltekit

## Overview

Sister template to `full-stack-fastapi-template`, swapping:
- React → SvelteKit (Svelte 5, runes mode)
- Traefik → Caddy 2
- shadcn/ui → shadcn-svelte

Backend (FastAPI, SQLModel, Alembic, PostgreSQL) stays untouched.

## Approach

Fork + surgical replace. Remove `frontend/`, scaffold SvelteKit in its place.
Replace Traefik config with Caddy. Keep backend, CI/CD patterns, deployment docs structure.

## Architecture

Same-origin routing via Caddy: `dashboard.{$DOMAIN}/api/*` proxies to `backend:8000`. Browser API calls are same-origin — no CORS config needed, SvelteKit's built-in CSRF protection works naturally. SvelteKit server code calls `http://backend:8000` directly via Docker networking.

```
Browser → dashboard.{$DOMAIN}/api/v1/* → Caddy → backend:8000
Browser → dashboard.{$DOMAIN}/*       → Caddy → frontend:3000
Browser → adminer.{$DOMAIN}/*         → Caddy → adminer:8080
```

```
template-webapp-fastapi-sveltekit/
├── backend/                  ← UNCHANGED
├── frontend/                 ← REPLACED (SvelteKit + shadcn-svelte)
├── compose.yml               ← Caddy network, frontend port 3000
├── compose.override.yml      ← Caddy dev proxy
├── compose.caddy.yml         ← NEW (replaces compose.traefik.yml)
├── Caddyfile                 ← NEW (reverse proxy config)
├── deployment.md             ← Caddy instructions
├── development.md            ← SvelteKit/Caddy references
├── copier.yml                ← Updated metadata
└── .github/workflows/        ← Updated
```

## Frontend Structure (SvelteKit)

```
frontend/
├── src/
│   ├── routes/
│   │   ├── +layout.svelte           ← Runes mode, sidebar/footer snippets
│   │   ├── +layout.server.ts        ← Auth guard (redirect if no user)
│   │   ├── +page.svelte             ← Dashboard
│   │   ├── login/
│   │   │   ├── +page.server.ts      ← Form action: FastAPI login → set cookie
│   │   │   └── +page.svelte
│   │   ├── signup/
│   │   │   ├── +page.server.ts      ← Form action: FastAPI create user
│   │   │   └── +page.svelte
│   │   ├── recover-password/
│   │   │   ├── +page.server.ts      ← Form action
│   │   │   └── +page.svelte
│   │   ├── reset-password/
│   │   │   ├── +page.server.ts      ← Form action
│   │   │   └── +page.svelte
│   │   ├── items/
│   │   │   ├── +page.server.ts      ← Load: fetch items from API
│   │   │   └── +page.svelte
│   │   ├── settings/
│   │   │   ├── +page.server.ts      ← Form action: update user
│   │   │   └── +page.svelte
│   │   └── admin/
│   │       ├── +page.server.ts      ← Load: fetch users, form actions
│   │       └── +page.svelte
│   ├── lib/
│   │   ├── components/
│   │   │   ├── ui/                  ← shadcn-svelte (runes mode)
│   │   │   ├── sidebar.svelte       ← $props for menu items
│   │   │   ├── footer.svelte
│   │   │   └── auth-layout.svelte   ← snippet for form content
│   │   ├── schemas/                 ← @hey-api/openapi-ts Zod output
│   │   ├── api/                     ← Generated fetch wrappers (SDK)
│   │   ├── auth.ts                  ← Cookie helpers
│   │   └── utils.ts                 ← cn(), formatters
│   ├── app.html
│   ├── app.css                      ← Tailwind v4 + shadcn-svelte vars
│   ├── app.d.ts                     ← Type declarations (Locals, Platform)
│   └── hooks.server.ts              ← Inject user into event.locals
├── svelte.config.js                 ← adapter-node, csrf.checkOrigin = false
├── vite.config.ts
├── package.json
├── Dockerfile                       ← Multi-stage, adapter-node, standalone context
├── Dockerfile.playwright            ← For E2E Docker service
└── .env                             ← PUBLIC_API_URL=http://backend:8000
```

### Key Frontend Patterns

- **Auth**: `hooks.server.ts` reads `access_token` cookie, calls `http://backend:8000/api/v1/users/me`, injects user into `event.locals.user`. Protected routes check in `+layout.server.ts` and redirect to `/login` if missing. Login form action calls FastAPI `/api/v1/login/access-token`, sets cookie. Logout clears cookie.
- **Data fetching**: `+page.server.ts` load functions use `event.locals.user` for current user. For API data, load functions call `http://backend:8000/api/v1/...` directly with the token from cookies. No browser-side fetch for initial data.
- **Components**: Svelte 5 runes (`$state`, `$derived`, `$props`), no stores, `onclick` not `on:click`, snippets instead of slots.
- **API client**: `@hey-api/openapi-ts` with `@hey-api/client-fetch` and `@hey-api/zod` plugins. Generates typed fetch wrappers + Zod schemas from OpenAPI spec.
- **CSRF**: `svelte.config.js` sets `csrf.checkOrigin = false` — safe because Caddy makes all browser requests same-origin.

### hooks.server.ts

```ts
export const handle = async ({ event, resolve }) => {
    const token = event.cookies.get('access_token');
    if (token) {
        try {
            const res = await fetch('http://backend:8000/api/v1/users/me', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                event.locals.user = await res.json();
            }
        } catch { /* backend unreachable */ }
    }
    return resolve(event);
};
```

### svelte.config.js

```js
import adapter from '@sveltejs/adapter-node';

export default {
    kit: {
        adapter: adapter(),
        csrf: {
            checkOrigin: false
        }
    }
};
```

### API Client Config

```ts
// frontend/openapi-ts.config.ts
import { defineConfig } from '@hey-api/openapi-ts';

export default defineConfig({
    input: './openapi.json',
    output: './src/client',
    plugins: [
        '@hey-api/client-fetch',
        {
            name: '@hey-api/sdk',
            asClass: true,
            operationId: true,
        },
        '@hey-api/zod',
    ],
});
```

## Caddy Reverse Proxy

- **Image**: `caddy:2`
- **Network**: `caddy-net` (replaces `traefik-public`)
- **Caddyfile** uses same-origin routing:
  - `dashboard.{$DOMAIN}/api/*` → `backend:8000`
  - `dashboard.{$DOMAIN}/*` → `frontend:3000`
  - `adminer.{$DOMAIN}` → `adminer:8080`
- Auto HTTPS (Let's Encrypt) enabled by default
- Local dev (localhost) gets auto self-signed certs
- No Docker socket mounting, no label-based routing

### Caddyfile

```
dashboard.{$DOMAIN} {
    handle /api/* {
        reverse_proxy backend:8000
    }
    handle {
        reverse_proxy frontend:3000
    }
}

adminer.{$DOMAIN} {
    reverse_proxy adminer:8080
}
```

### compose.caddy.yml (production)

```yaml
services:
  caddy:
    image: caddy:2
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
      - "443:443/udp"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
      - caddy_data:/data
      - caddy_config:/config
    networks:
      - caddy-net

volumes:
  caddy_data:
  caddy_config:

networks:
  caddy-net:
    external: true
```

### compose.yml changes

- Remove all `traefik.*` labels from `backend`, `frontend`, `adminer`
- Network: `caddy-net` (external)
- Frontend port: 80 (nginx) → 3000 (adapter-node)
- Frontend build context: `./frontend` (standalone, not monorepo root)

### compose.override.yml changes

- Remove Traefik `proxy` service
- Add Caddy dev proxy (port 80)
- Frontend port: `5173:80` → `5173:3000`
- Frontend build context: `./frontend`
- Network: `caddy-net` with `external: false`
- Carry over `mailcatcher` service (unchanged)
- Carry over `playwright` service (bun → npm, port 3000)

## Frontend Dockerfile

```dockerfile
FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ARG ORIGIN=https://dashboard.${DOMAIN}
RUN npm run build

FROM node:22-alpine
WORKDIR /app
COPY --from=builder /app/build ./build
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
EXPOSE 3000
CMD ["node", "build"]
```

- `ORIGIN` build arg sets CSRF origin for adapter-node
- `PORT` defaults to 3000 (overridable at runtime)
- Build context is `./frontend` (standalone)

## Frontend Dockerfile.playwright

```dockerfile
FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ARG PUBLIC_API_URL=http://backend:8000
RUN npm run build

FROM mcr.microsoft.com/playwright:v1.58.2-noble
WORKDIR /app
COPY --from=builder /app ./app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/playwright.config.ts ./
COPY --from=builder /app/tests ./tests
CMD ["npx", "playwright", "test"]
```

## CI/CD

- `deploy-production.yml` / `deploy-staging.yml`: use `compose.yml` + `compose.caddy.yml`, no Traefik
- `playwright.yml`: `npm` replaces `bun`, same sharding strategy
- `test-docker-compose.yml`: frontend health check on port 3000
- `test-backend.yml`: UNCHANGED

## Files to Remove

- `frontend/` (entire directory)
- `compose.traefik.yml`
- `bun.lock`

## Files to Add

- `frontend/` (new SvelteKit scaffold)
- `compose.caddy.yml`
- `Caddyfile`

## Files to Modify

- `compose.yml` — remove Traefik labels, change network, update frontend port/context
- `compose.override.yml` — replace Traefik proxy with Caddy, update ports, carry over mailcatcher + playwright
- `copier.yml` — remove EMAIL variable (Caddy auto-detects)
- `.env` / `.env.example` — `PUBLIC_API_URL`, remove `STACK_NAME` if unused

## Package Managers

- **Frontend**: npm
- **Backend**: uv (unchanged)
- **Client generation**: `@hey-api/openapi-ts` + npm scripts

## Testing

- E2E: Playwright (same as original, rewritten for SvelteKit selectors)
- Backend: pytest + coverage (unchanged)
- Docker Compose integration: health-check based (updated ports)
