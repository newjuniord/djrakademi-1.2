<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { ArrowLeft, CalendarDays, Check, Clock, Globe2, ShieldCheck, Loader2, Radio, Shield, Heart, TrendingUp, Zap, Star, LogIn } from 'lucide-svelte';
	import PublicFooter from '$lib/components/PublicFooter.svelte';
	import PhoneInput from '$lib/components/coaching/PhoneInput.svelte';
	import TimezoneSelector from '$lib/components/coaching/TimezoneSelector.svelte';
	import { formatDateTimeInTimezone, getTimezoneCity, isValidTimezone } from '$lib/coaching/timezone';
	import { validateBookingInput } from '$lib/coaching/validation';
	import { startBooking } from '$lib/coaching/booking-client';
	import type { BookingCustomerInput, CoachingService, CoachingSlot } from '$lib/types/coaching';
	import { formatPublicPrice } from '$lib/utils/public-price';
	import { getCoachingServiceBySlug, getDynamicCoachingSlots } from '$lib/services/coaching';
	import { authState } from '$lib/auth.svelte';
	import PaymentMethodModal from '$lib/components/PaymentMethodModal.svelte';
	import MaintenanceModal from '$lib/components/MaintenanceModal.svelte';
	import { getMaintenanceStatus } from '$lib/services/maintenance';
	import { initiatePlopplopPayment } from '$lib/services/payments';
	import { toast } from '$lib/toast.svelte';

	let currentLang = $derived<'fr' | 'ht'>(page.url.searchParams.get('lang') === 'ht' ? 'ht' : 'fr');

	const i18n = {
		fr: {
			metaTitle: (t: string) => `${t} · Consultation DJR Akademi`,
			metaDesc: (d: string) => d || "Séance de consultation individuelle sur-mesure",
			securityBadge: "Réservation 100% sécurisée",
			loading: "Chargement de votre séance de consultation...",
			notFoundTitle: "Service non disponible",
			notFoundDesc: "Ce service de consultation n'existe pas ou est désactivé.",
			backHome: "Retour à l'accueil",
			backTrainings: "Toutes les offres",
			badgeSession: "Séance Individuelle 1-à-1",
			durationLabel: "Durée de la séance",
			minutes: (m: number) => `${m} minutes`,
			priceLabel: "Prix de la séance",
			free: "Gratuit",
			includedTitle: "Inclus dans votre réservation :",
			inc1: "Confirmation et détails accessibles dans votre espace",
			inc2: "Ajout à votre calendrier en un clic",
			inc3: "Horaire ajusté selon votre ville",
			step1Title: "1. Choisissez une date et une heure",
			timezoneAdjustedFor: (city: string) => `Horaire ajusté pour : ${city}`,
			noSlotsAvailable: "Aucun créneau disponible pour le moment.",
			noSlotsDesc: "De nouveaux créneaux seront bientôt ajoutés.",
			selectDateLabel: (n: number) => `Choisissez une date (${n} jour${n > 1 ? 's' : ''} disponible${n > 1 ? 's' : ''}) :`,
			selectSlotLabel: (date: string) => `Créneaux disponibles pour le ${date} :`,
			step2Title: "2. Vos informations",
			step2Subtitle: "La réservation sera directement liée à votre compte.",
			notLoggedIn: "Vous n'êtes pas encore connecté ?",
			notLoggedInSub: "Connectez-vous pour lier automatiquement votre réservation.",
			btnLoginNow: "Se connecter maintenant",
			fullNameLabel: "Nom complet",
			emailLabel: "Adresse e-mail",
			whatsappLabel: "Numéro WhatsApp",
			btnSubmit: "Continuer vers le paiement",
			btnSubmitFree: "Confirmer la réservation gratuite",
			btnSubmitRetry: "Reprendre le paiement",
			loadingSubmit: "Création de la réservation...",
			selectSlotError: "Veuillez choisir un créneau disponible.",
			loginToast: "Veuillez vous connecter à votre compte pour réserver cette séance."
		},
		ht: {
			metaTitle: (t: string) => `${t} · DJR Akademi`,
			metaDesc: (d: string) => d || "Sesyon konsiltasyon endividyèl",
			securityBadge: "Rezèvasyon 100% Ansekirite",
			loading: "Sesyon konsiltasyon ou a ap chaje...",
			notFoundTitle: "Sèvis sa a pa disponib",
			notFoundDesc: "Sèvis konsiltasyon sa a pa egziste oswa li desaktive.",
			backHome: "Tounen nan akèy",
			backTrainings: "Tounen nan fòmasyon yo",
			badgeSession: "Sesyon Endividyèl 1-ak-1",
			durationLabel: "Tan sesyon an",
			minutes: (m: number) => `${m} minit`,
			priceLabel: "Pri sesyon an",
			free: "Gratis",
			includedTitle: "Enkli nan rezèvasyon ou :",
			inc1: "Konfimasyon ak detay yo disponib nan espas ou",
			inc2: "Ajoute nan kalandriye ou an yon sèl klik",
			inc3: "Lè ajiste selon lavil ou",
			step1Title: "1. Chwazi yon dat ak lè",
			timezoneAdjustedFor: (city: string) => `Lè ki ajiste pou : ${city}`,
			noSlotsAvailable: "Pa gen dat ki disponib pou kounye a.",
			noSlotsDesc: "N ap ajoute lòt dat ki disponib yo talè konsa.",
			selectDateLabel: (n: number) => `Chwazi yon dat (${n} jou disponib) :`,
			selectSlotLabel: (date: string) => `Lè ki disponib pou ${date} :`,
			step2Title: "2. Enfòmasyon ou yo",
			step2Subtitle: "Konfimasyon an ap lyen ak kont ou.",
			notLoggedIn: "Ou poko konekte sou kont ou?",
			notLoggedInSub: "Konekte pou rezèvasyon an ka lyen ak kont ou otomatikman.",
			btnLoginNow: "Konekte kounye a",
			fullNameLabel: "Non konplè",
			emailLabel: "Adrès Imèl",
			whatsappLabel: "Nimewo WhatsApp",
			btnSubmit: "Kontinye nan peman an",
			btnSubmitFree: "Konfime rezèvasyon gratis la",
			btnSubmitRetry: "Repann peman an",
			loadingSubmit: "Rezèvasyon an ap kreye...",
			selectSlotError: "Chwazi yon kreno ki disponib.",
			loginToast: "Tanpri konekte sou kont ou pou w ka rezève sesyon konsiltasyon sa a."
		}
	};

	let t = $derived(i18n[currentLang]);

	function getHref(path: string): string {
		if (currentLang !== 'ht') return path;
		const [pathname, search] = path.split('?');
		const params = new URLSearchParams(search || '');
		params.set('lang', 'ht');
		return `${pathname}?${params.toString()}`;
	}

	const slug = $derived(page.params.slug);

	let service = $state<CoachingService | null>(null);
	let slots = $state<CoachingSlot[]>([]);
	let fetching = $state(true);

	let timezone = $state('America/Port-au-Prince');
	let timezoneOpen = $state(false);
	let selected = $state<CoachingSlot | null>(null);
	let name = $state('');
	let email = $state('');
	let whatsapp = $state('');
	let error = $state('');
	let loading = $state(false);
	let liveBookingId = $state('');

	$effect(() => {
		if (authState.user) {
			if (!name) name = authState.user.name || '';
			if (!email) email = authState.user.email || '';
		}
	});

	type DateGroup = {
		dateKey: string;
		formattedDate: string;
		shortDate: string;
		slots: CoachingSlot[];
	};

	let selectedDateKey = $state<string>('');

	let groupedSlots = $derived.by(() => {
		const groupsMap = new Map<string, { formattedDate: string; shortDate: string; slots: CoachingSlot[] }>();
		for (const slot of slots) {
			const { date: formattedDate } = formatDateTimeInTimezone(slot.startAt, timezone);
			const key = formattedDate;
			if (!groupsMap.has(key)) {
				const parts = formattedDate.split(' ');
				const shortDate = parts.length >= 3 ? `${parts[0]} ${parts[1]} ${parts[2]}` : formattedDate;
				groupsMap.set(key, { formattedDate, shortDate, slots: [] });
			}
			groupsMap.get(key)!.slots.push(slot);
		}
		const list: DateGroup[] = [];
		for (const [dateKey, val] of groupsMap.entries()) {
			list.push({ dateKey, formattedDate: val.formattedDate, shortDate: val.shortDate, slots: val.slots });
		}
		return list;
	});

	$effect(() => {
		if (groupedSlots.length > 0) {
			if (!selectedDateKey || !groupedSlots.some((g) => g.dateKey === selectedDateKey)) {
				selectedDateKey = groupedSlots[0].dateKey;
			}
		} else {
			selectedDateKey = '';
		}
	});

	let currentDayGroup = $derived(groupedSlots.find((g) => g.dateKey === selectedDateKey) || groupedSlots[0] || null);

	onMount(async () => {
		const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
		if (isValidTimezone(detected)) timezone = detected;

		if (slug) {
			try {
				const fetchedService = await getCoachingServiceBySlug(slug);
				service = fetchedService;
				if (fetchedService) {
					slots = await getDynamicCoachingSlots(fetchedService.id);
				}
			} finally {
				fetching = false;
			}
		} else {
			fetching = false;
		}
	});

	let showCoachingPaymentModal = $state(false);
	let showMaintenanceModal = $state(false);

	async function showMaintenanceIfEnabled(): Promise<boolean> {
		try {
			const status = await getMaintenanceStatus();
			if (status.enabled) showMaintenanceModal = true;
			return status.enabled;
		} catch {
			return false;
		}
	}

	async function continueBooking(event: SubmitEvent) {
		event.preventDefault();
		if (await showMaintenanceIfEnabled()) return;
		if (!service || !selected) { error = t.selectSlotError; return; }
		if (liveBookingId) { showCoachingPaymentModal = true; return; }
		const customer: BookingCustomerInput = { name, email, whatsapp, timezone };
		error = validateBookingInput(customer) ?? "";
		if (error) return;
		if (!authState.user) {
			error = t.loginToast;
			toast.info(t.loginToast);
			authState.openLogin(() => {
				error = "";
			});
			return;
		}

		loading = true;
		try {
			const created = await startBooking(service.id, selected.startAt, selected.endAt, customer);
			liveBookingId = created.bookingId;
			if (created.status === "confirmed") {
				await goto(getHref(`/booking/${created.bookingId}/success`));
			} else {
				showCoachingPaymentModal = true;
			}
		} catch (caught) {
			error = caught instanceof Error ? caught.message : t.selectSlotError;
		} finally {
			loading = false;
		}
	}

	async function handleCoachingSelectPaymentMethod(method: "moncash" | "natcash" | "carte" | "plopplop_carte") {
		if (!service || !liveBookingId) return;
		if (await showMaintenanceIfEnabled()) {
			showCoachingPaymentModal = false;
			return;
		}
		loading = true;
		error = "";
		try {
			const result = await initiatePlopplopPayment({
				productType: "coaching",
				productId: service.id,
				productTitle: service.title,
				amount: service.price,
				bookingId: liveBookingId,
				paymentMethod: method,
				customerName: name.trim(),
				customerEmail: email.trim().toLowerCase(),
				customerPhone: whatsapp
			});
			const redirectTarget = result?.url || result?.redirectUrl;
			if (!result?.success || !redirectTarget) {
				throw new Error(result?.message || "Erè nan lanse peman an.");
			}
			window.location.href = redirectTarget;
			return;
		} catch (caught) {
			error = caught instanceof Error ? caught.message : "Yon erè rive pandan peman an.";
			toast.error(error);
			showCoachingPaymentModal = false;
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>{service ? t.metaTitle(service.title) : t.metaTitle('Coaching')}</title>
	<meta name="description" content={t.metaDesc(service?.description ?? '')} />
</svelte:head>

<div class="min-h-dvh bg-base-200/50 flex flex-col">
	<!-- Header Navbar -->
	<header class="border-b border-base-300/80 bg-base-100/90 backdrop-blur-md sticky top-0 z-40">
		<div class="mx-auto flex min-h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
			<a class="flex items-center gap-2.5 font-black text-lg tracking-tight text-base-content" href={getHref('/')}>
				<img src="/logo.png" alt="DJR Akademi" class="h-9 w-auto object-contain" />
				<span class="hidden min-[430px]:inline-block">DJR Akademi</span>
			</a>
			<div class="flex items-center gap-1.5 text-xs font-bold text-base-content/60 bg-base-200 px-3 py-1.5 rounded-full border border-base-300/60">
				<ShieldCheck size={14} class="text-emerald-500" />
				<span>{t.securityBadge}</span>
			</div>
		</div>
	</header>

	{#if fetching}
		<div class="my-auto py-24 text-center text-base-content/50 space-y-4">
			<Loader2 size={40} class="mx-auto animate-spin text-primary" />
			<p class="text-sm font-bold tracking-tight">{t.loading}</p>
		</div>
	{:else if !service}
		<div class="my-auto mx-auto max-w-md px-4 py-20 text-center space-y-5">
			<div class="size-16 bg-base-300/50 rounded-full grid place-items-center mx-auto text-base-content/40">
				<Globe2 size={28} />
			</div>
			<h1 class="text-2xl font-black text-base-content tracking-tight">{t.notFoundTitle}</h1>
			<p class="text-xs text-base-content/60 leading-relaxed font-medium">
				{t.notFoundDesc}
			</p>
			<a class="btn btn-primary btn-sm rounded-xl px-6 font-bold" href={getHref('/')}>
				<ArrowLeft size={14} />
				{t.backHome}
			</a>
		</div>
	{:else}
		<main class="mx-auto grid max-w-6xl gap-8 px-4 sm:px-6 py-8 sm:py-12 lg:grid-cols-[0.85fr_1.15fr] w-full flex-1">
			<!-- LEFT SIDEBAR: SESSION OVERVIEW -->
			<section class="card h-fit border border-base-300 bg-base-100 shadow-xs rounded-2xl overflow-hidden lg:sticky lg:top-24">
				<div class="card-body p-6 sm:p-8 space-y-6">
					<a
						class="btn btn-ghost btn-xs rounded-none gap-1 font-semibold text-xs text-base-content/60 hover:text-base-content self-start inline-flex items-center -ml-2"
						href={getHref('/')}
					>
						<ArrowLeft size={14} />
						{t.backTrainings}
					</a>

					<div>
						<span class="badge badge-primary font-bold text-[10px] uppercase tracking-wider mb-2">
							{t.badgeSession}
						</span>
						<h1 class="text-2xl sm:text-3xl font-black text-base-content tracking-tight leading-tight">
							{service.title}
						</h1>
						<p class="mt-3 text-xs sm:text-sm text-base-content/70 leading-relaxed font-medium">
							{service.description}
						</p>
					</div>

					<div class="divider my-0 border-base-200/80"></div>

					<!-- Key Details Grid -->
					<div class="grid grid-cols-2 gap-4">
						<div class="p-3.5 rounded-xl bg-base-200/40 border border-base-300/60">
							<dt class="text-[11px] font-bold uppercase tracking-wider text-base-content/50">{t.durationLabel}</dt>
							<dd class="mt-1 flex items-center gap-1.5 text-sm font-extrabold text-base-content">
								<Clock size={16} class="text-primary" />
								<span>{t.minutes(service.durationMinutes)}</span>
							</dd>
						</div>

						<div class="p-3.5 rounded-xl bg-base-200/40 border border-base-300/60">
							<dt class="text-[11px] font-bold uppercase tracking-wider text-base-content/50">{t.priceLabel}</dt>
							<dd class="mt-1 text-sm font-extrabold text-primary">
								{service.isFree ? t.free : formatPublicPrice(service.price, service.priceUsd)}
							</dd>
						</div>
					</div>

					<!-- Included Features Info -->
					<div class="rounded-2xl bg-primary/5 p-4 border border-primary/10 space-y-2.5">
						<p class="text-xs font-bold text-primary flex items-center gap-1.5">
							<ShieldCheck size={16} />
							<span>{t.includedTitle}</span>
						</p>
						<ul class="text-xs text-base-content/70 space-y-1.5 font-medium pl-1">
							<li class="flex items-center gap-2">
								<Check size={14} class="text-emerald-500 shrink-0" />
								<span>{t.inc1}</span>
							</li>
							<li class="flex items-center gap-2">
								<Check size={14} class="text-emerald-500 shrink-0" />
								<span>{t.inc2}</span>
							</li>
							<li class="flex items-center gap-2">
								<Check size={14} class="text-emerald-500 shrink-0" />
								<span>{t.inc3}</span>
							</li>
						</ul>
					</div>
				</div>
			</section>

			<!-- RIGHT MAIN CARD: STEP 1 (SLOTS) & STEP 2 (CUSTOMER INFO) -->
			<section class="card border border-base-300 bg-base-100 shadow-xs rounded-2xl overflow-hidden">
				<div class="card-body gap-7 p-6 sm:p-8">
					<!-- STEP 1: CHOIX DU CRÉNEAU -->
						<div class="space-y-4">
							<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-base-200/80">
								<div>
									<h2 class="text-lg font-black text-base-content tracking-tight">{t.step1Title}</h2>
									<p class="mt-0.5 text-xs text-base-content/60 font-medium flex items-center gap-1">
										<Globe2 size={13} class="text-primary" />
										<span>{t.timezoneAdjustedFor(getTimezoneCity(timezone))}</span>
									</p>
								</div>
							</div>

							<!-- Timezone Selector Dropdown -->
							<TimezoneSelector bind:value={timezone} bind:open={timezoneOpen} />

							{#if slots.length === 0}
								<div class="rounded-2xl border border-dashed border-base-300/80 p-8 text-center text-base-content/50 space-y-2 bg-base-200/30">
									<p class="text-xs font-bold text-base-content/70">{t.noSlotsAvailable}</p>
									<p class="text-[11px] text-base-content/50">{t.noSlotsDesc}</p>
								</div>
							{:else}
								<!-- 1. DATE PICKER DROPDOWN -->
								<div class="form-control gap-2.5">
									<label for="date-select" class="label-text font-bold text-xs uppercase tracking-wider text-base-content/70 flex items-center gap-1.5 mb-0.5">
										<CalendarDays size={15} class="text-primary" />
										<span>{t.selectDateLabel(groupedSlots.length)}</span>
									</label>
									<div class="relative">
										<select
											id="date-select"
											bind:value={selectedDateKey}
											class="select select-md w-full rounded-[4px] font-bold text-xs sm:text-sm bg-base-100 border border-base-300/80 outline-none focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all capitalize py-2.5"
										>
											{#each groupedSlots as group}
												<option value={group.dateKey}>
													📅 {group.formattedDate} ({group.slots.length} {currentLang === 'ht' ? 'lè disponib' : 'créneaux disponibles'})
												</option>
											{/each}
										</select>
									</div>
								</div>

								<!-- 2. TIME SLOTS GRID FOR ACTIVE DATE -->
								{#if currentDayGroup}
									<div class="space-y-3 pt-2">
										<p class="text-xs font-bold text-base-content/80 flex items-center gap-1.5">
											<Clock size={14} class="text-primary" />
											{t.selectSlotLabel(currentDayGroup.formattedDate)}
										</p>
										<div class="grid gap-2.5 grid-cols-2 sm:grid-cols-3">
											{#each currentDayGroup.slots as slot}
												{@const local = formatDateTimeInTimezone(slot.startAt, timezone)}
												{@const isSelected = selected?.id === slot.id}
												<button
													type="button"
													disabled={Boolean(liveBookingId)}
													class={`flex items-center justify-between rounded-xl border p-3.5 text-left transition-all ${
														isSelected
															? 'border-primary bg-primary/5 ring-2 ring-primary/20 shadow-xs'
															: 'border-base-300/80 hover:border-primary/50 bg-base-100'
													}`}
													onclick={() => (selected = slot)}
												>
													<span class="flex items-center gap-1.5 text-xs font-extrabold text-primary">
														<Clock size={13} />
														<span>{local.time}</span>
													</span>
													{#if isSelected}
														<span class="grid size-5 place-items-center rounded-full bg-primary text-primary-content font-bold shadow-2xs">
															<Check size={12} />
														</span>
													{/if}
												</button>
											{/each}
										</div>
									</div>
								{/if}
							{/if}
						</div>

						<div class="divider my-0 border-base-200/60"></div>

						<!-- STEP 2: VOS INFORMATIONS -->
						<form class="space-y-5" onsubmit={continueBooking}>
							<div>
								<h2 class="text-lg font-black text-base-content tracking-tight">{t.step2Title}</h2>
								<p class="mt-0.5 text-xs text-base-content/60 font-medium">{t.step2Subtitle}</p>
							</div>

							{#if !authState.user}
								<div class="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
									<div class="space-y-0.5">
										<p class="text-xs font-bold text-zinc-950 flex items-center gap-1.5">
											<LogIn size={14} class="text-amber-600" />
											<span>{t.notLoggedIn}</span>
										</p>
										<p class="text-[11px] text-zinc-500">{t.notLoggedInSub}</p>
									</div>
									<button
										type="button"
										onclick={() => authState.openLogin()}
										class="px-3.5 py-1.5 bg-zinc-950 hover:bg-zinc-800 active:scale-95 text-white font-bold text-xs rounded-xl transition-all shrink-0 cursor-pointer flex items-center gap-1.5"
									>
										<LogIn size={13} class="text-amber-400" />
										<span>{t.btnLoginNow}</span>
									</button>
								</div>
							{/if}

							{#if error}
								<div class="alert alert-error text-xs font-bold shadow-xs rounded-2xl">
									<span>{error}</span>
								</div>
							{/if}

							<div class="form-control gap-1.5">
								<label for="booking-name" class="label-text font-bold text-[11px] uppercase tracking-wider text-base-content/70">
									{t.fullNameLabel} <span class="text-error">*</span>
								</label>
								<input
									id="booking-name"
									class="input input-sm input-bordered w-full rounded-xl text-xs font-bold text-base-content bg-base-100 border-base-300 shadow-2xs focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
									required
									autocomplete="name"
									bind:value={name}
									placeholder="Ex: Jean-Marc Baptiste"
								/>
							</div>

							<div class="form-control gap-1.5">
								<label for="booking-email" class="label-text font-bold text-[11px] uppercase tracking-wider text-base-content/70">
									{t.emailLabel} <span class="text-error">*</span>
								</label>
								<input
									id="booking-email"
									class="input input-sm input-bordered w-full rounded-xl text-xs font-bold text-base-content bg-base-100 border-base-300 shadow-2xs focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
									type="email"
									required
									autocomplete="email"
									bind:value={email}
									placeholder="votre.email@exemple.com"
								/>
							</div>

							<div class="form-control gap-1.5">
								<label for="booking-whatsapp" class="label-text font-bold text-[11px] uppercase tracking-wider text-base-content/70">
									{t.whatsappLabel} <span class="text-error">*</span>
								</label>
								<PhoneInput bind:value={whatsapp} required showLabel={false} />
							</div>

							<button
								class="btn btn-primary min-h-12 w-full rounded-xl font-extrabold text-sm gap-2 shadow-md mt-2"
								type="submit"
								disabled={!selected || loading}
							>
								{#if loading}
									<Loader2 size={18} class="animate-spin" />
									<span>{t.loadingSubmit}</span>
								{:else}
									<CalendarDays size={18} />
									<span>{service.isFree ? t.btnSubmitFree : liveBookingId ? t.btnSubmitRetry : t.btnSubmit}</span>
								{/if}
							</button>
						</form>
				</div>
			</section>
		</main>

		<!-- POUKISA W DWE PATISIPE? Section -->
		<section class="bg-zinc-950 text-white py-16 sm:py-24 border-t border-zinc-800/80 mt-12">
			<div class="max-w-6xl mx-auto px-4 sm:px-6">

				<!-- Section Header -->
				<div class="text-center space-y-3 max-w-3xl mx-auto">
					<span class="text-amber-500 font-extrabold text-xs uppercase tracking-widest block">
						POUKISA W DWE PATISIPE?
					</span>
					<h2 class="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white uppercase leading-tight">
						DEVLOPE OTORITE W AK PARÒL OU
					</h2>
					<p class="text-xs sm:text-sm text-zinc-400 font-medium leading-relaxed max-w-2xl mx-auto">
						Aprann metriz kominikasyon ki se zouti prensipal tout gwo lidè. Metòd sa a fèt pou bay rezilta rapid ak pratik nan lavi pwofesyonèl ou.
					</p>
				</div>

				<!-- 6 Cards Grid -->
				<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12 sm:mt-16">

					<!-- Card 1 -->
					<div class="bg-[#121214] border border-zinc-800/80 rounded-2xl p-6 sm:p-7 shadow-lg flex flex-col justify-start hover:border-amber-500/30 transition-colors">
						<div class="size-10 bg-amber-500/10 text-amber-500 rounded-xl grid place-items-center mb-5 shrink-0">
							<Radio size={20} />
						</div>
						<h3 class="font-black text-sm text-white uppercase tracking-wider mb-2.5">
							KOMINIKASYON KLÈ
						</h3>
						<p class="text-xs text-zinc-400 leading-relaxed font-medium">
							Aprann fòmile lide w yo avèk presizyon pou pèsonn pa mal konprann vizyon w. Chak mo ap gen enpak li.
						</p>
					</div>

					<!-- Card 2 -->
					<div class="bg-[#121214] border border-zinc-800/80 rounded-2xl p-6 sm:p-7 shadow-lg flex flex-col justify-start hover:border-amber-500/30 transition-colors">
						<div class="size-10 bg-amber-500/10 text-amber-500 rounded-xl grid place-items-center mb-5 shrink-0">
							<Shield size={20} />
						</div>
						<h3 class="font-black text-sm text-white uppercase tracking-wider mb-2.5">
							OTORITE NATIRÈL
						</h3>
						<p class="text-xs text-zinc-400 leading-relaxed font-medium">
							Pran lapawòl ak yon asirans ki fè tout moun anvi tande sa w gen pou di a. Enpoze respè san fòse.
						</p>
					</div>

					<!-- Card 3 -->
					<div class="bg-[#121214] border border-zinc-800/80 rounded-2xl p-6 sm:p-7 shadow-lg flex flex-col justify-start hover:border-amber-500/30 transition-colors">
						<div class="size-10 bg-amber-500/10 text-amber-500 rounded-xl grid place-items-center mb-5 shrink-0">
							<Heart size={20} />
						</div>
						<h3 class="font-black text-sm text-white uppercase tracking-wider mb-2.5">
							KONEKSYON EMOSYONÈL
						</h3>
						<p class="text-xs text-zinc-400 leading-relaxed font-medium">
							Touche kè moun w ap pale yo, kreye senpati epi bati konfyans rapidman avèk odyans ou.
						</p>
					</div>

					<!-- Card 4 -->
					<div class="bg-[#121214] border border-zinc-800/80 rounded-2xl p-6 sm:p-7 shadow-lg flex flex-col justify-start hover:border-amber-500/30 transition-colors">
						<div class="size-10 bg-amber-500/10 text-amber-500 rounded-xl grid place-items-center mb-5 shrink-0">
							<TrendingUp size={20} />
						</div>
						<h3 class="font-black text-sm text-white uppercase tracking-wider mb-2.5">
							ENFLIYANS AK ENPAK
						</h3>
						<p class="text-xs text-zinc-400 leading-relaxed font-medium">
							Konvenk odyans ou, dirije ekip ou ak enspire foul moun natirèlman.
						</p>
					</div>

					<!-- Card 5 -->
					<div class="bg-[#121214] border border-zinc-800/80 rounded-2xl p-6 sm:p-7 shadow-lg flex flex-col justify-start hover:border-amber-500/30 transition-colors">
						<div class="size-10 bg-amber-500/10 text-amber-500 rounded-xl grid place-items-center mb-5 shrink-0">
							<Zap size={20} />
						</div>
						<h3 class="font-black text-sm text-white uppercase tracking-wider mb-2.5">
							METRIZ ESTRÈS
						</h3>
						<p class="text-xs text-zinc-400 leading-relaxed font-medium">
							Jere lakrentif ak trak pou w rete poze epi klè, kèlkeswa gwosè odyans ou ap afwonte a.
						</p>
					</div>

					<!-- Card 6 -->
					<div class="bg-[#121214] border border-zinc-800/80 rounded-2xl p-6 sm:p-7 shadow-lg flex flex-col justify-start hover:border-amber-500/30 transition-colors">
						<div class="size-10 bg-amber-500/10 text-amber-500 rounded-xl grid place-items-center mb-5 shrink-0">
							<Star size={20} />
						</div>
						<h3 class="font-black text-sm text-white uppercase tracking-wider mb-2.5">
							PERSONAL BRANDING
						</h3>
						<p class="text-xs text-zinc-400 leading-relaxed font-medium">
							Bati yon repitasyon solid ki reflete konpetans ou kòm yon vrè lidè ak vizyonè.
						</p>
					</div>

				</div>

			</div>
		</section>

		<PublicFooter />
	{/if}
</div>

{#if service}
	<PaymentMethodModal
		open={showCoachingPaymentModal}
		productTitle={service.title}
		amount={service.price}
		amountUsd={service.priceUsd}
		isFree={service.isFree}
		loading={loading}
		onSelectMethod={handleCoachingSelectPaymentMethod}
		onClose={() => (showCoachingPaymentModal = false)}
	/>
{/if}


<MaintenanceModal open={showMaintenanceModal} onClose={() => (showMaintenanceModal = false)} />
