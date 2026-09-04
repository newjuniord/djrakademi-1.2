<script lang="ts">
	import { onMount } from 'svelte';
	import type { ApiLogEntry, ApiMethod } from '$lib/types/admin';
	import {
		fetchAdminHealth,
		purgeAdminHealthLogs,
		isAdminHealthBackendConfigured,
		type AdminHealthSnapshot,
		type AdminHealthStatus
	} from '$lib/health/health-client';
	import LogDetailDrawer from '$lib/components/admin/LogDetailDrawer.svelte';
	import {
		Search,
		CheckCircle2,
		XCircle,
		Code2,
		Server,
		Clock,
		ChevronLeft,
		ChevronRight,
		RefreshCw,
		Trash2,
		AlertTriangle
	} from 'lucide-svelte';

	let snapshot = $state<AdminHealthSnapshot | null>(null);
	let logs = $state<ApiLogEntry[]>([]);
	let loading = $state(true);
	let loadError = $state('');
	let searchQuery = $state('');
	let filterMethod = $state<ApiMethod | 'all'>('all');
	let filterStatusGroup = $state<'all' | '2xx' | '4xx' | '5xx'>('all');
	let pageSize = $state(10);
	let currentPage = $state(1);
	let selectedLog = $state<ApiLogEntry | null>(null);
	let drawerOpen = $state(false);
	let purgingDays = $state<number | null>(null);
	let purgeMessage = $state('');
	let confirmModalOpen = $state(false);
	let pendingPurgeDays = $state<number | null>(null);

	function promptPurgeLogs(days: number) {
		pendingPurgeDays = days;
		confirmModalOpen = true;
	}

	async function confirmPurgeLogs() {
		if (!pendingPurgeDays) return;
		const days = pendingPurgeDays;
		confirmModalOpen = false;
		purgingDays = days;
		purgeMessage = '';
		try {
			const res = await purgeAdminHealthLogs(days);
			purgeMessage = `${res.deletedCount} log(s) datant de plus de ${days} jours ont été supprimés avec succès.`;
			await loadHealth();
		} catch (err) {
			purgeMessage = err instanceof Error ? err.message : 'Erreur lors de la suppression des logs.';
		} finally {
			purgingDays = null;
			pendingPurgeDays = null;
		}
	}

	$effect(() => {
		searchQuery;
		filterMethod;
		filterStatusGroup;
		currentPage = 1;
	});

	let totalLogs = $derived(logs.length);
	let successCount = $derived(logs.filter((log) => log.statusCode < 400).length);
	let errorCount = $derived(totalLogs > 0 ? logs.filter((log) => log.statusCode >= 400 || Boolean(log.responsePayload?.error)).length : null);
	let successRate = $derived(totalLogs > 0 ? ((successCount / totalLogs) * 100).toFixed(1) : null);
	let avgLatency = $derived(
		totalLogs > 0
			? Math.round(logs.reduce((total, log) => total + log.responseTimeMs, 0) / totalLogs)
			: null
	);

	let filteredLogs = $derived(
		logs.filter((log) => {
			const query = searchQuery.toLowerCase();
			const matchesSearch =
				log.endpoint.toLowerCase().includes(query) ||
				log.clientIp.toLowerCase().includes(query) ||
				log.id.toLowerCase().includes(query) ||
				(log.requestPayload && JSON.stringify(log.requestPayload).toLowerCase().includes(query)) ||
				(log.responsePayload && JSON.stringify(log.responsePayload).toLowerCase().includes(query));
			const matchesMethod = filterMethod === 'all' || log.method === filterMethod;
			const matchesStatusGroup =
				filterStatusGroup === 'all' ||
				(filterStatusGroup === '2xx' && log.statusCode >= 200 && log.statusCode < 300) ||
				(filterStatusGroup === '4xx' && log.statusCode >= 400 && log.statusCode < 500) ||
				(filterStatusGroup === '5xx' && log.statusCode >= 500);
			return matchesSearch && matchesMethod && matchesStatusGroup;
		})
	);

	let totalPages = $derived(Math.ceil(filteredLogs.length / pageSize) || 1);
	let paginatedLogs = $derived(filteredLogs.slice((currentPage - 1) * pageSize, currentPage * pageSize));

	function statusLabel(status?: AdminHealthStatus): string {
		if (status === 'operational') return 'Système opérationnel';
		if (status === 'degraded') return 'Système dégradé';
		if (status === 'down') return 'Système indisponible';
		return 'État inconnu';
	}

	function statusClass(status?: AdminHealthStatus): string {
		if (status === 'operational') return 'bg-success/15 text-success';
		if (status === 'degraded') return 'bg-warning/15 text-warning';
		return 'bg-error/15 text-error';
	}

	async function loadHealth(): Promise<void> {
		loading = true;
		loadError = '';
		try {
			const data = await fetchAdminHealth();
			snapshot = data;
			logs = data.logs;
			selectedLog = null;
			drawerOpen = false;
		} catch (error) {
			snapshot = null;
			logs = [];
			loadError = error instanceof Error ? error.message : 'Impossible de charger la santé de l’API.';
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		void loadHealth();
	});

	function openLogInspector(log: ApiLogEntry) {
		selectedLog = log;
		drawerOpen = true;
	}

	function formatTime(timestamp: string): string {
		const date = new Date(timestamp);
		if (Number.isNaN(date.getTime())) return timestamp;
		return date.toLocaleTimeString('fr-FR', {
			hour: '2-digit',
			minute: '2-digit',
			second: '2-digit'
		});
	}
</script>

<svelte:head>
	<title>Supervision Plopplop · DJR Akademi Admin</title>
</svelte:head>

<div class="space-y-8 p-1">
	<!-- Top Bar Header Card -->
	<div class="bg-base-100 p-6 sm:p-8 shadow-sm rounded-none border-none flex flex-col sm:flex-row sm:items-center justify-between gap-6">
		<div>
			<div class="flex items-center gap-3">
				<h1 class="text-2xl font-bold tracking-tight text-base-content sm:text-3xl">Supervision Plopplop</h1>
				{#if loading}
					<span class="inline-flex items-center gap-1.5 px-3 py-1 bg-base-200 text-base-content/70 font-bold text-xs rounded-none">
						<RefreshCw size={12} class="animate-spin" /> Vérification
					</span>
				{:else}
					<span class="inline-flex items-center gap-1.5 px-3 py-1 font-bold text-xs rounded-none {statusClass(snapshot?.status)}">
						<span class="w-2 h-2 rounded-full bg-current"></span>{statusLabel(snapshot?.status)}
					</span>
				{/if}
			</div>
			<p class="text-xs text-base-content/60 mt-1">Créations et vérifications de paiement enregistrées par le backend sécurisé.</p>
		</div>
		<div class="flex flex-wrap items-center gap-2">
			<button
				type="button"
				disabled={purgingDays !== null || loading}
				class="btn btn-outline border-error/40 text-error hover:bg-error hover:text-white rounded-none btn-sm font-semibold text-xs gap-1.5 px-3"
				onclick={() => promptPurgeLogs(3)}
			>
				<Trash2 size={13} class={purgingDays === 3 ? "animate-spin" : ""} />
				Effacer (> 3 jours)
			</button>
			<button
				type="button"
				disabled={purgingDays !== null || loading}
				class="btn btn-outline border-error/40 text-error hover:bg-error hover:text-white rounded-none btn-sm font-semibold text-xs gap-1.5 px-3"
				onclick={() => promptPurgeLogs(7)}
			>
				<Trash2 size={13} class={purgingDays === 7 ? "animate-spin" : ""} />
				Effacer (> 7 jours)
			</button>
			<button
				type="button"
				disabled={loading || !isAdminHealthBackendConfigured()}
				class="btn bg-black text-white hover:bg-black/90 border-none rounded-none btn-sm font-semibold text-xs gap-2 px-4"
				onclick={loadHealth}
			>
				<RefreshCw size={14} class={loading ? "animate-spin" : ""} /> Actualiser
			</button>
		</div>
	</div>

	{#if purgeMessage}
		<div class="bg-info/10 text-info border border-info/20 p-4 text-xs font-semibold flex items-center justify-between">
			<span>{purgeMessage}</span>
			<button type="button" class="underline text-[11px]" onclick={() => (purgeMessage = '')}>Fermer</button>
		</div>
	{/if}

	{#if loadError}
		<div class="bg-error/10 text-error border border-error/20 p-4 text-xs font-semibold">{loadError}</div>
	{/if}

	<!-- 4 Health Indicator Stat Cards -->
	<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
		<!-- Card 1: Statut Plopplop -->
		<div class="bg-base-100 p-6 shadow-sm rounded-none border-none flex items-center justify-between">
			<div>
				<span class="text-xs font-semibold text-base-content/60 block">Statut API</span>
				<span class="text-xl font-bold text-base-content mt-1 block">{snapshot?.statusCode ?? '—'} {snapshot?.statusText || ''}</span>
			</div>
			<Server
				size={24}
				class="shrink-0 {snapshot?.status === 'operational' ? 'text-success' : snapshot?.status === 'degraded' ? 'text-warning' : 'text-error'}"
			/>
		</div>

		<!-- Card 2: Taux de succès -->
		<div class="bg-base-100 p-6 shadow-sm rounded-none border-none flex items-center justify-between">
			<div>
				<span class="text-xs font-semibold text-base-content/60 block">Taux de succès</span>
				<span class="text-xl font-bold text-base-content mt-1 block">{successRate === null ? '—' : successRate + ' %'}</span>
			</div>
			<CheckCircle2 size={24} class="text-primary shrink-0" />
		</div>

		<!-- Card 3: Latence Moyenne -->
		<div class="bg-base-100 p-6 shadow-sm rounded-none border-none flex items-center justify-between">
			<div>
				<span class="text-xs font-semibold text-base-content/60 block">Latence Moyenne</span>
				<span class="text-xl font-bold text-base-content mt-1 block">{avgLatency === null ? '—' : avgLatency + ' ms'}</span>
			</div>
			<Clock size={24} class="text-warning shrink-0" />
		</div>

		<!-- Card 4: Erreurs 5xx -->
		<div class="bg-base-100 p-6 shadow-sm rounded-none border-none flex items-center justify-between">
			<div>
				<span class="text-xs font-semibold text-base-content/60 block">Erreurs API</span>
				<span class="text-xl font-bold text-error mt-1 block">{errorCount ?? '—'}</span>
			</div>
			<XCircle size={24} class="text-error shrink-0" />
		</div>
	</div>

	<!-- Main Logs Table Card (Untitled UI Table04AlternatingFills) -->
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
					placeholder="Rechercher par endpoint, commande ou transaction..."
					bind:value={searchQuery}
					class="input input-ghost bg-base-200/50 w-full pl-12 pr-4 h-11 text-xs rounded-none focus:bg-base-100 focus:shadow-xs border-none"
				/>
			</div>

			<!-- Filters Group aligned right flush -->
			<div class="flex flex-wrap items-center justify-end gap-3 lg:ml-auto">
				<!-- Status Group Filter -->
				<select
					bind:value={filterStatusGroup}
					aria-label="Filtrer par famille de statut HTTP"
					class="select select-sm bg-base-200/60 rounded-none text-xs border-none font-semibold text-base-content"
				>
					<option value="all">Tous les statuts</option>
					<option value="2xx">2xx — Succès</option>
					<option value="4xx">4xx — Erreur client</option>
					<option value="5xx">5xx — Erreur serveur</option>
				</select>

				<!-- Method Selector -->
				<select
					bind:value={filterMethod}
					class="select select-sm bg-base-200/60 rounded-none text-xs border-none font-semibold text-base-content"
				>
					<option value="all">Toutes méthodes</option>
					<option value="GET">GET</option>
					<option value="POST">POST</option>
					<option value="PUT">PUT</option>
					<option value="PATCH">PATCH</option>
					<option value="DELETE">DELETE</option>
				</select>

				<!-- Page Size Selector -->
				<select
					bind:value={pageSize}
					aria-label="Affichage par page"
					class="select select-sm bg-base-200/60 rounded-none text-xs border-none font-semibold text-base-content"
				>
					<option value={5}>5 par page</option>
					<option value={10}>10 par page</option>
					<option value={25}>25 par page</option>
					<option value={50}>50 par page</option>
				</select>
			</div>
		</div>

		<!-- Table View -->
		<div class="overflow-x-auto">
			<table class="table w-full rounded-none text-left border-collapse">
				<thead>
					<tr class="border-b border-base-200 text-xs font-semibold text-base-content/50 uppercase tracking-wider bg-base-100">
						<th class="py-4 px-4 font-bold">Méthode & Route</th>
						<th class="py-4 px-4 font-bold">Statut</th>
						<th class="py-4 px-4 font-bold">Latence</th>
						<th class="py-4 px-4 font-bold">Origine</th>
						<th class="py-4 px-4 font-bold">Heure</th>
						<th class="py-4 px-4 font-bold text-right">Inspecter JSON</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-base-200/60 text-xs font-mono">
					{#if paginatedLogs.length === 0}
						<tr>
							<td colspan="6" class="py-12 text-center text-base-content/50 font-sans">
								{loading ? 'Chargement des logs…' : loadError ? 'Logs indisponibles.' : 'Aucun appel Plopplop enregistré pour le moment.'}
							</td>
						</tr>
					{:else}
						{#each paginatedLogs as log (log.id)}
							<tr class="hover:bg-base-200/60 odd:bg-base-200/40 transition-colors">
								<!-- Column 1: Méthode & Route -->
								<td class="py-4 px-4">
									<div class="flex items-center gap-2.5">
										<span
											class="badge badge-xs font-extrabold text-[10px] uppercase rounded-none border-none py-2 px-2 shrink-0 {log.method === 'GET' ? 'bg-info/20 text-info' : log.method === 'POST' ? 'bg-success/20 text-success' : log.method === 'PUT' ? 'bg-warning/20 text-warning' : 'bg-error/20 text-error'}"
										>
											{log.method}
										</span>
										<button
											type="button"
											class="font-bold text-base-content hover:underline hover:text-primary transition-colors text-left truncate max-w-xs sm:max-w-md"
											onclick={() => openLogInspector(log)}
										>
											{log.endpoint}
										</button>
									</div>
								</td>

								<!-- Column 2: Statut -->
								<td class="py-4 px-4">
									{#if log.statusCode < 300}
										<span class="badge badge-success badge-sm font-bold text-[11px] bg-success/15 text-success border-none">
											{log.statusCode} {log.statusText}
										</span>
									{:else if log.statusCode < 500}
										<span class="badge badge-warning badge-sm font-bold text-[11px] bg-warning/15 text-warning border-none">
											{log.statusCode} {log.statusText}
										</span>
									{:else}
										<span class="badge badge-error badge-sm font-bold text-[11px] bg-error/15 text-error border-none">
											{log.statusCode} {log.statusText}
										</span>
									{/if}
								</td>

								<!-- Column 3: Latence -->
								<td class="py-4 px-4 text-base-content/80 font-bold">
									{log.responseTimeMs} ms
								</td>

								<!-- Column 4: Origine -->
								<td class="py-4 px-4 text-base-content/70">
									{log.clientIp}
								</td>

								<!-- Column 5: Heure -->
								<td class="py-4 px-4 text-base-content/60">
									{formatTime(log.timestamp)}
								</td>

								<!-- Column 6: Actions -->
								<td class="py-4 px-4 text-right font-sans">
									<button
										type="button"
										class="btn btn-ghost btn-xs rounded-none gap-1 font-bold text-xs border border-base-200"
										onclick={() => openLogInspector(log)}
									>
										<Code2 size={14} class="text-primary" />
										Inspecter JSON
									</button>
								</td>
							</tr>
						{/each}
					{/if}
				</tbody>
			</table>
		</div>

		<!-- Pagination Footer (< Précédent   Suivant >) -->
		<div class="flex items-center justify-between border-t border-base-200/60 pt-4 text-xs font-sans">
			<span class="text-base-content/60 font-medium">
				Affichage de {filteredLogs.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} à {Math.min(currentPage * pageSize, filteredLogs.length)} sur {filteredLogs.length} logs
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

<!-- Log Detail JSON Inspector Drawer -->
<LogDetailDrawer
	open={drawerOpen}
	log={selectedLog}
	onClose={() => (drawerOpen = false)}
/>

<!-- Confirmation Purge UX Modal Popup -->
{#if confirmModalOpen}
	<div class="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
		<div class="bg-base-100 max-w-md w-full p-6 sm:p-8 shadow-2xl rounded-2xl border border-base-200/80 space-y-6 animate-in fade-in zoom-in-95 duration-150">
			<div class="flex items-start gap-4">
				<div class="size-12 bg-error/15 text-error rounded-2xl grid place-items-center shrink-0">
					<AlertTriangle size={24} />
				</div>
				<div class="space-y-1">
					<h3 class="text-lg font-bold text-base-content tracking-tight">Suppression de logs</h3>
					<p class="text-xs text-base-content/70 leading-relaxed">
						Voulez-vous vraiment supprimer les logs datant de plus de <strong class="text-base-content font-mono">{pendingPurgeDays} jours</strong> ?
					</p>
				</div>
			</div>

			<p class="text-[11px] text-base-content/50 bg-base-200/60 p-3 rounded-xl">
				Cette opération retirera définitivement les enregistrements de l'historique Plopplop pour alléger la base de données.
			</p>

			<div class="flex items-center justify-end gap-3 pt-2">
				<button
					type="button"
					class="btn btn-ghost btn-sm rounded-xl text-xs font-bold px-4"
					onclick={() => (confirmModalOpen = false)}
				>
					Annuler
				</button>
				<button
					type="button"
					class="btn bg-error hover:bg-error/90 text-white rounded-xl border-none btn-sm text-xs font-bold gap-2 px-5"
					onclick={confirmPurgeLogs}
				>
					<Trash2 size={14} />
					Oui, supprimer les logs
				</button>
			</div>
		</div>
	</div>
{/if}
