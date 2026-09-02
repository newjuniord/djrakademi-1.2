<script lang="ts">
	import PublicHeader from '$lib/components/PublicHeader.svelte';
	import PublicFooter from '$lib/components/PublicFooter.svelte';
	import type { Course, Ebook } from '$lib/types/admin';
	import {
		BookOpen,
		FileText,
		CalendarCheck,
		Play,
		Download,
		CheckCircle2,
		Clock,
		User,
		ExternalLink,
		Shield,
		ArrowRight,
		Sparkles,
		Menu,
		X,
		ChevronDown,
		Receipt,
		MessageCircle
	} from 'lucide-svelte';
	import { authState } from '$lib/auth.svelte';
	import { goto } from '$app/navigation';
	import { getCourseById } from '$lib/services/courses';
	import { getAccountLibrary, type LibraryBooking } from '$lib/services/library';
	import { downloadOwnedEbook } from '$lib/services/ebook-access';
	import { whatsappLink } from '$lib/coaching/validation';

	$effect(() => {
		if (!authState.loading && !authState.user) {
			goto('/');
		}
	});

	// Real customer data from Appwrite profile and authState
	const user = $derived({
		name: authState.profile?.name || authState.user?.name || 'Étudiant',
		email: authState.user?.email || 'email@example.com',
		whatsapp: authState.profile?.whatsapp || '',
		avatar: (authState.profile?.name || authState.user?.name)
			? (authState.profile?.name || authState.user?.name || '').substring(0, 2).toUpperCase()
			: 'ED',
		memberSince: authState.profile?.createdAt
			? new Date(authState.profile.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
			: 'Récemment'
	});

	// Dynamic arrays for user's purchased items
	let myCourses = $state<any[]>([]);
	let myEbooks = $state<Ebook[]>([]);
	let myBookings = $state<LibraryBooking[]>([]);
	let loadingData = $state(true);

	$effect(() => {
		if (authState.user) {
			loadUserData(authState.user.$id);
		}
	});

	async function loadUserData(_userId: string) {
		loadingData = true;
		try {
			const library = await getAccountLibrary();
			const coursePromises = library.courseIds.map(async (courseId) => {
				const course = await getCourseById(courseId);
				if (!course) return null;
				const progress = library.courseProgress[courseId] || { completedLessonIds: [] };
				const lessons = course.modules?.flatMap((module) => module.lessons || []) || [];
				const completedLessons = progress.completedLessonIds.length;
				return {
					course,
					progressPercent: lessons.length ? Math.round((completedLessons / lessons.length) * 100) : 0,
					completedLessons,
					totalLessons: lessons.length,
					lastLessonTitle: lessons.find((lesson) => lesson.id === progress.lastLessonId)?.title || "Bienvenue dans ce cours"
				};
			});
			myCourses = (await Promise.all(coursePromises)).filter(Boolean);
			myEbooks = library.ebooks;
			myBookings = library.bookings;
		} catch (caught) {
			console.warn("[Dashboard] Failed to load library:", caught);
		} finally {
			loadingData = false;
		}
	}

	let downloadSuccessMessage = $state<string | null>(null);
	let downloadingEbookId = $state<string | null>(null);

	async function triggerDownload(ebook: Ebook) {
		downloadingEbookId = ebook.id;
		downloadSuccessMessage = null;
		try {
			await downloadOwnedEbook(ebook.id);
			downloadSuccessMessage = `Téléchargement de "${ebook.title}" démarré.`;
		} catch (caught) {
			downloadSuccessMessage = caught instanceof Error ? caught.message : 'Téléchargement impossible.';
		} finally {
			downloadingEbookId = null;
		}
	}

	function formatBookingDate(iso: string) {
		return new Date(iso).toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' });
	}
</script>

<svelte:head>
	<title>Mon Espace Apprenant · DJR Akademi</title>
	<meta name="description" content="Espace client DJR Akademi — Accédez à vos formations, ebooks et sessions de coaching." />
</svelte:head>

<div class="min-h-screen bg-zinc-50 flex flex-col font-sans text-zinc-900">
	<PublicHeader />

	{#if authState.loading}
		<div class="min-h-screen bg-zinc-50 flex items-center justify-center">
			<span class="loading loading-spinner text-amber-500 loading-lg"></span>
		</div>
	{:else if authState.user}
		<main class="flex-1 py-8 sm:py-12">

		<!-- Welcome Banner -->
		<section class="bg-zinc-950 text-white py-12 sm:py-16">
			<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">

					<!-- User Info -->
					<div class="flex items-center gap-4">
						<div class="size-16 bg-gradient-to-br from-amber-400 to-orange-500 text-black text-xl font-black rounded-2xl grid place-items-center shadow-xl shrink-0">
							{user.avatar}
						</div>
						<div>
							<div class="flex items-center gap-2">
								<h1 class="text-2xl sm:text-3xl font-black tracking-tight">{user.name}</h1>
								<span class="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-wider rounded-md border border-emerald-500/30">
									Manm Aktif
								</span>
							</div>
							<p class="text-white/50 text-xs mt-1 font-mono">{user.email} · Manm depi {user.memberSince}</p>
						</div>
					</div>

				</div>

				<!-- Stats Overview Bar / Quick Jump Links -->
				<div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 pt-8 border-t border-white/10">
					<a
						href="#sec-courses"
						class="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/8 hover:bg-white/10 transition-colors text-left"
					>
						<div class="size-10 bg-amber-400/20 text-amber-400 rounded-lg grid place-items-center shrink-0">
							<BookOpen size={20} />
						</div>
						<div>
							<span class="text-xl font-black text-white">{myCourses.length}</span>
							<span class="block text-xs text-white/40 font-medium">Fòmasyon w ap swiv</span>
						</div>
					</a>

					<a
						href="#sec-ebooks"
						class="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/8 hover:bg-white/10 transition-colors text-left"
					>
						<div class="size-10 bg-emerald-400/20 text-emerald-400 rounded-lg grid place-items-center shrink-0">
							<FileText size={20} />
						</div>
						<div>
							<span class="text-xl font-black text-white">{myEbooks.length}</span>
							<span class="block text-xs text-white/40 font-medium">Ebook ou genyen</span>
						</div>
					</a>

					<a
						href="#sec-coaching"
						class="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/8 hover:bg-white/10 transition-colors text-left"
					>
						<div class="size-10 bg-orange-400/20 text-orange-400 rounded-lg grid place-items-center shrink-0">
							<CalendarCheck size={20} />
						</div>
						<div>
							<span class="text-xl font-black text-white">{myBookings.length}</span>
							<span class="block text-xs text-white/40 font-medium">Sesyon coaching</span>
						</div>
					</a>
				</div>
			</div>
		</section>

		<!-- Main Dashboard Content -->
		<div class="py-12 space-y-16">
			<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">

				<!-- Toast Notification -->
				{#if downloadSuccessMessage}
					<div class="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm font-semibold flex items-center justify-between shadow-sm">
						<span class="flex items-center gap-2">
							<CheckCircle2 size={18} class="text-emerald-600" />
							{downloadSuccessMessage}
						</span>
						<button type="button" onclick={() => (downloadSuccessMessage = null)} class="text-emerald-500 hover:text-emerald-700 text-xs">Fèmen</button>
					</div>
				{/if}

				<!-- SECTION 1: MES FORMATIONS -->
				<section id="sec-courses" class="scroll-mt-24 space-y-6">
					<div class="flex items-center justify-between pb-4 border-b border-zinc-200">
						<div class="flex items-center gap-3">
							<div class="size-9 bg-zinc-950 text-amber-400 rounded-xl grid place-items-center">
								<BookOpen size={18} />
							</div>
							<div>
								<h2 class="text-2xl font-black tracking-tight text-zinc-950">Fòmasyon Mwen Yo ({myCourses.length})</h2>
								<p class="text-xs text-zinc-400 mt-0.5">Aksede ak espas aprantisaj videyo ou a sou entènèt</p>
							</div>
						</div>
						<span class="text-xs text-zinc-400 font-medium hidden sm:inline-block">Aksè san limit 24/7</span>
					</div>

					{#if myCourses.length === 0}
						<div class="bg-white rounded-2xl border border-zinc-200/80 p-8 sm:p-12 text-center text-zinc-500 space-y-3">
							<div class="size-12 bg-amber-400/10 text-amber-500 rounded-2xl grid place-items-center mx-auto">
								<BookOpen size={24} />
							</div>
							<h3 class="font-black text-base text-zinc-950">Pa gen fòmasyon ki debloke</h3>
							<p class="text-xs text-zinc-400 max-w-md mx-auto">Ou poko debloke okenn fòmasyon. Dekouvri katalòg nou an pou kòmanse aprann.</p>
							<a href="/catalogue" class="inline-flex items-center gap-2 px-5 py-2.5 bg-zinc-950 hover:bg-zinc-800 text-white font-bold text-xs rounded-xl transition-colors shadow-sm mt-2">
								Eksplore katalòg la <ArrowRight size={14} />
							</a>
						</div>
					{:else}
						<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
							{#each myCourses as item (item.course.id)}
								<div class="bg-white rounded-2xl border border-zinc-200/80 overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col">
									<div class="relative aspect-video bg-zinc-100 overflow-hidden">
										{#if item.course.cover}
											<img src={item.course.cover} alt={item.course.title} class="w-full h-full object-cover" />
										{:else}
											<div class="w-full h-full flex items-center justify-center bg-zinc-200">
												<BookOpen size={32} class="text-zinc-400" />
											</div>
										{/if}
										<div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
										<div class="absolute bottom-3 left-3 right-3 flex items-center justify-between">
											<span class="px-2.5 py-1 bg-white/90 backdrop-blur-sm text-zinc-950 text-[11px] font-black rounded-full shadow">
												{item.progressPercent}% fini
											</span>
											{#if item.progressPercent === 100}
												<span class="px-2.5 py-1 bg-emerald-500 text-white text-[10px] font-black uppercase tracking-wider rounded-full shadow">
													Fini ✓
												</span>
											{/if}
										</div>
									</div>

									<div class="p-5 flex flex-col flex-1 gap-4">
										<div>
											<h3 class="font-black text-base text-zinc-950 leading-snug line-clamp-1">{item.course.title}</h3>
											<p class="text-xs text-zinc-400 mt-1 line-clamp-2">{item.course.description}</p>
										</div>

										<div class="space-y-1.5">
											<div class="flex justify-between text-xs text-zinc-500 font-medium">
												<span>Pwogrè</span>
												<span class="font-bold text-zinc-950">{item.completedLessons} / {item.totalLessons} leson</span>
											</div>
											<div class="w-full h-2 bg-zinc-100 rounded-full overflow-hidden">
												<div
													class="h-full bg-amber-400 rounded-full transition-all duration-500"
													style="width: {item.progressPercent}%;"
												></div>
											</div>
										</div>

										<a
											href="/learn/{item.course.id}"
											class="mt-auto inline-flex items-center justify-center gap-2 h-11 px-5 bg-zinc-950 hover:bg-zinc-800 text-white font-bold text-xs rounded-xl transition-colors shadow-sm"
										>
											<Play size={14} class="fill-white" />
											{item.progressPercent === 100 ? 'Revwa fòmasyon an' : 'Kontinye fòmasyon an'}
										</a>
									</div>
								</div>
							{/each}
						</div>
					{/if}
				</section>

				<!-- SECTION 2: MES EBOOKS -->
				<section id="sec-ebooks" class="scroll-mt-24 space-y-6">
					<div class="flex items-center justify-between pb-4 border-b border-zinc-200">
						<div class="flex items-center gap-3">
							<div class="size-9 bg-zinc-950 text-emerald-400 rounded-xl grid place-items-center">
								<FileText size={18} />
							</div>
							<div>
								<h2 class="text-2xl font-black tracking-tight text-zinc-950">Ebook PDF Mwen Yo ({myEbooks.length})</h2>
								<p class="text-xs text-zinc-400 mt-0.5">Feyè ak gid pratik ou yo ou ka telechaje nenpòt ki lè</p>
							</div>
						</div>
						<span class="text-xs text-zinc-400 font-medium hidden sm:inline-block">Telechajman san limit</span>
					</div>

					{#if myEbooks.length === 0}
						<div class="bg-white rounded-2xl border border-zinc-200/80 p-8 sm:p-12 text-center text-zinc-500 space-y-3">
							<div class="size-12 bg-emerald-400/10 text-emerald-500 rounded-2xl grid place-items-center mx-auto">
								<FileText size={24} />
							</div>
							<h3 class="font-black text-base text-zinc-950">Pa gen ebook ki disponib</h3>
							<p class="text-xs text-zinc-400 max-w-md mx-auto">Ou poko gen ebook PDF. Dekouvri gid pratik nou yo nan katalòg la.</p>
							<a href="/catalogue" class="inline-flex items-center gap-2 px-5 py-2.5 bg-zinc-950 hover:bg-zinc-800 text-white font-bold text-xs rounded-xl transition-colors shadow-sm mt-2">
								Dekouvri ebook yo <ArrowRight size={14} />
							</a>
						</div>
					{:else}
						<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
							{#each myEbooks as ebook (ebook.id)}
								<div class="bg-white rounded-2xl border border-zinc-200/80 overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col">
									<div class="relative overflow-hidden bg-zinc-100" style="aspect-ratio: 3/4;">
										{#if ebook.cover}
											<img src={ebook.cover} alt={ebook.title} class="w-full h-full object-cover" />
										{:else}
											<div class="w-full h-full flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-zinc-100 to-zinc-200">
												<FileText size={32} class="text-zinc-400" />
												<span class="text-[10px] font-bold text-zinc-400">PDF</span>
											</div>
										{/if}
										<div class="absolute top-2.5 right-2.5 px-2 py-0.5 bg-zinc-950/80 backdrop-blur-sm text-white text-[9px] font-black uppercase rounded">
											PDF
										</div>
									</div>

									<div class="p-4 flex flex-col flex-1 gap-3">
										<h3 class="font-black text-sm text-zinc-950 leading-snug line-clamp-2">{ebook.title}</h3>
										<p class="text-[11px] text-zinc-400 line-clamp-2">{ebook.description}</p>

										<button
											type="button"
											onclick={() => triggerDownload(ebook)}
											disabled={downloadingEbookId === ebook.id}
											class="mt-auto inline-flex items-center justify-center gap-2 h-10 px-4 bg-zinc-950 hover:bg-zinc-800 text-white font-bold text-xs rounded-xl transition-colors shadow-sm"
										>
											<Download size={14} class={downloadingEbookId === ebook.id ? 'animate-bounce' : ''} />
											{downloadingEbookId === ebook.id ? 'Preparasyon…' : 'Telechaje (PDF)'}
										</button>
									</div>
								</div>
							{/each}
						</div>
					{/if}
				</section>

				<!-- SECTION 3: MES COACHING -->
				<section id="sec-coaching" class="scroll-mt-24 space-y-6">
					<div class="flex items-center justify-between pb-4 border-b border-zinc-200">
						<div class="flex items-center gap-3">
							<div class="size-9 bg-zinc-950 text-orange-400 rounded-xl grid place-items-center">
								<CalendarCheck size={18} />
							</div>
							<div>
								<h2 class="text-2xl font-black tracking-tight text-zinc-950">Sesyon Coaching Mwen Yo ({myBookings.length})</h2>
								<p class="text-xs text-zinc-400 mt-0.5">Rendez-vous swivi endividyèl ou yo ak pwofesè a</p>
							</div>
						</div>
						<a href="/#coaching" class="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1">
							Rezeve yon lòt sesyon <ArrowRight size={12} />
						</a>
					</div>

					{#if myBookings.length === 0}
						<div class="bg-white rounded-2xl border border-zinc-200/80 p-8 sm:p-12 text-center text-zinc-500 space-y-3">
							<div class="size-12 bg-orange-400/10 text-orange-500 rounded-2xl grid place-items-center mx-auto">
								<CalendarCheck size={24} />
							</div>
							<h3 class="font-black text-base text-zinc-950">Pa gen sesyon coaching ki rezeve</h3>
							<p class="text-xs text-zinc-400 max-w-md mx-auto">Ou pa gen okenn rendez-vous coaching kounye a.</p>
							<a href="/#coaching" class="inline-flex items-center gap-2 px-5 py-2.5 bg-zinc-950 hover:bg-zinc-800 text-white font-bold text-xs rounded-xl transition-colors shadow-sm mt-2">
								Rezeve yon sesyon <ArrowRight size={14} />
							</a>
						</div>
					{:else}
						<div class="space-y-4">
							{#each myBookings as booking (booking.id)}
								<div class="bg-white rounded-2xl border border-zinc-200/80 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-sm">
									<div class="flex items-start gap-4">
										<div class="size-12 bg-amber-400/20 text-amber-600 rounded-xl grid place-items-center shrink-0">
											<CalendarCheck size={22} />
										</div>
										<div class="space-y-1">
											<div class="flex items-center gap-2">
												<h3 class="font-black text-base text-zinc-950">{booking.serviceTitle}</h3>
												<span class="px-2.5 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase rounded-full">
													{booking.status === 'confirmed' ? 'Konfime' : 'Enatant'}
												</span>
												<span class="text-[10px] text-zinc-400 font-mono border border-zinc-200 bg-zinc-50 px-1.5 py-0.5 rounded-md">ID: {booking.id}</span>
											</div>
											<p class="text-xs text-zinc-500 font-medium flex items-center gap-2">
												<Clock size={13} class="text-zinc-400" />
												{formatBookingDate(booking.startAt)}
											</p>
											{#if booking.coachWhatsapp}
												<p class="text-xs font-bold text-emerald-700 flex items-center gap-1.5 pt-0.5">
													<MessageCircle size={13} class="text-emerald-600 shrink-0" />
													<span>WhatsApp Coach : {booking.coachWhatsapp}</span>
												</p>
											{/if}
										</div>
									</div>

									<div class="flex items-center gap-3 shrink-0">
										<a
											href={whatsappLink(booking.coachWhatsapp || '+50937000000', `Bonjou, mwen gen yon kesyon konsènan rezèvasyon coaching mwen an (${booking.serviceTitle}).`)}
											target="_blank"
											rel="noreferrer"
											class="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-colors shadow-sm"
										>
											<MessageCircle size={14} />
											<span>Kontakte coach la ({booking.coachWhatsapp || '+50937000000'})</span>
										</a>
									</div>
								</div>
							{/each}
						</div>
					{/if}
				</section>

			</div>
		</div>

		</main>
	{/if}
	<PublicFooter />
</div>
