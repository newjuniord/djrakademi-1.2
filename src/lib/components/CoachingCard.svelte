<script lang="ts">
	import type { CoachingService } from '$lib/types/coaching';
	import { ArrowRight, Clock, CalendarCheck } from 'lucide-svelte';

	let {
		coaching,
		onSelect
	}: {
		coaching: CoachingService;
		onSelect?: (coaching: CoachingService) => void;
	} = $props();
</script>

<div class="card bg-base-100 shadow-sm border border-base-200/80 rounded-none p-6 hover:shadow-md transition-shadow flex flex-col justify-between h-full group space-y-5">
	<div class="space-y-3">
		<!-- Header Icon & Duration Badge -->
		<div class="flex items-center justify-between gap-3">
			<div class="size-10 bg-primary/10 text-primary grid place-items-center rounded-none font-bold">
				<CalendarCheck size={20} />
			</div>
			<div class="inline-flex items-center gap-1.5 px-3 py-1 bg-base-200/60 text-base-content/80 text-xs font-semibold rounded-none">
				<Clock size={13} class="text-base-content/50" />
				<span>{coaching.durationMinutes} minutes</span>
			</div>
		</div>

		<!-- Title & Description -->
		<div>
			<h3 class="font-bold text-lg text-base-content group-hover:text-primary transition-colors">
				{coaching.title}
			</h3>
			<p class="text-xs text-base-content/65 leading-relaxed mt-1.5 line-clamp-3">
				{coaching.description}
			</p>
		</div>
	</div>

	<div class="space-y-4 pt-4 border-t border-base-200/60">
		<!-- Price Display -->
		<div class="flex items-baseline justify-between">
			<span class="text-xs font-semibold text-base-content/60">Prix sesyon an</span>
			{#if coaching.isFree || coaching.price === 0}
				<span class="text-lg font-extrabold text-success">Gratis</span>
			{:else}
				<span class="text-xl font-extrabold text-base-content">
					{coaching.price.toLocaleString('fr-FR')} <span class="text-sm font-semibold text-base-content/60">{coaching.currency}</span>
				</span>
			{/if}
		</div>

		<!-- Action Button -->
		{#if onSelect}
			<button
				type="button"
				class="btn btn-outline border-base-300 w-full rounded-none btn-sm text-xs font-bold gap-2 group-hover:bg-black group-hover:text-white group-hover:border-black transition-all"
				onclick={() => onSelect?.(coaching)}
			>
				<span>Gade dat ki disponib</span>
				<ArrowRight size={14} />
			</button>
		{:else}
			<a
				href="#coaching"
				class="btn btn-outline border-base-300 w-full rounded-none btn-sm text-xs font-bold gap-2 group-hover:bg-black group-hover:text-white group-hover:border-black transition-all"
			>
				<span>Gade dat ki disponib</span>
				<ArrowRight size={14} />
			</a>
		{/if}
	</div>
</div>
