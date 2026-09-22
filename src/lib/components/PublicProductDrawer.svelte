<script lang="ts">
	import type { Course, Ebook } from '$lib/types/admin';
	import type { CoachingService } from '$lib/types/coaching';
	import {
		X,
		BookOpen,
		FileText,
		CalendarCheck,
		CheckCircle2,
		Clock,
		CreditCard,
		Download,
		MessageSquare,
		Sparkles,
		Loader2
	} from 'lucide-svelte';
	import { authState } from '$lib/auth.svelte';
	import { claimFreeCourse, hasCourseAccess } from '$lib/services/courses';
	import { goto } from '$app/navigation';

	let {
		open = false,
		item = null,
		type = 'course',
		onClose
	}: {
		open: boolean;
		item: Course | Ebook | CoachingService | null;
		type: 'course' | 'ebook' | 'coaching';
		onClose: () => void;
	} = $props();

	let isCourse = $derived(type === 'course' && item !== null);
	let isEbook = $derived(type === 'ebook' && item !== null);
	let isCoaching = $derived(type === 'coaching' && item !== null);

	let courseItem = $derived(isCourse ? (item as Course) : null);
	let ebookItem = $derived(isEbook ? (item as Ebook) : null);
	let coachingItem = $derived(isCoaching ? (item as CoachingService) : null);

	import PaymentMethodModal from '$lib/components/PaymentMethodModal.svelte';
	import MaintenanceModal from '$lib/components/MaintenanceModal.svelte';
	import { getMaintenanceStatus } from '$lib/services/maintenance';
	import { initiatePlopplopPayment, verifyLemonSqueezyPurchase } from '$lib/services/payments';
	import { claimFreeEbook, ownsEbook } from '$lib/services/ebook-access';

	let checkoutSuccess = $state(false);
	let checkoutLoading = $state(false);
	let showPaymentModal = $state(false);
	let showMaintenanceModal = $state(false);

	let currentAmount = $derived.by(() => {
		if (isCourse && courseItem) return courseItem.price || 0;
		if (isEbook && ebookItem) return ebookItem.price || 0;
		if (isCoaching && coachingItem) return coachingItem.price || 0;
		return 0;
	});

	let currentIsFree = $derived.by(() => {
		if (isCourse && courseItem) return courseItem.isFree || currentAmount === 0;
		if (isEbook && ebookItem) return ebookItem.isFree || currentAmount === 0;
		if (isCoaching && coachingItem) return coachingItem.isFree || currentAmount === 0;
		return false;
	});

	import { toast } from '$lib/toast.svelte';
	import { page } from '$app/state';

	let currentLang = $derived<'fr' | 'ht'>(page.url.searchParams.get('lang') === 'ht' ? 'ht' : 'fr');

	const drawerI18n = {
		fr: {
			loginToast: 'Veuillez vous connecter à votre compte pour continuer.',
			alreadyOwnedToast: 'Vous possédez déjà ce programme ! Redirection en cours...',
			freeAccessToast: 'Veuillez vous connecter à votre compte pour débloquer cet accès gratuit.',
			unlockedSuccess: 'Accès débloqué avec succès !',
			unlockedError: 'Une erreur est survenue lors de l\'activation de votre accès.',
			paymentLoginToast: 'Veuillez vous connecter à votre compte pour effectuer le paiement.',
			paymentError: 'Impossible de lancer le paiement. Veuillez réessayer.',
			paymentProcessError: 'Une erreur est survenue lors du traitement du paiement.',
			badgeCourse: 'Formation',
			badgeEbook: 'Ebook PDF',
			badgeCoaching: 'Coaching 1:1',
			programPriceLabel: 'Prix du programme',
			freeLabel: 'Gratuit',
			programOutline: 'Programme de la formation',
			modulesCount: (count: number) => `(${count} modules)`,
			lessonsSummary: (count: number) => `${count} leçons vidéo et fiches récapitulatives`,
			fileDetails: 'Détails du fichier',
			formatLabel: 'Format :',
			formatValue: 'PDF Haute Qualité',
			fileLabel: 'Fichier :',
			downloadLabel: 'Téléchargement :',
			downloadValue: 'Accès immédiat après achat',
			chooseDateTitle: 'Choisissez votre date',
			chooseDateSub: 'Les dates disponibles apparaîtront sur la page de réservation.',
			unlockedBanner: 'Accès débloqué avec succès !',
			redirectingBanner: 'Redirection vers votre espace étudiant...',
			processingBtn: 'Traitement en cours...',
			getFreeAccessBtn: 'Obtenir l\'accès gratuit',
			payAmountBtn: (amount: string) => `Payer ${amount} HTG (Choisir le moyen)`,
			secureNotice: 'Paiement sécurisé · Support client sur WhatsApp'
		},
		ht: {
			loginToast: 'Tanpri konekte sou kont ou pou w ka kontinye.',
			alreadyOwnedToast: 'Ou gen pwogram sa a deja! N ap redirije w nan espas ou an.',
			freeAccessToast: 'Tanpri konekte sou kont ou pou w ka jwenn aksè nan pwogram sa a.',
			unlockedSuccess: 'Aksè debloke ak siksè!',
			unlockedError: 'Yon erè rive pandan n ap ba w aksè nan pwogram nan.',
			paymentLoginToast: 'Tanpri konekte sou kont ou pou w ka fè peman an.',
			paymentError: 'Nou pa ka lanse peman an. Tanpri eseye ankò.',
			paymentProcessError: 'Yon erè rive pandan n ap trete peman an.',
			badgeCourse: 'Fòmasyon',
			badgeEbook: 'Ebook PDF',
			badgeCoaching: 'Coaching 1:1',
			programPriceLabel: 'Prix pwogram an',
			freeLabel: 'Gratis',
			programOutline: 'Pwogram fòmasyon an',
			modulesCount: (count: number) => `(${count} modil)`,
			lessonsSummary: (count: number) => `${count} leson videyo ak feyè rezime`,
			fileDetails: 'Detay fichye a',
			formatLabel: 'Fòma :',
			formatValue: 'PDF Kvalite Gwo',
			fileLabel: 'Fichye :',
			downloadLabel: 'Telechajman :',
			downloadValue: 'Aksè imedyat apre achte',
			chooseDateTitle: 'Chwazi dat ou a',
			chooseDateSub: 'Dat ki disponib yo ap parèt sou paj rezèvasyon an.',
			unlockedBanner: 'Aksè debloke ak siksè !',
			redirectingBanner: 'Redirèksyon nan espas etidyan ou...',
			processingBtn: 'Tretman an ap fèt...',
			getFreeAccessBtn: 'Jwenn aksè gratis',
			payAmountBtn: (amount: string) => `Peye ${amount} HTG (Chwazi fason)`,
			secureNotice: 'Peman ansekirite · Sipò kliyan sou WhatsApp'
		}
	};

	let dt = $derived(drawerI18n[currentLang]);

	async function showMaintenanceIfEnabled(): Promise<boolean> {
		try {
			const status = await getMaintenanceStatus();
			if (status.enabled) showMaintenanceModal = true;
			return status.enabled;
		} catch {
			return false;
		}
	}

	async function handleStartCheckout() {
		if (!item || checkoutLoading) return;
		checkoutLoading = true;
		if (await showMaintenanceIfEnabled()) {
			checkoutLoading = false;
			return;
		}

		// 1. Vérifier si l'utilisateur est connecté
		if (!authState.user || !authState.user.$id) {
			checkoutLoading = false;
			toast.info(dt.loginToast);
			authState.openLogin(() => {
				handleStartCheckout();
			});
			return;
		}

		if (type === "coaching" && coachingItem) {
			checkoutLoading = false;
			onClose();
			await goto(`/coaching/${coachingItem.slug}`);
			return;
		}

		// 2. Vérifier si l'utilisateur possède déjà le produit (cours ou ebook)
		if (type === 'course' || type === 'ebook') {
			checkoutLoading = true;
			try {
				const existingAccess = type === 'ebook' ? await ownsEbook(item.id) : await hasCourseAccess(item.id);
				if (existingAccess) {
					toast.info(dt.alreadyOwnedToast);
					onClose();
					goto('/dashboard');
					return;
				}
				if (!currentIsFree) {
					try {
						const verification = await verifyLemonSqueezyPurchase(authState.user.email, type, item.id);
						if (verification.ok && verification.success) {
							const purchasedType = type;
							const purchasedId = item.id;
							toast.success(verification.message, 5000);
							onClose();
							setTimeout(() => goto(purchasedType === 'course' ? `/learn/${purchasedId}` : '/dashboard#sec-ebooks'), 1800);
							return;
						}
					} catch (err) {
						console.warn('[Checkout] Lemon Squeezy precheck failed, fallback to payment modal:', err);
					}
				}
			} catch (e) {
				console.error('Check access error:', e);
			} finally {
				checkoutLoading = false;
			}
		}

		if (currentIsFree) {
			processFreeEnrollment();
		} else {
			showPaymentModal = true;
		}
	}

	async function processFreeEnrollment() {
		if (!item) return;

		if (!authState.user || !authState.user.$id) {
			toast.info(dt.freeAccessToast);
			authState.openLogin(() => {
				processFreeEnrollment();
			});
			return;
		}

		checkoutLoading = true;
		try {
			if (type === "ebook") {
				await claimFreeEbook(item.id);
			} else if (type === "course") {
				await claimFreeCourse(item.id);
			}

			checkoutSuccess = true;
			toast.success(dt.unlockedSuccess);
			setTimeout(() => {
				checkoutSuccess = false;
				onClose();
				goto('/dashboard');
			}, 1500);
		} catch (e) {
			console.error('Free enrollment error:', e);
			toast.error(dt.unlockedError);
		} finally {
			checkoutLoading = false;
		}
	}

	async function handleSelectPaymentMethod(method: 'moncash' | 'natcash' | 'carte' | 'plopplop_carte') {
		if (!item || checkoutLoading) return;
		if (await showMaintenanceIfEnabled()) {
			showPaymentModal = false;
			return;
		}

		// 1. Connexion requise
		if (!authState.user || !authState.user.$id) {
			showPaymentModal = false;
			toast.info(dt.paymentLoginToast);
			authState.openLogin(() => {
				handleStartCheckout();
			});
			return;
		}

		checkoutLoading = true;
		try {
			const userId = authState.user.$id;
			const userName = authState.user.name || 'Client';
			const userEmail = authState.user.email || '';

			// 2. Re-vérification si l'utilisateur possède déjà le produit
			if (type === 'course' || type === 'ebook') {
				const existingAccess = type === 'ebook' ? await ownsEbook(item.id) : await hasCourseAccess(item.id);
				if (existingAccess) {
					showPaymentModal = false;
					toast.info(dt.alreadyOwnedToast);
					onClose();
					goto('/dashboard');
					return;
				}
			}

			const res = await initiatePlopplopPayment({
				userId,
				customerName: userName,
				customerEmail: userEmail,
				productType: type as any,
				productId: item.id,
				productTitle: item.title,
				amount: currentAmount,
				paymentMethod: method
			});

			const redirectTarget = res?.url || res?.redirectUrl;
			if (res && res.success && redirectTarget) {
				window.location.href = redirectTarget;
				return;
			} else {
				toast.error(res?.message || dt.paymentError);
			}
		} catch (e: any) {
			console.error('Plopplop payment initiation error:', e);
			toast.error(e?.message || dt.paymentProcessError);
		} finally {
			checkoutLoading = false;
		}
	}
</script>

{#if open && item}
	<!-- Backdrop Overlay -->
	<button
		type="button"
		class="fixed inset-0 bg-black/60 z-50 transition-opacity backdrop-blur-xs"
		onclick={onClose}
		aria-label="Fermer le tiroir produit"
	></button>

	<!-- Right Slide Drawer -->
	<div
		class="fixed right-0 top-0 bottom-0 h-full w-full max-w-lg bg-base-100 shadow-2xl flex flex-col z-50 overflow-hidden border-l border-base-200"
		role="dialog"
		aria-modal="true"
		aria-labelledby="product-drawer-title"
	>
		<!-- Sticky Top Header -->
		<div class="p-6 border-b border-base-200 flex items-center justify-between shrink-0 bg-base-100">
			<div class="flex items-center gap-2">
				{#if isCourse}
					<span class="badge bg-black text-white font-bold text-[10px] uppercase rounded-none px-2 py-0.5">
						Fòmasyon
					</span>
				{:else if isEbook}
					<span class="badge badge-secondary font-bold text-[10px] uppercase rounded-none px-2 py-0.5">
						Ebook PDF
					</span>
				{:else}
					<span class="badge badge-accent font-bold text-[10px] uppercase rounded-none px-2 py-0.5">
						Coaching 1:1
					</span>
				{/if}

				<span class="text-xs text-base-content/60 font-semibold">
					DJR Akademi
				</span>
			</div>

			<button
				type="button"
				class="btn btn-ghost btn-square btn-sm rounded-none text-base-content/70 hover:text-base-content"
				onclick={onClose}
			>
				<X size={20} />
			</button>
		</div>

		<!-- Body Details with internal scrollbar -->
		<div class="p-6 flex-1 overflow-y-auto space-y-6 text-xs min-h-0">
			<!-- Product Visual / Cover Header -->
			{#if isCourse && courseItem?.cover}
				<div class="aspect-video bg-base-200 overflow-hidden border border-base-200">
					<img src={courseItem.cover} alt={courseItem.title} class="w-full h-full object-cover" />
				</div>
			{:else if isEbook && ebookItem?.cover}
				<div class="aspect-4/3 bg-base-200 overflow-hidden border border-base-200 max-w-xs mx-auto">
					<img src={ebookItem.cover} alt={ebookItem.title} class="w-full h-full object-cover" />
				</div>
			{:else if isCoaching}
				<div class="p-6 bg-primary/10 border border-primary/20 flex items-center gap-4">
					<div class="size-12 bg-primary text-primary-content grid place-items-center shrink-0">
						<CalendarCheck size={24} />
					</div>
					<div>
						<span class="font-bold text-sm text-base-content block">{coachingItem?.title}</span>
						<span class="text-xs text-base-content/65 font-medium">{coachingItem?.durationMinutes} minit sesyon endividyèl</span>
					</div>
				</div>
			{/if}

			<!-- Title & Price Block -->
			<div class="space-y-2">
				<h2 id="product-drawer-title" class="text-xl font-bold text-base-content tracking-tight">
					{item.title}
				</h2>
				<p class="text-xs text-base-content/70 leading-relaxed">
					{item.description}
				</p>
			</div>

			<!-- Price Box -->
			<div class="p-4 bg-base-200/50 border border-base-200 flex items-center justify-between">
				<span class="font-semibold text-xs text-base-content/70">Prix pwogram an</span>
				{#if ('isFree' in item && item.isFree) || item.price === 0}
					<span class="text-xl font-extrabold text-success">Gratis</span>
				{:else}
					<div class="text-right">
						<span class="text-xl font-black text-base-content block">
							{item.price.toLocaleString('fr-FR')} HTG
						</span>
						{#if 'priceUsd' in item && item.priceUsd && item.priceUsd > 0}
							<span class="text-xs font-bold text-amber-600 block">
								(${item.priceUsd} USD)
							</span>
						{/if}
					</div>
				{/if}
			</div>

			<!-- Content Preview List -->
			{#if isCourse && courseItem?.modules}
				<div class="space-y-3">
					<span class="font-bold text-xs text-base-content block uppercase tracking-wider text-[11px] text-base-content/60">
						Pwogram fòmasyon an ({courseItem.modules.length} modil)
					</span>
					<div class="space-y-2">
						{#each courseItem.modules as module, i}
							<div class="p-3 bg-base-200/40 border border-base-200/80 space-y-1">
								<span class="font-bold text-xs text-base-content block">{module.title}</span>
								<p class="text-[11px] text-base-content/60">
									{module.lessons.length} leson videyo ak feyè rezime
								</p>
							</div>
						{/each}
					</div>
				</div>
			{:else if isEbook && ebookItem}
				<div class="space-y-3">
					<span class="font-bold text-xs text-base-content block uppercase tracking-wider text-[11px] text-base-content/60">
						Detay fichye a
					</span>
					<div class="p-4 bg-base-200/40 border border-base-200 space-y-2 font-mono text-[11px]">
						<div class="flex justify-between">
							<span class="text-base-content/60">Fòma :</span>
							<span class="font-bold text-base-content">PDF Kvalite Gwo</span>
						</div>
						<div class="flex justify-between">
							<span class="text-base-content/60">Fichye :</span>
							<span class="font-bold text-base-content">{ebookItem.fileName}</span>
						</div>
						<div class="flex justify-between">
							<span class="text-base-content/60">Telechajman :</span>
							<span class="font-bold text-success">Aksè imedyat apre achte</span>
						</div>
					</div>
				</div>
			{:else if isCoaching && coachingItem}
				<div class="border border-base-200 bg-base-200/40 p-4">
					<p class="font-bold text-base-content">Chwazi dat ou a</p>
					<p class="mt-1 text-[11px] leading-relaxed text-base-content/60">Dat ki disponib yo ap parèt sou paj rezèvasyon an.</p>
				</div>
			{/if}

			{#if checkoutSuccess}
				<div class="p-4 bg-success/15 text-success border border-success/30 font-bold text-xs text-center space-y-1">
					<CheckCircle2 size={24} class="mx-auto text-success" />
					<p>Aksè debloke ak siksè !</p>
					<p class="text-[11px] font-normal text-success/80">Redirèksyon nan espas etidyan ou...</p>
				</div>
			{/if}
		</div>

		<!-- Footer CTA Actions -->
		<div class="p-6 border-t border-base-200 bg-base-100 shrink-0 space-y-2">
			<button
				type="button"
				disabled={checkoutLoading || checkoutSuccess}
				class="btn bg-black text-white hover:bg-black/90 w-full rounded-none h-12 font-bold text-xs gap-2 border-none shadow-sm disabled:opacity-50"
				onclick={handleStartCheckout}
			>
				{#if checkoutLoading}
					<Loader2 size={16} class="animate-spin" />
					<span>Tretman an ap fèt...</span>
				{:else}
					<CreditCard size={16} />
					{#if currentIsFree}
						<span>Jwenn aksè gratis</span>
					{:else}
						<span>Peye {currentAmount.toLocaleString('fr-FR')} HTG (Chwazi fason)</span>
					{/if}
				{/if}
			</button>

			<p class="text-[10px] text-center text-base-content/50 font-medium">
				Peman ansekirite · Sipò kliyan sou WhatsApp
			</p>
		</div>
	</div>
{/if}

<!-- Payment Method Selection Modal -->
{#if item}
	<PaymentMethodModal
		open={showPaymentModal}
		productTitle={item.title}
		amount={currentAmount}
		amountUsd={item.priceUsd}
		isFree={currentIsFree}
		loading={checkoutLoading}
		onSelectMethod={handleSelectPaymentMethod}
		onClose={() => (showPaymentModal = false)}
	/>
{/if}


<MaintenanceModal open={showMaintenanceModal} onClose={() => (showMaintenanceModal = false)} />
