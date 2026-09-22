<script lang="ts">
	import { onMount } from 'svelte';
	import PublicHeader from '$lib/components/PublicHeader.svelte';
	import PublicFooter from '$lib/components/PublicFooter.svelte';
	import { page } from '$app/state';
	import {
		Receipt,
		ChevronLeft,
		Download,
		CheckCircle2,
		CreditCard,
		Calendar,
		ArrowRight,
		Search,
		FileText,
		Printer,
		X,
		Clock,
		AlertCircle,
		Sparkles,
		ShoppingBag,
		ExternalLink,
		Copy,
		Check,
		ShieldCheck
	} from 'lucide-svelte';
	import { toast } from '$lib/toast.svelte';
	import { authState } from '$lib/auth.svelte';
	import { goto } from '$app/navigation';
	import { getUserOrders, type Order } from '$lib/services/orders';

	let currentLang = $derived<'fr' | 'ht'>(page.url.searchParams.get('lang') === 'ht' ? 'ht' : 'fr');

	function getHref(path: string) {
		return currentLang === 'ht' ? `${path}?lang=ht` : path;
	}

	const i18n = {
		fr: {
			pageTitle: 'Mes Transactions · DJR Akademi',
			metaDesc: 'Historique complet de vos commandes, reçus et factures de paiement sur DJR Akademi.',
			loadingMsg: 'Chargement de vos transactions...',
			backToSpace: 'Retour à mon espace',
			title: 'Mes Transactions',
			subtitle: 'Historique de vos commandes, factures et reçus de paiement.',
			verifyTitle: 'Vous avez un paiement qui ne s\'affiche pas ou un accès bloqué ?',
			verifySub: 'Utilisez la page de vérification pour chercher et débloquer votre commande immédiatement.',
			verifyBtn: 'Vérifier mon paiement',
			searchPlaceholder: 'Rechercher par produit ou ID de transaction...',
			filterAll: 'Tous',
			filterPaid: 'Payé',
			filterPending: 'En attente',
			historyTitle: 'Historique détaillé des paiements',
			currencyNote: 'Devises officielles : HTG / USD',
			emptyTitle: 'Aucune transaction trouvée',
			emptySubSearch: 'Aucun résultat ne correspond à votre recherche.',
			emptySubDefault: 'Vous n\'avez effectué aucun achat pour le moment. Explorez nos formations et ebooks !',
			exploreCatalog: 'Explorer le catalogue',
			statusPaid: 'Payé',
			statusPending: 'En attente',
			statusFailed: 'Échoué',
			productTypeLabel: 'Type :',
			providerLabel: 'Mode :',
			copyToast: 'Réf ID copié dans le presse-papier !',
			pdfReceipt: 'Reçu PDF',
			watchBtn: 'Suivre',
			ebookBtn: 'Ebook',
			sessionBtn: 'Session',
			receiptModalTitle: 'Reçu Officiel de Paiement',
			brandSub: 'Plateforme d\'apprentissage et de suivi',
			billedTo: 'Facturé à',
			paymentMethod: 'Mode de paiement',
			statusPaidTag: 'Statut : Payé ✓',
			productDescHeader: 'Description du produit',
			typeHeader: 'Type',
			amountHeader: 'Montant',
			subtotal: 'Sous-total :',
			fees: 'Frais de traitement :',
			totalAmount: 'Montant Total :',
			receiptThankYou: 'Merci pour votre confiance en DJR Akademi !',
			receiptElectronicNote: 'Ce reçu électronique constitue une preuve d\'achat officielle.',
			close: 'Fermer',
			printSavePdf: 'Imprimer / Sauvegarder en PDF',
			courseType: 'Formation vidéo',
			ebookType: 'Ebook PDF',
			coachingType: 'Session Coaching 1:1',
			digitalType: 'Produit digital'
		},
		ht: {
			pageTitle: 'Tranzaksyon Mwen Yo · DJR Akademi',
			metaDesc: 'Istwa konplè kòmand, resi ak faktir peman ou yo sou DJR Akademi.',
			loadingMsg: 'N ap chaje tranzaksyon ou yo...',
			backToSpace: 'Tounen nan espas mwen',
			title: 'Tranzaksyon Mwen Yo',
			subtitle: 'Istwa kòmand, faktir ak resi peman ou yo.',
			verifyTitle: 'Ou gen yon peman ki pa parèt oswa aksè ki pa debloke ?',
			verifySub: 'Sèvi ak paj verifikasyon an pou chèche epi debloke kòmand ou a imedyatman.',
			verifyBtn: 'Verifye peman m lan',
			searchPlaceholder: 'Chèche pa pwodui oswa ID tranzaksyon...',
			filterAll: 'Tout',
			filterPaid: 'Peye',
			filterPending: 'Enatant',
			historyTitle: 'Istwa detaye peman yo',
			currencyNote: 'Lajan ofisyèl : HTG / USD',
			emptyTitle: 'Pa gen okenn tranzaksyon ki jwenn',
			emptySubSearch: 'Pa gen okenn rezilta ki koresponn ak chèch ou an.',
			emptySubDefault: 'Ou poko fè okenn achte pou kounye a. Eksplore fòmasyon ak ebook nou yo pou kòmanse !',
			exploreCatalog: 'Eksplore katalòg la',
			statusPaid: 'Peye',
			statusPending: 'Enatant',
			statusFailed: 'Echwe',
			productTypeLabel: 'Fòm :',
			providerLabel: 'Fason :',
			copyToast: 'Réf ID kopye nan presse-papier !',
			pdfReceipt: 'Resi PDF',
			watchBtn: 'Swiv',
			ebookBtn: 'Ebook',
			sessionBtn: 'Sesyon',
			receiptModalTitle: 'Resi Ofisyèl Peman',
			brandSub: 'Platfòm aprantisaj ak swivi',
			billedTo: 'Faktire bay',
			paymentMethod: 'Mwayen peman',
			statusPaidTag: 'Sitiyasyon : Peye ✓',
			productDescHeader: 'Deskripsyon pwodui a',
			typeHeader: 'Kalite',
			amountHeader: 'Montan',
			subtotal: 'Sous-total :',
			fees: 'Frais tretman :',
			totalAmount: 'Montan Total :',
			receiptThankYou: 'Mèsi pou konfyans ou nan DJR Akademi !',
			receiptElectronicNote: 'Resi elektwonik sa a se yon prèv achte ofisyèl.',
			close: 'Fèmen',
			printSavePdf: 'Enprime / Sove an PDF',
			courseType: 'Fòmasyon videyo',
			ebookType: 'Ebook PDF',
			coachingType: 'Sesyon Coaching 1:1',
			digitalType: 'Pwodui dijital'
		}
	};
	let t = $derived(i18n[currentLang]);

	let loading = $state(true);
	let orders = $state<Order[]>([]);
	let searchQuery = $state('');
	let statusFilter = $state<'all' | 'paid' | 'pending' | 'failed'>('all');

	// Receipt Modal state
	let selectedOrderForInvoice = $state<Order | null>(null);
	let copiedOrderId = $state<string | null>(null);

	async function copyOrderId(orderId: string) {
		try {
			await navigator.clipboard.writeText(orderId);
			copiedOrderId = orderId;
			toast.success(t.copyToast);
			setTimeout(() => {
				if (copiedOrderId === orderId) copiedOrderId = null;
			}, 2000);
		} catch (e) {
			console.error('Copy error:', e);
		}
	}

	$effect(() => {
		if (!authState.loading && !authState.user) {
			goto(getHref('/'));
		}
	});

	onMount(async () => {
		if (authState.user) {
			await fetchUserTransactions();
		}
		loading = false;
	});

	$effect(() => {
		if (authState.user && !loading && orders.length === 0) {
			fetchUserTransactions();
		}
	});

	async function fetchUserTransactions() {
		if (!authState.user) return;
		loading = true;
		try {
			orders = await getUserOrders(authState.user.$id, authState.user.email);
		} catch (e) {
			console.error('Failed to load user transactions:', e);
		} finally {
			loading = false;
		}
	}

	// Filtered orders derivation
	let filteredOrders = $derived(
		orders.filter((order) => {
			const matchesSearch =
				order.productTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
				order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
				(order.paymentId && order.paymentId.toLowerCase().includes(searchQuery.toLowerCase()));

			const matchesStatus =
				statusFilter === 'all' ||
				(statusFilter === 'paid' && order.status === 'paid') ||
				(statusFilter === 'pending' && order.status === 'pending') ||
				(statusFilter === 'failed' && (order.status === 'failed' || order.status === 'expired'));

			return matchesSearch && matchesStatus;
		})
	);

	let paidCount = $derived(orders.filter((o) => o.status === 'paid').length);
	let totalSpent = $derived(
		orders
			.filter((o) => o.status === 'paid')
			.reduce((acc, curr) => acc + curr.amount, 0)
	);

	function formatDate(isoString: string): string {
		try {
			return new Date(isoString).toLocaleDateString(currentLang === 'ht' ? 'ht-HT' : 'fr-FR', {
				day: 'numeric',
				month: 'long',
				year: 'numeric',
				hour: '2-digit',
				minute: '2-digit'
			});
		} catch (e) {
			return isoString;
		}
	}

	function getProviderLabel(provider: string): string {
		switch (provider?.toLowerCase()) {
			case 'moncash':
				return 'MonCash';
			case 'natcash':
				return 'Natcash';
			case 'card':
				return currentLang === 'ht' ? 'Kat bankè' : 'Carte Bancaire';
			case 'free':
				return currentLang === 'ht' ? 'Gratis' : 'Gratuit';
			case 'admin':
				return currentLang === 'ht' ? 'Aksè Manwèl' : 'Accès Manuel';
			default:
				return provider || (currentLang === 'ht' ? 'Peman' : 'Paiement');
		}
	}

	function getProductTypeLabel(type: string): string {
		switch (type) {
			case 'course':
				return t.courseType;
			case 'ebook':
				return t.ebookType;
			case 'coaching':
				return t.coachingType;
			default:
				return t.digitalType;
		}
	}

	function openInvoiceModal(order: Order) {
		selectedOrderForInvoice = order;
	}

	function closeInvoiceModal() {
		selectedOrderForInvoice = null;
	}

	function printInvoice() {
		const cleanup = () => document.body.classList.remove('printing-invoice');
		document.body.classList.add('printing-invoice');
		window.addEventListener('afterprint', cleanup, { once: true });
		window.print();
	}
</script>

<svelte:head>
	<title>{t.pageTitle}</title>
	<meta name="description" content={t.metaDesc} />
</svelte:head>

<div class="min-h-screen bg-zinc-50 flex flex-col font-sans text-zinc-900">
	<PublicHeader />

	{#if authState.loading || loading}
		<div class="flex-1 flex items-center justify-center py-20">
			<div class="text-center space-y-3">
				<span class="loading loading-spinner text-amber-500 loading-lg"></span>
				<p class="text-xs font-semibold text-zinc-500">{t.loadingMsg}</p>
			</div>
		</div>
	{:else if authState.user}
		<main class="flex-1 py-10 sm:py-14">
			<div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">

				<!-- Back navigation button -->
				<a
					href={getHref('/dashboard')}
					class="inline-flex items-center gap-2 text-xs font-bold text-zinc-500 hover:text-zinc-950 transition-colors"
				>
					<ChevronLeft size={16} />
					{t.backToSpace}
				</a>

				<!-- Page Header Banner -->
				<div class="bg-zinc-950 text-white rounded-3xl p-6 sm:p-8 flex items-center justify-between gap-6 shadow-xl border border-zinc-800">
					<div class="flex items-center gap-4">
						<div class="size-14 bg-gradient-to-br from-amber-400 to-orange-500 text-black text-xl font-black rounded-2xl grid place-items-center shadow-lg shrink-0">
							<Receipt size={26} />
						</div>
						<div class="space-y-1">
							<h1 class="text-2xl sm:text-3xl font-black tracking-tight">{t.title}</h1>
							<p class="text-white/60 text-xs font-medium">
								{t.subtitle}
							</p>
						</div>
					</div>
				</div>

				<!-- Verification Callout Banner -->
				<div class="bg-amber-500/10 border border-amber-500/20 p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
					<div class="flex items-center gap-3">
						<div class="size-9 bg-amber-400 text-black rounded-xl grid place-items-center font-bold shrink-0">
							<ShieldCheck size={18} />
						</div>
						<div>
							<p class="font-bold text-zinc-900 text-sm">{t.verifyTitle}</p>
							<p class="text-zinc-500 text-xs">{t.verifySub}</p>
						</div>
					</div>
					<a
						href={getHref('/verify')}
						class="inline-flex items-center gap-1.5 px-4 py-2.5 bg-zinc-950 hover:bg-zinc-800 text-white font-bold text-xs rounded-xl transition-colors shrink-0 shadow-sm"
					>
						<span>{t.verifyBtn}</span>
						<ArrowRight size={14} class="text-amber-400" />
					</a>
				</div>

				<!-- Search & Filter Controls -->
				<div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
					<!-- Search Input -->
					<div class="relative flex-1">
						<Search size={18} class="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
						<input
							type="text"
							placeholder={t.searchPlaceholder}
							bind:value={searchQuery}
							class="w-full pl-11 pr-4 py-3 bg-white border border-zinc-200/80 rounded-2xl text-xs font-medium focus:outline-none focus:border-zinc-950 shadow-2xs transition-colors"
						/>
					</div>

					<!-- Status Filter Tabs -->
					<div class="flex items-center gap-1.5 p-1.5 bg-zinc-200/60 rounded-2xl shrink-0 overflow-x-auto">
						<button
							type="button"
							class="px-3.5 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap {statusFilter === 'all' ? 'bg-white text-zinc-950 shadow-xs' : 'text-zinc-600 hover:text-zinc-950'}"
							onclick={() => (statusFilter = 'all')}
						>
							{t.filterAll} ({orders.length})
						</button>
						<button
							type="button"
							class="px-3.5 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap {statusFilter === 'paid' ? 'bg-white text-emerald-700 shadow-xs' : 'text-zinc-600 hover:text-zinc-950'}"
							onclick={() => (statusFilter = 'paid')}
						>
							{t.filterPaid} ({orders.filter(o => o.status === 'paid').length})
						</button>
						<button
							type="button"
							class="px-3.5 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap {statusFilter === 'pending' ? 'bg-white text-amber-700 shadow-xs' : 'text-zinc-600 hover:text-zinc-950'}"
							onclick={() => (statusFilter = 'pending')}
						>
							{t.filterPending} ({orders.filter(o => o.status === 'pending').length})
						</button>
					</div>
				</div>

				<!-- Transactions List Container -->
				<div class="bg-white rounded-3xl border border-zinc-200/80 p-6 sm:p-8 shadow-sm space-y-6">
					<div class="flex items-center justify-between pb-4 border-b border-zinc-100">
						<h2 class="text-base font-black text-zinc-950 flex items-center gap-2">
							<CreditCard size={18} class="text-amber-500" />
							{t.historyTitle}
						</h2>
						<span class="text-xs text-zinc-400 font-mono">{t.currencyNote}</span>
					</div>

					{#if filteredOrders.length === 0}
						<!-- Empty State -->
						<div class="py-14 text-center space-y-4 max-w-sm mx-auto">
							<div class="size-14 bg-zinc-100 text-zinc-400 rounded-2xl grid place-items-center mx-auto">
								<ShoppingBag size={28} />
							</div>
							<div class="space-y-1">
								<h3 class="font-black text-base text-zinc-950">{t.emptyTitle}</h3>
								<p class="text-xs text-zinc-500">
									{#if searchQuery || statusFilter !== 'all'}
										{t.emptySubSearch}
									{:else}
										{t.emptySubDefault}
									{/if}
								</p>
							</div>
							<a
								href={getHref('/catalogue')}
								class="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-zinc-950 text-white font-bold text-xs hover:bg-zinc-800 transition-colors shadow-sm"
							>
								<Sparkles size={14} class="text-amber-400" />
								{t.exploreCatalog}
							</a>
						</div>
					{:else}
						<div class="space-y-4">
							{#each filteredOrders as order (order.id)}
								<div class="p-5 rounded-2xl border border-zinc-200/90 hover:border-zinc-300 hover:shadow-md transition-all space-y-4 sm:space-y-0 sm:flex sm:items-center sm:justify-between gap-4">
									<div class="flex items-start gap-4">
										<div class="size-11 rounded-2xl grid place-items-center font-mono text-xs font-bold shrink-0 {order.status === 'paid' ? 'bg-emerald-500/10 text-emerald-600' : order.status === 'pending' ? 'bg-amber-500/10 text-amber-600' : 'bg-red-500/10 text-red-600'}">
											<Receipt size={20} />
										</div>

										<div class="space-y-1.5 min-w-0">
											<div class="flex flex-wrap items-center gap-2">
												<h3 class="font-black text-sm text-zinc-950 truncate max-w-sm sm:max-w-md">
													{order.productTitle}
												</h3>

												{#if order.status === 'paid'}
													<span class="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-extrabold uppercase rounded-md inline-flex items-center gap-1">
														<CheckCircle2 size={10} /> {t.statusPaid}
													</span>
												{:else if order.status === 'pending'}
													<span class="px-2.5 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-extrabold uppercase rounded-md inline-flex items-center gap-1">
														<Clock size={10} /> {t.statusPending}
													</span>
												{:else}
													<span class="px-2.5 py-0.5 bg-red-100 text-red-800 text-[10px] font-extrabold uppercase rounded-md inline-flex items-center gap-1">
														<AlertCircle size={10} /> {t.statusFailed}
													</span>
												{/if}
											</div>

											<p class="text-xs text-zinc-500 font-medium flex flex-wrap items-center gap-2">
												<span>{t.productTypeLabel} <strong class="text-zinc-700">{getProductTypeLabel(order.productType)}</strong></span>
												<span>·</span>
												<span>{t.providerLabel} <strong class="text-zinc-700">{getProviderLabel(order.paymentProvider)}</strong></span>
											</p>

											<p class="text-[11px] text-zinc-400 font-mono flex items-center gap-1.5">
												<span>Réf : {order.id.slice(0, 16)}</span>
												<button
													type="button"
													onclick={() => copyOrderId(order.id)}
													class="p-1 hover:bg-zinc-200/60 hover:text-zinc-950 rounded transition-colors text-zinc-400 cursor-pointer inline-flex items-center"
													title="Kopye ID kòmand lan"
												>
													{#if copiedOrderId === order.id}
														<Check size={13} class="text-emerald-500" />
													{:else}
														<Copy size={13} />
													{/if}
												</button>
												<span>· {formatDate(order.createdAt)}</span>
											</p>
										</div>
									</div>

									<div class="flex flex-col sm:items-end justify-between sm:justify-center gap-2.5 pt-3 sm:pt-0 border-t sm:border-t-0 border-zinc-100 shrink-0">
										<div class="text-left sm:text-right">
											<span class="block text-base sm:text-lg font-black text-zinc-950 font-mono">
												{order.amount.toLocaleString(currentLang === 'ht' ? 'ht-HT' : 'fr-FR')} {order.currency}
											</span>
										</div>

										<div class="flex items-center gap-2">
											{#if order.status === 'paid'}
												<button
													type="button"
													onclick={() => openInvoiceModal(order)}
													class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-bold text-[11px] rounded-xl transition-colors"
												>
													<FileText size={12} />
													<span>{t.pdfReceipt}</span>
												</button>

												{#if order.productType === 'course'}
													<a
														href={getHref(`/learn/${order.productId}`)}
														class="inline-flex items-center gap-1 px-3 py-1.5 bg-zinc-950 hover:bg-zinc-800 text-white font-bold text-[11px] rounded-xl transition-colors"
													>
														<span>{t.watchBtn}</span>
														<ArrowRight size={12} />
													</a>
												{:else if order.productType === 'ebook'}
													<a
														href={getHref(`/ebooks/${order.productId}`)}
														class="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-black font-bold text-[11px] rounded-xl transition-colors"
													>
														<span>{t.ebookBtn}</span>
														<Download size={12} />
													</a>
												{:else}
													<a
														href={getHref('/profile')}
														class="inline-flex items-center gap-1 px-3 py-1.5 bg-zinc-950 hover:bg-zinc-800 text-white font-bold text-[11px] rounded-xl transition-colors"
													>
														<span>{t.sessionBtn}</span>
														<ExternalLink size={12} />
													</a>
												{/if}
											{/if}
										</div>
									</div>
								</div>
							{/each}
						</div>
					{/if}
				</div>

			</div>
		</main>
	{/if}

	<PublicFooter />
</div>

<!-- Invoice / Receipt Modal -->
{#if selectedOrderForInvoice}
	<div class="invoice-print-overlay fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
		<div class="invoice-print-area bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden border border-zinc-200">
			<!-- Header Modal -->
			<div class="p-6 bg-zinc-950 text-white flex items-center justify-between print:hidden">
				<div class="flex items-center gap-2">
					<Receipt size={20} class="text-amber-400" />
					<h3 class="font-black text-base">{t.receiptModalTitle}</h3>
				</div>
				<button
					type="button"
					onclick={closeInvoiceModal}
					class="size-8 rounded-full bg-white/10 hover:bg-white/20 text-white grid place-items-center transition-colors"
				>
					<X size={16} />
				</button>
			</div>

			<!-- Printable Receipt Body -->
			<div class="invoice-print-body p-6 sm:p-8 space-y-6 text-zinc-900">
				<!-- Brand Header -->
				<div class="flex items-start justify-between border-b border-zinc-200 pb-6">
					<div>
						<h2 class="text-2xl font-black tracking-tight text-zinc-950">DJR AKADEMI</h2>
						<p class="text-xs text-zinc-500 mt-0.5">{t.brandSub}</p>
						<p class="text-[11px] text-zinc-400 font-mono mt-1">contact@djrakademi.net · Haïti</p>
					</div>
					<div class="text-right">
						<span class="px-3 py-1 bg-zinc-100 text-zinc-800 font-mono font-bold text-xs rounded-lg inline-block">
							RESI N° {selectedOrderForInvoice.id.slice(0, 12).toUpperCase()}
						</span>
						<p class="text-[11px] text-zinc-400 font-mono mt-1">
							Dat : {formatDate(selectedOrderForInvoice.createdAt)}
						</p>
					</div>
				</div>

				<!-- Customer & Transaction Info -->
				<div class="grid grid-cols-2 gap-4 p-4 bg-zinc-50 rounded-2xl border border-zinc-200/80 text-xs">
					<div class="space-y-1">
						<span class="text-[10px] font-bold uppercase text-zinc-400 block">{t.billedTo}</span>
						<p class="font-bold text-zinc-950">{selectedOrderForInvoice.customerName}</p>
						<p class="text-zinc-500 font-mono text-[11px]">{selectedOrderForInvoice.customerEmail}</p>
					</div>
					<div class="space-y-1 text-right">
						<span class="text-[10px] font-bold uppercase text-zinc-400 block">{t.paymentMethod}</span>
						<p class="font-bold text-zinc-950">{getProviderLabel(selectedOrderForInvoice.paymentProvider)}</p>
						<p class="text-emerald-700 font-bold uppercase text-[11px]">
							{selectedOrderForInvoice.status === 'paid' ? t.statusPaidTag : `Sitiyasyon : ${selectedOrderForInvoice.status}`}
						</p>
					</div>
				</div>

				<!-- Item Details Table -->
				<div class="border border-zinc-200 rounded-2xl overflow-hidden">
					<table class="w-full text-xs text-left">
						<thead class="bg-zinc-100 text-zinc-500 font-bold uppercase text-[10px]">
							<tr>
								<th class="p-3.5">{t.productDescHeader}</th>
								<th class="p-3.5 text-center">{t.typeHeader}</th>
								<th class="p-3.5 text-right">{t.amountHeader}</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-zinc-100 font-medium">
							<tr>
								<td class="p-3.5 font-bold text-zinc-950">{selectedOrderForInvoice.productTitle}</td>
								<td class="p-3.5 text-center text-zinc-500">{getProductTypeLabel(selectedOrderForInvoice.productType)}</td>
								<td class="p-3.5 text-right font-mono font-bold text-zinc-950">
									{selectedOrderForInvoice.amount.toLocaleString(currentLang === 'ht' ? 'ht-HT' : 'fr-FR')} {selectedOrderForInvoice.currency}
								</td>
							</tr>
						</tbody>
					</table>
				</div>

				<!-- Total Summary -->
				<div class="flex justify-end pt-2">
					<div class="w-64 space-y-2 text-right">
						<div class="flex justify-between text-xs text-zinc-500">
							<span>{t.subtotal}</span>
							<span class="font-mono font-bold text-zinc-950">
								{selectedOrderForInvoice.amount.toLocaleString(currentLang === 'ht' ? 'ht-HT' : 'fr-FR')} {selectedOrderForInvoice.currency}
							</span>
						</div>
						<div class="flex justify-between text-xs text-zinc-500">
							<span>{t.fees}</span>
							<span class="font-mono font-bold text-emerald-600">0 {selectedOrderForInvoice.currency}</span>
						</div>
						<div class="flex justify-between text-base font-black text-zinc-950 pt-2 border-t border-zinc-200">
							<span>{t.totalAmount}</span>
							<span class="font-mono text-amber-600">
								{selectedOrderForInvoice.amount.toLocaleString(currentLang === 'ht' ? 'ht-HT' : 'fr-FR')} {selectedOrderForInvoice.currency}
							</span>
						</div>
					</div>
				</div>

				<!-- Footer Receipt Note -->
				<div class="pt-6 border-t border-zinc-200 text-center text-[10px] text-zinc-400 space-y-1">
					<p class="font-bold">{t.receiptThankYou}</p>
					<p>{t.receiptElectronicNote}</p>
				</div>
			</div>

			<!-- Actions Modal Footer -->
			<div class="p-4 bg-zinc-50 border-t border-zinc-200 flex items-center justify-end gap-3 print:hidden">
				<button
					type="button"
					onclick={closeInvoiceModal}
					class="px-4 py-2 text-xs font-bold text-zinc-600 hover:text-zinc-950 transition-colors"
				>
					{t.close}
				</button>
				<button
					type="button"
					onclick={printInvoice}
					class="px-5 py-2.5 bg-zinc-950 hover:bg-zinc-800 text-white font-bold text-xs rounded-xl flex items-center gap-2 transition-colors shadow-sm"
				>
					<Printer size={14} />
					<span>{t.printSavePdf}</span>
				</button>
			</div>
		</div>
	</div>
{/if}
