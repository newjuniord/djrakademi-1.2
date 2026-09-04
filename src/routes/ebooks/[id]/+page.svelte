<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import PublicHeader from '$lib/components/PublicHeader.svelte';
	import PublicFooter from '$lib/components/PublicFooter.svelte';
	import { getEbookById } from '$lib/services/ebooks';
	import type { Ebook } from '$lib/types/admin';
	import { FileText, ChevronLeft, Download, CheckCircle2, ShoppingBag, Loader2 } from 'lucide-svelte';

	import PaymentMethodModal from '$lib/components/PaymentMethodModal.svelte';
	import { initiatePlopplopPayment } from '$lib/services/payments';
	import { claimFreeEbook, ownsEbook } from '$lib/services/ebook-access';
	import { authState } from '$lib/auth.svelte';

	let ebook = $state<Ebook | null>(null);
	let loading = $state(true);
	let checkoutLoading = $state(false);
	let showPaymentModal = $state(false);

	onMount(async () => {
		const ebookId = page.params.id;
		if (ebookId) {
			try {
				ebook = await getEbookById(ebookId);
			} finally {
				loading = false;
			}
		} else {
			loading = false;
		}
	});

	import { toast } from '$lib/toast.svelte';

	async function handleBuyClick() {
		if (!ebook) return;

		// 1. Vérifier si l'utilisateur est connecté
		if (!authState.user || !authState.user.$id) {
			toast.info('Tanpri konekte sou kont ou pou w ka achte ebook sa a.');
			authState.openLogin(() => {
				handleBuyClick();
			});
			return;
		}

		// 2. Vérifier si l'utilisateur possède déjà cet ebook
		checkoutLoading = true;
		try {
			const existingAccess = await ownsEbook(ebook.id);
			if (existingAccess) {
				toast.info('Ou gen ebook sa a deja! N ap redirije w nan espas ou an.');
				goto('/dashboard');
				return;
			}

			if (ebook.isFree || ebook.price === 0) {
				await handleFreeEnrollment();
			} else {
				showPaymentModal = true;
			}
		} catch (e) {
			console.error('Check ebook access error:', e);
		} finally {
			checkoutLoading = false;
		}
	}

	async function handleFreeEnrollment() {
		if (!ebook) return;
		if (!authState.user) {
			toast.info('Tanpri konekte sou kont ou pou w ka telechaje ebook sa a.');
			authState.openLogin(() => {
				handleFreeEnrollment();
			});
			return;
		}
		checkoutLoading = true;
		try {
			await claimFreeEbook(ebook.id);
			toast.success('Ebook debloke! Ou ka telechaje l kounye a.');
			await goto('/dashboard#sec-ebooks');
		} catch (caught) {
			toast.error(caught instanceof Error ? caught.message : 'Nou pa ka debloke ebook sa a.');
		} finally {
			checkoutLoading = false;
		}
	}

	async function handleSelectPaymentMethod(method: 'moncash' | 'natcash' | 'carte') {
		if (!ebook || checkoutLoading) return;

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

			// 2. Re-vérification si l'utilisateur possède déjà cet ebook
			const existingAccess = await ownsEbook(ebook.id);
			if (existingAccess) {
				showPaymentModal = false;
				toast.info('Ou gen ebook sa a deja! N ap redirije w nan espas ou an.');
				goto('/dashboard');
				return;
			}

			const res = await initiatePlopplopPayment({
				userId,
				customerName: userName,
				customerEmail: userEmail,
				productType: 'ebook',
				productId: ebook.id,
				productTitle: ebook.title,
				amount: ebook.price,
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
			console.error('Plopplop ebook payment error:', e);
			toast.error(e?.message || 'Yon erè rive pandan n ap trete peman an.');
		} finally {
			checkoutLoading = false;
		}
	}
</script>

<svelte:head>
	<title>{ebook ? ebook.title : 'Ebook'} · DJR Akademi</title>
	<meta name="description" content={ebook?.description ?? 'Ebook DJR Akademi'} />
</svelte:head>

{#if loading}
	<div class="min-h-screen flex items-center justify-center bg-zinc-950 text-white">
		<div class="text-center space-y-4">
			<Loader2 size={32} class="mx-auto animate-spin text-amber-400" />
			<p class="text-zinc-400 text-sm">Chargement de l'ebook...</p>
		</div>
	</div>
{:else if !ebook}
	<div class="min-h-screen flex items-center justify-center bg-zinc-950 text-white">
		<div class="text-center space-y-4">
			<p class="text-zinc-400 text-sm">Ebook introuvable.</p>
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

			<!-- Hero -->
			<section class="bg-zinc-950 text-white py-16 sm:py-20">
				<div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
					<button
						type="button"
						onclick={() => goto('/#ebooks')}
						class="inline-flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-colors mb-8 font-medium"
					>
						<ChevronLeft size={14} />
						Tout ebook yo
					</button>

					<div class="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

						<!-- Left: Info -->
						<div class="space-y-6 order-2 lg:order-1">
							<div class="flex items-center gap-2">
								<div class="size-7 bg-amber-400 text-black grid place-items-center rounded-md">
									<FileText size={14} />
								</div>
								<span class="text-xs font-bold text-white/40 uppercase tracking-widest">Gid PDF</span>
							</div>

							<h1 class="text-3xl sm:text-4xl lg:text-5xl font-black leading-tight tracking-tight">
								{ebook.title}
							</h1>

							<p class="text-white/60 text-base leading-relaxed max-w-lg">
								{ebook.description}
							</p>

							<!-- What's included -->
							<div class="space-y-2">
								{#each ['Aksè imedyat apre peman', 'Fòma PDF ou ka telechaje', 'Kontni klè epi pratik', 'Sipò pa imèl enkli'] as feature}
									<div class="flex items-center gap-2.5 text-sm text-white/60">
										<CheckCircle2 size={15} class="text-emerald-400 shrink-0" />
										{feature}
									</div>
								{/each}
							</div>

							<!-- Stats -->
							<div class="flex items-center gap-5 py-4 border-y border-white/10">
								<div class="flex items-center gap-1.5 text-sm text-white/50">
									<ShoppingBag size={15} class="text-white/30" />
									<span class="font-semibold text-white">{ebook.salesCount}</span> vant
								</div>
								<div class="flex items-center gap-1.5 text-sm text-white/50">
									<Download size={15} class="text-white/30" />
									Fòma PDF
								</div>
							</div>

							<!-- Price + CTA -->
							<div class="flex flex-col sm:flex-row items-start sm:items-center gap-4">
								<div>
									{#if ebook.isFree || ebook.price === 0}
										<span class="text-4xl font-black text-emerald-400">Gratis</span>
									{:else}
										<span class="text-4xl font-black text-white">{ebook.price.toLocaleString('fr-FR')}</span>
										<span class="text-white/40 text-sm font-medium ml-1">HTG</span>
										{#if ebook.priceUsd && ebook.priceUsd > 0}
											<span class="text-4xl font-black text-amber-400 ml-2">(${ebook.priceUsd} USD)</span>
										{/if}
									{/if}
								</div>
								<button
									type="button"
									disabled={checkoutLoading}
									onclick={handleBuyClick}
									class="inline-flex items-center justify-center gap-2 h-14 px-10 bg-amber-400 hover:bg-amber-300 text-black font-black text-sm transition-colors shadow-xl shadow-amber-500/20 cursor-pointer disabled:opacity-50"
								>
									<Download size={17} />
									{#if checkoutLoading}
										<span>Chajman...</span>
									{:else if ebook.isFree || ebook.price === 0}
										Telechaje gratis
									{:else}
										Achte ebook sa a
									{/if}
								</button>
							</div>
						</div>

						<!-- Right: Book cover -->
						<div class="order-1 lg:order-2 flex justify-center lg:justify-end">
							<div class="relative" style="max-width: 280px; width: 100%;">
								<!-- Book shadow effect -->
								<div class="absolute inset-0 translate-x-3 translate-y-3 bg-amber-400/20 rounded-2xl blur-sm"></div>
								<div class="relative rounded-2xl overflow-hidden shadow-2xl border border-white/10" style="aspect-ratio: 3/4;">
									{#if ebook.cover}
										<img
											src={ebook.cover}
											alt={ebook.title}
											class="w-full h-full object-cover"
										/>
									{:else}
										<div class="w-full h-full flex flex-col items-center justify-center gap-4 bg-gradient-to-br from-zinc-700 to-zinc-800">
											<FileText size={48} class="text-zinc-500" />
											<span class="text-zinc-400 font-bold text-sm">PDF</span>
										</div>
									{/if}
									<!-- Overlay badge -->
									<div class="absolute top-4 right-4 px-2.5 py-1 bg-amber-400 text-black text-[10px] font-black uppercase tracking-widest rounded-full">
										PDF
									</div>
								</div>
							</div>
						</div>

					</div>
				</div>
			</section>

			<!-- Description section -->
			<section class="py-14 bg-white border-b border-zinc-100">
				<div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
					<div>
						<h2 class="text-xl font-black text-zinc-950 mb-4 tracking-tight">Konsènan ebook sa a</h2>
						<p class="text-zinc-500 text-sm leading-relaxed">
							{ebook.description} Gid sa a fèt pou w ka aplike l dirèkteman: chak seksyon ba w zouti, egzanp ak etap konkrè pou w avanse byen vit.
						</p>
					</div>

					<!-- Feature grid -->
					<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
						{#each [
							{ icon: '📄', title: 'Fòma PDF', desc: 'Konpatib ak ordinatè, tablèt ak telefòn' },
							{ icon: '⚡', title: 'Aksè imedyat', desc: 'Telechajman osito peman an konfime' },
							{ icon: '🎯', title: 'Kontni pratik', desc: 'Eksèsis ak ka pratik enkli' },
							{ icon: '🔄', title: 'Mizajou gratis', desc: 'Nouvèl vèsyon enkli pou tout tan' }
						] as feat}
							<div class="flex items-start gap-4 p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
								<span class="text-2xl shrink-0">{feat.icon}</span>
								<div>
									<p class="font-black text-sm text-zinc-950">{feat.title}</p>
									<p class="text-xs text-zinc-400 mt-0.5">{feat.desc}</p>
								</div>
							</div>
						{/each}
					</div>
				</div>
			</section>

			<!-- CTA Bottom -->
			<section class="py-14 bg-zinc-950 text-white text-center">
				<div class="max-w-xl mx-auto px-4 space-y-5">
					<h2 class="text-2xl sm:text-3xl font-black tracking-tight">{ebook.title}</h2>
					<p class="text-white/50 text-sm leading-relaxed">{ebook.description}</p>
					<div class="flex flex-col sm:flex-row items-center justify-center gap-4">
						{#if ebook.isFree || ebook.price === 0}
							<span class="text-3xl font-black text-emerald-400">Gratis</span>
						{:else}
							<span class="text-3xl font-black">{ebook.price.toLocaleString('fr-FR')} HTG {#if ebook.priceUsd && ebook.priceUsd > 0}(${ebook.priceUsd} USD){/if}</span>
						{/if}
						<button
							type="button"
							disabled={checkoutLoading}
							onclick={handleBuyClick}
							class="inline-flex items-center gap-2 px-8 py-3.5 bg-amber-400 hover:bg-amber-300 text-black font-black text-sm transition-colors cursor-pointer disabled:opacity-50"
						>
							<Download size={15} />
							{ebook.isFree || ebook.price === 0 ? 'Telechaje gratis' : 'Achte kounye a'}
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

{#if ebook}
	<PaymentMethodModal
		open={showPaymentModal}
		productTitle={ebook.title}
		amount={ebook.price}
		amountUsd={ebook.priceUsd}
		isFree={ebook.isFree || ebook.price === 0}
		loading={checkoutLoading}
		onSelectMethod={handleSelectPaymentMethod}
		onClose={() => (showPaymentModal = false)}
	/>
{/if}
