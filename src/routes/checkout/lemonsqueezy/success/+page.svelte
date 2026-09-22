<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import {
		CheckCircle2,
		Loader2,
		AlertCircle,
		AlertTriangle,
		HelpCircle,
		BookOpen,
		FileText,
		CalendarClock,
		ArrowRight,
		Receipt,
		Printer,
		MessageSquare,
		Sparkles,
		ShieldCheck,
		LayoutDashboard,
		RefreshCw
	} from 'lucide-svelte';

	interface LemonOrder {
		id: string;
		customerName: string;
		customerEmail: string;
		productType: 'course' | 'ebook' | 'coaching' | 'bundle';
		productId: string;
		productTitle: string;
		amount: number;
		currency: string;
		paymentProvider: string;
		status: 'paid' | 'pending' | 'failed' | 'expired';
		createdAt: string;
		paidAt?: string;
	}

	let currentLang = $derived<'fr' | 'ht'>(page.url.searchParams.get('lang') === 'ht' ? 'ht' : 'fr');

	function getHref(path: string) {
		return currentLang === 'ht' ? `${path}?lang=ht` : path;
	}

	const i18n = {
		fr: {
			title: 'Confirmation Paiment Carte · DJR Akademi',
			verifyingTitle: 'Vérification du paiement par carte (Lemon Squeezy)…',
			verifyingDesc: 'Nous vérifions la confirmation de la transaction par carte.',
			missingOrderIdMsg: 'Aucun numéro de commande trouvé dans le lien.',
			missingBadge: 'Lien incomplet',
			missingHeading: 'Aucun numéro de commande trouvé',
			missingDesc: 'Cette page requiert un code de transaction pour afficher votre reçu. Si vous avez effectué un achat par carte, veuillez vérifier le lien dans votre e-mail de confirmation ou consulter vos transactions.',
			viewTransactionsBtn: 'Consulter mes transactions',
			goToDashboardBtn: 'Aller sur mon Espace',
			verifyingBadge: 'Vérification Paiement Carte',
			orderLabel: 'Commande #',
			reverifyBtn: 'Re-vérifier mon accès maintenant',
			reverifyingBtn: 'Re-vérification en cours…',
			paidAlreadyQ: 'Paiement déjà débité ?',
			paidAlreadyDesc: 'Si votre transaction est confirmée sur votre carte mais toujours indisponible, contactez notre support.',
			contactSupportBtn: 'Support Client (Contact)',
			cardConfirmedBadge: 'Paiement par Carte Confirmé (Lemon Squeezy)',
			thanksOrderTitle: 'Merci pour votre commande !',
			unlockedDesc: 'Votre transaction est confirmée dans le système. Votre accès est débloqué dans votre compte.',
			typeCourse: 'Formation en ligne',
			typeEbook: 'E-book PDF',
			typeBundle: 'Bundle',
			typeCoaching: 'Session Coaching',
			customerLabel: 'Client :',
			amountPaidLabel: 'Montant payé (USD)',
			receiptDetailsTitle: 'Détails du reçu',
			paymentStatusLabel: 'Statut du paiement',
			paidStatusText: 'Payé ✓',
			paymentMethodLabel: 'Moyen de paiement',
			paymentMethodText: 'Lemon Squeezy (Carte)',
			txDateLabel: 'Date de transaction',
			currencyLabel: 'Devise',
			followCourseNow: 'Suivre le cours maintenant',
			followDownloadEbook: 'Consulter & Télécharger l\'E-book',
			viewResourcesNow: 'Voir mes ressources',
			viewBookingDetails: 'Voir les détails du rendez-vous',
			viewAllTransactions: 'Voir toutes mes transactions',
			printReceiptBtn: 'Imprimer le reçu',
			cardQuestion: 'Une question concernant votre paiement par carte ?',
			whatsappSupport: 'Support WhatsApp Coaching',
			contactPageLink: 'Page Contact',
			defaultErrorText: 'Le paiement par carte est toujours en cours de traitement. Si vous avez déjà payé, cliquez sur le bouton ci-dessous pour re-vérifier votre accès.',
			verifyErrorText: 'Impossible de vérifier la transaction Lemon Squeezy.',
			networkErrorText: 'Erreur réseau lors de la vérification du paiement Lemon Squeezy.'
		},
		ht: {
			title: 'Konfimasyon Peman Kat · DJR Akademi',
			verifyingTitle: 'N ap verifye peman pa kat la (Lemon Squeezy)…',
			verifyingDesc: 'N ap verifye si w gen kou/ebook la deja oswa si tranzaksyon kat la konfime ak siksè.',
			missingOrderIdMsg: 'Okenn nimewo kòmand pa jwenn nan lyen an.',
			missingBadge: 'Lyen enkonplè',
			missingHeading: 'Okenn nimewo kòmand pa jwenn',
			missingDesc: 'Paj sa a mande yon kòd tranzaksyon pou l ka afiche resi w la. Si w te fè yon achte ak kat, tanpri verifye lyen ki nan imèl konfimasyon w la oswa konsilte istwa tranzaksyon w yo.',
			viewTransactionsBtn: 'Konsilte tranzaksyon m yo',
			goToDashboardBtn: 'Ale nan Espas mwen',
			verifyingBadge: 'Verifikasyon Peman Kat',
			orderLabel: 'Kòmand #',
			reverifyBtn: 'Re-verifye aksè mwen an kounye a',
			reverifyingBtn: 'N ap re-verifye...',
			paidAlreadyQ: 'Peman an te debouse deja ?',
			paidAlreadyDesc: 'Si tranzaksyon ou an konfime sou kat ou men li toujou endisponib, kontakte sipò nou an.',
			contactSupportBtn: 'Sipò Kliyan (Contact)',
			cardConfirmedBadge: 'Peman pa Kat Konfime (Lemon Squeezy)',
			thanksOrderTitle: 'Mèsi pou kòmand ou an !',
			unlockedDesc: 'Tranzaksyon ou an konfime nan sistèm nan. Aksè ou a debloke nèt nan kont ou.',
			typeCourse: 'Fòmasyon sou entènèt',
			typeEbook: 'E-book PDF',
			typeBundle: 'Bundle',
			typeCoaching: 'Sesyon Coaching',
			customerLabel: 'Kliyan :',
			amountPaidLabel: 'Montan peye (USD)',
			receiptDetailsTitle: 'Detay resi an',
			paymentStatusLabel: 'Sitiyasyon peman an',
			paidStatusText: 'Peye ✓',
			paymentMethodLabel: 'Mwayen peman',
			paymentMethodText: 'Lemon Squeezy (Kat)',
			txDateLabel: 'Dat tranzaksyon an',
			currencyLabel: 'Deviz',
			followCourseNow: 'Swiv kou a kounye a',
			followDownloadEbook: 'Swiv & Telechaje E-book la',
			viewResourcesNow: 'Gade resous mwen yo',
			viewBookingDetails: 'Gade detay rendez-vous an',
			viewAllTransactions: 'Gade tout tranzaksyon m yo',
			printReceiptBtn: 'Enprime resi an',
			cardQuestion: 'Ou gen yon kesyon sou peman pa kat ou an ?',
			whatsappSupport: 'Sipò WhatsApp Coaching',
			contactPageLink: 'Paj Kontakte n',
			defaultErrorText: 'Peman pa kat la ap trete toujou oswa li pa t ka konfime. Si w te peye deja, klike sou bouton anba a pou n re-verifye aksè w la.',
			verifyErrorText: 'Nou pa t ka verifye tranzaksyon Lemon Squeezy an.',
			networkErrorText: 'Erè rezo lè n t ap verifye peman Lemon Squeezy an.'
		}
	};

	let t = $derived(i18n[currentLang]);

	let orderId = $state<string | null>(null);
	let order = $state<LemonOrder | null>(null);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let verifying = $state(false);

	onMount(async () => {
		orderId =
			page.url.searchParams.get('order_id') ||
			page.url.searchParams.get('orderId') ||
			page.url.searchParams.get('refference_id') ||
			page.url.searchParams.get('id');

		if (!orderId) {
			error = i18n[currentLang].missingOrderIdMsg;
			loading = false;
			return;
		}

		await verifyLemonSqueezyOrder();
	});

	async function verifyLemonSqueezyOrder() {
		if (!orderId) return;
		loading = true;
		verifying = true;
		error = null;
		order = null;

		try {
			const res = await fetch(`/api/lemonsqueezy/verify?order_id=${encodeURIComponent(orderId)}`, {
				method: 'GET',
				headers: { Accept: 'application/json' }
			});
			const data = await res.json().catch(() => null);

			if (res.ok && data?.order) {
				order = data.order;
				if (data.order.status !== 'paid') {
					error = i18n[currentLang].defaultErrorText;
				}
			} else {
				error = data?.message || i18n[currentLang].verifyErrorText;
			}
		} catch {
			error = i18n[currentLang].networkErrorText;
		} finally {
			loading = false;
			verifying = false;
		}
	}

	function printReceipt() {
		window.print();
	}
</script>

<svelte:head>
	<title>{t.title}</title>
</svelte:head>

<div class="min-h-[85vh] bg-base-200/50 py-12 px-4 sm:px-6 lg:px-8 grid place-items-center">
	<div class="w-full max-w-2xl space-y-6">
		{#if loading}
			<!-- Loading State -->
			<div class="card bg-base-100 border border-base-300/80 shadow-xl p-10 text-center space-y-6 animate-pulse">
				<div class="relative mx-auto size-20 grid place-items-center">
					<div class="absolute inset-0 rounded-full border-4 border-amber-500/20 animate-ping"></div>
					<Loader2 size={44} class="animate-spin text-amber-500 relative z-10" />
				</div>
				<div class="space-y-2">
					<h1 class="text-xl sm:text-2xl font-bold text-base-content">{t.verifyingTitle}</h1>
					<p class="text-xs sm:text-sm text-base-content/60 max-w-md mx-auto">
						{t.verifyingDesc}
					</p>
				</div>
			</div>
		{:else if !orderId}
			<!-- Missing Order ID State -->
			<div class="card bg-base-100 border border-base-300/80 shadow-2xl overflow-hidden p-8 sm:p-10 text-center space-y-6">
				<div class="relative mx-auto size-20 grid place-items-center">
					<div class="absolute inset-0 rounded-full bg-amber-500/10 blur-xl"></div>
					<div class="grid size-16 place-items-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-1 ring-amber-500/20 shadow-inner">
						<HelpCircle size={36} />
					</div>
				</div>

				<div class="space-y-2">
					<div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 text-xs font-bold uppercase tracking-wider">
						{t.missingBadge}
					</div>
					<h1 class="text-2xl sm:text-3xl font-extrabold text-base-content tracking-tight">{t.missingHeading}</h1>
					<p class="text-sm text-base-content/65 max-w-md mx-auto leading-relaxed">
						{t.missingDesc}
					</p>
				</div>

				<div class="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
					<a href={getHref('/transactions')} class="btn bg-amber-500 hover:bg-amber-600 text-black border-none btn-md rounded-xl font-bold px-6 gap-2 w-full sm:w-auto shadow-md">
						<Receipt size={18} />
						{t.viewTransactionsBtn}
					</a>
					<a href={getHref('/dashboard')} class="btn btn-outline btn-md rounded-xl font-bold px-6 gap-2 w-full sm:w-auto">
						<LayoutDashboard size={18} />
						{t.goToDashboardBtn}
					</a>
				</div>
			</div>
		{:else if error && (!order || order.status !== 'paid')}
			<!-- Pending / Error State with orderId present -->
			<div class="card bg-base-100 border border-amber-500/30 shadow-2xl overflow-hidden p-8 sm:p-10 text-center space-y-6 relative">
				<div class="absolute -top-12 -right-12 size-36 bg-amber-500/10 rounded-full blur-2xl pointer-events-none"></div>

				<div class="relative mx-auto size-20 grid place-items-center">
					<div class="absolute inset-0 rounded-full bg-amber-500/20 animate-ping opacity-25"></div>
					<div class="grid size-16 place-items-center rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 ring-1 ring-amber-500/30 shadow-lg">
						<AlertTriangle size={36} />
					</div>
				</div>

				<div class="space-y-2">
					<div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 text-xs font-bold uppercase tracking-wider">
						<RefreshCw size={12} class={verifying ? "animate-spin" : ""} /> {t.verifyingBadge}
					</div>
					<h1 class="text-2xl sm:text-3xl font-extrabold text-base-content tracking-tight">{t.orderLabel}<span class="font-mono">{orderId}</span></h1>
					<p class="text-sm text-base-content/70 max-w-md mx-auto leading-relaxed">
						{error}
					</p>
				</div>

				<div class="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
					<button
						type="button"
						disabled={verifying}
						class="btn bg-amber-500 hover:bg-amber-600 text-black border-none btn-md rounded-xl font-bold px-6 gap-2 w-full sm:w-auto shadow-md transition-all duration-200 active:scale-95 disabled:opacity-50"
						onclick={verifyLemonSqueezyOrder}
					>
						<RefreshCw size={18} class={verifying ? "animate-spin" : ""} />
						{verifying ? t.reverifyingBtn : t.reverifyBtn}
					</button>
					<a href={getHref('/dashboard')} class="btn btn-outline btn-md rounded-xl font-bold px-6 gap-2 w-full sm:w-auto">
						<LayoutDashboard size={18} />
						{t.goToDashboardBtn}
					</a>
				</div>

				<div class="p-4 rounded-2xl bg-base-200/50 border border-base-300/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-left">
					<div class="space-y-0.5">
						<span class="font-bold text-base-content block">{t.paidAlreadyQ}</span>
						<span class="text-base-content/60">{t.paidAlreadyDesc}</span>
					</div>
					<a
						href={getHref('/contact')}
						class="btn btn-outline btn-xs sm:btn-sm border-base-300 font-bold rounded-xl shrink-0 gap-1.5"
					>
						{t.contactSupportBtn}
					</a>
				</div>
			</div>
		{:else if order}
			<!-- Success State -->
			<div class="card bg-base-100 border border-base-300/70 shadow-2xl overflow-hidden print:shadow-none print:border-none">
				<!-- Top Status Banner -->
				<div class="bg-gradient-to-tr from-zinc-950 via-zinc-900 to-zinc-800 text-white p-8 sm:p-10 text-center space-y-4 relative overflow-hidden">
					<div class="absolute -right-10 -bottom-10 opacity-10 pointer-events-none">
						<Sparkles size={200} />
					</div>

					<div class="grid size-20 place-items-center rounded-full bg-amber-500 text-black font-black mx-auto shadow-inner ring-4 ring-amber-400/30">
						<CheckCircle2 size={46} class="stroke-[2.5]" />
					</div>

					<div class="space-y-1">
						<div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-bold uppercase tracking-wider text-amber-400 mb-2">
							<ShieldCheck size={14} /> {t.cardConfirmedBadge}
						</div>
						<h1 class="text-2xl sm:text-4xl font-black tracking-tight">{t.thanksOrderTitle}</h1>
						<p class="text-xs sm:text-sm text-zinc-300 max-w-md mx-auto">
							{t.unlockedDesc}
						</p>
					</div>
				</div>

				<!-- Content Body -->
				<div class="p-6 sm:p-8 space-y-6">
					<!-- Purchased Item Card -->
					<div class="rounded-2xl border border-base-300/80 bg-base-200/40 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
						<div class="flex items-center gap-4">
							<div class="grid size-14 shrink-0 place-items-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
								{#if order.productType === 'course'}
									<BookOpen size={28} />
								{:else if order.productType === 'ebook'}
									<FileText size={28} />
								{:else}
									<CalendarClock size={28} />
								{/if}
							</div>
							<div>
								<span class="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md">
									{order.productType === 'course' ? t.typeCourse : order.productType === 'ebook' ? t.typeEbook : order.productType === 'bundle' ? t.typeBundle : t.typeCoaching}
								</span>
								<h2 class="text-base sm:text-lg font-bold text-base-content mt-1 line-clamp-1">{order.productTitle}</h2>
								<p class="text-xs text-base-content/50">{t.customerLabel} {order.customerName}</p>
							</div>
						</div>

						<div class="text-right sm:border-l sm:border-base-300 sm:pl-5 shrink-0">
							<span class="text-xs text-base-content/50 block">{t.amountPaidLabel}</span>
							<span class="text-xl font-extrabold text-base-content">{order.amount} USD</span>
						</div>
					</div>

					<!-- Receipt Details Table -->
					<div class="rounded-2xl border border-base-300/70 p-5 space-y-3 bg-base-100 text-xs">
						<div class="flex items-center justify-between border-b border-base-200 pb-3">
							<span class="font-bold text-base-content/70 flex items-center gap-1.5">
								<Receipt size={15} class="text-amber-500" /> {t.receiptDetailsTitle}
							</span>
							<span class="font-mono text-base-content/50"># {order.id.slice(0, 12)}</span>
						</div>

						<div class="grid grid-cols-2 gap-3 pt-1 text-xs">
							<div>
								<span class="text-base-content/50 block">{t.paymentStatusLabel}</span>
								<span class="font-bold text-emerald-600 dark:text-emerald-400 capitalize">{t.paidStatusText}</span>
							</div>
							<div>
								<span class="text-base-content/50 block">{t.paymentMethodLabel}</span>
								<span class="font-bold text-base-content uppercase">{t.paymentMethodText}</span>
							</div>
							<div>
								<span class="text-base-content/50 block">{t.txDateLabel}</span>
								<span class="font-medium text-base-content">
									{new Date(order.paidAt || order.createdAt).toLocaleDateString(currentLang === 'fr' ? 'fr-FR' : 'ht-HT', {
										day: 'numeric',
										month: 'long',
										year: 'numeric',
										hour: '2-digit',
										minute: '2-digit'
									})}
								</span>
							</div>
							<div>
								<span class="text-base-content/50 block">{t.currencyLabel}</span>
								<span class="font-mono font-bold text-base-content">USD</span>
							</div>
						</div>
					</div>

					<!-- Primary CTA Actions -->
					<div class="space-y-3 pt-2 print:hidden">
						{#if order.productType === 'course'}
							<a
								href={getHref(`/learn/${order.productId}`)}
								class="btn bg-zinc-950 hover:bg-zinc-800 text-white w-full min-h-12 rounded-xl text-sm font-bold shadow-md gap-2"
							>
								<span>{t.followCourseNow}</span>
								<ArrowRight size={18} />
							</a>
						{:else if order.productType === 'ebook'}
							<a
								href={getHref(`/ebooks/${order.productId}`)}
								class="btn bg-amber-500 hover:bg-amber-600 text-black w-full min-h-12 rounded-xl text-sm font-bold shadow-md gap-2"
							>
								<span>{t.followDownloadEbook}</span>
								<ArrowRight size={18} />
							</a>
						{:else if order.productType === 'bundle'}
							<a href={getHref('/dashboard')} class="btn btn-primary w-full min-h-12 rounded-xl text-sm font-bold shadow-md gap-2">{t.viewResourcesNow} <ArrowRight size={18} /></a>
						{:else}
							<a
								href={getHref(`/booking/${order.productId}/success`)}
								class="btn bg-zinc-950 hover:bg-zinc-800 text-white w-full min-h-12 rounded-xl text-sm font-bold shadow-md gap-2"
							>
								<span>{t.viewBookingDetails}</span>
								<ArrowRight size={18} />
							</a>
						{/if}

						<div class="flex flex-col sm:flex-row items-center gap-3">
							<a
								href={getHref('/transactions')}
								class="btn btn-outline min-h-10 flex-1 w-full rounded-xl text-xs font-semibold gap-1.5"
							>
								<Receipt size={15} /> {t.viewAllTransactions}
							</a>

							<button
								type="button"
								onclick={printReceipt}
								class="btn btn-ghost min-h-10 rounded-xl text-xs font-semibold gap-1.5 border border-base-300"
							>
								<Printer size={15} /> {t.printReceiptBtn}
							</button>
						</div>
					</div>

					<!-- Assistance Footer -->
					<div class="text-center pt-4 border-t border-base-200 text-xs text-base-content/60 print:hidden flex items-center justify-between">
						<span>{t.cardQuestion}</span>
						{#if order.productType === 'coaching'}
							<a
								href="https://wa.me/50937001234?text=Bonjou,%20mwen%20gen%20yon%20kesyon%20sou%20rez%C3%A8vasyon%20coaching%20mwen%20an"
								target="_blank"
								rel="noreferrer"
								class="text-emerald-600 dark:text-emerald-400 font-bold hover:underline inline-flex items-center gap-1"
							>
								<MessageSquare size={14} /> {t.whatsappSupport}
							</a>
						{:else}
							<a
								href={getHref('/contact')}
								class="text-primary font-bold hover:underline inline-flex items-center gap-1"
							>
								{t.contactPageLink}
							</a>
						{/if}
					</div>
				</div>
			</div>
		{/if}
	</div>
</div>
