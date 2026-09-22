<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import PublicHeader from '$lib/components/PublicHeader.svelte';
	import PublicFooter from '$lib/components/PublicFooter.svelte';
	import PaymentMethodModal from '$lib/components/PaymentMethodModal.svelte';
	import { getBundleById, ownsBundle, type Bundle } from '$lib/services/bundles';
	import { formatPublicPrice, useHTG } from '$lib/utils/public-price';
	import { initiatePlopplopPayment, verifyLemonSqueezyPurchase } from '$lib/services/payments';
	import { authState } from '$lib/auth.svelte';
	import { toast } from '$lib/toast.svelte';
	import {
		ArrowLeft,
		ArrowRight,
		BookOpen,
		FileText,
		Layers3,
		CheckCircle2,
		LockKeyhole,
		ChevronDown,
		ChevronUp,
		PlayCircle
	} from 'lucide-svelte';

	let currentLang = $derived<'fr' | 'ht'>(page.url.searchParams.get('lang') === 'ht' ? 'ht' : 'fr');

	const i18n = {
		fr: {
			metaTitle: (t: string) => `${t} · Offres groupées DJR Akademi`,
			metaDefaultTitle: "Offre groupée · DJR Akademi",
			metaDesc: (d: string) => d || "Offre groupée de formations et livres électroniques DJR Akademi.",
			loading: "Chargement de l'offre groupée...",
			notFoundTitle: "Offre groupée introuvable",
			notFoundDesc: "Cette offre n'est plus disponible.",
			viewAllBundles: "Voir toutes les offres groupées",
			allBundlesLink: "Toutes les offres groupées",
			badgeResources: (n: number) => `${n} ressource${n > 1 ? 's' : ''} dans une seule offre`,
			featureOnePay: "Paiement unique",
			featureAccess: "Accès immédiat dans votre espace",
			contentIncludesTitle: "Contenu inclus dans cette offre groupée",
			contentIncludesDesc: "Chaque ressource apparaîtra séparément dans votre espace après votre achat.",
			typeCourse: "Formation vidéo",
			typeEbook: "Livre électronique PDF",
			lessonsCount: (n: number) => `${n} leçon${n > 1 ? 's' : ''}`,
			btnHideLessons: "Masquer les leçons",
			btnShowLessons: "Voir les leçons",
			noLessonsYet: "Le programme des leçons sera disponible dans votre espace après le paiement.",
			sidebarTitle: "Prix de l'offre groupée",
			separately: "séparément",
			savings: (amt: string) => `Vous économisez ${amt} HTG`,
			btnBuy: "Acheter l'offre groupée",
			btnBuyLoading: "Préparation du paiement...",
			securePaymentText: "Paiement sécurisé. Accès activé immédiatement après confirmation.",
			loginToast: "Veuillez vous connecter pour acheter cette offre groupée.",
			ownedToast: "Vous possédez déjà tout le contenu de cette offre groupée ! Redirection en cours...",
			errorToast: "Impossible de lancer le paiement."
		},
		ht: {
			metaTitle: (t: string) => `${t} · Pakèt resous DJR Akademi`,
			metaDefaultTitle: "Pakèt resous · DJR Akademi",
			metaDesc: (d: string) => d || "Pakèt resous fòmasyon ak liv dijital DJR Akademi.",
			loading: "N ap chaje pakèt resous la…",
			notFoundTitle: "Pakèt resous pa jwenn",
			notFoundDesc: "Pakèt sa a pa disponib ankò.",
			viewAllBundles: "Gade tout pakèt resous yo",
			allBundlesLink: "Tout pakèt resous yo",
			badgeResources: (n: number) => `${n} resous nan yon sèl pakèt`,
			featureOnePay: "Yon sèl peman",
			featureAccess: "Aksè nan espas ou",
			contentIncludesTitle: "Sa pakèt resous la gen ladan l",
			contentIncludesDesc: "Chak resous ap parèt apa nan espas ou apre peman an.",
			typeCourse: "Fòmasyon videyo",
			typeEbook: "Liv dijital PDF",
			lessonsCount: (n: number) => `${n} leson`,
			btnHideLessons: "Masye leson",
			btnShowLessons: "Gade leson",
			noLessonsYet: "Pwogram leson yo ap disponib nan espas ou apre peman an.",
			sidebarTitle: "Pri espesyal pakèt la",
			separately: "separeman",
			savings: (amt: string) => `Ou ekonomize ${amt} HTG`,
			btnBuy: "Achte pakèt la",
			btnBuyLoading: "N ap prepare peman an…",
			securePaymentText: "Peman sekirize. Aksè yo aktive apre konfimasyon.",
			loginToast: "Tanpri konekte pou w achte pakèt sa a.",
			ownedToast: "Ou gen tout fòmasyon ak liv dijital ki nan pak sa a deja! N ap redirije w nan espas ou an.",
			errorToast: "Nou pa ka lanse peman an."
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

	let bundle = $state<Bundle | null>(null);
	let loading = $state(true);
	let error = $state('');
	let checkoutLoading = $state(false);
	let showPaymentModal = $state(false);
	let expandedItems = $state<Record<string, boolean>>({});

	onMount(async () => {
		try {
			bundle = await getBundleById(page.params.id || '');
		} catch {
			error = t.notFoundDesc;
		} finally {
			loading = false;
		}
	});

	function toggleItem(id: string) {
		expandedItems[id] = !expandedItems[id];
	}

	async function startCheckout() {
		if (!bundle || checkoutLoading) return;
		if (!authState.user) {
			toast.info(t.loginToast);
			authState.openLogin(startCheckout);
			return;
		}
		checkoutLoading = true;
		try {
			const fullyOwned = await ownsBundle(bundle);
			if (fullyOwned) {
				toast.info(t.ownedToast);
				goto(getHref('/dashboard'));
				return;
			}

			try {
				const verification = await verifyLemonSqueezyPurchase(authState.user.email, 'bundle', bundle.id);
				if (verification.ok && verification.success) {
					toast.success(verification.message, 5000);
					setTimeout(() => goto(getHref('/dashboard')), 1800);
					return;
				}
			} catch (err) {
				console.warn('[Checkout] Lemon Squeezy precheck failed, fallback to payment modal:', err);
			}
			showPaymentModal = true;
		} catch (caught) {
			console.error('Bundle purchase precheck error:', caught);
			showPaymentModal = true;
		} finally {
			checkoutLoading = false;
		}
	}

	async function selectMethod(method: 'moncash' | 'natcash' | 'carte' | 'plopplop_carte') {
		if (!bundle || checkoutLoading) return;
		if (!authState.user) {
			showPaymentModal = false;
			toast.info(t.loginToast);
			authState.openLogin(startCheckout);
			return;
		}
		checkoutLoading = true;
		try {
			const result = await initiatePlopplopPayment({
				userId: authState.user.$id,
				customerName: authState.user.name || 'Client',
				customerEmail: authState.user.email,
				productType: 'bundle',
				productId: bundle.id,
				productTitle: bundle.title,
				amount: bundle.price,
				paymentMethod: method
			});
			const target = result.url || result.redirectUrl;
			if (result.success && target) {
				window.location.href = target;
				return;
			} else {
				toast.error(result.message || t.errorToast);
			}
		} catch (caught) {
			toast.error(caught instanceof Error ? caught.message : t.errorToast);
		} finally {
			checkoutLoading = false;
		}
	}
</script>

<svelte:head>
	<title>{bundle ? t.metaTitle(bundle.title) : t.metaDefaultTitle}</title>
	<meta name="description" content={t.metaDesc(bundle?.description || '')} />
</svelte:head>

<div class="flex min-h-screen flex-col bg-zinc-50 text-zinc-950">
	<PublicHeader />

	<main class="flex-1">
		{#if loading}
			<div class="mx-auto max-w-7xl px-4 py-24 text-center text-zinc-500">
				{t.loading}
			</div>
		{:else if !bundle}
			<div class="mx-auto max-w-7xl px-4 py-24 text-center">
				<h1 class="text-2xl font-black">{t.notFoundTitle}</h1>
				<p class="mt-2 text-zinc-500">{error || t.notFoundDesc}</p>
				<a href={getHref('/bundles')} class="mt-6 inline-block font-bold text-amber-700">
					{t.viewAllBundles}
				</a>
			</div>
		{:else}
			<!-- Hero Header -->
			<section class="bg-zinc-950 px-4 py-12 text-white sm:py-16">
				<div class="mx-auto max-w-7xl">
					<a href={getHref('/bundles')} class="mb-8 inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white">
						<ArrowLeft size={16} /> {t.allBundlesLink}
					</a>
					<div class="grid items-center gap-10 lg:grid-cols-2">
						<div>
							<div class="mb-4 inline-flex items-center gap-2 rounded-full bg-amber-400/15 px-3 py-1.5 text-xs font-black uppercase text-amber-400">
								<Layers3 size={15} /> {t.badgeResources(bundle.items.length)}
							</div>
							<h1 class="text-4xl font-black tracking-tight sm:text-5xl">{bundle.title}</h1>
							<p class="mt-5 max-w-xl whitespace-pre-line text-base leading-relaxed text-zinc-300">
								{bundle.description}
							</p>
							<div class="mt-7 flex flex-wrap gap-4 text-xs font-bold text-zinc-300">
								<span class="inline-flex items-center gap-2">
									<CheckCircle2 size={17} class="text-amber-400" /> {t.featureOnePay}
								</span>
								<span class="inline-flex items-center gap-2">
									<CheckCircle2 size={17} class="text-amber-400" /> {t.featureAccess}
								</span>
							</div>
						</div>

						<div class="overflow-hidden rounded-3xl border border-white/10 bg-zinc-900 shadow-2xl">
							{#if bundle.cover}
								<img src={bundle.cover} alt={bundle.title} class="aspect-[16/10] w-full object-cover" />
							{:else}
								<div class="grid aspect-[16/10] place-items-center bg-gradient-to-br from-zinc-800 to-amber-900">
									<Layers3 size={72} class="text-amber-400" />
								</div>
							{/if}
						</div>
					</div>
				</div>
			</section>

			<!-- Content & Pricing Grid -->
			<section class="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:px-8 lg:py-16">
				<div>
					<h2 class="text-2xl font-black">{t.contentIncludesTitle}</h2>
					<p class="mt-2 text-sm text-zinc-500">
						{t.contentIncludesDesc}
					</p>

					<!-- Items List -->
					<div class="mt-6 space-y-4">
						{#each bundle.items as item (item.id)}
							{@const isCourse = item.type === 'course'}
							{@const isExpanded = Boolean(expandedItems[item.id])}
							{@const totalLessonsCount = isCourse && item.modules
								? item.modules.reduce((sum, m) => sum + (m.lessons?.length || 0), 0)
								: 0}
							<div class="rounded-2xl border border-zinc-200 bg-white p-3.5 sm:p-4.5 transition-all hover:border-amber-400/80 shadow-xs min-w-0">
								<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 min-w-0">
									<div class="flex items-center gap-3.5 min-w-0 flex-1">
										<div class="grid size-12 sm:size-14 shrink-0 place-items-center overflow-hidden rounded-xl bg-zinc-100 border border-zinc-200/60">
											{#if item.cover}
												<img src={item.cover} alt={item.title} class="h-full w-full object-cover" />
											{:else if isCourse}
												<BookOpen size={22} class="text-amber-600" />
											{:else}
												<FileText size={22} class="text-emerald-600" />
											{/if}
										</div>

										<div class="min-w-0 flex-1">
											<div class="flex flex-wrap items-center gap-1.5 sm:gap-2">
												<span class="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-zinc-400">
													{isCourse ? t.typeCourse : t.typeEbook}
												</span>
												{#if isCourse && totalLessonsCount > 0}
													<span class="rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
														{t.lessonsCount(totalLessonsCount)}
													</span>
												{/if}
											</div>
											<h3 class="font-bold text-zinc-950 text-sm sm:text-base leading-snug break-words">
												{item.title}
											</h3>
										</div>
									</div>

									<div class="flex items-center justify-between sm:justify-end gap-2 shrink-0 pt-2.5 sm:pt-0 border-t sm:border-t-0 border-zinc-100">
										{#if isCourse}
											<button
												type="button"
												onclick={() => toggleItem(item.id)}
												class="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-1.5 sm:px-3.5 sm:py-2 text-xs font-bold text-zinc-700 transition-colors hover:bg-zinc-100 hover:text-zinc-950 cursor-pointer"
											>
												<span>{isExpanded ? t.btnHideLessons : t.btnShowLessons}</span>
												{#if isExpanded}
													<ChevronUp size={15} class="text-amber-600" />
												{:else}
													<ChevronDown size={15} class="text-zinc-500" />
												{/if}
											</button>
										{/if}

										<a
											href={getHref(isCourse ? `/cours/${item.id}` : `/ebooks/${item.id}`)}
											title={isCourse ? t.typeCourse : t.typeEbook}
											class="inline-flex size-8.5 sm:size-9 items-center justify-center rounded-xl bg-zinc-100 text-zinc-600 transition-colors hover:bg-amber-400 hover:text-zinc-950"
										>
											<ArrowRight size={16} />
										</a>
									</div>
								</div>

								<!-- Expanded Accordion Content for Course Lessons -->
								{#if isCourse && isExpanded}
									<div class="mt-4 pt-4 border-t border-zinc-100 space-y-4">
										{#if item.modules && item.modules.length > 0}
											<div class="space-y-3">
												{#each item.modules as module, mIdx (module.id || mIdx)}
													<div class="rounded-xl bg-zinc-50/80 p-3.5 border border-zinc-100 space-y-2">
														<div class="flex items-center justify-between text-xs font-bold text-zinc-800">
															<span class="flex items-center gap-2">
																<span class="size-2 rounded-full bg-amber-500"></span>
																{module.title}
															</span>
															<span class="text-[11px] font-semibold text-zinc-400">
																{t.lessonsCount(module.lessons?.length || 0)}
															</span>
														</div>

														{#if module.lessons && module.lessons.length > 0}
															<div class="space-y-1.5 pl-3 pt-1">
																{#each module.lessons as lesson (lesson.id)}
																	<div class="flex items-center gap-2 text-xs text-zinc-600">
																		{#if lesson.type === 'video'}
																			<PlayCircle size={14} class="text-amber-600 shrink-0" />
																		{:else}
																			<FileText size={14} class="text-blue-600 shrink-0" />
																		{/if}
																		<span class="truncate font-medium">{lesson.title}</span>
																	</div>
																{/each}
															</div>
														{/if}
													</div>
												{/each}
											</div>
										{:else}
											<div class="py-3 text-center text-xs text-zinc-400 italic bg-zinc-50 rounded-xl">
												{t.noLessonsYet}
											</div>
										{/if}
									</div>
								{/if}
							</div>
						{/each}
					</div>
				</div>

				<!-- Checkout Sidebar Card -->
				<aside class="h-fit rounded-3xl border border-zinc-200 bg-white p-6 shadow-lg lg:sticky lg:top-28">
					<p class="text-xs font-bold uppercase tracking-wider text-zinc-500">{t.sidebarTitle}</p>
					<div class="mt-2 flex items-baseline gap-3">
						<strong class="text-3xl font-black">{formatPublicPrice(bundle.price, bundle.priceUsd)}</strong>
					</div>

					{#if useHTG && bundle.originalPrice > bundle.price}
						<p class="mt-1 text-sm text-zinc-400 line-through">
							{bundle.originalPrice.toLocaleString('fr-FR')} HTG {t.separately}
						</p>
						<p class="mt-2 text-sm font-bold text-emerald-700">
							{t.savings((bundle.originalPrice - bundle.price).toLocaleString('fr-FR'))}
						</p>
					{/if}

					<button
						type="button"
						onclick={startCheckout}
						disabled={checkoutLoading}
						class="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-amber-400 px-5 py-4 text-sm font-black text-zinc-950 transition-colors hover:bg-amber-300 disabled:opacity-50 cursor-pointer"
					>
						{checkoutLoading ? t.btnBuyLoading : t.btnBuy}
						<ArrowRight size={18} />
					</button>

					<p class="mt-4 flex items-start gap-2 text-xs leading-relaxed text-zinc-500">
						<LockKeyhole size={15} class="mt-0.5 shrink-0" />
						{t.securePaymentText}
					</p>
				</aside>
			</section>
		{/if}
	</main>

	<PublicFooter />
</div>

<PaymentMethodModal
	open={showPaymentModal}
	productTitle={bundle?.title || ''}
	amount={bundle?.price || 0}
	amountUsd={bundle?.priceUsd || undefined}
	cardEnabled={Boolean(bundle?.variantId && bundle?.priceUsd)}
	loading={checkoutLoading}
	onSelectMethod={selectMethod}
	onClose={() => (showPaymentModal = false)}
/>
