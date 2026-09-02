<script lang="ts">
	import { ArrowRight, CalendarDays, Clock } from 'lucide-svelte';
	import type { UpcomingBooking } from '$lib/types/admin';

	let { bookings }: { bookings: UpcomingBooking[] } = $props();
</script>

<section class="bg-base-100 shadow-sm rounded-none border-none overflow-hidden">
	<div class="card-body gap-0 p-6">
		<h2 class="mb-2 text-base font-semibold">Prochains coachings</h2>
		<ul class="divide-y divide-base-200">
			{#each bookings as booking}
				<li class="py-4 first:pt-2">
					<div class="flex items-start justify-between gap-3">
						<div class="min-w-0">
							<p class="truncate font-medium">{booking.client}</p>
							<p class="truncate text-sm text-base-content/55">{booking.coaching}</p>
						</div>
						<div class="shrink-0 text-right text-xs text-base-content/60">
							<p class="flex items-center justify-end gap-1"><CalendarDays size={14} /> {booking.date}</p>
							<p class="mt-1 flex items-center justify-end gap-1"><Clock size={14} /> {booking.time}</p>
						</div>
					</div>
				</li>
			{/each}
		</ul>
		<a class="btn btn-ghost bg-base-200/60 hover:bg-base-200 border-none rounded-none mt-2 min-h-11 w-full text-xs font-semibold" href="/admin/coaching">
			Voir les réservations <ArrowRight size={16} />
		</a>
	</div>
</section>
