<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { onMount } from 'svelte';

	onMount(() => {
		const lang = page.url.searchParams.get('lang');
		const target = lang ? `/admin/whatsapp?lang=${lang}` : '/admin/whatsapp';
		goto(target, { replaceState: true });
	});
</script>

<div class="grid min-h-[50vh] place-items-center p-6 text-center text-base-content/60">
	<div class="loading loading-spinner loading-lg text-primary"></div>
</div>
