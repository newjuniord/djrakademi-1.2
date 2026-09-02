<script lang="ts">
	import type { Order as AdminOrder, OrderStatus, OrderType } from '$lib/types/admin';
	import OrderDetailDrawer from '$lib/components/admin/OrderDetailDrawer.svelte';
	import {
		Search,
		MoreVertical,
		Eye,
		User,
		CalendarCheck,
		ShoppingBag,
		CheckCircle2,
		Clock,
		XCircle,
		ChevronLeft,
		ChevronRight,
		CreditCard,
		Loader2
	} from 'lucide-svelte';
	import { getAdminOrders } from '$lib/admin/admin-client';

	let orders = $state<AdminOrder[]>([]);
	let loading = $state(true);
	let loadError = $state<string | null>(null);
	let totalOrders = $state(0);
	let summary = $state({ paid: 0, pending: 0, failed: 0, expired: 0 });

	// Search & Filter State
	let searchQuery = $state('');
	let filterStatus = $state<OrderStatus | 'all'>('all');
	let filterType = $state<OrderType | 'all'>('all');

	// Pagination State (20 orders per page)
	let pageSize = $state(20);
	let currentPage = $state(1);

	// Drawer Detail State
	let selectedOrder = $state<AdminOrder | null>(null);
	let drawerOpen = $state(false);

	let paidCount = $derived(summary.paid);
	let pendingCount = $derived(summary.pending);
	let failedCount = $derived(summary.failed);
	let totalPages = $derived(Math.ceil(totalOrders / pageSize) || 1);
	let requestNumber = 0;

	async function loadOrders() {
		const request = ++requestNumber;
		loading = true;
		loadError = null;
		try {
			const result = await getAdminOrders({ page: currentPage, limit: pageSize, search: searchQuery.trim() || undefined, status: filterStatus === 'all' ? undefined : filterStatus, type: filterType === 'all' ? undefined : filterType });
			if (request !== requestNumber) return;
			orders = result.items;
			totalOrders = result.total;
			summary = result.summary;
		} catch (error) {
			if (request === requestNumber) loadError = error instanceof Error ? error.message : 'Impossible de charger les commandes.';
		} finally { if (request === requestNumber) loading = false; }
	}

	$effect(() => {
		searchQuery; filterStatus; filterType; currentPage; pageSize;
		const timer = setTimeout(loadOrders, 250);
		return () => clearTimeout(timer);
	});

	function openDetail(order: AdminOrder) {
		selectedOrder = order;
		drawerOpen = true;
	}

	function formatDateShort(dateString: string): string {
		const date = new Date(dateString);
		if (isNaN(date.getTime())) return dateString;
		return new Intl.DateTimeFormat('fr-FR', {
			day: 'numeric',
			month: 'short',
			year: 'numeric'
		}).format(date);
	}
</script>

<svelte:head>
	<title>Commandes · DJR Akademi Admin</title>
</svelte:head>

<div class="space-y-8 p-1">
	<!-- Top Bar Header Card -->
	<div class="bg-base-100 p-6 sm:p-8 shadow-sm rounded-none border-none flex flex-col sm:flex-row sm:items-center justify-between gap-6">
		<div>
			<h1 class="text-2xl font-bold tracking-tight text-base-content sm:text-3xl">
				Commandes
			</h1>
			<p class="text-xs text-base-content/60 mt-1">
				Consultez les achats et paiements de vos clients.
			</p>
		</div>

		<div class="px-4 py-2 bg-base-200/60 rounded-none text-xs font-bold text-base-content/80 shrink-0 self-start sm:self-auto border border-base-200/60">
			{totalOrders} commandes
		</div>
	</div>

	<!-- 3 Stat Cards (Clean, Pro Icons without background boxes) -->
	<div class="grid grid-cols-1 sm:grid-cols-3 gap-6">
		<!-- Card 1: Commandes payées -->
		<div class="bg-base-100 p-6 shadow-sm rounded-none border-none flex items-center justify-between">
			<div>
				<span class="text-xs font-semibold text-base-content/60 block">Commandes payées</span>
				<span class="text-2xl sm:text-3xl font-extrabold text-base-content mt-1 block">{paidCount}</span>
			</div>
			<CheckCircle2 size={24} class="text-success shrink-0" />
		</div>

		<!-- Card 2: En attente -->
		<div class="bg-base-100 p-6 shadow-sm rounded-none border-none flex items-center justify-between">
			<div>
				<span class="text-xs font-semibold text-base-content/60 block">En attente</span>
				<span class="text-2xl sm:text-3xl font-extrabold text-base-content mt-1 block">{pendingCount}</span>
			</div>
			<Clock size={24} class="text-warning shrink-0" />
		</div>

		<!-- Card 3: Échouées -->
		<div class="bg-base-100 p-6 shadow-sm rounded-none border-none flex items-center justify-between">
			<div>
				<span class="text-xs font-semibold text-base-content/60 block">Échouées</span>
				<span class="text-2xl sm:text-3xl font-extrabold text-base-content mt-1 block">{failedCount}</span>
			</div>
			<XCircle size={24} class="text-error shrink-0" />
		</div>
	</div>

	<!-- Main Orders Table Card (Untitled UI Table04AlternatingFills) -->
	<div class="bg-base-100 shadow-sm rounded-none border-none overflow-hidden space-y-6 p-6 sm:p-8">
		<!-- Search and Dual Filter Bar -->
		<div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
			<!-- Search Input with pl-12 icon padding -->
			<div class="relative w-full lg:w-96">
				<Search
					size={16}
					class="absolute left-4 top-1/2 -translate-y-1/2 text-base-content/40 pointer-events-none"
				/>
				<input
					type="text"
					placeholder="Rechercher par client, email ou référence"
					bind:value={searchQuery}
					oninput={() => (currentPage = 1)}
					class="input input-ghost bg-base-200/50 w-full pl-12 pr-4 h-11 text-xs rounded-none focus:bg-base-100 focus:shadow-xs border-none"
				/>
			</div>

			<!-- Filters Group aligned flush right -->
			<div class="flex flex-wrap items-center justify-end gap-3 lg:ml-auto">
				<!-- Status Filter Tabs -->
				<div class="flex items-center gap-1 bg-base-200/60 p-1 rounded-none">
					<button
						type="button"
						class="px-3 py-1.5 text-xs font-semibold rounded-none transition-all {filterStatus === 'all' ? 'bg-base-100 text-base-content shadow-xs font-bold' : 'text-base-content/60 hover:text-base-content'}"
						onclick={() => { filterStatus = 'all'; currentPage = 1; }}
					>
						Toutes
					</button>
					<button
						type="button"
						class="px-3 py-1.5 text-xs font-semibold rounded-none transition-all {filterStatus === 'paid' ? 'bg-base-100 text-base-content shadow-xs font-bold' : 'text-base-content/60 hover:text-base-content'}"
						onclick={() => { filterStatus = 'paid'; currentPage = 1; }}
					>
						Payées
					</button>
					<button
						type="button"
						class="px-3 py-1.5 text-xs font-semibold rounded-none transition-all {filterStatus === 'pending' ? 'bg-base-100 text-base-content shadow-xs font-bold' : 'text-base-content/60 hover:text-base-content'}"
						onclick={() => { filterStatus = 'pending'; currentPage = 1; }}
					>
						En attente
					</button>
					<button
						type="button"
						class="px-3 py-1.5 text-xs font-semibold rounded-none transition-all {filterStatus === 'failed' ? 'bg-base-100 text-base-content shadow-xs font-bold' : 'text-base-content/60 hover:text-base-content'}"
						onclick={() => { filterStatus = 'failed'; currentPage = 1; }}
					>
						Échouées
					</button>
					<button
						type="button"
						class="px-3 py-1.5 text-xs font-semibold rounded-none transition-all {filterStatus === 'expired' ? 'bg-base-100 text-base-content shadow-xs font-bold' : 'text-base-content/60 hover:text-base-content'}"
						onclick={() => { filterStatus = 'expired'; currentPage = 1; }}
					>
						Expirées
					</button>
				</div>

				<!-- Type Filter Dropdown -->
				<select
					bind:value={filterType}
					onchange={() => (currentPage = 1)}
					class="select select-sm bg-base-200/60 rounded-none text-xs border-none font-semibold text-base-content"
				>
					<option value="all">Tous les produits</option>
					<option value="course">Cours</option>
					<option value="ebook">Ebook</option>
					<option value="coaching">Coaching</option>
				</select>
			</div>
		</div>

		<!-- Table View -->
		<div class="overflow-x-auto min-h-[360px] pb-16">
			<table class="table w-full rounded-none text-left border-collapse">
				<thead>
					<tr class="border-b border-base-200 text-xs font-semibold text-base-content/50 uppercase tracking-wider bg-base-100">
						<th class="py-4 px-4 font-bold">Référence</th>
						<th class="py-4 px-4 font-bold">Client</th>
						<th class="py-4 px-4 font-bold">Produit</th>
						<th class="py-4 px-4 font-bold">Type</th>
						<th class="py-4 px-4 font-bold">Montant</th>
						<th class="py-4 px-4 font-bold">Paiement</th>
						<th class="py-4 px-4 font-bold">Date</th>
						<th class="py-4 px-4 font-bold text-right">Actions</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-base-200/60 text-xs">
					{#if loading}
						<tr><td colspan="8" class="py-12 text-center text-base-content/60"><Loader2 size={24} class="mx-auto animate-spin text-primary" /><span class="mt-2 block">Chargement des commandes…</span></td></tr>
					{:else if loadError}
						<tr><td colspan="8" class="py-12 text-center text-error"><XCircle size={22} class="mx-auto" /><span class="mt-2 block">{loadError}</span><button type="button" class="btn btn-sm mt-3" onclick={loadOrders}>Réessayer</button></td></tr>
					{:else if orders.length === 0}
						<tr>
							<td colspan="8" class="py-12 text-center text-base-content/50">
								Aucune commande trouvée.
							</td>
						</tr>
					{:else}
						{#each orders as order (order.id)}
							<tr class="hover:bg-base-200/60 odd:bg-base-200/40 transition-colors">
								<!-- Column 1: Référence (Cliquable) -->
								<td class="py-4 px-4">
									<button
										type="button"
										class="font-mono font-bold text-base-content hover:underline hover:text-primary transition-colors text-left"
										onclick={() => openDetail(order)}
									>
										{order.reference}
									</button>
								</td>

								<!-- Column 2: Client -->
								<td class="py-4 px-4">
									<div>
										<span class="font-bold text-base-content block">{order.customerName}</span>
										<span class="text-[11px] text-base-content/60 block">{order.customerEmail}</span>
									</div>
								</td>

								<!-- Column 3: Produit -->
								<td class="py-4 px-4 font-semibold text-base-content">
									<span class="line-clamp-1">{order.productTitle}</span>
								</td>

								<!-- Column 4: Type -->
								<td class="py-4 px-4">
									{#if order.type === 'course'}
										<span class="badge badge-primary badge-sm font-bold text-[10px] bg-black text-white border-none">
											Cours
										</span>
									{:else if order.type === 'ebook'}
										<span class="badge badge-secondary badge-sm font-bold text-[10px] border-none">
											Ebook
										</span>
									{:else}
										<span class="badge badge-accent badge-sm font-bold text-[10px] border-none">
											Coaching
										</span>
									{/if}
								</td>

								<!-- Column 5: Montant -->
								<td class="py-4 px-4 font-bold text-base-content">
									{order.amount.toLocaleString('fr-FR')} {order.currency}
								</td>

								<!-- Column 6: Paiement Badges -->
								<td class="py-4 px-4">
									{#if order.status === 'paid'}
										<span class="badge badge-success badge-sm font-semibold text-[11px] bg-success/15 text-success border-none">
											Payé
										</span>
									{:else if order.status === 'pending'}
										<span class="badge badge-warning badge-sm font-semibold text-[11px] bg-warning/15 text-warning border-none">
											En attente
										</span>
									{:else if order.status === 'failed'}
										<span class="badge badge-error badge-sm font-semibold text-[11px] bg-error/15 text-error border-none">
											Échoué
										</span>
									{:else}
										<span class="badge badge-neutral badge-sm font-semibold text-[11px] bg-base-300/80 text-base-content/60 border-none">
											Expiré
										</span>
									{/if}
								</td>

								<!-- Column 7: Date -->
								<td class="py-4 px-4 text-base-content/70 whitespace-nowrap">
									{formatDateShort(order.createdAt)}
								</td>

								<!-- Column 8: Actions Menu -->
								<td class="py-4 px-4 text-right">
									<div class="dropdown dropdown-end dropdown-bottom focus-within:z-50 hover:z-50 relative">
										<button
											tabindex="0"
											type="button"
											class="btn btn-ghost btn-xs btn-square rounded-none border-none text-base-content/60 hover:text-base-content"
										>
											<MoreVertical size={16} />
										</button>
									<ul
											class="dropdown-content z-50 menu p-2 shadow-2xl bg-base-100 rounded-none border border-base-200 w-44 text-xs gap-1"
										>
											<li>
												<button
													type="button"
													class="rounded-none gap-2 font-semibold"
													onclick={() => openDetail(order)}
												>
													<Eye size={14} />
													Voir le détail
												</button>
											</li>
											<li>
											<a href={order.userId ? `/admin/users/${order.userId}` : '/admin/users'} class="rounded-none gap-2 text-base-content/70">
													<User size={14} />
													Voir le client
												</a>
											</li>
											{#if order.type === 'coaching'}
												<li>
													<a href="/admin/coaching" class="rounded-none gap-2 text-base-content/70">
														<CalendarCheck size={14} />
														Voir la réservation
													</a>
												</li>
											{/if}
										</ul>
									</div>
								</td>
							</tr>
						{/each}
					{/if}
				</tbody>
			</table>
		</div>

		<!-- Pagination Footer (< Précédent   Suivant >) -->
		<div class="flex items-center justify-between border-t border-base-200/60 pt-4 text-xs">
			<span class="text-base-content/60 font-medium">
				Affichage de {totalOrders > 0 ? (currentPage - 1) * pageSize + 1 : 0} à {Math.min(currentPage * pageSize, totalOrders)} sur {totalOrders} commandes
			</span>

			<div class="flex items-center gap-2">
				<button
					type="button"
					class="btn btn-ghost btn-xs rounded-none border border-base-200 font-semibold gap-1"
					disabled={currentPage <= 1}
					onclick={() => currentPage--}
				>
					<ChevronLeft size={14} />
					Précédent
				</button>
				<span class="font-bold text-base-content px-2">
					{currentPage} / {totalPages}
				</span>
				<button
					type="button"
					class="btn btn-ghost btn-xs rounded-none border border-base-200 font-semibold gap-1"
					disabled={currentPage >= totalPages}
					onclick={() => currentPage++}
				>
					Suivant
					<ChevronRight size={14} />
				</button>
			</div>
		</div>
	</div>
</div>

<!-- Order Detail Drawer -->
<OrderDetailDrawer
	open={drawerOpen}
	order={selectedOrder}
	onClose={() => (drawerOpen = false)}
/>
