<script lang="ts">
	import { onMount } from 'svelte';
	import PublicHeader from '$lib/components/PublicHeader.svelte';
	import PublicFooter from '$lib/components/PublicFooter.svelte';
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
		ExternalLink
	} from 'lucide-svelte';
	import { authState } from '$lib/auth.svelte';
	import { goto } from '$app/navigation';
	import { getUserOrders, type Order } from '$lib/services/orders';

	let loading = $state(true);
	let orders = $state<Order[]>([]);
	let searchQuery = $state('');
	let statusFilter = $state<'all' | 'paid' | 'pending' | 'failed'>('all');

	// Receipt Modal state
	let selectedOrderForInvoice = $state<Order | null>(null);

	$effect(() => {
		if (!authState.loading && !authState.user) {
			goto('/');
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
			return new Date(isoString).toLocaleDateString('fr-FR', {
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
				return 'Carte Bancaire';
			case 'free':
				return 'Gratuit';
			case 'admin':
				return 'Accès Manuel';
			default:
				return provider || 'Paiement';
		}
	}

	function getProductTypeLabel(type: string): string {
		switch (type) {
			case 'course':
				return 'Formation vidéo';
			case 'ebook':
				return 'Ebook PDF';
			case 'coaching':
				return 'Session Coaching 1:1';
			default:
				return 'Produit digital';
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
	<title>Mes Transactions · DJR Akademi</title>
	<meta name="description" content="Historique complet de vos commandes, reçus et factures de paiement sur DJR Akademi." />
</svelte:head>

<div class="min-h-screen bg-zinc-50 flex flex-col font-sans text-zinc-900">
	<PublicHeader />

	{#if authState.loading || loading}
		<div class="flex-1 flex items-center justify-center py-20">
			<div class="text-center space-y-3">
				<span class="loading loading-spinner text-amber-500 loading-lg"></span>
				<p class="text-xs font-semibold text-zinc-500">Chargement de vos transactions...</p>
			</div>
		</div>
	{:else if authState.user}
		<main class="flex-1 py-10 sm:py-14">
			<div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">

				<!-- Back navigation button -->
				<a
					href="/dashboard"
					class="inline-flex items-center gap-2 text-xs font-bold text-zinc-500 hover:text-zinc-950 transition-colors"
				>
					<ChevronLeft size={16} />
					Tounen nan espas mwen
				</a>

				<!-- Page Header Banner -->
				<div class="bg-zinc-950 text-white rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-xl border border-zinc-800">
					<div class="flex items-center gap-4">
						<div class="size-14 bg-gradient-to-br from-amber-400 to-orange-500 text-black text-xl font-black rounded-2xl grid place-items-center shadow-lg shrink-0">
							<Receipt size={26} />
						</div>
						<div class="space-y-1">
							<h1 class="text-2xl sm:text-3xl font-black tracking-tight">Tranzaksyon Mwen Yo</h1>
							<p class="text-white/60 text-xs font-medium">
								Istwa kòmand, faktir ak resi peman ou yo.
							</p>
						</div>
					</div>

					<div class="flex items-center gap-3 self-stretch sm:self-auto">
						<div class="flex-1 sm:flex-initial px-4 py-2.5 bg-white/10 rounded-2xl text-center sm:text-right border border-white/10 shrink-0">
							<span class="text-[10px] font-bold text-white/50 uppercase tracking-wider block">Total depanse</span>
							<span class="text-sm font-black text-amber-400 font-mono">
								{totalSpent.toLocaleString('fr-FR')} HTG
							</span>
						</div>
						<div class="flex-1 sm:flex-initial px-4 py-2.5 bg-white/10 rounded-2xl text-center sm:text-right border border-white/10 shrink-0">
							<span class="text-[10px] font-bold text-white/50 uppercase tracking-wider block">Achte ki konfime</span>
							<span class="text-sm font-black text-white">
								{paidCount} kòmand
							</span>
						</div>
					</div>
				</div>

				<!-- Search & Filter Controls -->
				<div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
					<!-- Search Input -->
					<div class="relative flex-1">
						<Search size={18} class="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
						<input
							type="text"
							placeholder="Chèche pa pwodui oswa ID tranzaksyon..."
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
							Tout ({orders.length})
						</button>
						<button
							type="button"
							class="px-3.5 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap {statusFilter === 'paid' ? 'bg-white text-emerald-700 shadow-xs' : 'text-zinc-600 hover:text-zinc-950'}"
							onclick={() => (statusFilter = 'paid')}
						>
							Peye ({orders.filter(o => o.status === 'paid').length})
						</button>
						<button
							type="button"
							class="px-3.5 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap {statusFilter === 'pending' ? 'bg-white text-amber-700 shadow-xs' : 'text-zinc-600 hover:text-zinc-950'}"
							onclick={() => (statusFilter = 'pending')}
						>
							Enatant ({orders.filter(o => o.status === 'pending').length})
						</button>
					</div>
				</div>

				<!-- Transactions List Container -->
				<div class="bg-white rounded-3xl border border-zinc-200/80 p-6 sm:p-8 shadow-sm space-y-6">
					<div class="flex items-center justify-between pb-4 border-b border-zinc-100">
						<h2 class="text-base font-black text-zinc-950 flex items-center gap-2">
							<CreditCard size={18} class="text-amber-500" />
							Istwa detaye peman yo
						</h2>
						<span class="text-xs text-zinc-400 font-mono">Lajan ofisyèl : HTG</span>
					</div>

					{#if filteredOrders.length === 0}
						<!-- Empty State -->
						<div class="py-14 text-center space-y-4 max-w-sm mx-auto">
							<div class="size-14 bg-zinc-100 text-zinc-400 rounded-2xl grid place-items-center mx-auto">
								<ShoppingBag size={28} />
							</div>
							<div class="space-y-1">
								<h3 class="font-black text-base text-zinc-950">Pa gen okenn tranzaksyon ki jwenn</h3>
								<p class="text-xs text-zinc-500">
									{#if searchQuery || statusFilter !== 'all'}
										Pa gen okenn rezilta ki koresponn ak chèch ou an.
									{:else}
										Ou poko fè okenn achte pou kounye a. Eksplore fòmasyon ak ebook nou yo pou kòmanse !
									{/if}
								</p>
							</div>
							<a
								href="/catalogue"
								class="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-zinc-950 text-white font-bold text-xs hover:bg-zinc-800 transition-colors shadow-sm"
							>
								<Sparkles size={14} class="text-amber-400" />
								Eksplore katalòg la
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
														<CheckCircle2 size={10} /> Peye
													</span>
												{:else if order.status === 'pending'}
													<span class="px-2.5 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-extrabold uppercase rounded-md inline-flex items-center gap-1">
														<Clock size={10} /> Enatant
													</span>
												{:else}
													<span class="px-2.5 py-0.5 bg-red-100 text-red-800 text-[10px] font-extrabold uppercase rounded-md inline-flex items-center gap-1">
														<AlertCircle size={10} /> Echwe
													</span>
												{/if}
											</div>

											<p class="text-xs text-zinc-500 font-medium flex flex-wrap items-center gap-2">
												<span>Fòm : <strong class="text-zinc-700">{getProductTypeLabel(order.productType)}</strong></span>
												<span>·</span>
												<span>Fason : <strong class="text-zinc-700">{getProviderLabel(order.paymentProvider)}</strong></span>
											</p>

											<p class="text-[11px] text-zinc-400 font-mono">
												Réf : {order.id.slice(0, 16)} · {formatDate(order.createdAt)}
											</p>
										</div>
									</div>

									<div class="flex flex-col sm:items-end justify-between sm:justify-center gap-2.5 pt-3 sm:pt-0 border-t sm:border-t-0 border-zinc-100 shrink-0">
										<div class="text-left sm:text-right">
											<span class="block text-base sm:text-lg font-black text-zinc-950 font-mono">
												{order.amount.toLocaleString('fr-FR')} {order.currency}
											</span>
										</div>

										<div class="flex items-center gap-2">
											<button
												type="button"
												onclick={() => openInvoiceModal(order)}
												class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-bold text-[11px] rounded-xl transition-colors"
											>
												<FileText size={12} />
												<span>Resi PDF</span>
											</button>

											{#if order.status === 'paid'}
												{#if order.productType === 'course'}
													<a
														href="/learn/{order.productId}"
														class="inline-flex items-center gap-1 px-3 py-1.5 bg-zinc-950 hover:bg-zinc-800 text-white font-bold text-[11px] rounded-xl transition-colors"
													>
														<span>Swiv</span>
														<ArrowRight size={12} />
													</a>
												{:else if order.productType === 'ebook'}
													<a
														href="/ebooks/{order.productId}"
														class="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-black font-bold text-[11px] rounded-xl transition-colors"
													>
														<span>Ebook</span>
														<Download size={12} />
													</a>
												{:else}
													<a
														href="/profile"
														class="inline-flex items-center gap-1 px-3 py-1.5 bg-zinc-950 hover:bg-zinc-800 text-white font-bold text-[11px] rounded-xl transition-colors"
													>
														<span>Sesyon</span>
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
					<h3 class="font-black text-base">Resi Ofisyèl Peman</h3>
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
						<p class="text-xs text-zinc-500 mt-0.5">Platfòm aprantisaj ak swivi</p>
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
						<span class="text-[10px] font-bold uppercase text-zinc-400 block">Faktire bay</span>
						<p class="font-bold text-zinc-950">{selectedOrderForInvoice.customerName}</p>
						<p class="text-zinc-500 font-mono text-[11px]">{selectedOrderForInvoice.customerEmail}</p>
					</div>
					<div class="space-y-1 text-right">
						<span class="text-[10px] font-bold uppercase text-zinc-400 block">Mwayen peman</span>
						<p class="font-bold text-zinc-950">{getProviderLabel(selectedOrderForInvoice.paymentProvider)}</p>
						<p class="text-emerald-700 font-bold uppercase text-[11px]">
							{selectedOrderForInvoice.status === 'paid' ? 'Sitiyasyon : Peye ✓' : `Sitiyasyon : ${selectedOrderForInvoice.status}`}
						</p>
					</div>
				</div>

				<!-- Item Details Table -->
				<div class="border border-zinc-200 rounded-2xl overflow-hidden">
					<table class="w-full text-xs text-left">
						<thead class="bg-zinc-100 text-zinc-500 font-bold uppercase text-[10px]">
							<tr>
								<th class="p-3.5">Deskripsyon pwodui a</th>
								<th class="p-3.5 text-center">Kalite</th>
								<th class="p-3.5 text-right">Montan</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-zinc-100 font-medium">
							<tr>
								<td class="p-3.5 font-bold text-zinc-950">{selectedOrderForInvoice.productTitle}</td>
								<td class="p-3.5 text-center text-zinc-500">{getProductTypeLabel(selectedOrderForInvoice.productType)}</td>
								<td class="p-3.5 text-right font-mono font-bold text-zinc-950">
									{selectedOrderForInvoice.amount.toLocaleString('fr-FR')} {selectedOrderForInvoice.currency}
								</td>
							</tr>
						</tbody>
					</table>
				</div>

				<!-- Total Summary -->
				<div class="flex justify-end pt-2">
					<div class="w-64 space-y-2 text-right">
						<div class="flex justify-between text-xs text-zinc-500">
							<span>Sous-total :</span>
							<span class="font-mono font-bold text-zinc-950">
								{selectedOrderForInvoice.amount.toLocaleString('fr-FR')} {selectedOrderForInvoice.currency}
							</span>
						</div>
						<div class="flex justify-between text-xs text-zinc-500">
							<span>Frais tretman :</span>
							<span class="font-mono font-bold text-emerald-600">0 HTG</span>
						</div>
						<div class="flex justify-between text-base font-black text-zinc-950 pt-2 border-t border-zinc-200">
							<span>Montan Total :</span>
							<span class="font-mono text-amber-600">
								{selectedOrderForInvoice.amount.toLocaleString('fr-FR')} {selectedOrderForInvoice.currency}
							</span>
						</div>
					</div>
				</div>

				<!-- Footer Receipt Note -->
				<div class="pt-6 border-t border-zinc-200 text-center text-[10px] text-zinc-400 space-y-1">
					<p class="font-bold">Mèsi pou konfyans ou nan DJR Akademi !</p>
					<p>Resi elektwonik sa a se yon prèv achte ofisyèl.</p>
				</div>
			</div>

			<!-- Actions Modal Footer -->
			<div class="p-4 bg-zinc-50 border-t border-zinc-200 flex items-center justify-end gap-3 print:hidden">
				<button
					type="button"
					onclick={closeInvoiceModal}
					class="px-4 py-2 text-xs font-bold text-zinc-600 hover:text-zinc-950 transition-colors"
				>
					Fèmen
				</button>
				<button
					type="button"
					onclick={printInvoice}
					class="px-5 py-2.5 bg-zinc-950 hover:bg-zinc-800 text-white font-bold text-xs rounded-xl flex items-center gap-2 transition-colors shadow-sm"
				>
					<Printer size={14} />
					<span>Enprime / Sove an PDF</span>
				</button>
			</div>
		</div>
	</div>
{/if}
