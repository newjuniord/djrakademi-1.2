<script lang="ts">
	import { onMount } from 'svelte';
	import { Search, Loader2 } from 'lucide-svelte';
	import BookingTable from '$lib/components/coaching/BookingTable.svelte';
	import type { Booking, BookingStatus, CoachingService } from '$lib/types/coaching';
	import { getAdminBookings, setAdminBookingStatus } from '$lib/admin/admin-client';
	import { getCoachingServices, getCoachingSettings } from '$lib/services/coaching';

	let bookings = $state<Booking[]>([]);
	let services = $state<CoachingService[]>([]);
	let coachTimezone = $state('America/Port-au-Prince');
	let loading = $state(true);

	onMount(async () => {
		try {
			const [bRes, sRes, setRes] = await Promise.all([
				getAdminBookings(),
				getCoachingServices(),
				getCoachingSettings()
			]);
			bookings = bRes;
			services = sRes;
			if (setRes?.timezone) coachTimezone = setRes.timezone;
		} finally {
			loading = false;
		}
	});

	let filter = $state<BookingStatus | 'all'>('all');
	let search = $state('');
	let visible = $derived(
		bookings.filter(
			(item) =>
				(filter === 'all' || item.status === filter) &&
				`${item.customerName} ${item.customerEmail}`.toLowerCase().includes(search.toLowerCase())
		)
	);

	import { toast } from '$lib/toast.svelte';

	async function updateStatus(id: string, status: BookingStatus) {
		if (status !== 'completed' && status !== 'cancelled') return;
		try {
			const updated = await setAdminBookingStatus(id, status);
			bookings = bookings.map((item) => item.id === id ? updated : item);
			toast.success('Statut de la réservation mis à jour avec succès.');
		} catch (e) {
			console.error('Failed to update booking status:', e);
			toast.error(e instanceof Error ? e.message : 'Impossible de modifier le statut de la réservation.');
		}
	}
</script>

<svelte:head><title>Réservations coaching · Administration</title></svelte:head>
<div class="space-y-6">
	<div>
		<h2 class="text-2xl font-bold">Réservations</h2>
		<p class="mt-1 text-sm text-base-content/55">Toutes les heures sont affichées selon l’heure locale du coach.</p>
	</div>
	<div class="card border border-base-300 bg-base-100 shadow-none">
		<div class="flex flex-col gap-3 border-b border-base-300 p-4 sm:flex-row">
			<label class="input input-bordered flex flex-1 items-center gap-2">
				<Search size={17} />
				<input class="grow" type="search" placeholder="Rechercher un client…" bind:value={search} />
			</label>
			<select class="select select-bordered" bind:value={filter}>
				<option value="all">Tous les statuts</option>
				<option value="pending_payment">Paiement en attente</option>
				<option value="confirmed">Confirmées</option>
				<option value="completed">Terminées</option>
				<option value="cancelled">Annulées</option>
				<option value="expired">Expirées</option>
			</select>
		</div>
		{#if loading}
			<div class="p-12 text-center text-base-content/50 space-y-3">
				<Loader2 size={32} class="mx-auto animate-spin text-primary" />
				<p class="text-xs font-semibold">Chargement des réservations...</p>
			</div>
		{:else}
			<BookingTable bookings={visible} {services} {coachTimezone} onStatusChange={updateStatus} />
		{/if}
	</div>
</div>
