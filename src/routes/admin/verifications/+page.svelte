<script lang="ts">
	import {
		Search,
		ShieldCheck,
		CheckCircle2,
		XCircle,
		ChevronLeft,
		ChevronRight,
		CreditCard,
		Smartphone,
		Loader2,
		RefreshCw,
		User,
		Info,
		Calendar
	} from 'lucide-svelte';
	import { getAdminVerificationLogs, type VerificationLog } from '$lib/admin/admin-client';

	let logs = $state<VerificationLog[]>([]);
	let loading = $state(true);
	let loadError = $state<string | null>(null);
	let totalLogs = $state(0);

	// Search & Filter State
	let searchQuery = $state('');
	let filterStatus = $state<'all' | 'success' | 'failed'>('all');
	let filterMethod = $state<'all' | 'carte' | 'mobile'>('all');

	// Pagination State
	let pageSize = $state(10);
	let currentPage = $state(1);

	// Detail Modal State
	let selectedLog = $state<VerificationLog | null>(null);

	let totalPages = $derived(Math.ceil(totalLogs / pageSize) || 1);
	let requestNumber = 0;

	async function loadLogs() {
		const request = ++requestNumber;
		loading = true;
		loadError = null;
		try {
			const result = await getAdminVerificationLogs({
				page: currentPage,
				limit: pageSize,
				search: searchQuery.trim() || undefined,
				status: filterStatus === 'all' ? undefined : filterStatus,
				method: filterMethod === 'all' ? undefined : filterMethod
			});
			if (request !== requestNumber) return;
			logs = result.items;
			totalLogs = result.total;
		} catch (error) {
			if (request === requestNumber) {
				loadError = error instanceof Error ? error.message : 'Impossible de charger les logs de vérification.';
			}
		} finally {
			if (request === requestNumber) loading = false;
		}
	}

	$effect(() => {
		searchQuery; filterStatus; filterMethod; currentPage; pageSize;
		const timer = setTimeout(loadLogs, 250);
		return () => clearTimeout(timer);
	});

	function formatDate(dateString: string): string {
		const date = new Date(dateString);
		if (isNaN(date.getTime())) return dateString;
		return new Intl.DateTimeFormat('fr-FR', {
			day: 'numeric',
			month: 'short',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		}).format(date);
	}
</script>

<svelte:head>
	<title>Logs de Verifikasyon · DJR Akademi Admin</title>
</svelte:head>

<div class="space-y-8 p-1">
	<!-- Top Bar Header Card -->
	<div class="bg-base-100 p-6 sm:p-8 shadow-sm rounded-2xl border border-base-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
		<div>
			<div class="flex items-center gap-2.5">
				<div class="size-10 bg-primary/10 text-primary rounded-xl grid place-items-center font-bold">
					<ShieldCheck size={22} />
				</div>
				<div>
					<h1 class="text-2xl font-bold tracking-tight text-base-content sm:text-3xl">
						Logs de Verifikasyon
					</h1>
					<p class="text-xs text-base-content/60 mt-0.5">
						Istwa ak suivi tout tentativ debloke aksè kat Lemon Squeezy ak MonCash / Natcash.
					</p>
				</div>
			</div>
		</div>

		<div class="flex items-center gap-3">
			<button
				type="button"
				onclick={loadLogs}
				disabled={loading}
				class="btn btn-outline btn-sm rounded-xl font-bold gap-2"
			>
				<RefreshCw size={14} class={loading ? 'animate-spin' : ''} />
				Rafrechi
			</button>
			<div class="px-4 py-2 bg-base-200/60 rounded-xl text-xs font-bold text-base-content/80 shrink-0 border border-base-200/60">
				{totalLogs} tentativ
			</div>
		</div>
	</div>

	<!-- Controls & Filters Section -->
	<div class="bg-base-100 p-4 sm:p-6 shadow-sm rounded-2xl border border-base-200/80 space-y-4">
		<div class="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
			<!-- Search Input -->
			<div class="md:col-span-6 relative">
				<Search size={18} class="absolute left-3.5 top-1/2 -translate-y-1/2 text-base-content/40" />
				<input
					type="text"
					bind:value={searchQuery}
					placeholder="Rechercher par imel, refferans, ID utilisateur ou message..."
					class="input input-sm sm:input-md w-full pl-10 rounded-xl bg-base-200/50 border-base-300 focus:border-primary text-xs sm:text-sm font-medium"
				/>
			</div>

			<!-- Method Filter -->
			<div class="md:col-span-3">
				<select
					bind:value={filterMethod}
					class="select select-sm sm:select-md w-full rounded-xl bg-base-200/50 border-base-300 text-xs sm:text-sm font-medium"
				>
					<option value="all">Tout mwayen (Kat &amp; Mobil)</option>
					<option value="carte">Kat Lemon Squeezy</option>
					<option value="mobile">MonCash / Natcash</option>
				</select>
			</div>

			<!-- Status Filter -->
			<div class="md:col-span-3">
				<select
					bind:value={filterStatus}
					class="select select-sm sm:select-md w-full rounded-xl bg-base-200/50 border-base-300 text-xs sm:text-sm font-medium"
				>
					<option value="all">Tout statut (Siksè &amp; Echèk)</option>
					<option value="success">Siksè sèlman (✓)</option>
					<option value="failed">Echèk sèlman (✕)</option>
				</select>
			</div>
		</div>
	</div>

	<!-- Main Data Table Container -->
	<div class="bg-base-100 shadow-sm rounded-2xl border border-base-200/80 overflow-hidden">
		{#if loading && logs.length === 0}
			<div class="p-16 text-center space-y-4">
				<Loader2 size={36} class="animate-spin text-primary mx-auto" />
				<p class="text-xs text-base-content/60 font-semibold">N ap chaje log verifikasyon yo...</p>
			</div>
		{:else if loadError}
			<div class="p-12 text-center text-error space-y-3">
				<XCircle size={36} class="mx-auto" />
				<p class="text-xs font-bold">{loadError}</p>
				<button type="button" onclick={loadLogs} class="btn btn-xs btn-outline btn-error rounded-lg">Re-eseye</button>
			</div>
		{:else if logs.length === 0}
			<div class="p-16 text-center text-base-content/50 space-y-3">
				<ShieldCheck size={40} class="mx-auto opacity-30" />
				<h3 class="font-bold text-sm text-base-content">Pa gen log verifikasyon pou kounye a</h3>
				<p class="text-xs text-base-content/60 max-w-sm mx-auto">Chak tentativ debloke aksè pa kat oswa mobil ap parèt isit la an tan reyèl.</p>
			</div>
		{:else}
			<div class="overflow-x-auto">
				<table class="table table-zebra w-full text-xs">
					<thead>
						<tr class="bg-base-200/50 text-base-content/70 font-bold uppercase tracking-wider text-[11px]">
							<th>Dat &amp; Lè</th>
							<th>Itilizatè (User ID)</th>
							<th>Vale Saisie (Email / Ref)</th>
							<th>Mwayen</th>
							<th>Statut</th>
							<th>Mesaj Repons</th>
							<th>Actions</th>
						</tr>
					</thead>
					<tbody>
						{#each logs as item (item.id)}
							<tr class="hover:bg-base-200/40 transition-colors">
								<td class="whitespace-nowrap font-medium text-base-content/70">
									<div class="flex items-center gap-1.5">
										<Calendar size={13} class="text-base-content/40" />
										{formatDate(item.createdAt)}
									</div>
								</td>

								<td class="font-mono text-base-content/80 font-bold">
									<div class="flex items-center gap-1">
										<User size={13} class="text-primary" />
										<span class="truncate max-w-[120px]" title={item.userId}>{item.userId}</span>
									</div>
								</td>

								<td class="font-bold text-base-content">
									<span class="font-mono text-xs bg-base-200/80 px-2 py-0.5 rounded border border-base-300">
										{item.inputValue}
									</span>
								</td>

								<td>
									{#if item.method === 'carte'}
										<span class="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-500/10 text-amber-700 dark:text-amber-400 font-bold rounded-lg text-[10px] uppercase">
											<CreditCard size={12} /> Kat (Lemon)
										</span>
									{:else}
										<span class="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-bold rounded-lg text-[10px] uppercase">
											<Smartphone size={12} /> Mobil (MonCash)
										</span>
									{/if}
								</td>

								<td>
									{#if item.status === 'success'}
										<span class="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-black rounded-full text-[10px] uppercase">
											<CheckCircle2 size={12} /> Siksè
										</span>
									{:else}
										<span class="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-500/15 text-rose-600 dark:text-rose-400 font-black rounded-full text-[10px] uppercase">
											<XCircle size={12} /> Echèk
										</span>
									{/if}
								</td>

								<td class="max-w-xs truncate text-base-content/70 font-medium" title={item.message}>
									{item.message || '—'}
								</td>

								<td>
									<button
										type="button"
										onclick={() => (selectedLog = item)}
										class="btn btn-ghost btn-xs font-bold text-primary gap-1"
									>
										<Info size={13} /> Detay
									</button>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>

			<!-- Pagination Footer -->
			<div class="p-4 border-t border-base-200/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-medium">
				<div class="text-base-content/60">
					Afichaj paj <span class="font-bold text-base-content">{currentPage}</span> sou <span class="font-bold text-base-content">{totalPages}</span> ({totalLogs} log)
				</div>

				<div class="flex items-center gap-2">
					<button
						type="button"
						disabled={currentPage <= 1 || loading}
						onclick={() => (currentPage -= 1)}
						class="btn btn-outline btn-xs rounded-lg gap-1 font-bold disabled:opacity-40"
					>
						<ChevronLeft size={14} /> Presedan
					</button>
					<button
						type="button"
						disabled={currentPage >= totalPages || loading}
						onclick={() => (currentPage += 1)}
						class="btn btn-outline btn-xs rounded-lg gap-1 font-bold disabled:opacity-40"
					>
						Swivan <ChevronRight size={14} />
					</button>
				</div>
			</div>
		{/if}
	</div>
</div>

<!-- Log Detail Modal -->
{#if selectedLog}
	<div class="modal modal-open modal-bottom sm:modal-middle bg-black/60 backdrop-blur-sm z-50">
		<div class="modal-box max-w-lg p-6 rounded-2xl space-y-5 border border-base-300 shadow-2xl">
			<div class="flex items-center justify-between pb-3 border-b border-base-200">
				<div class="flex items-center gap-2">
					<div class="size-8 bg-primary/10 text-primary rounded-lg grid place-items-center font-bold">
						<ShieldCheck size={18} />
					</div>
					<h3 class="font-bold text-base text-base-content">Detay Log Verifikasyon</h3>
				</div>
				<button type="button" onclick={() => (selectedLog = null)} class="btn btn-circle btn-ghost btn-xs text-base-content/60">✕</button>
			</div>

			<div class="space-y-3 text-xs">
				<div class="grid grid-cols-2 gap-3 p-3 bg-base-200/50 rounded-xl border border-base-300/60">
					<div>
						<span class="text-base-content/50 block font-medium">ID Log</span>
						<span class="font-mono font-bold text-base-content">{selectedLog.id}</span>
					</div>
					<div>
						<span class="text-base-content/50 block font-medium">Dat &amp; Lè</span>
						<span class="font-bold text-base-content">{formatDate(selectedLog.createdAt)}</span>
					</div>
					<div>
						<span class="text-base-content/50 block font-medium">ID Itilizatè</span>
						<span class="font-mono font-bold text-primary">{selectedLog.userId}</span>
					</div>
					<div>
						<span class="text-base-content/50 block font-medium">Mwayen</span>
						<span class="font-bold uppercase text-base-content">{selectedLog.method}</span>
					</div>
				</div>

				<div class="p-3 bg-base-200/50 rounded-xl border border-base-300/60 space-y-1">
					<span class="text-base-content/50 block font-medium">Vale Saisie (Email / Referans)</span>
					<span class="font-mono font-bold text-sm text-base-content">{selectedLog.inputValue}</span>
				</div>

				<div class="p-3 bg-base-200/50 rounded-xl border border-base-300/60 space-y-1">
					<span class="text-base-content/50 block font-medium">Statut &amp; Mesaj Repons</span>
					<div class="flex items-center gap-2 mb-1">
						{#if selectedLog.status === 'success'}
							<span class="px-2 py-0.5 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold rounded-md text-[10px]">SIKSÈ</span>
						{:else}
							<span class="px-2 py-0.5 bg-rose-500/15 text-rose-600 dark:text-rose-400 font-bold rounded-md text-[10px]">ECHÈK</span>
						{/if}
					</div>
					<p class="text-base-content/80 font-medium leading-relaxed">{selectedLog.message}</p>
				</div>

				{#if selectedLog.grantedItems}
					<div class="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-700 dark:text-emerald-400 space-y-1">
						<span class="block font-bold">Produit / Cours Débloqué :</span>
						<span class="font-mono text-xs">{selectedLog.grantedItems}</span>
					</div>
				{/if}
			</div>

			<div class="modal-action pt-2 border-t border-base-200">
				<button type="button" onclick={() => (selectedLog = null)} class="btn btn-sm btn-neutral rounded-xl font-bold px-6">
					Fèmen
				</button>
			</div>
		</div>
	</div>
{/if}
