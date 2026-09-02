<script lang="ts">
	import AdminLayout from '$lib/components/AdminLayout.svelte';

	let { children } = $props();
</script>

<AdminLayout>
	{@render children()}
</AdminLayout>
