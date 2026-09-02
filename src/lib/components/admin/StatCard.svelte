<script lang="ts">
	import { CalendarCheck, CircleDollarSign, ShoppingBag, Users } from 'lucide-svelte';
	import type { AdminStat } from '$lib/types/admin';

	let { stat }: { stat: AdminStat } = $props();
</script>

<article class="card bg-base-100 shadow-sm border-none rounded-none">
	<div class="card-body gap-4 p-5">
		<div class="flex items-start justify-between gap-4">
			<p class="text-sm font-medium text-base-content/60">{stat.label}</p>
			{#if stat.icon === 'revenue'}
				<CircleDollarSign size={22} class="text-primary shrink-0" strokeWidth={1.8} />
			{:else if stat.icon === 'sales'}
				<ShoppingBag size={22} class="text-primary shrink-0" strokeWidth={1.8} />
			{:else if stat.icon === 'users'}
				<Users size={22} class="text-primary shrink-0" strokeWidth={1.8} />
			{:else}
				<CalendarCheck size={22} class="text-primary shrink-0" strokeWidth={1.8} />
			{/if}
		</div>
		<div>
			<p class="text-2xl font-bold tracking-tight">{stat.value}</p>
			<p class="mt-1 text-sm text-base-content/55">{stat.detail}</p>
		</div>
	</div>
</article>
