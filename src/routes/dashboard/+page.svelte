<script lang="ts">
	import PublicHeader from '$lib/components/PublicHeader.svelte';
	import PublicFooter from '$lib/components/PublicFooter.svelte';
	import type { Course, Ebook } from '$lib/types/admin';
	import { page } from '$app/state';
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

	let currentLang = $derived<'fr' | 'ht'>(page.url.searchParams.get('lang') === 'ht' ? 'ht' : 'fr');

	function getHref(path: string) {
		return currentLang === 'ht' ? `${path}?lang=ht` : path;
	}

	const i18n = {
		fr: {
			pageTitle: 'Mon Espace Apprenant · DJR Akademi',
			metaDesc: 'Espace client DJR Akademi — Accédez à vos formations, ebooks et sessions de coaching.',
			defaultUser: 'Étudiant',
			recently: 'Récemment',
			memberActive: 'Membre Actif',
			memberSince: 'Membre depuis',
			myCoursesQuick: 'Formations suivies',
			myEbooksQuick: 'Ebooks possédés',
			myCoachingQuick: 'Sessions de coaching',
			closeBtn: 'Fermer',
			coursesTitle: 'Mes Formations',
			coursesSub: 'Accédez à votre espace d\'apprentissage vidéo en ligne',
			coursesAccess: 'Accès illimité 24/7',
			noCoursesTitle: 'Aucune formation débloquée',
			noCoursesSub: 'Vous n\'avez débloqué aucune formation. Découvrez notre catalogue pour commencer l\'apprentissage.',
			exploreCatalog: 'Explorer le catalogue',
			completed: 'complété',
			doneBadge: 'Terminé ✓',
			progress: 'Progrès',
			lessons: 'leçons',
			defaultLesson: 'Bienvenue dans ce cours',
			continueCourse: 'Continuer la formation',
			reviewCourse: 'Revoir la formation',
			ebooksTitle: 'Mes Ebooks PDF',
			ebooksSub: 'Vos guides pratiques téléchargeables à tout moment',
			unlimitedDownload: 'Téléchargement illimité',
			noEbooksTitle: 'Aucun ebook disponible',
			noEbooksSub: 'Vous n\'avez aucun ebook PDF. Découvrez nos guides pratiques dans le catalogue.',
			exploreEbooks: 'Découvrir les ebooks',
			preparingDownload: 'Préparation…',
			downloadPdf: 'Télécharger (PDF)',
			downloadStarted: 'Téléchargement de "{title}" démarré.',
			downloadError: 'Téléchargement impossible.',
			coachingTitle: 'Mes Sessions de Coaching',
			coachingSub: 'Vos rendez-vous de suivi individuel avec le coach',
			bookAnother: 'Réserver une autre session',
			noCoachingTitle: 'Aucune session réservée',
			noCoachingSub: 'Vous n\'avez aucun rendez-vous de coaching actuellement.',
			bookSession: 'Réserver une session',
			confirmed: 'Confirmé',
			pending: 'En attente',
			whatsappCoach: 'WhatsApp Coach :',
			contactCoach: 'Contacter le coach',
			whatsappMsg: 'Bonjour, j\'ai une question concernant ma réservation de coaching ({title}).'
		},
		ht: {
			pageTitle: 'Espas Etidyan Mwen · DJR Akademi',
			metaDesc: 'Espas kliyan DJR Akademi — Aksede ak fòmasyon, ebook ak sesyon coaching ou yo.',
			defaultUser: 'Etidyan',
			recently: 'Nouvèlman',
			memberActive: 'Manm Aktif',
			memberSince: 'Manm depi',
			myCoursesQuick: 'Fòmasyon w ap swiv',
			myEbooksQuick: 'Ebook ou genyen',
			myCoachingQuick: 'Sesyon coaching',
			closeBtn: 'Fèmen',
			coursesTitle: 'Fòmasyon Mwen Yo',
			coursesSub: 'Aksede ak espas aprantisaj videyo ou a sou entènèt',
			coursesAccess: 'Aksè san limit 24/7',
			noCoursesTitle: 'Pa gen fòmasyon ki debloke',
			noCoursesSub: 'Ou poko debloke okenn fòmasyon. Dekouvri katalòg nou an pou kòmanse aprann.',
			exploreCatalog: 'Eksplore katalòg la',
			completed: 'fini',
			doneBadge: 'Fini ✓',
			progress: 'Pwogrè',
			lessons: 'leson',
			defaultLesson: 'Byenveni nan fòmasyon sa a',
			continueCourse: 'Kontinye fòmasyon an',
			reviewCourse: 'Revwa fòmasyon an',
			ebooksTitle: 'Ebook PDF Mwen Yo',
			ebooksSub: 'Feyè ak gid pratik ou yo ou ka telechaje nenpòt ki lè',
			unlimitedDownload: 'Telechajman san limit',
			noEbooksTitle: 'Pa gen ebook ki disponib',
			noEbooksSub: 'Ou poko gen ebook PDF. Dekouvri gid pratik nou yo nan katalòg la.',
			exploreEbooks: 'Dekouvri ebook yo',
			preparingDownload: 'Preparasyon…',
			downloadPdf: 'Telechaje (PDF)',
			downloadStarted: 'Telechajman nan "{title}" kòmanse.',
			downloadError: 'Telechajman pa posib.',
			coachingTitle: 'Sesyon Coaching Mwen Yo',
			coachingSub: 'Rendez-vous swivi endividyèl ou yo ak pwofesè a',
			bookAnother: 'Rezeve yon lòt sesyon',
			noCoachingTitle: 'Pa gen sesyon coaching ki rezeve',
			noCoachingSub: 'Ou pa gen okenn rendez-vous coaching kounye a.',
			bookSession: 'Rezeve yon sesyon',
			confirmed: 'Konfime',
			pending: 'Enatant',
			whatsappCoach: 'WhatsApp Coach :',
			contactCoach: 'Kontakte coach la',
			whatsappMsg: 'Bonjou, mwen gen yon kesyon konsènan rezèvasyon coaching mwen an ({title}).'
		}
	};
	let t = $derived(i18n[currentLang]);

	$effect(() => {
		if (!authState.loading && !authState.user) {
			goto(getHref('/'));
		}
	});

	// Real customer data from Appwrite profile and authState
	const user = $derived({
		name: authState.profile?.name || authState.user?.name || t.defaultUser,
		email: authState.user?.email || 'email@example.com',
		whatsapp: authState.profile?.whatsapp || '',
		avatar: (authState.profile?.name || authState.user?.name)
			? (authState.profile?.name || authState.user?.name || '').substring(0, 2).toUpperCase()
			: 'ED',
		memberSince: authState.profile?.createdAt
			? new Date(authState.profile.createdAt).toLocaleDateString(currentLang === 'ht' ? 'ht-HT' : 'fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
			: t.recently
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
					lastLessonTitle: lessons.find((lesson) => lesson.id === progress.lastLessonId)?.title || t.defaultLesson
				};
			});
			myCourses = (await Promise.all(coursePromises)).filter(Boolean);
			myEbooks = library.ebooks;
			myBookings = (library.bookings || []).filter(
				(b) => (b.status === 'confirmed' || b.status === 'completed' || b.paymentStatus === 'paid' || b.paymentStatus === 'not_required') &&
				       b.status !== 'pending_payment' && b.paymentStatus !== 'pending'
			);
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
			downloadSuccessMessage = t.downloadStarted.replace('{title}', ebook.title);
		} catch (caught) {
			downloadSuccessMessage = caught instanceof Error ? caught.message : t.downloadError;
		} finally {
			downloadingEbookId = null;
		}
	}

	function formatBookingDate(iso: string) {
		return new Date(iso).toLocaleString(currentLang === 'ht' ? 'ht-HT' : 'fr-FR', { dateStyle: 'long', timeStyle: 'short' });
	}
</script>

<svelte:head>
	<title>{t.pageTitle}</title>
	<meta name="description" content={t.metaDesc} />
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
		<section class="dashboard-hero bg-zinc-950 text-white py-12 sm:py-16">
			<div class="dashboard-hero-inner max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div class="dashboard-user-row flex flex-col md:flex-row items-start md:items-center justify-between gap-6">

					<!-- User Info -->
					<div class="dashboard-user flex items-center gap-4">
						<div class="dashboard-avatar size-16 bg-gradient-to-br from-amber-400 to-orange-500 text-black text-xl font-black rounded-2xl grid place-items-center shadow-xl shrink-0">
							{user.avatar}
						</div>
						<div>
							<div class="dashboard-name-line flex items-center gap-2">
								<h1 class="dashboard-user-name text-2xl sm:text-3xl font-black tracking-tight">{user.name}</h1>
								<span class="dashboard-member-status px-2.5 py-0.5 bg-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-wider rounded-md border border-emerald-500/30">
									{t.memberActive}
								</span>
							</div>
							<p class="dashboard-user-meta text-white/50 text-xs mt-1 font-mono">{user.email} · {t.memberSince} {user.memberSince}</p>
						</div>
					</div>

				</div>

				<!-- Stats Overview Bar / Quick Jump Links -->
				<div class="dashboard-quick-links grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 pt-8 border-t border-white/10">
					<a
						href="#sec-courses"
						class="dashboard-quick-link flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/8 hover:bg-white/10 transition-colors text-left"
					>
						<div class="dashboard-quick-icon size-10 bg-amber-400/20 text-amber-400 rounded-lg grid place-items-center shrink-0">
							<BookOpen size={20} />
						</div>
						<div>
							<span class="text-xl font-black text-white">{myCourses.length}</span>
							<span class="block text-xs text-white/40 font-medium">{t.myCoursesQuick}</span>
						</div>
					</a>

					<a
						href="#sec-ebooks"
						class="dashboard-quick-link flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/8 hover:bg-white/10 transition-colors text-left"
					>
						<div class="dashboard-quick-icon size-10 bg-emerald-400/20 text-emerald-400 rounded-lg grid place-items-center shrink-0">
							<FileText size={20} />
						</div>
						<div>
							<span class="text-xl font-black text-white">{myEbooks.length}</span>
							<span class="block text-xs text-white/40 font-medium">{t.myEbooksQuick}</span>
						</div>
					</a>

					<a
						href="#sec-coaching"
						class="dashboard-quick-link flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/8 hover:bg-white/10 transition-colors text-left"
					>
						<div class="dashboard-quick-icon size-10 bg-orange-400/20 text-orange-400 rounded-lg grid place-items-center shrink-0">
							<CalendarCheck size={20} />
						</div>
						<div>
							<span class="text-xl font-black text-white">{myBookings.length}</span>
							<span class="block text-xs text-white/40 font-medium">{t.myCoachingQuick}</span>
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
						<button type="button" onclick={() => (downloadSuccessMessage = null)} class="text-emerald-500 hover:text-emerald-700 text-xs">{t.closeBtn}</button>
					</div>
				{/if}

				<!-- SECTION 1: MES FORMATIONS -->
				<section id="sec-courses" class="scroll-mt-24 space-y-6">
					<div class="dashboard-section-head flex items-center justify-between pb-4 border-b border-zinc-200">
						<div class="flex items-center gap-3">
							<div class="size-9 bg-zinc-950 text-amber-400 rounded-xl grid place-items-center">
								<BookOpen size={18} />
							</div>
							<div>
								<h2 class="text-2xl font-black tracking-tight text-zinc-950">{t.coursesTitle} ({myCourses.length})</h2>
								<p class="text-xs text-zinc-400 mt-0.5">{t.coursesSub}</p>
							</div>
						</div>
						<span class="text-xs text-zinc-400 font-medium hidden sm:inline-block">{t.coursesAccess}</span>
					</div>

					{#if myCourses.length === 0}
						<div class="bg-white rounded-2xl border border-zinc-200/80 p-8 sm:p-12 text-center text-zinc-500 space-y-3">
							<div class="size-12 bg-amber-400/10 text-amber-500 rounded-2xl grid place-items-center mx-auto">
								<BookOpen size={24} />
							</div>
							<h3 class="font-black text-base text-zinc-950">{t.noCoursesTitle}</h3>
							<p class="text-xs text-zinc-400 max-w-md mx-auto">{t.noCoursesSub}</p>
							<a href={getHref('/catalogue')} class="inline-flex items-center gap-2 px-5 py-2.5 bg-zinc-950 hover:bg-zinc-800 text-white font-bold text-xs rounded-xl transition-colors shadow-sm mt-2">
								{t.exploreCatalog} <ArrowRight size={14} />
							</a>
						</div>
					{:else}
						<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
							{#each myCourses as item (item.course.id)}
								<div class="bg-white rounded-2xl border border-zinc-200/80 overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col">
									<a href={getHref(`/learn/${item.course.id}`)} class="relative aspect-video bg-zinc-100 overflow-hidden group block">
										{#if item.course.cover}
											<img src={item.course.cover} alt={item.course.title} class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
										{:else}
											<div class="w-full h-full flex items-center justify-center bg-zinc-200">
												<BookOpen size={32} class="text-zinc-400" />
											</div>
										{/if}
										<div class="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
										<div class="absolute inset-0 flex items-center justify-center">
											<div class="size-12 bg-amber-400 text-black rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
												<Play size={20} class="fill-black ml-0.5" />
											</div>
										</div>
										<div class="absolute bottom-3 left-3 right-3 flex items-center justify-between">
											<span class="px-2.5 py-1 bg-white/90 backdrop-blur-sm text-zinc-950 text-[11px] font-black rounded-full shadow">
												{item.progressPercent}% {t.completed}
											</span>
											{#if item.progressPercent === 100}
												<span class="px-2.5 py-1 bg-emerald-500 text-white text-[10px] font-black uppercase tracking-wider rounded-full shadow">
													{t.doneBadge}
												</span>
											{/if}
										</div>
									</a>

									<div class="p-5 flex flex-col flex-1 gap-4">
										<div>
											<a href={getHref(`/learn/${item.course.id}`)} class="hover:text-amber-600 transition-colors">
												<h3 class="font-black text-base text-zinc-950 leading-snug line-clamp-1">{item.course.title}</h3>
											</a>
											<p class="text-xs text-zinc-400 mt-1 line-clamp-2">{item.course.description}</p>
										</div>

										<div class="space-y-1.5">
											<div class="flex justify-between text-xs text-zinc-500 font-medium">
												<span>{t.progress}</span>
												<span class="font-bold text-zinc-950">{item.completedLessons} / {item.totalLessons} {t.lessons}</span>
											</div>
											<div class="w-full h-2 bg-zinc-100 rounded-full overflow-hidden">
												<div
													class="h-full bg-amber-400 rounded-full transition-all duration-500"
													style="width: {item.progressPercent}%;"
												></div>
											</div>
										</div>

										<a
											href={getHref(`/learn/${item.course.id}`)}
											class="mt-auto inline-flex items-center justify-center gap-2 h-11 px-5 bg-zinc-950 hover:bg-zinc-800 text-white font-bold text-xs rounded-xl transition-colors shadow-sm"
										>
											<Play size={14} class="fill-white" />
											{item.progressPercent === 100 ? t.reviewCourse : t.continueCourse}
										</a>
									</div>
								</div>
							{/each}
						</div>
					{/if}
				</section>

				<!-- SECTION 2: MES EBOOKS -->
				<section id="sec-ebooks" class="scroll-mt-24 space-y-6">
					<div class="dashboard-section-head flex items-center justify-between pb-4 border-b border-zinc-200">
						<div class="flex items-center gap-3">
							<div class="size-9 bg-zinc-950 text-emerald-400 rounded-xl grid place-items-center">
								<FileText size={18} />
							</div>
							<div>
								<h2 class="text-2xl font-black tracking-tight text-zinc-950">{t.ebooksTitle} ({myEbooks.length})</h2>
								<p class="text-xs text-zinc-400 mt-0.5">{t.ebooksSub}</p>
							</div>
						</div>
						<span class="text-xs text-zinc-400 font-medium hidden sm:inline-block">{t.unlimitedDownload}</span>
					</div>

					{#if myEbooks.length === 0}
						<div class="bg-white rounded-2xl border border-zinc-200/80 p-8 sm:p-12 text-center text-zinc-500 space-y-3">
							<div class="size-12 bg-emerald-400/10 text-emerald-500 rounded-2xl grid place-items-center mx-auto">
								<FileText size={24} />
							</div>
							<h3 class="font-black text-base text-zinc-950">{t.noEbooksTitle}</h3>
							<p class="text-xs text-zinc-400 max-w-md mx-auto">{t.noEbooksSub}</p>
							<a href={getHref('/catalogue')} class="inline-flex items-center gap-2 px-5 py-2.5 bg-zinc-950 hover:bg-zinc-800 text-white font-bold text-xs rounded-xl transition-colors shadow-sm mt-2">
								{t.exploreEbooks} <ArrowRight size={14} />
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
											{downloadingEbookId === ebook.id ? t.preparingDownload : t.downloadPdf}
										</button>
									</div>
								</div>
							{/each}
						</div>
					{/if}
				</section>

				<!-- SECTION 3: MES COACHING -->
				<section id="sec-coaching" class="scroll-mt-24 space-y-6">
					<div class="dashboard-section-head flex items-center justify-between pb-4 border-b border-zinc-200">
						<div class="flex items-center gap-3">
							<div class="size-9 bg-zinc-950 text-orange-400 rounded-xl grid place-items-center">
								<CalendarCheck size={18} />
							</div>
							<div>
								<h2 class="text-2xl font-black tracking-tight text-zinc-950">{t.coachingTitle} ({myBookings.length})</h2>
								<p class="text-xs text-zinc-400 mt-0.5">{t.coachingSub}</p>
							</div>
						</div>
						<a href={getHref('/#coaching')} class="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1">
							{t.bookAnother} <ArrowRight size={12} />
						</a>
					</div>

					{#if myBookings.length === 0}
						<div class="bg-white rounded-2xl border border-zinc-200/80 p-8 sm:p-12 text-center text-zinc-500 space-y-3">
							<div class="size-12 bg-orange-400/10 text-orange-500 rounded-2xl grid place-items-center mx-auto">
								<CalendarCheck size={24} />
							</div>
							<h3 class="font-black text-base text-zinc-950">{t.noCoachingTitle}</h3>
							<p class="text-xs text-zinc-400 max-w-md mx-auto">{t.noCoachingSub}</p>
							<a href={getHref('/#coaching')} class="inline-flex items-center gap-2 px-5 py-2.5 bg-zinc-950 hover:bg-zinc-800 text-white font-bold text-xs rounded-xl transition-colors shadow-sm mt-2">
								{t.bookSession} <ArrowRight size={14} />
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
													{booking.status === 'confirmed' ? t.confirmed : t.pending}
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
													<span>{t.whatsappCoach} {booking.coachWhatsapp}</span>
												</p>
											{/if}
										</div>
									</div>

									<div class="flex items-center gap-3 shrink-0">
										<a
											href={whatsappLink(booking.coachWhatsapp || '+50937000000', t.whatsappMsg.replace('{title}', booking.serviceTitle))}
											target="_blank"
											rel="noreferrer"
											class="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-colors shadow-sm"
										>
											<MessageCircle size={14} />
											<span>{t.contactCoach} ({booking.coachWhatsapp || '+50937000000'})</span>
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


<style>


	.dashboard-hero {
		padding-top: 52px;
		padding-bottom: 0;
		background: #151513;
	}

	.dashboard-user-row {
		padding-bottom: 34px;
	}

	.dashboard-avatar {
		width: 58px;
		height: 58px;
		border-radius: 0;
		background: #e2ad3d;
		box-shadow: none;
	}

	.dashboard-user-name {
		font-family: Georgia, 'Times New Roman', serif;
		font-size: clamp(24px, 3vw, 34px);
		font-weight: 700;
		letter-spacing: -0.03em;
		line-height: 1.08;
	}

	.dashboard-member-status {
		padding: 5px 8px;
		border: 1px solid rgba(88, 199, 120, 0.35);
		border-radius: 0;
		background: transparent;
		color: #75d58e;
		font-size: 9px;
		white-space: nowrap;
	}

	.dashboard-user-meta {
		margin-top: 7px;
		color: rgba(255, 255, 255, 0.5);
		font-family: ui-sans-serif, system-ui, sans-serif;
		font-size: 11px;
		line-height: 1.5;
	}

	.dashboard-quick-links {
		gap: 0;
		margin-top: 0;
		padding-top: 0;
		border-top: 1px solid rgba(255, 255, 255, 0.13);
		border-bottom: 1px solid rgba(255, 255, 255, 0.13);
	}

	.dashboard-quick-link {
		min-height: 88px;
		gap: 14px;
		padding: 18px 22px;
		border: 0;
		border-right: 1px solid rgba(255, 255, 255, 0.13);
		border-radius: 0;
		background: transparent;
		transition: background-color 160ms ease;
	}

	.dashboard-quick-link:last-child { border-right: 0; }
	.dashboard-quick-link:hover { background: rgba(255, 255, 255, 0.055); }

	.dashboard-quick-icon {
		width: 36px;
		height: 36px;
		border-radius: 0;
		background: transparent;
		color: #e2ad3d;
	}

	.dashboard-quick-link > div:last-child > span:first-child {
		font-family: Georgia, 'Times New Roman', serif;
		font-size: 25px;
		font-weight: 700;
		line-height: 1;
	}

	.dashboard-quick-link > div:last-child > span:last-child {
		margin-top: 6px;
		color: rgba(255, 255, 255, 0.5);
		font-size: 11px;
		line-height: 1.3;
	}
	.dashboard-section-head {
		gap: 24px;
		padding: 22px 24px;
		border: 1px solid #ded7cc;
		background: #fff;
		box-shadow: 0 8px 28px rgba(37, 29, 18, 0.045);
	}

	.dashboard-section-head > div {
		min-width: 0;
	}

	.dashboard-section-head > div > div:first-child {
		width: 44px;
		height: 44px;
		border-radius: 0;
		background: #171713;
	}

	.dashboard-section-head h2 {
		margin: 0;
		font-family: Georgia, 'Times New Roman', serif;
		font-size: clamp(20px, 2.2vw, 27px);
		font-weight: 700;
		letter-spacing: -0.025em;
		line-height: 1.15;
	}

	.dashboard-section-head h2 + p {
		margin-top: 6px;
		color: #777067;
		font-size: 12px;
		line-height: 1.5;
	}

	.dashboard-section-head > span {
		display: inline-flex;
		min-height: 34px;
		align-items: center;
		padding: 0 12px;
		border: 1px solid #ddd5c9;
		background: #f8f5ef;
		color: #70685d;
		font-size: 10px;
		font-weight: 800;
		white-space: nowrap;
	}

	.dashboard-section-head > a {
		display: inline-flex;
		min-height: 40px;
		align-items: center;
		justify-content: center;
		gap: 7px;
		padding: 0 14px;
		border: 1px solid #d49b29;
		background: #e3ad3d;
		color: #17130d;
		font-size: 11px;
		font-weight: 850;
		white-space: nowrap;
		transition: background-color 160ms ease, transform 160ms ease;
	}

	.dashboard-section-head > a:hover {
		background: #edbc55;
		color: #17130d;
		transform: translateY(-1px);
	}

	@media (max-width: 640px) {
		.dashboard-section-head {
			align-items: flex-start;
			gap: 17px;
			padding: 18px;
			flex-direction: column;
		}

		.dashboard-section-head > div {
			align-items: flex-start;
		}

		.dashboard-section-head > div > div:first-child {
			width: 40px;
			height: 40px;
		}

		.dashboard-section-head h2 {
			font-size: 21px;
		}

		.dashboard-section-head > span {
			display: inline-flex;
		}

		.dashboard-section-head > a {
			width: 100%;
		}
	}


	@media (max-width: 640px) {
		.dashboard-hero {
			padding-top: 34px;
		}

		.dashboard-user-row {
			padding-bottom: 27px;
		}

		.dashboard-user {
			align-items: flex-start;
		}

		.dashboard-avatar {
			width: 50px;
			height: 50px;
			font-size: 16px;
		}

		.dashboard-name-line {
			align-items: flex-start;
			flex-direction: column;
		}

		.dashboard-user-name {
			font-size: 25px;
		}

		.dashboard-user-meta {
			max-width: 230px;
			overflow-wrap: anywhere;
		}

		.dashboard-quick-links {
			grid-template-columns: 1fr;
		}

		.dashboard-quick-link {
			min-height: 72px;
			padding: 14px 4px;
			border-right: 0;
			border-bottom: 1px solid rgba(255, 255, 255, 0.12);
		}

		.dashboard-quick-link:last-child { border-bottom: 0; }
	}

	@media (prefers-reduced-motion: reduce) {
		.dashboard-section-head > a { transition: none; }
	}
</style>
