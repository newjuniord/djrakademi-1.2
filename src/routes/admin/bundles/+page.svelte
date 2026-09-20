<script lang="ts">
	import { onMount } from 'svelte';
	import { adminRequest, getAdminCourses } from '$lib/admin/admin-client';
	import { getEbooks } from '$lib/services/ebooks';
	import { uploadCourseCover } from '$lib/services/courses';
	import type { Course, Ebook } from '$lib/types/admin';
	import type { Bundle } from '$lib/services/bundles';
	import { toast } from '$lib/toast.svelte';
	import {
		Layers3,
		Plus,
		Save,
		BookOpen,
		FileText,
		ExternalLink,
		Search,
		MoreVertical,
		Edit3,
		Eye,
		Trash2,
		CheckCircle2,
		Clock,
		Sparkles,
		Tag,
		X,
		Loader2,
		AlertCircle,
		LayoutGrid,
		Table as TableIcon,
		ArrowRight,
		Percent,
		Zap,
		Upload,
		Image as ImageIcon
	} from 'lucide-svelte';

	// Main Data State
	let bundles = $state<Bundle[]>([]);
	let courses = $state<Course[]>([]);
	let ebooks = $state<Ebook[]>([]);
	let loading = $state(true);
	let saving = $state(false);
	let togglingId = $state<string | null>(null);
	let error = $state('');

	// Filter & View State
	let searchQuery = $state('');
	let filterStatus = $state<'all' | 'published' | 'draft'>('all');
	let viewMode = $state<'grid' | 'table'>('grid');

	// Drawer / Modal Form State
	let drawerOpen = $state(false);
	let editingId = $state<string | null>(null);
	let title = $state('');
	let description = $state('');
	let coverUrl = $state('');
	let coverFile = $state<File | null>(null);
	let coverInputRef = $state<HTMLInputElement | null>(null);
	let coverMode = $state<'file' | 'url'>('file');
	let price = $state(0);
	let priceUsd = $state(0);
	let variantId = $state('');
	let published = $state(false);
	let selected = $state<string[]>([]);
	let productSearch = $state('');
	let productFilterType = $state<'all' | 'course' | 'ebook'>('all');

	// Active Cover Preview
	let activeCoverPreview = $derived(
		coverFile ? URL.createObjectURL(coverFile) : coverUrl
	);

	// Delete Confirmation Modal State
	let deleteModalBundle = $state<Bundle | null>(null);
	let deleting = $state(false);

	// Product selection options derived from published courses and ebooks
	const options = $derived([
		...courses.filter((item) => item.published).map((item) => ({
			key: `course:${item.id}`,
			type: 'course' as const,
			id: item.id,
			title: item.title,
			price: item.price,
			cover: item.cover
		})),
		...ebooks.filter((item) => item.published).map((item) => ({
			key: `ebook:${item.id}`,
			type: 'ebook' as const,
			id: item.id,
			title: item.title,
			price: item.price,
			cover: item.cover
		}))
	]);

	// Filtered product options inside the form picker
	const filteredProductOptions = $derived(
		options.filter((item) => {
			const matchesSearch = item.title.toLowerCase().includes(productSearch.toLowerCase());
			const matchesType = productFilterType === 'all' || item.type === productFilterType;
			return matchesSearch && matchesType;
		})
	);

	// Calculated totals for form
	const regularPrice = $derived(
		options.filter((item) => selected.includes(item.key)).reduce((sum, item) => sum + item.price, 0)
	);
	const savingsAmount = $derived(Math.max(0, regularPrice - price));
	const savingsPercentage = $derived(
		regularPrice > 0 && price > 0 && price < regularPrice
			? Math.round(((regularPrice - price) / regularPrice) * 100)
			: 0
	);

	// Derived main filtered bundles list
	const filteredBundles = $derived(
		bundles.filter((bundle) => {
			const matchesSearch =
				bundle.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
				bundle.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
				bundle.items.some((item) => item.title.toLowerCase().includes(searchQuery.toLowerCase()));

			const matchesStatus =
				filterStatus === 'all' ||
				(filterStatus === 'published' && bundle.published) ||
				(filterStatus === 'draft' && !bundle.published);

			return matchesSearch && matchesStatus;
		})
	);

	// Calculated statistics
	const publishedCount = $derived(bundles.filter((b) => b.published).length);
	const draftCount = $derived(bundles.filter((b) => !b.published).length);
	const averageDiscount = $derived(() => {
		if (bundles.length === 0) return 0;
		let totalPercent = 0;
		let count = 0;
		for (const b of bundles) {
			if (b.originalPrice > 0 && b.price < b.originalPrice) {
				totalPercent += Math.round(((b.originalPrice - b.price) / b.originalPrice) * 100);
				count++;
			}
		}
		return count > 0 ? Math.round(totalPercent / count) : 0;
	});

	onMount(loadData);

	async function loadData() {
		loading = true;
		error = '';
		try {
			const [bundleData, courseData, ebookData] = await Promise.all([
				adminRequest<{ bundles: Bundle[] }>('/bundles'),
				getAdminCourses(),
				getEbooks()
			]);
			bundles = bundleData.bundles;
			courses = courseData;
			ebooks = ebookData;
		} catch (caught) {
			error = caught instanceof Error ? caught.message : 'Impossible de charger les bundles.';
		} finally {
			loading = false;
		}
	}

	function openCreateDrawer() {
		editingId = null;
		title = '';
		description = '';
		coverUrl = '';
		coverFile = null;
		coverMode = 'file';
		if (coverInputRef) coverInputRef.value = '';
		price = 0;
		priceUsd = 0;
		variantId = '';
		published = true;
		selected = [];
		productSearch = '';
		productFilterType = 'all';
		drawerOpen = true;
	}

	function openEditDrawer(bundle: Bundle) {
		editingId = bundle.id;
		title = bundle.title;
		description = bundle.description;
		coverUrl = bundle.cover.startsWith('/api/ebooks/') ? '' : bundle.cover;
		coverFile = null;
		coverMode = bundle.cover ? 'url' : 'file';
		if (coverInputRef) coverInputRef.value = '';
		price = bundle.price;
		priceUsd = bundle.priceUsd;
		variantId = bundle.variantId;
		published = bundle.published;
		selected = bundle.items.map((item) => `${item.type}:${item.id}`);
		productSearch = '';
		productFilterType = 'all';
		drawerOpen = true;
	}

	function handleCoverSelect(e: Event) {
		const target = e.target as HTMLInputElement;
		if (target.files && target.files.length > 0) {
			const file = target.files[0];
			if (!file.type.startsWith('image/')) {
				toast.error('Veuillez sélectionner un fichier image valide (JPG, PNG, WEBP).');
				return;
			}
			if (file.size > 10 * 1024 * 1024) {
				toast.error("L'image est trop volumineuse. La taille maximale autorisée est de 10 MB.");
				return;
			}
			coverFile = file;
			coverMode = 'file';
		}
	}

	function handleDropCover(e: DragEvent) {
		e.preventDefault();
		if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
			const file = e.dataTransfer.files[0];
			if (!file.type.startsWith('image/')) {
				toast.error('Veuillez sélectionner un fichier image valide (JPG, PNG, WEBP).');
				return;
			}
			if (file.size > 10 * 1024 * 1024) {
				toast.error("L'image est trop volumineuse. La taille maximale autorisée est de 10 MB.");
				return;
			}
			coverFile = file;
			coverMode = 'file';
		}
	}

	function removeCover() {
		coverFile = null;
		coverUrl = '';
		if (coverInputRef) coverInputRef.value = '';
	}

	function toggleItemSelection(key: string) {
		selected = selected.includes(key)
			? selected.filter((v) => v !== key)
			: [...selected, key];
	}

	async function saveBundle() {
		if (saving) return;
		if (!title.trim() || !description.trim()) {
			toast.error('Le titre et la description sont obligatoires.');
			return;
		}
		if (price <= 0) {
			toast.error('Veuillez entrer un prix valide supérieur à 0 HTG.');
			return;
		}
		if (selected.length < 2) {
			toast.error('Sélectionnez au moins deux produits (formations ou e-books) pour créer un bundle.');
			return;
		}

		saving = true;
		try {
			let finalCoverUrl = coverUrl.trim();

			// If a new cover image file was uploaded, upload it to storage
			if (coverFile) {
				try {
					const uploadedUrl = await uploadCourseCover(coverFile);
					if (uploadedUrl) {
						finalCoverUrl = uploadedUrl;
					}
				} catch (uploadErr) {
					console.error('[Appwrite Bundles] Failed to upload cover image file:', uploadErr);
					toast.error('Impossible de téléverser l\'image de couverture.');
					saving = false;
					return;
				}
			}

			const body = {
				title: title.trim(),
				description: description.trim(),
				coverUrl: finalCoverUrl,
				price: Number(price),
				priceUsd: Number(priceUsd),
				variantId: variantId.trim(),
				published,
				items: selected.map((value) => {
					const [type, id] = value.split(':');
					return { type, id };
				})
			};

			await adminRequest(editingId ? `/bundles/${editingId}` : '/bundles', {
				method: editingId ? 'PUT' : 'POST',
				body: JSON.stringify(body)
			});

			toast.success(editingId ? 'Bundle mis à jour avec succès !' : 'Nouveau bundle créé avec succès !');
			drawerOpen = false;
			await loadData();
		} catch (caught) {
			toast.error(caught instanceof Error ? caught.message : 'Impossible d’enregistrer le bundle.');
		} finally {
			saving = false;
		}
	}

	async function togglePublish(bundle: Bundle) {
		if (togglingId) return;
		togglingId = bundle.id;
		try {
			const newStatus = !bundle.published;
			const body = {
				title: bundle.title,
				description: bundle.description,
				coverUrl: bundle.cover.startsWith('/api/ebooks/') ? '' : bundle.cover,
				price: bundle.price,
				priceUsd: bundle.priceUsd,
				variantId: bundle.variantId,
				published: newStatus,
				items: bundle.items.map((item) => ({ type: item.type, id: item.id }))
			};
			await adminRequest(`/bundles/${bundle.id}`, {
				method: 'PUT',
				body: JSON.stringify(body)
			});
			bundle.published = newStatus;
			toast.success(newStatus ? `Bundle "${bundle.title}" publié.` : `Bundle "${bundle.title}" passe en brouillon.`);
		} catch (caught) {
			toast.error(caught instanceof Error ? caught.message : 'Échec du changement de statut.');
		} finally {
			togglingId = null;
		}
	}

	async function confirmDelete() {
		if (!deleteModalBundle || deleting) return;
		deleting = true;
		try {
			await adminRequest(`/bundles/${deleteModalBundle.id}`, { method: 'DELETE' });
			bundles = bundles.filter((b) => b.id !== deleteModalBundle!.id);
			toast.success('Le bundle a été supprimé.');
			deleteModalBundle = null;
		} catch (caught) {
			toast.error(caught instanceof Error ? caught.message : 'Impossible de supprimer le bundle.');
		} finally {
			deleting = false;
		}
	}
</script>

<svelte:head>
	<title>Bundles & Offres · DJR Akademi Admin</title>
</svelte:head>

<div class="space-y-8 p-1">
	<!-- Top Bar Header Card -->
	<div class="bg-base-100 p-6 sm:p-8 shadow-sm rounded-none border-none flex flex-col sm:flex-row sm:items-center justify-between gap-6">
		<div>
			<div class="mb-1.5 inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-amber-600">
				<Layers3 size={15} /> Offres & Groupements
			</div>
			<h1 class="text-2xl sm:text-3xl font-bold tracking-tight text-base-content">
				Bundles & Packs
			</h1>
			<p class="text-xs text-base-content/60 mt-1">
				Regroupez plusieurs formations et e-books avec une réduction attractive pour vos apprenants.
			</p>
		</div>

		<div class="flex flex-wrap items-center gap-3 self-start sm:self-auto">
			<a
				href="/bundles"
				target="_blank"
				rel="noreferrer"
				class="btn btn-ghost btn-sm rounded-none border border-base-200 font-semibold text-xs gap-2"
			>
				<ExternalLink size={15} />
				Page publique
			</a>
			<button
				type="button"
				onclick={openCreateDrawer}
				class="btn bg-black text-white hover:bg-black/90 border-none rounded-none btn-sm font-semibold text-xs gap-2 px-5"
			>
				<Plus size={16} />
				Nouveau bundle
			</button>
		</div>
	</div>

	<!-- Alert Message on Load Error -->
	{#if error}
		<div class="alert alert-error rounded-none text-sm flex items-center justify-between">
			<div class="flex items-center gap-2">
				<AlertCircle size={18} />
				<span>{error}</span>
			</div>
			<button type="button" class="btn btn-xs btn-ghost underline font-bold" onclick={loadData}>
				Réessayer
			</button>
		</div>
	{/if}

	<!-- 4 Stat Cards Section -->
	<div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
		<!-- Card 1: Total Bundles -->
		<div class="bg-base-100 p-6 shadow-sm rounded-none border-none flex items-center justify-between">
			<div>
				<span class="text-xs font-semibold text-base-content/60 block">Total Bundles</span>
				<span class="text-2xl sm:text-3xl font-extrabold text-base-content mt-1 block">
					{bundles.length}
				</span>
			</div>
			<div class="size-11 rounded-none bg-base-200/80 grid place-items-center text-base-content/70">
				<Layers3 size={22} />
			</div>
		</div>

		<!-- Card 2: Publiés -->
		<div class="bg-base-100 p-6 shadow-sm rounded-none border-none flex items-center justify-between">
			<div>
				<span class="text-xs font-semibold text-base-content/60 block">Publiés au catalogue</span>
				<span class="text-2xl sm:text-3xl font-extrabold text-emerald-600 mt-1 block">
					{publishedCount}
				</span>
			</div>
			<div class="size-11 rounded-none bg-emerald-50 grid place-items-center text-emerald-600">
				<CheckCircle2 size={22} />
			</div>
		</div>

		<!-- Card 3: Brouillons -->
		<div class="bg-base-100 p-6 shadow-sm rounded-none border-none flex items-center justify-between">
			<div>
				<span class="text-xs font-semibold text-base-content/60 block">Brouillons hors-ligne</span>
				<span class="text-2xl sm:text-3xl font-extrabold text-zinc-600 mt-1 block">
					{draftCount}
				</span>
			</div>
			<div class="size-11 rounded-none bg-zinc-100 grid place-items-center text-zinc-600">
				<Clock size={22} />
			</div>
		</div>

		<!-- Card 4: Économie moyenne -->
		<div class="bg-base-100 p-6 shadow-sm rounded-none border-none flex items-center justify-between">
			<div>
				<span class="text-xs font-semibold text-base-content/60 block">Réduction moyenne</span>
				<span class="text-2xl sm:text-3xl font-extrabold text-amber-600 mt-1 block">
					-{averageDiscount()}%
				</span>
			</div>
			<div class="size-11 rounded-none bg-amber-50 grid place-items-center text-amber-600">
				<Sparkles size={22} />
			</div>
		</div>
	</div>

	<!-- Main Table / Grid Container Card -->
	<div class="bg-base-100 shadow-sm rounded-none border-none overflow-hidden space-y-6 p-6 sm:p-8">
		<!-- Search, Filters, and View Switcher Bar -->
		<div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
			<!-- Search Input -->
			<div class="relative w-full sm:w-80 lg:w-96">
				<Search
					size={16}
					class="absolute left-4 top-1/2 -translate-y-1/2 text-base-content/40 pointer-events-none"
				/>
				<input
					type="text"
					placeholder="Rechercher par titre ou produit inclus..."
					bind:value={searchQuery}
					class="input input-ghost bg-base-200/50 w-full pl-12 pr-4 h-11 text-xs rounded-none focus:bg-base-100 focus:shadow-xs border-none"
				/>
			</div>

			<!-- Right Controls: Status filter tabs & View mode toggle -->
			<div class="flex flex-wrap items-center justify-between sm:justify-end gap-3">
				<!-- Status Tabs -->
				<div class="flex items-center gap-1 bg-base-200/60 p-1 rounded-none">
					<button
						type="button"
						class="px-3.5 py-1.5 text-xs font-semibold rounded-none transition-all {filterStatus === 'all' ? 'bg-base-100 text-base-content shadow-xs font-bold' : 'text-base-content/60 hover:text-base-content'}"
						onclick={() => (filterStatus = 'all')}
					>
						Tous ({bundles.length})
					</button>
					<button
						type="button"
						class="px-3.5 py-1.5 text-xs font-semibold rounded-none transition-all {filterStatus === 'published' ? 'bg-base-100 text-base-content shadow-xs font-bold' : 'text-base-content/60 hover:text-base-content'}"
						onclick={() => (filterStatus = 'published')}
					>
						Publiés ({publishedCount})
					</button>
					<button
						type="button"
						class="px-3.5 py-1.5 text-xs font-semibold rounded-none transition-all {filterStatus === 'draft' ? 'bg-base-100 text-base-content shadow-xs font-bold' : 'text-base-content/60 hover:text-base-content'}"
						onclick={() => (filterStatus = 'draft')}
					>
						Brouillons ({draftCount})
					</button>
				</div>

				<!-- Grid / Table view toggle -->
				<div class="flex items-center gap-1 bg-base-200/60 p-1 rounded-none">
					<button
						type="button"
						aria-label="Vue grille"
						class="p-1.5 text-xs font-semibold rounded-none transition-all {viewMode === 'grid' ? 'bg-base-100 text-base-content shadow-xs' : 'text-base-content/50 hover:text-base-content'}"
						onclick={() => (viewMode = 'grid')}
					>
						<LayoutGrid size={16} />
					</button>
					<button
						type="button"
						aria-label="Vue tableau"
						class="p-1.5 text-xs font-semibold rounded-none transition-all {viewMode === 'table' ? 'bg-base-100 text-base-content shadow-xs' : 'text-base-content/50 hover:text-base-content'}"
						onclick={() => (viewMode = 'table')}
					>
						<TableIcon size={16} />
					</button>
				</div>
			</div>
		</div>

		<!-- Main Content Area -->
		{#if loading}
			<div class="py-20 text-center text-base-content/60 space-y-3">
				<Loader2 size={32} class="mx-auto animate-spin text-primary" />
				<p class="text-xs font-semibold">Chargement des bundles...</p>
			</div>
		{:else if filteredBundles.length === 0}
			<div class="py-20 text-center bg-base-200/30 rounded-none border border-dashed border-base-200 space-y-3">
				<Layers3 size={36} class="mx-auto text-base-content/30" />
				<h3 class="font-bold text-sm text-base-content">Aucun bundle trouvé</h3>
				<p class="text-xs text-base-content/60 max-w-sm mx-auto">
					{#if searchQuery || filterStatus !== 'all'}
						Aucun bundle ne correspond à vos filtres de recherche.
					{:else}
						Vous n'avez pas encore créé de bundle. Associez 2 à 30 produits pour proposer des packs avantageux.
					{/if}
				</p>
				{#if !searchQuery && filterStatus === 'all'}
					<button
						type="button"
						onclick={openCreateDrawer}
						class="btn btn-sm bg-black text-white hover:bg-black/90 rounded-none font-semibold text-xs gap-2 mt-2"
					>
						<Plus size={16} /> Créer votre premier bundle
					</button>
				{/if}
			</div>
		{:else if viewMode === 'grid'}
			<!-- GRID VIEW -->
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
				{#each filteredBundles as bundle (bundle.id)}
					{@const discount = bundle.originalPrice > 0 && bundle.price < bundle.originalPrice
						? Math.round(((bundle.originalPrice - bundle.price) / bundle.originalPrice) * 100)
						: 0}
					<div class="group relative bg-base-100 border border-base-200/80 hover:border-amber-400 transition-all shadow-xs flex flex-col justify-between">
						<!-- Card Top Cover / Header -->
						<div class="relative h-40 bg-zinc-950 overflow-hidden">
							{#if bundle.cover}
								<img
									src={bundle.cover}
									alt={bundle.title}
									class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
								/>
							{:else}
								<div class="w-full h-full bg-linear-to-br from-zinc-900 via-zinc-800 to-amber-950 p-6 flex flex-col justify-between">
									<div class="flex items-center justify-between">
										<span class="px-2.5 py-1 rounded-none text-[10px] font-black uppercase tracking-wider bg-amber-400 text-zinc-950">
											PACK PROMO
										</span>
									</div>
									<Layers3 size={40} class="text-amber-400/30 self-end" />
								</div>
							{/if}

							<!-- Top Status & Discount Badges -->
							<div class="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 pointer-events-none">
								<span class="badge border-none rounded-none text-[10px] font-bold px-2.5 py-1 shadow-md {bundle.published ? 'bg-emerald-500 text-white' : 'bg-zinc-800 text-zinc-200'}">
									{bundle.published ? 'Publié' : 'Brouillon'}
								</span>
								{#if discount > 0}
									<span class="badge bg-amber-400 text-zinc-950 font-black text-[10px] rounded-none border-none shadow-md px-2">
										-{discount}% OFF
									</span>
								{/if}
							</div>
						</div>

						<!-- Card Body -->
						<div class="p-5 flex-1 flex flex-col justify-between space-y-4">
							<div class="space-y-2">
								<h3 class="font-bold text-base text-base-content group-hover:text-amber-600 transition-colors line-clamp-1">
									{bundle.title}
								</h3>
								<p class="text-xs text-base-content/60 line-clamp-2 leading-relaxed">
									{bundle.description}
								</p>
							</div>

							<!-- Products list pills -->
							<div class="space-y-2 pt-2 border-t border-base-200/60">
								<div class="flex items-center justify-between text-[11px] font-bold text-base-content/70">
									<span>Produits inclus ({bundle.items.length})</span>
									<span class="text-base-content/40 font-normal">
										{bundle.items.filter((i) => i.type === 'course').length} cours · {bundle.items.filter((i) => i.type === 'ebook').length} e-books
									</span>
								</div>
								<div class="space-y-1 max-h-24 overflow-y-auto pr-1">
									{#each bundle.items as item}
										<div class="flex items-center gap-2 text-xs bg-base-200/50 p-1.5 rounded-none">
											{#if item.type === 'course'}
												<BookOpen size={13} class="text-amber-600 shrink-0" />
											{:else}
												<FileText size={13} class="text-blue-600 shrink-0" />
											{/if}
											<span class="truncate font-semibold text-base-content text-[11px]">
												{item.title}
											</span>
										</div>
									{/each}
								</div>
							</div>

							<!-- Pricing Footer -->
							<div class="pt-3 border-t border-base-200 flex items-end justify-between">
								<div>
									{#if bundle.originalPrice > bundle.price}
										<span class="text-[11px] text-base-content/40 line-through font-mono block">
											{bundle.originalPrice.toLocaleString('fr-FR')} HTG
										</span>
									{/if}
									<div class="flex items-baseline gap-1.5">
										<span class="text-lg font-extrabold text-base-content">
											{bundle.price.toLocaleString('fr-FR')} HTG
										</span>
										{#if bundle.priceUsd > 0}
											<span class="text-xs font-bold text-emerald-600 font-mono">
												(${bundle.priceUsd} USD)
											</span>
										{/if}
									</div>
								</div>

								<!-- Action Menu Dropdown -->
								<div class="dropdown dropdown-end dropdown-top focus-within:z-50 hover:z-50 relative">
									<button
										type="button"
										class="btn btn-ghost btn-xs btn-square rounded-none border-none text-base-content/60 hover:text-base-content"
									>
										<MoreVertical size={16} />
									</button>
									<ul class="dropdown-content z-50 menu p-2 shadow-xl bg-base-100 rounded-none border border-base-200 w-44 text-xs gap-1">
										<li>
											<button
												type="button"
												class="rounded-none gap-2 font-semibold"
												onclick={() => openEditDrawer(bundle)}
											>
												<Edit3 size={14} /> Modifier
											</button>
										</li>
										<li>
											<button
												type="button"
												class="rounded-none gap-2 text-base-content/80"
												onclick={() => togglePublish(bundle)}
											>
												<CheckCircle2 size={14} />
												{bundle.published ? 'Dépublier' : 'Publier'}
											</button>
										</li>
										<li>
											<a
												href="/bundles/{bundle.id}"
												target="_blank"
												class="rounded-none gap-2 text-base-content/70"
											>
												<Eye size={14} /> Voir l'offre
											</a>
										</li>
										<li>
											<button
												type="button"
												class="rounded-none gap-2 text-error font-semibold hover:bg-error/10"
												onclick={() => (deleteModalBundle = bundle)}
											>
												<Trash2 size={14} /> Supprimer
											</button>
										</li>
									</ul>
								</div>
							</div>
						</div>
					</div>
				{/each}
			</div>
		{:else}
			<!-- TABLE VIEW -->
			<div class="overflow-x-auto min-h-[360px] pb-16">
				<table class="table w-full rounded-none text-left border-collapse">
					<thead>
						<tr class="border-b border-base-200 text-xs font-semibold text-base-content/50 uppercase tracking-wider bg-base-100">
							<th class="py-4 px-4 font-bold">Bundle</th>
							<th class="py-4 px-4 font-bold">Produits Inclus</th>
							<th class="py-4 px-4 font-bold">Prix Pack</th>
							<th class="py-4 px-4 font-bold">Réduction</th>
							<th class="py-4 px-4 font-bold">Statut</th>
							<th class="py-4 px-4 font-bold text-right">Actions</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-base-200/60 text-xs">
						{#each filteredBundles as bundle (bundle.id)}
							{@const discount = bundle.originalPrice > 0 && bundle.price < bundle.originalPrice
								? Math.round(((bundle.originalPrice - bundle.price) / bundle.originalPrice) * 100)
								: 0}
							<tr class="hover:bg-base-200/60 odd:bg-base-200/40 transition-colors">
								<!-- Column 1: Title & Cover -->
								<td class="py-4 px-4">
									<div class="flex items-center gap-3">
										{#if bundle.cover}
											<img
												src={bundle.cover}
												alt={bundle.title}
												class="w-12 h-9 object-cover shrink-0 rounded-none border border-base-200"
											/>
										{:else}
											<div class="w-12 h-9 bg-zinc-900 text-amber-400 shrink-0 grid place-items-center rounded-none">
												<Layers3 size={16} />
											</div>
										{/if}
										<div>
											<button
												type="button"
												class="font-bold text-base-content hover:underline hover:text-amber-600 transition-colors text-left"
												onclick={() => openEditDrawer(bundle)}
											>
												{bundle.title}
											</button>
											<p class="text-[11px] text-base-content/50 line-clamp-1 max-w-xs">
												{bundle.description}
											</p>
										</div>
									</div>
								</td>

								<!-- Column 2: Produits Inclus -->
								<td class="py-4 px-4">
									<div class="flex flex-wrap items-center gap-1.5">
										<span class="badge badge-neutral badge-xs font-bold rounded-none">
											{bundle.items.length} produit{bundle.items.length > 1 ? 's' : ''}
										</span>
										<span class="text-[11px] text-base-content/60">
											({bundle.items.filter((i) => i.type === 'course').length} cours, {bundle.items.filter((i) => i.type === 'ebook').length} e-books)
										</span>
									</div>
								</td>

								<!-- Column 3: Prix -->
								<td class="py-4 px-4 font-bold text-base-content">
									<div>
										<span>{bundle.price.toLocaleString('fr-FR')} HTG</span>
										{#if bundle.priceUsd > 0}
											<span class="text-[11px] text-emerald-600 block font-mono font-semibold">
												${bundle.priceUsd} USD
											</span>
										{/if}
									</div>
								</td>

								<!-- Column 4: Réduction -->
								<td class="py-4 px-4">
									{#if discount > 0}
										<span class="badge bg-amber-400 text-zinc-950 font-black text-[10px] rounded-none border-none">
											-{discount}%
										</span>
									{:else}
										<span class="text-[11px] text-base-content/40">-</span>
									{/if}
								</td>

								<!-- Column 5: Statut -->
								<td class="py-4 px-4">
									{#if bundle.published}
										<span class="badge badge-success badge-sm font-semibold text-[11px] bg-success/15 text-success border-none">
											Publié
										</span>
									{:else}
										<span class="badge badge-neutral badge-sm font-semibold text-[11px] bg-base-300/80 text-base-content/60 border-none">
											Brouillon
										</span>
									{/if}
								</td>

								<!-- Column 6: Actions Dropdown -->
								<td class="py-4 px-4 text-right">
									<div class="dropdown dropdown-end dropdown-left focus-within:z-50 hover:z-50 relative">
										<button
											type="button"
											class="btn btn-ghost btn-xs btn-square rounded-none border-none text-base-content/60 hover:text-base-content"
										>
											<MoreVertical size={16} />
										</button>
										<ul class="dropdown-content z-50 menu p-2 shadow-2xl bg-base-100 rounded-none border border-base-200 w-44 text-xs gap-1">
											<li>
												<button
													type="button"
													class="rounded-none gap-2 font-semibold"
													onclick={() => openEditDrawer(bundle)}
												>
													<Edit3 size={14} /> Modifier
												</button>
											</li>
											<li>
												<button
													type="button"
													class="rounded-none gap-2 text-base-content/80"
													onclick={() => togglePublish(bundle)}
												>
													<CheckCircle2 size={14} />
													{bundle.published ? 'Dépublier' : 'Publier'}
												</button>
											</li>
											<li>
												<a
													href="/bundles/{bundle.id}"
													target="_blank"
													class="rounded-none gap-2 text-base-content/70"
												>
													<Eye size={14} /> Voir la page
												</a>
											</li>
											<li>
												<button
													type="button"
													class="rounded-none gap-2 text-error font-semibold hover:bg-error/10"
													onclick={() => (deleteModalBundle = bundle)}
												>
													<Trash2 size={14} /> Supprimer
												</button>
											</li>
										</ul>
									</div>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</div>
</div>

<!-- =========================================================================
     SLIDE-OVER DRAWER FOR CREATE & EDIT BUNDLE
     ========================================================================= -->
{#if drawerOpen}
	<!-- Backdrop Overlay -->
	<div
		class="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs transition-opacity"
		onclick={() => (drawerOpen = false)}
		role="presentation"
	></div>

	<!-- Slide-over Drawer Panel -->
	<aside
		class="fixed inset-y-0 right-0 z-50 w-full max-w-2xl bg-base-100 shadow-2xl border-l border-base-200 flex flex-col justify-between transform transition-transform duration-300"
		aria-labelledby="drawer-title"
	>
		<!-- Drawer Header -->
		<div class="p-6 border-b border-base-200 bg-base-100 flex items-center justify-between">
			<div class="flex items-center gap-3">
				<div class="size-9 rounded-none bg-amber-400 text-zinc-950 grid place-items-center font-bold">
					<Layers3 size={18} />
				</div>
				<div>
					<h2 id="drawer-title" class="text-lg font-bold text-base-content">
						{editingId ? 'Modifier le bundle' : 'Créer un nouveau bundle'}
					</h2>
					<p class="text-xs text-base-content/60">
						{editingId ? 'Mettez à jour les informations et la composition de ce pack.' : 'Remplissez les détails et sélectionnez les formations/e-books à inclure.'}
					</p>
				</div>
			</div>
			<button
				type="button"
				class="btn btn-ghost btn-sm btn-square rounded-none"
				onclick={() => (drawerOpen = false)}
			>
				<X size={18} />
			</button>
		</div>

		<!-- Drawer Scrollable Form Content -->
		<form
			onsubmit={(e) => { e.preventDefault(); saveBundle(); }}
			class="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6"
		>
			<!-- Section 1: Informatives General Informations -->
			<div class="space-y-4">
				<h3 class="text-xs font-bold uppercase tracking-wider text-base-content/50 border-b border-base-200 pb-2">
					1. Informations générales
				</h3>

				<!-- Titre -->
				<label class="form-control w-full">
					<span class="mb-1.5 block text-xs font-bold text-base-content">
						Titre du bundle *
					</span>
					<input
						type="text"
						bind:value={title}
						maxlength="255"
						required
						placeholder="Ex. Pack Ultime Productivité & entelijans atifisyèl"
						class="input input-bordered w-full rounded-none h-11 text-xs focus:border-amber-400 focus:outline-none"
					/>
				</label>

				<!-- Description -->
				<label class="form-control w-full">
					<span class="mb-1.5 block text-xs font-bold text-base-content">
						Description globale *
					</span>
					<textarea
						bind:value={description}
						required
						rows="3"
						placeholder="Décrivez les compétences acquises et la valeur proposée dans cette offre groupée..."
						class="textarea textarea-bordered w-full rounded-none text-xs focus:border-amber-400 focus:outline-none"
					></textarea>
				</label>

				<!-- Image de présentation du bundle (Upload & URL) -->
				<div class="form-control w-full space-y-2.5">
					<div class="flex items-center justify-between">
						<span class="text-xs font-bold text-base-content">
							Image de présentation du bundle
						</span>
						<div class="flex items-center gap-1 bg-base-200 p-1 rounded-none">
							<button
								type="button"
								class="px-2.5 py-1 text-[11px] font-semibold rounded-none transition-all {coverMode === 'file' ? 'bg-base-100 text-base-content font-bold shadow-xs' : 'text-base-content/60'}"
								onclick={() => (coverMode = 'file')}
							>
								Fichier local
							</button>
							<button
								type="button"
								class="px-2.5 py-1 text-[11px] font-semibold rounded-none transition-all {coverMode === 'url' ? 'bg-base-100 text-base-content font-bold shadow-xs' : 'text-base-content/60'}"
								onclick={() => (coverMode = 'url')}
							>
								Lien URL (HTTPS)
							</button>
						</div>
					</div>

					<input
						bind:this={coverInputRef}
						type="file"
						accept="image/*"
						class="hidden"
						onchange={handleCoverSelect}
					/>

					{#if activeCoverPreview}
						<div class="relative w-full max-w-md aspect-video bg-zinc-900 border border-base-300 group overflow-hidden">
							<img src={activeCoverPreview} alt="Aperçu couverture" class="w-full h-full object-cover" />
							<div class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 p-4">
								<button
									type="button"
									class="btn btn-sm bg-white text-black hover:bg-white/90 rounded-none border-none font-bold text-xs gap-1.5"
									onclick={() => coverInputRef?.click()}
								>
									<Upload size={14} />
									Changer l'image
								</button>
								<button
									type="button"
									class="btn btn-sm bg-red-600 text-white hover:bg-red-700 rounded-none border-none font-bold text-xs gap-1.5"
									onclick={removeCover}
								>
									<Trash2 size={14} />
									Supprimer
								</button>
							</div>
						</div>
					{:else if coverMode === 'file'}
						<!-- Upload Dropzone -->
						<div
							role="button"
							tabindex="0"
							class="border-2 border-dashed border-base-300 hover:border-amber-400 p-6 text-center cursor-pointer transition-colors bg-base-200/20 hover:bg-base-200/50 flex flex-col items-center justify-center gap-2 max-w-md"
							onclick={() => coverInputRef?.click()}
							onkeydown={(e) => e.key === 'Enter' && coverInputRef?.click()}
							ondragover={(e) => e.preventDefault()}
							ondrop={handleDropCover}
						>
							<div class="size-10 bg-base-200 rounded-full grid place-items-center text-base-content/70">
								<ImageIcon size={22} />
							</div>
							<div>
								<p class="font-bold text-xs text-base-content">Cliquez pour téléverser une image de présentation</p>
								<p class="text-[11px] text-base-content/50 mt-0.5">ou glissez-déposez le fichier ici (JPG, PNG, WEBP, max 10 MB)</p>
							</div>
						</div>
					{:else}
						<!-- HTTPS URL input -->
						<input
							type="url"
							bind:value={coverUrl}
							placeholder="https://images.unsplash.com/photo-..."
							class="input input-bordered w-full rounded-none h-11 text-xs focus:border-amber-400 focus:outline-none"
						/>
						<span class="text-[11px] text-base-content/50 block">Saisissez l'adresse HTTPS directe de l'image.</span>
					{/if}
				</div>
			</div>

			<!-- Section 2: Pricing & Payments -->
			<div class="space-y-4 pt-2">
				<h3 class="text-xs font-bold uppercase tracking-wider text-base-content/50 border-b border-base-200 pb-2">
					2. Tarification & Paiement
				</h3>

				<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<!-- Prix HTG -->
					<label class="form-control w-full">
						<span class="mb-1.5 block text-xs font-bold text-base-content">
							Prix du pack (HTG) *
						</span>
						<input
							type="number"
							min="1"
							step="1"
							bind:value={price}
							required
							placeholder="15000"
							class="input input-bordered w-full rounded-none h-11 text-xs focus:border-amber-400 focus:outline-none font-mono"
						/>
					</label>

					<!-- Prix USD -->
					<label class="form-control w-full">
						<span class="mb-1.5 block text-xs font-bold text-base-content">
							Prix Carte (USD, optionnel)
						</span>
						<input
							type="number"
							min="0"
							step="1"
							bind:value={priceUsd}
							placeholder="99"
							class="input input-bordered w-full rounded-none h-11 text-xs focus:border-amber-400 focus:outline-none font-mono"
						/>
					</label>
				</div>

				<!-- Lemon Squeezy Variant ID -->
				<label class="form-control w-full">
					<span class="mb-1.5 flex items-center justify-between text-xs font-bold text-base-content">
						<span>Identifiant de variante Lemon Squeezy</span>
						<span class="text-[11px] font-normal text-base-content/50">Requis pour le paiement par carte USD</span>
					</span>
					<input
						type="text"
						bind:value={variantId}
						placeholder="Ex. 589234"
						class="input input-bordered w-full rounded-none h-11 text-xs focus:border-amber-400 focus:outline-none font-mono"
					/>
				</label>
			</div>

			<!-- Section 3: Selection of products included -->
			<div class="space-y-4 pt-2">
				<div class="flex items-center justify-between border-b border-base-200 pb-2">
					<h3 class="text-xs font-bold uppercase tracking-wider text-base-content/50">
						3. Sélection des produits inclus ({selected.length})
					</h3>
					<span class="text-xs font-bold text-amber-600">
						Au moins 2 requis
					</span>
				</div>

				<!-- Live Discount Calculator Banner -->
				<div class="p-4 bg-linear-to-r from-zinc-900 to-zinc-800 text-white rounded-none space-y-2 shadow-xs">
					<div class="flex items-center justify-between text-xs">
						<span class="text-zinc-400 font-semibold">Valeur séparée des produits :</span>
						<span class="font-mono font-bold">{regularPrice.toLocaleString('fr-FR')} HTG</span>
					</div>
					<div class="flex items-center justify-between text-xs">
						<span class="text-zinc-400 font-semibold">Prix fixé pour ce pack :</span>
						<span class="font-mono font-bold text-amber-400">{price > 0 ? `${price.toLocaleString('fr-FR')} HTG` : 'Non défini'}</span>
					</div>
					{#if regularPrice > 0 && price > 0 && price < regularPrice}
						<div class="pt-2 border-t border-zinc-700/60 flex items-center justify-between text-xs">
							<span class="text-emerald-400 font-bold flex items-center gap-1">
								<Zap size={14} /> Économie client :
							</span>
							<span class="font-bold text-emerald-400">
								{savingsAmount.toLocaleString('fr-FR')} HTG (-{savingsPercentage}%)
							</span>
						</div>
					{/if}
				</div>

				<!-- Filter & Search Bar inside Picker -->
				<div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
					<div class="relative flex-1">
						<Search size={14} class="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40 pointer-events-none" />
						<input
							type="text"
							placeholder="Filtrer les cours et e-books..."
							bind:value={productSearch}
							class="input input-bordered w-full pl-9 pr-3 h-9 text-xs rounded-none focus:border-amber-400"
						/>
					</div>
					<div class="flex items-center gap-1 bg-base-200 p-1 rounded-none">
						<button
							type="button"
							class="px-2.5 py-1 text-[11px] font-semibold rounded-none {productFilterType === 'all' ? 'bg-base-100 text-base-content font-bold' : 'text-base-content/60'}"
							onclick={() => (productFilterType = 'all')}
						>
							Tous
						</button>
						<button
							type="button"
							class="px-2.5 py-1 text-[11px] font-semibold rounded-none {productFilterType === 'course' ? 'bg-base-100 text-base-content font-bold' : 'text-base-content/60'}"
							onclick={() => (productFilterType = 'course')}
						>
							Cours
						</button>
						<button
							type="button"
							class="px-2.5 py-1 text-[11px] font-semibold rounded-none {productFilterType === 'ebook' ? 'bg-base-100 text-base-content font-bold' : 'text-base-content/60'}"
							onclick={() => (productFilterType = 'ebook')}
						>
							E-books
						</button>
					</div>
				</div>

				<!-- Product Options List -->
				<div class="space-y-2 max-h-72 overflow-y-auto pr-1 border border-base-200 p-3 bg-base-200/20">
					{#if filteredProductOptions.length === 0}
						<p class="py-8 text-center text-xs text-base-content/50">
							Aucun produit ne correspond à votre recherche.
						</p>
					{:else}
						{#each filteredProductOptions as item (item.key)}
							{@const isChecked = selected.includes(item.key)}
							<label
								class="flex items-center justify-between p-3 rounded-none border cursor-pointer transition-colors {isChecked ? 'border-amber-400 bg-amber-50/40' : 'border-base-200 bg-base-100 hover:bg-base-200/50'}"
							>
								<div class="flex items-center gap-3 min-w-0 flex-1">
									<input
										type="checkbox"
										checked={isChecked}
										onchange={() => toggleItemSelection(item.key)}
										class="checkbox checkbox-sm checkbox-amber rounded-none"
									/>
									<span class="size-8 shrink-0 grid place-items-center bg-base-200 text-base-content/70">
										{#if item.type === 'course'}
											<BookOpen size={16} class="text-amber-600" />
										{:else}
											<FileText size={16} class="text-blue-600" />
										{/if}
									</span>
									<div class="min-w-0 flex-1">
										<span class="block truncate text-xs font-bold text-base-content">
											{item.title}
										</span>
										<span class="text-[10px] text-base-content/50">
											{item.type === 'course' ? 'Formation' : 'E-book'}
										</span>
									</div>
								</div>
								<span class="font-mono text-xs font-bold text-base-content shrink-0 ml-3">
									{item.price.toLocaleString('fr-FR')} HTG
								</span>
							</label>
						{/each}
					{/if}
				</div>
			</div>

			<!-- Section 4: Publication -->
			<div class="pt-2">
				<label class="flex items-center justify-between p-4 bg-base-200/50 border border-base-200 cursor-pointer">
					<div>
						<span class="block text-xs font-bold text-base-content">Publier immédiatement ce bundle</span>
						<span class="text-[11px] text-base-content/60">
							Rendre ce pack visible immédiatement sur la page d'accueil et dans le catalogue.
						</span>
					</div>
					<input
						type="checkbox"
						bind:checked={published}
						class="toggle toggle-success toggle-sm"
					/>
				</label>
			</div>

			<button type="submit" class="hidden">Submit</button>
		</form>

		<!-- Drawer Footer Buttons -->
		<div class="p-6 border-t border-base-200 bg-base-100 flex items-center justify-end gap-3">
			<button
				type="button"
				class="btn btn-ghost btn-sm rounded-none text-xs font-semibold"
				onclick={() => (drawerOpen = false)}
			>
				Annuler
			</button>
			<button
				type="button"
				disabled={saving}
				onclick={saveBundle}
				class="btn bg-black text-white hover:bg-black/90 rounded-none btn-sm text-xs font-semibold gap-2 px-6"
			>
				{#if saving}
					<Loader2 size={16} class="animate-spin" />
					Enregistrement...
				{:else}
					<Save size={16} />
					{editingId ? 'Enregistrer les modifications' : 'Créer le bundle'}
				{/if}
			</button>
		</div>
	</aside>
{/if}

<!-- =========================================================================
     DELETE CONFIRMATION MODAL
     ========================================================================= -->
{#if deleteModalBundle}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
		<div class="bg-base-100 rounded-none shadow-2xl p-6 w-full max-w-md space-y-4 border border-base-200">
			<div class="flex items-center gap-3 text-error">
				<AlertCircle size={22} />
				<h3 class="font-bold text-base text-base-content">
					Supprimer ce bundle ?
				</h3>
			</div>

			<p class="text-xs text-base-content/70 leading-relaxed">
				Êtes-vous sûr de vouloir supprimer le bundle <strong class="text-base-content">"{deleteModalBundle.title}"</strong> ? Cette action est irréversible et supprimera l'offre du catalogue public.
			</p>

			<div class="flex items-center justify-end gap-3 pt-4 border-t border-base-200">
				<button
					type="button"
					class="btn btn-ghost btn-xs rounded-none font-semibold text-xs"
					onclick={() => (deleteModalBundle = null)}
				>
					Annuler
				</button>
				<button
					type="button"
					disabled={deleting}
					class="btn btn-error text-white btn-xs rounded-none font-semibold px-4 text-xs gap-1.5"
					onclick={confirmDelete}
				>
					{#if deleting}
						<Loader2 size={14} class="animate-spin" />
						Suppression...
					{:else}
						<Trash2 size={14} />
						Supprimer
					{/if}
				</button>
			</div>
		</div>
	</div>
{/if}
