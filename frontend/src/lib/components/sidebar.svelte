<script lang="ts">
    import type { UserPublic } from '$lib/api/types.gen';

    let { data }: { data: { user: UserPublic | null } } = $props();
    const user = data.user;

    const baseItems = [
        { icon: 'home', title: 'Dashboard', path: '/' },
        { icon: 'briefcase', title: 'Items', path: '/items' }
    ];

    const adminItem = { icon: 'users', title: 'Admin', path: '/admin' };

    const items = $derived(user?.is_superuser ? [...baseItems, adminItem] : baseItems);
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
            <form method="post" action="/settings?/logout" class="ml-auto">
                <button
                    class="rounded-md p-1 hover:bg-sidebar-accent text-sidebar-muted-foreground hover:text-sidebar-foreground"
                    aria-label="Log out"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                </button>
            </form>
        </div>
    </div>
</aside>
