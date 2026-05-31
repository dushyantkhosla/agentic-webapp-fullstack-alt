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
