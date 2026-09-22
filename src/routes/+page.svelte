<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import PublicHeader from '$lib/components/PublicHeader.svelte';
	import PublicFooter from '$lib/components/PublicFooter.svelte';
	import BundleCard from '$lib/components/BundleCard.svelte';
	import { getPublishedBundles, type Bundle } from '$lib/services/bundles';

	import { getPublishedCourses } from '$lib/services/courses';
	import { getPublishedEbooks } from '$lib/services/ebooks';
	import { getActiveCoachingServices } from '$lib/services/coaching';
	import type { Course, Ebook } from '$lib/types/admin';
	import type { CoachingService } from '$lib/types/coaching';
	import { toast } from '$lib/toast.svelte';
	import { formatPublicPrice } from '$lib/utils/public-price';

	import {
		ArrowRight,
		BookOpen,
		FileText,
		CalendarCheck,
		CheckCircle2,
		Star,
		Play,
		Download,
		CreditCard,
		Smartphone,
		ShieldCheck,
		HelpCircle,
		Send,
		Loader2,
		AlertCircle,
		Clock
	} from 'lucide-svelte';

	import { authState } from '$lib/auth.svelte';
	import { verifyLemonSqueezyEmail, verifyPlopplopReference } from '$lib/services/payments';

	let currentLang = $derived<'fr' | 'ht'>(page.url.searchParams.get('lang') === 'ht' ? 'ht' : 'fr');

	const i18n = {
		fr: {
			metaTitle: "DJR Akademi · Formations, Livres électroniques & Consultations en ligne",
			metaDesc: "Accédez à nos formations vidéo, livres électroniques et consultations individuelles. Développez vos compétences dès aujourd'hui avec DJR Akademi.",
			badge: "Plateforme de formation en ligne",
			heroTitle1: "Apprendre.",
			heroTitle2: "Progresser.",
			heroTitle3: "Réussir.",
			heroIntro1: "Maîtrisez l'intelligence artificielle pour propulser votre carrière et vos revenus.",
			heroIntro2: "DJR Akademi s'adresse à tous ceux qui souhaitent prendre une longueur d'avance à l'ère de l'intelligence artificielle.",
			ctaCourses: "Découvrir les formations",
			ctaCoaching: "Réserver une consultation",
			ratingText: "Évaluation 4.9 sur 5, plus de 600 étudiants",
			ratingScore: "4.9/5",
			ratingCount: "600+ étudiants",
			statCourses: "Formation",
			statEbooks: "Livres électroniques",
			statStudents: "Étudiants",
			benefitOnline: "100% en ligne",
			benefitAccess: "Accès rapide",
			
			coursesKicker: "Formations",
			coursesTitle: "Apprenez à votre rythme",
			coursesDesc: "Des formations complètes et structurées pour maîtriser de nouvelles compétences.",
			coursesCount: (n: number) => `${n} disponible${n > 1 ? 's' : ''}`,
			freeLabel: "Gratuit",
			
			ebooksKicker: "Bibliothèque DJR",
			ebooksTitle: "Tout commence par une bonne lecture.",
			ebooksDesc: "Des livres numériques à lire et appliquer pour évoluer à votre propre rythme.",
			ebooksCount: (n: number) => `${n} livre${n > 1 ? 's' : ''} électronique${n > 1 ? 's' : ''} disponible${n > 1 ? 's' : ''}`,
			ebookFormat: "LIVRE ÉLECTRONIQUE",
			ebookRead: "Lire le livre",

			bundlesKicker: "Offres groupées",
			bundlesTitle: "Packs Formation + Livres électroniques",
			bundlesDesc: "Un pack complet regroupant des ressources complémentaires à un tarif préférentiel.",
			bundlesLink: "Voir tous les packs",

			coachingKicker: "Consultation",
			coachingTitle: "Consultations individuelles",
			coachingDesc: "Un accompagnement sur mesure pour aller plus loin.",
			coachingCount: (n: number) => `${n} consultation${n > 1 ? 's' : ''} disponible${n > 1 ? 's' : ''}`,
			coachingCTA: "Réserver une consultation",
			coachingDuration: (m: number) => `${m} min`,

			supportKicker: "Support & Problèmes d'accès",
			supportTitle: "Vous avez payé mais n'avez pas reçu votre accès ?",
			supportDesc: "Si vous avez déjà effectué un paiement et n'avez pas accès à votre contenu, saisissez votre e-mail ou votre référence ci-dessous pour vérifier votre accès immédiatement.",
			supportTabLabel: "Sélectionnez votre mode de paiement :",
			supportTabCard: "Carte bancaire",
			supportTabMobile: "MonCash / Natcash",
			supportCardLabel: "E-mail de votre compte (identique à celui utilisé lors de l'achat sur Lemon Squeezy) *",
			supportCardHelp: "Pour votre sécurité, utilisez l'e-mail de votre compte :",
			supportRefLabel: "Numéro de référence de la transaction MonCash / Natcash *",
			supportRefHelp: "Saisissez la référence figurant sur votre message de confirmation MonCash / Natcash.",
			supportBtnLoading: "Vérification en cours...",
			supportBtnSubmit: "Vérifier et débloquer mon accès",
			supportNeedLogin: "Vous devez être connecté à votre compte pour vérifier un paiement.",
			supportInvalidEmail: "Veuillez saisir une adresse e-mail valide.",
			supportCardSuccess: "Votre paiement par carte a été vérifié avec succès ! Redirection en cours...",
			supportCardError: (email: string) => `Aucun paiement confirmé trouvé sur Lemon Squeezy pour l'e-mail "${email}".`,
			supportInvalidRef: "Veuillez saisir le numéro de référence de la transaction.",
			supportRefSuccess: "Paiement vérifié avec succès ! Redirection en cours...",
			supportRefError: (ref: string) => `Aucun paiement valide trouvé pour la référence "${ref}".`,
			supportErrorGeneral: "Une erreur est survenue lors de la vérification. Veuillez nous contacter directement.",
			
			testimonialsKicker: "Témoignages",
			t1Quote: "Je suis vraiment satisfait de la formation. J'ai appris beaucoup de choses que je ne savais pas auparavant.",
			t1Role: "Étudiant DJR Akademi",
			t1Verified: "Étudiant vérifié"
		},
		ht: {
			metaTitle: "DJR Akademi · Fòmasyon, Liv dijital ak Konsiltasyon sou entènèt",
			metaDesc: "Jwenn aksè ak fòmasyon videyo nou yo, liv dijital ak konsiltasyon endividyèl. Devlope konpetans ou jodi a ak DJR Akademi.",
			badge: "Platfòm fòmasyon sou entènèt",
			heroTitle1: "Aprann.",
			heroTitle2: "Avanse.",
			heroTitle3: "Reyisi.",
			heroIntro1: "Aprann sèvi ak entelijans atifisyèl pou w ka amelyore konpetans ou ak revni w.",
			heroIntro2: "DJR Akademi kreye pou tout moun ki pa vle rete dèyè nan epòk entelijans atifisyèl la.",
			ctaCourses: "Gade fòmasyon yo",
			ctaCoaching: "Rezève yon konsiltasyon",
			ratingText: "Evalyasyon 4.9 sou 5, plis pase 600 etidyan",
			ratingScore: "4.9/5",
			ratingCount: "600+ etidyan",
			statCourses: "Fòmasyon",
			statEbooks: "Liv dijital",
			statStudents: "Etidyan",
			benefitOnline: "100% sou entènèt",
			benefitAccess: "Aksè rapid",

			coursesKicker: "Fòmasyon",
			coursesTitle: "Aprann nan ritm pa w",
			coursesDesc: "Fòmasyon konplè epi byen òganize pou w ka mèt sou nouvo konpetans.",
			coursesCount: (n: number) => `${n} disponib`,
			freeLabel: "Gratis",

			ebooksKicker: "Bibliyotèk DJR",
			ebooksTitle: "Tout kòmanse ak yon bon lekti.",
			ebooksDesc: "Liv dijital pratik pou w li, aplike epi grandi nan ritm pa w.",
			ebooksCount: (n: number) => `${n} liv dijital disponib`,
			ebookFormat: "LIV DIJITAL",
			ebookRead: "Li liv la",

			bundlesKicker: "Pakèt resous",
			bundlesTitle: "Pakèt fòmasyon + liv dijital",
			bundlesDesc: "Yon sèl pak pou jwenn resous ki mache ansanm, ak yon pri espesyal.",
			bundlesLink: "Gade tout pakèt yo",

			coachingKicker: "Konsiltasyon",
			coachingTitle: "Konsiltasyon endividyèl",
			coachingDesc: "Yon swivi sou mezire pou w ale pi lwen.",
			coachingCount: (n: number) => `${n} konsiltasyon disponib`,
			coachingCTA: "Rezève yon konsiltasyon",
			coachingDuration: (m: number) => `${m} min`,

			supportKicker: "Sipò & Pwoblèm aksè",
			supportTitle: "Ou peye epi w pa jwenn aksè?",
			supportDesc: "Si ou te peye deja epi ou pa jwenn fòmasyon an, antre imèl ou oswa referans tranzaksyon w lan anba a pou n verifye aksè w la imedyatman.",
			supportTabLabel: "Chwazi kijan w te peye:",
			supportTabCard: "Kat bankè",
			supportTabMobile: "MonCash / Natcash",
			supportCardLabel: "Imèl kont ou an (menm ak sa w te itilize pandan achte a sou Lemon Squeezy) *",
			supportCardHelp: "Pou sekirite w, itilize imèl kont ou an:",
			supportRefLabel: "Nimewo referans tranzaksyon MonCash / Natcash an *",
			supportRefHelp: "Antre nimewo referans ki sou mesaj konfimasyon MonCash / Natcash ou an.",
			supportBtnLoading: "N ap verifye...",
			supportBtnSubmit: "Verifye ak debloke aksè mwen",
			supportNeedLogin: "Ou dwe konekte sou kont ou pou w ka verifye yon peman.",
			supportInvalidEmail: "Tanpri antre yon adrès imèl ki valab.",
			supportCardSuccess: "Peman pa kat ou an verifye ak siksè! N ap redirije w pou w kòmanse fòmasyon an...",
			supportCardError: (email: string) => `Nou pa jwenn okenn peman konfime sou Lemon Squeezy pou imèl "${email}".`,
			supportInvalidRef: "Tanpri antre nimewo referans tranzaksyon an.",
			supportRefSuccess: "Peman verifye ak siksè! N ap redirije w pou w kòmanse fòmasyon an...",
			supportRefError: (ref: string) => `Nou pa jwenn okenn peman valide pou referans "${ref}".`,
			supportErrorGeneral: "Yon erè rive pandan verifikasyon an. Tanpri kontakte nou dirèkteman.",

			testimonialsKicker: "Temwayaj",
			t1Quote: "Mwen vrèman satisfè ak fòmasyon an. Mwen aprann anpil bagay mwen pa t konnen anvan.",
			t1Role: "Etidyan DJR Akademi",
			t1Verified: "Etidyan verifye"
		}
	};

	let t = $derived(i18n[currentLang]);

	let publishedCourses = $state<Course[]>([]);
	let publishedEbooks = $state<Ebook[]>([]);
	let activeCoaching = $state<CoachingService[]>([]);
	let publishedBundles = $state<Bundle[]>([]);

	// Support Peman state
	let supportMethod = $state<'carte' | 'mobile'>('carte');
	let supportEmail = $state('');
	let supportReference = $state('');
	let supportLoading = $state(false);
	let supportSuccessMessage = $state<string | null>(null);
	let supportErrorMessage = $state<string | null>(null);

	onMount(async () => {
		const [courses, ebooks, coaching] = await Promise.all([
			getPublishedCourses(),
			getPublishedEbooks(),
			getActiveCoachingServices()
		]);
		publishedCourses = courses;
		publishedEbooks = ebooks;
		activeCoaching = coaching;
		getPublishedBundles().then((bundles) => publishedBundles = bundles).catch(() => undefined);
	});

	async function handleSupportSubmit(e: SubmitEvent) {
		e.preventDefault();
		supportSuccessMessage = null;
		supportErrorMessage = null;

		if (!authState.user) {
			toast.error(t.supportNeedLogin);
			return;
		}

		supportLoading = true;

		try {
			if (supportMethod === 'carte') {
				const email = supportEmail.trim();
				if (!email || !email.includes('@')) {
					toast.error(t.supportInvalidEmail);
					supportLoading = false;
					return;
				}

				const resData = await verifyLemonSqueezyEmail(email);

				if (resData.ok && resData.success) {
					const targetUrl = resData.courseId ? `/learn/${resData.courseId}` : '/dashboard';
					supportSuccessMessage = t.supportCardSuccess;
					toast.success(t.supportCardSuccess);
					setTimeout(() => {
						goto(targetUrl);
					}, 1000);
				} else {
					supportErrorMessage = resData.message || t.supportCardError(email);
					toast.error(supportErrorMessage || t.supportErrorGeneral);
				}
			} else {
				const ref = supportReference.trim();
				if (!ref) {
					toast.error(t.supportInvalidRef);
					supportLoading = false;
					return;
				}

				const resData = await verifyPlopplopReference(ref);

				if (resData.ok && resData.success) {
					const targetUrl = resData.courseId ? `/learn/${resData.courseId}` : '/dashboard';
					supportSuccessMessage = t.supportRefSuccess;
					toast.success(t.supportRefSuccess);
					setTimeout(() => {
						goto(targetUrl);
					}, 1000);
				} else {
					supportErrorMessage = resData.message || t.supportRefError(ref);
					toast.error(supportErrorMessage || t.supportErrorGeneral);
				}
			}
		} catch (error) {
			console.error('Support error:', error);
			supportErrorMessage = t.supportErrorGeneral;
			toast.error(t.supportErrorGeneral);
		} finally {
			supportLoading = false;
		}
	}
</script>

<svelte:head>
	<title>{t.metaTitle}</title>
	<meta name="description" content={t.metaDesc} />
</svelte:head>

<div class="min-h-screen bg-white flex flex-col font-sans text-zinc-900">
	<div class="home-hero-shell">
		<div class="home-header">
			<PublicHeader />
		</div>

		<section class="home-hero" aria-labelledby="home-hero-title">
			<div class="hero-inner">
				<div class="hero-copy">
					<h1 id="home-hero-title" class="hero-title">
						<span>{t.heroTitle1}</span>
						<span class="hero-title-accent">{t.heroTitle2}</span>
						<span>{t.heroTitle3}</span>
					</h1>

					<div class="hero-intro">
						<p>{t.heroIntro1}</p>
						<p>{t.heroIntro2}</p>
					</div>

					<div class="hero-actions">
						<a href="#courses" class="hero-primary">
							<Play size={16} fill="currentColor" />
							{t.ctaCourses}
						</a>
						<a href="#coaching" class="hero-secondary">{t.ctaCoaching}</a>
					</div>

					<div class="hero-rating" aria-label={t.ratingText}>
						<div class="hero-stars" aria-hidden="true">
							{#each [1, 2, 3, 4, 5] as star}
								<Star size={19} fill="currentColor" />
							{/each}
						</div>
						<strong>{t.ratingScore}</strong>
						<span class="rating-divider" aria-hidden="true"></span>
						<span>{t.ratingCount}</span>
					</div>
				</div>


				<div class="hero-stats">
					<div class="stats-numbers">
						<div class="stat"><strong>1</strong><span>{t.statCourses}</span></div>
						<div class="stat"><strong>2</strong><span>{t.statEbooks}</span></div>
						<div class="stat"><strong>600+</strong><span>{t.statStudents}</span></div>
					</div>
					<div class="stats-benefits">
						<span>{t.benefitOnline}</span>
						<span>{t.benefitAccess}</span>
					</div>
				</div>
			</div>
		</section>
	</div>

	<main class="flex-1">

		<!-- ═══════════════════════════════════════════════════
		     SECTION: FORMATIONS
		     ═══════════════════════════════════════════════════ -->
		<section id="courses" class="courses-showcase scroll-mt-20">
			<div class="courses-shell">
				<div class="courses-heading">
					<div>
						<span class="courses-kicker">{t.coursesKicker}</span>
						<h2>{t.coursesTitle}</h2>
						<p>{t.coursesDesc}</p>
					</div>
					<span class="courses-count">{t.coursesCount(publishedCourses.length)}</span>
				</div>

				<div class="courses-grid">
					{#each publishedCourses as course, index (course.id)}
						<a href="/cours/{course.id}" class="course-showcase-card">
							<div class="course-showcase-visual">
								{#if course.cover}
									<img src={course.cover} alt={course.title} loading="lazy" />
								{:else}
									<div class="course-showcase-placeholder">
										<BookOpen size={42} />
									</div>
								{/if}
								<div class="course-showcase-tint" aria-hidden="true"></div>
							</div>

							<div class="course-showcase-meta">
								<div class="course-showcase-copy">
									<h3><span>{String(index + 1).padStart(2, '0')}.</span> {course.title}</h3>
									<p>
										{#if course.isFree || course.price === 0}
											{t.freeLabel}
										{:else}
											{formatPublicPrice(course.price, course.priceUsd)}
										{/if}
									</p>
								</div>
								<span class="course-showcase-arrow" aria-hidden="true"><ArrowRight size={20} /></span>
							</div>
						</a>
					{/each}
				</div>
			</div>
		</section>


		<!-- ═══════════════════════════════════════════════════
		     SECTION: EBOOKS
		     ═══════════════════════════════════════════════════ -->
		<section id="ebooks" class="ebooks-showcase scroll-mt-20" aria-labelledby="ebooks-title">
			<div class="ebooks-shell">
				<div class="ebooks-heading">
					<div>
						<span class="ebooks-kicker"><FileText size={14} /> {t.ebooksKicker}</span>
						<h2 id="ebooks-title">{t.ebooksTitle}</h2>
						<p>{t.ebooksDesc}</p>
					</div>
					<span class="ebooks-count">{t.ebooksCount(publishedEbooks.length)}</span>
				</div>

				<div class="ebooks-grid">
					{#each publishedEbooks as ebook, index (ebook.id)}
						<a href="/ebooks/{ebook.id}" class="ebook-showcase-card">
							<div class="ebook-showcase-visual">
								{#if ebook.cover}
									<img src={ebook.cover} alt={ebook.title} loading="lazy" />
								{:else}
									<div class="ebook-placeholder"><FileText size={34} /><span>PDF</span></div>
								{/if}
								<div class="ebook-showcase-overlay"></div>
								<span class="ebook-format">{t.ebookFormat}</span>
								<span class="ebook-number">{String(index + 1).padStart(2, '0')}</span>
								<span class="ebook-view">{t.ebookRead} <ArrowRight size={14} /></span>
							</div>
							<div class="ebook-showcase-meta">
								<div>
									<h3>{ebook.title}</h3>
									<p>{ebook.isFree || ebook.price === 0 ? t.freeLabel : formatPublicPrice(ebook.price, ebook.priceUsd)}</p>
								</div>
								<span class="ebook-arrow"><ArrowRight size={18} /></span>
							</div>
						</a>
					{/each}
				</div>
			</div>
		</section>

		{#if publishedBundles.length > 0}
			<section class="border-y border-zinc-200 bg-amber-50/50 py-16 sm:py-20" aria-labelledby="home-bundles-title">
				<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
					<div class="mb-8 flex flex-wrap items-end justify-between gap-5">
						<div>
							<span class="text-xs font-black uppercase tracking-widest text-amber-700">{t.bundlesKicker}</span>
							<h2 id="home-bundles-title" class="mt-2 text-3xl font-black tracking-tight text-zinc-950">{t.bundlesTitle}</h2>
							<p class="mt-2 max-w-2xl text-sm text-zinc-600">{t.bundlesDesc}</p>
						</div>
						<a href="/bundles" class="inline-flex items-center gap-2 text-sm font-black text-zinc-950 hover:text-amber-700">{t.bundlesLink} <ArrowRight size={17} /></a>
					</div>
					<div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{#each publishedBundles.slice(0, 3) as bundle (bundle.id)}<BundleCard {bundle} />{/each}</div>
				</div>
			</section>
		{/if}

		<!-- ═══════════════════════════════════════════════════
		     SECTION: COACHING
		     ═══════════════════════════════════════════════════ -->
		<section id="coaching" class="py-20 bg-white border-t border-zinc-100 scroll-mt-20">
			<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

				<!-- Section Header -->
				<div class="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
					<div>
						<div class="flex items-center gap-2 mb-3">
							<div class="size-8 bg-zinc-950 text-white grid place-items-center rounded-lg">
								<CalendarCheck size={16} />
							</div>
							<span class="text-xs font-bold text-zinc-400 uppercase tracking-widest">{t.coachingKicker}</span>
						</div>
						<h2 class="text-3xl sm:text-4xl font-black text-zinc-950 tracking-tight">
							{t.coachingTitle}
						</h2>
						<p class="text-zinc-500 text-sm mt-2 max-w-lg">
							{t.coachingDesc}
						</p>
					</div>
					<span class="self-start sm:self-auto px-3.5 py-1.5 bg-zinc-100 text-zinc-600 text-xs font-bold rounded-full">
						{t.coachingCount(activeCoaching.length)}
					</span>
				</div>

				<!-- Coaching Cards -->
				<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
					{#each activeCoaching as coaching (coaching.id)}
						<a
							href="/coaching/{coaching.slug}"
							class="group relative text-left flex flex-col p-7 sm:p-8 bg-gradient-to-b from-white via-white to-zinc-50/70 rounded-3xl border border-zinc-200/90 shadow-xs hover:shadow-2xl hover:border-amber-400/70 hover:-translate-y-1.5 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-zinc-950 overflow-hidden"
						>
							<!-- Background Ambient Glow -->
							<div class="absolute -right-12 -top-12 size-40 bg-amber-400/10 rounded-full blur-2xl group-hover:bg-amber-400/25 transition-all duration-500 pointer-events-none"></div>

							<!-- Top Accent Gradient Line -->
							<div class="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-300 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

							<!-- Header Row (Icon + Duration Badge) -->
							<div class="flex items-center justify-between gap-4 mb-6 relative z-10">
								<div class="size-13 rounded-2xl bg-zinc-950 text-amber-400 grid place-items-center shadow-md shadow-zinc-950/10 group-hover:bg-amber-400 group-hover:text-zinc-950 group-hover:scale-105 transition-all duration-300">
									<CalendarCheck size={24} />
								</div>
								<span class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-amber-400/15 border border-amber-400/30 text-amber-950 text-xs font-bold transition-colors">
									<Clock size={13} class="text-amber-700" />
									{t.coachingDuration(coaching.durationMinutes)}
								</span>
							</div>

							<!-- Content -->
							<div class="relative z-10 flex-1 flex flex-col">
								<h3 class="font-black text-xl text-zinc-950 group-hover:text-amber-700 transition-colors leading-tight mb-2.5">
									{coaching.title}
								</h3>

								<p class="text-zinc-500 text-sm leading-relaxed line-clamp-3 flex-1 mb-6">
									{coaching.description}
								</p>
							</div>

							<!-- Price Row -->
							<div class="relative z-10 pt-4 border-t border-zinc-100 mb-5 flex items-center justify-between">
								<span class="text-xs font-bold uppercase tracking-wider text-zinc-400">Tarif / Pri</span>
								<div>
									{#if coaching.isFree || coaching.price === 0}
										<span class="font-black text-lg text-emerald-600">{t.freeLabel}</span>
									{:else}
										<span class="font-black text-2xl text-zinc-950 tracking-tight">{formatPublicPrice(coaching.price, coaching.priceUsd)}</span>
									{/if}
								</div>
							</div>

							<!-- Primary CTA Button Bar -->
							<div class="relative z-10 w-full h-11 rounded-2xl bg-zinc-950 group-hover:bg-amber-400 text-white group-hover:text-zinc-950 font-bold text-xs flex items-center justify-center gap-2 transition-all duration-300 shadow-sm group-hover:shadow-md">
								<span>{t.coachingCTA}</span>
								<ArrowRight size={15} class="group-hover:translate-x-1 transition-transform duration-200" />
							</div>
						</a>
					{/each}
				</div>

			</div>
		</section>

		<!-- ═══════════════════════════════════════════════════
		     SECTION: SUPPORT & VÉRIFICATION PAIEMENT (Banana Visual)
		     ═══════════════════════════════════════════════════ -->
		<section id="payment-support" class="py-20 bg-zinc-950 text-white relative overflow-hidden border-t border-white/10 scroll-mt-20">
			<!-- Background Ambient Glow -->
			<div class="absolute inset-0 pointer-events-none">
				<div class="absolute top-1/2 left-1/3 -translate-y-1/2 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-3xl"></div>
				<div class="absolute bottom-0 right-10 w-96 h-96 bg-yellow-500/5 rounded-full blur-3xl"></div>
			</div>

			<div class="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
				<div class="space-y-6">
						<div class="space-y-3">
							<div class="inline-flex items-center gap-2 px-3.5 py-1.5 bg-amber-400/10 border border-amber-400/20 rounded-full text-amber-400 text-xs font-bold uppercase tracking-wider">
								<HelpCircle size={14} />
								{t.supportKicker}
							</div>
							<h2 class="text-3xl sm:text-4xl font-black tracking-tight leading-tight">
								{t.supportTitle}
							</h2>
							<p class="text-white/60 text-sm leading-relaxed max-w-xl">
								{t.supportDesc}
							</p>
						</div>

						<!-- Payment Method Selector Tabs -->
						<div class="space-y-3">
							<span class="text-xs font-bold text-white/50 uppercase tracking-widest block">{t.supportTabLabel}</span>
							<div class="grid grid-cols-2 gap-2 p-1.5 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md">
								<button
									type="button"
									onclick={() => { supportMethod = 'carte'; supportSuccessMessage = null; supportErrorMessage = null; }}
									class="flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl font-bold text-xs transition-all duration-200 cursor-pointer {supportMethod === 'carte' ? 'bg-amber-400 text-black shadow-lg shadow-amber-400/20' : 'text-white/70 hover:text-white hover:bg-white/5'}"
								>
									<CreditCard size={16} />
									<span>{t.supportTabCard}</span>
								</button>
								<button
									type="button"
									onclick={() => { supportMethod = 'mobile'; supportSuccessMessage = null; supportErrorMessage = null; }}
									class="flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl font-bold text-xs transition-all duration-200 cursor-pointer {supportMethod === 'mobile' ? 'bg-amber-400 text-black shadow-lg shadow-amber-400/20' : 'text-white/70 hover:text-white hover:bg-white/5'}"
								>
									<Smartphone size={16} />
									<span>{t.supportTabMobile}</span>
								</button>
							</div>
						</div>

						<!-- Verification Form Card -->
						<form onsubmit={handleSupportSubmit} class="p-6 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-xl space-y-5">
							{#if supportMethod === 'carte'}
								<!-- Lemon Squeezy Card Email Input -->
								<div class="space-y-2">
									<label for="support-card-email" class="block text-xs font-bold text-white/90">
										{t.supportCardLabel}
									</label>
									<div class="relative">
										<input
											id="support-card-email"
											type="email"
											required
											placeholder="ex: nom.prenom@gmail.com"
											bind:value={supportEmail}
											class="w-full h-12 px-4 bg-zinc-900/90 border border-white/15 focus:border-amber-400 rounded-xl text-sm font-medium text-white placeholder-white/30 outline-none transition-colors"
										/>
									</div>
									<p class="text-[11px] text-white/40">
										{t.supportCardHelp} {authState.user?.email || ""}.
									</p>
								</div>
							{:else}
								<!-- MonCash / Natcash Reference Input -->
								<div class="space-y-2">
									<label for="support-ref" class="block text-xs font-bold text-white/90">
										{t.supportRefLabel}
									</label>
									<input
										id="support-ref"
										type="text"
										required
										placeholder="ex: 6a94b44a001655dbf38d"
										bind:value={supportReference}
										class="w-full h-12 px-4 bg-zinc-900/90 border border-white/15 focus:border-amber-400 rounded-xl text-sm font-medium text-white placeholder-white/30 outline-none transition-colors"
									/>
									<p class="text-[11px] text-white/40">
										{t.supportRefHelp}
									</p>
								</div>
							{/if}

							<!-- Submit Button -->
							<button
								type="submit"
								disabled={supportLoading}
								class="w-full h-12 bg-amber-400 hover:bg-amber-300 text-black font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-amber-400/15 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
							>
								{#if supportLoading}
									<Loader2 size={16} class="animate-spin" />
									<span>{t.supportBtnLoading}</span>
								{:else}
									<Send size={15} />
									<span>{t.supportBtnSubmit}</span>
								{/if}
							</button>
						</form>

						<!-- Alert Message Feedback -->
						{#if supportSuccessMessage}
							<div class="p-4 bg-emerald-500/15 border border-emerald-500/30 rounded-2xl flex items-start gap-3 text-emerald-300 text-xs leading-relaxed">
								<CheckCircle2 size={18} class="shrink-0 mt-0.5 text-emerald-400" />
								<div>{supportSuccessMessage}</div>
							</div>
						{/if}

						{#if supportErrorMessage}
							<div class="p-4 bg-rose-500/15 border border-rose-500/30 rounded-2xl flex items-start gap-3 text-rose-300 text-xs leading-relaxed">
								<AlertCircle size={18} class="shrink-0 mt-0.5 text-rose-400" />
								<div>{supportErrorMessage}</div>
							</div>
						{/if}
					</div>
			</div>
		</section>

		<section class="testimonials-section" aria-labelledby="testimonials-title">
			<div class="testimonials-shell">
				<div class="testimonials-heading">
					<h2 id="testimonials-title">{t.testimonialsKicker}</h2>
					<div class="testimonials-score-wrapper" aria-label={t.ratingText}>
						<!-- Overlapping Avatars Stack -->
						<div class="flex items-center -space-x-3">
							<img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80" alt="Etidyan" class="size-10 rounded-full object-cover ring-2 ring-[#f7f1e8] shadow-xs" />
							<img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80" alt="Etidyan" class="size-10 rounded-full object-cover ring-2 ring-[#f7f1e8] shadow-xs" />
							<img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80" alt="Etidyan" class="size-10 rounded-full object-cover ring-2 ring-[#f7f1e8] shadow-xs" />
							<img src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80" alt="Etidyan" class="size-10 rounded-full object-cover ring-2 ring-[#f7f1e8] shadow-xs" />
							<div class="size-10 rounded-full bg-amber-400 text-zinc-950 font-black text-xs flex items-center justify-center ring-2 ring-[#f7f1e8] shadow-xs">
								+600
							</div>
						</div>

						<!-- Rating Score & Stars -->
						<div class="flex flex-col items-center sm:items-start text-center sm:text-left">
							<div class="flex items-center gap-1 text-amber-500">
								<span class="font-black text-zinc-950 text-base mr-1">4.9</span>
								{#each [1, 2, 3, 4, 5] as _}
									<Star size={15} fill="currentColor" />
								{/each}
							</div>
						</div>
					</div>
				</div>

				<div class="max-w-2xl mx-auto">
					<article class="relative p-7 sm:p-9 bg-white rounded-3xl border border-zinc-200/90 shadow-xl shadow-zinc-950/5 hover:shadow-2xl hover:border-amber-400/50 transition-all duration-300 overflow-hidden group">
						<!-- Top Gold Accent Line -->
						<div class="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-300"></div>

						<!-- Decorative Watermark Quote Icon -->
						<div class="absolute top-4 right-6 text-amber-400/15 font-serif text-8xl leading-none pointer-events-none select-none group-hover:text-amber-400/25 transition-colors">
							“
						</div>

						<div class="relative z-10 flex flex-col gap-6">
							<!-- Header of Card: Stars & Verified Badge -->
							<div class="flex items-center justify-between gap-4">
								<div class="flex items-center gap-1 text-amber-400">
									{#each [1, 2, 3, 4, 5] as _}
										<Star size={18} fill="currentColor" />
									{/each}
								</div>
								<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200/60">
									<CheckCircle2 size={14} class="text-emerald-600" />
									{t.t1Verified}
								</span>
							</div>

							<!-- Quote Text -->
							<blockquote class="text-zinc-800 text-lg sm:text-xl font-medium leading-relaxed italic">
								"{t.t1Quote}"
							</blockquote>

							<!-- Author Footer -->
							<div class="flex items-center gap-4 pt-4 border-t border-zinc-100">
								<img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80" alt="Patrick J." class="size-12 rounded-full object-cover ring-2 ring-amber-400/40 shadow-sm" />
								<div>
									<h4 class="font-bold text-zinc-950 text-base">Patrick J.</h4>
									<p class="text-xs font-medium text-zinc-500">{t.t1Role}</p>
								</div>
							</div>
						</div>
					</article>
				</div>
			</div>
		</section>

		<!-- ═══════════════════════════════════════════════════
		     FOOTER CTA — Contact direct
		     ═══════════════════════════════════════════════════ -->
	</main>

	<PublicFooter />
</div>

<style>
	.home-hero-shell {
		position: relative;
		isolation: isolate;
		overflow: hidden;
		background:
			radial-gradient(ellipse 34% 76% at 70% 43%, rgba(233, 190, 153, 0.58) 0%, rgba(167, 126, 96, 0.32) 48%, transparent 78%),
			linear-gradient(90deg, #050504 0%, #070605 24%, #181410 39%, #594638 57%, #aa8367 70%, #6a594d 88%, #4c4038 100%);
	}

	.home-hero-shell::after {
		position: absolute;
		inset: 0;
		z-index: -1;
		content: '';
		pointer-events: none;
		background:
			radial-gradient(ellipse 62% 85% at 4% 45%, rgba(0, 0, 0, 0.34), transparent 70%),
			linear-gradient(180deg, rgba(0, 0, 0, 0.03), rgba(0, 0, 0, 0.13));
	}

	:global(.home-header header) {
		position: relative !important;
		top: auto !important;
		border: 0 !important;
		background: transparent !important;
		color: #f6f2ec;
		backdrop-filter: none !important;
		box-shadow: none !important;
	}

	:global(.home-header header > div) {
		height: 104px;
		max-width: 1440px;
		padding-right: 64px;
		padding-left: 64px;
	}

	:global(.home-header header > div > a:first-child img) {
		display: block;
		height: 44px;
		width: auto;
		object-fit: contain;
	}

	:global(.home-header header > div > a:first-child > span) {
		color: #f5f1eb !important;
		font-family: Georgia, 'Times New Roman', serif;
		font-size: 21px !important;
		font-weight: 700;
		letter-spacing: 0.01em;
	}

	:global(.home-header header nav) {
		gap: 42px;
		color: rgba(255, 255, 255, 0.86) !important;
		font-size: 16px !important;
		font-weight: 500;
	}

	:global(.home-header header nav a:hover) {
		color: #f1bd3b !important;
	}



	.home-hero {
		position: relative;
		min-height: max(790px, calc(100svh - 104px));
		color: #f7f4ef;
	}

	.hero-inner {
		position: relative;
		display: flex;
		width: 100%;
		min-height: max(790px, calc(100svh - 104px));
		max-width: 1440px;
		margin: 0 auto;
		padding: 60px 64px 40px;
		flex-direction: column;
		background-image: url('/djrakademi-owner Jean Ronald.png');
		background-position: right top;
		background-repeat: no-repeat;
		background-size: auto 130%;
	}

	.hero-copy {
		position: relative;
		z-index: 2;
		width: 512px;
		max-width: 100%;
	}



	.hero-title {
		margin: 32px 0 0;
		color: #f7f6f4;
		font-family: Georgia, 'Times New Roman', serif;
		font-size: clamp(76px, 6.55vw, 105px);
		font-weight: 700;
		letter-spacing: -0.048em;
		line-height: 0.95;
	}

	.hero-title span {
		display: block;
	}

	.hero-title .hero-title-accent {
		color: #edae28;
	}

	.hero-intro {
		margin-top: 38px;
	}

	.hero-intro p {
		margin: 0;
	}

	.hero-intro p:first-child {
		color: #f5d74a;
		font-size: 19px;
		font-weight: 750;
		line-height: 1.35;
	}

	.hero-intro p:last-child {
		max-width: 475px;
		margin-top: 9px;
		color: rgba(255, 255, 255, 0.76);
		font-size: 16px;
		font-weight: 400;
		line-height: 1.6;
	}

	.hero-actions {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 11px;
		width: 100%;
		margin-top: 19px;
	}

	.hero-actions a {
		display: inline-flex;
		height: 58px;
		align-items: center;
		justify-content: center;
		gap: 10px;
		border-radius: 0;
		font-size: 15px;
		font-weight: 750;
		transition: background-color 160ms ease, color 160ms ease;
	}

	.hero-primary {
		background: #f2b934;
		color: #090806;
	}

	.hero-primary:hover {
		background: #f8c64a;
	}

	.hero-secondary {
		border: 1px solid rgba(218, 222, 226, 0.52);
		background: rgba(3, 3, 3, 0.58);
		color: #f7f6f4;
	}

	.hero-secondary:hover {
		background: rgba(0, 0, 0, 0.78);
	}

	.hero-rating {
		display: flex;
		height: 59px;
		width: 100%;
		align-items: center;
		margin-top: 16px;
		margin-bottom: 15px;
		border: 1px solid rgba(218, 222, 226, 0.52);
		background: rgba(3, 3, 3, 0.64);
		color: rgba(255, 255, 255, 0.76);
		font-size: 17px;
	}

	.hero-stars {
		display: flex;
		gap: 1px;
		margin-left: 60px;
		color: #f0b62b;
	}

	.hero-rating strong {
		margin-left: 34px;
		color: #fff;
		font-size: 17px;
		font-weight: 800;
	}

	.rating-divider {
		width: 1px;
		height: 29px;
		margin: 0 35px;
		background: rgba(255, 255, 255, 0.48);
	}

	.hero-stats {
		display: flex;
		min-height: 108px;
		align-items: stretch;
		justify-content: space-between;
		margin-top: auto;
		border: 1px solid rgba(255, 255, 255, 0.14);
		background: rgba(5, 5, 4, 0.82);
		backdrop-filter: blur(10px);
	}

	.stats-numbers {
		display: grid;
		width: 580px;
		grid-template-columns: repeat(4, 1fr);
		padding: 25px 0;
	}

	.stat {
		display: flex;
		justify-content: center;
		padding: 0 28px;
		border-right: 1px solid rgba(255, 255, 255, 0.14);
		flex-direction: column;
	}

	.stat strong {
		color: #fff;
		font-family: Georgia, 'Times New Roman', serif;
		font-size: 30px;
		font-weight: 700;
		line-height: 1;
	}



	.stat span {
		margin-top: 8px;
		color: rgba(255, 255, 255, 0.76);
		font-size: 13px;
		line-height: 1;
	}

	.stats-benefits {
		display: flex;
		align-items: center;
		gap: 43px;
		padding: 0 47px;
		color: rgba(255, 255, 255, 0.82);
		font-size: 13px;
		white-space: nowrap;
	}

	@media (max-width: 1023px) {
		:global(.home-header header > div) {
			padding-right: 32px;
			padding-left: 32px;
		}

		.home-hero,
		.hero-inner {
			min-height: 780px;
		}

		.hero-inner {
			padding: 42px 32px 32px;
		}


		.hero-title {
			font-size: clamp(70px, 10vw, 92px);
		}

		.stats-benefits {
			gap: 22px;
			padding: 0 26px;
		}
	}

	@media (max-width: 760px) {
		.home-hero-shell {
			background:
				radial-gradient(ellipse 75% 45% at 88% 28%, rgba(192, 147, 111, 0.36), transparent 78%),
				linear-gradient(110deg, #050504 0%, #0c0a08 56%, #584438 100%);
		}

		:global(.home-header header > div) {
			height: 82px;
			padding-right: 20px;
			padding-left: 20px;
		}

		.home-hero,
		.hero-inner {
			min-height: auto;
		}

		.hero-inner {
			padding: 38px 20px 24px;
			background-image: none;
		}


		.hero-title {
			margin-top: 28px;
			font-size: clamp(62px, 19vw, 82px);
		}

		.hero-intro {
			margin-top: 31px;
		}

		.hero-actions {
			grid-template-columns: 1fr;
		}

		.hero-rating {
			justify-content: center;
		}

		.hero-stars,
		.hero-rating strong {
			margin-left: 0;
		}

		.hero-stars {
			margin-right: 18px;
		}

		.rating-divider {
			margin: 0 18px;
		}

		.hero-stats {
			margin-top: 46px;
			flex-direction: column;
		}

		.stats-numbers {
			width: 100%;
			grid-template-columns: repeat(2, 1fr);
			padding: 0;
		}

		.stat {
			min-height: 94px;
			padding: 18px 24px;
			border-bottom: 1px solid rgba(255, 255, 255, 0.14);
		}

		.stat:nth-child(2) {
			border-right: 0;
		}

		.stats-benefits {
			justify-content: space-between;
			gap: 12px;
			padding: 22px;
			font-size: 12px;
			white-space: normal;
		}
	}

	@media (max-width: 520px) {
		:global(.home-header header > div > a:first-child > span) {
			display: none !important;
		}





		.hero-title {
			font-size: clamp(57px, 18.5vw, 72px);
		}

		.hero-intro p:first-child {
			font-size: 17px;
		}

		.hero-intro p:last-child {
			font-size: 15px;
		}

		.hero-rating {
			font-size: 14px;
		}

		.hero-stars {
			margin-right: 12px;
		}

		.hero-stars :global(svg) {
			width: 15px;
		}

		.hero-rating strong {
			font-size: 15px;
		}

		.rating-divider {
			margin: 0 12px;
		}

	}
	.courses-showcase {
		padding: 84px 0 92px;
		background: #fbf1e7;
	}

	.courses-shell,
	.testimonials-shell {
		width: min(1320px, calc(100% - 48px));
		margin: 0 auto;
	}

	.courses-heading {
		display: flex;
		align-items: flex-end;
		justify-content: space-between;
		gap: 32px;
		margin-bottom: 42px;
	}

	.courses-kicker {
		display: block;
		margin-bottom: 10px;
		color: #a36c16;
		font-size: 12px;
		font-weight: 800;
		letter-spacing: 0.17em;
		text-transform: uppercase;
	}

	.courses-heading h2,
	.testimonials-heading h2 {
		margin: 0;
		font-family: Georgia, 'Times New Roman', serif;
		font-size: clamp(38px, 4vw, 58px);
		font-weight: 700;
		letter-spacing: -0.035em;
		line-height: 1.05;
	}

	.courses-heading p {
		max-width: 610px;
		margin: 14px 0 0;
		color: #70685f;
		font-size: 16px;
		line-height: 1.65;
	}

	.courses-count {
		flex: 0 0 auto;
		padding: 10px 16px;
		border: 1px solid rgba(23, 31, 62, 0.14);
		border-radius: 999px;
		background: rgba(255, 255, 255, 0.58);
		color: #18203c;
		font-size: 13px;
		font-weight: 750;
	}

	.courses-grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 30px;
	}

	.course-showcase-card {
		display: flex;
		min-width: 0;
		padding: 30px 30px 22px;
		border: 1px solid #dedfe3;
		border-radius: 22px;
		background: rgba(255, 255, 255, 0.94);
		box-shadow: 0 16px 40px rgba(54, 37, 23, 0.035);
		color: #172044;
		flex-direction: column;
		transition: transform 400ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow 400ms ease, border-color 400ms ease;
	}

	.course-showcase-card:hover {
		border-color: rgba(23, 32, 68, 0.25);
		box-shadow: 0 26px 56px rgba(54, 37, 23, 0.11);
		transform: translateY(-5px);
	}

	.course-showcase-card:focus-visible {
		outline: 3px solid #e6ae32;
		outline-offset: 4px;
	}

	.course-showcase-visual {
		position: relative;
		aspect-ratio: 1.18 / 1;
		overflow: hidden;
		border-radius: 18px;
		background: linear-gradient(135deg, #432475, #a995c8);
	}

	.course-showcase-visual img {
		display: block;
		width: 100%;
		height: 100%;
		object-fit: cover;
		transform: scale(1.001);
		transition: transform 900ms cubic-bezier(0.2, 0.72, 0.2, 1);
		will-change: transform;
	}

	.course-showcase-card:hover .course-showcase-visual img {
		transform: scale(1.085);
	}

	.course-showcase-placeholder {
		display: grid;
		width: 100%;
		height: 100%;
		place-items: center;
		color: rgba(255, 255, 255, 0.58);
	}

	.course-showcase-tint {
		position: absolute;
		inset: 0;
		pointer-events: none;
		background: linear-gradient(135deg, rgba(79, 38, 135, 0.08), rgba(17, 24, 54, 0.16));
		transition: opacity 500ms ease;
	}

	.course-showcase-card:hover .course-showcase-tint {
		opacity: 0.45;
	}

	.course-showcase-meta {
		display: flex;
		min-height: 78px;
		align-items: center;
		justify-content: space-between;
		gap: 22px;
		padding-top: 22px;
	}

	.course-showcase-copy {
		min-width: 0;
	}

	.course-showcase-copy h3 {
		margin: 0;
		color: #182044;
		font-size: clamp(20px, 1.7vw, 25px);
		font-weight: 750;
		letter-spacing: -0.035em;
		line-height: 1.25;
	}

	.course-showcase-copy h3 span {
		font-variant-numeric: tabular-nums;
	}

	.course-showcase-copy p {
		margin: 7px 0 0;
		color: #a66f16;
		font-size: 15px;
		font-weight: 800;
		letter-spacing: 0.01em;
	}

	.course-showcase-arrow {
		display: grid;
		width: 47px;
		height: 47px;
		flex: 0 0 47px;
		place-items: center;
		border-radius: 50%;
		background: #1d284e;
		color: #fff;
		transition: background-color 300ms ease, transform 300ms cubic-bezier(0.22, 1, 0.36, 1);
	}

	.course-showcase-arrow :global(svg) {
		transform: rotate(-45deg);
	}

	.course-showcase-card:hover .course-showcase-arrow {
		background: #e5aa2d;
		color: #14100a;
		transform: translate(2px, -2px) scale(1.04);
	}


	.ebooks-showcase {
		padding: 88px 0 96px;
		background: #11110f;
		color: #f7f2e9;
	}

	.ebooks-shell {
		width: min(1320px, calc(100% - 48px));
		margin: 0 auto;
	}

	.ebooks-heading {
		display: flex;
		align-items: flex-end;
		justify-content: space-between;
		gap: 32px;
		margin-bottom: 42px;
	}

	.ebooks-kicker {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		margin-bottom: 12px;
		color: #e4ad38;
		font-size: 12px;
		font-weight: 800;
		letter-spacing: 0.17em;
		text-transform: uppercase;
	}

	.ebooks-heading h2 {
		max-width: 650px;
		margin: 0;
		font-family: Georgia, 'Times New Roman', serif;
		font-size: clamp(38px, 4vw, 58px);
		font-weight: 700;
		letter-spacing: -0.035em;
		line-height: 1.05;
	}

	.ebooks-heading p {
		margin: 14px 0 0;
		color: rgba(247, 242, 233, 0.58);
		font-size: 16px;
		line-height: 1.65;
	}

	.ebooks-count {
		flex: 0 0 auto;
		padding: 10px 16px;
		border: 1px solid rgba(228, 173, 56, 0.36);
		color: #e8c36d;
		font-size: 13px;
		font-weight: 750;
	}

	.ebooks-grid {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 24px;
	}

	.ebook-showcase-card {
		display: flex;
		min-width: 0;
		padding: 14px;
		flex-direction: column;
		border: 1px solid rgba(255, 255, 255, 0.14);
		background: #1a1916;
		color: #fff;
		transition: border-color 300ms ease, transform 300ms cubic-bezier(0.22, 1, 0.36, 1), background-color 300ms ease;
	}

	.ebook-showcase-card:hover {
		border-color: rgba(228, 173, 56, 0.72);
		background: #211e18;
		transform: translateY(-5px);
	}

	.ebook-showcase-visual {
		position: relative;
		aspect-ratio: 1 / 1.18;
		overflow: hidden;
		background: #29251f;
	}

	.ebook-showcase-visual img {
		display: block;
		width: 100%;
		height: 100%;
		object-fit: cover;
		transition: transform 800ms cubic-bezier(0.22, 1, 0.36, 1);
	}

	.ebook-showcase-card:hover .ebook-showcase-visual img {
		transform: scale(1.055);
	}

	.ebook-showcase-overlay {
		position: absolute;
		inset: 0;
		background: linear-gradient(180deg, rgba(5, 5, 4, 0.18), transparent 42%, rgba(5, 5, 4, 0.78));
		pointer-events: none;
	}

	.ebook-format,
	.ebook-number {
		position: absolute;
		top: 14px;
		font-size: 10px;
		font-weight: 800;
		letter-spacing: 0.14em;
		text-transform: uppercase;
	}

	.ebook-format {
		left: 14px;
		color: #f7f2e9;
	}

	.ebook-number {
		right: 14px;
		color: #e4ad38;
	}

	.ebook-view {
		position: absolute;
		bottom: 14px;
		left: 14px;
		display: inline-flex;
		align-items: center;
		gap: 7px;
		color: #fff;
		font-size: 12px;
		font-weight: 750;
		opacity: 0;
		transform: translateY(8px);
		transition: opacity 260ms ease, transform 260ms ease;
	}

	.ebook-showcase-card:hover .ebook-view {
		opacity: 1;
		transform: translateY(0);
	}

	.ebook-placeholder {
		display: flex;
		height: 100%;
		align-items: center;
		justify-content: center;
		gap: 12px;
		flex-direction: column;
		background: linear-gradient(135deg, #27231d, #51412c);
		color: rgba(255, 255, 255, 0.62);
	}

	.ebook-placeholder span {
		font-size: 11px;
		font-weight: 800;
		letter-spacing: 0.2em;
	}

	.ebook-showcase-meta {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 16px;
		padding: 20px 4px 5px;
	}

	.ebook-showcase-meta h3 {
		margin: 0;
		color: #fff;
		font-size: 17px;
		font-weight: 750;
		line-height: 1.3;
	}

	.ebook-showcase-meta p {
		margin: 7px 0 0;
		color: #e4ad38;
		font-size: 13px;
		font-weight: 800;
	}

	.ebook-arrow {
		display: grid;
		width: 40px;
		height: 40px;
		flex: 0 0 auto;
		place-items: center;
		border: 1px solid rgba(255, 255, 255, 0.22);
		color: #fff;
		transition: background-color 220ms ease, color 220ms ease, transform 220ms ease;
	}

	.ebook-arrow :global(svg) {
		transform: rotate(-45deg);
	}

	.ebook-showcase-card:hover .ebook-arrow {
		border-color: #e4ad38;
		background: #e4ad38;
		color: #17130d;
		transform: translate(2px, -2px);
	}

	.testimonials-section {
		padding: 92px 0 100px;
		border-top: 1px solid #e3d9ca;
		border-bottom: 1px solid #e3d9ca;
		background: #f7f1e8;
		color: #171713;
	}

	.testimonials-heading {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		text-align: center;
		gap: 16px;
		margin-bottom: 46px;
	}

	.testimonials-heading h2 {
		color: #171713;
		font-size: clamp(32px, 4vw, 44px);
		font-weight: 900;
		letter-spacing: -0.02em;
		text-align: center;
		margin: 0;
	}

	@media (max-width: 760px) {
		.course-showcase-meta {
			padding-top: 18px;
		}
	}
</style>
