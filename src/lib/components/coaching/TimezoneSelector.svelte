<script lang="ts">
	import { Check, Search, X } from 'lucide-svelte';
	import { getTimezoneLabel, TIMEZONE_OPTIONS } from '$lib/coaching/timezone';

	let { value = $bindable('America/Port-au-Prince'), open = $bindable(false) }: { value?: string; open?: boolean } = $props();
	let search = $state('');
	let filtered = $derived(TIMEZONE_OPTIONS.filter((option) => option.label.toLowerCase().includes(search.toLowerCase())));

	function choose(timezone: string) {
		value = timezone;
		open = false;
		search = '';
	}
</script>

{#if !open}
	<div class="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-base-300 bg-base-200/50 p-4">
		<div><p class="text-xs text-base-content/50">Fizo orè</p><p class="font-medium">{getTimezoneLabel(value)}</p></div>
		<button type="button" class="btn btn-outline btn-sm min-h-10" onclick={() => (open = true)}>Modifye</button>
	</div>
{:else}
	<div class="rounded-lg border border-base-300 bg-base-100 p-3">
		<div class="relative mb-2">
			<Search class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" size={17} />
			<input class="input input-bordered w-full pl-10 pr-10" type="search" placeholder="Chèche yon vil…" bind:value={search} />
			<button class="btn btn-ghost btn-square btn-sm absolute right-1 top-1/2 -translate-y-1/2" type="button" aria-label="Fèmen" onclick={() => (open = false)}><X size={17} /></button>
		</div>
		<ul class="menu max-h-56 w-full flex-nowrap overflow-y-auto p-0">
			{#each filtered as option}
				<li><button type="button" class="min-h-11" onclick={() => choose(option.value)}>{option.label}{#if value === option.value}<Check class="ml-auto text-primary" size={17} />{/if}</button></li>
			{:else}<li class="p-3 text-sm text-base-content/55">Okenn rezilta.</li>{/each}
		</ul>
	</div>
{/if}
