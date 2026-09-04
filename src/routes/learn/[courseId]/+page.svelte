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
		FileText,
		ArrowRight,
		ArrowLeft,
		Menu,
		X,
		List,
		Sparkles
	} from 'lucide-svelte';
	import { authState } from '$lib/auth.svelte';
	import { parseVideoUrl } from '$lib/utils/video';

	$effect(() => {
		if (!authState.loading && !authState.user) {
			goto('/');
		}
	});

	// Find requested course by route param
	const courseId = $derived(page.params.courseId);
	let course = $state<Course | null>(null);
	let courseLoading = $state(true);

	$effect(() => {
		const id = courseId;
		if (id) {
			loadCourse(id);
		}
	});

	import { toast } from '$lib/toast.svelte';

	async function loadCourse(id: string) {
		courseLoading = true;
		try {
			if (!authState.user) throw new Error('Veuillez vous connecter pour accéder à cette formation.');
			course = await getOwnedCourseById(id);
			completedLessonIds = new Set(course.progress?.completedLessonIds || []);
			activeLessonId = course.progress?.lastLessonId || course.modules.flatMap((module) => module.lessons)[0]?.id || '';
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Accès refusé à cette formation.');
			goto(`/cours/${id}`);
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
			toast.error(error instanceof Error ? error.message : 'Impossible d’enregistrer la progression.');
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
	<title>{activeLesson ? activeLesson.title : 'Leçon'} · {course ? course.title : 'Formation'}</title>
</svelte:head>

<div class="min-h-screen bg-zinc-950 text-white flex flex-col font-sans overflow-x-hidden">

	<!-- ═══════════════════════════════════════════════════
	     TOP HEADER / NAVIGATION (Fully Responsive)
	     ═══════════════════════════════════════════════════ -->
	<header class="h-16 bg-zinc-900 border-b border-zinc-800 px-3 sm:px-6 flex items-center justify-between gap-3 shrink-0 z-30">
		<div class="flex items-center gap-2 sm:gap-4 min-w-0">
			<button
				type="button"
				onclick={() => goto('/dashboard')}
				class="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white/80 hover:text-white text-xs font-bold rounded-lg transition-colors border border-white/10 shrink-0"
			>
				<ChevronLeft size={16} />
				<span class="hidden xs:inline">Espas mwen</span>
				<span class="xs:hidden">Espas</span>
			</button>

			<div class="h-5 w-px bg-white/10 shrink-0"></div>

			<!-- Course title on header -->
			<div class="min-w-0">
				<p class="text-[10px] sm:text-xs text-white/40 font-medium truncate">Fòmasyon</p>
				<h1 class="text-xs sm:text-sm font-black text-white truncate">{course ? course.title : 'Chajman...'}</h1>
			</div>
		</div>

		<!-- Right Header Actions -->
		<div class="flex items-center gap-2 shrink-0">
			<!-- Progress Pill -->
			<div class="flex items-center gap-2 px-2.5 py-1 bg-white/5 rounded-lg border border-white/10 text-xs">
				<div class="w-12 sm:w-24 h-1.5 bg-zinc-800 rounded-full overflow-hidden hidden xs:block">
					<div class="h-full bg-amber-400 rounded-full transition-all duration-300" style="width: {progressPercent}%"></div>
				</div>
				<span class="font-mono text-[11px] text-amber-400 font-bold">{progressPercent}%</span>
			</div>

			<!-- Mobile Curriculum Drawer Toggle -->
			<button
				type="button"
				onclick={() => (sidebarOpen = !sidebarOpen)}
				class="lg:hidden flex items-center gap-1.5 px-3 py-1.5 bg-amber-400 text-black text-xs font-black rounded-lg transition-colors shadow-sm shrink-0"
			>
				{#if sidebarOpen}
					<X size={16} />
				{:else}
					<List size={16} />
					<span class="hidden sm:inline">Pwogram</span>
				{/if}
			</button>
		</div>
	</header>

	<!-- ═══════════════════════════════════════════════════
	     MAIN CONTENT + SIDEBAR LAYOUT
	     ═══════════════════════════════════════════════════ -->
	<div class="flex-1 flex overflow-hidden relative">

		{#if authState.loading}
			<div class="flex-1 flex items-center justify-center">
				<span class="loading loading-spinner text-amber-500 loading-lg"></span>
			</div>
		{:else if authState.user}
			<!-- LEFT / CENTER: VIDEO PLAYER & LESSON DETAILS -->
			<main class="flex-1 overflow-y-auto p-3 sm:p-6 lg:p-8 flex flex-col gap-5 sm:gap-6">

			{#if activeLesson}
				<!-- Video Container (Universal YouTube / Vimeo / Direct Video Embed) -->
				<div class="relative w-full aspect-video bg-black rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl border border-white/10 group">
					{#if activeLesson.type === 'video'}
						{@const videoSource = parseVideoUrl(activeLesson.videoUrl)}
						{#if videoSource}
							<div class="absolute inset-0 bg-black">
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
										autoplay
										class="w-full h-full object-contain"
									>
										<track kind="captions" />
									</video>
								{/if}
							</div>
						{:else}
							<div class="w-full h-full bg-zinc-900 p-6 sm:p-8 flex flex-col justify-center items-center text-center space-y-3 sm:space-y-4">
								<div class="size-12 sm:size-16 bg-amber-400/20 text-amber-400 rounded-2xl grid place-items-center">
									<BookOpen size={24} class="sm:w-8 sm:h-8" />
								</div>
								<h3 class="text-base sm:text-xl font-black text-white">{activeLesson.title}</h3>
								<p class="text-white/60 text-xs sm:text-sm max-w-md">Okenn lyen vidyo ki valab pa configuré pou leson sa a.</p>
							</div>
						{/if}
					{:else}
						<!-- Text / Article Lesson View -->
						<div class="w-full h-full bg-zinc-900 p-6 sm:p-8 flex flex-col justify-center items-center text-center space-y-3 sm:space-y-4">
							<div class="size-12 sm:size-16 bg-amber-400/20 text-amber-400 rounded-2xl grid place-items-center">
								<BookOpen size={24} class="sm:w-8 sm:h-8" />
							</div>
							<h3 class="text-base sm:text-xl font-black text-white">{activeLesson.title}</h3>
							<p class="text-white/60 text-xs sm:text-sm max-w-md">Leson sa a se yon gid ekri. Gade feyè yo anba a.</p>
						</div>
					{/if}
				</div>

				<!-- Quick Mobile Curriculum Trigger Button -->
				<div class="lg:hidden">
					<button
						type="button"
						onclick={() => (sidebarOpen = true)}
						class="w-full flex items-center justify-between p-3.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-bold text-white/90 hover:bg-zinc-850 transition-colors"
					>
						<span class="flex items-center gap-2">
							<List size={16} class="text-amber-400" />
							Pwogram leson yo
						</span>
						<span class="text-amber-400 font-mono">{completedCount}/{totalCount} fini</span>
					</button>
				</div>

				<!-- Lesson Info & Actions Bar (Mobile Responsive) -->
				<div class="bg-zinc-900 rounded-xl sm:rounded-2xl border border-zinc-800 p-4 sm:p-6 space-y-5 sm:space-y-6">

					<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
						<div>
							<span class="text-[10px] sm:text-xs font-bold text-amber-400 uppercase tracking-widest">{activeLesson.moduleTitle}</span>
							<h2 class="text-lg sm:text-2xl font-black text-white mt-0.5 leading-snug">{activeLesson.title}</h2>
						</div>

						<!-- Mark Completed Toggle -->
						<button
							type="button"
							onclick={() => toggleLessonCompletion(activeLesson.id)}
							class="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border shrink-0 {completedLessonIds.has(activeLesson.id) ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-white/5 text-white/80 border-white/10 hover:bg-white/10'}"
						>
							{#if completedLessonIds.has(activeLesson.id)}
								<CheckCircle2 size={16} class="text-emerald-400" />
								<span>Leson an fini ✓</span>
							{:else}
								<Circle size={16} class="text-white/40" />
								<span>Maki ke l fini</span>
							{/if}
						</button>
					</div>

					<!-- Lesson Text Content / Notes -->
					{#if activeLesson.content}
						<div class="p-4 sm:p-5 bg-zinc-950 rounded-xl border border-zinc-800 text-white/70 text-xs sm:text-sm leading-relaxed space-y-2.5">
							<p class="font-bold text-white text-[11px] uppercase tracking-wider">Nòt ak resous leson an :</p>
							<p>{activeLesson.content}</p>
						</div>
					{/if}

					<!-- Previous / Next Navigation Buttons (Mobile Optimized) -->
					<div class="pt-4 border-t border-zinc-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
						<button
							type="button"
							disabled={activeLessonIndex === 0}
							onclick={goToPreviousLesson}
							class="inline-flex items-center justify-center gap-2 h-11 px-4 bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none text-white text-xs font-bold rounded-xl transition-colors border border-white/10"
						>
							<ArrowLeft size={15} />
							Leson anvan
						</button>

						<button
							type="button"
							disabled={activeLessonIndex === allLessons.length - 1}
							onclick={goToNextLesson}
							class="inline-flex items-center justify-center gap-2 h-11 px-5 bg-amber-400 hover:bg-amber-300 disabled:opacity-30 disabled:pointer-events-none text-black font-black text-xs rounded-xl transition-colors shadow-lg shadow-amber-500/10"
						>
							Leson apre
							<ArrowRight size={15} />
						</button>
					</div>

				</div>
			{/if}

		</main>

		<!-- MOBILE BACKDROP OVERLAY -->
		{#if sidebarOpen}
			<button
				type="button"
				onclick={() => (sidebarOpen = false)}
				class="lg:hidden fixed inset-0 bg-black/70 backdrop-blur-sm z-30 transition-opacity"
				aria-label="Fèmen pwogram an"
			></button>
		{/if}

		<!-- RIGHT SIDEBAR / MOBILE DRAWER: CURRICULUM ACCORDION -->
		<aside
			class="w-full sm:w-80 lg:w-96 bg-zinc-900 border-l border-zinc-800 flex flex-col shrink-0 transition-transform duration-300 fixed lg:relative right-0 top-16 lg:top-0 bottom-0 z-40 {sidebarOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}"
		>
			<div class="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900 sticky top-0 z-10">
				<div>
					<h3 class="font-black text-sm text-white uppercase tracking-wider">Pwogram kou a</h3>
					<p class="text-[11px] text-white/40 font-mono mt-0.5">{completedCount} sou {totalCount} leson ki fini</p>
				</div>
				<button
					type="button"
					onclick={() => (sidebarOpen = false)}
					class="lg:hidden p-1.5 text-white/60 hover:text-white rounded-lg bg-white/5"
				>
					<X size={18} />
				</button>
			</div>

			<!-- Modules List -->
			<div class="flex-1 overflow-y-auto divide-y divide-zinc-800/60 pb-16 lg:pb-0">
				{#if course}
					{#each course.modules as module, mi}
						<div class="p-4 space-y-2.5">
							<h4 class="text-xs font-black text-white/80 uppercase tracking-wide">
								Modil {mi + 1} — {module.title}
							</h4>

							<!-- Lessons in Module -->
							<div class="space-y-1">
								{#each module.lessons as lesson}
									{@const isActive = lesson.id === activeLessonId}
									{@const isCompleted = completedLessonIds.has(lesson.id)}

									<button
										type="button"
										onclick={() => selectLesson(lesson.id)}
										class="w-full text-left flex items-center gap-3 p-3 rounded-xl transition-colors text-xs font-medium {isActive ? 'bg-amber-400/15 border border-amber-400/30 text-amber-300 font-bold' : 'hover:bg-white/5 text-white/70'}"
									>
										<!-- Icon status -->
										{#if isCompleted}
											<CheckCircle2 size={16} class="text-emerald-400 shrink-0" />
										{:else if isActive}
											<Play size={16} class="text-amber-400 fill-amber-400 shrink-0" />
										{:else}
											<Circle size={16} class="text-white/30 shrink-0" />
										{/if}

										<span class="flex-1 line-clamp-1">{lesson.title}</span>

										{#if lesson.type === 'video'}
											<span class="text-[10px] text-white/40 font-mono shrink-0">Videyo</span>
										{:else}
											<span class="text-[10px] text-white/40 font-mono shrink-0">Tèks</span>
										{/if}
									</button>
								{/each}
							</div>
						</div>
					{/each}
				{/if}
			</div>

			</aside>
		{/if}
	</div>

</div>
