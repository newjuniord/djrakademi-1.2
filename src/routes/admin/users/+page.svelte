<script lang="ts">
	import { onMount } from 'svelte';
	import type { AdminUser, UserStatus } from '$lib/types/admin';
	import {
		Search,
		User,
		UserCheck,
		UserX,
		MoreVertical,
		Plus,
		BookOpen,
		FileText,
		CheckCircle,
		AlertCircle,
		ExternalLink,
		X,
		ChevronLeft,
		ChevronRight,
		Loader2
	} from 'lucide-svelte';
	import { getAdminUsers, getAdminProducts, setAdminUserStatus, createAdminAccessGrant, type AdminProductOption } from '$lib/admin/admin-client';

	let users = $state<AdminUser[]>([]);
	let loading = $state(true);
	let loadError = $state<string | null>(null);
	let totalUsers = $state(0);
	let products = $state<AdminProductOption[]>([]);
	let actionSaving = $state(false);

	// Search & Filter state
	let searchQuery = $state('');
	let statusFilter = $state<'all' | 'active' | 'disabled'>('all');

	// Pagination state (10 users per page default to prevent heavy requests)
	let pageSize = $state(10);
	let currentPage = $state(1);

	// Modal states
	let grantModalUser = $state<AdminUser | null>(null);
	let disableModalUser = $state<AdminUser | null>(null);

	// Grant access form state
	let grantType = $state<'Cours' | 'Ebook'>('Cours');
	let selectedProduct = $state('');
	let availableProducts = $derived(products.filter((product) => product.type === (grantType === 'Cours' ? 'course' : 'ebook')));

	import { toast } from '$lib/toast.svelte';

	function showToast(msg: string) {
		toast.success(msg);
	}

	let totalPages = $derived(Math.max(1, Math.ceil(totalUsers / pageSize)));
	let startRange = $derived(totalUsers === 0 ? 0 : (currentPage - 1) * pageSize + 1);
	let endRange = $derived(Math.min(currentPage * pageSize, totalUsers));

	let requestNumber = 0;
	async function loadUsers() {
		const request = ++requestNumber;
		loading = true;
		loadError = null;
		try {
			const result = await getAdminUsers({ page: currentPage, limit: pageSize, search: searchQuery.trim() || undefined, status: statusFilter === 'all' ? undefined : statusFilter });
			if (request !== requestNumber) return;
			users = result.items;
			totalUsers = result.total;
		} catch (error) {
			if (request === requestNumber) loadError = error instanceof Error ? error.message : 'Impossible de charger les utilisateurs.';
		} finally {
			if (request === requestNumber) loading = false;
		}
	}

	onMount(async () => {
		try { products = await getAdminProducts(); }
		catch { products = []; }
	});

	$effect(() => {
		searchQuery; statusFilter; currentPage; pageSize;
		const timer = setTimeout(loadUsers, 250);
		return () => clearTimeout(timer);
	});

	function getInitials(name: string): string {
		return name
			.split(' ')
			.map((n) => n[0])
			.join('')
			.toUpperCase()
			.slice(0, 2);
	}

	function formatDate(value: string): string {
		const date = new Date(value);
		return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
	}

	function formatAccess(courseCount: number, ebookCount: number): string {
		if (courseCount === 0 && ebookCount === 0) {
			return 'Aucun accès';
		}
		const parts: string[] = [];
		if (courseCount > 0) {
			parts.push(`${courseCount} ${courseCount > 1 ? 'cours' : 'cours'}`);
		}
		if (ebookCount > 0) {
			parts.push(`${ebookCount} ${ebookCount > 1 ? 'ebooks' : 'ebook'}`);
		}
		return parts.join(' · ');
	}

	function openGrantModal(user: AdminUser) {
		grantModalUser = user;
		grantType = 'Cours';
		selectedProduct = products.find((product) => product.type === 'course')?.id || '';
	}

	function closeGrantModal() {
		grantModalUser = null;
	}

	async function submitGrantAccess() {
		if (!grantModalUser || !selectedProduct || actionSaving) return;
		actionSaving = true;
		try {
			await createAdminAccessGrant({ userId: grantModalUser.id, itemType: grantType === 'Cours' ? 'course' : 'ebook', itemId: selectedProduct });
			await loadUsers();
			showToast('Accès ajouté avec succès');
			closeGrantModal();
		} catch (error) {
			showToast(error instanceof Error ? error.message : 'Impossible d’ajouter cet accès.');
		} finally { actionSaving = false; }
	}

	function openDisableModal(user: AdminUser) {
		disableModalUser = user;
	}

	function closeDisableModal() {
		disableModalUser = null;
	}

	async function confirmDisableUser() {
		if (!disableModalUser) return;
		const targetId = disableModalUser.id;
		const newStatus: UserStatus = disableModalUser.status === 'active' ? 'disabled' : 'active';

		try {
			await setAdminUserStatus(targetId, newStatus);
			users = users.map((u) => {
				if (u.id === targetId) {
					return { ...u, status: newStatus };
				}
				return u;
			});
			showToast(newStatus === 'disabled' ? 'Utilisateur désactivé' : 'Utilisateur réactivé');
		} catch (e) {
			console.error('Failed to update status in Appwrite:', e);
			showToast('Erreur lors du changement de statut');
		} finally {
			closeDisableModal();
		}
	}

	async function reactivateUser(user: AdminUser) {
		if (actionSaving) return;
		actionSaving = true;
		try {
			await setAdminUserStatus(user.id, 'active');
			users = users.map((item) => item.id === user.id ? { ...item, status: 'active' } : item);
			showToast('Utilisateur réactivé avec succès');
		} catch (error) {
			showToast(error instanceof Error ? error.message : 'Impossible de réactiver cet utilisateur.');
		} finally { actionSaving = false; }
	}
</script>

<svelte:head>
	<title>Utilisateurs · Administration</title>
</svelte:head>

<div class="space-y-10 p-1">
	<!-- TableCard Root (Untitled UI Model) with 40px gap between children -->
	<div class="bg-base-100 shadow-sm rounded-none border-none overflow-hidden flex flex-col gap-10">
		<!-- TableCard Header -->
		<div class="p-6 flex flex-col gap-10 border-b border-base-200/70">
			<!-- Title & Trailing Info -->
			<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
				<div>
					<h1 class="text-2xl font-bold tracking-tight text-base-content sm:text-3xl">Utilisateurs</h1>
					<p class="text-sm text-base-content/60 mt-1">Gérez les utilisateurs et leurs accès.</p>
				</div>
				<div class="flex items-center gap-2 self-start sm:self-auto">
					<span class="badge badge-lg font-bold bg-base-200/60 shadow-xs border-none px-4 py-3.5 text-sm rounded-none">
						{totalUsers} utilisateurs
					</span>
				</div>
			</div>

			<!-- Search & Filter Controls (Content Trailing) -->
			<div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
				<!-- Search Input -->
				<div class="relative flex-1">
					<Search size={18} class="absolute left-3.5 top-1/2 -translate-y-1/2 text-base-content/40 pointer-events-none" />
					<input
						type="text"
						placeholder="Rechercher par nom ou email..."
						bind:value={searchQuery}
						oninput={() => (currentPage = 1)}
						class="input input-ghost bg-base-200/50 w-full pl-12 pr-10 h-11 text-sm rounded-none focus:bg-base-100 focus:shadow-xs border-none"
					/>
					{#if searchQuery}
						<button
							type="button"
							class="absolute right-3.5 top-1/2 -translate-y-1/2 text-base-content/40 hover:text-base-content"
							onclick={() => (searchQuery = '')}
						>
							<X size={16} />
						</button>
					{/if}
				</div>

				<!-- Filter Tabs -->
				<div class="flex items-center gap-1.5 bg-base-200/60 p-1.5 rounded-none shrink-0 self-start sm:self-auto">
					<button
						type="button"
						class="px-4 py-2 text-xs font-semibold rounded-none transition-all {statusFilter === 'all' ? 'bg-base-100 text-base-content shadow-xs font-bold' : 'text-base-content/60 hover:text-base-content'}"
						onclick={() => { statusFilter = 'all'; currentPage = 1; }}
					>
						Tous ({totalUsers})
					</button>
					<button
						type="button"
						class="px-4 py-2 text-xs font-semibold rounded-none transition-all {statusFilter === 'active' ? 'bg-base-100 text-base-content shadow-xs font-bold' : 'text-base-content/60 hover:text-base-content'}"
						onclick={() => { statusFilter = 'active'; currentPage = 1; }}
					>
						Actifs
					</button>
					<button
						type="button"
						class="px-4 py-2 text-xs font-semibold rounded-none transition-all {statusFilter === 'disabled' ? 'bg-base-100 text-base-content shadow-xs font-bold' : 'text-base-content/60 hover:text-base-content'}"
						onclick={() => { statusFilter = 'disabled'; currentPage = 1; }}
					>
						Désactivés
					</button>
				</div>

				<!-- Page Size Selector -->
				<select
					bind:value={pageSize}
					onchange={() => (currentPage = 1)}
					aria-label="Affichage par page"
					class="select select-sm bg-base-200/60 rounded-none text-xs border-none font-semibold text-base-content"
				>
					<option value={10}>10 par page</option>
					<option value={20}>20 par page</option>
					<option value={50}>50 par page</option>
				</select>
			</div>
		</div>

		<!-- Table Component with Alternating Fills (odd:bg-secondary / odd:bg-base-200/40) -->
		<div class="overflow-x-auto min-h-[360px] pb-16">
			<table class="table w-full rounded-none" aria-label="Table des utilisateurs">
				<!-- Table Header -->
				<thead class="bg-base-200/70 text-xs font-bold text-base-content/60 uppercase tracking-wider border-b border-base-200">
					<tr>
						<th class="py-4 pl-7">Utilisateur</th>
						<th class="py-4 px-5">Accès</th>
						<th class="py-4 px-5 hidden md:table-cell">Date d'inscription</th>
						<th class="py-4 px-5">Statut</th>
						<th class="py-4 pr-7 text-right">Actions</th>
					</tr>
				</thead>

				<!-- Table Body with Alternating Rows -->
				<tbody class="text-sm">
					{#if loading}
						<tr><td colspan="5" class="py-16 text-center"><Loader2 size={24} class="mx-auto animate-spin text-primary" /><span class="mt-2 block text-xs text-base-content/60">Chargement des utilisateurs…</span></td></tr>
					{:else if loadError}
						<tr><td colspan="5" class="py-16 text-center text-error"><AlertCircle size={22} class="mx-auto" /><span class="mt-2 block text-xs">{loadError}</span><button type="button" class="btn btn-sm mt-3" onclick={loadUsers}>Réessayer</button></td></tr>
					{:else}{#each users as user (user.id)}
						{@const accessText = formatAccess(user.courseCount, user.ebookCount)}
						<tr class="odd:bg-base-200/40 even:bg-base-100 hover:bg-base-200/70 transition-colors border-b border-base-200/50 relative focus-within:z-40">
							<!-- Cell: Utilisateur (Avatar + Name + Email) -->
							<td class="py-5 pl-7">
								<div class="flex items-center gap-3.5 group">
									<a href="/admin/users/{user.id}" class="avatar placeholder shrink-0">
										<div class="w-10 rounded-full bg-primary text-primary-content font-bold text-xs ring-2 ring-primary/10 flex items-center justify-center">
											<User size={18} />
										</div>
									</a>
									<div class="flex flex-col min-w-0">
										<a
											href="/admin/users/{user.id}"
											class="font-semibold text-base-content group-hover:text-primary transition-colors truncate text-sm"
										>
											{user.name}
										</a>
										<a
											href="mailto:{user.email}"
											class="text-xs text-base-content/60 hover:underline truncate mt-0.5"
										>
											{user.email}
										</a>
									</div>
								</div>
							</td>

							<!-- Cell: Accès -->
							<td class="py-5 px-5 whitespace-nowrap">
								<span class="font-medium text-xs {accessText === 'Aucun accès' ? 'text-base-content/40 italic' : 'text-base-content/85'}">
									{accessText}
								</span>
							</td>

							<!-- Cell: Inscription (Hidden on mobile) -->
							<td class="py-5 px-5 text-xs text-base-content/60 hidden md:table-cell whitespace-nowrap">
								{formatDate(user.createdAt)}
							</td>

							<!-- Cell: Statut -->
							<td class="py-5 px-5 whitespace-nowrap">
								{#if user.status === 'active'}
									<span class="badge badge-success badge-sm gap-1.5 font-semibold text-[11px] bg-success/15 text-success border-none px-2.5 py-2">
										<span class="size-1.5 rounded-full bg-success"></span>
										Actif
									</span>
								{:else}
									<span class="badge badge-neutral badge-sm gap-1.5 font-semibold text-[11px] bg-base-300/80 text-base-content/60 border-none px-2.5 py-2">
										<span class="size-1.5 rounded-full bg-base-content/40"></span>
										Désactivé
									</span>
								{/if}
							</td>

							<!-- Cell: Actions (DropdownIconSimple) -->
							<td class="py-5 pr-7 text-right whitespace-nowrap">
								<div class="dropdown dropdown-end dropdown-bottom focus-within:z-50 hover:z-50 relative">
									<button
										tabindex="0"
										class="btn btn-ghost btn-square btn-sm rounded-none hover:bg-base-200"
										aria-label="Menu d'actions pour {user.name}"
									>
										<MoreVertical size={17} />
									</button>

									<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
									<ul
										tabindex="0"
										role="menu"
										aria-label="Actions utilisateur"
										class="dropdown-content menu z-50 mt-1 w-48 rounded-none bg-base-100 p-2 shadow-2xl border border-base-200 text-xs gap-1"
									>
										<li>
											<a href="/admin/users/{user.id}" class="flex items-center gap-2.5 py-2 font-medium">
												<ExternalLink size={14} class="text-base-content/60" />
												Voir le profil
											</a>
										</li>
										<li>
											<button
												type="button"
												class="flex items-center gap-2.5 py-2 font-medium"
												onclick={() => openGrantModal(user)}
											>
												<Plus size={14} class="text-base-content/60" />
												Donner un accès
											</button>
										</li>
										<div class="my-1 border-t border-base-200"></div>
										{#if user.status === 'active'}
											<li>
												<button
													type="button"
													class="flex items-center gap-2.5 py-2 font-medium text-error hover:bg-error/10"
													onclick={() => openDisableModal(user)}
												>
													<UserX size={14} />
													Désactiver
												</button>
											</li>
										{:else}
											<li>
												<button
													type="button"
													class="flex items-center gap-2.5 py-2 font-medium text-success hover:bg-success/10"
													onclick={() => reactivateUser(user)}
												>
													<UserCheck size={14} />
													Réactiver
												</button>
											</li>
										{/if}
									</ul>
								</div>
							</td>
						</tr>
					{:else}
						<tr>
							<td colspan="5" class="py-16 text-center text-base-content/50 text-sm">
								Aucun utilisateur trouvé pour cette recherche.
							</td>
						</tr>
					{/each}{/if}
				</tbody>
			</table>
		</div>

		<!-- TableCard Footer / Pagination (Untitled UI Model) -->
		<div class="p-5 border-t border-base-200/70 flex flex-col sm:flex-row items-center justify-between gap-4 bg-base-100 text-xs select-none">
			<!-- Range & Total Summary -->
			<p class="text-base-content/60 font-medium">
				Affichage de <strong class="text-base-content font-bold">{startRange}</strong> à <strong class="text-base-content font-bold">{endRange}</strong> sur <strong class="text-base-content font-bold">{totalUsers}</strong> utilisateurs
			</p>

			<!-- Pagination Navigation Controls -->
			<div class="flex items-center gap-3">
				<button
					type="button"
					class="btn btn-ghost bg-base-200/70 hover:bg-base-200 border-none btn-sm rounded-none gap-1 font-semibold text-xs text-base-content/80 disabled:bg-base-200/30 disabled:text-base-content/30"
					disabled={currentPage === 1}
					onclick={() => (currentPage = Math.max(1, currentPage - 1))}
				>
					<ChevronLeft size={16} />
					Précédent
				</button>

				<div class="flex items-center gap-1 font-semibold text-base-content/80 px-1">
					<span>Page {currentPage} sur {totalPages}</span>
				</div>

				<button
					type="button"
					class="btn btn-ghost bg-base-200/70 hover:bg-base-200 border-none btn-sm rounded-none gap-1 font-semibold text-xs text-base-content/80 disabled:bg-base-200/30 disabled:text-base-content/30"
					disabled={currentPage >= totalPages}
					onclick={() => (currentPage = Math.min(totalPages, currentPage + 1))}
				>
					Suivant
					<ChevronRight size={16} />
				</button>
			</div>
		</div>
	</div>
</div>

<!-- Modal: Donner un accès -->
{#if grantModalUser}
	<div class="modal modal-open z-50">
		<!-- Backdrop overlay -->
		<button
			type="button"
			class="modal-backdrop bg-neutral/40 backdrop-blur-xs"
			onclick={closeGrantModal}
			aria-label="Fermer la fenêtre"
		></button>

		<div class="modal-box max-w-md rounded-2xl p-6 border border-base-200 shadow-2xl">
			<div class="flex items-center justify-between border-b border-base-200 pb-4 mb-4">
				<div>
					<h3 class="text-lg font-bold text-base-content">Donner un accès</h3>
					<p class="text-xs text-base-content/60 mt-0.5">
						Pour <strong class="text-base-content">{grantModalUser.name}</strong> ({grantModalUser.email})
					</p>
				</div>
				<button
					type="button"
					class="btn btn-square btn-ghost btn-xs text-base-content/60"
					onclick={closeGrantModal}
				>
					<X size={16} />
				</button>
			</div>

			<form onsubmit={(e) => { e.preventDefault(); submitGrantAccess(); }} class="space-y-4">
				<!-- Select Type -->
				<div class="form-control">
					<label class="label py-1" for="grant-type">
						<span class="label-text text-xs font-bold uppercase tracking-wider text-base-content/60">Type d'accès</span>
					</label>
					<select
						id="grant-type"
						bind:value={grantType}
						onchange={() => (selectedProduct = products.find((product) => product.type === (grantType === 'Cours' ? 'course' : 'ebook'))?.id || '')}
						class="select select-bordered w-full text-sm rounded-xl border-base-300 focus:border-primary"
					>
						<option value="Cours">Cours</option>
						<option value="Ebook">Ebook</option>
					</select>
				</div>

				<!-- Select Product -->
				<div class="form-control">
					<label class="label py-1" for="grant-product">
						<span class="label-text text-xs font-bold uppercase tracking-wider text-base-content/60">Produit</span>
					</label>
					<select
						id="grant-product"
						bind:value={selectedProduct}
						class="select select-bordered w-full text-sm rounded-xl border-base-300 focus:border-primary"
					>
						{#each availableProducts as product}
							<option value={product.id}>{product.title}</option>
						{:else}
							<option value="" disabled>Aucun produit disponible</option>
						{/each}
					</select>
				</div>

				<!-- Form Actions -->
				<div class="flex items-center justify-end gap-2 pt-4 border-t border-base-200">
					<button
						type="button"
						class="btn btn-ghost btn-sm font-semibold rounded-xl text-xs"
						onclick={closeGrantModal}
					>
						Annuler
					</button>
					<button
						type="submit"
						disabled={actionSaving || !selectedProduct}
						class="btn btn-primary btn-sm font-semibold rounded-xl text-xs px-4"
					>
						{#if actionSaving}<Loader2 size={14} class="animate-spin" /> Enregistrement…{:else}Donner accès{/if}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<!-- Modal: Confirmation Désactivation -->
{#if disableModalUser}
	<div class="modal modal-open z-50">
		<button
			type="button"
			class="modal-backdrop bg-neutral/40 backdrop-blur-xs"
			onclick={closeDisableModal}
			aria-label="Fermer la fenêtre"
		></button>

		<div class="modal-box max-w-sm rounded-2xl p-6 border border-base-200 shadow-2xl">
			<div class="flex items-center gap-3 text-warning mb-3">
				<div class="grid size-10 place-items-center rounded-xl bg-warning/15">
					<AlertCircle size={22} />
				</div>
				<h3 class="text-base font-bold text-base-content">Désactiver cet utilisateur ?</h3>
			</div>

			<p class="text-xs text-base-content/70 mb-6 leading-relaxed">
				<strong>{disableModalUser.name}</strong> n'aura plus accès à ses cours et ebooks tant que son compte restera désactivé.
			</p>

			<div class="flex items-center justify-end gap-2 pt-3 border-t border-base-200">
				<button
					type="button"
					class="btn btn-ghost btn-sm font-semibold rounded-xl text-xs"
					onclick={closeDisableModal}
				>
					Annuler
				</button>
				<button
					type="button"
					class="btn btn-error btn-sm font-semibold text-white rounded-xl text-xs px-4"
					onclick={confirmDisableUser}
					disabled={actionSaving}
				>
					Désactiver
				</button>
			</div>
		</div>
	</div>
{/if}


