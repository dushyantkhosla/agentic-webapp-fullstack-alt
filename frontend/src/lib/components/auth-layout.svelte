<script lang="ts">
    import type { Snippet } from 'svelte';

    let { title, children }: { title: string; children: Snippet } = $props();
</script>

<div class="grid min-h-svh lg:grid-cols-2">
    <div class="bg-muted relative hidden lg:flex lg:items-center lg:justify-center">
        <div class="h-16">
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
