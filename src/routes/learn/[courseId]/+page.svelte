<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { getOwnedCourseById, saveCourseProgress } from '$lib/services/courses';
	import type { Course, Lesson } from '$lib/types/admin';
	import {
		ChevronLeft,
		Play,
		CheckCircle2,
		Circle,
		BookOpen,
		ArrowRight,
		ArrowLeft,
		X,
		List
	} from 'lucide-svelte';
	import { authState } from '$lib/auth.svelte';
	import { parseVideoUrl } from '$lib/utils/video';
	import { toast } from '$lib/toast.svelte';

	let currentLang = $derived<'fr' | 'ht'>(page.url.searchParams.get('lang') === 'ht' ? 'ht' : 'fr');

	function getHref(path: string) {
		if (currentLang !== 'ht') return path;
		const url = new URL(path, page.url);
		url.searchParams.set('lang', 'ht');
		return `${url.pathname}${url.search}${url.hash}`;
	}

	const i18n = {
		fr: {
			pageTitleLesson: 'Leçon',
			pageTitleCourse: 'Formation',
			loginError: 'Veuillez vous connecter pour accéder à cette formation.',
			accessError: 'Accès refusé à cette formation.',
			persistError: 'Impossible d’enregistrer la progression.',
			mySpace: 'Mon espace',
			courseLabel: 'Formation',
			loading: 'Chargement...',
			curriculumMobile: 'Programme',
			curriculumTitle: 'Programme du cours',
			lessonsDone: '{completed} sur {total} leçons complétées',
			closeProgram: 'Fermer le programme',
			invalidVideo: 'Aucune vidéo valide n\'est configurée pour cette leçon.',
			textLessonNote: 'Cette leçon est un guide écrit. Consultez les notes ci-dessous.',
			curriculumLessons: 'Programme des leçons',
			lessonCompletedBtn: 'Leçon terminée ✓',
			markCompletedBtn: 'Marquer comme terminée',
			notesHeading: 'Notes et ressources de la leçon :',
			prevLesson: 'Leçon précédente',
			nextLesson: 'Leçon suivante',
			modulePrefix: 'Module',
			videoLabel: 'Vidéo',
			textLabel: 'Texte'
		},
		ht: {
			pageTitleLesson: 'Leson',
			pageTitleCourse: 'Fòmasyon',
			loginError: 'Tanpri konekte sou kont ou pou w ka jwenn aksè nan fòmasyon sa a.',
			accessError: 'Aksè pa otorize pou fòmasyon sa a.',
			persistError: 'Nou pa ka anrejistre pwogrè w. Tanpri eseye ankò.',
			mySpace: 'Espas mwen',
			courseLabel: 'Fòmasyon',
			loading: 'N ap chaje...',
			curriculumMobile: 'Pwogram',
			curriculumTitle: 'Pwogram kou a',
			lessonsDone: '{completed} leson fini sou {total}',
			closeProgram: 'Fèmen pwogram nan',
			invalidVideo: 'Pa gen videyo ki disponib pou leson sa a.',
			textLessonNote: 'Leson sa a se yon gid ekri. Gade nòt ki anba yo.',
			curriculumLessons: 'Pwogram leson yo',
			lessonCompletedBtn: 'Leson an fini ✓',
			markCompletedBtn: 'Make leson an fini',
			notesHeading: 'Nòt ak resous leson an:',
			prevLesson: 'Leson anvan',
			nextLesson: 'Leson apre',
			modulePrefix: 'Modil',
			videoLabel: 'Videyo',
			textLabel: 'Tèks'
		}
	};
	let t = $derived(i18n[currentLang]);

	// Find requested course by route param
	const courseId = $derived(page.params.courseId);
	let course = $state<Course | null>(null);
	let courseLoading = $state(true);
	let loadError = $state<string | null>(null);

	$effect(() => {
		if (authState.loading) return;
		if (!authState.user) {
			goto(getHref('/'));
			return;
		}
		const id = courseId;
		if (id) {
			loadCourse(id);
		}
	});

	async function loadCourse(id: string) {
		courseLoading = true;
		loadError = null;
		try {
			if (!authState.user) return;
			course = await getOwnedCourseById(id);
			completedLessonIds = new Set(course.progress?.completedLessonIds || []);
			activeLessonId = course.progress?.lastLessonId || course.modules.flatMap((module) => module.lessons)[0]?.id || '';
		} catch (error: any) {
			console.error('Course access error:', error);
			const msg = String(error?.message || '');
			if (msg.includes('403') || msg.includes('acheter cette formation')) {
				toast.error(t.accessError);
				goto(getHref(`/cours/${id}`));
			} else {
				loadError = msg || t.accessError;
			}
		} finally {
			courseLoading = false;
		}
	}

	// Flat list of all lessons in order
	const allLessons = $derived(
		course ? course.modules.flatMap((m) => m.lessons.map((l) => ({ ...l, moduleTitle: m.title }))) : []
	);

	// Reactive active lesson selection
	let activeLessonId = $state<string>('');
	let completedLessonIds = $state<Set<string>>(new Set());
	let sidebarOpen = $state(false); // Closed by default on mobile for clean video viewing

	// Set initial active lesson on load
	$effect(() => {
		if (allLessons.length > 0 && !activeLessonId) {
			activeLessonId = allLessons[0].id;
		}
	});

	// Currently active lesson object
	const activeLesson = $derived(
		allLessons.find((l) => l.id === activeLessonId) ?? allLessons[0]
	);

	// Active lesson index
	const activeLessonIndex = $derived(
		allLessons.findIndex((l) => l.id === activeLessonId)
	);

	// Progress calculation
	const completedCount = $derived(completedLessonIds.size);
	const totalCount = $derived(allLessons.length);
	const progressPercent = $derived(
		totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0
	);

	async function persistProgress(completed = completedLessonIds, lastLessonId = activeLessonId) {
		if (!courseId) return;
		try {
			await saveCourseProgress(courseId, { completedLessonIds: [...completed], lastLessonId: lastLessonId || undefined });
		} catch (error) {
			console.error('Course progress error:', error);
			toast.error(t.persistError);
		}
	}

	function toggleLessonCompletion(id: string) {
		const next = new Set(completedLessonIds);
		if (next.has(id)) next.delete(id);
		else next.add(id);
		completedLessonIds = next;
		void persistProgress(next);
	}

	function goToPreviousLesson() {
		if (activeLessonIndex > 0) {
			activeLessonId = allLessons[activeLessonIndex - 1].id;
			void persistProgress(completedLessonIds, activeLessonId);
		}
	}

	function goToNextLesson() {
		if (activeLessonIndex < allLessons.length - 1) {
			// Auto mark current as completed when moving forward
			if (activeLessonId) {
				const next = new Set(completedLessonIds);
				next.add(activeLessonId);
				completedLessonIds = next;
			}
			activeLessonId = allLessons[activeLessonIndex + 1].id;
			void persistProgress(completedLessonIds, activeLessonId);
		}
	}

	function selectLesson(id: string) {
		activeLessonId = id;
		void persistProgress(completedLessonIds, id);
		sidebarOpen = false; // Auto close drawer on mobile after selection
	}
</script>

<svelte:head>
	<title>{activeLesson ? activeLesson.title : t.pageTitleLesson} · {course ? course.title : t.pageTitleCourse}</title>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@500;600;700&display=swap" rel="stylesheet" />
</svelte:head>

<div class="min-h-dvh bg-zinc-950 text-zinc-100 flex flex-col font-sans overflow-x-clip">
	<!-- Minimal Top Bar -->
	<header class="h-14 border-b border-zinc-800/80 px-4 sm:px-6 flex items-center justify-between gap-4 shrink-0 bg-zinc-950 z-30">
		<div class="flex items-center gap-3 min-w-0">
			<button
				type="button"
				onclick={() => goto(getHref('/dashboard'))}
				class="inline-flex items-center gap-1 text-xs font-medium text-zinc-400 hover:text-white transition-colors shrink-0 cursor-pointer"
			>
				<ChevronLeft size={16} />
				<span>{t.mySpace}</span>
			</button>

			{#if course}
				<span class="text-zinc-700 hidden sm:inline">/</span>
				<h1 class="text-xs sm:text-sm font-medium text-zinc-200 truncate hidden sm:block">
					{course.title}
				</h1>
			{/if}
		</div>

		<div class="flex items-center gap-3 shrink-0">
			{#if totalCount > 0}
				<span class="text-xs font-mono text-zinc-400">{progressPercent}%</span>
			{/if}

			<button
				type="button"
				onclick={() => (sidebarOpen = !sidebarOpen)}
				aria-label={sidebarOpen ? t.closeProgram : t.curriculumMobile}
				class="lg:hidden inline-flex items-center gap-1.5 text-xs font-medium text-zinc-300 hover:text-white px-2.5 py-1.5 rounded-lg border border-zinc-800 cursor-pointer"
			>
				{#if sidebarOpen}
					<X size={15} />
				{:else}
					<List size={15} />
					<span>{t.curriculumMobile}</span>
				{/if}
			</button>
		</div>
	</header>

	<!-- Main Layout -->
	<div class="flex-1 flex min-h-0 relative">
		{#if authState.loading || courseLoading}
			<div class="flex-1 flex flex-col items-center justify-center gap-3">
				<span class="loading loading-spinner text-amber-400 loading-md"></span>
				<p class="text-xs text-zinc-500">{t.loading}</p>
			</div>
		{:else if loadError && !course}
			<div class="flex-1 flex flex-col items-center justify-center p-6 text-center gap-4">
				<p class="text-zinc-300 text-sm max-w-md">{loadError}</p>
				<button
					type="button"
					onclick={() => courseId && loadCourse(courseId)}
					class="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-black font-semibold text-xs rounded-lg transition-colors cursor-pointer"
				>
					Réessayer
				</button>
			</div>
		{:else if authState.user && course}
			<main class="flex-1 overflow-y-auto">
				<div class="max-w-4xl mx-auto w-full px-4 sm:px-8 py-6 sm:py-8 space-y-6">
					{#if activeLesson}
						<!-- Media / Lesson View -->
						<div class="w-full aspect-video bg-black rounded-lg overflow-hidden border border-zinc-800/80">
							{#if activeLesson.type === 'video'}
								{@const videoSource = parseVideoUrl(activeLesson.videoUrl)}
								{#if videoSource}
									{#if videoSource.type === 'iframe'}
										<iframe
											src={videoSource.embedUrl}
											title={activeLesson.title}
											class="block w-full h-full border-0"
											allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
											allowfullscreen
										></iframe>
									{:else}
										<video
											src={videoSource.src}
											controls
											autoplay
											class="block w-full h-full object-contain"
										>
											<track kind="captions" />
										</video>
									{/if}
								{:else}
									<div class="w-full h-full bg-zinc-900/50 p-6 flex flex-col justify-center items-center text-center gap-2">
										<BookOpen size={24} class="text-zinc-500" />
										<p class="text-sm font-medium text-zinc-200">{activeLesson.title}</p>
										<p class="text-xs text-zinc-500 max-w-md">{t.invalidVideo}</p>
									</div>
								{/if}
							{:else}
								<div class="w-full h-full bg-zinc-900/50 p-6 flex flex-col justify-center items-center text-center gap-2">
									<BookOpen size={24} class="text-zinc-500" />
									<p class="text-sm font-medium text-zinc-200">{activeLesson.title}</p>
									<p class="text-xs text-zinc-500 max-w-md">{t.textLessonNote}</p>
								</div>
							{/if}
						</div>

						<!-- Lesson Title & Completion -->
						<div class="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
							<div class="space-y-1 min-w-0">
								<p class="text-xs text-zinc-500">{activeLesson.moduleTitle}</p>
								<h2 class="font-['Poppins',sans-serif] text-lg sm:text-xl font-semibold text-white leading-snug">{activeLesson.title}</h2>
							</div>

							<button
								type="button"
								onclick={() => toggleLessonCompletion(activeLesson.id)}
								class="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-colors border shrink-0 cursor-pointer {completedLessonIds.has(activeLesson.id) ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'text-zinc-300 border-zinc-800 hover:border-zinc-700 hover:text-white'}"
							>
								{#if completedLessonIds.has(activeLesson.id)}
									<CheckCircle2 size={15} class="text-emerald-400" />
									<span>{t.lessonCompletedBtn}</span>
								{:else}
									<Circle size={15} class="text-zinc-500" />
									<span>{t.markCompletedBtn}</span>
								{/if}
							</button>
						</div>

						<!-- Lesson Notes -->
						{#if activeLesson.content}
							<div class="pt-4 border-t border-zinc-800/70 space-y-2 text-sm text-zinc-300 leading-relaxed">
								<p class="text-xs font-medium text-zinc-500">{t.notesHeading}</p>
								<p class="whitespace-pre-line">{activeLesson.content}</p>
							</div>
						{/if}

						<!-- Prev / Next Navigation -->
						<div class="pt-4 border-t border-zinc-800/70 flex items-center justify-between gap-4">
							<button
								type="button"
								disabled={activeLessonIndex === 0}
								onclick={goToPreviousLesson}
								class="inline-flex items-center gap-2 py-2 px-3 text-xs font-medium text-zinc-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
							>
								<ArrowLeft size={15} />
								<span>{t.prevLesson}</span>
							</button>

							<button
								type="button"
								disabled={activeLessonIndex === allLessons.length - 1}
								onclick={goToNextLesson}
								class="inline-flex items-center gap-2 px-4 py-2 bg-amber-400 hover:bg-amber-300 disabled:opacity-30 disabled:pointer-events-none text-black font-semibold text-xs rounded-lg transition-colors cursor-pointer"
							>
								<span>{t.nextLesson}</span>
								<ArrowRight size={15} />
							</button>
						</div>
					{/if}
				</div>
			</main>

			<!-- Mobile Backdrop -->
			{#if sidebarOpen}
				<button
					type="button"
					onclick={() => (sidebarOpen = false)}
					class="lg:hidden fixed inset-0 bg-black/60 z-30"
					aria-label={t.closeProgram}
				></button>
			{/if}

			<!-- Minimal Curriculum Sidebar -->
			<aside
				class="w-72 sm:w-80 bg-zinc-950 border-l border-zinc-800/80 flex flex-col shrink-0 transition-transform duration-200 fixed lg:relative right-0 top-14 lg:top-0 bottom-0 z-40 {sidebarOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}"
			>
				<div class="px-4 py-3 border-b border-zinc-800/80 flex items-center justify-between">
					<span class="text-xs font-semibold uppercase tracking-wider text-zinc-400">{t.curriculumTitle}</span>
					<div class="flex items-center gap-2">
						<span class="text-xs font-mono text-zinc-500">{completedCount}/{totalCount}</span>
						<button
							type="button"
							onclick={() => (sidebarOpen = false)}
							aria-label={t.closeProgram}
							class="lg:hidden p-1 text-zinc-400 hover:text-white"
						>
							<X size={16} />
						</button>
					</div>
				</div>

				<div class="flex-1 overflow-y-auto overscroll-contain p-2 space-y-4">
					{#each course.modules as module, mi}
						<div>
							<h4 class="text-[11px] font-medium text-zinc-500 px-3 py-1.5">
								{t.modulePrefix} {mi + 1} — {module.title}
							</h4>

							<div class="space-y-0.5">
								{#each module.lessons as lesson}
									{@const isActive = lesson.id === activeLessonId}
									{@const isCompleted = completedLessonIds.has(lesson.id)}

									<button
										type="button"
										onclick={() => selectLesson(lesson.id)}
										class="w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-colors cursor-pointer {isActive ? 'bg-white/10 text-white font-medium' : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'}"
									>
										{#if isCompleted}
											<CheckCircle2 size={14} class="text-emerald-400 shrink-0" />
										{:else if isActive}
											<Play size={14} class="text-amber-400 fill-amber-400 shrink-0" />
										{:else}
											<Circle size={14} class="text-zinc-600 shrink-0" />
										{/if}

										<span class="flex-1 line-clamp-1">{lesson.title}</span>
									</button>
								{/each}
							</div>
						</div>
					{/each}
				</div>
			</aside>
		{/if}
	</div>
</div>
