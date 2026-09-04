<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { getAdminCourseById, saveCourseCurriculum, updateCourse } from '$lib/services/courses';
	import type { Course, CourseModule, Lesson } from '$lib/types/admin';
	import CourseDrawer from '$lib/components/admin/CourseDrawer.svelte';
	import { parseVideoUrl } from '$lib/utils/video';
	import {
		ArrowLeft,
		Plus,
		Trash2,
		ArrowUp,
		ArrowDown,
		Video,
		FileText,
		BookOpen,
		Edit3,
		Save,
		CheckCircle,
		Play,
		ChevronRight,
		ChevronDown,
		Eye,
		Layers,
		Sparkles,
		Loader2
	} from 'lucide-svelte';

	const courseId = $derived(page.params.id);
	let currentCourse = $state<Course | null>(null);
	let loading = $state(true);
	let saving = $state(false);

	// Editable copy of modules
	let modules = $state<CourseModule[]>([]);

	// Active Selection state
	let activeModuleIndex = $state<number>(0);
	let activeLessonIndex = $state<number>(0);
	let activeTab = $state<'editor' | 'preview'>('editor');

	$effect(() => {
		const id = courseId;
		if (id) {
			loadCourse(id);
		}
	});

	async function loadCourse(id: string) {
		loading = true;
		const fetched = await getAdminCourseById(id);
		if (fetched) {
			currentCourse = fetched;
			modules = JSON.parse(JSON.stringify(fetched.modules || []));
		}
		loading = false;
	}

	// Currently active lesson derived from selection
	let activeLesson = $derived<Lesson | null>(
		modules[activeModuleIndex]?.lessons[activeLessonIndex] ?? null
	);

	let activeModule = $derived<CourseModule | null>(
		modules[activeModuleIndex] ?? null
	);

	// Drawer state
	let drawerOpen = $state(false);

	import { toast } from '$lib/toast.svelte';

	function showToast(msg: string) {
		toast.success(msg);
	}

	// Extract Vimeo Video ID from URL or ID string
	function extractVimeoId(urlOrId?: string): string | null {
		if (!urlOrId) return null;
		const trimmed = urlOrId.trim();
		if (!trimmed) return null;
		if (/^\d+$/.test(trimmed)) return trimmed;
		const match = trimmed.match(/(?:vimeo\.com\/|video\/)(\d+)/);
		return match ? match[1] : null;
	}

	// Module Actions
	function addModule() {
		const newModIndex = modules.length;
		modules = [
			...modules,
			{
				id: `mod-${Date.now()}`,
				title: `Module ${modules.length + 1} — Nouveau module`,
				lessons: [
					{
						id: `les-${Date.now()}`,
						title: 'Bienvenue dans la leçon',
						type: 'video',
						videoUrl: 'https://vimeo.com/76979871'
					}
				]
			}
		];
		activeModuleIndex = newModIndex;
		activeLessonIndex = 0;
	}

	function moveModuleUp(index: number) {
		if (index <= 0) return;
		const updated = [...modules];
		const temp = updated[index];
		updated[index] = updated[index - 1];
		updated[index - 1] = temp;
		modules = updated;
		if (activeModuleIndex === index) activeModuleIndex = index - 1;
		else if (activeModuleIndex === index - 1) activeModuleIndex = index;
	}

	function moveModuleDown(index: number) {
		if (index >= modules.length - 1) return;
		const updated = [...modules];
		const temp = updated[index];
		updated[index] = updated[index + 1];
		updated[index + 1] = temp;
		modules = updated;
		if (activeModuleIndex === index) activeModuleIndex = index + 1;
		else if (activeModuleIndex === index + 1) activeModuleIndex = index;
	}

	function deleteModule(index: number) {
		modules = modules.filter((_, i) => i !== index);
		if (activeModuleIndex >= modules.length) {
			activeModuleIndex = Math.max(0, modules.length - 1);
		}
		activeLessonIndex = 0;
	}

	// Lesson Actions
	function addLesson(mIndex: number) {
		const updated = [...modules];
		const newLIndex = updated[mIndex].lessons.length;
		updated[mIndex].lessons = [
			...updated[mIndex].lessons,
			{
				id: `les-${Date.now()}`,
				title: `Leçon ${newLIndex + 1}`,
				type: 'video',
				videoUrl: 'https://vimeo.com/76979871'
			}
		];
		modules = updated;
		activeModuleIndex = mIndex;
		activeLessonIndex = newLIndex;
	}

	function moveLessonUp(mIndex: number, lIndex: number) {
		if (lIndex <= 0) return;
		const updated = [...modules];
		const lessons = [...updated[mIndex].lessons];
		const temp = lessons[lIndex];
		lessons[lIndex] = lessons[lIndex - 1];
		lessons[lIndex - 1] = temp;
		updated[mIndex].lessons = lessons;
		modules = updated;
		if (activeModuleIndex === mIndex && activeLessonIndex === lIndex) {
			activeLessonIndex = lIndex - 1;
		}
	}

	function moveLessonDown(mIndex: number, lIndex: number) {
		const updated = [...modules];
		const lessons = [...updated[mIndex].lessons];
		if (lIndex >= lessons.length - 1) return;
		const temp = lessons[lIndex];
		lessons[lIndex] = lessons[lIndex + 1];
		lessons[lIndex + 1] = temp;
		updated[mIndex].lessons = lessons;
		modules = updated;
		if (activeModuleIndex === mIndex && activeLessonIndex === lIndex) {
			activeLessonIndex = lIndex + 1;
		}
	}

	function deleteLesson(mIndex: number, lIndex: number) {
		const updated = [...modules];
		updated[mIndex].lessons = updated[mIndex].lessons.filter((_, i) => i !== lIndex);
		modules = updated;
		if (activeModuleIndex === mIndex && activeLessonIndex >= updated[mIndex].lessons.length) {
			activeLessonIndex = Math.max(0, updated[mIndex].lessons.length - 1);
		}
	}

	function selectLesson(mIndex: number, lIndex: number) {
		activeModuleIndex = mIndex;
		activeLessonIndex = lIndex;
	}

	async function saveCurriculum() {
		if (!currentCourse) return;
		saving = true;
		try {
			await saveCourseCurriculum(currentCourse.id, modules);
			currentCourse = { ...currentCourse, modules: JSON.parse(JSON.stringify(modules)) };
			showToast('Programme et leçons enregistrés avec succès !');
		} catch (e: any) {
			console.error('Save curriculum failed:', e);
			showToast(e?.message || 'Erreur lors de l’enregistrement des leçons.');
		} finally {
			saving = false;
		}
	}

	async function handleDrawerSave(updatedMeta: Partial<Course>, coverFile?: File | null) {
		if (!currentCourse) return;
		await updateCourse(currentCourse.id, updatedMeta, coverFile);
		await loadCourse(currentCourse.id);
		drawerOpen = false;
		showToast('Informations du cours mises à jour.');
	}

	function navigateNextLesson() {
		if (!activeModule) return;
		if (activeLessonIndex < activeModule.lessons.length - 1) {
			activeLessonIndex++;
		} else if (activeModuleIndex < modules.length - 1) {
			activeModuleIndex++;
			activeLessonIndex = 0;
		}
	}

	function navigatePrevLesson() {
		if (activeLessonIndex > 0) {
			activeLessonIndex--;
		} else if (activeModuleIndex > 0) {
			activeModuleIndex--;
			activeLessonIndex = modules[activeModuleIndex].lessons.length - 1;
		}
	}
	// Collapsible modules state map (mod.id -> boolean)
	let collapsedModules = $state<Record<string, boolean>>({});

	function isModuleOpen(modId: string): boolean {
		return !collapsedModules[modId];
	}

	function toggleModule(modId: string) {
		collapsedModules = { ...collapsedModules, [modId]: !collapsedModules[modId] };
	}

	function expandAllModules() {
		collapsedModules = {};
	}

	function collapseAllModules() {
		const next: Record<string, boolean> = {};
		modules.forEach((m) => {
			next[m.id] = true;
		});
		collapsedModules = next;
	}
</script>

<svelte:head>
	<title>{currentCourse?.title ?? 'Studio de formation'} · DJR Akademi</title>
</svelte:head>



{#if loading}
	<div class="min-h-96 flex flex-col items-center justify-center p-12 gap-3 text-base-content/60">
		<span class="loading loading-spinner text-primary loading-lg"></span>
		<p class="text-xs font-semibold">Chargement de la formation...</p>
	</div>
{:else if currentCourse}
<div class="space-y-10 p-1">
	<!-- Top Sticky Banner Header -->
	<div class="bg-base-100 p-6 shadow-sm rounded-none border-none flex flex-col gap-6">
		<div class="flex items-center justify-between">
			<a
				href="/admin/courses"
				class="btn btn-ghost btn-xs rounded-none gap-1 font-semibold text-xs text-base-content/60 hover:text-base-content"
			>
				<ArrowLeft size={14} />
				Retour aux cours
			</a>

			<div class="flex items-center gap-2">
				<button
					type="button"
					class="btn btn-ghost bg-base-200/60 hover:bg-base-200 border-none btn-xs rounded-none font-semibold text-xs gap-1.5"
					onclick={() => (drawerOpen = true)}
				>
					<Edit3 size={14} />
					Modifier infos (Drawer)
				</button>
			</div>
		</div>

		<!-- Course Info Row -->
		<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-t border-base-200/70 pt-6">
			<div class="flex items-center gap-4">
				{#if currentCourse.cover}
					<img
						src={currentCourse.cover}
						alt={currentCourse.title}
						class="w-16 h-12 object-cover shrink-0 rounded-none border border-base-200"
					/>
				{:else}
					<div class="w-16 h-12 bg-base-200 shrink-0 grid place-items-center rounded-none text-base-content/40">
						<BookOpen size={20} />
					</div>
				{/if}

				<div>
					<div class="flex items-center gap-2">
						<h1 class="text-xl font-bold tracking-tight text-base-content sm:text-2xl">
							{currentCourse.title}
						</h1>
						{#if currentCourse.published}
							<span class="badge badge-success badge-sm font-semibold text-[10px] bg-success/15 text-success border-none">
								Publié
							</span>
						{:else}
							<span class="badge badge-neutral badge-sm font-semibold text-[10px] bg-base-300/80 text-base-content/60 border-none">
								Brouillon
							</span>
						{/if}
					</div>
					<p class="text-xs text-base-content/60 mt-1">
						Studio d'édition : {modules.reduce((acc, m) => acc + m.lessons.length, 0)} leçons sur {modules.length} modules.
					</p>
				</div>
			</div>

			<!-- Main Save Button -->
			<button
				type="button"
				class="btn bg-black text-white hover:bg-black/90 border-none rounded-none btn-sm font-semibold text-xs gap-2 px-6 self-start sm:self-auto"
				onclick={saveCurriculum}
			>
				<Save size={15} />
				Enregistrer les leçons
			</button>
		</div>
	</div>

	<!-- Master-Detail Studio Layout (Left Theater & Editor + Right Programme Navigator) -->
	<div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
		<!-- Left Main Workspace (Active Lesson Studio / Video Theater) -->
		<main class="lg:col-span-8 lg:order-1 bg-base-100 shadow-sm rounded-none border-none p-6 space-y-6">
			{#if activeLesson}
				{@const videoSource = parseVideoUrl(activeLesson.videoUrl)}

				<!-- Active Lesson Top Header -->
				<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-base-200/70 pb-4">
					<div>
						<div class="flex items-center gap-2 text-xs text-base-content/50 font-semibold mb-1">
							<span>Module {activeModuleIndex + 1}</span>
							<ChevronRight size={13} />
							<span>Leçon {activeLessonIndex + 1}</span>
						</div>
						<h2 class="text-lg font-bold text-base-content">
							Édition & Visualisation de la leçon
						</h2>
					</div>

					<!-- Tab Controls -->
					<div class="flex items-center gap-1.5 bg-base-200/60 p-1.5 rounded-none shrink-0">
						<button
							type="button"
							class="px-4 py-1.5 text-xs font-semibold rounded-none transition-all flex items-center gap-1.5 {activeTab === 'editor' ? 'bg-base-100 text-base-content shadow-xs font-bold' : 'text-base-content/60 hover:text-base-content'}"
							onclick={() => (activeTab = 'editor')}
						>
							<Edit3 size={13} />
							Éditeur
						</button>
						<button
							type="button"
							class="px-4 py-1.5 text-xs font-semibold rounded-none transition-all flex items-center gap-1.5 {activeTab === 'preview' ? 'bg-base-100 text-base-content shadow-xs font-bold' : 'text-base-content/60 hover:text-base-content'}"
							onclick={() => (activeTab = 'preview')}
						>
							<Eye size={13} />
							Mode Étudiant
						</button>
					</div>
				</div>

				<!-- Lesson Settings Box (High Contrast Inputs) -->
				<div class="bg-base-200/60 p-6 border border-base-300/80 rounded-none space-y-5 shadow-xs">
					<div class="grid grid-cols-1 sm:grid-cols-3 gap-5">
						<!-- Lesson Title -->
						<div class="form-control sm:col-span-2">
							<label class="label font-bold text-xs text-base-content/90 tracking-wide pb-1.5" for="active-lesson-title">
								Titre de la leçon *
							</label>
							<input
								id="active-lesson-title"
								type="text"
								bind:value={activeLesson.title}
								placeholder="Titre de la leçon"
								class="input input-sm bg-base-100 w-full rounded-none font-bold text-xs border border-base-300 text-base-content shadow-2xs focus:bg-base-100"
							/>
						</div>

						<!-- Lesson Type Selector -->
						<div class="form-control">
							<label class="label font-bold text-xs text-base-content/90 tracking-wide pb-1.5" for="active-lesson-type">
								Type de leçon
							</label>
							<select
								id="active-lesson-type"
								bind:value={activeLesson.type}
								class="select select-sm bg-base-100 rounded-none text-xs border border-base-300 font-bold text-base-content shadow-2xs focus:bg-base-100"
							>
								<option value="video">🎥 Vidéo (YouTube, Vimeo, MP4)</option>
								<option value="text">📄 Contenu Texte</option>
							</select>
						</div>
					</div>

					{#if activeLesson.type === 'video'}
						<!-- Video Link Input -->
						<div class="form-control">
							<label class="label font-bold text-xs text-base-content/90 tracking-wide pb-1.5" for="active-video-url">
								URL de la vidéo (YouTube, Vimeo, Loom, MP4...)
							</label>
							<input
								id="active-video-url"
								type="text"
								bind:value={activeLesson.videoUrl}
								placeholder="Ex: https://www.youtube.com/watch?v=... ou https://vimeo.com/76979871"
								class="input input-sm bg-base-100 w-full rounded-none text-xs border border-base-300 font-mono text-base-content shadow-2xs focus:bg-base-100"
							/>
						</div>
					{:else}
						<!-- Text Content Input -->
						<div class="form-control">
							<label class="label font-bold text-xs text-base-content/90 tracking-wide pb-1.5" for="active-text-content">
								Contenu textuel de la leçon
							</label>
							<textarea
								id="active-text-content"
								rows="5"
								bind:value={activeLesson.content}
								placeholder="Rédigez le texte de la leçon..."
								class="textarea textarea-sm bg-base-100 w-full rounded-none text-xs border border-base-300 text-base-content leading-relaxed shadow-2xs focus:bg-base-100"
							></textarea>
						</div>
					{/if}

					<div class="flex items-center justify-between pt-2 border-t border-base-300/40">
						<span class="text-[11px] text-base-content/50 italic">Les modifications sont conservées localement et synchronisées lors de l'enregistrement.</span>
						<button
							type="button"
							class="btn bg-black text-white hover:bg-black/90 border-none rounded-none btn-xs font-semibold text-xs gap-1.5 px-4"
							onclick={saveCurriculum}
							disabled={saving}
						>
							{#if saving}
								<Loader2 size={13} class="animate-spin" />
								<span>Sauvegarde...</span>
							{:else}
								<Save size={13} />
								<span>Enregistrer les leçons</span>
							{/if}
						</button>
					</div>
				</div>

				<!-- Video Visualization Theater / Preview -->
				{#if activeLesson.type === 'video'}
					<div class="space-y-3 pt-2">
						<div class="flex items-center justify-between">
							<span class="text-xs font-bold text-base-content flex items-center gap-1.5">
								<Play size={14} class="text-primary" />
								Visualisation de la vidéo (YouTube / Vimeo Player)
							</span>
							{#if videoSource}
								<span class="badge badge-success badge-sm text-[10px] font-semibold bg-success/15 text-success border-none">
									{videoSource.type === 'iframe' ? 'Lecteur Embed' : 'Vidéo Directe'}
								</span>
							{/if}
						</div>

						{#if videoSource}
							<div class="aspect-video w-full bg-black rounded-none overflow-hidden shadow-xl border border-base-200">
								{#if videoSource.type === 'iframe'}
									<iframe
										src={videoSource.embedUrl}
										title={activeLesson.title}
										class="w-full h-full border-0"
										allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
										allowfullscreen
									></iframe>
								{:else}
									<video
										src={videoSource.src}
										controls
										class="w-full h-full object-contain"
									>
										<track kind="captions" />
									</video>
								{/if}
							</div>
						{:else}
							<div class="py-16 text-center text-base-content/50 border border-dashed border-base-200 bg-base-200/20 p-6 space-y-2">
								<Video size={36} class="mx-auto opacity-30" />
								<p class="text-xs font-semibold">Aucune vidéo valide configurée</p>
								<p class="text-[11px]">Saisissez un lien YouTube, Vimeo ou MP4 ci-dessus pour activer la visualisation.</p>
							</div>
						{/if}
					</div>
				{:else}
					<!-- Text Preview -->
					<div class="space-y-3 pt-2">
						<span class="text-xs font-bold text-base-content flex items-center gap-1.5">
							<FileText size={14} class="text-accent" />
							Visualisation du texte
						</span>
						<div class="p-6 bg-base-200/30 border border-base-200 rounded-none min-h-40 leading-relaxed text-sm text-base-content">
							{#if activeLesson.content}
								<div class="whitespace-pre-line">{activeLesson.content}</div>
							{:else}
								<span class="text-base-content/40 italic text-xs">Aucun contenu texte saisi pour cette leçon.</span>
							{/if}
						</div>
					</div>
				{/if}

				<!-- Bottom Studio Navigation Footer -->
				<div class="flex items-center justify-between border-t border-base-200/70 pt-6">
					<button
						type="button"
						class="btn btn-ghost btn-xs rounded-none font-semibold text-xs gap-1 border border-base-200"
						onclick={navigatePrevLesson}
						disabled={activeModuleIndex === 0 && activeLessonIndex === 0}
					>
						← Leçon précédente
					</button>

					<span class="text-xs text-base-content/60 font-medium">
						Leçon {activeLessonIndex + 1} / {activeModule?.lessons.length ?? 1}
					</span>

					<button
						type="button"
						class="btn btn-ghost btn-xs rounded-none font-semibold text-xs gap-1 border border-base-200"
						onclick={navigateNextLesson}
					>
						Leçon suivante →
					</button>
				</div>
			{:else}
				<div class="py-24 text-center text-base-content/50 border border-dashed border-base-200 p-8 space-y-3">
					<Sparkles size={40} class="mx-auto opacity-40 text-primary" />
					<h3 class="font-bold text-base text-base-content">Sélectionnez une leçon dans le programme à droite</h3>
					<p class="text-xs max-w-sm mx-auto text-base-content/60">
						Choisissez une leçon dans le menu de droite pour modifier son titre, son type ou visualiser immédiatement sa vidéo Vimeo.
					</p>
					<button
						type="button"
						class="btn bg-black text-white hover:bg-black/90 border-none btn-xs rounded-none font-semibold px-4 mt-2"
						onclick={addModule}
					>
						+ Créer un module
					</button>
				</div>
			{/if}
		</main>

		<!-- Right Sidebar (Programme Navigator & Module Accordions) -->
		<aside class="lg:col-span-4 lg:order-2 bg-base-100 shadow-sm rounded-none border-none p-5 flex flex-col gap-6">
			<div class="flex items-center justify-between border-b border-base-200/70 pb-3">
				<div class="flex items-center gap-2">
					<Layers size={18} class="text-primary" />
					<h2 class="font-bold text-base text-base-content">Programme</h2>
				</div>

				<div class="flex items-center gap-1">
					<button
						type="button"
						class="btn btn-ghost border-none btn-xs rounded-none font-semibold text-[11px] text-base-content/60 hover:text-base-content"
						onclick={Object.keys(collapsedModules).length > 0 ? expandAllModules : collapseAllModules}
						title="Réduire ou développer tous les modules"
					>
						{Object.keys(collapsedModules).length > 0 ? 'Développer tout' : 'Réduire tout'}
					</button>
					<button
						type="button"
						class="btn btn-ghost bg-base-200/60 hover:bg-base-200 border-none btn-xs rounded-none font-semibold text-xs gap-1"
						onclick={addModule}
					>
						<Plus size={14} />
						Module
					</button>
				</div>
			</div>

			{#if modules.length === 0}
				<div class="py-10 text-center text-base-content/50 border border-dashed border-base-200 p-4">
					<p class="text-xs font-semibold">Aucun module créé.</p>
					<button
						type="button"
						class="btn btn-ghost btn-xs bg-base-200 rounded-none mt-2 font-semibold"
						onclick={addModule}
					>
						+ Ajouter un module
					</button>
				</div>
			{:else}
				<div class="space-y-4 max-h-[700px] overflow-y-auto pr-1">
					{#each modules as mod, mIndex (mod.id)}
						{@const moduleOpen = isModuleOpen(mod.id)}
						<div
							class="border-none rounded-none bg-base-200/40 overflow-hidden transition-all {activeModuleIndex === mIndex ? 'bg-base-100 shadow-xs' : ''}"
						>
							<!-- Module Header Bar (No Border Line) -->
							<div class="p-3 bg-base-200/70 flex items-center justify-between gap-2 border-none">
								<div class="flex items-center gap-1.5 min-w-0 flex-1">
									<button
										type="button"
										class="btn btn-ghost btn-xs p-1 text-base-content/60 hover:text-base-content shrink-0 border-none"
										onclick={() => toggleModule(mod.id)}
										title={moduleOpen ? 'Réduire le module' : 'Développer le module'}
									>
										{#if moduleOpen}
											<ChevronDown size={14} />
										{:else}
											<ChevronRight size={14} />
										{/if}
									</button>

									<span class="text-[10px] font-bold text-base-content/50 uppercase tracking-wider shrink-0">
										M{mIndex + 1}
									</span>
									<input
										type="text"
										bind:value={mod.title}
										placeholder="Titre du module"
										class="input input-xs bg-base-100 font-bold text-xs w-full rounded-none border-none focus:outline-none focus:bg-base-100"
									/>
								</div>

								<!-- Module Controls -->
								<div class="flex items-center gap-0.5 shrink-0">
									<button
										type="button"
										class="btn btn-ghost btn-xs p-1 border-none"
										disabled={mIndex === 0}
										onclick={() => moveModuleUp(mIndex)}
										title="Monter le module"
									>
										<ArrowUp size={12} />
									</button>
									<button
										type="button"
										class="btn btn-ghost btn-xs p-1 border-none"
										disabled={mIndex === modules.length - 1}
										onclick={() => moveModuleDown(mIndex)}
										title="Descendre le module"
									>
										<ArrowDown size={12} />
									</button>
									<button
										type="button"
										class="btn btn-ghost btn-xs p-1 text-error border-none"
										onclick={() => deleteModule(mIndex)}
										title="Supprimer le module"
									>
										<Trash2 size={12} />
									</button>
								</div>
							</div>

							<!-- Collapsible Lessons Navigation Item List (No Border Lines) -->
							{#if moduleOpen}
								<div class="p-2 space-y-1">
									{#each mod.lessons as lesson, lIndex (lesson.id)}
										{@const isSelected = activeModuleIndex === mIndex && activeLessonIndex === lIndex}
										<div
											class="group w-full flex items-center justify-between p-2.5 rounded-none text-xs transition-all cursor-pointer select-none border-none {isSelected ? 'bg-base-200 text-base-content font-bold' : 'hover:bg-base-200/50 text-base-content/70 font-medium'}"
											onclick={() => selectLesson(mIndex, lIndex)}
											role="button"
											tabindex="0"
											onkeydown={(e) => e.key === 'Enter' && selectLesson(mIndex, lIndex)}
										>
											<div class="flex items-center gap-2.5 min-w-0 flex-1">
												{#if lesson.type === 'video'}
													<Video size={14} class={isSelected ? 'text-primary' : 'text-base-content/40'} />
												{:else}
													<FileText size={14} class={isSelected ? 'text-accent' : 'text-base-content/40'} />
												{/if}
												<span class="truncate">{lesson.title || 'Leçon sans titre'}</span>
											</div>

											<div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
												<button
													type="button"
													class="p-1 hover:text-error border-none"
													onclick={(e) => {
														e.stopPropagation();
														deleteLesson(mIndex, lIndex);
													}}
													title="Supprimer"
												>
													<Trash2 size={11} />
												</button>
											</div>
										</div>
									{/each}

									<button
										type="button"
										class="btn btn-ghost btn-xs rounded-none w-full border-none bg-base-200/50 hover:bg-base-200 mt-2 text-xs font-semibold text-base-content/70"
										onclick={() => addLesson(mIndex)}
									>
										<Plus size={13} />
										Ajouter une leçon
									</button>
								</div>
							{/if}
						</div>
					{/each}
				</div>
			{/if}
		</aside>
	</div>
</div>

<!-- Slide Drawer for Metadata Edit -->
<CourseDrawer
	open={drawerOpen}
	course={currentCourse}
	onClose={() => (drawerOpen = false)}
	onSave={handleDrawerSave}
/>
{:else}
	<div class="py-24 text-center space-y-4">
		<p class="text-base-content/60 text-sm">Formation introuvable.</p>
		<a href="/admin/courses" class="btn btn-neutral btn-sm rounded-none">
			← Retour aux cours
		</a>
	</div>
{/if}
