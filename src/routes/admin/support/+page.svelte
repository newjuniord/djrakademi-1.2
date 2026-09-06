<script lang="ts">
	import { onMount } from 'svelte';
	import { Search, Loader2, MessageSquare, MessageCircle, CheckCircle2, Clock, Sparkles, Send, Eye, RefreshCw, Trash2, AlertTriangle } from 'lucide-svelte';
	import type { SupportMessage, SupportTicketStatus } from '$lib/types/support';
	import { getAdminSupportTickets, updateAdminSupportTicket } from '$lib/services/support';
	import { adminRequest } from '$lib/admin/admin-client';
	import { whatsappLink } from '$lib/coaching/validation';
	import { toast } from '$lib/toast.svelte';

	let tickets = $state<SupportMessage[]>([]);
	let loading = $state(true);
	let filterStatus = $state<SupportTicketStatus | 'all'>('all');
	let search = $state('');

	let selectedTicket = $state<SupportMessage | null>(null);
	let adminReplyInput = $state('');
	let updating = $state(false);

	// Purge state
	let showPurgeModal = $state(false);
	let purgeStatus = $state<SupportTicketStatus | 'all'>('resolved');
	let purgeDays = $state(30);
	let purging = $state(false);

	async function handlePurge() {
		purging = true;
		try {
			const params = new URLSearchParams({ days: String(purgeDays), status: purgeStatus });
			const res = (await adminRequest(`/support?${params}`, { method: 'DELETE' })) as { deleted: number };
			toast.success(`${res.deleted} ticket(s) supprimé(s) avec succès.`);
			showPurgeModal = false;
			await loadTickets();
		} catch (e: any) {
			toast.error(e.message || 'Erreur lors de la purge.');
		} finally {
			purging = false;
		}
	}

	async function loadTickets() {
		loading = true;
		try {
			const res = await getAdminSupportTickets(filterStatus);
			tickets = res;
		} catch (e) {
			console.error('Failed to load admin support tickets:', e);
			toast.error('Erreur lors du chargement des tickets de support.');
		} finally {
			loading = false;
		}
	}

	onMount(loadTickets);

	$effect(() => {
		if (filterStatus) {
			loadTickets();
		}
	});

	let currentPage = $state(1);
	const pageSize = 10;

	let visibleTickets = $derived(
		tickets.filter((t) => {
			const term = search.toLowerCase().trim();
			if (!term) return true;
			return (
				t.presetLabel.toLowerCase().includes(term) ||
				(t.productTitle || '').toLowerCase().includes(term) ||
				(t.whatsapp || '').toLowerCase().includes(term) ||
				(t.userEmail || '').toLowerCase().includes(term) ||
				(t.userId || '').toLowerCase().includes(term)
			);
		})
	);

	const totalPages = $derived(Math.max(1, Math.ceil(visibleTickets.length / pageSize)));
	const paginatedTickets = $derived(
		visibleTickets.slice((currentPage - 1) * pageSize, currentPage * pageSize)
	);

	$effect(() => { search; filterStatus; currentPage = 1; });

	function openTicketModal(ticket: SupportMessage) {
		selectedTicket = ticket;
		adminReplyInput = ticket.adminReply || '';
	}

	async function handleSaveTicket(newStatus?: SupportTicketStatus) {
		if (!selectedTicket) return;
		updating = true;
		try {
			const updated = await updateAdminSupportTicket(selectedTicket.id, {
				status: newStatus || selectedTicket.status,
				adminReply: adminReplyInput
			});
			tickets = tickets.map((t) => (t.id === updated.id ? updated : t));
			selectedTicket = updated;
			toast.success('Ticket de support mis à jour avec succès.');
		} catch (e: any) {
			toast.error(e.message || 'Impossible de mettre à jour le ticket.');
		} finally {
			updating = false;
		}
	}

	function formatDate(iso: string) {
		try {
			return new Intl.DateTimeFormat('fr-FR', {
				day: '2-digit',
				month: 'short',
				year: 'numeric',
				hour: '2-digit',
				minute: '2-digit'
			}).format(new Date(iso));
		} catch {
			return iso;
		}
	}
</script>

<svelte:head>
	<title>Support Client · Administration DJR Akademi</title>
</svelte:head>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
		<div>
			<h2 class="text-2xl font-black text-base-content tracking-tight flex items-center gap-2.5">
				<MessageSquare class="text-primary" size={26} />
				<span>Support Client</span>
			</h2>
			<p class="mt-1 text-xs text-base-content/60 font-medium">
				Gestion des requêtes de support envoyées par les utilisateurs ayant passé une commande.
			</p>
		</div>

		<div class="flex items-center gap-2">
			<button
				type="button"
				onclick={() => (showPurgeModal = true)}
				class="btn btn-error btn-outline btn-sm gap-2"
				title="Supprimer les anciens tickets"
			>
				<Trash2 size={15} />
				<span>Purge</span>
			</button>
			<button
				type="button"
				onclick={loadTickets}
				disabled={loading}
				class="btn btn-outline btn-sm gap-2"
			>
				<RefreshCw size={15} class={loading ? 'animate-spin' : ''} />
				<span>Rafraîchir</span>
			</button>
		</div>
	</div>

	<!-- Main Card -->
	<div class="card border border-base-300 bg-base-100 shadow-none overflow-hidden">
		<!-- Filters & Search -->
		<div class="flex flex-col gap-3 border-b border-base-300 p-4 sm:flex-row">
			<label class="input input-bordered flex flex-1 items-center gap-2">
				<Search size={17} class="text-base-content/50" />
				<input
					class="grow text-xs font-medium"
					type="search"
					placeholder="Rechercher par message, produit, WhatsApp..."
					bind:value={search}
				/>
			</label>

			<select class="select select-bordered text-xs font-semibold" bind:value={filterStatus}>
				<option value="all">Tous les statuts</option>
				<option value="open">En attente</option>
				<option value="in_progress">En cours</option>
				<option value="resolved">Résolu</option>
			</select>
		</div>

		<!-- Table -->
		{#if loading}
			<div class="p-12 text-center text-base-content/50 space-y-3">
				<Loader2 size={32} class="mx-auto animate-spin text-primary" />
				<p class="text-xs font-semibold">Chargement des demandes de support...</p>
			</div>
		{:else if visibleTickets.length === 0}
			<div class="p-12 text-center text-base-content/50 space-y-2">
				<MessageSquare size={36} class="mx-auto text-base-content/30" />
				<p class="text-sm font-bold">Aucune demande de support trouvée.</p>
			</div>
		{:else}
			<div class="overflow-x-auto">
				<table class="table min-w-[1000px]">
					<thead>
						<tr>
							<th>Date</th>
							<th>Client / User</th>
							<th>Produit / Commande</th>
							<th>Message de support</th>
							<th>WhatsApp</th>
							<th>Statut</th>
							<th class="text-right">Actions</th>
						</tr>
					</thead>
					<tbody>
					{#each paginatedTickets as ticket (ticket.id)}
							<tr>
								<td class="text-xs font-medium text-base-content/70 whitespace-nowrap">
									{formatDate(ticket.createdAt)}
								</td>

								<td>
									<span class="font-mono text-xs font-bold text-base-content/80">
										{ticket.userId.slice(0, 12)}...
									</span>
								</td>

								<td>
									{#if ticket.productTitle}
										<div class="space-y-0.5">
											<span class="badge badge-outline badge-xs uppercase font-extrabold">
												{ticket.productType}
											</span>
											<p class="font-bold text-xs max-w-xs truncate">{ticket.productTitle}</p>
										</div>
									{:else}
										<span class="text-xs text-base-content/50 italic">Général</span>
									{/if}
								</td>

								<td class="max-w-xs">
									<p class="font-semibold text-xs leading-snug">{ticket.presetLabel}</p>
								</td>

								<td>
									{#if ticket.whatsapp}
										<a
											href={whatsappLink(ticket.whatsapp, `Bonjour, je suis le support DJR Akademi concernant votre demande (${ticket.presetLabel}).`)}
											target="_blank"
											rel="noreferrer"
											class="btn btn-xs btn-success gap-1 text-[11px] font-bold text-white shadow-xs"
										>
											<MessageCircle size={13} />
											<span>{ticket.whatsapp}</span>
										</a>
									{:else}
										<span class="text-xs text-base-content/40 italic">Non fourni</span>
									{/if}
								</td>

								<td>
									{#if ticket.status === 'resolved'}
										<span class="badge badge-success badge-sm font-bold">Résolu</span>
									{:else if ticket.status === 'in_progress'}
										<span class="badge badge-info badge-sm font-bold">En cours</span>
									{:else}
										<span class="badge badge-warning badge-sm font-bold">En attente</span>
									{/if}
								</td>

								<td class="text-right">
									<button
										type="button"
										onclick={() => openTicketModal(ticket)}
										class="btn btn-ghost btn-square btn-sm"
										aria-label="Voir le ticket"
									>
										<Eye size={17} />
									</button>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}

		<!-- Pagination -->
		{#if !loading && visibleTickets.length > 0}
			<div class="flex items-center justify-between border-t border-base-300 px-4 py-3 text-xs text-base-content/60">
				<span>
					Affichage de
					<span class="font-bold text-base-content">{visibleTickets.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}</span>
					à
					<span class="font-bold text-base-content">{Math.min(currentPage * pageSize, visibleTickets.length)}</span>
					sur
					<span class="font-bold text-base-content">{visibleTickets.length}</span>
					ticket(s)
				</span>
				<div class="join">
					<button
						class="join-item btn btn-xs btn-ghost font-bold"
						disabled={currentPage <= 1}
						onclick={() => currentPage--}
					>«</button>
					<button class="join-item btn btn-xs btn-ghost font-mono" disabled>
						{currentPage} / {totalPages}
					</button>
					<button
						class="join-item btn btn-xs btn-ghost font-bold"
						disabled={currentPage >= totalPages}
						onclick={() => currentPage++}
					>»</button>
				</div>
			</div>
		{/if}
	</div>
</div>

<!-- Ticket Detail Modal -->
{#if selectedTicket}
	<div class="modal modal-open" role="dialog" aria-modal="true" aria-labelledby="admin-support-modal-title">
		<div class="modal-box max-w-xl space-y-4">
			<button
				class="btn btn-ghost btn-sm btn-circle absolute right-3 top-3"
				type="button"
				aria-label="Fermer"
				onclick={() => (selectedTicket = null)}
			>
				✕
			</button>

			<div class="flex items-center gap-3">
				<div class="grid size-10 place-items-center rounded-2xl bg-primary/10 text-primary">
					<MessageSquare size={22} />
				</div>
				<div>
					<h3 id="admin-support-modal-title" class="text-lg font-bold">
						Détails du Ticket de Support
					</h3>
					<p class="text-xs text-base-content/60 font-mono">
						ID: {selectedTicket.id} · {formatDate(selectedTicket.createdAt)}
					</p>
				</div>
			</div>

			<!-- Info card -->
			<div class="rounded-2xl border border-base-300 bg-base-200/50 p-4 text-xs space-y-2">
				<div>
					<span class="text-base-content/50 font-bold uppercase text-[10px]">Message sélectionné par le client :</span>
					<p class="font-bold text-sm text-base-content mt-0.5">{selectedTicket.presetLabel}</p>
				</div>

				<!-- Client info -->
				<div class="pt-2 border-t border-base-300/60 space-y-1.5">
					<div class="flex items-center justify-between gap-2">
						<span class="text-base-content/60">User ID :</span>
						<span class="font-mono text-[11px] font-bold text-base-content/80 select-all">{selectedTicket.userId}</span>
					</div>
					{#if selectedTicket.userEmail}
						<div class="flex items-center justify-between gap-2">
							<span class="text-base-content/60">Email :</span>
							<a href="mailto:{selectedTicket.userEmail}" class="link link-primary font-bold text-[11px]">
								{selectedTicket.userEmail}
							</a>
						</div>
					{/if}
				</div>

				{#if selectedTicket.productTitle}
					<div class="pt-2 border-t border-base-300/60 flex items-center justify-between">
						<span class="text-base-content/60">Produit concerné :</span>
						<span class="font-bold">{selectedTicket.productTitle} ({selectedTicket.productType})</span>
					</div>
				{/if}

				{#if selectedTicket.whatsapp}
					<div class="pt-2 border-t border-base-300/60 flex items-center justify-between">
						<span class="text-base-content/60">WhatsApp :</span>
						<a
							href={whatsappLink(selectedTicket.whatsapp, `Bonjour, je suis le support DJR Akademi concernant votre demande (${selectedTicket.presetLabel}).`)}
							target="_blank"
							rel="noreferrer"
							class="link link-primary font-bold flex items-center gap-1"
						>
							<MessageCircle size={14} />
							<span>{selectedTicket.whatsapp}</span>
						</a>
					</div>
				{/if}
			</div>

			<!-- Reply form -->
			<div class="space-y-2">
				<label for="admin-reply" class="label text-xs font-bold">
					Réponse administrateur (visible dans l'espace support du client) :
				</label>
				<textarea
					id="admin-reply"
					rows="3"
					class="textarea textarea-bordered w-full text-xs font-medium"
					placeholder="Rédigez votre réponse au client ici..."
					bind:value={adminReplyInput}
				></textarea>
			</div>

			<!-- Actions -->
			<div class="modal-action flex-wrap gap-2">
				{#if selectedTicket.whatsapp}
					<a
						href={whatsappLink(selectedTicket.whatsapp, `Bonjour, je suis le support DJR Akademi concernant votre demande (${selectedTicket.presetLabel}).`)}
						target="_blank"
						rel="noreferrer"
						class="btn btn-success btn-sm font-bold"
					>
						<MessageCircle size={16} />
						<span>Ouvrir WhatsApp</span>
					</a>
				{/if}

				<button
					type="button"
					disabled={updating}
					onclick={() => handleSaveTicket('in_progress')}
					class="btn btn-info btn-sm font-bold"
				>
					Passer En cours
				</button>

				<button
					type="button"
					disabled={updating}
					onclick={() => handleSaveTicket('resolved')}
					class="btn btn-primary btn-sm font-bold"
				>
					<CheckCircle2 size={16} />
					<span>Marquer Résolu</span>
				</button>
			</div>
		</div>

		<button
			class="modal-backdrop"
			type="button"
			aria-label="Fermer"
			onclick={() => (selectedTicket = null)}
		>
			close
		</button>
	</div>
{/if}

<!-- ─── Purge Confirmation Modal ─────────────────────────── -->
{#if showPurgeModal}
	<div class="modal modal-open" role="dialog" aria-modal="true">
		<div class="modal-box max-w-md space-y-5">
			<button
				class="btn btn-ghost btn-sm btn-circle absolute right-3 top-3"
				type="button"
				aria-label="Fermer"
				onclick={() => (showPurgeModal = false)}
			>✕</button>

			<div class="flex items-center gap-3">
				<div class="grid size-10 place-items-center rounded-2xl bg-error/10 text-error shrink-0">
					<Trash2 size={20} />
				</div>
				<div>
					<h3 class="text-base font-bold">Purge des anciens tickets</h3>
					<p class="text-xs text-base-content/60">Suppression définitive des tickets dépassant la date limite</p>
				</div>
			</div>

			<!-- Options -->
			<div class="space-y-3">
				<div class="form-control">
					<label class="label" for="purge-status">
						<span class="label-text text-xs font-bold">Filtrer par statut :</span>
					</label>
					<select id="purge-status" class="select select-bordered select-sm text-sm font-semibold" bind:value={purgeStatus}>
						<option value="all">Tous les statuts (en attente + en cours + résolu)</option>
						<option value="resolved">Seulement Résolu ✅</option>
						<option value="in_progress">Seulement En cours 🔄</option>
						<option value="open">Seulement En attente ⏳</option>
					</select>
				</div>

				<div class="form-control">
					<label class="label" for="purge-days">
						<span class="label-text text-xs font-bold">Supprimer les tickets de plus de :</span>
					</label>
					<select id="purge-days" class="select select-bordered select-sm text-sm font-semibold" bind:value={purgeDays}>
						<option value={7}>7 jours</option>
						<option value={14}>14 jours</option>
						<option value={30}>30 jours</option>
						<option value={60}>60 jours</option>
						<option value={90}>90 jours</option>
					</select>
				</div>

				<div class="rounded-xl border border-error/30 bg-error/5 p-3 text-xs text-error flex items-start gap-2">
					<AlertTriangle size={14} class="mt-0.5 shrink-0" />
					<p>
						Cette action supprimera <strong>définitivement</strong> tous les tickets
						{#if purgeStatus !== 'all'}de statut « {purgeStatus === 'resolved' ? 'résolu' : purgeStatus === 'in_progress' ? 'en cours' : 'en attente'} »{:else}(tous statuts){/if}
						créés il y a plus de <strong>{purgeDays} jours</strong>. Cette action est irréversible.
					</p>
				</div>
			</div>

			<div class="modal-action gap-2">
				<button
					type="button"
					onclick={() => (showPurgeModal = false)}
					class="btn btn-ghost btn-sm"
				>Annuler</button>
				<button
					type="button"
					disabled={purging}
					onclick={handlePurge}
					class="btn btn-error btn-sm gap-2 font-bold"
				>
					{#if purging}
						<Loader2 size={15} class="animate-spin" />
						<span>Suppression en cours...</span>
					{:else}
						<Trash2 size={15} />
						<span>Confirmer la purge</span>
					{/if}
				</button>
			</div>
		</div>
		<button class="modal-backdrop" type="button" onclick={() => (showPurgeModal = false)}>close</button>
	</div>
{/if}
