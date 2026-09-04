<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { CheckCircle2, Clock, Home, MessageCircle, Loader2 } from 'lucide-svelte';
	import { formatDateTimeInTimezone, getTimezoneCity } from '$lib/coaching/timezone';
	import { whatsappLink } from '$lib/coaching/validation';
	import type { Booking } from '$lib/types/coaching';
	import { getOwnedBooking } from '$lib/coaching/booking-client';

	let loading = $state(true);
	let booking = $state<Booking | null>(null);
	let serviceTitle = $state('');
	let whatsappNumber = $state<string | null>(null);
	let servicePrice = $state(0);
	let servicePriceUsd = $state(0);
	let serviceIsFree = $state(false);

	onMount(async () => {
		const bookingId = page.params.id;
		if (!bookingId) { loading = false; return; }
		try {
			const result = await getOwnedBooking(bookingId) as any;
			booking = result.booking;
			serviceTitle = result.serviceTitle;
			servicePrice = result.servicePrice || 0;
			servicePriceUsd = result.servicePriceUsd || 0;
			serviceIsFree = Boolean(result.serviceIsFree);
			whatsappNumber = result.supportWhatsapp;
		} catch (caught) {
			console.warn("Failed to fetch owned booking:", caught);
		} finally {
			loading = false;
		}
	});

	let local = $derived(booking ? formatDateTimeInTimezone(booking.startAt, booking.customerTimezone) : { date: '', time: '' });
	let supportHref = $derived(whatsappNumber ? whatsappLink(whatsappNumber, `Bonjour, je viens de réserver ma session coaching pour le ${local.date} à ${local.time}.`) : '/contact');

	function downloadCalendar() {
		if (!booking) return;
		const stamp = (iso: string) => iso.replace(/[-:]/g, '').replace('.000', '');
		const content = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'BEGIN:VEVENT', `UID:${booking.id}@djrakademi`, `DTSTART:${stamp(booking.startAt)}`, `DTEND:${stamp(booking.endAt)}`, `SUMMARY:${serviceTitle}`, 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
		const url = URL.createObjectURL(new Blob([content], { type: 'text/calendar' })); const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'coaching-djrakademi.ics'; anchor.click(); URL.revokeObjectURL(url);
	}
</script>

<svelte:head><title>Rezèvasyon konfime · DJR Akademi</title></svelte:head>
<div class="grid min-h-dvh place-items-center bg-base-200 p-4">
	<main class="card w-full max-w-xl border border-base-300 bg-base-100 shadow-none">
		<div class="card-body items-center p-6 text-center sm:p-10">
			{#if loading}
				<Loader2 size={36} class="animate-spin text-primary mx-auto my-6" />
				<p class="text-sm font-semibold text-base-content/60">Rezèvasyon an ap chaje...</p>
			{:else if !booking}
				<div class="space-y-3 py-6">
					<h1 class="text-2xl font-bold text-error">Nou pa jwenn rezèvasyon an</h1>
					<p class="text-xs text-base-content/60">Pa gen okenn rezèvasyon ki jwenn ak ID sa a.</p>
					<a href="/" class="btn btn-primary btn-sm mt-2">Tounen nan akèy</a>
				</div>
			{:else}
				{#if booking.status === 'confirmed' || booking.status === 'completed'}
					<span class="grid size-16 place-items-center rounded-full bg-success/15 text-success">
						<CheckCircle2 size={34} />
					</span>
					<h1 class="mt-2 text-2xl font-bold">Rezèvasyon konfime</h1>
					<p class="text-base-content/60">Dat ak lè ou an rezeve. Konseye enfòmasyon sa yo.</p>
				{:else}
					<span class="grid size-16 place-items-center rounded-full bg-error/15 text-error">!</span>
					<h1 class="mt-2 text-2xl font-bold">Rezèvasyon pa konfime</h1>
					<p class="text-base-content/60">Lè sa a enatant oswa li fin pase.</p>
				{/if}

				<div class="my-4 w-full rounded-lg border border-base-300 bg-base-200/40 p-5 text-left">
					<h2 class="font-bold">{serviceTitle}</h2>
					<dl class="mt-4 space-y-3 text-sm">
						<div class="flex justify-between gap-4">
							<dt class="text-base-content/55">Kliyan</dt>
							<dd class="font-medium">{booking.customerName}</dd>
						</div>
						<div class="flex justify-between gap-4">
							<dt class="text-base-content/55">Dat</dt>
							<dd class="font-medium capitalize">{local.date}</dd>
						</div>
						<div class="flex justify-between gap-4">
							<dt class="text-base-content/55">Lè lokal</dt>
							<dd class="font-medium">{local.time}</dd>
						</div>
						<div class="flex justify-between gap-4">
							<dt class="text-base-content/55">Montan</dt>
							<dd class="font-medium">
								{#if (booking.amount || servicePrice) > 0}
									{(booking.amount || servicePrice).toLocaleString('fr-FR')} HTG
									{#if servicePriceUsd > 0}
										<span class="text-amber-600 font-semibold ml-1">(${servicePriceUsd} USD)</span>
									{/if}
								{:else if serviceIsFree}
									Gratis
								{:else}
									Gratis
								{/if}
							</dd>
						</div>
						<div class="flex justify-between gap-4">
							<dt class="text-base-content/55">Fizo orè</dt>
							<dd class="font-medium">Lè lokal · {getTimezoneCity(booking.customerTimezone)}</dd>
						</div>
						{#if whatsappNumber && (booking.status === 'confirmed' || booking.status === 'completed')}
							<div class="flex justify-between gap-4">
								<dt class="text-base-content/55">WhatsApp Coach</dt>
								<dd class="font-bold text-success">{whatsappNumber}</dd>
							</div>
						{/if}
					</dl>
				</div>

				{#if booking.status === 'confirmed' || booking.status === 'completed'}
					<div class="w-full">
						<a
							class="btn btn-success min-h-12 w-full"
							href={supportHref}
							target="_blank"
							rel="noreferrer"
						>
							<MessageCircle size={18} /> Kontakte coach la ({whatsappNumber || ''})
						</a>
					</div>
				{/if}

				<a class="btn btn-ghost mt-2" href="/">
					<Home size={17} /> Tounen sou sit la
				</a>
				<p class="mt-2 flex items-center gap-1 text-xs text-base-content/45">
					<Clock size={13} /> Rezèvasyon #{booking.id}
				</p>
			{/if}
		</div>
	</main>
</div>
