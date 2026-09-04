<script lang="ts">
	import { onMount } from 'svelte';
	import type { Ebook } from '$lib/types/admin';
	import { getEbooks, deleteEbook as deleteEbookService } from '$lib/services/ebooks';
	import {
		Plus,
		Search,
		MoreVertical,
		Edit3,
		Eye,
		Trash2,
		BookOpen,
		FileText,
		CheckCircle,
		ChevronLeft,
		ChevronRight,
		Loader2
	} from 'lucide-svelte';

	let ebooks = $state<Ebook[]>([]);
	let loading = $state(true);
	let loadError = $state<string | null>(null);
	let actionError = $state<string | null>(null);

	// Search & Filter state
	let searchQuery = $state('');
	let filterStatus = $state<'all' | 'published' | 'draft'>('all');

	// Pagination state (20 per page)
	let pageSize = $state(20);
	let currentPage = $state(1);

	// Delete Modal state
	let deleteModalEbook = $state<Ebook | null>(null);
	let deleting = $state(false);

	onMount(async () => {
		try {
			ebooks = await getEbooks();
		} catch (error) {
			loadError = error instanceof Error ? error.message : "Impossible de charger les ebooks.";
		} finally {
			loading = false;
		}
	});

	$effect(() => {
		searchQuery;
		filterStatus;
		currentPage = 1;
	});

	// Derived filtered ebooks
	let filteredEbooks = $derived(
		ebooks.filter((e) => {
			const matchesSearch =
				e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
				(e.fileName && e.fileName.toLowerCase().includes(searchQuery.toLowerCase()));

			const matchesFilter =
				filterStatus === 'all' ||
				(filterStatus === 'published' && e.published) ||
				(filterStatus === 'draft' && !e.published);

			return matchesSearch && matchesFilter;
		})
	);

	// Pagination slicing
	let totalPages = $derived(Math.ceil(filteredEbooks.length / pageSize) || 1);
	let paginatedEbooks = $derived(
		filteredEbooks.slice((currentPage - 1) * pageSize, currentPage * pageSize)
	);

	import { toast } from '$lib/toast.svelte';

	async function handleDelete(ebook: Ebook) {
		if (deleting) return;
		deleting = true;
		actionError = null;
		try {
			await deleteEbookService(ebook.id);
			ebooks = ebooks.filter((item) => item.id !== ebook.id);
			deleteModalEbook = null;
			toast.success('L\'ebook a été supprimé avec succès.');
		} catch (e) {
			console.error("Failed to delete ebook:", e);
			const msg = e instanceof Error ? e.message : "Impossible de supprimer l’ebook.";
			actionError = msg;
			toast.error(msg);
		} finally {
			deleting = false;
		}
	}
</script>

<svelte:head>
	<title>Ebooks · DJR Akademi Admin</title>
</svelte:head>

<div class="space-y-10 p-1">
	{#if loadError}
		<div class="alert alert-error rounded-none text-sm">{loadError}</div>
	{/if}
	{#if actionError}
		<div class="alert alert-error rounded-none text-sm">{actionError}</div>
	{/if}
	<!-- Top Bar Header Card -->
	<div class="bg-base-100 p-6 sm:p-8 shadow-sm rounded-none border-none flex flex-col sm:flex-row sm:items-center justify-between gap-6">
		<div>
			<h1 class="text-2xl font-bold tracking-tight text-base-content sm:text-3xl">
				Ebooks
			</h1>
			<p class="text-xs text-base-content/60 mt-1">
				Créez et gérez vos ebooks.
			</p>
		</div>

		<a
			href="/admin/ebooks/new"
			class="btn bg-black text-white hover:bg-black/90 border-none rounded-none btn-sm font-semibold text-xs gap-2 px-6 self-start sm:self-auto"
		>
			<Plus size={16} />
			Nouvel ebook
		</a>
	</div>

	<!-- Main Table Container Card (Untitled UI Table04AlternatingFills) -->
	<div class="bg-base-100 shadow-sm rounded-none border-none overflow-hidden space-y-6 p-6 sm:p-8">
		<!-- Search and Filter Bar -->
		<div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
			<!-- Search Input with pl-12 padding so typed text never overlaps icon -->
			<div class="relative w-full sm:w-96">
				<Search
					size={16}
					class="absolute left-4 top-1/2 -translate-y-1/2 text-base-content/40 pointer-events-none"
				/>
				<input
					type="text"
					placeholder="Rechercher un ebook..."
					bind:value={searchQuery}
					class="input input-ghost bg-base-200/50 w-full pl-12 pr-4 h-11 text-xs rounded-none focus:bg-base-100 focus:shadow-xs border-none"
				/>
			</div>

			<!-- Status Filters: Tous / Publiés / Brouillons -->
			<div class="flex items-center gap-1.5 bg-base-200/60 p-1 rounded-none self-start sm:self-auto">
				<button
					type="button"
					class="px-4 py-2 text-xs font-semibold rounded-none transition-all {filterStatus === 'all' ? 'bg-base-100 text-base-content shadow-xs font-bold' : 'text-base-content/60 hover:text-base-content'}"
					onclick={() => (filterStatus = 'all')}
				>
					Tous
				</button>
				<button
					type="button"
					class="px-4 py-2 text-xs font-semibold rounded-none transition-all {filterStatus === 'published' ? 'bg-base-100 text-base-content shadow-xs font-bold' : 'text-base-content/60 hover:text-base-content'}"
					onclick={() => (filterStatus = 'published')}
				>
					Publiés
				</button>
				<button
					type="button"
					class="px-4 py-2 text-xs font-semibold rounded-none transition-all {filterStatus === 'draft' ? 'bg-base-100 text-base-content shadow-xs font-bold' : 'text-base-content/60 hover:text-base-content'}"
					onclick={() => (filterStatus = 'draft')}
				>
					Brouillons
				</button>
			</div>
		</div>

		<!-- Table View -->
		<div class="overflow-x-auto min-h-[360px] pb-16">
			<table class="table w-full rounded-none text-left border-collapse">
				<thead>
					<tr class="border-b border-base-200 text-xs font-semibold text-base-content/50 uppercase tracking-wider bg-base-100">
						<th class="py-4 px-4 font-bold">Ebook</th>
						<th class="py-4 px-4 font-bold">Prix</th>
						<th class="py-4 px-4 font-bold">Ventes</th>
						<th class="py-4 px-4 font-bold">Statut</th>
						<th class="py-4 px-4 font-bold text-right">Actions</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-base-200/60 text-xs">
					{#if paginatedEbooks.length === 0}
						<tr>
							<td colspan="5" class="py-12 text-center text-base-content/50">
								Aucun ebook trouvé.
							</td>
						</tr>
					{:else}
						{#each paginatedEbooks as ebook (ebook.id)}
							<tr class="hover:bg-base-200/60 odd:bg-base-200/40 transition-colors">
								<!-- Column 1: Ebook (Cover + Title) -->
								<td class="py-4 px-4">
									<div class="flex items-center gap-3">
										{#if ebook.cover}
											<img
												src={ebook.cover}
												alt={ebook.title}
												class="w-10 h-14 object-cover shrink-0 rounded-none border border-base-200"
											/>
										{:else}
											<div class="w-10 h-14 bg-base-200 shrink-0 grid place-items-center rounded-none text-base-content/40">
												<FileText size={18} />
											</div>
										{/if}

										<div>
											<a
												href="/admin/ebooks/{ebook.id}"
												class="font-bold text-base-content hover:underline line-clamp-1"
											>
												{ebook.title}
											</a>
											{#if ebook.fileName}
												<span class="text-[11px] text-base-content/50 font-mono block">
													{ebook.fileName}
												</span>
											{/if}
										</div>
									</div>
								</td>

								<!-- Column 2: Prix -->
								<td class="py-4 px-4 font-bold text-base-content text-xs">
									{#if ebook.isFree || ebook.price === 0}
										<span class="text-success font-semibold">Gratuit</span>
									{:else}
										<span>{ebook.price.toLocaleString('fr-FR')} HTG{#if ebook.priceUsd && ebook.priceUsd > 0} (${ebook.priceUsd} USD){/if}</span>
									{/if}
								</td>

								<!-- Column 3: Fichier PDF -->
								<td class="py-4 px-4">
									{#if ebook.pdfFileId}
										<span class="badge badge-outline badge-xs gap-1 font-mono text-[10px]">
											<FileText size={10} />
											PDF chargé
										</span>
									{:else}
										<span class="text-[11px] text-base-content/40 italic">
											Aucun PDF
										</span>
									{/if}
								</td>

								<!-- Column 4: Statut -->
								<td class="py-4 px-4">
									{#if ebook.published}
										<span class="badge badge-success badge-sm font-semibold text-[11px] bg-success/15 text-success border-none">
											Publié
										</span>
									{:else}
										<span class="badge badge-neutral badge-sm font-semibold text-[11px] bg-base-300/80 text-base-content/60 border-none">
											Brouillon
										</span>
									{/if}
								</td>

								<!-- Column 5: Actions Dropdown Menu -->
								<td class="py-4 px-4 text-right">
									<div class="dropdown dropdown-end dropdown-bottom focus-within:z-50 hover:z-50 relative">
										<button
											type="button"
											class="btn btn-ghost btn-xs btn-square rounded-none border-none text-base-content/60 hover:text-base-content"
										>
											<MoreVertical size={16} />
										</button>
										<ul
											class="dropdown-content z-50 menu p-2 shadow-2xl bg-base-100 rounded-none border border-base-200 w-40 text-xs gap-1"
										>
											<li>
												<a href="/admin/ebooks/{ebook.id}" class="rounded-none gap-2 font-semibold">
													<Edit3 size={14} />
													Modifier
												</a>
											</li>
											<li>
												<a href="/admin/ebooks/{ebook.id}" class="rounded-none gap-2 text-base-content/70">
													<Eye size={14} />
													Voir
												</a>
											</li>
											<li>
												<button
													type="button"
													class="rounded-none gap-2 text-error font-semibold hover:bg-error/10"
													onclick={() => (deleteModalEbook = ebook)}
												>
													<Trash2 size={14} />
													Supprimer
												</button>
											</li>
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
				Affichage de {filteredEbooks.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} à {Math.min(currentPage * pageSize, filteredEbooks.length)} sur {filteredEbooks.length} ebooks
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

<!-- Modal Confirmation Suppression -->
{#if deleteModalEbook}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
		<div class="bg-base-100 rounded-none shadow-2xl p-6 w-full max-w-md space-y-4 border border-base-200">
			<h3 class="font-bold text-lg text-base-content">
				Supprimer cet ebook ?
			</h3>
			<p class="text-xs text-base-content/70 leading-relaxed">
				Cet ebook ne sera plus disponible dans votre catalogue.
			</p>
			<div class="flex items-center justify-end gap-3 pt-4 border-t border-base-200">
				<button
					type="button"
					class="btn btn-ghost btn-xs rounded-none font-semibold"
					onclick={() => (deleteModalEbook = null)}
				>
					Annuler
				</button>
				<button
					type="button"
					class="btn btn-error text-white btn-xs rounded-none font-semibold px-4"
					onclick={() => handleDelete(deleteModalEbook!)}
				>
					Supprimer
				</button>
			</div>
		</div>
	</div>
{/if}
