<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import PublicHeader from '$lib/components/PublicHeader.svelte';
	import PublicFooter from '$lib/components/PublicFooter.svelte';
	import { claimFreeCourse, getCourseById, hasCourseAccess } from '$lib/services/courses';
	import type { Course } from '$lib/types/admin';
	import { BookOpen, Users, ChevronLeft, Play, CheckCircle2, Clock, Lock, X, Video } from 'lucide-svelte';
	import { parseVideoUrl } from '$lib/utils/video';

	import PaymentMethodModal from '$lib/components/PaymentMethodModal.svelte';
	import { initiatePlopplopPayment } from '$lib/services/payments';
	import { authState } from '$lib/auth.svelte';

	const courseId = $derived(page.params.id);
	let course = $state<Course | null>(null);
	let loading = $state(true);
	let checkoutLoading = $state(false);
	let showPaymentModal = $state(false);
	let showVideoModal = $state(false);
	let playInlineVideo = $state(false);

	const videoSource = $derived(parseVideoUrl(course?.videoUrl || course?.previewVideoUrl));

	$effect(() => {
		const id = courseId;
		if (id) {
			loadCourse(id);
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

	import { toast } from '$lib/toast.svelte';

	async function handleBuyClick() {
		if (!course) return;

		// 1. Vérifier si l'utilisateur est connecté
		if (!authState.user || !authState.user.$id) {
			toast.info('Tanpri konekte sou kont ou pou w ka achte fòmasyon sa a.');
			authState.openLogin(() => {
				handleBuyClick();
			});
			return;
		}

		// 2. Vérifier si l'utilisateur possède déjà la formation
		checkoutLoading = true;
		try {
			const existingAccess = await hasCourseAccess(course.id);
			if (existingAccess) {
				toast.info('Ou gen fòmasyon sa a deja! N ap redirije w nan espas ou an.');
				goto('/dashboard');
				return;
			}

			if (course.isFree || course.price === 0) {
				await handleFreeEnrollment();
			} else {
				showPaymentModal = true;
			}
		} catch (e) {
			console.error('Check access error:', e);
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
				toast.info('Tanpri konekte sou kont ou pou w ka jwenn aksè nan fòmasyon sa a.');
				authState.openLogin(() => {
					handleFreeEnrollment();
				});
				return;
			}

			await claimFreeCourse(course.id);
			toast.success('Aksè gratis debloke! N ap redirije w nan espas ou an.');
			goto('/dashboard');
		} catch (e) {
			console.error('Free enrollment error:', e);
			toast.error('Yon erè rive pandan enskripsyon an.');
		} finally {
			checkoutLoading = false;
		}
	}

	async function handleSelectPaymentMethod(method: 'moncash' | 'natcash' | 'carte') {
		if (!course || checkoutLoading) return;

		// 1. Vérifier si l'utilisateur est connecté
		if (!authState.user || !authState.user.$id) {
			showPaymentModal = false;
			toast.info('Tanpri konekte sou kont ou pou w ka fè peman an.');
			authState.openLogin(() => {
				showPaymentModal = true;
			});
			return;
		}

		checkoutLoading = true;
		try {
			const userId = authState.user.$id;
			const userName = authState.user.name || 'Client';
			const userEmail = authState.user.email || '';

			// 2. Re-vérification si l'utilisateur possède déjà la formation
			const existingAccess = await hasCourseAccess(course.id);
			if (existingAccess) {
				showPaymentModal = false;
				toast.info('Ou gen fòmasyon sa a deja! N ap redirije w nan espas ou an.');
				goto('/dashboard');
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
				showPaymentModal = false;
				window.location.href = redirectTarget;
			} else {
				toast.error(res?.message || 'Nou pa ka lanse peman an. Tanpri eseye ankò.');
			}
		} catch (e: any) {
			console.error('Plopplop payment error:', e);
			toast.error(e?.message || 'Yon erè rive pandan n ap trete peman an.');
		} finally {
			checkoutLoading = false;
		}
	}
</script>

<svelte:head>
	<title>{course ? course.title : 'Formation'} · DJR Akademi</title>
	<meta name="description" content={course?.description ?? 'Formation DJR Akademi'} />
</svelte:head>

{#if loading}
	<div class="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center gap-3">
		<span class="loading loading-spinner text-amber-400 loading-lg"></span>
		<p class="text-xs text-white/50 font-medium">Chargement de la formation...</p>
	</div>
{:else if !course}
	<div class="min-h-screen flex items-center justify-center bg-zinc-950 text-white">
		<div class="text-center space-y-4">
			<p class="text-zinc-400 text-sm">Formation introuvable.</p>
			<button
				type="button"
				onclick={() => goto('/')}
				class="inline-flex items-center gap-2 px-6 py-3 bg-white text-black text-sm font-bold hover:bg-zinc-100 transition-colors"
			>
				<ChevronLeft size={16} />
				Retour à l'accueil
			</button>
		</div>
	</div>
{:else}
	<div class="min-h-screen bg-white flex flex-col font-sans">
		<PublicHeader />

		<main class="flex-1">

			<!-- Hero Section -->
			<section class="bg-zinc-950 text-white py-16 sm:py-20">
				<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<button
						type="button"
						onclick={() => goto('/#courses')}
						class="inline-flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-colors mb-8 font-medium"
					>
						<ChevronLeft size={14} />
						Tout fòmasyon yo
					</button>

					<div class="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
						<!-- Left: Info -->
						<div class="space-y-6">
							<div class="flex items-center gap-2">
								<div class="size-7 bg-amber-400 text-black grid place-items-center rounded-md">
									<BookOpen size={14} />
								</div>
								<span class="text-xs font-bold text-white/40 uppercase tracking-widest">Fòmasyon videyo</span>
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
									<span class="font-semibold text-white">{course.modules.length}</span> modil
								</div>
								<div class="flex items-center gap-1.5 text-sm text-white/50">
									<Clock size={15} class="text-white/30" />
									<span class="font-semibold text-white">{totalLessons}</span> leson
								</div>
								{#if videoSource}
									<button
										type="button"
										onclick={() => (showVideoModal = true)}
										class="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-400/20 hover:bg-amber-400/30 text-amber-300 text-xs font-bold rounded-full border border-amber-400/30 transition-colors cursor-pointer"
									>
										<Play size={13} class="fill-amber-300" />
										Gade videyo prezantasyon
									</button>
								{/if}
							</div>

							<!-- Cover image or Video Player (Placed BEFORE Price & CTA) -->
							<div class="relative w-full my-6">
								{#if videoSource && playInlineVideo}
									<div class="relative rounded-2xl overflow-hidden shadow-2xl aspect-video bg-black border border-white/20">
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
												class="w-full h-full object-contain bg-black"
											>
												<track kind="captions" />
											</video>
										{/if}
										<button
											type="button"
											onclick={() => (playInlineVideo = false)}
											class="absolute top-3 right-3 size-8 bg-black/70 hover:bg-black text-white rounded-full grid place-items-center transition-colors border border-white/20"
											title="Fèmen videyo"
										>
											<X size={16} />
										</button>
									</div>
								{:else if course.cover || videoSource}
									<div
										role="button"
										tabindex="0"
										onclick={() => {
											if (videoSource) playInlineVideo = true;
										}}
										onkeydown={(e) => {
											if (videoSource && (e.key === 'Enter' || e.key === ' ')) playInlineVideo = true;
										}}
										class="relative rounded-2xl overflow-hidden shadow-2xl aspect-video group {videoSource ? 'cursor-pointer' : ''}"
									>
										{#if course.cover}
											<img
												src={course.cover}
												alt={course.title}
												class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
											/>
										{:else}
											<div class="w-full h-full bg-zinc-900 flex flex-col items-center justify-center text-white/40 gap-3">
												<Video size={48} />
												<span class="text-xs font-bold uppercase tracking-wider">Vidéo de présentation</span>
											</div>
										{/if}

										<div class="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>

										{#if videoSource}
											<div class="absolute inset-0 flex flex-col items-center justify-center gap-3">
												<div class="size-16 bg-amber-400 text-black rounded-full flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
													<Play size={26} class="fill-black ml-1" />
												</div>
												<span class="px-3 py-1 bg-black/60 backdrop-blur-md rounded-full text-white text-xs font-bold border border-white/20">
													Gade prezantasyon an
												</span>
											</div>
										{/if}
									</div>
								{/if}
							</div>

							<!-- Price + CTA -->
							<div class="flex flex-col sm:flex-row items-start sm:items-center gap-4">
								<div>
									{#if course.isFree || course.price === 0}
										<span class="text-4xl font-black text-emerald-400">Gratis</span>
									{:else}
										<span class="text-4xl font-black text-white">{course.price.toLocaleString('fr-FR')}</span>
										<span class="text-white/40 text-sm font-medium ml-1">HTG</span>
										{#if course.priceUsd && course.priceUsd > 0}
											<span class="text-amber-400 text-sm font-bold ml-2">(${course.priceUsd} USD)</span>
										{/if}
									{/if}
								</div>
								<button
									type="button"
									disabled={checkoutLoading}
									onclick={handleBuyClick}
									class="inline-flex items-center justify-center gap-2 h-14 px-10 bg-amber-400 hover:bg-amber-300 text-black font-black text-sm transition-colors shadow-xl shadow-amber-500/20 cursor-pointer disabled:opacity-50"
								>
									{#if checkoutLoading}
										<span>Chajman...</span>
									{:else if course.isFree || course.price === 0}
										Jwenn aksè gratis
									{:else}
										Achte fòmasyon sa a
									{/if}
								</button>
							</div>
						</div>
					</div>
				</div>
			</section>

			<!-- What you'll learn -->
			<section class="py-14 bg-white border-b border-zinc-100">
				<div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
					<h2 class="text-xl font-black text-zinc-950 mb-6 tracking-tight">Sa w pral aprann</h2>
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
					<h2 class="text-xl font-black text-zinc-950 mb-6 tracking-tight">Pwogram kou a</h2>
					<div class="space-y-4">
						{#each course.modules as mod, mi}
							<div class="bg-white rounded-2xl border border-zinc-100 overflow-hidden shadow-sm">
								<!-- Module header -->
								<div class="flex items-center gap-3 p-5 border-b border-zinc-100">
									<span class="size-8 bg-zinc-950 text-white text-xs font-black rounded-full grid place-items-center shrink-0">
										{mi + 1}
									</span>
									<h3 class="font-black text-sm text-zinc-950">{mod.title}</h3>
									<span class="ml-auto text-xs text-zinc-400 font-medium">{mod.lessons.length} leson</span>
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
							<span class="text-3xl font-black text-emerald-400">Gratis</span>
						{:else}
							<span class="text-3xl font-black">{course.price.toLocaleString('fr-FR')} HTG {#if course.priceUsd && course.priceUsd > 0}(${course.priceUsd} USD){/if}</span>
						{/if}
						<button
							type="button"
							disabled={checkoutLoading}
							onclick={handleBuyClick}
							class="inline-flex items-center gap-2 px-8 py-3.5 bg-amber-400 hover:bg-amber-300 text-black font-black text-sm transition-colors cursor-pointer disabled:opacity-50"
						>
							{course.isFree || course.price === 0 ? 'Jwenn aksè gratis' : 'Achte kounye a'}
						</button>
					</div>
					<p class="text-white/30 text-xs">
						Kesyon ? <a href="/contact" class="underline hover:text-white/60 transition-colors">Fòm kontak</a>
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
		isFree={course.isFree || course.price === 0}
		loading={checkoutLoading}
		onSelectMethod={handleSelectPaymentMethod}
		onClose={() => (showPaymentModal = false)}
	/>

	{#if showVideoModal && videoSource}
		<div class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md">
			<div class="relative w-full max-w-4xl bg-zinc-950 rounded-2xl overflow-hidden border border-zinc-800 shadow-2xl">
				<!-- Header -->
				<div class="flex items-center justify-between p-4 sm:p-5 border-b border-zinc-800 bg-zinc-900">
					<div class="flex items-center gap-2">
						<Video size={18} class="text-amber-400" />
						<h3 class="text-sm font-bold text-white truncate">Vidéo de présentation — {course.title}</h3>
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
