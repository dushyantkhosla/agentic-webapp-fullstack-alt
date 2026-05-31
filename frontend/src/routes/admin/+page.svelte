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
