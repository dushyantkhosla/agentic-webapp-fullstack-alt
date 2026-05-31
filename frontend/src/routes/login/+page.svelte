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
