<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import PublicHeader from '$lib/components/PublicHeader.svelte';
	import PublicFooter from '$lib/components/PublicFooter.svelte';
	import { getEbookById } from '$lib/services/ebooks';
	import type { Ebook } from '$lib/types/admin';
	import { formatPublicPrice } from '$lib/utils/public-price';
	import { FileText, ChevronLeft, Download, CheckCircle2, ShoppingBag, Loader2 } from 'lucide-svelte';
	import PaymentMethodModal from '$lib/components/PaymentMethodModal.svelte';
	import { initiatePlopplopPayment, verifyLemonSqueezyPurchase } from '$lib/services/payments';
	import { claimFreeEbook, ownsEbook } from '$lib/services/ebook-access';
	import { authState } from '$lib/auth.svelte';
	import { toast } from '$lib/toast.svelte';

	let currentLang = $derived<'fr' | 'ht'>(page.url.searchParams.get('lang') === 'ht' ? 'ht' : 'fr');

	const i18n = {
		fr: {
			metaTitle: (t: string) => `${t} · DJR Akademi`,
			metaDesc: (d: string) => d || "Livre électronique DJR Akademi",
			loading: "Chargement du livre électronique...",
			notFound: "Livre électronique introuvable.",
			backHome: "Retour à l'accueil",
			backEbooks: "Tous les livres électroniques",
			kicker: "Livre électronique PDF",
			salesCount: (n: number) => `${n} vente${n > 1 ? 's' : ''}`,
			formatPdf: "Format PDF",
			free: "Gratuit",
			btnFree: "Télécharger gratuitement",
			btnBuy: "Acheter ce livre électronique",
			btnBuyBottom: "Acheter maintenant",
			loadingBtn: "Chargement...",
			aboutTitle: "À propos de ce livre électronique",
			aboutDescSuffix: "Ce guide est conçu pour une mise en pratique immédiate : chaque section vous donne des outils, des exemples et des étapes concrètes.",
			features: [
				"Accès immédiat après paiement",
				"Format PDF téléchargeable",
				"Contenu clair et pratique",
				"Support par e-mail inclus"
			],
			featGrid: [
				{ icon: '📄', title: 'Format PDF', desc: 'Compatible ordinateur, tablette et téléphone' },
				{ icon: '⚡', title: 'Accès immédiat', desc: 'Téléchargement dès la confirmation du paiement' },
				{ icon: '🎯', title: 'Contenu pratique', desc: 'Exercices et cas pratiques inclus' },
				{ icon: '🔄', title: 'Mises à jour gratuites', desc: 'Nouvelles versions incluses à vie' }
			],
			questions: "Des questions ?",
			contactForm: "Formulaire de contact",
			loginToast: "Veuillez vous connecter à votre compte pour acheter ce livre électronique.",
			loginFreeToast: "Veuillez vous connecter à votre compte pour télécharger ce livre électronique.",
			alreadyOwnedToast: "Vous possédez déjà ce livre électronique ! Redirection en cours...",
			freeClaimToast: "Livre électronique débloqué ! Vous pouvez le télécharger.",
			errorClaimToast: "Impossible de débloquer ce livre électronique.",
			errorPayment: "Une erreur est survenue lors du paiement."
		},
		ht: {
			metaTitle: (t: string) => `${t} · DJR Akademi`,
			metaDesc: (d: string) => d || "Liv dijital DJR Akademi",
			loading: "N ap chaje liv dijital la...",
			notFound: "Liv dijital la pa disponib.",
			backHome: "Retounen nan akèy",
			backEbooks: "Tout liv dijital yo",
			kicker: "Gid PDF",
			salesCount: (n: number) => `${n} vant`,
			formatPdf: "Fòma PDF",
			free: "Gratis",
			btnFree: "Telechaje gratis",
			btnBuy: "Achte ebook sa a",
			btnBuyBottom: "Achte kounye a",
			loadingBtn: "Chajman...",
			aboutTitle: "Konsènan ebook sa a",
			aboutDescSuffix: "Gid sa a fèt pou w ka aplike l dirèkteman: chak seksyon ba w zouti, egzanp ak etap konkrè pou w avanse byen vit.",
			features: [
				"Aksè imedyat apre peman",
				"Fòma PDF ou ka telechaje",
				"Kontni klè epi pratik",
				"Sipò pa imèl enkli"
			],
			featGrid: [
				{ icon: '📄', title: 'Fòma PDF', desc: 'Konpatib ak ordinatè, tablèt ak telefòn' },
				{ icon: '⚡', title: 'Aksè imedyat', desc: 'Telechajman osito peman an konfime' },
				{ icon: '🎯', title: 'Kontni pratik', desc: 'Eksèsis ak ka pratik enkli' },
				{ icon: '🔄', title: 'Mizajou gratis', desc: 'Nouvèl vèsyon enkli pou tout tan' }
			],
			questions: "Kesyon ?",
			contactForm: "Fòm kontak",
			loginToast: "Tanpri konekte sou kont ou pou w ka achte ebook sa a.",
			loginFreeToast: "Tanpri konekte sou kont ou pou w ka telechaje ebook sa a.",
			alreadyOwnedToast: "Ou gen ebook sa a deja! N ap redirije w nan espas ou an.",
			freeClaimToast: "Ebook debloke! Ou ka telechaje l kounye a.",
			errorClaimToast: "Nou pa ka debloke ebook sa a.",
			errorPayment: "Yon erè rive pandan n ap trete peman an."
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

	let ebook = $state<Ebook | null>(null);
	let loading = $state(true);
	let checkoutLoading = $state(false);
	let showPaymentModal = $state(false);

	onMount(async () => {
		const ebookId = page.params.id;
		if (ebookId) {
			try {
				ebook = await getEbookById(ebookId);
			} finally {
				loading = false;
			}
		} else {
			loading = false;
		}
	});

	async function handleBuyClick() {
		if (!ebook || checkoutLoading) return;

		if (!authState.user || !authState.user.$id) {
			toast.info(t.loginToast);
			authState.openLogin(() => {
				handleBuyClick();
			});
			return;
		}

		checkoutLoading = true;
		try {
			const existingAccess = await ownsEbook(ebook.id);
			if (existingAccess) {
				toast.info(t.alreadyOwnedToast);
				goto(getHref('/dashboard'));
				return;
			}

			if (ebook.isFree || ebook.price === 0) {
				await handleFreeEnrollment();
			} else {
				try {
					const verification = await verifyLemonSqueezyPurchase(authState.user.email, 'ebook', ebook.id);
					if (verification.ok && verification.success) {
						toast.success(verification.message, 5000);
						setTimeout(() => goto(getHref('/dashboard#sec-ebooks')), 1800);
						return;
					}
				} catch (err) {
					console.warn('[Checkout] Lemon Squeezy precheck failed, fallback to payment modal:', err);
				}
				showPaymentModal = true;
			}
		} catch (e) {
			console.error('Check ebook access error:', e);
			showPaymentModal = true;
		} finally {
			checkoutLoading = false;
		}
	}

	async function handleFreeEnrollment() {
		if (!ebook) return;
		if (!authState.user) {
			toast.info(t.loginFreeToast);
			authState.openLogin(() => {
				handleFreeEnrollment();
			});
			return;
		}
		checkoutLoading = true;
		try {
			await claimFreeEbook(ebook.id);
			toast.success(t.freeClaimToast);
			await goto(getHref('/dashboard#sec-ebooks'));
		} catch (caught) {
			toast.error(caught instanceof Error ? caught.message : t.errorClaimToast);
		} finally {
			checkoutLoading = false;
		}
	}

	async function handleSelectPaymentMethod(method: 'moncash' | 'natcash' | 'carte' | 'plopplop_carte') {
		if (!ebook || checkoutLoading) return;

		if (!authState.user || !authState.user.$id) {
			showPaymentModal = false;
			toast.info(t.loginToast);
			authState.openLogin(() => {
				handleBuyClick();
			});
			return;
		}

		checkoutLoading = true;
		try {
			const userId = authState.user.$id;
			const userName = authState.user.name || 'Client';
			const userEmail = authState.user.email || '';

			const existingAccess = await ownsEbook(ebook.id);
			if (existingAccess) {
				showPaymentModal = false;
				toast.info(t.alreadyOwnedToast);
				goto(getHref('/dashboard'));
				return;
			}

			const res = await initiatePlopplopPayment({
				userId,
				customerName: userName,
				customerEmail: userEmail,
				productType: 'ebook',
				productId: ebook.id,
				productTitle: ebook.title,
				amount: ebook.price,
				paymentMethod: method
			});

			const redirectTarget = res?.url || res?.redirectUrl;
			if (res && res.success && redirectTarget) {
				window.location.href = redirectTarget;
				return;
			} else {
				toast.error(res?.message || t.errorPayment);
			}
		} catch (e: any) {
			console.error('Plopplop ebook payment error:', e);
			toast.error(e?.message || t.errorPayment);
		} finally {
			checkoutLoading = false;
		}
	}
</script>

<svelte:head>
	<title>{ebook ? t.metaTitle(ebook.title) : t.metaTitle('Ebook')}</title>
	<meta name="description" content={t.metaDesc(ebook?.description ?? '')} />
</svelte:head>

{#if loading}
	<div class="min-h-screen flex items-center justify-center bg-zinc-950 text-white">
		<div class="text-center space-y-4">
			<Loader2 size={32} class="mx-auto animate-spin text-amber-400" />
			<p class="text-zinc-400 text-sm">{t.loading}</p>
		</div>
	</div>
{:else if !ebook}
	<div class="min-h-screen flex items-center justify-center bg-zinc-950 text-white">
		<div class="text-center space-y-4">
			<p class="text-zinc-400 text-sm">{t.notFound}</p>
			<button
				type="button"
				onclick={() => goto(getHref('/'))}
				class="inline-flex items-center gap-2 px-6 py-3 bg-white text-black text-sm font-bold hover:bg-zinc-100 transition-colors"
			>
				<ChevronLeft size={16} />
				{t.backHome}
			</button>
		</div>
	</div>
{:else}
	<div class="min-h-screen bg-white flex flex-col font-sans">
		<PublicHeader />

		<main class="flex-1">

			<!-- Hero -->
			<section class="bg-zinc-950 text-white py-16 sm:py-20">
				<div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
					<button
						type="button"
						onclick={() => goto(getHref('/#ebooks'))}
						class="inline-flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-colors mb-8 font-medium"
					>
						<ChevronLeft size={14} />
						{t.backEbooks}
					</button>

					<div class="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

						<!-- Left: Info -->
						<div class="space-y-6 order-2 lg:order-1">
							<div class="flex items-center gap-2">
								<div class="size-7 bg-amber-400 text-black grid place-items-center rounded-md">
									<FileText size={14} />
								</div>
								<span class="text-xs font-bold text-white/40 uppercase tracking-widest">{t.kicker}</span>
							</div>

							<h1 class="text-3xl sm:text-4xl lg:text-5xl font-black leading-tight tracking-tight">
								{ebook.title}
							</h1>

							<p class="text-white/60 text-base leading-relaxed max-w-lg">
								{ebook.description}
							</p>

							<!-- What's included -->
							<div class="space-y-2">
								{#each t.features as feature}
									<div class="flex items-center gap-2.5 text-sm text-white/60">
										<CheckCircle2 size={15} class="text-emerald-400 shrink-0" />
										{feature}
									</div>
								{/each}
							</div>

							<!-- Stats -->
							<div class="flex items-center gap-5 py-4 border-y border-white/10">
								<div class="flex items-center gap-1.5 text-sm text-white/50">
									<ShoppingBag size={15} class="text-white/30" />
									<span class="font-semibold text-white">{t.salesCount(ebook.salesCount)}</span>
								</div>
								<div class="flex items-center gap-1.5 text-sm text-white/50">
									<Download size={15} class="text-white/30" />
									{t.formatPdf}
								</div>
							</div>

							<!-- Price + CTA -->
							<div class="flex flex-col sm:flex-row items-start sm:items-center gap-4">
								<div>
									{#if ebook.isFree || ebook.price === 0}
										<span class="text-4xl font-black text-emerald-400">{t.free}</span>
									{:else}
										<span class="text-4xl font-black text-white">{formatPublicPrice(ebook.price, ebook.priceUsd)}</span>
									{/if}
								</div>
								<button
									type="button"
									disabled={checkoutLoading}
									onclick={handleBuyClick}
									class="inline-flex items-center justify-center gap-2 h-14 px-10 bg-amber-400 hover:bg-amber-300 text-black font-black text-sm transition-colors shadow-xl shadow-amber-500/20 cursor-pointer disabled:opacity-50"
								>
									<Download size={17} />
									{#if checkoutLoading}
										<span>{t.loadingBtn}</span>
									{:else if ebook.isFree || ebook.price === 0}
										{t.btnFree}
									{:else}
										{t.btnBuy}
									{/if}
								</button>
							</div>
						</div>

						<!-- Right: Book cover -->
						<div class="order-1 lg:order-2 flex justify-center lg:justify-end">
							<div class="relative" style="max-width: 280px; width: 100%;">
								<!-- Book shadow effect -->
								<div class="absolute inset-0 translate-x-3 translate-y-3 bg-amber-400/20 rounded-2xl blur-sm"></div>
								<div class="relative rounded-2xl overflow-hidden shadow-2xl border border-white/10" style="aspect-ratio: 3/4;">
									{#if ebook.cover}
										<img
											src={ebook.cover}
											alt={ebook.title}
											class="w-full h-full bg-zinc-900 object-contain"
										/>
									{:else}
										<div class="w-full h-full flex flex-col items-center justify-center gap-4 bg-gradient-to-br from-zinc-700 to-zinc-800">
											<FileText size={48} class="text-zinc-500" />
											<span class="text-zinc-400 font-bold text-sm">PDF</span>
										</div>
									{/if}
									<!-- Overlay badge -->
									<div class="absolute top-4 right-4 px-2.5 py-1 bg-amber-400 text-black text-[10px] font-black uppercase tracking-widest rounded-full">
										PDF
									</div>
								</div>
							</div>
						</div>

					</div>
				</div>
			</section>

			<!-- Description section -->
			<section class="py-14 bg-white border-b border-zinc-100">
				<div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
					<div>
						<h2 class="text-xl font-black text-zinc-950 mb-4 tracking-tight">{t.aboutTitle}</h2>
						<p class="text-zinc-500 text-sm leading-relaxed">
							{ebook.description} {t.aboutDescSuffix}
						</p>
					</div>

					<!-- Feature grid -->
					<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
						{#each t.featGrid as feat}
							<div class="flex items-start gap-4 p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
								<span class="text-2xl shrink-0">{feat.icon}</span>
								<div>
									<p class="font-black text-sm text-zinc-950">{feat.title}</p>
									<p class="text-xs text-zinc-400 mt-0.5">{feat.desc}</p>
								</div>
							</div>
						{/each}
					</div>
				</div>
			</section>

			<!-- CTA Bottom -->
			<section class="py-14 bg-zinc-950 text-white text-center">
				<div class="max-w-xl mx-auto px-4 space-y-5">
					<h2 class="text-2xl sm:text-3xl font-black tracking-tight">{ebook.title}</h2>
					<p class="text-white/50 text-sm leading-relaxed">{ebook.description}</p>
					<div class="flex flex-col sm:flex-row items-center justify-center gap-4">
						{#if ebook.isFree || ebook.price === 0}
							<span class="text-3xl font-black text-emerald-400">{t.free}</span>
						{:else}
							<span class="text-3xl font-black">{formatPublicPrice(ebook.price, ebook.priceUsd)}</span>
						{/if}
						<button
							type="button"
							disabled={checkoutLoading}
							onclick={handleBuyClick}
							class="inline-flex items-center gap-2 px-8 py-3.5 bg-amber-400 hover:bg-amber-300 text-black font-black text-sm transition-colors cursor-pointer disabled:opacity-50"
						>
							<Download size={15} />
							{ebook.isFree || ebook.price === 0 ? t.btnFree : t.btnBuyBottom}
						</button>
					</div>
					<p class="text-white/30 text-xs">
						{t.questions} <a href={getHref('/contact')} class="underline hover:text-white/60 transition-colors">{t.contactForm}</a>
					</p>
				</div>
			</section>

		</main>

		<PublicFooter />
	</div>
{/if}

{#if ebook}
	<PaymentMethodModal
		open={showPaymentModal}
		productTitle={ebook.title}
		amount={ebook.price}
		amountUsd={ebook.priceUsd}
		isFree={ebook.isFree || ebook.price === 0}
		loading={checkoutLoading}
		onSelectMethod={handleSelectPaymentMethod}
		onClose={() => (showPaymentModal = false)}
	/>
{/if}
