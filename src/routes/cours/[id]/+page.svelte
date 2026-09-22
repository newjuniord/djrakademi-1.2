<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import PublicHeader from '$lib/components/PublicHeader.svelte';
	import PublicFooter from '$lib/components/PublicFooter.svelte';
	import { claimFreeCourse, getCourseById, hasCourseAccess } from '$lib/services/courses';
	import type { Course } from '$lib/types/admin';
	import { formatPublicPrice } from '$lib/utils/public-price';
	import { BookOpen, Users, ChevronLeft, Play, CheckCircle2, Clock, Lock, X, Video } from 'lucide-svelte';
	import { parseVideoUrl } from '$lib/utils/video';
	import PaymentMethodModal from '$lib/components/PaymentMethodModal.svelte';
	import { initiatePlopplopPayment, verifyLemonSqueezyPurchase } from '$lib/services/payments';
	import { authState } from '$lib/auth.svelte';
	import { toast } from '$lib/toast.svelte';

	let currentLang = $derived<'fr' | 'ht'>(page.url.searchParams.get('lang') === 'ht' ? 'ht' : 'fr');

	const i18n = {
		fr: {
			metaTitle: (t: string) => `${t} · DJR Akademi`,
			metaDesc: (d: string) => d || "Formation en ligne DJR Akademi",
			loading: "Chargement de la formation...",
			notFound: "Formation introuvable.",
			backHome: "Retour à l'accueil",
			backCourses: "Toutes les formations",
			kicker: "Formation vidéo",
			modulesCount: (n: number) => `${n} module${n > 1 ? 's' : ''}`,
			lessonsCount: (n: number) => `${n} leçon${n > 1 ? 's' : ''}`,
			watchPresentation: "Garder la présentation",
			previewVideoTitle: "Vidéo de présentation",
			free: "Gratuit",
			btnFree: "Obtenir l'accès gratuit",
			btnBuy: "Acheter cette formation",
			btnBuyBottom: "Acheter maintenant",
			loadingBtn: "Chargement...",
			whatYouWillLearn: "Ce que vous allez apprendre",
			programTitle: "Programme de la formation",
			questions: "Des questions ?",
			contactForm: "Formulaire de contact",
			loginToast: "Veuillez vous connecter à votre compte pour acheter cette formation.",
			loginFreeToast: "Veuillez vous connecter à votre compte pour débloquer cet accès gratuit.",
			alreadyOwnedToast: "Vous avez déjà cette formation ! Redirection en cours...",
			freeClaimToast: "Accès gratuit débloqué ! Redirection en cours...",
			errorToast: "Une erreur est survenue lors de l'inscription.",
			errorPayment: "Une erreur est survenue lors du paiement."
		},
		ht: {
			metaTitle: (t: string) => `${t} · DJR Akademi`,
			metaDesc: (d: string) => d || "Fòmasyon DJR Akademi",
			loading: "N ap chaje fòmasyon an...",
			notFound: "Fòmasyon an pa disponib.",
			backHome: "Retounen nan akèy",
			backCourses: "Tout fòmasyon yo",
			kicker: "Fòmasyon videyo",
			modulesCount: (n: number) => `${n} modil`,
			lessonsCount: (n: number) => `${n} leson`,
			watchPresentation: "Gade prezantasyon an",
			previewVideoTitle: "Videyo prezantasyon",
			free: "Gratis",
			btnFree: "Jwenn aksè gratis",
			btnBuy: "Achte fòmasyon sa a",
			btnBuyBottom: "Achte kounye a",
			loadingBtn: "Chajman...",
			whatYouWillLearn: "Sa w pral aprann",
			programTitle: "Pwogram kou a",
			questions: "Kesyon ?",
			contactForm: "Fòm kontak",
			loginToast: "Tanpri konekte sou kont ou pou w ka achte fòmasyon sa a.",
			loginFreeToast: "Tanpri konekte sou kont ou pou w ka jwenn aksè nan fòmasyon sa a.",
			alreadyOwnedToast: "Ou gen fòmasyon sa a deja! N ap redirije w pou w gade l.",
			freeClaimToast: "Aksè gratis debloke! N ap redirije w pou w gade l.",
			errorToast: "Yon erè rive pandan enskripsyon an.",
			errorPayment: "Yon erè rive pandan n ap trete peman an."
		}
	};

	let t = $derived(i18n[currentLang]);

	function getHref(path: string): string {
		if (currentLang !== 'ht') return path;
		const [pathname, search] = path.split('?');
		const params = new URLSearchParams(search || '');
		params.set('lang', 'ht');
		return `${pathname}?${params.toString()}`;
	}

	const courseId = $derived(page.params.id);
	let course = $state<Course | null>(null);
	let loading = $state(true);
	let checkoutLoading = $state(false);
	let showPaymentModal = $state(false);
	let showVideoModal = $state(false);

	const videoSource = $derived(parseVideoUrl(course?.videoUrl || course?.previewVideoUrl));

	$effect(() => {
		const id = courseId;
		if (id) {
			loadCourse(id);
		}
	});

	$effect(() => {
		const id = courseId;
		const user = authState.user;
		if (id && user && user.$id) {
			hasCourseAccess(id).then((owned) => {
				if (owned) {
					goto(getHref(`/learn/${id}`), { replaceState: true });
				}
			}).catch(() => undefined);
		}
	});

	async function loadCourse(id: string) {
		loading = true;
		course = await getCourseById(id);
		loading = false;
	}

	const totalLessons = $derived(
		course ? (course.modules || []).reduce((acc, m) => acc + m.lessons.length, 0) : 0
	);

	async function handleBuyClick() {
		if (!course || checkoutLoading) return;

		if (!authState.user || !authState.user.$id) {
			toast.info(t.loginToast);
			authState.openLogin(() => {
				handleBuyClick();
			});
			return;
		}

		checkoutLoading = true;
		try {
			const existingAccess = await hasCourseAccess(course.id);
			if (existingAccess) {
				toast.info(t.alreadyOwnedToast);
				goto(getHref(`/learn/${course.id}`));
				return;
			}

			if (course.isFree || course.price === 0) {
				await handleFreeEnrollment();
			} else {
				try {
					const verification = await verifyLemonSqueezyPurchase(authState.user.email, 'course', course.id);
					if (verification.ok && verification.success) {
						const purchasedCourseId = course.id;
						toast.success(verification.message, 5000);
						setTimeout(() => goto(getHref(`/learn/${purchasedCourseId}`)), 1800);
						return;
					}
				} catch (err) {
					console.warn('[Checkout] Lemon Squeezy precheck failed, fallback to payment modal:', err);
				}
				showPaymentModal = true;
			}
		} catch (e) {
			console.error('Check access error:', e);
			showPaymentModal = true;
		} finally {
			checkoutLoading = false;
		}
	}

	async function handleFreeEnrollment() {
		if (!course) return;
		checkoutLoading = true;
		try {
			const user = authState.user;
			if (!user || !user.$id) {
				toast.info(t.loginFreeToast);
				authState.openLogin(() => {
					handleFreeEnrollment();
				});
				return;
			}

			await claimFreeCourse(course.id);
			toast.success(t.freeClaimToast);
			goto(getHref(`/learn/${course.id}`));
		} catch (e) {
			console.error('Free enrollment error:', e);
			toast.error(t.errorToast);
		} finally {
			checkoutLoading = false;
		}
	}

	async function handleSelectPaymentMethod(method: 'moncash' | 'natcash' | 'carte' | 'plopplop_carte') {
		if (!course || checkoutLoading) return;

		if (!authState.user || !authState.user.$id) {
			showPaymentModal = false;
			toast.info(t.loginToast);
			authState.openLogin(() => {
				handleBuyClick();
			});
			return;
		}

		checkoutLoading = true;
		try {
			const userId = authState.user.$id;
			const userName = authState.user.name || 'Client';
			const userEmail = authState.user.email || '';

			const existingAccess = await hasCourseAccess(course.id);
			if (existingAccess) {
				showPaymentModal = false;
				toast.info(t.alreadyOwnedToast);
				goto(getHref('/dashboard'));
				return;
			}

			const res = await initiatePlopplopPayment({
				userId,
				customerName: userName,
				customerEmail: userEmail,
				productType: 'course',
				productId: course.id,
				productTitle: course.title,
				amount: course.price,
				paymentMethod: method
			});

			const redirectTarget = res?.url || res?.redirectUrl;
			if (res && res.success && redirectTarget) {
				window.location.href = redirectTarget;
				return;
			} else {
				toast.error(res?.message || t.errorPayment);
			}
		} catch (e: any) {
			console.error('Plopplop payment error:', e);
			toast.error(e?.message || t.errorPayment);
		} finally {
			checkoutLoading = false;
		}
	}
</script>

<svelte:head>
	<title>{course ? t.metaTitle(course.title) : t.metaTitle('Formation')}</title>
	<meta name="description" content={t.metaDesc(course?.description ?? '')} />
</svelte:head>

{#if loading}
	<div class="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center gap-3">
		<span class="loading loading-spinner text-amber-400 loading-lg"></span>
		<p class="text-xs text-white/50 font-medium">{t.loading}</p>
	</div>
{:else if !course}
	<div class="min-h-screen flex items-center justify-center bg-zinc-950 text-white">
		<div class="text-center space-y-4">
			<p class="text-zinc-400 text-sm">{t.notFound}</p>
			<button
				type="button"
				onclick={() => goto(getHref('/'))}
				class="inline-flex items-center gap-2 px-6 py-3 bg-white text-black text-sm font-bold hover:bg-zinc-100 transition-colors"
			>
				<ChevronLeft size={16} />
				{t.backHome}
			</button>
		</div>
	</div>
{:else}
	<div class="min-h-screen bg-white flex flex-col font-sans">
		<PublicHeader />

		<main class="flex-1">

			{#snippet mediaCard()}
				{#if course?.cover || videoSource}
					<div
						role="button"
						tabindex="0"
						onclick={() => {
							if (videoSource) showVideoModal = true;
						}}
						onkeydown={(e) => {
							if (videoSource && (e.key === 'Enter' || e.key === ' ')) showVideoModal = true;
						}}
						class="relative w-full rounded-2xl overflow-hidden shadow-2xl group {course?.cover ? 'bg-black' : 'aspect-video'} {videoSource ? 'cursor-pointer' : ''}"
					>
						{#if course?.cover}
							<img
								src={course.cover}
								alt={course.title}
								class="block w-full h-auto object-contain"
							/>
						{:else}
							<div class="w-full h-full bg-zinc-900 flex flex-col items-center justify-center text-white/40 gap-3">
								<Video size={48} />
								<span class="text-xs font-bold uppercase tracking-wider">{t.previewVideoTitle}</span>
							</div>
						{/if}

						<div class="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>

						{#if videoSource}
							<div class="absolute inset-0 flex flex-col items-center justify-center gap-3">
								<div class="size-16 bg-amber-400 text-black rounded-full flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
									<Play size={26} class="fill-black ml-1" />
								</div>
								<span class="px-3 py-1 bg-black/60 backdrop-blur-md rounded-full text-white text-xs font-bold border border-white/20">
									{t.watchPresentation}
								</span>
							</div>
						{/if}
					</div>
				{/if}
			{/snippet}

			<!-- Hero Section -->
			<section class="bg-zinc-950 text-white py-16 sm:py-20">
				<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<button
						type="button"
						onclick={() => goto(getHref('/#courses'))}
						class="inline-flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-colors mb-8 font-medium"
					>
						<ChevronLeft size={14} />
						{t.backCourses}
					</button>

					<div class="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
						<!-- Left: Info -->
						<div class="space-y-6">
							<div class="flex items-center gap-2">
								<div class="size-7 bg-amber-400 text-black grid place-items-center rounded-md">
									<BookOpen size={14} />
								</div>
								<span class="text-xs font-bold text-white/40 uppercase tracking-widest">{t.kicker}</span>
							</div>

							<h1 class="text-3xl sm:text-4xl lg:text-5xl font-black leading-tight tracking-tight">
								{course.title}
							</h1>

							<p class="text-white/60 text-base leading-relaxed max-w-lg">
								{course.description}
							</p>

							<!-- Stats -->
							<div class="flex flex-wrap items-center gap-5 py-4 border-y border-white/10">
								<div class="flex items-center gap-1.5 text-sm text-white/50">
									<Play size={15} class="text-white/30" />
									<span class="font-semibold text-white">{t.modulesCount(course.modules.length)}</span>
								</div>
								<div class="flex items-center gap-1.5 text-sm text-white/50">
									<Clock size={15} class="text-white/30" />
									<span class="font-semibold text-white">{t.lessonsCount(totalLessons)}</span>
								</div>
								{#if videoSource}
									<button
										type="button"
										onclick={() => (showVideoModal = true)}
										class="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-400/20 hover:bg-amber-400/30 text-amber-300 text-xs font-bold rounded-full border border-amber-400/30 transition-colors cursor-pointer"
									>
										<Play size={13} class="fill-amber-300" />
										{t.watchPresentation}
									</button>
								{/if}
							</div>

							<!-- Mobile Only: Cover image or Video Player -->
							<div class="relative w-full my-6 lg:hidden">
								{@render mediaCard()}
							</div>

							<!-- Price + CTA -->
							<div class="flex flex-col sm:flex-row items-start sm:items-center gap-4">
								<div>
									{#if course.isFree || course.price === 0}
										<span class="text-4xl font-black text-emerald-400">{t.free}</span>
									{:else}
										<span class="text-4xl font-black text-white">{formatPublicPrice(course.price, course.priceUsd)}</span>
									{/if}
								</div>
								<button
									type="button"
									disabled={checkoutLoading}
									onclick={handleBuyClick}
									class="inline-flex items-center justify-center gap-2 h-14 px-10 bg-amber-400 hover:bg-amber-300 text-black font-black text-sm transition-colors shadow-xl shadow-amber-500/20 cursor-pointer disabled:opacity-50"
								>
									{#if checkoutLoading}
										<span>{t.loadingBtn}</span>
									{:else if course.isFree || course.price === 0}
										{t.btnFree}
									{:else}
										{t.btnBuy}
									{/if}
								</button>
							</div>
						</div>

						<!-- Desktop Only: Cover image or Video Player -->
						<div class="relative w-full hidden lg:block">
							{@render mediaCard()}
						</div>
					</div>
				</div>
			</section>

			<!-- What you'll learn -->
			<section class="py-14 bg-white border-b border-zinc-100">
				<div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
					<h2 class="text-xl font-black text-zinc-950 mb-6 tracking-tight">{t.whatYouWillLearn}</h2>
					<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
						{#each course.modules as mod}
							{#each mod.lessons as lesson}
								<div class="flex items-start gap-3 p-3 rounded-xl bg-zinc-50 border border-zinc-100">
									<CheckCircle2 size={16} class="text-emerald-500 shrink-0 mt-0.5" />
									<span class="text-sm text-zinc-700 font-medium">{lesson.title}</span>
								</div>
							{/each}
						{/each}
					</div>
				</div>
			</section>

			<!-- Programme / Modules -->
			<section class="py-14 bg-zinc-50">
				<div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
					<h2 class="text-xl font-black text-zinc-950 mb-6 tracking-tight">{t.programTitle}</h2>
					<div class="space-y-4">
						{#each course.modules as mod, mi}
							<div class="bg-white rounded-2xl border border-zinc-100 overflow-hidden shadow-sm">
								<!-- Module header -->
								<div class="flex items-center gap-3 p-5 border-b border-zinc-100">
									<span class="size-8 bg-zinc-950 text-white text-xs font-black rounded-full grid place-items-center shrink-0">
										{mi + 1}
									</span>
									<h3 class="font-black text-sm text-zinc-950">{mod.title}</h3>
									<span class="ml-auto text-xs text-zinc-400 font-medium">{t.lessonsCount(mod.lessons.length)}</span>
								</div>
								<!-- Lessons -->
								<div class="divide-y divide-zinc-50">
									{#each mod.lessons as lesson}
										<div class="flex items-center gap-3 px-5 py-3.5">
											{#if lesson.type === 'video'}
												<Play size={14} class="text-zinc-400 fill-zinc-400 shrink-0" />
											{:else}
												<BookOpen size={14} class="text-zinc-400 shrink-0" />
											{/if}
											<span class="text-sm text-zinc-600 flex-1">{lesson.title}</span>
											<Lock size={13} class="text-zinc-300 shrink-0" />
										</div>
									{/each}
								</div>
							</div>
						{/each}
					</div>
				</div>
			</section>

			<!-- CTA Bottom -->
			<section class="py-14 bg-zinc-950 text-white text-center">
				<div class="max-w-xl mx-auto px-4 space-y-5">
					<h2 class="text-2xl sm:text-3xl font-black tracking-tight">{course.title}</h2>
					<p class="text-white/50 text-sm leading-relaxed">{course.description}</p>
					<div class="flex flex-col sm:flex-row items-center justify-center gap-4">
						{#if course.isFree || course.price === 0}
							<span class="text-3xl font-black text-emerald-400">{t.free}</span>
						{:else}
							<span class="text-3xl font-black">{formatPublicPrice(course.price, course.priceUsd)}</span>
						{/if}
						<button
							type="button"
							disabled={checkoutLoading}
							onclick={handleBuyClick}
							class="inline-flex items-center gap-2 px-8 py-3.5 bg-amber-400 hover:bg-amber-300 text-black font-black text-sm transition-colors cursor-pointer disabled:opacity-50"
						>
							{course.isFree || course.price === 0 ? t.btnFree : t.btnBuyBottom}
						</button>
					</div>
					<p class="text-white/30 text-xs">
						{t.questions} <a href={getHref('/contact')} class="underline hover:text-white/60 transition-colors">{t.contactForm}</a>
					</p>
				</div>
			</section>

		</main>

		<PublicFooter />
	</div>
{/if}

{#if course}
	<PaymentMethodModal
		open={showPaymentModal}
		productTitle={course.title}
		amount={course.price}
		amountUsd={course.priceUsd}
		isFree={course.isFree || course.price === 0}
		loading={checkoutLoading}
		onSelectMethod={handleSelectPaymentMethod}
		onClose={() => (showPaymentModal = false)}
	/>

	{#if showVideoModal && videoSource}
		<div class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md">
			<div class="relative w-full max-w-4xl bg-zinc-950 rounded-2xl overflow-hidden border border-zinc-800 shadow-2xl">
				<!-- Header -->
				<div class="flex items-center justify-end sm:justify-between p-3 sm:p-5 border-b border-zinc-800 bg-zinc-900">
					<div class="hidden sm:flex items-center gap-2 min-w-0">
						<Video size={18} class="text-amber-400 shrink-0" />
						<h3 class="text-sm font-bold text-white truncate">{t.previewVideoTitle} — {course.title}</h3>
					</div>
					<button
						type="button"
						onclick={() => (showVideoModal = false)}
						class="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
					>
						<X size={18} />
					</button>
				</div>

				<!-- Video Embed -->
				<div class="relative w-full aspect-video bg-black">
					{#if videoSource.type === 'iframe'}
						<iframe
							src={videoSource.embedUrl}
							title={course.title}
							class="w-full h-full border-0"
							allow="autoplay; fullscreen; picture-in-picture"
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
			</div>
		</div>
	{/if}
{/if}
