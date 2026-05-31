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
