<script lang="ts">
	import PublicHeader from '$lib/components/PublicHeader.svelte';
	import { page } from '$app/state';
	import {
		CalendarCheck,
		Clock,
		ArrowLeft,
		CalendarPlus,
		CheckCircle2,
		ArrowRight,
		User
	} from 'lucide-svelte';
	import { authState } from '$lib/auth.svelte';
	import { goto } from '$app/navigation';
	import { getAccountLibrary, type LibraryBooking } from '$lib/services/library';
	import { whatsappLink } from '$lib/coaching/validation';
	import { formatDateTimeInTimezone, getTimezoneCity } from '$lib/coaching/timezone';

	let currentLang = $derived<'fr' | 'ht'>(page.url.searchParams.get('lang') === 'ht' ? 'ht' : 'fr');

	function getHref(path: string) {
		if (currentLang !== 'ht') return path;
		const url = new URL(path, page.url);
		url.searchParams.set('lang', 'ht');
		return `${url.pathname}${url.search}${url.hash}`;
	}

	const i18n = {
		fr: {
			pageTitle: 'Mes réservations · DJR Akademi',
			metaDesc: 'Consultez rapidement vos séances de coaching à venir et passées.',
			backToDashboard: 'Retour au tableau de bord',
			title: 'Mes réservations',
			bookNewBtn: 'Réserver une séance',
			tabUpcoming: 'Prochaines séances (Date proche)',
			tabPast: 'Séances passées',
			tabAll: 'Toutes',
			noUpcoming: 'Aucune séance à venir',
			noPast: 'Aucune séance passée',
			noBookings: 'Aucune réservation trouvée.',
			exploreCoaching: 'Découvrir les séances',
			today: 'Aujourd\'hui',
			upcoming: 'À venir',
			completed: 'Passée',
			contactCoach: 'WhatsApp Coach',
			addToCalendar: 'Google Calendar',
			whatsappMsg: 'Bonjour Coach, je vous contacte au sujet de ma réservation "{title}" du {date}.',
			timePassed: 'Date dépassée',
			daysLeft: 'Dans {n} jour(s)',
			hoursLeft: 'Dans {n} heure(s)',
			minutesLeft: 'Dans {n} min',
			todayNow: 'Aujourd\'hui !',
			daysAgo: 'Il y a {n} d',
			bookingId: 'ID'
		},
		ht: {
			pageTitle: 'Rezèvasyon m yo · DJR Akademi',
			metaDesc: 'Gade vit sesyon konsiltasyon w yo k ap vini ak sa ki pase yo.',
			backToDashboard: 'Retounen nan Espas Mwen',
			title: 'Rezèvasyon m yo',
			bookNewBtn: 'Rezève yon sesyon',
			tabUpcoming: 'Sesyon k ap vini (Dat ki proche)',
			tabPast: 'Sesyon ki pase yo',
			tabAll: 'Tout',
			noUpcoming: 'Pa gen sesyon k ap vini',
			noPast: 'Pa gen sesyon ki pase',
			noBookings: 'Okenn rezèvasyon pa jwenn.',
			exploreCoaching: 'Dekouvri sesyon yo',
			today: 'Jodi a',
			upcoming: 'K ap vini',
			completed: 'Pase',
			contactCoach: 'WhatsApp Konseye',
			addToCalendar: 'Google Calendar',
			whatsappMsg: 'Bonjou Konseye, m ap kontakte w pou rezèvasyon m lan "{title}" ki prevwa pou {date}.',
			timePassed: 'Dat sa a pase',
			daysLeft: 'Nan {n} jou',
			hoursLeft: 'Nan {n} èdtan',
			minutesLeft: 'Nan {n} min',
			todayNow: 'Jodi a !',
			daysAgo: 'Sa fè {n}j',
			bookingId: 'ID'
		}
	};

	let t = $derived(i18n[currentLang]);

	let myBookings = $state<LibraryBooking[]>([]);
	let loadingData = $state(true);
	let activeTab = $state<'upcoming' | 'past' | 'all'>('upcoming');

	const userTimezone = typeof window !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'UTC';

	$effect(() => {
		if (!authState.loading && !authState.user) {
			goto(getHref('/'));
		}
	});

	$effect(() => {
		if (authState.user) {
			loadBookings();
		}
	});

	async function loadBookings() {
		loadingData = true;
		try {
			const library = await getAccountLibrary();
			myBookings = (library.bookings || []).filter(
				(b) => (b.status === 'confirmed' || b.status === 'completed' || b.paymentStatus === 'paid' || b.paymentStatus === 'not_required') &&
				       b.status !== 'pending_payment' && b.paymentStatus !== 'pending'
			);
		} catch (caught) {
			console.warn('[Bookings] Error loading library:', caught);
		} finally {
			loadingData = false;
		}
	}

	function isUpcoming(startAtIso: string): boolean {
		const bookingTime = new Date(startAtIso).getTime();
		const now = new Date().getTime();
		return bookingTime >= now - 30 * 60 * 1000;
	}

	function isToday(startAtIso: string): boolean {
		const bookingDate = new Date(startAtIso);
		const today = new Date();
		return (
			bookingDate.getDate() === today.getDate() &&
			bookingDate.getMonth() === today.getMonth() &&
			bookingDate.getFullYear() === today.getFullYear()
		);
	}

	function getTimeDiffText(startAtIso: string) {
		const now = new Date().getTime();
		const target = new Date(startAtIso).getTime();
		const diffMs = target - now;

		if (diffMs < 0) {
			const pastDays = Math.floor(Math.abs(diffMs) / (1000 * 60 * 60 * 24));
			if (pastDays === 0) return t.timePassed;
			return t.daysAgo.replace('{n}', pastDays.toString());
		}

		const diffMinutes = Math.floor(diffMs / (1000 * 60));
		const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
		const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

		if (diffDays >= 1) return t.daysLeft.replace('{n}', diffDays.toString());
		if (diffHours >= 1) return t.hoursLeft.replace('{n}', diffHours.toString());
		if (diffMinutes > 0) return t.minutesLeft.replace('{n}', diffMinutes.toString());
		return t.todayNow;
	}

	const upcomingBookings = $derived(
		myBookings
			.filter((b) => isUpcoming(b.startAt))
			.sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())
	);

	const pastBookings = $derived(
		myBookings
			.filter((b) => !isUpcoming(b.startAt))
			.sort((a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime())
	);

	const displayedBookings = $derived.by(() => {
		if (activeTab === 'upcoming') return upcomingBookings;
		if (activeTab === 'past') return pastBookings;
		return [...myBookings].sort((a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime());
	});

	function formatBookingDate(iso: string) {
		const formatted = formatDateTimeInTimezone(iso, userTimezone, currentLang);
		return {
			date: formatted.date,
			time: formatted.time
		};
	}

	function getGoogleCalendarUrl(booking: LibraryBooking) {
		const startDate = new Date(booking.startAt);
		const endDate = booking.endAt ? new Date(booking.endAt) : new Date(startDate.getTime() + 60 * 60 * 1000);
		const formatUtc = (d: Date) => d.toISOString().replace(/-|:|\.\d\d\d/g, '');
		const title = encodeURIComponent(`Coaching: ${booking.serviceTitle}`);
		const details = encodeURIComponent(`Booking ID: ${booking.id}${booking.coachWhatsapp ? `\nWhatsApp: ${booking.coachWhatsapp}` : ''}`);
		const dates = `${formatUtc(startDate)}/${formatUtc(endDate)}`;
		return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}`;
	}
</script>

<svelte:head>
	<title>{t.pageTitle}</title>
	<meta name="description" content={t.metaDesc} />
</svelte:head>

<!-- LIGHT THEME CONTAINER (bg-zinc-50, text-zinc-900) -->
<div class="min-h-screen bg-zinc-50 text-zinc-900 flex flex-col font-sans">
	<PublicHeader />

	{#if authState.loading || loadingData}
		<div class="flex-1 flex items-center justify-center py-20">
			<span class="loading loading-spinner text-amber-500 loading-lg"></span>
		</div>
	{:else if authState.user}
		<main class="flex-1 py-6 sm:py-10 max-w-4xl mx-auto px-3.5 sm:px-4 w-full space-y-5 sm:space-y-6">

			<!-- Top navigation & header -->
			<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
				<div class="space-y-1">
					<a
						href={getHref('/dashboard')}
						class="inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-bold text-zinc-500 hover:text-zinc-900 transition-colors mb-0.5"
					>
						<ArrowLeft size={13} />
						<span>{t.backToDashboard}</span>
					</a>
					<h1 class="text-xl sm:text-3xl font-black text-zinc-950 tracking-tight flex items-center gap-2 sm:gap-2.5">
						<CalendarCheck size={24} class="text-amber-500 shrink-0 sm:size-[28px]" />
						<span>{t.title}</span>
					</h1>
				</div>

				<a
					href={getHref('/#coaching')}
					class="inline-flex items-center justify-center gap-2 px-3.5 py-2 sm:px-4 sm:py-2.5 bg-zinc-950 hover:bg-zinc-800 text-white font-bold text-[11px] sm:text-xs rounded-xl transition-colors shadow-xs shrink-0 self-start sm:self-auto"
				>
					<span>{t.bookNewBtn}</span>
					<ArrowRight size={13} />
				</a>
			</div>

			<!-- Filter Dropdown (Dropdown selector) -->
			<div class="flex flex-col min-[600px]:flex-row min-[600px]:items-center justify-between gap-2.5 bg-white border border-zinc-200/90 rounded-2xl p-3 shadow-xs">
				<label for="booking-filter-select" class="text-[11px] sm:text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5 pl-1">
					<Clock size={14} class="text-amber-500" />
					<span>Filtrer les séances</span>
				</label>

				<select
					id="booking-filter-select"
					bind:value={activeTab}
					class="bg-zinc-100 hover:bg-zinc-200 border border-zinc-300 text-zinc-900 font-bold text-[11px] sm:text-xs rounded-xl px-3 py-2 sm:px-4 sm:py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer transition-colors w-full min-[600px]:w-auto"
				>
					<option value="upcoming">
						{t.tabUpcoming} ({upcomingBookings.length})
					</option>
					<option value="past">
						{t.tabPast} ({pastBookings.length})
					</option>
					<option value="all">
						{t.tabAll} ({myBookings.length})
					</option>
				</select>
			</div>

			<!-- Bookings List -->
			<div class="space-y-3.5 sm:space-y-4">
				{#if displayedBookings.length === 0}
					<div class="bg-white border border-zinc-200/80 rounded-2xl p-8 sm:p-10 text-center space-y-3 shadow-xs">
						<div class="size-11 sm:size-12 bg-amber-100 text-amber-600 rounded-xl grid place-items-center mx-auto">
							<CalendarCheck size={22} />
						</div>
						<p class="text-xs font-medium text-zinc-500">
							{activeTab === 'upcoming' ? t.noUpcoming : activeTab === 'past' ? t.noPast : t.noBookings}
						</p>
						<a
							href={getHref('/#coaching')}
							class="inline-flex items-center gap-2 px-3.5 py-1.5 sm:px-4 sm:py-2 bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold text-[11px] sm:text-xs rounded-xl transition-colors shadow-xs mt-1"
						>
							{t.exploreCoaching}
						</a>
					</div>
				{:else}
					{#each displayedBookings as booking (booking.id)}
						{@const dateInfo = formatBookingDate(booking.startAt)}
						{@const upcomingState = isUpcoming(booking.startAt)}
						{@const todayState = isToday(booking.startAt)}
						{@const timeDiff = getTimeDiffText(booking.startAt)}

						<div class="bg-white border border-zinc-200/90 rounded-2xl p-4 sm:p-6 shadow-xs hover:shadow-md transition-shadow space-y-3.5">

							<!-- Top Row: Status badge & Time remaining -->
							<div class="flex flex-col min-[600px]:flex-row min-[600px]:items-center justify-between gap-2 pb-3 border-b border-zinc-100">
								<div class="flex flex-wrap items-center gap-2">
									{#if todayState}
										<span class="inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] sm:text-[11px] font-black uppercase bg-amber-400 text-zinc-950 rounded-full">
											<span class="size-1.5 rounded-full bg-zinc-950 animate-pulse"></span>
											{t.today}
										</span>
									{:else if upcomingState}
										<span class="inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] sm:text-[11px] font-bold uppercase bg-emerald-100 text-emerald-800 rounded-full">
											<span class="size-1.5 rounded-full bg-emerald-600"></span>
											{t.upcoming}
										</span>
									{:else}
										<span class="px-2 py-0.5 text-[10px] sm:text-[11px] font-bold uppercase bg-zinc-100 text-zinc-600 rounded-full">
											{t.completed}
										</span>
									{/if}

									<span class="text-[10px] sm:text-[11px] text-zinc-400 font-mono truncate max-w-[190px] sm:max-w-none">ID: {booking.id}</span>
								</div>

								<span class="text-[10px] sm:text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200/60 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg self-start min-[600px]:self-auto">
									{timeDiff}
								</span>
							</div>

							<!-- Middle Row: Service title & Date/Time -->
							<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
								<div class="space-y-1">
									<h2 class="font-black text-sm sm:text-lg text-zinc-950 leading-snug">{booking.serviceTitle}</h2>
									<p class="text-[11px] sm:text-xs text-zinc-600 font-medium flex flex-wrap items-center gap-1.5 sm:gap-2">
										<Clock size={13} class="text-zinc-400 shrink-0" />
										<span class="capitalize font-bold text-zinc-900">{dateInfo.date}</span>
										<span>·</span>
										<span class="font-black text-amber-600">{dateInfo.time}</span>
									</p>
								</div>

								<!-- Action Buttons -->
								<div class="flex items-center gap-2 shrink-0 flex-wrap">
									{#if booking.coachWhatsapp}
										<a
											href={whatsappLink(
												booking.coachWhatsapp,
												t.whatsappMsg
													.replace('{title}', booking.serviceTitle)
													.replace('{date}', `${dateInfo.date} ${dateInfo.time}`)
											)}
											target="_blank"
											rel="noreferrer"
											class="inline-flex items-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] sm:text-xs rounded-xl transition-colors shadow-xs"
										>
											<img src="/whatsapp.png" alt="WhatsApp" class="size-3.5 sm:size-4 object-contain shrink-0" />
											<span>{t.contactCoach}</span>
										</a>
									{/if}

									{#if upcomingState}
										<a
											href={getGoogleCalendarUrl(booking)}
											target="_blank"
											rel="noreferrer"
											class="inline-flex items-center gap-1.5 px-3 py-2 sm:px-3.5 sm:py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-bold text-[11px] sm:text-xs rounded-xl transition-colors"
										>
											<CalendarPlus size={13} class="text-zinc-600 sm:size-[14px]" />
											<span>{t.addToCalendar}</span>
										</a>
									{/if}
								</div>
							</div>

						</div>
					{/each}
				{/if}
			</div>

		</main>
	{/if}
</div>
