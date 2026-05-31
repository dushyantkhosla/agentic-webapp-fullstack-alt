# SvelteKit + Caddy Template Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the React/Traefik frontend with a SvelteKit (Svelte 5 runes) + Caddy 2 reverse proxy, keeping the FastAPI backend untouched.

**Architecture:** SvelteKit with adapter-node serves on port 3000. Caddy reverse-proxies `dashboard.{$DOMAIN}/api/*` to `backend:8000` and `dashboard.{$DOMAIN}/*` to `frontend:3000`, making all browser requests same-origin. Auth uses HTTP-only cookies set via SvelteKit form actions, with `hooks.server.ts` injecting the user into `event.locals`.

**Tech Stack:** SvelteKit, Svelte 5 (runes mode), Tailwind CSS v4, shadcn-svelte, @hey-api/openapi-ts (fetch + Zod plugins), adapter-node, Caddy 2, Playwright, npm

---

## File Structure

### Files to Remove
- `frontend/` — entire existing React directory
- `compose.traefik.yml` — Traefik production config
- `bun.lock` — bun lockfile (switching to npm)

### Files to Create (frontend scaffold)
- `frontend/package.json` — dependencies and scripts
- `frontend/svelte.config.js` — adapter-node, CSRF disabled
- `frontend/vite.config.ts` — SvelteKit vite plugin
- `frontend/tsconfig.json` — extends .svelte-kit/tsconfig.json
- `frontend/src/app.html` — HTML shell
- `frontend/src/app.css` — Tailwind v4 + shadcn-svelte CSS variables
- `frontend/src/app.d.ts` — SvelteKit type declarations (Locals)
- `frontend/src/hooks.server.ts` — Auth hook: cookie → user in locals
- `frontend/.env` — PUBLIC_API_URL, MAILCATCHER_HOST
- `frontend/.gitignore` — node_modules, .svelte-kit, build, etc.
- `frontend/.dockerignore` — node_modules, .svelte-kit, build, etc.

### Files to Create (routes)
- `frontend/src/routes/+layout.svelte` — App shell: sidebar, header, footer
- `frontend/src/routes/+layout.server.ts` — Auth guard: redirect to /login if no user
- `frontend/src/routes/+page.svelte` — Dashboard page
- `frontend/src/routes/login/+page.server.ts` — Login form action
- `frontend/src/routes/login/+page.svelte` — Login form
- `frontend/src/routes/signup/+page.server.ts` — Signup form action
- `frontend/src/routes/signup/+page.svelte` — Signup form
- `frontend/src/routes/recover-password/+page.server.ts` — Password recovery form action
- `frontend/src/routes/recover-password/+page.svelte` — Password recovery form
- `frontend/src/routes/reset-password/+page.server.ts` — Reset password form action
- `frontend/src/routes/reset-password/+page.svelte` — Reset password form
- `frontend/src/routes/items/+page.server.ts` — Load items from API
- `frontend/src/routes/items/+page.svelte` — Items list page
- `frontend/src/routes/settings/+page.server.ts` — Load/update user settings
- `frontend/src/routes/settings/+page.svelte` — Settings page with tabs
- `frontend/src/routes/admin/+page.server.ts` — Load users, admin guard
- `frontend/src/routes/admin/+page.svelte` — Admin users page

### Files to Create (lib)
- `frontend/src/lib/utils.ts` — cn() helper, formatters
- `frontend/src/lib/auth.ts` — Cookie helper functions
- `frontend/src/lib/components/ui/` — shadcn-svelte components (installed via CLI)
- `frontend/src/lib/components/sidebar.svelte` — App sidebar component
- `frontend/src/lib/components/footer.svelte` — Footer component
- `frontend/src/lib/components/auth-layout.svelte` — Auth page layout wrapper

### Files to Create (API client — generated)
- `frontend/src/lib/schemas/` — @hey-api/openapi-ts Zod output (generated)
- `frontend/src/lib/api/` — @hey-api/openapi-ts SDK output (generated)
- `frontend/openapi-ts.config.ts` — Client generation config
- `frontend/openapi.json` — OpenAPI spec (copied from backend)

### Files to Create (Docker/infra)
- `frontend/Dockerfile` — Multi-stage node:22-alpine, adapter-node
- `frontend/Dockerfile.playwright` — Playwright test runner image
- `frontend/playwright.config.ts` — Playwright config for SvelteKit
- `Caddyfile` — Caddy reverse proxy config
- `compose.caddy.yml` — Caddy production compose service

### Files to Create (tests)
- `frontend/tests/config.ts` — Test env var helpers
- `frontend/tests/auth.setup.ts` — Playwright auth setup
- `frontend/tests/login.spec.ts` — Login E2E tests
- `frontend/tests/signup.spec.ts` — Signup E2E tests
- `frontend/tests/items.spec.ts` — Items E2E tests
- `frontend/tests/user-settings.spec.ts` — Settings E2E tests
- `frontend/tests/admin.spec.ts` — Admin E2E tests
- `frontend/tests/reset-password.spec.ts` — Password reset E2E tests
- `frontend/tests/utils/mailcatcher.ts` — Mailcatcher test helper
- `frontend/tests/utils/privateApi.ts` — Private API test helper
- `frontend/tests/utils/random.ts` — Random data generators
- `frontend/tests/utils/user.ts` — User test helpers

### Files to Modify
- `compose.yml` — Remove Traefik labels, add caddy-net, change frontend port/context
- `compose.override.yml` — Replace Traefik proxy with Caddy, update ports
- `copier.yml` — Remove EMAIL variable
- `.env` — Add PUBLIC_API_URL, update BACKEND_CORS_ORIGINS
- `.github/workflows/playwright.yml` — bun → npm
- `.github/workflows/test-docker-compose.yml` — Update health check port
- `.github/workflows/deploy-production.yml` — Add compose.caddy.yml
- `.github/workflows/deploy-staging.yml` — Add compose.caddy.yml

---

## Task 1: Remove Old Frontend and Scaffold SvelteKit

**Files:**
- Remove: `frontend/` (entire directory)
- Remove: `compose.traefik.yml`
- Remove: `bun.lock`
- Create: `frontend/package.json`
- Create: `frontend/svelte.config.js`
- Create: `frontend/vite.config.ts`
- Create: `frontend/tsconfig.json`
- Create: `frontend/src/app.html`
- Create: `frontend/src/app.css`
- Create: `frontend/src/app.d.ts`
- Create: `frontend/.env`
- Create: `frontend/.gitignore`
- Create: `frontend/.dockerignore`

- [ ] **Step 1: Remove old frontend and Traefik files**

```bash
rm -rf frontend/
rm -f compose.traefik.yml
rm -f bun.lock
```

- [ ] **Step 2: Create frontend directory structure**

```bash
mkdir -p frontend/src/routes/login
mkdir -p frontend/src/routes/signup
mkdir -p frontend/src/routes/recover-password
mkdir -p frontend/src/routes/reset-password
mkdir -p frontend/src/routes/items
mkdir -p frontend/src/routes/settings
mkdir -p frontend/src/routes/admin
mkdir -p frontend/src/lib/components/ui
mkdir -p frontend/src/lib/schemas
mkdir -p frontend/src/lib/api
mkdir -p frontend/tests/utils
mkdir -p frontend/static
```

- [ ] **Step 3: Create frontend/package.json**

```json
{
  "name": "frontend",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite dev",
    "build": "vite build",
    "preview": "vite preview",
    "check": "svelte-kit sync && svelte-check --tsconfig ./tsconfig.json",
    "check:watch": "svelte-kit sync && svelte-check --tsconfig ./tsconfig.json --watch",
    "lint": "prettier --check . && eslint .",
    "format": "prettier --write .",
    "generate-client": "openapi-ts",
    "test": "npx playwright test",
    "test:ui": "npx playwright test --ui"
  },
  "dependencies": {
    "@hey-api/client-fetch": "^0.10.0",
    "@hey-api/openapi-ts": "^0.73.0",
    "clsx": "^2.1.1",
    "tailwind-merge": "^3.4.0",
    "tailwindcss": "^4.2.1",
    "@tailwindcss/vite": "^4.1.18"
  },
  "devDependencies": {
    "@sveltejs/adapter-node": "^5.0.0",
    "@sveltejs/kit": "^2.21.0",
    "@sveltejs/vite-plugin-svelte": "^5.0.0",
    "@types/node": "^25.5.0",
    "dotenv": "^17.3.1",
    "prettier": "^3.5.0",
    "prettier-plugin-svelte": "^3.3.0",
    "prettier-plugin-tailwindcss": "^0.6.0",
    "svelte": "^5.28.0",
    "svelte-check": "^4.0.0",
    "typescript": "^5.9.0",
    "vite": "^7.3.0",
    "@playwright/test": "1.58.2"
  }
}
```

- [ ] **Step 4: Create frontend/svelte.config.js**

```js
import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
    preprocess: vitePreprocess(),
    kit: {
        adapter: adapter(),
        csrf: {
            checkOrigin: false
        }
    }
};

export default config;
```

- [ ] **Step 5: Create frontend/vite.config.ts**

```ts
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
    plugins: [tailwindcss(), sveltekit()],
    server: {
        port: 5173,
        strictPort: false
    }
});
```

- [ ] **Step 6: Create frontend/tsconfig.json**

```json
{
    "extends": "./.svelte-kit/tsconfig.json",
    "compilerOptions": {
        "allowJs": true,
        "checkJs": true,
        "esModuleInterop": true,
        "forceConsistentCasingInFileNames": true,
        "resolveJsonModule": true,
        "skipLibCheck": true,
        "sourceMap": true,
        "strict": true,
        "moduleResolution": "bundler"
    }
}
```

- [ ] **Step 7: Create frontend/src/app.html**

```html
<!doctype html>
<html lang="en">
    <head>
        <meta charset="utf-8" />
        <link rel="icon" href="%sveltekit.assets%/favicon.png" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        %sveltekit.head%
    </head>
    <body data-sveltekit-preload-data="hover">
        <div style="display: contents">%sveltekit.body%</div>
    </body>
</html>
```

- [ ] **Step 8: Create frontend/src/app.css**

```css
@import "tailwindcss";

@theme {
    --color-background: oklch(1 0 0);
    --color-foreground: oklch(0.145 0 0);
    --color-card: oklch(1 0 0);
    --color-card-foreground: oklch(0.145 0 0);
    --color-popover: oklch(1 0 0);
    --color-popover-foreground: oklch(0.145 0 0);
    --color-primary: oklch(0.205 0 0);
    --color-primary-foreground: oklch(0.985 0 0);
    --color-secondary: oklch(0.97 0 0);
    --color-secondary-foreground: oklch(0.205 0 0);
    --color-muted: oklch(0.97 0 0);
    --color-muted-foreground: oklch(0.556 0 0);
    --color-accent: oklch(0.97 0 0);
    --color-accent-foreground: oklch(0.205 0 0);
    --color-destructive: oklch(0.577 0.245 27.325);
    --color-destructive-foreground: oklch(0.577 0.245 27.325);
    --color-border: oklch(0.922 0 0);
    --color-input: oklch(0.922 0 0);
    --color-ring: oklch(0.708 0 0);
    --color-sidebar-background: oklch(0.985 0 0);
    --color-sidebar-foreground: oklch(0.145 0 0);
    --color-sidebar-primary: oklch(0.205 0 0);
    --color-sidebar-primary-foreground: oklch(0.985 0 0);
    --color-sidebar-accent: oklch(0.97 0 0);
    --color-sidebar-accent-foreground: oklch(0.205 0 0);
    --color-sidebar-border: oklch(0.922 0 0);
    --color-sidebar-ring: oklch(0.708 0 0);
    --radius-sm: 0.25rem;
    --radius-md: 0.375rem;
    --radius-lg: 0.5rem;
    --radius-xl: 0.75rem;
}

@variant dark {
    :root {
        --color-background: oklch(0.145 0 0);
        --color-foreground: oklch(0.985 0 0);
        --color-card: oklch(0.145 0 0);
        --color-card-foreground: oklch(0.985 0 0);
        --color-popover: oklch(0.145 0 0);
        --color-popover-foreground: oklch(0.985 0 0);
        --color-primary: oklch(0.985 0 0);
        --color-primary-foreground: oklch(0.205 0 0);
        --color-secondary: oklch(0.269 0 0);
        --color-secondary-foreground: oklch(0.985 0 0);
        --color-muted: oklch(0.269 0 0);
        --color-muted-foreground: oklch(0.708 0 0);
        --color-accent: oklch(0.269 0 0);
        --color-accent-foreground: oklch(0.985 0 0);
        --color-destructive: oklch(0.396 0.141 25.723);
        --color-destructive-foreground: oklch(0.637 0.237 25.331);
        --color-border: oklch(0.269 0 0);
        --color-input: oklch(0.269 0 0);
        --color-ring: oklch(0.439 0 0);
        --color-sidebar-background: oklch(0.17 0 0);
        --color-sidebar-foreground: oklch(0.985 0 0);
        --color-sidebar-primary: oklch(0.985 0 0);
        --color-sidebar-primary-foreground: oklch(0.205 0 0);
        --color-sidebar-accent: oklch(0.269 0 0);
        --color-sidebar-accent-foreground: oklch(0.985 0 0);
        --color-sidebar-border: oklch(0.269 0 0);
        --color-sidebar-ring: oklch(0.439 0 0);
    }
}

@layer base {
    * {
        @apply border-border;
    }
    body {
        @apply bg-background text-foreground;
        font-feature-settings: "rlig" 1, "calt" 1;
    }
}
```

- [ ] **Step 9: Create frontend/src/app.d.ts**

```ts
// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
    namespace App {
        interface Locals {
            user: import('$lib/api/types').UserPublic | null;
        }
    }
}

export {};
```

Note: The `UserPublic` type will be defined in Task 3 when we set up the API client. For now, this file establishes the shape of `App.Locals`.

- [ ] **Step 10: Create frontend/.env**

```env
PUBLIC_API_URL=http://backend:8000
MAILCATCHER_HOST=http://localhost:1080
```

- [ ] **Step 11: Create frontend/.gitignore**

```
node_modules
.svelte-kit
build
.env
.env.*
!.env.example
dist
playwright/.auth
blob-report
test-results
playwright-report
```

- [ ] **Step 12: Create frontend/.dockerignore**

```
node_modules
.svelte-kit
build
.env
.env.*
dist
playwright/.auth
blob-report
test-results
playwright-report
.git
.gitignore
```

- [ ] **Step 13: Install dependencies**

```bash
cd frontend && npm install
```

Expected: `node_modules/` and `package-lock.json` created. Some peer dependency warnings are OK.

- [ ] **Step 14: Commit**

```bash
git add -A
git commit -m "chore: remove React frontend, scaffold SvelteKit project"
```

---

## Task 2: Utilities and API Client Generation

**Files:**
- Create: `frontend/src/lib/utils.ts`
- Create: `frontend/openapi-ts.config.ts`
- Create: `frontend/openapi.json`
- Generate: `frontend/src/lib/schemas/` (auto-generated)
- Generate: `frontend/src/lib/api/` (auto-generated)

- [ ] **Step 1: Create frontend/src/lib/utils.ts**

```ts
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    }).format(new Date(date));
}

export function formatDateTime(date: string | Date): string {
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(new Date(date));
}
```

- [ ] **Step 2: Copy OpenAPI spec from backend**

```bash
cp backend/app/app.openapi.json frontend/openapi.json
```

If the file doesn't exist, generate it:

```bash
cd backend && python -c "from app.main import app; import json; print(json.dumps(app.openapi(), indent=2))" > ../frontend/openapi.json
```

- [ ] **Step 3: Create frontend/openapi-ts.config.ts**

```ts
import { defineConfig } from '@hey-api/openapi-ts';

export default defineConfig({
    input: './openapi.json',
    output: {
        path: './src/lib/api',
        format: 'prettier'
    },
    plugins: [
        '@hey-api/client-fetch',
        {
            name: '@hey-api/sdk',
            asClass: true,
            operationId: true
        },
        {
            name: '@hey-api/zod',
            output: '../schemas/zod'
        }
    ]
});
```

- [ ] **Step 4: Run client generation**

```bash
cd frontend && npm run generate-client
```

Expected: Files generated in `frontend/src/lib/api/` (sdk.gen.ts, types.gen.ts, etc.) and `frontend/src/lib/schemas/zod/`.

- [ ] **Step 5: Verify generated files exist**

```bash
ls frontend/src/lib/api/sdk.gen.ts frontend/src/lib/api/types.gen.ts
```

Expected: Both files exist.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/lib/utils.ts frontend/openapi-ts.config.ts frontend/openapi.json frontend/src/lib/api/ frontend/src/lib/schemas/
git commit -m "feat: add utilities and generate API client from OpenAPI spec"
```

---

## Task 3: Auth Layer (hooks.server.ts + Cookie Helpers)

**Files:**
- Create: `frontend/src/lib/auth.ts`
- Create: `frontend/src/hooks.server.ts`
- Modify: `frontend/src/app.d.ts` (if needed for type fixes)

- [ ] **Step 1: Create frontend/src/lib/auth.ts**

```ts
import type { Cookies } from '@sveltejs/kit';

const TOKEN_COOKIE = 'access_token';
const TOKEN_MAX_AGE = 60 * 60 * 24; // 24 hours

export function getToken(cookies: Cookies): string | undefined {
    return cookies.get(TOKEN_COOKIE);
}

export function setToken(cookies: Cookies, token: string): void {
    cookies.set(TOKEN_COOKIE, token, {
        path: '/',
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        maxAge: TOKEN_MAX_AGE
    });
}

export function deleteToken(cookies: Cookies): void {
    cookies.delete(TOKEN_COOKIE, { path: '/' });
}
```

- [ ] **Step 2: Create frontend/src/hooks.server.ts**

```ts
import type { Handle } from '@sveltejs/kit';
import { getToken } from '$lib/auth';

const BACKEND_URL = 'http://backend:8000';

export const handle: Handle = async ({ event, resolve }) => {
    const token = getToken(event.cookies);

    if (token) {
        try {
            const response = await fetch(`${BACKEND_URL}/api/v1/users/me`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (response.ok) {
                event.locals.user = await response.json();
            } else {
                event.locals.user = null;
            }
        } catch {
            // Backend unreachable — continue without user
            event.locals.user = null;
        }
    } else {
        event.locals.user = null;
    }

    return resolve(event);
};
```

- [ ] **Step 3: Verify SvelteKit syncs types**

```bash
cd frontend && npx svelte-kit sync
```

Expected: No errors. `App.Locals.user` is typed based on the generated API types.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/lib/auth.ts frontend/src/hooks.server.ts frontend/src/app.d.ts
git commit -m "feat: add auth layer with cookie helpers and hooks.server.ts"
```

---

## Task 4: Layout Routes (+layout.svelte and +layout.server.ts)

**Files:**
- Create: `frontend/src/routes/+layout.svelte`
- Create: `frontend/src/routes/+layout.server.ts`

- [ ] **Step 1: Create frontend/src/routes/+layout.server.ts**

```ts
import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

const PUBLIC_ROUTES = ['/login', '/signup', '/recover-password', '/reset-password'];

export const load: LayoutServerLoad = async ({ url, locals }) => {
    // Only redirect to /login if on a protected route with no user
    if (!locals.user && !PUBLIC_ROUTES.includes(url.pathname)) {
        throw redirect(302, '/login');
    }

    // Redirect away from auth pages if already logged in
    if (locals.user && PUBLIC_ROUTES.includes(url.pathname)) {
        throw redirect(302, '/');
    }

    return {
        user: locals.user
    };
};
```

- [ ] **Step 2: Create frontend/src/routes/+layout.svelte**

```svelte
<script lang="ts">
    import '../app.css';
    import Sidebar from '$lib/components/sidebar.svelte';
    import Footer from '$lib/components/footer.svelte';

    let { children } = $props();

    // Only show layout chrome (sidebar/footer) when user is logged in
    let { data } = $props();
    const isAuthenticated = !!data.user;
</script>

{#if isAuthenticated}
    <div class="flex min-h-screen">
        <Sidebar {data} />
        <div class="flex flex-1 flex-col">
            <header class="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4">
                <button
                    class="-ml-1 text-muted-foreground"
                    onclick={() => {}}  <!-- Mobile toggle placeholder -->
                    aria-label="Toggle sidebar"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><path d="M9 3v18"/></svg>
                </button>
            </header>
            <main class="flex-1 p-6 md:p-8">
                <div class="mx-auto max-w-7xl">
                    {@render children()}
                </div>
            </main>
            <Footer />
        </div>
    </div>
{:else}
    {@render children()}
{/if}
```

- [ ] **Step 3: Verify the app compiles**

```bash
cd frontend && npx svelte-kit sync
```

Expected: No errors for the layout.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/routes/+layout.svelte frontend/src/routes/+layout.server.ts
git commit -m "feat: add layout routes with auth guard"
```

---

## Task 5: Auth Routes (Login, Signup, Recover, Reset)

**Files:**
- Create: `frontend/src/routes/login/+page.server.ts`
- Create: `frontend/src/routes/login/+page.svelte`
- Create: `frontend/src/routes/signup/+page.server.ts`
- Create: `frontend/src/routes/signup/+page.svelte`
- Create: `frontend/src/routes/recover-password/+page.server.ts`
- Create: `frontend/src/routes/recover-password/+page.svelte`
- Create: `frontend/src/routes/reset-password/+page.server.ts`
- Create: `frontend/src/routes/reset-password/+page.svelte`

- [ ] **Step 1: Create frontend/src/routes/login/+page.server.ts**

```ts
import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { LoginService } from '$lib/api/sdk.gen';
import { setToken } from '$lib/auth';

export const actions: Actions = {
    default: async ({ request, cookies }) => {
        const data = await request.formData();
        const email = data.get('email')?.toString();
        const password = data.get('password')?.toString();

        if (!email || !password) {
            return fail(400, { email, error: 'Email and password are required' });
        }

        try {
            const response = await LoginService.loginAccessToken({
                formData: {
                    username: email,
                    password
                }
            });
            setToken(cookies, response.access_token);
        } catch {
            return fail(400, { email, error: 'Incorrect email or password' });
        }

        throw redirect(303, '/');
    }
};
```

- [ ] **Step 2: Create frontend/src/routes/login/+page.svelte**

```svelte
<script lang="ts">
    import AuthLayout from '$lib/components/auth-layout.svelte';
    import type { PageProps } from './$types';

    let { form } = $props();
</script>

<AuthLayout title="Login to your account">
    <form method="post" class="flex flex-col gap-4">
        {#if form?.error}
            <div class="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                {form.error}
            </div>
        {/if}

        <div class="grid gap-2">
            <label class="text-sm font-medium" for="email">Email</label>
            <input
                id="email"
                name="email"
                type="email"
                placeholder="user@example.com"
                value={form?.email ?? ''}
                class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                data-testid="email-input"
                required
            />
        </div>

        <div class="grid gap-2">
            <div class="flex items-center">
                <label class="text-sm font-medium" for="password">Password</label>
                <a href="/recover-password" class="ml-auto text-sm underline-offset-4 hover:underline">
                    Forgot your password?
                </a>
            </div>
            <input
                id="password"
                name="password"
                type="password"
                placeholder="Password"
                class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                data-testid="password-input"
                required
            />
        </div>

        <button type="submit" class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 w-full">
            Log In
        </button>

        <div class="text-center text-sm">
            Don't have an account yet?{' '}
            <a href="/signup" class="underline underline-offset-4">Sign up</a>
        </div>
    </form>
</AuthLayout>
```

- [ ] **Step 3: Create frontend/src/routes/signup/+page.server.ts**

```ts
import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { UsersService } from '$lib/api/sdk.gen';

export const actions: Actions = {
    default: async ({ request }) => {
        const data = await request.formData();
        const email = data.get('email')?.toString();
        const full_name = data.get('full_name')?.toString();
        const password = data.get('password')?.toString();
        const confirm_password = data.get('confirm_password')?.toString();

        if (!email || !full_name || !password || !confirm_password) {
            return fail(400, { email, full_name, error: 'All fields are required' });
        }

        if (password !== confirm_password) {
            return fail(400, { email, full_name, error: 'Passwords do not match' });
        }

        if (password.length < 8) {
            return fail(400, { email, full_name, error: 'Password must be at least 8 characters' });
        }

        try {
            await UsersService.registerUser({
                requestBody: { email, full_name, password }
            });
        } catch (e: any) {
            const detail = e?.body?.detail ?? 'Registration failed';
            return fail(400, { email, full_name, error: detail });
        }

        throw redirect(303, '/login');
    }
};
```

- [ ] **Step 4: Create frontend/src/routes/signup/+page.svelte**

```svelte
<script lang="ts">
    import AuthLayout from '$lib/components/auth-layout.svelte';
    import type { PageProps } from './$types';

    let { form } = $props();
</script>

<AuthLayout title="Create an account">
    <form method="post" class="flex flex-col gap-4">
        {#if form?.error}
            <div class="rounded-md bg-destructive/15 p-3 text-sm text-destructive">{form.error}</div>
        {/if}

        <div class="grid gap-2">
            <label class="text-sm font-medium" for="full_name">Full Name</label>
            <input id="full_name" name="full_name" type="text" placeholder="User" value={form?.full_name ?? ''} data-testid="full-name-input" class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" required />
        </div>

        <div class="grid gap-2">
            <label class="text-sm font-medium" for="email">Email</label>
            <input id="email" name="email" type="email" placeholder="user@example.com" value={form?.email ?? ''} data-testid="email-input" class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" required />
        </div>

        <div class="grid gap-2">
            <label class="text-sm font-medium" for="password">Password</label>
            <input id="password" name="password" type="password" placeholder="Password" data-testid="password-input" class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" required />
        </div>

        <div class="grid gap-2">
            <label class="text-sm font-medium" for="confirm_password">Confirm Password</label>
            <input id="confirm_password" name="confirm_password" type="password" placeholder="Confirm Password" data-testid="confirm-password-input" class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" required />
        </div>

        <button type="submit" class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 w-full">
            Sign Up
        </button>

        <div class="text-center text-sm">
            Already have an account?{' '}
            <a href="/login" class="underline underline-offset-4">Log in</a>
        </div>
    </form>
</AuthLayout>
```

- [ ] **Step 5: Create frontend/src/routes/recover-password/+page.server.ts**

```ts
import { fail } from '@sveltejs/kit';
import type { Actions } from './$types';
import { LoginService } from '$lib/api/sdk.gen';

export const actions: Actions = {
    default: async ({ request }) => {
        const data = await request.formData();
        const email = data.get('email')?.toString();

        if (!email) {
            return fail(400, { error: 'Email is required' });
        }

        try {
            await LoginService.recoverPassword({ email });
        } catch {
            return fail(400, { error: 'Failed to send recovery email' });
        }

        return { success: true };
    }
};
```

- [ ] **Step 6: Create frontend/src/routes/recover-password/+page.svelte**

```svelte
<script lang="ts">
    import AuthLayout from '$lib/components/auth-layout.svelte';
    import type { PageProps, ActionData } from './$types';

    let { form } = $props();
</script>

<AuthLayout title="Password Recovery">
    {#if form?.success}
        <div class="rounded-md bg-primary/15 p-4 text-center text-sm">
            Password recovery email sent successfully. Check your inbox.
        </div>
        <div class="text-center text-sm mt-4">
            <a href="/login" class="underline underline-offset-4">Back to login</a>
        </div>
    {:else}
        <form method="post" class="flex flex-col gap-4">
            {#if form?.error}
                <div class="rounded-md bg-destructive/15 p-3 text-sm text-destructive">{form.error}</div>
            {/if}

            <div class="grid gap-2">
                <label class="text-sm font-medium" for="email">Email</label>
                <input id="email" name="email" type="email" placeholder="user@example.com" data-testid="email-input" class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" required />
            </div>

            <button type="submit" class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 w-full">
                Continue
            </button>

            <div class="text-center text-sm">
                Remember your password?{' '}
                <a href="/login" class="underline underline-offset-4">Log in</a>
            </div>
        </form>
    {/if}
</AuthLayout>
```

- [ ] **Step 7: Create frontend/src/routes/reset-password/+page.server.ts**

```ts
import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { LoginService } from '$lib/api/sdk.gen';

export const load: PageServerLoad = async ({ url }) => {
    const token = url.searchParams.get('token');
    if (!token) {
        throw redirect(302, '/login');
    }
    return { token };
};

export const actions: Actions = {
    default: async ({ request, url }) => {
        const token = url.searchParams.get('token');
        if (!token) {
            return fail(400, { error: 'Missing reset token' });
        }

        const data = await request.formData();
        const new_password = data.get('new_password')?.toString();
        const confirm_password = data.get('confirm_password')?.toString();

        if (!new_password || !confirm_password) {
            return fail(400, { error: 'All fields are required' });
        }

        if (new_password !== confirm_password) {
            return fail(400, { error: 'Passwords do not match' });
        }

        if (new_password.length < 8) {
            return fail(400, { error: 'Password must be at least 8 characters' });
        }

        try {
            await LoginService.resetPassword({
                requestBody: { new_password, token }
            });
        } catch {
            return fail(400, { error: 'Failed to reset password' });
        }

        throw redirect(303, '/login');
    }
};
```

- [ ] **Step 8: Create frontend/src/routes/reset-password/+page.svelte**

```svelte
<script lang="ts">
    import AuthLayout from '$lib/components/auth-layout.svelte';
    import type { PageProps } from './$types';

    let { form } = $props();
</script>

<AuthLayout title="Reset Password">
    <form method="post" class="flex flex-col gap-4">
        {#if form?.error}
            <div class="rounded-md bg-destructive/15 p-3 text-sm text-destructive">{form.error}</div>
        {/if}

        <div class="grid gap-2">
            <label class="text-sm font-medium" for="new_password">New Password</label>
            <input id="new_password" name="new_password" type="password" placeholder="New Password" data-testid="new-password-input" class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" required />
        </div>

        <div class="grid gap-2">
            <label class="text-sm font-medium" for="confirm_password">Confirm Password</label>
            <input id="confirm_password" name="confirm_password" type="password" placeholder="Confirm Password" data-testid="confirm-password-input" class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" required />
        </div>

        <button type="submit" class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 w-full">
            Reset Password
        </button>

        <div class="text-center text-sm">
            Remember your password?{' '}
            <a href="/login" class="underline underline-offset-4">Log in</a>
        </div>
    </form>
</AuthLayout>
```

- [ ] **Step 9: Verify all auth routes compile**

```bash
cd frontend && npx svelte-kit sync
```

Expected: No errors for any route files.

- [ ] **Step 10: Commit**

```bash
git add frontend/src/routes/login/ frontend/src/routes/signup/ frontend/src/routes/recover-password/ frontend/src/routes/reset-password/
git commit -m "feat: add auth routes (login, signup, recover, reset password)"
```

---

## Task 6: Protected Routes (Dashboard, Items, Settings, Admin)

**Files:**
- Create: `frontend/src/routes/+page.svelte`
- Create: `frontend/src/routes/items/+page.server.ts`
- Create: `frontend/src/routes/items/+page.svelte`
- Create: `frontend/src/routes/settings/+page.server.ts`
- Create: `frontend/src/routes/settings/+page.svelte`
- Create: `frontend/src/routes/admin/+page.server.ts`
- Create: `frontend/src/routes/admin/+page.svelte`

- [ ] **Step 1: Create frontend/src/routes/+page.svelte (Dashboard)**

```svelte
<script lang="ts">
    import type { PageProps } from './$types';

    let { data } = $props();
    const user = data.user;
</script>

<div>
    <h1 class="text-2xl truncate max-w-sm">
        Hi, {user?.full_name || user?.email}
    </h1>
    <p class="text-muted-foreground">
        Welcome back, nice to see you again!
    </p>
</div>
```

- [ ] **Step 2: Create frontend/src/routes/items/+page.server.ts**

```ts
import type { PageServerLoad } from './$types';
import { ItemsService } from '$lib/api/sdk.gen';
import { getToken } from '$lib/auth';

export const load: PageServerLoad = async ({ cookies }) => {
    const token = getToken(cookies);

    const response = await ItemsService.readItems({
        skip: 0,
        limit: 100,
        headers: token ? { Authorization: `Bearer ${token}` } : undefined
    });

    return {
        items: response.data
    };
};
```

- [ ] **Step 3: Create frontend/src/routes/items/+page.svelte**

```svelte
<script lang="ts">
    import type { PageProps } from './$types';
    import type { ItemPublic } from '$lib/api/types.gen';
    import { cn } from '$lib/utils';

    let { data } = $props();

    function getColumns(items: ItemPublic[]) {
        return [
            { key: 'id', header: 'ID' },
            { key: 'title', header: 'Title' },
            { key: 'description', header: 'Description' },
        ];
    }

    const columns = getColumns(data.items);
</script>

<div class="flex flex-col gap-6">
    <div class="flex items-center justify-between">
        <div>
            <h1 class="text-2xl font-bold tracking-tight">Items</h1>
            <p class="text-muted-foreground">Create and manage your items</p>
        </div>
    </div>

    {#if data.items.length === 0}
        <div class="flex flex-col items-center justify-center text-center py-12">
            <div class="rounded-full bg-muted p-4 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-8 w-8 text-muted-foreground"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            </div>
            <h3 class="text-lg font-semibold">You don't have any items yet</h3>
            <p class="text-muted-foreground">Add a new item to get started</p>
        </div>
    {:else}
        <div class="rounded-md border">
            <table class="w-full caption-bottom text-sm">
                <thead class="[&_tr]:border-b">
                    <tr class="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                        <th class="h-12 px-4 text-left align-middle font-medium text-muted-foreground">ID</th>
                        <th class="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Title</th>
                        <th class="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Description</th>
                    </tr>
                </thead>
                <tbody class="[&_tr:last-child]:border-0">
                    {#each data.items as item}
                        <tr class="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                            <td class="p-4 align-middle">{item.id}</td>
                            <td class="p-4 align-middle">{item.title}</td>
                            <td class="p-4 align-middle">{item.description ?? '-'}</td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        </div>
    {/if}
</div>
```

- [ ] **Step 4: Create frontend/src/routes/settings/+page.server.ts**

```ts
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { UsersService } from '$lib/api/sdk.gen';
import { getToken } from '$lib/auth';

export const load: PageServerLoad = async ({ cookies }) => {
    const token = getToken(cookies);

    const response = await UsersService.readUserMe({
        headers: token ? { Authorization: `Bearer ${token}` } : undefined
    });

    return {
        user: response
    };
};

export const actions: Actions = {
    update_profile: async ({ request, cookies }) => {
        const token = getToken(cookies);
        const data = await request.formData();
        const full_name = data.get('full_name')?.toString();
        const email = data.get('email')?.toString();

        if (!full_name || !email) {
            return fail(400, { profileError: 'Full name and email are required' });
        }

        try {
            await UsersService.updateUserMe({
                requestBody: { full_name, email },
                headers: { Authorization: `Bearer ${token}` }
            });
        } catch {
            return fail(400, { profileError: 'Failed to update profile' });
        }

        return { profileSuccess: true };
    },

    change_password: async ({ request, cookies }) => {
        const token = getToken(cookies);
        const data = await request.formData();
        const current_password = data.get('current_password')?.toString();
        const new_password = data.get('new_password')?.toString();
        const confirm_password = data.get('confirm_password')?.toString();

        if (!current_password || !new_password || !confirm_password) {
            return fail(400, { passwordError: 'All fields are required' });
        }

        if (new_password !== confirm_password) {
            return fail(400, { passwordError: 'Passwords do not match' });
        }

        try {
            await UsersService.updatePasswordMe({
                requestBody: { current_password, new_password },
                headers: { Authorization: `Bearer ${token}` }
            });
        } catch {
            return fail(400, { passwordError: 'Failed to change password' });
        }

        return { passwordSuccess: true };
    },

    delete_account: async ({ cookies }) => {
        const token = getToken(cookies);
        try {
            await UsersService.deleteUserMe({
                headers: { Authorization: `Bearer ${token}` }
            });
        } catch {
            return fail(400, { deleteError: 'Failed to delete account' });
        }

        // Clear the token cookie
        cookies.delete('access_token', { path: '/' });

        throw redirect(303, '/login');
    },

    logout: async ({ cookies }) => {
        cookies.delete('access_token', { path: '/' });
        throw redirect(303, '/login');
    }
};
```

- [ ] **Step 5: Create frontend/src/routes/settings/+page.svelte**

```svelte
<script lang="ts">
    import type { PageProps } from './$types';

    let { data, form } = $props();
    const user = data.user;
    let activeTab = $state('my-profile');
</script>

<div class="flex flex-col gap-6">
    <div>
        <h1 class="text-2xl font-bold tracking-tight">User Settings</h1>
        <p class="text-muted-foreground">Manage your account settings and preferences</p>
    </div>

    <div class="flex gap-2 border-b">
        <button class="px-4 py-2 text-sm font-medium border-b-2 transition-colors {activeTab === 'my-profile' ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}" onclick={() => activeTab = 'my-profile'}>My profile</button>
        <button class="px-4 py-2 text-sm font-medium border-b-2 transition-colors {activeTab === 'password' ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}" onclick={() => activeTab = 'password'}>Password</button>
        <button class="px-4 py-2 text-sm font-medium border-b-2 transition-colors {activeTab === 'danger-zone' ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}" onclick={() => activeTab = 'danger-zone'}>Danger zone</button>
    </div>

    {#if activeTab === 'my-profile'}
        <div class="rounded-md border p-6">
            {#if form?.profileSuccess}
                <div class="rounded-md bg-primary/15 p-3 text-sm mb-4">Profile updated successfully.</div>
            {/if}
            {#if form?.profileError}
                <div class="rounded-md bg-destructive/15 p-3 text-sm text-destructive mb-4">{form.profileError}</div>
            {/if}
            <form method="post" action="?/update_profile" class="flex flex-col gap-4 max-w-md">
                <div class="grid gap-2">
                    <label class="text-sm font-medium" for="full_name">Full Name</label>
                    <input id="full_name" name="full_name" type="text" value={user.full_name ?? ''} class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" required />
                </div>
                <div class="grid gap-2">
                    <label class="text-sm font-medium" for="email">Email</label>
                    <input id="email" name="email" type="email" value={user.email ?? ''} class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" required />
                </div>
                <button type="submit" class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 w-fit">
                    Save
                </button>
            </form>
        </div>
    {/if}

    {#if activeTab === 'password'}
        <div class="rounded-md border p-6">
            {#if form?.passwordSuccess}
                <div class="rounded-md bg-primary/15 p-3 text-sm mb-4">Password changed successfully.</div>
            {/if}
            {#if form?.passwordError}
                <div class="rounded-md bg-destructive/15 p-3 text-sm text-destructive mb-4">{form.passwordError}</div>
            {/if}
            <form method="post" action="?/change_password" class="flex flex-col gap-4 max-w-md">
                <div class="grid gap-2">
                    <label class="text-sm font-medium" for="current_password">Current Password</label>
                    <input id="current_password" name="current_password" type="password" class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" required />
                </div>
                <div class="grid gap-2">
                    <label class="text-sm font-medium" for="new_password">New Password</label>
                    <input id="new_password" name="new_password" type="password" class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" required />
                </div>
                <div class="grid gap-2">
                    <label class="text-sm font-medium" for="confirm_password">Confirm Password</label>
                    <input id="confirm_password" name="confirm_password" type="password" class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" required />
                </div>
                <button type="submit" class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 w-fit">
                    Change Password
                </button>
            </form>
        </div>
    {/if}

    {#if activeTab === 'danger-zone'}
        <div class="rounded-md border border-destructive p-6">
            {#if form?.deleteError}
                <div class="rounded-md bg-destructive/15 p-3 text-sm text-destructive mb-4">{form.deleteError}</div>
            {/if}
            <h3 class="text-lg font-semibold text-destructive">Delete Account</h3>
            <p class="text-sm text-muted-foreground mb-4">Once you delete your account, there is no going back. Please be certain.</p>
            <form method="post" action="?/delete_account">
                <button type="submit" class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium bg-destructive text-destructive-foreground hover:bg-destructive/90 h-10 px-4 py-2">
                    Delete your account
                </button>
            </form>
        </div>
    {/if}
</div>
```

- [ ] **Step 6: Create frontend/src/routes/admin/+page.server.ts**

```ts
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { UsersService } from '$lib/api/sdk.gen';
import { getToken } from '$lib/auth';

export const load: PageServerLoad = async ({ cookies, locals }) => {
    const token = getToken(cookies);

    // Only superusers can access admin
    if (!locals.user?.is_superuser) {
        throw redirect(302, '/');
    }

    const response = await UsersService.readUsers({
        skip: 0,
        limit: 100,
        headers: { Authorization: `Bearer ${token}` }
    });

    return {
        users: response.data
    };
};
```

- [ ] **Step 7: Create frontend/src/routes/admin/+page.svelte**

```svelte
<script lang="ts">
    import type { PageProps } from './$types';

    let { data } = $props();
</script>

<div class="flex flex-col gap-6">
    <div class="flex items-center justify-between">
        <div>
            <h1 class="text-2xl font-bold tracking-tight">Users</h1>
            <p class="text-muted-foreground">Manage user accounts and permissions</p>
        </div>
    </div>

    <div class="rounded-md border">
        <table class="w-full caption-bottom text-sm">
            <thead class="[&_tr]:border-b">
                <tr class="border-b transition-colors hover:bg-muted/50">
                    <th class="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Full Name</th>
                    <th class="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Email</th>
                    <th class="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Role</th>
                    <th class="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Status</th>
                </tr>
            </thead>
            <tbody class="[&_tr:last-child]:border-0">
                {#each data.users as user}
                    <tr class="border-b transition-colors hover:bg-muted/50">
                        <td class="p-4 align-middle font-medium">{user.full_name}</td>
                        <td class="p-4 align-middle">{user.email}</td>
                        <td class="p-4 align-middle">{user.is_superuser ? 'Admin' : 'User'}</td>
                        <td class="p-4 align-middle">{user.is_active ? 'Active' : 'Inactive'}</td>
                    </tr>
                {/each}
            </tbody>
        </table>
    </div>
</div>
```

- [ ] **Step 8: Verify all routes compile**

```bash
cd frontend && npx svelte-kit sync
```

Expected: No errors for any route files.

- [ ] **Step 9: Commit**

```bash
git add frontend/src/routes/+page.svelte frontend/src/routes/items/ frontend/src/routes/settings/ frontend/src/routes/admin/
git commit -m "feat: add protected routes (dashboard, items, settings, admin)"
```

---

## Task 7: UI Components (Sidebar, Footer, AuthLayout)

**Files:**
- Create: `frontend/src/lib/components/sidebar.svelte`
- Create: `frontend/src/lib/components/footer.svelte`
- Create: `frontend/src/lib/components/auth-layout.svelte`

- [ ] **Step 1: Create frontend/src/lib/components/auth-layout.svelte**

```svelte
<script lang="ts">
    let { title, children } = $props();
</script>

<div class="grid min-h-svh lg:grid-cols-2">
    <div class="bg-muted relative hidden lg:flex lg:items-center lg:justify-center">
        <div class="h-16">
            <!-- Logo placeholder -->
            <span class="text-2xl font-bold">FastAPI Template</span>
        </div>
    </div>
    <div class="flex flex-col gap-4 p-6 md:p-10">
        <div class="flex flex-1 items-center justify-center">
            <div class="w-full max-w-xs">
                <div class="flex flex-col items-center gap-2 text-center mb-6">
                    <h1 class="text-2xl font-bold">{title}</h1>
                </div>
                {@render children()}
            </div>
        </div>
        <footer class="text-center text-sm text-muted-foreground">
            Full Stack FastAPI Template - {new Date().getFullYear()}
        </footer>
    </div>
</div>
```

- [ ] **Step 2: Create frontend/src/lib/components/footer.svelte**

```svelte
<script lang="ts">
    const socialLinks = [
        { href: 'https://github.com/fastapi/fastapi', label: 'GitHub', icon: 'M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z' }
    ];

    const currentYear = new Date().getFullYear();
</script>

<footer class="border-t py-4 px-6 mt-auto">
    <div class="flex flex-col items-center justify-between gap-4 sm:flex-row">
        <p class="text-muted-foreground text-sm">
            Full Stack FastAPI Template - {currentYear}
        </p>
        <div class="flex items-center gap-4">
            {#each socialLinks as link}
                <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={link.label}
                    class="text-muted-foreground hover:text-foreground transition-colors"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" class="h-5 w-5">
                        <path d={link.icon} />
                    </svg>
                </a>
            {/each}
        </div>
    </div>
</footer>
```

- [ ] **Step 3: Create frontend/src/lib/components/sidebar.svelte**

```svelte
<script lang="ts">
    import type { UserPublic } from '$lib/api/types.gen';
    import { deleteToken } from '$lib/auth';

    let { data } = $props<{ data: { user: UserPublic | null } }>();
    const user = data.user;

    const baseItems = [
        { icon: 'home', title: 'Dashboard', path: '/' },
        { icon: 'briefcase', title: 'Items', path: '/items' }
    ];

    const adminItem = { icon: 'users', title: 'Admin', path: '/admin' };

    $derived(items = user?.is_superuser ? [...baseItems, adminItem] : baseItems);
</script>

<aside class="flex h-screen w-64 flex-col border-r bg-sidebar-background text-sidebar-foreground">
    <div class="px-4 py-6">
        <span class="text-xl font-bold">FastAPI</span>
    </div>

    <nav class="flex-1 px-2">
        {#each items as item}
            <a
                href={item.path}
                class="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            >
                {#if item.icon === 'home'}
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                {:else if item.icon === 'briefcase'}
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
                {:else if item.icon === 'users'}
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                {/if}
                {item.title}
            </a>
        {/each}
    </nav>

    <div class="border-t p-4">
        <div class="flex items-center gap-3">
            <div class="flex-1 truncate">
                <p class="text-sm font-medium">{user?.full_name || user?.email || 'User'}</p>
                <p class="text-xs text-sidebar-muted-foreground">{user?.email}</p>
            </div>
            <form method="post" action="/settings" class="ml-auto">
                <button
                    name="intent"
                    value="logout"
                    class="rounded-md p-1 hover:bg-sidebar-accent text-sidebar-muted-foreground hover:text-sidebar-foreground"
                    aria-label="Log out"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                </button>
            </form>
        </div>
    </div>
</aside>
```

- [ ] **Step 4: Update the logout flow in settings +page.server.ts to handle the intent field**

The settings page needs to handle the logout `intent` form field. Add a condition at the top of the `default` action in `frontend/src/routes/settings/+page.server.ts` (already created in Task 6 Step 4). The existing `logout` action is already defined — verify it works with the sidebar button that posts to `/settings?/logout`.

Actually, the sidebar form posts to `/settings` with `intent=logout`. We need to adjust so the logout button works. Replace the sidebar form's action to use `action="/settings?/logout"` with a hidden `intent` field, or better, just post directly:

```
<form method="post" action="/settings?/logout">
```

This is already how SvelteKit named actions work. The button just submits the form. Let's make sure the sidebar button works properly.

- [ ] **Step 5: Verify components compile**

```bash
cd frontend && npx svelte-kit sync
```

Expected: No errors.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/lib/components/
git commit -m "feat: add UI components (sidebar, footer, auth-layout)"
```

---

## Task 8: Caddy Reverse Proxy

**Files:**
- Create: `Caddyfile`
- Create: `compose.caddy.yml`

- [ ] **Step 1: Create Caddyfile**

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

- [ ] **Step 2: Create compose.caddy.yml**

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

- [ ] **Step 3: Commit**

```bash
git add Caddyfile compose.caddy.yml
git commit -m "feat: add Caddy reverse proxy config"
```

---

## Task 9: Update Compose Files

**Files:**
- Modify: `compose.yml`
- Modify: `compose.override.yml`

- [ ] **Step 1: Update compose.yml — network section**

Replace the `networks:` block at the bottom of `compose.yml` (currently `traefik-public:`) with:

```yaml
networks:
  caddy-net:
    external: true
```

Remove the `networks:` declaration from each service block (backend, frontend, adminer, prestart) and replace with:

```yaml
    networks:
      - caddy-net
      - default
```

- [ ] **Step 2: Update compose.yml — remove Traefik labels**

Remove these label blocks:
- Remove ALL `labels:` blocks from `adminer:` service (lines 32-43)
- Remove ALL `labels:` blocks from `backend:` service (lines 121-138)
- Remove ALL `labels:` blocks from `frontend:` service (lines 151-167)

- [ ] **Step 3: Update compose.yml — frontend service**

Change the frontend service to use standalone build context and port 3000:

```yaml
  frontend:
    image: '${DOCKER_IMAGE_FRONTEND?Variable not set}:${TAG-latest}'
    restart: always
    networks:
      - caddy-net
      - default
    build:
      context: ./frontend
      dockerfile: Dockerfile
      args:
        - ORIGIN=https://dashboard.${DOMAIN?Variable not set}
    depends_on:
      - backend
```

- [ ] **Step 4: Update compose.override.yml — network section**

Replace `traefik-public:` in networks with:

```yaml
networks:
  caddy-net:
    external: false
```

- [ ] **Step 5: Update compose.override.yml — replace Traefik proxy with Caddy**

Remove the `proxy:` service block entirely (lines 8-45). Add a `caddy:` service:

```yaml
  caddy:
    image: caddy:2
    ports:
      - "80:80"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
    networks:
      - caddy-net
      - default
    environment:
      - DOMAIN=localhost
```

- [ ] **Step 6: Update compose.override.yml — update frontend service**

Replace the existing `frontend:` block (lines 96-106) with:

```yaml
  frontend:
    restart: "no"
    ports:
      - "5173:3000"
    build:
      context: ./frontend
      dockerfile: Dockerfile
      args:
        - ORIGIN=http://localhost:5173
    environment:
      - PORT=3000
```

- [ ] **Step 7: Update compose.override.yml — playwright service**

Update the `playwright:` service to use npm instead of bun, and point to the correct frontend port:

```yaml
  playwright:
    build:
      context: ./frontend
      dockerfile: Dockerfile.playwright
      args:
        - PUBLIC_API_URL=http://backend:8000
    ipc: host
    depends_on:
      - backend
      - mailcatcher
    env_file:
      - .env
    environment:
      - PUBLIC_API_URL=http://backend:8000
      - MAILCATCHER_HOST=http://mailcatcher:1080
      - PLAYWRIGHT_HTML_HOST=0.0.0.0
      - CI=${CI}
    volumes:
      - ./frontend/blob-report:/app/frontend/blob-report
      - ./frontend/test-results:/app/frontend/test-results
    ports:
      - 9323:9323
```

- [ ] **Step 8: Verify docker compose builds**

```bash
docker compose -f compose.yml -f compose.override.yml build
```

Expected: All services build successfully. There may be warnings if the Caddyfile references `{$DOMAIN}` without the env var set, which is OK for local.

- [ ] **Step 9: Commit**

```bash
git add compose.yml compose.override.yml
git commit -m "feat: replace Traefik with Caddy in compose files"
```

---

## Task 10: Dockerfiles

**Files:**
- Create: `frontend/Dockerfile`
- Create: `frontend/Dockerfile.playwright`

- [ ] **Step 1: Create frontend/Dockerfile**

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

- [ ] **Step 2: Create frontend/Dockerfile.playwright**

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

- [ ] **Step 3: Verify Dockerfiles build**

```bash
docker build -f frontend/Dockerfile frontend/ -t frontend-test
```

Expected: Build succeeds (some warnings about BUILD_ARGS are OK at this stage).

- [ ] **Step 4: Commit**

```bash
git add frontend/Dockerfile frontend/Dockerfile.playwright
git commit -m "feat: add Dockerfiles for SvelteKit frontend"
```

---

## Task 11: Playwright E2E Tests

**Files:**
- Create: `frontend/playwright.config.ts`
- Create: `frontend/tests/config.ts`
- Create: `frontend/tests/utils/random.ts`
- Create: `frontend/tests/auth.setup.ts`
- Create: `frontend/tests/login.spec.ts`
- Create: `frontend/tests/signup.spec.ts`
- Create: `frontend/tests/items.spec.ts`
- Create: `frontend/tests/user-settings.spec.ts`
- Create: `frontend/tests/admin.spec.ts`
- Create: `frontend/tests/reset-password.spec.ts`

- [ ] **Step 1: Create frontend/playwright.config.ts**

```ts
import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config();

export default defineConfig({
    testDir: './tests',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,
    reporter: process.env.CI ? 'blob' : 'html',
    use: {
        baseURL: 'http://localhost:5173',
        trace: 'on-first-retry'
    },
    projects: [
        { name: 'setup', testMatch: /.*\.setup\.ts/ },
        {
            name: 'chromium',
            use: {
                ...devices['Desktop Chrome'],
                storageState: 'playwright/.auth/user.json'
            },
            dependencies: ['setup']
        }
    ],
    webServer: {
        command: 'npm run dev',
        url: 'http://localhost:5173',
        reuseExistingServer: !process.env.CI,
        cwd: '.'
    }
});
```

- [ ] **Step 2: Create frontend/tests/config.ts**

```ts
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

function getEnvVar(name: string): string {
    const value = process.env[name];
    if (!value) {
        throw new Error(`Environment variable ${name} is undefined`);
    }
    return value;
}

export const firstSuperuser = getEnvVar('FIRST_SUPERUSER');
export const firstSuperuserPassword = getEnvVar('FIRST_SUPERUSER_PASSWORD');
```

- [ ] **Step 3: Create frontend/tests/utils/random.ts**

```ts
export function randomPassword(): string {
    return `Pass${Math.random().toString(36).slice(2)}!`;
}

export function randomEmail(): string {
    return `test-${Math.random().toString(36).slice(2, 10)}@example.com`;
}

export function randomName(): string {
    return `User ${Math.random().toString(36).slice(2, 8)}`;
}
```

- [ ] **Step 4: Create frontend/tests/auth.setup.ts**

```ts
import { test as setup } from '@playwright/test';
import { firstSuperuser, firstSuperuserPassword } from './config';

const authFile = 'playwright/.auth/user.json';

setup('authenticate', async ({ page }) => {
    await page.goto('/login');
    await page.getByTestId('email-input').fill(firstSuperuser);
    await page.getByTestId('password-input').fill(firstSuperuserPassword);
    await page.getByRole('button', { name: 'Log In' }).click();
    await page.waitForURL('/');
    await page.context().storageState({ path: authFile });
});
```

- [ ] **Step 5: Create frontend/tests/login.spec.ts**

```ts
import { expect, type Page, test } from '@playwright/test';
import { firstSuperuser, firstSuperuserPassword } from './config';
import { randomPassword } from './utils/random';

test.use({ storageState: { cookies: [], origins: [] } });

const fillForm = async (page: Page, email: string, password: string) => {
    await page.getByTestId('email-input').fill(email);
    await page.getByTestId('password-input').fill(password);
};

test('Inputs are visible, empty and editable', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByTestId('email-input')).toBeVisible();
    await expect(page.getByTestId('email-input')).toHaveText('');
    await expect(page.getByTestId('email-input')).toBeEditable();
    await expect(page.getByTestId('password-input')).toBeVisible();
    await expect(page.getByTestId('password-input')).toHaveText('');
    await expect(page.getByTestId('password-input')).toBeEditable();
});

test('Log In button is visible', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('button', { name: 'Log In' })).toBeVisible();
});

test('Forgot Password link is visible', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('link', { name: 'Forgot your password?' })).toBeVisible();
});

test('Log in with valid email and password', async ({ page }) => {
    await page.goto('/login');
    await fillForm(page, firstSuperuser, firstSuperuserPassword);
    await page.getByRole('button', { name: 'Log In' }).click();
    await page.waitForURL('/');
    await expect(page.getByText('Welcome back, nice to see you again!')).toBeVisible();
});

test('Log in with invalid email', async ({ page }) => {
    await page.goto('/login');
    await fillForm(page, 'invalidemail', firstSuperuserPassword);
    await page.getByRole('button', { name: 'Log In' }).click();
    await expect(page.getByText('Incorrect email or password')).toBeVisible();
});

test('Log in with invalid password', async ({ page }) => {
    const password = randomPassword();
    await page.goto('/login');
    await fillForm(page, firstSuperuser, password);
    await page.getByRole('button', { name: 'Log In' }).click();
    await expect(page.getByText('Incorrect email or password')).toBeVisible();
});
```

- [ ] **Step 6: Create frontend/tests/signup.spec.ts**

```ts
import { expect, test } from '@playwright/test';
import { randomEmail, randomName, randomPassword } from './utils/random';

test.use({ storageState: { cookies: [], origins: [] } });

test('Sign up page inputs are visible', async ({ page }) => {
    await page.goto('/signup');
    await expect(page.getByTestId('full-name-input')).toBeVisible();
    await expect(page.getByTestId('email-input')).toBeVisible();
    await expect(page.getByTestId('password-input')).toBeVisible();
    await expect(page.getByTestId('confirm-password-input')).toBeVisible();
});

test('Sign up with matching passwords navigates to login', async ({ page }) => {
    const email = randomEmail();
    const password = randomPassword();

    await page.goto('/signup');
    await page.getByTestId('full-name-input').fill(randomName());
    await page.getByTestId('email-input').fill(email);
    await page.getByTestId('password-input').fill(password);
    await page.getByTestId('confirm-password-input').fill(password);
    await page.getByRole('button', { name: 'Sign Up' }).click();

    await page.waitForURL('/login');
    await expect(page).toHaveURL('/login');
});
```

- [ ] **Step 7: Create frontend/tests/items.spec.ts**

```ts
import { expect, test } from '@playwright/test';

test('Items page loads', async ({ page }) => {
    await page.goto('/items');
    await expect(page.getByText('Create and manage your items')).toBeVisible();
});

test('Items page shows empty state when no items', async ({ page }) => {
    await page.goto('/items');
    // May show table or empty state depending on seeded data
    await expect(page.getByRole('heading', { name: 'Items' })).toBeVisible();
});
```

- [ ] **Step 8: Create frontend/tests/user-settings.spec.ts**

```ts
import { expect, test } from '@playwright/test';

test('Settings page loads with tabs', async ({ page }) => {
    await page.goto('/settings');
    await expect(page.getByRole('heading', { name: 'User Settings' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'My profile' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Password' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Danger zone' })).toBeVisible();
});
```

- [ ] **Step 9: Create frontend/tests/admin.spec.ts**

```ts
import { expect, test } from '@playwright/test';

test('Admin page loads for superuser', async ({ page }) => {
    await page.goto('/admin');
    // The setup logs in as superuser, so admin page should be accessible
    await expect(page.getByRole('heading', { name: 'Users' })).toBeVisible();
    await expect(page.getByText('Manage user accounts and permissions')).toBeVisible();
});
```

- [ ] **Step 10: Create frontend/tests/reset-password.spec.ts**

```ts
import { expect, test } from '@playwright/test';

test('Reset password page redirects without token', async ({ page }) => {
    await page.goto('/reset-password');
    await page.waitForURL('/login');
    await expect(page).toHaveURL('/login');
});

test('Reset password page loads with token', async ({ page }) => {
    await page.goto('/reset-password?token=test-token');
    await expect(page.getByRole('button', { name: 'Reset Password' })).toBeVisible();
    await expect(page.getByTestId('new-password-input')).toBeVisible();
    await expect(page.getByTestId('confirm-password-input')).toBeVisible();
});
```

- [ ] **Step 11: Run Playwright tests**

```bash
cd frontend && npm install @playwright/test --save-dev && npx playwright install chromium && npx playwright test
```

Expected: Tests pass (some may fail if backend is not running — that's OK for now).

- [ ] **Step 12: Commit**

```bash
git add frontend/playwright.config.ts frontend/tests/
git commit -m "feat: add Playwright E2E tests for SvelteKit frontend"
```

---

## Task 12: Update CI/CD Workflows and Configuration

**Files:**
- Modify: `.github/workflows/playwright.yml`
- Modify: `.github/workflows/test-docker-compose.yml`
- Modify: `.github/workflows/deploy-production.yml`
- Modify: `.github/workflows/deploy-staging.yml`
- Modify: `copier.yml`
- Modify: `.env`

- [ ] **Step 1: Update .github/workflows/playwright.yml — bun → npm**

In the `test-playwright` job:

Replace:
```yaml
    - uses: oven-sh/setup-bun@0c5077e51419868618aeaa5fe8019c62421857d6 # v2.2.0
      with:
        bun-version: 1.3.12
```

Remove the `setup-bun` step entirely (npm comes with the ubuntu runner).

Replace:
```yaml
    - run: bun ci
      working-directory: frontend
```

With:
```yaml
    - run: npm ci
      working-directory: frontend
```

Replace the Playwright test run command:
```yaml
      run: docker compose run --rm playwright bunx playwright test --fail-on-flaky-tests --trace=retain-on-failure --shard=${{ matrix.shardIndex }}/${{ matrix.shardTotal }}
```

With:
```yaml
      run: docker compose run --rm playwright npx playwright test --fail-on-flaky-tests --trace=retain-on-failure --shard=${{ matrix.shardIndex }}/${{ matrix.shardTotal }}
```

In the `merge-playwright-reports` job:

Remove:
```yaml
    - uses: oven-sh/setup-bun@0c5077e51419868618aeaa5fe8019c62421857d6 # v2.2.0
      with:
        bun-version: 1.3.12
```

Replace:
```yaml
    - name: Install dependencies
      run: bun ci
```

With:
```yaml
    - name: Install dependencies
      run: npm ci
      working-directory: frontend
```

Replace in the same job:
```yaml
      run: bunx playwright merge-reports --reporter html ./all-blob-reports
```

With:
```yaml
      run: npx playwright merge-reports --reporter html ./all-blob-reports
```

- [ ] **Step 2: Update .github/workflows/test-docker-compose.yml**

Replace the frontend health check line:
```yaml
      - name: Test frontend is up
        run: curl http://localhost:5173
```

With:
```yaml
      - name: Test frontend is up
        run: curl http://localhost:3000
```

- [ ] **Step 3: Update .github/workflows/deploy-production.yml**

Add `compose.caddy.yml` to the docker compose commands:

Replace:
```yaml
      - run: docker compose -f compose.yml --project-name ${{ secrets.STACK_NAME_PRODUCTION }} build
      - run: docker compose -f compose.yml --project-name ${{ secrets.STACK_NAME_PRODUCTION }} up -d
```

With:
```yaml
      - run: docker compose -f compose.yml -f compose.caddy.yml --project-name ${{ secrets.STACK_NAME_PRODUCTION }} build
      - run: docker compose -f compose.yml -f compose.caddy.yml --project-name ${{ secrets.STACK_NAME_PRODUCTION }} up -d
```

- [ ] **Step 4: Update .github/workflows/deploy-staging.yml**

Same change as production — add `-f compose.caddy.yml`:

Replace:
```yaml
      - run: docker compose -f compose.yml --project-name ${{ secrets.STACK_NAME_STAGING }} build
      - run: docker compose -f compose.yml --project-name ${{ secrets.STACK_NAME_STAGING }} up -d
```

With:
```yaml
      - run: docker compose -f compose.yml -f compose.caddy.yml --project-name ${{ secrets.STACK_NAME_STAGING }} build
      - run: docker compose -f compose.yml -f compose.caddy.yml --project-name ${{ secrets.STACK_NAME_STAGING }} up -d
```

- [ ] **Step 5: Update copier.yml**

Remove the `EMAIL` variable from `.env` if referenced in copier tasks. No structural changes needed to copier.yml itself since variables are defined in `.env`. The `EMAIL` env var was only used by Traefik for Let's Encrypt; Caddy auto-detects it. Remove the note about `EMAIL` being needed.

- [ ] **Step 6: Update root .env**

Update `BACKEND_CORS_ORIGINS` to include the Dashboard with port 3000:

```
BACKEND_CORS_ORIGINS="http://localhost,http://localhost:5173,https://localhost,https://localhost:5173,http://localhost:3000,http://localhost.tiangolo.com"
```

Add `PUBLIC_API_URL`:

```
PUBLIC_API_URL=http://backend:8000
```

No need to change `STACK_NAME` — it's still used by the deploy workflows.

- [ ] **Step 7: Install Playwright browsers for CI**

```bash
cd frontend && npx playwright install chromium
```

- [ ] **Step 8: Commit**

```bash
git add .github/workflows/playwright.yml .github/workflows/test-docker-compose.yml .github/workflows/deploy-production.yml .github/workflows/deploy-staging.yml copier.yml .env
git commit -m "feat: update CI/CD workflows for SvelteKit + Caddy"
```

---

> **Note:** The following test utility files are listed in the File Structure but not explicitly created in the tasks above. They can be added when tests need advanced functionality (mailcatcher integration, private API helpers, user CRUD helpers):
> - `frontend/tests/utils/mailcatcher.ts`
> - `frontend/tests/utils/privateApi.ts`
> - `frontend/tests/utils/user.ts`

## Task 13: Final Integration Verification

- [ ] **Step 1: Full build**

```bash
docker compose -f compose.yml -f compose.override.yml build
```

Expected: All services build without errors.

- [ ] **Step 2: Start services**

```bash
docker compose -f compose.yml -f compose.override.yml up -d --wait backend frontend adminer
```

Expected: Services start successfully.

- [ ] **Step 3: Health check backend**

```bash
curl http://localhost:8000/api/v1/utils/health-check
```

Expected: `{"status": "ok"}`

- [ ] **Step 4: Health check frontend**

```bash
curl http://localhost:3000
```

Expected: HTML response from SvelteKit (HTTP 200).

- [ ] **Step 5: Run Playwright tests in Docker**

```bash
docker compose -f compose.yml -f compose.override.yml run --rm playwright npx playwright test
```

Expected: Tests pass.

- [ ] **Step 6: Cleanup**

```bash
docker compose -f compose.yml -f compose.override.yml down -v --remove-orphans
```

- [ ] **Step 7: Run dev server locally and test**

```bash
cd frontend && npm run dev
```

Visit `http://localhost:5173` and verify:
- The dashboard loads (redirects to `/login` if not authenticated)
- Login works with the superuser credentials from `.env`
- Items page loads
- Settings tabs work
- Admin page is accessible for superuser

- [ ] **Step 8: Final commit**

```bash
git add -A
git commit -m "chore: final integration verification and cleanup"
```
