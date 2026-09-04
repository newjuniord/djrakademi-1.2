<script lang="ts">
	import { onMount } from 'svelte';
	import PublicHeader from '$lib/components/PublicHeader.svelte';
	import PublicFooter from '$lib/components/PublicFooter.svelte';

	import { getPublishedCourses } from '$lib/services/courses';
	import { getPublishedEbooks } from '$lib/services/ebooks';
	import { getActiveCoachingServices } from '$lib/services/coaching';
	import type { Course, Ebook } from '$lib/types/admin';
	import type { CoachingService } from '$lib/types/coaching';
	import { toast } from '$lib/toast.svelte';

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
					supportSuccessMessage = resData.message || 'Peman pa kat ou a verifye avèk siksè! Aksè a debloke sou kont ou.';
					toast.success('Peman pa kat verifye ak siksè !');
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
					supportSuccessMessage = resData.message || `Peman MonCash / Natcash (${ref}) verifye ak siksè !`;
					toast.success('Peman MonCash / Natcash verifye ak siksè !');
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
	<PublicHeader />

	<main class="flex-1">

		<!-- ═══════════════════════════════════════════════════
		     HERO — Plein écran immersif avec fond sombre
		     ═══════════════════════════════════════════════════ -->
		<section class="relative bg-zinc-950 text-white overflow-hidden min-h-[85vh] flex items-center">
			<!-- Glow Background Effects -->
			<div class="absolute inset-0 pointer-events-none">
				<div class="absolute top-0 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl"></div>
				<div class="absolute bottom-0 right-1/4 w-80 h-80 bg-orange-600/8 rounded-full blur-3xl"></div>
			</div>

			<!-- Subtle Grid Pattern -->
			<div
				class="absolute inset-0 opacity-[0.03]"
				style="background-image: linear-gradient(rgba(255,255,255,.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.3) 1px, transparent 1px); background-size: 40px 40px;"
			></div>

			<div class="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center w-full">

				<!-- Left: Content -->
				<div class="space-y-8">
					<!-- Category Pill -->
					<div class="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full text-xs font-semibold text-white/70 backdrop-blur-sm">
						<span class="size-2 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
						Platfòm fòmasyon sou entènèt · DJR Akademi
					</div>

					<!-- Headline -->
					<h1 class="text-4xl sm:text-5xl lg:text-6xl font-black leading-[1.08] tracking-tight">
						Aprann.<br />
						<span class="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400">
							Avanse.
						</span><br />
						Reyisi.
					</h1>

					<!-- Subtitle -->
					<p class="text-base sm:text-lg text-amber-300 font-bold leading-relaxed max-w-lg">
						Aprann sèvi ak IA pou w ka sispann razè.
						<span class="block text-sm text-white/70 font-normal mt-1">
							DJR Akademi se pou Ayisyen ki pa vle rete dèyè nan epòk AI a.
						</span>
					</p>

					<!-- Stats Row -->
					<div class="flex flex-wrap items-center gap-6 py-4 border-y border-white/10">
						<div>
							<span class="text-2xl font-black text-white">{publishedCourses.length}</span>
							<span class="block text-xs text-white/50 font-medium mt-0.5">Fòmasyon</span>
						</div>
						<div class="w-px h-8 bg-white/10"></div>
						<div>
							<span class="text-2xl font-black text-white">{publishedEbooks.length}</span>
							<span class="block text-xs text-white/50 font-medium mt-0.5">Ebook PDF</span>
						</div>
						<div class="w-px h-8 bg-white/10"></div>
						<div>
							<span class="text-2xl font-black text-white">480+</span>
							<span class="block text-xs text-white/50 font-medium mt-0.5">Etidyan</span>
						</div>
						<div class="w-px h-8 bg-white/10"></div>
						<div class="flex items-center gap-1">
							<Star size={14} class="text-amber-400 fill-amber-400" />
							<span class="text-2xl font-black text-white">4.9</span>
							<span class="block text-xs text-white/50 font-medium ml-1 mt-0.5">/5</span>
						</div>
					</div>

					<!-- CTA Buttons -->
					<div class="flex flex-col sm:flex-row gap-3">
						<a
							href="#courses"
							class="inline-flex items-center justify-center gap-2 h-13 px-8 bg-amber-400 hover:bg-amber-300 text-black font-black text-sm rounded-xl transition-colors shadow-lg shadow-amber-500/20"
						>
							<Play size={16} class="fill-black" />
							Gade fòmasyon yo
						</a>
						<a
							href="#coaching"
							class="inline-flex items-center justify-center gap-2 h-13 px-8 bg-white/10 hover:bg-white/15 text-white border border-white/15 font-bold text-sm rounded-xl transition-colors backdrop-blur-sm"
						>
							<CalendarCheck size={16} />
							Rezeve yon coaching
						</a>
					</div>

					<!-- Trust Badges -->
					<div class="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-medium text-white/40">
						<span class="flex items-center gap-1.5"><CheckCircle2 size={14} class="text-emerald-400" /> 100% sou entènèt</span>
						<span class="flex items-center gap-1.5"><CheckCircle2 size={14} class="text-emerald-400" /> Aksè imedyat</span>
						<span class="flex items-center gap-1.5"><CheckCircle2 size={14} class="text-emerald-400" /> Sipò dirèk</span>
					</div>
				</div>

				<!-- Right: Professor Visual -->
				<div class="hidden lg:flex flex-col gap-4 items-end">
					<div class="relative w-full max-w-sm ml-auto">
						<!-- Main photo card -->
						<div class="relative overflow-hidden bg-zinc-800 border border-white/10 rounded-2xl shadow-2xl">
							<img
								src="/professor_hero.jpg"
								alt="Pwofesè & Fondatè DJR Akademi"
								class="w-full h-[480px] object-cover object-top"
							/>
							<!-- Bottom overlay -->
							<div class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-zinc-950 via-zinc-950/70 to-transparent p-6">
								<div class="flex items-center justify-between">
									<div>
										<img src="/logo.png" alt="DJR Akademi" class="h-7 w-auto object-contain mb-1.5" />
										<p class="text-white/60 text-xs font-medium">Pwofesè & Fondatè</p>
										<a href="/contact" class="text-amber-400 text-xs font-bold hover:text-amber-300 transition-colors">
											Fòm kontak
										</a>
									</div>
									<div class="flex flex-col items-end gap-1">
										<span class="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-wide rounded-md">
											Disponib
										</span>
									</div>
								</div>
							</div>
						</div>

						<!-- Floating card: Rating -->
						<div class="absolute -top-4 -left-8 bg-white text-black px-4 py-3 shadow-2xl rounded-xl border border-zinc-100">
							<div class="flex items-center gap-2">
								<div class="flex gap-0.5">
									{#each [1,2,3,4,5] as s}
										<Star size={12} class="text-amber-400 fill-amber-400" />
									{/each}
								</div>
								<span class="font-black text-sm">4.9/5</span>
							</div>
							<p class="text-[11px] text-zinc-500 mt-0.5 font-medium">480+ etidyan ki kontan</p>
						</div>
					</div>
				</div>

			</div>
		</section>

		<!-- ═══════════════════════════════════════════════════
		     SECTION: FORMATIONS
		     ═══════════════════════════════════════════════════ -->
		<section id="courses" class="py-20 bg-white scroll-mt-20">
			<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

				<!-- Section Header -->
				<div class="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
					<div>
						<div class="flex items-center gap-2 mb-3">
							<div class="size-8 bg-zinc-950 text-white grid place-items-center rounded-lg">
								<BookOpen size={16} />
							</div>
							<span class="text-xs font-bold text-zinc-400 uppercase tracking-widest">Fòmasyon</span>
						</div>
						<h2 class="text-3xl sm:text-4xl font-black text-zinc-950 tracking-tight">
							Pwogram videyo
						</h2>
						<p class="text-zinc-500 text-sm mt-2 max-w-lg">
							Fòmasyon konplè epi byen ranje pou w ka mèt sou nouvèl konpetans.
						</p>
					</div>
					<span class="self-start sm:self-auto px-3.5 py-1.5 bg-zinc-100 text-zinc-600 text-xs font-bold rounded-full">
						{publishedCourses.length} disponib
					</span>
				</div>

				<!-- Courses Grid — Premium cards -->
				<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
					{#each publishedCourses as course (course.id)}
						<a
							href="/cours/{course.id}"
							class="group text-left flex flex-col bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl border border-zinc-100 hover:border-zinc-200 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:ring-offset-2"
						>
							<!-- Cover Image -->
							<div class="relative aspect-video overflow-hidden bg-zinc-100 shrink-0">
								{#if course.cover}
									<img
										src={course.cover}
										alt={course.title}
										class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
										loading="lazy"
									/>
								{:else}
									<div class="w-full h-full flex items-center justify-center bg-zinc-100">
										<BookOpen size={32} class="text-zinc-300" />
									</div>
								{/if}

								<!-- Gradient overlay -->
								<div class="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>

								<!-- Price Badge -->
								<div class="absolute bottom-3 left-3">
									{#if course.isFree || course.price === 0}
										<span class="px-3 py-1 bg-emerald-500 text-white text-[11px] font-black uppercase tracking-wide rounded-full shadow-md">
											Gratis
										</span>
									{:else}
										<span class="px-3 py-1 bg-white/90 backdrop-blur-sm text-zinc-950 text-[11px] font-black rounded-full shadow-md">
											{course.price.toLocaleString('fr-FR')} HTG {#if course.priceUsd && course.priceUsd > 0}(${course.priceUsd} USD){/if}
										</span>
									{/if}
								</div>

								<!-- Play button overlay -->
								<div class="absolute inset-0 flex items-center justify-center">
									<div class="size-14 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/30 opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100 transition-all duration-300 shadow-lg">
										<Play size={20} class="text-white fill-white ml-1" />
									</div>
								</div>
							</div>

							<!-- Card Body -->
							<div class="p-5 flex flex-col flex-1 gap-3">
								<h3 class="font-black text-sm text-zinc-950 group-hover:text-amber-600 transition-colors line-clamp-2 leading-snug">
									{course.title}
								</h3>
								<p class="text-xs text-zinc-400 line-clamp-2 leading-relaxed flex-1">
									{course.description}
								</p>

								<!-- Footer Row -->
								<div class="flex items-center justify-end pt-3 border-t border-zinc-100 mt-auto">
									<span class="inline-flex items-center gap-1.5 text-[11px] font-bold text-zinc-950 bg-zinc-100 group-hover:bg-zinc-950 group-hover:text-white px-3 py-1.5 rounded-full transition-all duration-200">
										Gade
										<ArrowRight size={11} />
									</span>
								</div>
							</div>
						</a>
					{/each}
				</div>
			</div>
		</section>

		<!-- ═══════════════════════════════════════════════════
		     DIVIDER — CTA coaching
		     ═══════════════════════════════════════════════════ -->
		<div class="bg-amber-400 py-8">
			<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
				<div>
					<p class="font-black text-black text-lg sm:text-xl tracking-tight">Ou bezwen yon swivi pèsonalize ?</p>
					<p class="text-black/70 text-sm font-medium mt-0.5">Sesyon 1-ak-1 disponib pou w ka avanse pi vit.</p>
				</div>
				<a
					href="#coaching"
					class="shrink-0 inline-flex items-center gap-2 px-8 py-3 bg-black text-white font-bold text-xs rounded-xl hover:bg-zinc-800 transition-colors shadow-md"
				>
					<CalendarCheck size={15} />
					Gade sèvis coaching yo
				</a>
			</div>
		</div>

		<!-- ═══════════════════════════════════════════════════
		     SECTION: EBOOKS
		     ═══════════════════════════════════════════════════ -->
		<section id="ebooks" class="py-20 bg-zinc-50 border-t border-zinc-100 scroll-mt-20">
			<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

				<!-- Section Header -->
				<div class="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
					<div>
						<div class="flex items-center gap-2 mb-3">
							<div class="size-8 bg-zinc-950 text-white grid place-items-center rounded-lg">
								<FileText size={16} />
							</div>
							<span class="text-xs font-bold text-zinc-400 uppercase tracking-widest">Bibliyotèk</span>
						</div>
						<h2 class="text-3xl sm:text-4xl font-black text-zinc-950 tracking-tight">
							Ebook ak Gid PDF
						</h2>
						<p class="text-zinc-500 text-sm mt-2 max-w-lg">
							Resous pratik ou ka telechaje epi li nenpòt ki lè.
						</p>
					</div>
					<span class="self-start sm:self-auto px-3.5 py-1.5 bg-zinc-200 text-zinc-700 text-xs font-bold rounded-full">
						{publishedEbooks.length} gid ki disponib
					</span>
				</div>

				<!-- Ebooks Grid — 4 columns, clean light cards -->
				<div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5 sm:gap-6">
					{#each publishedEbooks as ebook (ebook.id)}
						<a
							href="/ebooks/{ebook.id}"
							class="group text-left flex flex-col bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl border border-zinc-200/80 hover:border-zinc-300 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-zinc-950"
						>
							<!-- Book cover — portrait 3:4 -->
							<div class="relative overflow-hidden shrink-0 bg-zinc-100" style="aspect-ratio: 3/4;">
								{#if ebook.cover}
									<img
										src={ebook.cover}
										alt={ebook.title}
										class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
										loading="lazy"
									/>
								{:else}
									<div class="w-full h-full flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-zinc-100 to-zinc-200">
										<FileText size={32} class="text-zinc-400" />
										<span class="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">PDF</span>
									</div>
								{/if}

								<!-- Scrim: top-right PDF label -->
								<div class="absolute top-2.5 right-2.5">
									<span class="px-2 py-0.5 bg-zinc-950/70 backdrop-blur-md text-white text-[9px] font-black uppercase tracking-widest rounded-md">
										PDF
									</span>
								</div>

								<!-- Bottom gradient -->
								<div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>

								<!-- Price on image bottom -->
								<div class="absolute bottom-3 left-3">
									{#if ebook.isFree || ebook.price === 0}
										<span class="px-2.5 py-1 bg-emerald-500 text-white text-[10px] font-black uppercase tracking-wide rounded-full shadow">
											Gratis
										</span>
									{:else}
										<span class="px-2.5 py-1 bg-white text-zinc-950 text-[10px] font-black rounded-full shadow">
											{ebook.price.toLocaleString('fr-FR')} HTG {#if ebook.priceUsd && ebook.priceUsd > 0}(${ebook.priceUsd} USD){/if}
										</span>
									{/if}
								</div>

								<!-- Hover CTA overlay -->
								<div class="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-all duration-300">
									<div class="flex items-center gap-2 px-4 py-2 bg-white text-zinc-950 rounded-full text-[11px] font-black opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 shadow-xl">
										<Download size={13} />
										Jwenn aksè
									</div>
								</div>
							</div>

							<!-- Card body -->
							<div class="p-4 flex flex-col gap-1.5 flex-1">
								<h3 class="font-black text-sm text-zinc-950 group-hover:text-amber-600 transition-colors line-clamp-2 leading-snug">
									{ebook.title}
								</h3>
								<p class="text-[11px] text-zinc-400 line-clamp-1 leading-relaxed hidden sm:block">
									{ebook.description}
								</p>
							</div>
						</a>
					{/each}
				</div>

			</div>
		</section>

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
											<span class="font-black text-xl text-zinc-950">{coaching.price.toLocaleString('fr-FR')}</span>
											<span class="text-zinc-400 text-xs font-medium ml-1">{coaching.currency}</span>
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

			<div class="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div class="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
					
					<!-- Left Side: Banana 3D Image Illustration -->
					<div class="lg:col-span-5 relative group">
						<div class="relative rounded-3xl overflow-hidden border border-white/15 bg-gradient-to-b from-white/10 to-white/5 backdrop-blur-xl p-2 shadow-2xl">
							<img
								src="/payment-banana.png"
								alt="Sipò Peman DJR Akademi - Banana Assistant"
								class="w-full h-auto object-cover rounded-2xl group-hover:scale-102 transition-transform duration-500"
							/>
							<div class="absolute bottom-6 left-6 right-6 bg-zinc-950/85 backdrop-blur-md border border-white/15 p-4 rounded-xl shadow-xl">
								<div class="flex items-center gap-3">
									<div class="size-10 bg-amber-400 text-black grid place-items-center rounded-lg font-black shrink-0">
										<ShieldCheck size={20} />
									</div>
									<div>
										<p class="text-xs font-bold text-white">Verifikasyon Otomatik</p>
										<p class="text-[11px] text-white/60">Debloke aksè nan kou ou a san retada</p>
									</div>
								</div>
							</div>
						</div>
					</div>

					<!-- Right Side: Interactive UX Form -->
					<div class="lg:col-span-7 space-y-6">
						<div class="space-y-3">
							<div class="inline-flex items-center gap-2 px-3.5 py-1.5 bg-amber-400/10 border border-amber-400/20 rounded-full text-amber-400 text-xs font-bold uppercase tracking-wider">
								<HelpCircle size={14} />
								Sipò & Pwoblèm aksè
							</div>
							<h2 class="text-3xl sm:text-4xl font-black tracking-tight leading-tight">
								Ou peye epi w pa jwenn aksè ?
							</h2>
							<p class="text-white/60 text-sm leading-relaxed max-w-xl">
								Pa enkyete w ! Antre enfòmasyon peman w yo anba a epi n ap verifye tranzaksyon w lan imedyatman pou n ka debloke kont ou.
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
										Imel ou te itilize sou Lemon Squeezy lè w t ap peye pa kat la *
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
										Sistèm nan ap chèche tranzaksyon Lemon Squeezy ki lye ak imel sa a pou debloke aksè w la.
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
			</div>
		</section>

		<!-- ═══════════════════════════════════════════════════
		     FOOTER CTA — Contact direct
		     ═══════════════════════════════════════════════════ -->
		<section class="py-16 bg-zinc-50 border-t border-zinc-200">
			<div class="max-w-2xl mx-auto px-4 text-center space-y-5">
				<img src="/logo.png" alt="DJR Akademi" class="h-10 w-auto mx-auto" />
				<h2 class="text-2xl sm:text-3xl font-black text-zinc-950 tracking-tight">
					Ou gen yon kesyon ? Kontakte nou.
				</h2>
				<p class="text-zinc-500 text-sm leading-relaxed">
					Ekip nou an la pou gide w nan fòmasyon ak swivi ki adapte ak sa w bezwen an.
				</p>
				<a
					href="/contact"
					class="inline-flex items-center gap-2 px-8 py-3.5 bg-zinc-950 text-white hover:bg-zinc-800 font-bold text-sm rounded-xl transition-colors shadow-md"
				>
					Kontakte nou
					<ArrowRight size={15} />
				</a>
			</div>
		</section>

	</main>

	<PublicFooter />
</div>
