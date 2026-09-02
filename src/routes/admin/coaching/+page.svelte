<script lang="ts">
	import { onMount } from 'svelte';
	import {
		ArrowRight,
		CalendarClock,
		CalendarDays,
		ChevronRight,
		CircleDollarSign,
		Clock3,
		ExternalLink,
		MessageCircle,
		Plus,
		Settings2,
		Users,
		Loader2
	} from 'lucide-svelte';
	import BookingStatusBadge from '$lib/components/coaching/BookingStatusBadge.svelte';
	import { formatDateTimeInTimezone, getTimezoneLabel } from '$lib/coaching/timezone';
	import { whatsappLink } from '$lib/coaching/validation';
	import type { CoachingService, CoachingSettings, CoachingSlot, Booking } from '$lib/types/coaching';
	import {
		getCoachingServices,
		getCoachingSettings,
		getCoachingSlots,
		DEFAULT_SETTINGS
	} from '$lib/services/coaching';
	import { getAdminBookings } from '$lib/admin/admin-client';

	let services = $state<CoachingService[]>([]);
	let settings = $state<CoachingSettings>(DEFAULT_SETTINGS);
	let slotsMap = $state<Record<string, CoachingSlot[]>>({});
	let loading = $state(true);
	let bookings = $state<Booking[]>([]);

	onMount(async () => {
		try {
			const [fetchedServices, fetchedSettings, fetchedBookings] = await Promise.all([
				getCoachingServices(),
				getCoachingSettings(),
				getAdminBookings()
			]);
			services = fetchedServices;
			settings = fetchedSettings;
			bookings = fetchedBookings;

			// Fetch slots for each service
			const map: Record<string, CoachingSlot[]> = {};
			await Promise.all(
				fetchedServices.map(async (s) => {
					map[s.id] = await getCoachingSlots(s.id);
				})
			);
			slotsMap = map;
		} finally {
			loading = false;
		}
	});

	let activeOffers = $derived(services.filter((s) => s.active).length);
	let totalSlotsCount = $derived(
		Object.values(slotsMap).flat().filter((slot) => slot.status === 'available').length
	);
	let confirmedBookings = $derived(bookings.filter((b) => b.status === 'confirmed' || b.status === 'completed').length);
	let pendingBookings = $derived(bookings.filter((b) => b.status === 'pending_payment').length);

	let upcomingBookings = $derived(
		bookings
			.filter((b) => b.status === 'confirmed' || b.status === 'pending_payment')
			.sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())
			.slice(0, 5)
	);

	function availableFor(serviceId: string) {
		const slots = slotsMap[serviceId] || [];
		return slots.filter((s) => s.status === 'available').length;
	}
</script>

<svelte:head><title>Coaching · Administration</title></svelte:head>

<div class="mx-auto max-w-7xl space-y-6">
	<header class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
		<div>
			<p class="text-sm font-medium text-primary">Services</p>
			<h2 class="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Coaching</h2>
			<p class="mt-1 text-sm text-base-content/55">Pilotez vos offres et vos prochaines sessions depuis un seul endroit.</p>
		</div>
		<div class="flex gap-2">
			<a class="btn btn-ghost min-h-11 border border-base-300 bg-base-100" href="/admin/coaching/settings"><Settings2 size={17} /> Paramètres</a>
			<a class="btn btn-primary min-h-11 flex-1 sm:flex-none" href="/admin/coaching/new"><Plus size={18} /> Créer une offre</a>
		</div>
	</header>

	<section class="overflow-hidden rounded-xl border border-base-300 bg-base-100" aria-label="Résumé coaching">
		<div class="grid grid-cols-2 divide-x divide-y divide-base-300 sm:grid-cols-4 sm:divide-y-0">
			<div class="p-4 sm:p-5"><div class="flex items-center gap-2 text-sm text-base-content/55"><span class="grid size-8 place-items-center rounded-lg bg-primary/10 text-primary"><CalendarDays size={17} /></span> Offres actives</div><p class="mt-3 text-2xl font-bold">{activeOffers}</p></div>
			<div class="p-4 sm:p-5"><div class="flex items-center gap-2 text-sm text-base-content/55"><span class="grid size-8 place-items-center rounded-lg bg-primary/10 text-primary"><CalendarClock size={17} /></span> Créneaux libres</div><p class="mt-3 text-2xl font-bold">{totalSlotsCount}</p></div>
			<div class="p-4 sm:p-5"><div class="flex items-center gap-2 text-sm text-base-content/55"><span class="grid size-8 place-items-center rounded-lg bg-primary/10 text-primary"><Users size={17} /></span> Confirmées</div><p class="mt-3 text-2xl font-bold">{confirmedBookings}</p></div>
			<div class="p-4 sm:p-5"><div class="flex items-center gap-2 text-sm text-base-content/55"><span class="grid size-8 place-items-center rounded-lg bg-warning/15 text-warning"><Clock3 size={17} /></span> En attente</div><p class="mt-3 text-2xl font-bold">{pendingBookings}</p></div>
		</div>
	</section>

	<div class="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
		<section class="overflow-hidden rounded-xl border border-base-300 bg-base-100">
			<div class="flex items-center justify-between border-b border-base-300 px-5 py-4 sm:px-6">
				<div><h3 class="font-semibold">Vos offres</h3><p class="mt-0.5 text-xs text-base-content/50">{services.length} offres au total</p></div>
				<a class="btn btn-ghost btn-sm text-primary" href="/admin/coaching/new"><Plus size={16} /> Ajouter</a>
			</div>

			<div class="divide-y divide-base-300">
				{#if loading}
					<div class="p-12 text-center text-base-content/50 space-y-3">
						<Loader2 size={32} class="mx-auto animate-spin text-primary" />
						<p class="text-xs font-semibold">Chargement des offres...</p>
					</div>
				{:else if services.length === 0}
					<div class="p-12 text-center text-base-content/50">
						<p class="text-sm font-semibold">Aucune offre de coaching créée.</p>
						<a class="btn btn-primary btn-xs mt-3 gap-1" href="/admin/coaching/new"><Plus size={14} /> Créer une offre</a>
					</div>
				{:else}
					{#each services as service}
						<article class="group p-5 transition-colors hover:bg-base-200/35 sm:px-6">
							<div class="flex items-start gap-4">
								<span class="grid size-11 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary"><CalendarDays size={21} /></span>
								<div class="min-w-0 flex-1">
									<div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
										<div><div class="flex flex-wrap items-center gap-2"><h4 class="font-semibold">{service.title}</h4><span class={`badge badge-sm ${service.active ? 'badge-success badge-soft' : 'badge-ghost'}`}>{service.active ? 'Publiée' : 'Brouillon'}</span></div><p class="mt-1 line-clamp-1 text-sm text-base-content/55">{service.description}</p></div>
										<p class="shrink-0 text-sm font-semibold">{service.isFree ? 'Gratuit' : `${service.price.toLocaleString('fr-FR')} HTG`}</p>
									</div>
									<div class="mt-4 flex flex-wrap items-center justify-between gap-3">
										<div class="flex flex-wrap gap-x-4 gap-y-1 text-xs text-base-content/55"><span class="flex items-center gap-1.5"><Clock3 size={14} /> {service.durationMinutes} min</span><span class="flex items-center gap-1.5"><CalendarClock size={14} /> {availableFor(service.id)} créneaux disponibles</span></div>
										<div class="flex items-center gap-1"><a class="btn btn-ghost btn-sm" href={`/coaching/${service.slug}`} target="_blank" rel="noreferrer" aria-label={`Voir la page publique de ${service.title}`}><ExternalLink size={16} /></a><a class="btn btn-ghost btn-sm gap-1 text-primary" href={`/admin/coaching/${service.id}`}>Gérer <ChevronRight size={16} /></a></div>
									</div>
								</div>
							</div>
						</article>
					{/each}
				{/if}
			</div>
		</section>

		<aside class="space-y-4">
			<section class="rounded-xl border border-base-300 bg-base-100">
				<div class="flex items-center justify-between border-b border-base-300 px-5 py-4"><div><h3 class="font-semibold">À venir</h3><p class="mt-0.5 text-xs text-base-content/50">Heure du coach</p></div><a class="text-sm font-medium text-primary hover:underline" href="/admin/coaching/bookings">Tout voir</a></div>
				<div class="divide-y divide-base-300">
					{#if loading}
						<div class="p-6 text-center text-base-content/50 space-y-2">
							<Loader2 size={24} class="mx-auto animate-spin text-primary" />
							<p class="text-xs font-semibold">Chargement des séances…</p>
						</div>
					{:else if upcomingBookings.length === 0}
						<div class="p-6 text-center text-xs text-base-content/50 font-medium">
							Aucune séance à venir pour le moment.
						</div>
					{:else}
						{#each upcomingBookings as booking}
							{@const service = services.find((item) => item.id === booking.serviceId)}
							{@const local = formatDateTimeInTimezone(booking.startAt, settings.timezone)}
							<div class="p-4 sm:px-5">
								<div class="flex items-start justify-between gap-3">
									<div class="min-w-0">
										<p class="truncate text-sm font-semibold">{booking.customerName}</p>
										<p class="mt-0.5 truncate text-xs text-base-content/50">{service?.title ?? 'Session Coaching'}</p>
									</div>
									<BookingStatusBadge status={booking.status} />
								</div>
								<div class="mt-3 flex items-center justify-between">
									<p class="text-xs text-base-content/60 font-medium">
										<span class="capitalize">{local.date}</span> · {local.time}
									</p>
									{#if booking.customerWhatsapp}
										<a
											class="btn btn-ghost btn-square btn-xs text-success hover:bg-success/10"
											href={whatsappLink(booking.customerWhatsapp, `Bonjour ${booking.customerName}, au sujet de votre réservation…`)}
											target="_blank"
											rel="noreferrer"
											aria-label={`Contacter ${booking.customerName} sur WhatsApp`}
										>
											<MessageCircle size={16} />
										</a>
									{/if}
								</div>
							</div>
						{/each}
					{/if}
				</div>
				<a class="flex min-h-12 items-center justify-center gap-2 border-t border-base-300 text-sm font-semibold text-primary hover:bg-base-200/40" href="/admin/coaching/bookings">Gérer les réservations <ArrowRight size={16} /></a>
			</section>

			<section class="rounded-xl border border-base-300 bg-base-100 p-5">
				<div class="flex items-start gap-3"><span class="grid size-9 shrink-0 place-items-center rounded-lg bg-base-200 text-base-content/60"><CircleDollarSign size={18} /></span><div><p class="text-sm font-semibold">Paramètres de réservation</p><p class="mt-1 text-xs leading-relaxed text-base-content/55">Les créneaux utilisent <strong>{getTimezoneLabel(settings.timezone)}</strong>.</p><a class="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline" href="/admin/coaching/settings">Vérifier les paramètres <ArrowRight size={14} /></a></div></div>
			</section>
		</aside>
	</div>
</div>
