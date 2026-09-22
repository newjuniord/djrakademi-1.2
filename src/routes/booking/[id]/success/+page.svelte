<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { CheckCircle2, Clock, Home, MessageCircle, Loader2 } from 'lucide-svelte';
	import { formatDateTimeInTimezone, getTimezoneCity } from '$lib/coaching/timezone';
	import { whatsappLink } from '$lib/coaching/validation';
	import type { Booking } from '$lib/types/coaching';
	import { getOwnedBooking } from '$lib/coaching/booking-client';

	let currentLang = $derived<'fr' | 'ht'>(page.url.searchParams.get('lang') === 'ht' ? 'ht' : 'fr');

	function getHref(path: string) {
		return currentLang === 'ht' ? `${path}?lang=ht` : path;
	}

	const i18n = {
		fr: {
			title: 'Réservation confirmée · DJR Akademi',
			loading: 'Chargement de la réservation…',
			notFoundTitle: 'Réservation introuvable',
			notFoundDesc: 'Aucune réservation trouvée avec cet identifiant.',
			backHome: 'Retour à l\'accueil',
			confirmedTitle: 'Réservation confirmée',
			confirmedSubtitle: 'Votre date et heure sont réservées. Conservez ces informations.',
			unconfirmedTitle: 'Réservation non confirmée',
			unconfirmedSubtitle: 'Ce créneau est en attente ou a expiré.',
			clientLabel: 'Client',
			dateLabel: 'Date',
			localTimeLabel: 'Heure locale',
			amountLabel: 'Montant',
			freeText: 'Gratuit',
			timezoneLabel: 'Fuseau horaire',
			localTimeCity: 'Heure locale ·',
			whatsappCoach: 'WhatsApp Coach',
			contactCoachBtn: 'Contacter le coach',
			bookingNum: 'Réservation #'
		},
		ht: {
			title: 'Rezèvasyon konfime · DJR Akademi',
			loading: 'Rezèvasyon an ap chaje...',
			notFoundTitle: 'Nou pa jwenn rezèvasyon an',
			notFoundDesc: 'Pa gen okenn rezèvasyon ki jwenn ak ID sa a.',
			backHome: 'Tounen nan akèy',
			confirmedTitle: 'Rezèvasyon konfime',
			confirmedSubtitle: 'Dat ak lè ou an rezeve. Konseye enfòmasyon sa yo.',
			unconfirmedTitle: 'Rezèvasyon pa konfime',
			unconfirmedSubtitle: 'Lè sa a enatant oswa li fin pase.',
			clientLabel: 'Kliyan',
			dateLabel: 'Dat',
			localTimeLabel: 'Lè lokal',
			amountLabel: 'Montan',
			freeText: 'Gratis',
			timezoneLabel: 'Fizo orè',
			localTimeCity: 'Lè lokal ·',
			whatsappCoach: 'WhatsApp Coach',
			contactCoachBtn: 'Kontakte coach la',
			bookingNum: 'Rezèvasyon #'
		}
	};

	let t = $derived(i18n[currentLang]);

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
	let supportHref = $derived(whatsappNumber ? whatsappLink(whatsappNumber, currentLang === 'fr' ? `Bonjour, je viens de réserver ma session coaching pour le ${local.date} à ${local.time}.` : `Bonjou, mwen sot resève sesyon coaching mwen an pou dat ${local.date} nan lè ${local.time}.`) : getHref('/contact'));

	function downloadCalendar() {
		if (!booking) return;
		const stamp = (iso: string) => iso.replace(/[-:]/g, '').replace('.000', '');
		const content = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'BEGIN:VEVENT', `UID:${booking.id}@djrakademi`, `DTSTART:${stamp(booking.startAt)}`, `DTEND:${stamp(booking.endAt)}`, `SUMMARY:${serviceTitle}`, 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
		const url = URL.createObjectURL(new Blob([content], { type: 'text/calendar' })); const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'coaching-djrakademi.ics'; anchor.click(); URL.revokeObjectURL(url);
	}
</script>

<svelte:head><title>{t.title}</title></svelte:head>
<div class="grid min-h-dvh place-items-center bg-base-200 p-4">
	<main class="card w-full max-w-xl border border-base-300 bg-base-100 shadow-none">
		<div class="card-body items-center p-6 text-center sm:p-10">
			{#if loading}
				<Loader2 size={36} class="animate-spin text-primary mx-auto my-6" />
				<p class="text-sm font-semibold text-base-content/60">{t.loading}</p>
			{:else if !booking}
				<div class="space-y-3 py-6">
					<h1 class="text-2xl font-bold text-error">{t.notFoundTitle}</h1>
					<p class="text-xs text-base-content/60">{t.notFoundDesc}</p>
					<a href={getHref('/')} class="btn btn-primary btn-sm mt-2">{t.backHome}</a>
				</div>
			{:else}
				{#if booking.status === 'confirmed' || booking.status === 'completed'}
					<span class="grid size-16 place-items-center rounded-full bg-success/15 text-success">
						<CheckCircle2 size={34} />
					</span>
					<h1 class="mt-2 text-2xl font-bold">{t.confirmedTitle}</h1>
					<p class="text-base-content/60">{t.confirmedSubtitle}</p>
				{:else}
					<span class="grid size-16 place-items-center rounded-full bg-error/15 text-error">!</span>
					<h1 class="mt-2 text-2xl font-bold">{t.unconfirmedTitle}</h1>
					<p class="text-base-content/60">{t.unconfirmedSubtitle}</p>
				{/if}

				<div class="my-4 w-full rounded-lg border border-base-300 bg-base-200/40 p-5 text-left">
					<h2 class="font-bold">{serviceTitle}</h2>
					<dl class="mt-4 space-y-3 text-sm">
						<div class="flex justify-between gap-4">
							<dt class="text-base-content/55">{t.clientLabel}</dt>
							<dd class="font-medium">{booking.customerName}</dd>
						</div>
						<div class="flex justify-between gap-4">
							<dt class="text-base-content/55">{t.dateLabel}</dt>
							<dd class="font-medium capitalize">{local.date}</dd>
						</div>
						<div class="flex justify-between gap-4">
							<dt class="text-base-content/55">{t.localTimeLabel}</dt>
							<dd class="font-medium">{local.time}</dd>
						</div>
						<div class="flex justify-between gap-4">
							<dt class="text-base-content/55">{t.amountLabel}</dt>
							<dd class="font-medium">
								{#if (booking.amount || servicePrice) > 0}
									{(booking.amount || servicePrice).toLocaleString(currentLang === 'fr' ? 'fr-FR' : 'ht-HT')} HTG
									{#if servicePriceUsd > 0}
										<span class="text-amber-600 font-semibold ml-1">(${servicePriceUsd} USD)</span>
									{/if}
								{:else if serviceIsFree}
									{t.freeText}
								{:else}
									{t.freeText}
								{/if}
							</dd>
						</div>
						<div class="flex justify-between gap-4">
							<dt class="text-base-content/55">{t.timezoneLabel}</dt>
							<dd class="font-medium">{t.localTimeCity} {getTimezoneCity(booking.customerTimezone)}</dd>
						</div>
						{#if whatsappNumber && (booking.status === 'confirmed' || booking.status === 'completed')}
							<div class="flex justify-between gap-4">
								<dt class="text-base-content/55">{t.whatsappCoach}</dt>
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
							<MessageCircle size={18} /> {t.contactCoachBtn} ({whatsappNumber || ''})
						</a>
					</div>
				{/if}

				<a class="btn btn-ghost mt-2" href={getHref('/')}>
					<Home size={17} /> {t.backHome}
				</a>
				<p class="mt-2 flex items-center gap-1 text-xs text-base-content/45">
					<Clock size={13} /> {t.bookingNum}{booking.id}
				</p>
			{/if}
		</div>
	</main>
</div>
