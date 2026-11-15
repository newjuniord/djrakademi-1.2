<script lang="ts">
	import { onMount } from 'svelte';
	import PublicHeader from '$lib/components/PublicHeader.svelte';
	import { page } from '$app/state';
	import {
		ChevronLeft,
		ChevronDown,
		ArrowRight,
		Search,
		FileText,
		X,
		Copy,
		Check,
		ShoppingBag,
		Loader2
	} from 'lucide-svelte';
	import { toast } from '$lib/toast.svelte';
	import { authState } from '$lib/auth.svelte';
	import { goto } from '$app/navigation';
	import { getUserOrders, type Order } from '$lib/services/orders';
	import { formatDateTimeInTimezone } from '$lib/coaching/timezone';

	let currentLang = $derived<'fr' | 'ht'>(page.url.searchParams.get('lang') === 'ht' ? 'ht' : 'fr');

	function getHref(path: string) {
		if (currentLang !== 'ht') return path;
		const url = new URL(path, page.url);
		url.searchParams.set('lang', 'ht');
		return `${url.pathname}${url.search}${url.hash}`;
	}

	const i18n = {
		fr: {
			pageTitle: 'Mes transactions · DJR Akademi',
			metaDesc: 'Historique de vos commandes, reçus et paiements sur DJR Akademi.',
			loadingMsg: 'Chargement...',
			backToSpace: 'Mon espace',
			title: 'Transactions',
			subtitle: 'Historique de vos achats et reçus.',
			verifyPrompt: 'Un paiement ne s’affiche pas ?',
			verifyBtn: 'Vérifier un paiement',
			searchPlaceholder: 'Rechercher un produit ou une référence...',
			searchLabel: 'Rechercher une transaction',
			filterAll: 'Tous',
			filterPaid: 'Payé',
			filterPending: 'En attente',
			emptyTitle: 'Aucune transaction',
			emptySubSearch: 'Aucun résultat ne correspond à votre recherche.',
			emptySubDefault: 'Vous n’avez effectué aucun achat pour le moment.',
			exploreCatalog: 'Voir le catalogue',
			statusPaid: 'Payé',
			statusPending: 'En attente',
			statusFailed: 'Échoué',
			copyToast: 'Référence copiée.',
			pdfReceipt: 'Reçu',
			watchBtn: 'Suivre',
			ebookBtn: 'Ouvrir',
			bundleBtn: 'Ressources',
			sessionBtn: 'Réservations',
			receiptModalTitle: 'Reçu de paiement',
			receiptNumber: 'Reçu',
			datePrefix: 'Date',
			copyOrderId: 'Copier la référence',
			statusLabel: 'Statut',
			brandSub: 'Plateforme d’apprentissage',
			billedTo: 'Client',
			paymentMethod: 'Moyen de paiement',
			productDescHeader: 'Produit',
			typeHeader: 'Type',
			amountHeader: 'Montant',
			subtotal: 'Sous-total',
			fees: 'Frais',
			totalAmount: 'Total',
			receiptThankYou: 'Merci pour votre confiance.',
			receiptElectronicNote: 'Preuve d’achat électronique officielle — DJR Akademi.',
			close: 'Fermer',
			printSavePdf: 'Imprimer / PDF',
			courseType: 'Formation',
			ebookType: 'E-book',
			bundleType: 'Offre groupée',
			coachingType: 'Coaching',
			digitalType: 'Produit numérique'
		},
		ht: {
			pageTitle: 'Tranzaksyon mwen yo · DJR Akademi',
			metaDesc: 'Istwa kòmand, resi ak peman ou yo sou DJR Akademi.',
			loadingMsg: 'N ap chaje...',
			backToSpace: 'Espas mwen',
			title: 'Tranzaksyon',
			subtitle: 'Istwa acha ak resi ou yo.',
			verifyPrompt: 'Gen yon peman ki pa parèt?',
			verifyBtn: 'Verifye yon peman',
			searchPlaceholder: 'Chèche yon pwodui oswa referans...',
			searchLabel: 'Chèche yon tranzaksyon',
			filterAll: 'Tout',
			filterPaid: 'Peye',
			filterPending: 'Ap tann',
			emptyTitle: 'Pa gen tranzaksyon',
			emptySubSearch: 'Pa gen okenn rezilta ki koresponn.',
			emptySubDefault: 'Ou poko fè okenn acha pou kounye a.',
			exploreCatalog: 'Wè katalòg la',
			statusPaid: 'Peye',
			statusPending: 'Ap tann',
			statusFailed: 'Echwe',
			copyToast: 'Referans kopye.',
			pdfReceipt: 'Resi',
			watchBtn: 'Swiv',
			ebookBtn: 'Louvri',
			bundleBtn: 'Resous',
			sessionBtn: 'Rezèvasyon',
			receiptModalTitle: 'Resi peman',
			receiptNumber: 'Resi',
			datePrefix: 'Dat',
			copyOrderId: 'Kopye referans lan',
			statusLabel: 'Estati',
			brandSub: 'Platfòm aprantisaj',
			billedTo: 'Kliyan',
			paymentMethod: 'Mwayen peman',
			productDescHeader: 'Pwodui',
			typeHeader: 'Kalite',
			amountHeader: 'Montan',
			subtotal: 'Sou-total',
			fees: 'Frè',
			totalAmount: 'Total',
			receiptThankYou: 'Mèsi pou konfyans ou.',
			receiptElectronicNote: 'Prèv acha elektwonik ofisyèl — DJR Akademi.',
			close: 'Fèmen',
			printSavePdf: 'Enprime / PDF',
			courseType: 'Fòmasyon',
			ebookType: 'Liv dijital',
			bundleType: 'Pakèt',
			coachingType: 'Konsiltasyon',
			digitalType: 'Pwodui dijital'
		}
	};
	let t = $derived(i18n[currentLang]);

	let loading = $state(true);
	let orders = $state<Order[]>([]);
	let searchQuery = $state('');
	let statusFilter = $state<'all' | 'paid' | 'pending'>('all');

	let selectedOrderForInvoice = $state<Order | null>(null);
	let receiptDialogEl = $state<HTMLDialogElement | null>(null);
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

	$effect(() => {
		const el = receiptDialogEl;
		if (!el) return;
		if (selectedOrderForInvoice) {
			if (!el.open) el.showModal();
		} else if (el.open) {
			el.close();
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

	let paidOrdersCount = $derived(orders.filter((o) => o.status === 'paid').length);
	let pendingOrdersCount = $derived(orders.filter((o) => o.status === 'pending').length);

	let filteredOrders = $derived(
		orders.filter((order) => {
			const q = searchQuery.trim().toLowerCase();
			const matchesSearch =
				!q ||
				order.productTitle.toLowerCase().includes(q) ||
				order.id.toLowerCase().includes(q) ||
				(order.paymentId && order.paymentId.toLowerCase().includes(q));

			const matchesStatus =
				statusFilter === 'all' ||
				(statusFilter === 'paid' && order.status === 'paid') ||
				(statusFilter === 'pending' && order.status === 'pending');

			return matchesSearch && matchesStatus;
		})
	);

	function formatDate(isoString: string): string {
		try {
			const formatted = formatDateTimeInTimezone(
				isoString,
				Intl.DateTimeFormat().resolvedOptions().timeZone,
				currentLang
			);
			return `${formatted.date} · ${formatted.time}`;
		} catch {
			return isoString;
		}
	}

	function getProviderLabel(provider: string): string {
		switch (provider?.toLowerCase()) {
			case 'moncash':
				return 'MonCash';
			case 'natcash':
				return 'NatCash';
			case 'lemonsqueezy':
				return 'Lemon Squeezy';
			case 'card':
			case 'carte':
				return currentLang === 'ht' ? 'Kat labank' : 'Carte bancaire';
			case 'free':
				return currentLang === 'ht' ? 'Gratis' : 'Gratuit';
			case 'admin':
				return currentLang === 'ht' ? 'Aksè manyèl' : 'Accès manuel';
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
			case 'bundle':
				return t.bundleType;
			default:
				return t.digitalType;
		}
	}

	function getProductHref(order: Order): string {
		if (order.productType === 'course') return getHref(`/learn/${order.productId}`);
		if (order.productType === 'ebook') return getHref(`/ebooks/${order.productId}`);
		if (order.productType === 'bundle') return getHref('/dashboard');
		return getHref('/bookings');
	}

	function getProductActionLabel(order: Order): string {
		if (order.productType === 'course') return t.watchBtn;
		if (order.productType === 'ebook') return t.ebookBtn;
		if (order.productType === 'bundle') return t.bundleBtn;
		return t.sessionBtn;
	}

	function openInvoiceModal(order: Order) {
		selectedOrderForInvoice = order;
	}

	function closeInvoiceModal() {
		selectedOrderForInvoice = null;
	}

	function handleDialogClick(event: MouseEvent) {
		const el = receiptDialogEl;
		if (!el) return;
		if (!('closedBy' in HTMLDialogElement.prototype)) {
			if (event.target !== el) return;
			const rect = el.getBoundingClientRect();
			const isInside =
				rect.top <= event.clientY &&
				event.clientY <= rect.top + rect.height &&
				rect.left <= event.clientX &&
				event.clientX <= rect.left + rect.width;
			if (!isInside) closeInvoiceModal();
		}
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

<div class="min-h-screen bg-zinc-50/70 flex flex-col font-sans text-zinc-900">
	<PublicHeader />

	{#if authState.loading || loading}
		<div class="flex-1 grid place-items-center py-24">
			<div class="flex flex-col items-center gap-2.5 text-zinc-400">
				<Loader2 size={22} class="animate-spin text-zinc-900" />
				<p class="text-xs font-medium">{t.loadingMsg}</p>
			</div>
		</div>
	{:else if authState.user}
		<main class="flex-1 py-8 sm:py-12">
			<div class="mx-auto max-w-3xl px-4 sm:px-6 space-y-6">
				<!-- Top Header -->
				<div class="space-y-3">
					<a
						href={getHref('/dashboard')}
						class="inline-flex items-center gap-1 text-xs font-medium text-zinc-500 transition-colors hover:text-zinc-950"
					>
						<ChevronLeft size={14} />
						<span>{t.backToSpace}</span>
					</a>

					<div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
						<div>
							<h1 class="text-2xl font-semibold tracking-tight text-zinc-950">{t.title}</h1>
							<p class="mt-0.5 text-sm text-zinc-500">{t.subtitle}</p>
						</div>

						<a
							href={getHref('/verify')}
							class="inline-flex items-center gap-1.5 self-start rounded-xl border border-zinc-200/90 bg-white px-3.5 py-2 text-xs font-medium text-zinc-700 transition-colors hover:border-zinc-300 hover:text-zinc-950 sm:self-auto"
						>
							<span>{t.verifyBtn}</span>
							<ArrowRight size={13} class="text-zinc-400" />
						</a>
					</div>
				</div>

				<!-- Search & Filter Bar -->
				<div class="flex flex-col gap-3 sm:flex-row sm:items-center">
					<div class="relative flex-1">
						<Search size={15} class="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-zinc-400" />
						<input
							type="search"
							aria-label={t.searchLabel}
							placeholder={t.searchPlaceholder}
							bind:value={searchQuery}
							class="h-10 w-full rounded-xl border border-zinc-200/90 bg-white pr-4 pl-10 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-950 focus:outline-none"
						/>
					</div>

					<div class="relative self-start sm:self-auto">
						<select
							bind:value={statusFilter}
							aria-label={t.statusLabel}
							class="h-10 cursor-pointer appearance-none rounded-xl border border-zinc-200/90 bg-white pr-9 pl-3.5 text-xs font-medium text-zinc-900 transition-colors hover:border-zinc-300 focus:border-zinc-950 focus:outline-none"
						>
							<option value="all">{t.filterAll} ({orders.length})</option>
							<option value="paid">{t.filterPaid} ({paidOrdersCount})</option>
							<option value="pending">{t.filterPending} ({pendingOrdersCount})</option>
						</select>
						<ChevronDown
							size={14}
							aria-hidden="true"
							class="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-zinc-400"
						/>
					</div>
				</div>

				<!-- Transactions List -->
				<div class="overflow-hidden rounded-2xl border border-zinc-200/90 bg-white">
					{#if filteredOrders.length === 0}
						<div class="mx-auto max-w-xs px-6 py-16 text-center space-y-3">
							<div class="mx-auto grid size-11 place-items-center rounded-xl bg-zinc-100 text-zinc-400">
								<ShoppingBag size={20} strokeWidth={1.75} />
							</div>
							<div class="space-y-1">
								<h2 class="text-sm font-semibold text-zinc-950">{t.emptyTitle}</h2>
								<p class="text-xs text-zinc-500">
									{searchQuery || statusFilter !== 'all' ? t.emptySubSearch : t.emptySubDefault}
								</p>
							</div>
							<a
								href={getHref('/catalogue')}
								class="inline-flex items-center gap-1.5 rounded-xl bg-zinc-950 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-zinc-800"
							>
								<span>{t.exploreCatalog}</span>
								<ArrowRight size={13} />
							</a>
						</div>
					{:else}
						<ul class="divide-y divide-zinc-100">
							{#each filteredOrders as order (order.id)}
								<li class="flex flex-col gap-3 px-5 py-4 transition-colors hover:bg-zinc-50/70 sm:flex-row sm:items-center sm:justify-between">
									<div class="min-w-0 space-y-1">
										<div class="flex flex-wrap items-center gap-2">
											<span class="truncate text-sm font-semibold text-zinc-950">
												{order.productTitle}
											</span>

											{#if order.status === 'paid'}
												<span class="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
													<span class="size-1.5 rounded-full bg-emerald-500"></span>
													{t.statusPaid}
												</span>
											{:else if order.status === 'pending'}
												<span class="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700">
													<span class="size-1.5 rounded-full bg-amber-500"></span>
													{t.statusPending}
												</span>
											{:else}
												<span class="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-700">
													<span class="size-1.5 rounded-full bg-red-500"></span>
													{t.statusFailed}
												</span>
											{/if}
										</div>

										<div class="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-zinc-500">
											<span>{getProductTypeLabel(order.productType)}</span>
											<span class="text-zinc-300">·</span>
											<span>{getProviderLabel(order.paymentProvider)}</span>
											<span class="text-zinc-300">·</span>
											<span>{formatDate(order.createdAt)}</span>
											<span class="text-zinc-300">·</span>
											<button
												type="button"
												onclick={() => copyOrderId(order.id)}
												title={t.copyOrderId}
												class="inline-flex cursor-pointer items-center gap-1 font-mono text-[11px] text-zinc-400 transition-colors hover:text-zinc-900"
											>
												<span>{order.id.slice(0, 12)}</span>
												{#if copiedOrderId === order.id}
													<Check size={11} class="text-emerald-600" />
												{:else}
													<Copy size={11} />
												{/if}
											</button>
										</div>
									</div>

									<div class="flex items-center justify-between gap-4 sm:justify-end shrink-0">
										<span class="font-mono text-sm font-semibold tabular-nums text-zinc-950">
											{order.amount.toLocaleString(currentLang === 'ht' ? 'ht-HT' : 'fr-FR')} {order.currency}
										</span>

										{#if order.status === 'paid'}
											<div class="flex items-center gap-1.5">
												<button
													type="button"
													onclick={() => openInvoiceModal(order)}
													class="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-700 transition-colors hover:border-zinc-300 hover:text-zinc-950"
												>
													<FileText size={12} />
													<span>{t.pdfReceipt}</span>
												</button>
												<a
													href={getProductHref(order)}
													class="inline-flex items-center gap-1 rounded-lg bg-zinc-950 px-2.5 py-1.5 text-xs font-medium text-white transition-colors hover:bg-zinc-800"
												>
													<span>{getProductActionLabel(order)}</span>
													<ArrowRight size={12} />
												</a>
											</div>
										{/if}
									</div>
								</li>
							{/each}
						</ul>
					{/if}
				</div>

				<!-- Subtle verify footer hint -->
				<p class="text-center text-xs text-zinc-400">
					{t.verifyPrompt}
					<a href={getHref('/verify')} class="font-medium text-zinc-600 underline underline-offset-2 hover:text-zinc-950">
						{t.verifyBtn}
					</a>
				</p>
			</div>
		</main>
	{/if}
</div>

<!-- Minimalist Receipt Dialog -->
<dialog
	bind:this={receiptDialogEl}
	{...({ closedby: 'any' } as Record<string, string>)}
	aria-labelledby="receipt-modal-title"
	oncancel={closeInvoiceModal}
	onclose={() => {
		if (selectedOrderForInvoice) closeInvoiceModal();
	}}
	onclick={handleDialogClick}
	class="receipt-dialog invoice-print-area m-auto w-[calc(100%-2rem)] max-w-lg rounded-2xl border border-zinc-200/90 bg-white p-0 text-zinc-900 shadow-xl"
>
	{#if selectedOrderForInvoice}
		<div class="flex flex-col">
			<!-- Header -->
			<div class="flex items-center justify-between border-b border-zinc-100 px-6 py-4 print:hidden">
				<h2 id="receipt-modal-title" class="text-sm font-semibold text-zinc-950">
					{t.receiptModalTitle}
				</h2>
				<button
					type="button"
					onclick={closeInvoiceModal}
					aria-label={t.close}
					class="grid size-8 cursor-pointer place-items-center rounded-full text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
				>
					<X size={16} />
				</button>
			</div>

			<!-- Printable Body -->
			<div class="invoice-print-body space-y-6 p-6">
				<div class="flex items-start justify-between border-b border-zinc-100 pb-5">
					<div>
						<p class="text-base font-semibold tracking-tight text-zinc-950">DJR Akademi</p>
						<p class="text-xs text-zinc-500">{t.brandSub}</p>
						<p class="mt-1 font-mono text-[11px] text-zinc-400">contact@djrakademi.net</p>
					</div>
					<div class="text-right">
						<span class="inline-block rounded-md bg-zinc-100 px-2.5 py-1 font-mono text-[11px] font-medium text-zinc-700">
							{t.receiptNumber} #{selectedOrderForInvoice.id.slice(0, 10).toUpperCase()}
						</span>
						<p class="mt-1 font-mono text-[11px] text-zinc-400">
							{formatDate(selectedOrderForInvoice.createdAt)}
						</p>
					</div>
				</div>

				<div class="grid grid-cols-2 gap-4 rounded-xl bg-zinc-50 p-4 text-xs">
					<div class="space-y-0.5">
						<span class="text-[11px] text-zinc-400">{t.billedTo}</span>
						<p class="font-medium text-zinc-950">{selectedOrderForInvoice.customerName}</p>
						<p class="font-mono text-[11px] text-zinc-500">{selectedOrderForInvoice.customerEmail}</p>
					</div>
					<div class="space-y-0.5 text-right">
						<span class="text-[11px] text-zinc-400">{t.paymentMethod}</span>
						<p class="font-medium text-zinc-950">{getProviderLabel(selectedOrderForInvoice.paymentProvider)}</p>
						<p class="text-[11px] font-medium text-emerald-700">
							{selectedOrderForInvoice.status === 'paid'
								? t.statusPaid
								: selectedOrderForInvoice.status === 'pending'
									? t.statusPending
									: t.statusFailed}
						</p>
					</div>
				</div>

				<div class="overflow-hidden rounded-xl border border-zinc-200/80">
					<table class="w-full text-left text-xs">
						<thead class="bg-zinc-50 text-[11px] font-medium text-zinc-500">
							<tr>
								<th class="px-3.5 py-2.5">{t.productDescHeader}</th>
								<th class="px-3.5 py-2.5">{t.typeHeader}</th>
								<th class="px-3.5 py-2.5 text-right">{t.amountHeader}</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-zinc-100">
							<tr>
								<td class="px-3.5 py-3 font-medium text-zinc-950">{selectedOrderForInvoice.productTitle}</td>
								<td class="px-3.5 py-3 text-zinc-500">{getProductTypeLabel(selectedOrderForInvoice.productType)}</td>
								<td class="px-3.5 py-3 text-right font-mono font-medium tabular-nums text-zinc-950">
									{selectedOrderForInvoice.amount.toLocaleString(currentLang === 'ht' ? 'ht-HT' : 'fr-FR')} {selectedOrderForInvoice.currency}
								</td>
							</tr>
						</tbody>
					</table>
				</div>

				<div class="flex justify-end">
					<div class="w-56 space-y-1.5 text-xs">
						<div class="flex justify-between text-zinc-500">
							<span>{t.subtotal}</span>
							<span class="font-mono tabular-nums text-zinc-900">
								{selectedOrderForInvoice.amount.toLocaleString(currentLang === 'ht' ? 'ht-HT' : 'fr-FR')} {selectedOrderForInvoice.currency}
							</span>
						</div>
						<div class="flex justify-between text-zinc-500">
							<span>{t.fees}</span>
							<span class="font-mono tabular-nums text-zinc-900">0 {selectedOrderForInvoice.currency}</span>
						</div>
						<div class="flex justify-between border-t border-zinc-200 pt-2 text-sm font-semibold text-zinc-950">
							<span>{t.totalAmount}</span>
							<span class="font-mono tabular-nums">
								{selectedOrderForInvoice.amount.toLocaleString(currentLang === 'ht' ? 'ht-HT' : 'fr-FR')} {selectedOrderForInvoice.currency}
							</span>
						</div>
					</div>
				</div>

				<div class="border-t border-zinc-100 pt-4 text-center text-[11px] text-zinc-400">
					<p class="font-medium text-zinc-500">{t.receiptThankYou}</p>
					<p>{t.receiptElectronicNote}</p>
				</div>
			</div>
		</div>
	{/if}
</dialog>

<style>
	.receipt-dialog::backdrop {
		background-color: rgb(9 9 11 / 0.45);
		backdrop-filter: blur(4px);
	}

	@media (prefers-reduced-motion: reduce) {
		.receipt-dialog,
		.receipt-dialog * {
			animation: none !important;
			transition: none !important;
		}
	}
</style>
