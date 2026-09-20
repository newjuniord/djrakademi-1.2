<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
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
		AlertCircle
	} from 'lucide-svelte';

	import { authState } from '$lib/auth.svelte';
	import { verifyLemonSqueezyEmail, verifyPlopplopReference } from '$lib/services/payments';

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
			toast.error('Ou dwe konekte sou kont ou pou w ka verifye yon peman.');
			return;
		}

		supportLoading = true;

		try {
			if (supportMethod === 'carte') {
				const email = supportEmail.trim();
				if (!email || !email.includes('@')) {
					toast.error('Tanpri antre yon adres imel ki valab.');
					supportLoading = false;
					return;
				}

				const resData = await verifyLemonSqueezyEmail(email);

				if (resData.ok && resData.success) {
					const targetUrl = resData.courseId ? `/learn/${resData.courseId}` : '/dashboard';
					supportSuccessMessage = 'Peman pa kat ou a verifye avèk siksè! N ap redirije w pou w kòmanse gade fòmasyon an...';
					toast.success('Aksè debloke ak siksè ! Redirèksyon en kous...');
					setTimeout(() => {
						goto(targetUrl);
					}, 1000);
				} else {
					supportErrorMessage = resData.message || `Nou pa jwenn okenn peman konfime sou Lemon Squeezy pou imel "${email}".`;
					toast.error('Erè nan verifikasyon an.');
				}
			} else {
				const ref = supportReference.trim();
				if (!ref) {
					toast.error('Tanpri antre nimewo referans tranzaksyon an.');
					supportLoading = false;
					return;
				}

				const resData = await verifyPlopplopReference(ref);

				if (resData.ok && resData.success) {
					const targetUrl = resData.courseId ? `/learn/${resData.courseId}` : '/dashboard';
					supportSuccessMessage = 'Peman verifye avèk siksè! N ap redirije w pou w kòmanse gade fòmasyon an...';
					toast.success('Aksè debloke ak siksè ! Redirèksyon en kous...');
					setTimeout(() => {
						goto(targetUrl);
					}, 1000);
				} else {
					supportErrorMessage = resData.message || `Nou pa jwenn okenn peman valide pou referans "${ref}".`;
					toast.error('Erè nan verifikasyon an.');
				}
			}
		} catch (error) {
			console.error('Support error:', error);
			supportErrorMessage = 'Yon erè rive pandan verifikasyon an. Tanpri kontakte nou dirèkteman.';
			toast.error('Erè nan verifikasyon an.');
		} finally {
			supportLoading = false;
		}
	}
</script>

<svelte:head>
	<title>DJR Akademi · Formations, Ebooks & Coaching en ligne</title>
	<meta
		name="description"
		content="Accédez à nos formations vidéo, ebooks PDF et séances de coaching individuel. Développez vos compétences dès aujourd'hui avec DJR Akademi."
	/>
</svelte:head>

<div class="min-h-screen bg-white flex flex-col font-sans text-zinc-900">
	<div class="home-hero-shell">
		<div class="home-header">
			<PublicHeader />
		</div>

		<section class="home-hero" aria-labelledby="home-hero-title">
			<div class="hero-inner">
				<div class="hero-copy">
					<div class="hero-badge"><span aria-hidden="true"></span>Platfòm fòmasyon sou entènèt</div>

					<h1 id="home-hero-title" class="hero-title">
						<span>Aprann.</span>
						<span class="hero-title-accent">Avanse.</span>
						<span>Reyisi.</span>
					</h1>

					<div class="hero-intro">
						<p>Aprann sèvi ak entelijans atifisyèl pou w ka sispann razè.</p>
						<p>DJR Akademi se pou Ayisyen ki pa vle rete dèyè nan epòk entelijans atifisyèl la.</p>
					</div>

					<div class="hero-actions">
						<a href="#courses" class="hero-primary">
							<Play size={16} fill="currentColor" />
							Gade fòmasyon yo
						</a>
						<a href="#coaching" class="hero-secondary">Rezève yon coaching</a>
					</div>

					<div class="hero-rating" aria-label="Evalyasyon 4.9 sou 5, plis pase 600 etidyan">
						<div class="hero-stars" aria-hidden="true">
							{#each [1, 2, 3, 4, 5] as star}
								<Star size={19} fill="currentColor" />
							{/each}
						</div>
						<strong>4.9/5</strong>
						<span class="rating-divider" aria-hidden="true"></span>
						<span>600+ etidyan</span>
					</div>
				</div>


				<div class="hero-stats">
					<div class="stats-numbers">
						<div class="stat"><strong>1</strong><span>Fòmasyon</span></div>
						<div class="stat"><strong>2</strong><span>Ebook PDF</span></div>
						<div class="stat"><strong>600+</strong><span>Etidyan</span></div>
						<div class="stat"><strong>4.9<small>/5</small></strong><span>Evalyasyon</span></div>
					</div>
					<div class="stats-benefits">
						<span>100% sou entènèt</span>
						<span>Aksè imedyat</span>
						<span>Sipò dirèk</span>
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
						<span class="courses-kicker">Fòmasyon</span>
						<h2>Pwogram videyo</h2>
						<p>Fòmasyon konplè epi byen ranje pou w ka mèt sou nouvèl konpetans.</p>
					</div>
					<span class="courses-count">{publishedCourses.length} disponib</span>
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
											Gratis
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
						<span class="ebooks-kicker"><FileText size={14} /> Bibliyotèk DJR</span>
						<h2 id="ebooks-title">Gid ki mete konesans nan men w.</h2>
						<p>Resous pratik pou w li, aplike epi grandi nan ritm pa w.</p>
					</div>
					<span class="ebooks-count">{publishedEbooks.length} gid disponib</span>
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
								<span class="ebook-format">PDF · GID</span>
								<span class="ebook-number">{String(index + 1).padStart(2, '0')}</span>
								<span class="ebook-view">Li gid la <ArrowRight size={14} /></span>
							</div>
							<div class="ebook-showcase-meta">
								<div>
									<h3>{ebook.title}</h3>
									<p>{ebook.isFree || ebook.price === 0 ? 'Gratis' : formatPublicPrice(ebook.price, ebook.priceUsd)}</p>
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
					<div class="mb-8 flex flex-wrap items-end justify-between gap-5"><div><span class="text-xs font-black uppercase tracking-widest text-amber-700">Plis ansanm</span><h2 id="home-bundles-title" class="mt-2 text-3xl font-black tracking-tight text-zinc-950">Bundles fòmasyon + e-books</h2><p class="mt-2 max-w-2xl text-sm text-zinc-600">Yon sèl pak pou jwenn resous ki mache ansanm, ak yon pri espesyal.</p></div><a href="/bundles" class="inline-flex items-center gap-2 text-sm font-black text-zinc-950 hover:text-amber-700">Gade tout bundles yo <ArrowRight size={17} /></a></div>
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
							<span class="text-xs font-bold text-zinc-400 uppercase tracking-widest">Coaching</span>
						</div>
						<h2 class="text-3xl sm:text-4xl font-black text-zinc-950 tracking-tight">
							Sesyon endividyèl
						</h2>
						<p class="text-zinc-500 text-sm mt-2 max-w-lg">
							Yon swivi pèsonalize dirèkteman ak pwofesè a pou w ale pi lwen.
						</p>
					</div>
					<span class="self-start sm:self-auto px-3.5 py-1.5 bg-zinc-100 text-zinc-600 text-xs font-bold rounded-full">
						{activeCoaching.length} sèvis aktif
					</span>
				</div>

				<!-- Coaching Cards -->
				<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
					{#each activeCoaching as coaching (coaching.id)}
						<a
							href="/coaching/{coaching.slug}"
							class="group text-left flex flex-col p-8 bg-zinc-50 rounded-2xl border border-zinc-200/80 hover:border-zinc-300 hover:bg-white hover:shadow-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-zinc-950"
						>
							<!-- Icon -->
							<div class="size-12 bg-zinc-950 text-amber-400 rounded-xl grid place-items-center mb-6 shadow-sm group-hover:scale-105 transition-transform">
								<CalendarCheck size={22} />
							</div>

							<!-- Title -->
							<h3 class="font-black text-lg text-zinc-950 group-hover:text-amber-600 transition-colors leading-snug mb-2">
								{coaching.title}
							</h3>

							<p class="text-zinc-500 text-xs leading-relaxed line-clamp-3 flex-1">
								{coaching.description}
							</p>

							<!-- Duration & Price -->
							<div class="mt-6 pt-5 border-t border-zinc-200/60 flex items-center justify-between">
								<span class="text-xs text-zinc-500 font-medium flex items-center gap-1.5">
									<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg>
									{coaching.durationMinutes} min
								</span>
								<div class="text-right">
									{#if coaching.isFree || coaching.price === 0}
										<span class="font-black text-lg text-emerald-600">Gratis</span>
									{:else}
										<div>
											<span class="font-black text-xl text-zinc-950">{formatPublicPrice(coaching.price, coaching.priceUsd)}</span>
										</div>
									{/if}
								</div>
							</div>

							<!-- CTA Arrow -->
							<div class="mt-4 flex items-center gap-2 text-xs font-bold text-zinc-950 group-hover:gap-3 transition-all">
								<span>Rezeve yon sesyon</span>
								<ArrowRight size={14} />
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
								Sipò & Pwoblèm aksè
							</div>
							<h2 class="text-3xl sm:text-4xl font-black tracking-tight leading-tight">
								Ou peye epi w pa jwenn aksè ?
							</h2>
							<p class="text-white/60 text-sm leading-relaxed max-w-xl">
								Si ou te peye deja sou lòt sit la epi ou pa jwenn kou an, mete imèl ou anba a epi n ap verifye tranzaksyon w lan imedyatman.
							</p>
						</div>

						<!-- Payment Method Selector Tabs -->
						<div class="space-y-3">
							<span class="text-xs font-bold text-white/50 uppercase tracking-widest block">Chwazi kijan w te peye :</span>
							<div class="grid grid-cols-2 gap-2 p-1.5 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md">
								<button
									type="button"
									onclick={() => { supportMethod = 'carte'; supportSuccessMessage = null; supportErrorMessage = null; }}
									class="flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl font-bold text-xs transition-all duration-200 cursor-pointer {supportMethod === 'carte' ? 'bg-amber-400 text-black shadow-lg shadow-amber-400/20' : 'text-white/70 hover:text-white hover:bg-white/5'}"
								>
									<CreditCard size={16} />
									<span>Kat bancaire</span>
								</button>
								<button
									type="button"
									onclick={() => { supportMethod = 'mobile'; supportSuccessMessage = null; supportErrorMessage = null; }}
									class="flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl font-bold text-xs transition-all duration-200 cursor-pointer {supportMethod === 'mobile' ? 'bg-amber-400 text-black shadow-lg shadow-amber-400/20' : 'text-white/70 hover:text-white hover:bg-white/5'}"
								>
									<Smartphone size={16} />
									<span>MonCash / Natcash</span>
								</button>
							</div>
						</div>

						<!-- Verification Form Card -->
						<form onsubmit={handleSupportSubmit} class="p-6 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-xl space-y-5">
							{#if supportMethod === 'carte'}
								<!-- Lemon Squeezy Card Email Input -->
								<div class="space-y-2">
									<label for="support-card-email" class="block text-xs font-bold text-white/90">
										Imel kont ou a (menm ak sa ou te itilize sou Lemon Squeezy) *
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
										Pou sekirite, itilize imel kont ou a : {authState.user?.email || "konekte pou wè imel ou"}.
									</p>
								</div>
							{:else}
								<!-- MonCash / Natcash Reference Input -->
								<div class="space-y-2">
									<label for="support-ref" class="block text-xs font-bold text-white/90">
										Nimewo referans tranzaksyon MonCash / Natcash an *
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
										Antre nimewo referans ki sou mesaj konfimasyon MonCash / Natcash ou an.
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
									<span>N ap verifye...</span>
								{:else}
									<Send size={15} />
									<span>Verifye ak debloke aksè mwen</span>
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
					<div>
						<span>Temwayaj</span>
						<h2 id="testimonials-title">Eksperyans ki pale poukont yo.</h2>
						<p>De etidyan pataje kijan fòmasyon DJR Akademi ede yo pase soti nan aprann rive nan aksyon.</p>
					</div>
					<div class="testimonials-score" aria-label="Evalyasyon mwayèn 4.9 sou 5">
						<strong>4.9</strong>
						<div><span aria-hidden="true">★★★★★</span><small>600+ evalyasyon</small></div>
					</div>
				</div>

				<div class="testimonials-grid">
					<article class="testimonial-card">
						<div class="testimonial-card-top"><span class="testimonial-stars" aria-label="5 sou 5">★★★★★</span><span class="testimonial-index">01</span></div>
						<blockquote>Fòmasyon yo klè, byen òganize epi fasil pou suiv. Mwen te kapab aplike sa mwen aprann yo nan travay mwen depi premye semèn nan.</blockquote>
						<footer class="testimonial-author">
							<span class="testimonial-avatar">MJ</span>
							<div class="testimonial-identity"><strong>Mikaëlle Joseph</strong><span>Etidyan DJR Akademi</span></div>
							<span class="testimonial-verified"><CheckCircle2 size={14} /> Etidyan verifye</span>
						</footer>
					</article>

					<article class="testimonial-card">
						<div class="testimonial-card-top"><span class="testimonial-stars" aria-label="5 sou 5">★★★★★</span><span class="testimonial-index">02</span></div>
						<blockquote>Eksplikasyon yo ale dwat nan pwen an. Platfòm nan ede m konprann zouti entelijans atifisyèl yo epi sèvi avè yo ak plis konfyans chak jou.</blockquote>
						<footer class="testimonial-author">
							<span class="testimonial-avatar">DP</span>
							<div class="testimonial-identity"><strong>David Pierre</strong><span>Etidyan DJR Akademi</span></div>
							<span class="testimonial-verified"><CheckCircle2 size={14} /> Etidyan verifye</span>
						</footer>
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

	:global(.home-header header button[aria-label='Èd ak Asistans']) {
		display: none;
	}

	:global(.home-header header button[aria-label='Kreye yon kont']),
	:global(.home-header header button[aria-label='Konekte']),
	:global(.home-header header button[aria-label='Ouvri meni espas mwen']) {
		height: 48px;
		gap: 10px;
		padding: 0 22px;
		border: 0;
		border-radius: 0;
		font-size: 15px !important;
		font-weight: 600;
		box-shadow: none;
	}

	:global(.home-header header button[aria-label='Kreye yon kont']),
	:global(.home-header header button[aria-label='Ouvri meni espas mwen']) {
		background: rgba(2, 2, 2, 0.92) !important;
		color: #fff !important;
	}

	:global(.home-header header button[aria-label='Konekte']) {
		background: #f0b92f !important;
		color: #090806 !important;
	}

	:global(.home-header header button[aria-label='Kreye yon kont']::before),
	:global(.home-header header button[aria-label='Konekte']::before) {
		width: 17px;
		height: 17px;
		content: '';
		background: currentColor;
		-webkit-mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='%23000' d='M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm0 2c-4.42 0-8 2.24-8 5v1h16v-1c0-2.76-3.58-5-8-5Z'/%3E%3C/svg%3E") center / contain no-repeat;
		mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='%23000' d='M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm0 2c-4.42 0-8 2.24-8 5v1h16v-1c0-2.76-3.58-5-8-5Z'/%3E%3C/svg%3E") center / contain no-repeat;
	}

	:global(.home-header header button[aria-label='Konekte'] span) {
		font-size: 0;
	}

	:global(.home-header header button[aria-label='Konekte'] span::after) {
		content: 'Konekte';
		font-size: 15px;
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

	.hero-badge {
		display: inline-flex;
		height: 35px;
		align-items: center;
		gap: 11px;
		padding: 0 15px;
		border: 1px solid rgba(221, 164, 18, 0.47);
		background: rgba(4, 4, 3, 0.34);
		color: rgba(255, 255, 255, 0.86);
		font-size: 14px;
		font-weight: 500;
		letter-spacing: 0.01em;
	}

	.hero-badge span {
		width: 6px;
		height: 6px;
		background: #25e2b3;
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

	.stat strong small {
		margin-left: 3px;
		font-family: ui-sans-serif, system-ui, sans-serif;
		font-size: 13px;
		font-weight: 500;
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

		:global(.home-header header button[aria-label='Kreye yon kont']),
		:global(.home-header header button[aria-label='Konekte']) {
			width: 43px;
			height: 43px;
			justify-content: center;
			padding: 0;
		}

		:global(.home-header header button[aria-label='Kreye yon kont'] span),
		:global(.home-header header button[aria-label='Konekte'] span) {
			display: none;
		}

		.hero-badge {
			font-size: 12px;
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
		align-items: flex-end;
		justify-content: space-between;
		gap: 40px;
		margin-bottom: 46px;
	}

	.testimonials-heading > div:first-child {
		max-width: 700px;
	}

	.testimonials-heading > div:first-child > span {
		display: block;
		margin-bottom: 10px;
		color: #a36c16;
		font-size: 12px;
		font-weight: 800;
		letter-spacing: 0.17em;
		text-transform: uppercase;
	}

	.testimonials-heading h2 {
		color: #171713;
	}

	.testimonials-heading p {
		max-width: 620px;
		margin: 15px 0 0;
		color: #70685f;
		font-size: 16px;
		line-height: 1.65;
	}

	.testimonials-score {
		display: flex;
		min-width: 215px;
		align-items: center;
		gap: 17px;
		padding: 17px 20px;
		border: 1px solid #ddd1c1;
		border-radius: 16px;
		background: rgba(255, 255, 255, 0.7);
	}

	.testimonials-score > strong {
		color: #171713;
		font-family: Georgia, 'Times New Roman', serif;
		font-size: 40px;
		line-height: 1;
	}

	.testimonials-score > div {
		display: flex;
		flex-direction: column;
	}

	.testimonials-score div span {
		color: #d99a20;
		font-size: 14px;
		letter-spacing: 0.08em;
	}

	.testimonials-score small {
		margin-top: 5px;
		color: #756e65;
		font-size: 11px;
		font-weight: 700;
		white-space: nowrap;
	}

	.testimonials-grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 24px;
	}

	.testimonial-card {
		position: relative;
		display: flex;
		min-height: 340px;
		overflow: hidden;
		padding: 36px;
		border: 1px solid #ded8cf;
		border-radius: 20px;
		background: rgba(255, 255, 255, 0.92);
		box-shadow: 0 16px 44px rgba(58, 43, 26, 0.055);
		flex-direction: column;
		transition: border-color 350ms ease, transform 350ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow 350ms ease;
	}

	.testimonial-card::after {
		position: absolute;
		top: 12px;
		right: 28px;
		content: '“';
		color: rgba(224, 164, 43, 0.12);
		font-family: Georgia, 'Times New Roman', serif;
		font-size: 130px;
		line-height: 1;
		pointer-events: none;
	}

	.testimonial-card:hover {
		border-color: rgba(188, 133, 26, 0.48);
		box-shadow: 0 24px 58px rgba(58, 43, 26, 0.1);
		transform: translateY(-4px);
	}

	.testimonial-card-top {
		position: relative;
		z-index: 1;
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.testimonial-stars {
		color: #d99a20;
		font-size: 15px;
		letter-spacing: 0.1em;
	}

	.testimonial-index {
		color: #a79d90;
		font-size: 12px;
		font-weight: 800;
		letter-spacing: 0.12em;
	}

	.testimonial-card blockquote {
		position: relative;
		z-index: 1;
		max-width: 570px;
		margin: 31px 0 38px;
		color: #27251f;
		font-family: Georgia, 'Times New Roman', serif;
		font-size: clamp(20px, 1.65vw, 25px);
		line-height: 1.55;
	}

	.testimonial-author {
		position: relative;
		z-index: 1;
		display: flex;
		align-items: center;
		gap: 14px;
		margin-top: auto;
		padding-top: 22px;
		border-top: 1px solid #ebe4da;
	}

	.testimonial-avatar {
		display: grid;
		width: 48px;
		height: 48px;
		flex: 0 0 48px;
		place-items: center;
		border-radius: 50%;
		background: #182044;
		color: #fff;
		font-size: 12px;
		font-weight: 850;
		letter-spacing: 0.05em;
	}

	.testimonial-identity {
		display: flex;
		min-width: 0;
		flex-direction: column;
	}

	.testimonial-author strong {
		color: #1d1c18;
		font-size: 15px;
		font-weight: 800;
	}

	.testimonial-identity > span {
		margin-top: 4px;
		color: #81796f;
		font-size: 12px;
	}

	.testimonial-verified {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		margin-left: auto;
		padding: 7px 10px;
		border-radius: 999px;
		background: #edf6ec;
		color: #39723c;
		font-size: 11px;
		font-weight: 800;
		white-space: nowrap;
	}

	@media (max-width: 760px) {
		.ebooks-showcase {
			padding: 62px 0;
		}

		.ebooks-shell {
			width: min(100% - 32px, 1320px);
		}

		.ebooks-heading {
			align-items: flex-start;
			flex-direction: column;
		}

		.ebooks-grid {
			grid-template-columns: 1fr;
		}

		.ebook-showcase-card {
			padding: 12px;
		}

		.ebook-showcase-visual {
			aspect-ratio: 1 / 1.05;
		}

		.ebook-view {
			opacity: 1;
			transform: none;
		}

		.courses-showcase,
		.testimonials-section {
			padding: 62px 0;
		}

		.courses-shell,
		.testimonials-shell {
			width: min(100% - 32px, 1320px);
		}

		.courses-heading,
		.testimonials-heading {
			align-items: flex-start;
			flex-direction: column;
		}

		.courses-grid,
		.testimonials-grid {
			grid-template-columns: 1fr;
		}

		.course-showcase-card {
			padding: 18px 18px 17px;
			border-radius: 18px;
		}

		.course-showcase-visual {
			aspect-ratio: 1.25 / 1;
			border-radius: 14px;
		}

		.course-showcase-meta {
			padding-top: 18px;
		}
		.testimonials-score {
			width: 100%;
			justify-content: center;
		}

		.testimonial-author {
			align-items: flex-start;
			flex-wrap: wrap;
		}

		.testimonial-verified {
			margin-left: 62px;
		}


		.testimonial-card {
			min-height: 270px;
			padding: 28px;
		}
	}
</style>
