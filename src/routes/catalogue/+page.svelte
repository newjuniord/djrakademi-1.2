<script lang="ts">
	import { onMount } from 'svelte';
	import PublicHeader from '$lib/components/PublicHeader.svelte';
	import PublicFooter from '$lib/components/PublicFooter.svelte';
	import { getPublishedCourses } from '$lib/services/courses';
	import { getPublishedEbooks } from '$lib/services/ebooks';
	import { getActiveCoachingServices } from '$lib/services/coaching';
	import type { Course, Ebook } from '$lib/types/admin';
	import type { CoachingService } from '$lib/types/coaching';
	import {
		BookOpen,
		FileText,
		CalendarCheck,
		Search,
		Sparkles,
		Play,
		Download,
		Users,
		ArrowRight,
		ChevronDown,
		ChevronUp,
		Layers
	} from 'lucide-svelte';

	let searchQuery = $state('');

	// Pagination limits for sections (10 items max by default)
	let coursesLimit = $state(10);
	let ebooksLimit = $state(10);
	let coachingLimit = $state(10);

	// All published items
	let publishedCourses = $state<Course[]>([]);
	let publishedEbooks = $state<Ebook[]>([]);
	let activeCoaching = $state<CoachingService[]>([]);

	onMount(async () => {
		const [courses, ebooks, coaching] = await Promise.all([
			getPublishedCourses(),
			getPublishedEbooks(),
			getActiveCoachingServices()
		]);
		publishedCourses = courses;
		publishedEbooks = ebooks;
		activeCoaching = coaching;
	});

	// Search filter
	const filteredCourses = $derived(
		publishedCourses.filter(
			(c) =>
				c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
				c.description.toLowerCase().includes(searchQuery.toLowerCase())
		)
	);

	const filteredEbooks = $derived(
		publishedEbooks.filter(
			(e) =>
				e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
				e.description.toLowerCase().includes(searchQuery.toLowerCase())
		)
	);

	const filteredCoaching = $derived(
		activeCoaching.filter(
			(s) =>
				s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
				s.description.toLowerCase().includes(searchQuery.toLowerCase())
		)
	);

	// Displayed sliced items (max 10 or all if expanded)
	const displayedCourses = $derived(filteredCourses.slice(0, coursesLimit));
	const displayedEbooks = $derived(filteredEbooks.slice(0, ebooksLimit));
	const displayedCoaching = $derived(filteredCoaching.slice(0, coachingLimit));

	const totalTotal = $derived(
		publishedCourses.length + publishedEbooks.length + activeCoaching.length
	);

	const totalFiltered = $derived(
		filteredCourses.length + filteredEbooks.length + filteredCoaching.length
	);
</script>

<svelte:head>
	<title>Catalogue complet · DJR Akademi</title>
	<meta
		name="description"
		content="Explorez toutes nos formations vidéo, nos ebooks PDF et nos offres de coaching individuel sur DJR Akademi."
	/>
</svelte:head>

<div class="min-h-screen bg-zinc-50 flex flex-col font-sans text-zinc-900">
	<PublicHeader />

	<main class="flex-1">

		<!-- HERO BANNER -->
		<section class="bg-zinc-950 text-white py-14 sm:py-20 relative overflow-hidden">
			<div class="absolute inset-0 pointer-events-none">
				<div class="absolute top-0 left-1/3 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl"></div>
			</div>

			<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-6 text-center sm:text-left">
				<div class="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white/10 rounded-full text-xs font-bold text-amber-400 border border-white/10">
					<Sparkles size={14} />
					Katalòg Ofisyèl DJR Akademi ({totalTotal} pwogram)
				</div>

				<h1 class="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
					Eksplore tout pwogram nou yo
				</h1>
				<p class="text-white/60 text-base max-w-2xl leading-relaxed">
					Jwenn tout fòmasyon videyo nou yo, gid PDF ak sesyon coaching endividyèl nou yo ki prezante pa seksyon.
				</p>

				<!-- Search Input Bar -->
				<div class="pt-4 max-w-2xl">
					<div class="relative">
						<input
							type="text"
							bind:value={searchQuery}
							placeholder="Chèche yon fòmasyon, yon ebook, yon sijè..."
							class="w-full h-14 pl-12 pr-4 bg-white/10 text-white placeholder-white/40 rounded-2xl border border-white/15 text-sm font-medium focus:outline-none focus:border-amber-400 focus:bg-white/15 transition-all shadow-xl"
						/>
						<Search size={20} class="absolute left-4 top-4 text-white/50" />
						{#if searchQuery}
							<button
								type="button"
								onclick={() => (searchQuery = '')}
								class="absolute right-4 top-4 text-xs font-bold text-white/50 hover:text-white"
							>
								Efase
							</button>
						{/if}
					</div>
				</div>
			</div>
		</section>

		<!-- QUICK JUMP NAVIGATION BAR -->
		<section class="bg-white border-b border-zinc-200 sticky top-20 z-30 shadow-sm">
			<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4 py-3 overflow-x-auto">
				<span class="text-xs font-bold text-zinc-400 uppercase tracking-wider hidden md:inline-block">Aksè rapid :</span>
				<div class="flex items-center gap-3">
					<a
						href="#sec-courses"
						class="inline-flex items-center gap-2 px-4 py-2 bg-zinc-100 hover:bg-zinc-950 hover:text-white rounded-xl text-xs font-bold text-zinc-800 transition-colors shrink-0"
					>
						<BookOpen size={15} class="text-amber-500" />
						Fòmasyon videyo ({filteredCourses.length})
					</a>
					<a
						href="#sec-ebooks"
						class="inline-flex items-center gap-2 px-4 py-2 bg-zinc-100 hover:bg-zinc-950 hover:text-white rounded-xl text-xs font-bold text-zinc-800 transition-colors shrink-0"
					>
						<FileText size={15} class="text-emerald-500" />
						Ebook PDF ({filteredEbooks.length})
					</a>
					<a
						href="#sec-coaching"
						class="inline-flex items-center gap-2 px-4 py-2 bg-zinc-100 hover:bg-zinc-950 hover:text-white rounded-xl text-xs font-bold text-zinc-800 transition-colors shrink-0"
					>
						<CalendarCheck size={15} class="text-orange-500" />
						Coaching 1:1 ({filteredCoaching.length})
					</a>
				</div>
			</div>
		</section>

		<!-- CATALOG SECTIONS DISPLAYED ONE BY ONE -->
		<div class="py-12 space-y-16">
			<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">

				<!-- Empty Search State -->
				{#if totalFiltered === 0}
					<div class="py-16 text-center space-y-4 bg-white rounded-2xl border border-zinc-200 shadow-sm">
						<div class="size-16 bg-zinc-100 text-zinc-400 rounded-full mx-auto grid place-items-center">
							<Search size={28} />
						</div>
						<h3 class="text-xl font-black text-zinc-950">Pa gen rezilta pou "{searchQuery}"</h3>
						<p class="text-zinc-500 text-sm max-w-md mx-auto">
							Eseye ak yon lòt mo oswa re-inisyalize chèch la.
						</p>
						<button
							type="button"
							onclick={() => (searchQuery = '')}
							class="px-6 py-2.5 bg-zinc-950 text-white font-bold text-xs rounded-xl hover:bg-zinc-800 transition-colors"
						>
							Efase chèch la
						</button>
					</div>
				{/if}

				<!-- ═══════════════════════════════════════════════════
				     SECTION 1: FORMATIONS VIDEO
				     ═══════════════════════════════════════════════════ -->
				{#if filteredCourses.length > 0}
					<section id="sec-courses" class="scroll-mt-36 space-y-6">
						<div class="flex items-center justify-between pb-4 border-b border-zinc-200">
							<div class="flex items-center gap-3">
								<div class="size-9 bg-zinc-950 text-amber-400 rounded-xl grid place-items-center">
									<BookOpen size={18} />
								</div>
								<div>
									<h2 class="text-2xl font-black tracking-tight text-zinc-950">
										Fòmasyon videyo ({filteredCourses.length})
									</h2>
									<p class="text-xs text-zinc-400 mt-0.5">Pwogram byen ranje ak aksè videyo 24/7</p>
								</div>
							</div>
							<span class="text-xs text-zinc-500 font-bold hidden sm:inline-block">
								Afichaj : {displayedCourses.length} sou {filteredCourses.length}
							</span>
						</div>

						<!-- Grid of Courses -->
						<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
							{#each displayedCourses as course (course.id)}
								<a
									href="/cours/{course.id}"
									class="group flex flex-col bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl border border-zinc-200/80 hover:border-zinc-300 transition-all duration-300"
								>
									<div class="relative aspect-video overflow-hidden bg-zinc-100 shrink-0">
										{#if course.cover}
											<img src={course.cover} alt={course.title} class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
										{:else}
											<div class="w-full h-full flex items-center justify-center bg-zinc-200">
												<BookOpen size={32} class="text-zinc-400" />
											</div>
										{/if}

										<div class="absolute top-3 right-3 px-2.5 py-1 bg-zinc-950/80 backdrop-blur-sm text-white text-[10px] font-black uppercase rounded-md">
											Videyo
										</div>

										<div class="absolute bottom-3 left-3">
											{#if course.isFree || course.price === 0}
												<span class="px-3 py-1 bg-emerald-500 text-white text-[11px] font-black uppercase rounded-full shadow">Gratis</span>
											{:else}
												<span class="px-3 py-1 bg-white/95 text-zinc-950 text-[11px] font-black rounded-full shadow">
													{course.price.toLocaleString('fr-FR')} HTG
												</span>
											{/if}
										</div>
									</div>

									<div class="p-5 flex flex-col flex-1 gap-3">
										<h3 class="font-black text-base text-zinc-950 group-hover:text-amber-600 transition-colors leading-snug line-clamp-2">{course.title}</h3>
										<p class="text-xs text-zinc-400 line-clamp-2 leading-relaxed flex-1">{course.description}</p>

										<div class="flex items-center justify-end pt-3 border-t border-zinc-100 mt-auto">
											<span class="inline-flex items-center gap-1 text-xs font-bold text-zinc-950 group-hover:translate-x-1 transition-transform">
												Dekouvri <ArrowRight size={12} />
											</span>
										</div>
									</div>
								</a>
							{/each}
						</div>

						<!-- "Voir plus" Button for Courses -->
						{#if filteredCourses.length > 10}
							<div class="pt-4 flex justify-center">
								{#if coursesLimit === 10}
									<button
										type="button"
										onclick={() => (coursesLimit = filteredCourses.length)}
										class="inline-flex items-center gap-2 px-8 py-3.5 bg-zinc-950 hover:bg-zinc-800 text-white font-bold text-xs rounded-xl transition-all shadow-md"
									>
										<span>Gade plis (+{filteredCourses.length - 10} fòmasyon)</span>
										<ChevronDown size={16} />
									</button>
								{:else}
									<button
										type="button"
										onclick={() => (coursesLimit = 10)}
										class="inline-flex items-center gap-2 px-6 py-3 bg-zinc-200 hover:bg-zinc-300 text-zinc-950 font-bold text-xs rounded-xl transition-all"
									>
										<span>Gade mwens</span>
										<ChevronUp size={16} />
									</button>
								{/if}
							</div>
						{/if}
					</section>
				{/if}

				<!-- ═══════════════════════════════════════════════════
				     SECTION 2: EBOOKS PDF
				     ═══════════════════════════════════════════════════ -->
				{#if filteredEbooks.length > 0}
					<section id="sec-ebooks" class="scroll-mt-36 space-y-6">
						<div class="flex items-center justify-between pb-4 border-b border-zinc-200">
							<div class="flex items-center gap-3">
								<div class="size-9 bg-zinc-950 text-emerald-400 rounded-xl grid place-items-center">
									<FileText size={18} />
								</div>
								<div>
									<h2 class="text-2xl font-black tracking-tight text-zinc-950">
										Ebook ak Gid PDF ({filteredEbooks.length})
									</h2>
									<p class="text-xs text-zinc-400 mt-0.5">Resous pratik ou ka telechaje nenpòt ki lè</p>
								</div>
							</div>
							<span class="text-xs text-zinc-500 font-bold hidden sm:inline-block">
								Afichaj : {displayedEbooks.length} sou {filteredEbooks.length}
							</span>
						</div>

						<!-- Grid of Ebooks (4 columns) -->
						<div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
							{#each displayedEbooks as ebook (ebook.id)}
								<a
									href="/ebooks/{ebook.id}"
									class="group flex flex-col bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl border border-zinc-200/80 hover:border-zinc-300 transition-all duration-300"
								>
									<div class="relative overflow-hidden shrink-0 bg-zinc-100" style="aspect-ratio: 3/4;">
										{#if ebook.cover}
											<img src={ebook.cover} alt={ebook.title} class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
										{:else}
											<div class="w-full h-full flex items-center justify-center bg-zinc-200">
												<FileText size={32} class="text-zinc-400" />
											</div>
										{/if}

										<div class="absolute top-2.5 right-2.5 px-2 py-0.5 bg-zinc-950/80 backdrop-blur-sm text-white text-[9px] font-black uppercase rounded">
											PDF
										</div>

										<div class="absolute bottom-3 left-3">
											{#if ebook.isFree || ebook.price === 0}
												<span class="px-2.5 py-1 bg-emerald-500 text-white text-[10px] font-black uppercase rounded-full shadow">Gratis</span>
											{:else}
												<span class="px-2.5 py-1 bg-white text-zinc-950 text-[10px] font-black rounded-full shadow">
													{ebook.price.toLocaleString('fr-FR')} HTG
												</span>
											{/if}
										</div>
									</div>

									<div class="p-4 flex flex-col flex-1 gap-1.5">
										<h3 class="font-black text-sm text-zinc-950 group-hover:text-amber-600 transition-colors line-clamp-2 leading-snug">{ebook.title}</h3>
										<p class="text-[11px] text-zinc-400 line-clamp-1 leading-relaxed hidden sm:block">{ebook.description}</p>
									</div>
								</a>
							{/each}
						</div>

						<!-- "Voir plus" Button for Ebooks -->
						{#if filteredEbooks.length > 10}
							<div class="pt-4 flex justify-center">
								{#if ebooksLimit === 10}
									<button
										type="button"
										onclick={() => (ebooksLimit = filteredEbooks.length)}
										class="inline-flex items-center gap-2 px-8 py-3.5 bg-zinc-950 hover:bg-zinc-800 text-white font-bold text-xs rounded-xl transition-all shadow-md"
									>
										<span>Gade plis (+{filteredEbooks.length - 10} ebook)</span>
										<ChevronDown size={16} />
									</button>
								{:else}
									<button
										type="button"
										onclick={() => (ebooksLimit = 10)}
										class="inline-flex items-center gap-2 px-6 py-3 bg-zinc-200 hover:bg-zinc-300 text-zinc-950 font-bold text-xs rounded-xl transition-all"
									>
										<span>Gade mwens</span>
										<ChevronUp size={16} />
									</button>
								{/if}
							</div>
						{/if}
					</section>
				{/if}

				<!-- ═══════════════════════════════════════════════════
				     SECTION 3: COACHING 1:1
				     ═══════════════════════════════════════════════════ -->
				{#if filteredCoaching.length > 0}
					<section id="sec-coaching" class="scroll-mt-36 space-y-6">
						<div class="flex items-center justify-between pb-4 border-b border-zinc-200">
							<div class="flex items-center gap-3">
								<div class="size-9 bg-zinc-950 text-orange-400 rounded-xl grid place-items-center">
									<CalendarCheck size={18} />
								</div>
								<div>
									<h2 class="text-2xl font-black tracking-tight text-zinc-950">
										Sesyon Coaching 1:1 ({filteredCoaching.length})
									</h2>
									<p class="text-xs text-zinc-400 mt-0.5">Swivi endividyèl</p>
								</div>
							</div>
							<span class="text-xs text-zinc-500 font-bold hidden sm:inline-block">
								Afichaj : {displayedCoaching.length} sou {filteredCoaching.length}
							</span>
						</div>

						<!-- Grid of Coaching (3 columns) -->
						<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
							{#each displayedCoaching as coaching (coaching.id)}
								<a
									href="/coaching/{coaching.slug}"
									class="group flex flex-col p-6 bg-white rounded-2xl border border-zinc-200/80 hover:border-zinc-300 hover:shadow-xl transition-all duration-300"
								>
									<div class="size-12 bg-zinc-950 text-amber-400 rounded-xl grid place-items-center mb-4 group-hover:scale-105 transition-transform">
										<CalendarCheck size={22} />
									</div>

									<h3 class="font-black text-base text-zinc-950 group-hover:text-amber-600 transition-colors leading-snug mb-2">{coaching.title}</h3>
									<p class="text-zinc-500 text-xs leading-relaxed line-clamp-3 flex-1">{coaching.description}</p>

									<div class="mt-6 pt-4 border-t border-zinc-100 flex items-center justify-between">
										<span class="text-xs text-zinc-500 font-medium">{coaching.durationMinutes} min</span>
										<span class="font-black text-base text-zinc-950">
											{coaching.isFree ? 'Gratis' : `${coaching.price.toLocaleString('fr-FR')} ${coaching.currency}`}
										</span>
									</div>
								</a>
							{/each}
						</div>

						<!-- "Voir plus" Button for Coaching if > 10 -->
						{#if filteredCoaching.length > 10}
							<div class="pt-4 flex justify-center">
								{#if coachingLimit === 10}
									<button
										type="button"
										onclick={() => (coachingLimit = filteredCoaching.length)}
										class="inline-flex items-center gap-2 px-8 py-3.5 bg-zinc-950 hover:bg-zinc-800 text-white font-bold text-xs rounded-xl transition-all shadow-md"
									>
										<span>Gade plis (+{filteredCoaching.length - 10} sèvis)</span>
										<ChevronDown size={16} />
									</button>
								{:else}
									<button
										type="button"
										onclick={() => (coachingLimit = 10)}
										class="inline-flex items-center gap-2 px-6 py-3 bg-zinc-200 hover:bg-zinc-300 text-zinc-950 font-bold text-xs rounded-xl transition-all"
									>
										<span>Gade mwens</span>
										<ChevronUp size={16} />
									</button>
								{/if}
							</div>
						{/if}
					</section>
				{/if}

			</div>
		</div>

	</main>

	<PublicFooter />
</div>
