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
