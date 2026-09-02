<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { createCourse, updateCourse, deleteCourse as apiDeleteCourse } from '$lib/services/courses';
	import { getAdminCourses } from '$lib/admin/admin-client';
	import type { Course } from '$lib/types/admin';
	import CourseDrawer from '$lib/components/admin/CourseDrawer.svelte';
	import {
		Search,
		Plus,
		MoreVertical,
		Edit3,
		Eye,
		Trash2,
		X,
		BookOpen,
		ChevronLeft,
		ChevronRight,
		Sliders
	} from 'lucide-svelte';

	// Reactive local state for courses
	let courses = $state<Course[]>([]);
	let loading = $state(true);
	let saving = $state(false);
	let loadError = $state<string | null>(null);
	let actionError = $state<string | null>(null);

	onMount(loadCourses);

	async function loadCourses() {
		loading = true;
		loadError = null;
		try {
			courses = await getAdminCourses();
		} catch (error) {
			loadError = error instanceof Error ? error.message : "Impossible de charger les cours.";
		} finally {
			loading = false;
		}
	}

	// Search & Filter state
	let searchQuery = $state('');
	let statusFilter = $state<'all' | 'published' | 'draft'>('all');

	// Drawer state
	let drawerOpen = $state(false);
	let editingCourse = $state<Course | null>(null);

	// Delete Modal state
	let deleteCourseModal = $state<Course | null>(null);
	let deleting = $state(false);

	// Pagination state (20 courses per page)
	let pageSize = $state(20);
	let currentPage = $state(1);

	$effect(() => {
		searchQuery;
		statusFilter;
		currentPage = 1;
	});

	// Filtered courses calculation
	let filteredCourses = $derived(
		courses.filter((course) => {
			const matchesSearch =
				course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
				course.description.toLowerCase().includes(searchQuery.toLowerCase());
			const matchesStatus =
				statusFilter === 'all' ||
				(statusFilter === 'published' && course.published) ||
				(statusFilter === 'draft' && !course.published);

			return matchesSearch && matchesStatus;
		})
	);

	let totalPages = $derived(Math.max(1, Math.ceil(filteredCourses.length / pageSize)));
	let paginatedCourses = $derived(
		filteredCourses.slice((currentPage - 1) * pageSize, currentPage * pageSize)
	);
	let startRange = $derived(filteredCourses.length === 0 ? 0 : (currentPage - 1) * pageSize + 1);
	let endRange = $derived(Math.min(currentPage * pageSize, filteredCourses.length));

	function openCreateDrawer() {
		editingCourse = null;
		drawerOpen = true;
	}

	function openEditDrawer(course: Course) {
		editingCourse = course;
		drawerOpen = true;
	}

	import { toast } from '$lib/toast.svelte';

	async function handleDrawerSave(partial: Partial<Course>, coverFile?: File | null) {
		if (saving) return;
		saving = true;
		actionError = null;
		try {
			if (partial.id) {
				await updateCourse(partial.id, partial, coverFile);
				toast.success('Cours mis à jour avec succès.');
			} else {
				const newCourse = await createCourse(partial, coverFile);
				if (newCourse) {
					courses = [newCourse, ...courses.filter((c) => c.id !== newCourse.id)];
				}
				toast.success('Nouveau cours créé avec succès.');
			}
			const freshCourses = await getAdminCourses();
			if (freshCourses.length > 0) {
				courses = freshCourses;
			}
		} catch (error) {
			console.error("Save course error:", error);
			const msg = error instanceof Error ? error.message : "Impossible d’enregistrer le cours.";
			actionError = msg;
			toast.error(msg);
			throw error;
		} finally {
			saving = false;
		}
		if (!actionError) drawerOpen = false;
	}

	function confirmDelete(course: Course) {
		deleteCourseModal = course;
	}

	async function deleteCourse() {
		if (!deleteCourseModal || deleting) return;
		deleting = true;
		actionError = null;
		const targetId = deleteCourseModal.id;
		try {
			await apiDeleteCourse(targetId);
			courses = courses.filter((c) => c.id !== targetId);
			deleteCourseModal = null;
			toast.success('Le cours a été supprimé avec succès.');
		} catch (error) {
			const msg = error instanceof Error ? error.message : "Impossible de supprimer le cours.";
			actionError = msg;
			toast.error(msg);
		} finally {
			deleting = false;
		}
	}

	function formatPrice(course: Course): string {
		if (course.isFree || course.price === 0) return 'Gratuit';
		return `${course.price.toLocaleString('fr-FR')} HTG`;
	}
</script>

<svelte:head>
	<title>Cours · Administration</title>
</svelte:head>

<div class="space-y-10 p-1">
	{#if loadError}
		<div class="alert alert-error rounded-none text-sm">{loadError} <button type="button" class="btn btn-sm" onclick={loadCourses}>Réessayer</button></div>
	{/if}
	{#if actionError}
		<div class="alert alert-error rounded-none text-sm">{actionError}</div>
	{/if}
	<!-- TableCard Root (Untitled UI Model) with 40px gap between children -->
	<div class="bg-base-100 shadow-sm rounded-none border-none overflow-hidden flex flex-col gap-10">
		<!-- TableCard Header -->
		<div class="p-6 flex flex-col gap-10 border-b border-base-200/70">
			<!-- Title & Action Button -->
			<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
				<div>
					<h1 class="text-2xl font-bold tracking-tight text-base-content sm:text-3xl">Cours</h1>
					<p class="text-sm text-base-content/60 mt-1">Créez et gérez vos formations.</p>
				</div>
				<div class="flex items-center gap-3 self-start sm:self-auto">
					<button
						type="button"
						class="btn bg-black text-white hover:bg-black/90 border-none rounded-none font-semibold text-xs gap-2 px-5"
						onclick={openCreateDrawer}
					>
						<Plus size={16} />
						Nouveau cours
					</button>
				</div>
			</div>

			<!-- Search & Filter Controls -->
			<div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
				<!-- Search Input -->
				<div class="relative flex-1">
					<Search size={18} class="absolute left-3.5 top-1/2 -translate-y-1/2 text-base-content/40 pointer-events-none" />
					<input
						type="text"
						placeholder="Rechercher un cours..."
						bind:value={searchQuery}
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
						onclick={() => (statusFilter = 'all')}
					>
						Tous ({courses.length})
					</button>
					<button
						type="button"
						class="px-4 py-2 text-xs font-semibold rounded-none transition-all {statusFilter === 'published' ? 'bg-base-100 text-base-content shadow-xs font-bold' : 'text-base-content/60 hover:text-base-content'}"
						onclick={() => (statusFilter = 'published')}
					>
						Publiés ({courses.filter((c) => c.published).length})
					</button>
					<button
						type="button"
						class="px-4 py-2 text-xs font-semibold rounded-none transition-all {statusFilter === 'draft' ? 'bg-base-100 text-base-content shadow-xs font-bold' : 'text-base-content/60 hover:text-base-content'}"
						onclick={() => (statusFilter = 'draft')}
					>
						Brouillons ({courses.filter((c) => !c.published).length})
					</button>
				</div>
			</div>
		</div>

		<!-- Table Component with Alternating Fills -->
		<div class="overflow-x-auto min-h-[360px] pb-16">
			<table class="table w-full rounded-none" aria-label="Table des cours">
				<!-- Table Header -->
				<thead class="bg-base-200/70 text-xs font-bold text-base-content/60 uppercase tracking-wider border-b border-base-200">
					<tr>
						<th class="py-4 pl-7">Cours</th>
						<th class="py-4 px-5">Prix</th>
						<th class="py-4 px-5">Étudiants</th>
						<th class="py-4 px-5">Statut</th>
						<th class="py-4 pr-7 text-right">Actions</th>
					</tr>
				</thead>

				<!-- Table Body -->
				<tbody class="text-sm">
					{#each paginatedCourses as course (course.id)}
						<tr class="odd:bg-base-200/40 even:bg-base-100 hover:bg-base-200/70 transition-colors border-b border-base-200/50 relative focus-within:z-40">
							<!-- Column: Cours (Thumbnail + Title) -->
							<td class="py-5 pl-7">
								<div class="flex items-center gap-4 group">
									{#if course.cover}
										<img
											src={course.cover}
											alt={course.title}
											class="w-14 h-10 object-cover shrink-0 rounded-none bg-base-200 border border-base-200"
										/>
									{:else}
										<div class="w-14 h-10 bg-base-200 shrink-0 grid place-items-center rounded-none text-base-content/40">
											<BookOpen size={18} />
										</div>
									{/if}
									<div class="flex flex-col min-w-0">
										<a
											href="/admin/courses/{course.id}"
											class="font-semibold text-base-content group-hover:text-primary transition-colors truncate text-sm"
										>
											{course.title}
										</a>
										<span class="text-xs text-base-content/60 truncate mt-0.5 max-w-md">
											{course.description}
										</span>
									</div>
								</div>
							</td>

							<!-- Column: Prix -->
							<td class="py-5 px-5 whitespace-nowrap font-medium text-xs">
								{formatPrice(course)}
							</td>

							<!-- Column: Étudiants -->
							<td class="py-5 px-5 whitespace-nowrap text-xs text-base-content/70">
								{course.studentCount ?? 0} apprenants
							</td>

							<!-- Column: Statut -->
							<td class="py-5 px-5 whitespace-nowrap">
								{#if course.published}
									<span class="badge badge-success badge-sm gap-1.5 font-semibold text-[11px] bg-success/15 text-success border-none px-2.5 py-2">
										<span class="size-1.5 rounded-full bg-success"></span>
										Publié
									</span>
								{:else}
									<span class="badge badge-neutral badge-sm gap-1.5 font-semibold text-[11px] bg-base-300/80 text-base-content/60 border-none px-2.5 py-2">
										<span class="size-1.5 rounded-full bg-base-content/40"></span>
										Brouillon
									</span>
								{/if}
							</td>

							<!-- Column: Actions -->
							<td class="py-5 pr-7 text-right whitespace-nowrap">
								<div class="dropdown dropdown-end dropdown-bottom focus-within:z-50 hover:z-50 relative">
									<button
										tabindex="0"
										class="btn btn-ghost btn-square btn-sm rounded-none hover:bg-base-200"
										aria-label="Menu d'actions pour {course.title}"
									>
										<MoreVertical size={17} />
									</button>

									<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
									<ul
										tabindex="0"
										role="menu"
										aria-label="Actions du cours"
										class="dropdown-content menu z-50 mt-1 w-48 rounded-none bg-base-100 p-2 shadow-2xl border border-base-200 text-xs gap-1"
									>
										<li>
											<button
												type="button"
												class="flex items-center gap-2.5 py-2 font-medium"
												onclick={() => openEditDrawer(course)}
											>
												<Sliders size={14} class="text-base-content/60" />
												Modifier infos (Drawer)
											</button>
										</li>
										<li>
											<a href="/admin/courses/{course.id}" class="flex items-center gap-2.5 py-2 font-medium">
												<BookOpen size={14} class="text-base-content/60" />
												Gérer les leçons
											</a>
										</li>
										<li>
											<a href="/admin/courses/{course.id}" class="flex items-center gap-2.5 py-2 font-medium">
												<Eye size={14} class="text-base-content/60" />
												Voir le programme
											</a>
										</li>
										<div class="my-1 border-t border-base-200"></div>
										<li>
											<button
												type="button"
												class="flex items-center gap-2.5 py-2 font-medium text-error hover:bg-error/10"
												onclick={() => confirmDelete(course)}
											>
												<Trash2 size={14} />
												Supprimer
											</button>
										</li>
									</ul>
								</div>
							</td>
						</tr>
					{:else}
						<tr>
							<td colspan="5" class="py-16 text-center text-base-content/50 text-sm">
								Aucun cours trouvé pour cette recherche.
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>

		<!-- TableCard Footer / Pagination Controls -->
		<div class="p-5 border-t border-base-200/70 flex flex-col sm:flex-row items-center justify-between gap-4 bg-base-100 text-xs select-none">
			<p class="text-base-content/60 font-medium">
				Affichage de <strong class="text-base-content font-bold">{startRange}</strong> à <strong class="text-base-content font-bold">{endRange}</strong> sur <strong class="text-base-content font-bold">{filteredCourses.length}</strong> cours
			</p>

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

<!-- Modal: Confirmation de suppression -->
{#if deleteCourseModal}
	<div class="modal modal-open z-50">
		<div class="modal-box rounded-none bg-base-100 border border-base-200 shadow-2xl p-6 space-y-4 max-w-md">
			<h3 class="font-bold text-lg text-base-content">Supprimer cette formation ?</h3>
			<p class="text-xs text-base-content/70 leading-relaxed">
				Cette action supprimera la formation <strong class="text-base-content">{deleteCourseModal.title}</strong> de votre catalogue.
			</p>
			<div class="modal-action gap-3 pt-2">
				<button
					type="button"
					class="btn btn-ghost btn-sm rounded-none font-semibold text-xs"
					onclick={() => (deleteCourseModal = null)}
				>
					Annuler
				</button>
				<button
					type="button"
					class="btn btn-error btn-sm rounded-none font-semibold text-xs text-white px-5"
					onclick={deleteCourse}
					disabled={deleting}
				>
					{deleting ? "Suppression…" : "Supprimer"})
				</button>
			</div>
		</div>
		<button type="button" class="modal-backdrop bg-black/40" onclick={() => (deleteCourseModal = null)} aria-label="Fermer"></button>
	</div>
{/if}

<!-- Slide Drawer for Course Editing -->
<CourseDrawer
	open={drawerOpen}
	saving={saving}
	course={editingCourse}
	onClose={() => (drawerOpen = false)}
	onSave={handleDrawerSave}
	onManageLessons={(id) => {
		drawerOpen = false;
		goto(`/admin/courses/${id}`);
	}}
/>
