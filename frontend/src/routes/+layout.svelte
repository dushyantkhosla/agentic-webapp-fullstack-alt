<script lang="ts">
    import '../app.css';
    import Sidebar from '$lib/components/sidebar.svelte';
    import Footer from '$lib/components/footer.svelte';

    let { children, data } = $props();

    const isAuthenticated = $derived(!!data.user);
</script>

{#if isAuthenticated}
    <div class="flex min-h-screen">
        <Sidebar {data} />
        <div class="flex flex-1 flex-col">
            <header class="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4">
                <button
                    class="-ml-1 text-muted-foreground"
                    onclick={() => {}}
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
