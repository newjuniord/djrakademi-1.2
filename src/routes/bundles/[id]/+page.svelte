<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import PublicHeader from '$lib/components/PublicHeader.svelte';
	import PublicFooter from '$lib/components/PublicFooter.svelte';
	import PaymentMethodModal from '$lib/components/PaymentMethodModal.svelte';
	import { getBundleById, ownsBundle, type Bundle } from '$lib/services/bundles';
	import { initiatePlopplopPayment, verifyLemonSqueezyPurchase } from '$lib/services/payments';
	import { authState } from '$lib/auth.svelte';
	import { toast } from '$lib/toast.svelte';
	import {
		ArrowLeft,
		ArrowRight,
		BookOpen,
		FileText,
		Layers3,
		CheckCircle2,
		LockKeyhole,
		ChevronDown,
		ChevronUp,
		PlayCircle,
		ExternalLink
	} from 'lucide-svelte';

	let bundle = $state<Bundle | null>(null);
	let loading = $state(true);
	let error = $state('');
	let checkoutLoading = $state(false);
	let showPaymentModal = $state(false);
	let expandedItems = $state<Record<string, boolean>>({});

	onMount(async () => {
		try {
			bundle = await getBundleById(page.params.id || '');
		} catch {
			error = 'Nou pa ka chaje bundle sa a.';
		} finally {
			loading = false;
		}
	});

	function toggleItem(id: string) {
		expandedItems[id] = !expandedItems[id];
	}

	async function startCheckout() {
		if (!bundle || checkoutLoading) return;
		if (!authState.user) {
			toast.info('Tanpri konekte pou w achte bundle sa a.');
			authState.openLogin(startCheckout);
			return;
		}
		checkoutLoading = true;
		try {
			// 1. Vérifier si l'utilisateur possède déjà l'intégralité des produits du bundle dans Appwrite
			const fullyOwned = await ownsBundle(bundle);
			if (fullyOwned) {
				toast.info('Ou gen tout fòmasyon ak ebook ki nan pak sa a deja! N ap redirije w nan espas ou an.');
				goto('/dashboard');
				return;
			}

			// 2. Vérification Lemon Squeezy Pré-Checkout
			try {
				const verification = await verifyLemonSqueezyPurchase(authState.user.email, 'bundle', bundle.id);
				if (verification.ok && verification.success) {
					toast.success(verification.message, 5000);
					setTimeout(() => goto('/dashboard'), 1800);
					return;
				}
			} catch (err) {
				console.warn('[Checkout] Lemon Squeezy precheck failed, fallback to payment modal:', err);
			}
			showPaymentModal = true;
		} catch (caught) {
			console.error('Bundle purchase precheck error:', caught);
			showPaymentModal = true;
		} finally {
			checkoutLoading = false;
		}
	}

	async function selectMethod(method: 'moncash' | 'natcash' | 'carte' | 'plopplop_carte') {
		if (!bundle || checkoutLoading) return;
		if (!authState.user) {
			showPaymentModal = false;
			toast.info('Tanpri konekte pou w kontinye peman an.');
			authState.openLogin(startCheckout);
			return;
		}
		checkoutLoading = true;
		try {
			const result = await initiatePlopplopPayment({
				userId: authState.user.$id,
				customerName: authState.user.name || 'Client',
				customerEmail: authState.user.email,
				productType: 'bundle',
				productId: bundle.id,
				productTitle: bundle.title,
				amount: bundle.price,
				paymentMethod: method
			});
			const target = result.url || result.redirectUrl;
			if (result.success && target) {
				window.location.href = target;
				return;
			} else {
				toast.error(result.message || 'Nou pa ka lanse peman an.');
			}
		} catch (caught) {
			toast.error(caught instanceof Error ? caught.message : 'Erè pandan peman an.');
		} finally {
			checkoutLoading = false;
		}
	}
</script>

<svelte:head>
	<title>{bundle ? `${bundle.title} · Bundles DJR Akademi` : 'Bundle · DJR Akademi'}</title>
	<meta name="description" content={bundle?.description || 'Bundle fòmasyon ak e-books DJR Akademi.'} />
</svelte:head>

<div class="flex min-h-screen flex-col bg-zinc-50 text-zinc-950">
	<PublicHeader />

	<main class="flex-1">
		{#if loading}
			<div class="mx-auto max-w-7xl px-4 py-24 text-center text-zinc-500">
				N ap chaje bundle la…
			</div>
		{:else if !bundle}
			<div class="mx-auto max-w-7xl px-4 py-24 text-center">
				<h1 class="text-2xl font-black">Bundle introuvable</h1>
				<p class="mt-2 text-zinc-500">{error || 'Pak sa a pa disponib ankò.'}</p>
				<a href="/bundles" class="mt-6 inline-block font-bold text-amber-700">
					Gade bundles yo
				</a>
			</div>
		{:else}
			<!-- Hero Header -->
			<section class="bg-zinc-950 px-4 py-12 text-white sm:py-16">
				<div class="mx-auto max-w-7xl">
					<a href="/bundles" class="mb-8 inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white">
						<ArrowLeft size={16} /> Tout bundles yo
					</a>
					<div class="grid items-center gap-10 lg:grid-cols-2">
						<div>
							<div class="mb-4 inline-flex items-center gap-2 rounded-full bg-amber-400/15 px-3 py-1.5 text-xs font-black uppercase text-amber-400">
								<Layers3 size={15} /> {bundle.items.length} resous nan yon sèl pak
							</div>
							<h1 class="text-4xl font-black tracking-tight sm:text-5xl">{bundle.title}</h1>
							<p class="mt-5 max-w-xl whitespace-pre-line text-base leading-relaxed text-zinc-300">
								{bundle.description}
							</p>
							<div class="mt-7 flex flex-wrap gap-4 text-xs font-bold text-zinc-300">
								<span class="inline-flex items-center gap-2">
									<CheckCircle2 size={17} class="text-amber-400" /> Yon sèl peman
								</span>
								<span class="inline-flex items-center gap-2">
									<CheckCircle2 size={17} class="text-amber-400" /> Aksè nan espas ou
								</span>
							</div>
						</div>

						<div class="overflow-hidden rounded-3xl border border-white/10 bg-zinc-900 shadow-2xl">
							{#if bundle.cover}
								<img src={bundle.cover} alt={bundle.title} class="aspect-[16/10] w-full object-cover" />
							{:else}
								<div class="grid aspect-[16/10] place-items-center bg-gradient-to-br from-zinc-800 to-amber-900">
									<Layers3 size={72} class="text-amber-400" />
								</div>
							{/if}
						</div>
					</div>
				</div>
			</section>

			<!-- Content & Pricing Grid -->
			<section class="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:px-8 lg:py-16">
				<div>
					<h2 class="text-2xl font-black">Sa bundle la gen ladan l</h2>
					<p class="mt-2 text-sm text-zinc-500">
						Chak resous ap parèt apa nan espas ou apre peman an. Klike sou yon fòmasyon pou w gade leçons li yo.
					</p>

					<!-- Items List -->
					<div class="mt-6 space-y-4">
						{#each bundle.items as item (item.id)}
							{@const isCourse = item.type === 'course'}
							{@const isExpanded = Boolean(expandedItems[item.id])}
							{@const totalLessonsCount = isCourse && item.modules
								? item.modules.reduce((sum, m) => sum + (m.lessons?.length || 0), 0)
								: 0}
							<div class="rounded-2xl border border-zinc-200 bg-white p-3.5 sm:p-4.5 transition-all hover:border-amber-400/80 shadow-xs min-w-0">
								<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 min-w-0">
									<div class="flex items-center gap-3.5 min-w-0 flex-1">
										<div class="grid size-12 sm:size-14 shrink-0 place-items-center overflow-hidden rounded-xl bg-zinc-100 border border-zinc-200/60">
											{#if item.cover}
												<img src={item.cover} alt={item.title} class="h-full w-full object-cover" />
											{:else if isCourse}
												<BookOpen size={22} class="text-amber-600" />
											{:else}
												<FileText size={22} class="text-emerald-600" />
											{/if}
										</div>

										<div class="min-w-0 flex-1">
											<div class="flex flex-wrap items-center gap-1.5 sm:gap-2">
												<span class="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-zinc-400">
													{isCourse ? 'Fòmasyon videyo' : 'E-book PDF'}
												</span>
												{#if isCourse && totalLessonsCount > 0}
													<span class="rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
														{totalLessonsCount} leçons
													</span>
												{/if}
											</div>
											<h3 class="font-bold text-zinc-950 text-sm sm:text-base leading-snug break-words">
												{item.title}
											</h3>
										</div>
									</div>

									<div class="flex items-center justify-between sm:justify-end gap-2 shrink-0 pt-2.5 sm:pt-0 border-t sm:border-t-0 border-zinc-100">
										{#if isCourse}
											<button
												type="button"
												onclick={() => toggleItem(item.id)}
												class="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-1.5 sm:px-3.5 sm:py-2 text-xs font-bold text-zinc-700 transition-colors hover:bg-zinc-100 hover:text-zinc-950 cursor-pointer"
											>
												<span>{isExpanded ? 'Masye leson' : 'Gade leson'}</span>
												{#if isExpanded}
													<ChevronUp size={15} class="text-amber-600" />
												{:else}
													<ChevronDown size={15} class="text-zinc-500" />
												{/if}
											</button>
										{/if}

										<a
											href={isCourse ? `/cours/${item.id}` : `/ebooks/${item.id}`}
											title="Gade paj la"
											class="inline-flex size-8.5 sm:size-9 items-center justify-center rounded-xl bg-zinc-100 text-zinc-600 transition-colors hover:bg-amber-400 hover:text-zinc-950"
										>
											<ArrowRight size={16} />
										</a>
									</div>
								</div>

								<!-- Expanded Accordion Content for Course Lessons -->
								{#if isCourse && isExpanded}
									<div class="mt-4 pt-4 border-t border-zinc-100 space-y-4">
										{#if item.modules && item.modules.length > 0}
											<div class="space-y-3">
												{#each item.modules as module, mIdx (module.id || mIdx)}
													<div class="rounded-xl bg-zinc-50/80 p-3.5 border border-zinc-100 space-y-2">
														<div class="flex items-center justify-between text-xs font-bold text-zinc-800">
															<span class="flex items-center gap-2">
																<span class="size-2 rounded-full bg-amber-500"></span>
																{module.title}
															</span>
															<span class="text-[11px] font-semibold text-zinc-400">
																{module.lessons?.length || 0} leçons
															</span>
														</div>

														{#if module.lessons && module.lessons.length > 0}
															<div class="space-y-1.5 pl-3 pt-1">
																{#each module.lessons as lesson (lesson.id)}
																	<div class="flex items-center gap-2 text-xs text-zinc-600">
																		{#if lesson.type === 'video'}
																			<PlayCircle size={14} class="text-amber-600 shrink-0" />
																		{:else}
																			<FileText size={14} class="text-blue-600 shrink-0" />
																		{/if}
																		<span class="truncate font-medium">{lesson.title}</span>
																	</div>
																{/each}
															</div>
														{/if}
													</div>
												{/each}
											</div>
										{:else}
											<div class="py-3 text-center text-xs text-zinc-400 italic bg-zinc-50 rounded-xl">
												Program leçons yo ap disponib nan espas ou apre peman an.
											</div>
										{/if}
									</div>
								{/if}
							</div>
						{/each}
					</div>
				</div>

				<!-- Checkout Sidebar Card -->
				<aside class="h-fit rounded-3xl border border-zinc-200 bg-white p-6 shadow-lg lg:sticky lg:top-28">
					<p class="text-xs font-bold uppercase tracking-wider text-zinc-500">Pri espesyal bundle</p>
					<div class="mt-2 flex items-baseline gap-3">
						<strong class="text-3xl font-black">{bundle.price.toLocaleString('fr-FR')} HTG</strong>
					</div>

					{#if bundle.originalPrice > bundle.price}
						<p class="mt-1 text-sm text-zinc-400 line-through">
							{bundle.originalPrice.toLocaleString('fr-FR')} HTG separeman
						</p>
						<p class="mt-2 text-sm font-bold text-emerald-700">
							Ou ekonomize {(bundle.originalPrice - bundle.price).toLocaleString('fr-FR')} HTG
						</p>
					{/if}

					<button
						type="button"
						onclick={startCheckout}
						disabled={checkoutLoading}
						class="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-amber-400 px-5 py-4 text-sm font-black text-zinc-950 transition-colors hover:bg-amber-300 disabled:opacity-50 cursor-pointer"
					>
						{checkoutLoading ? 'N ap prepare peman an…' : 'Achte bundle la'}
						<ArrowRight size={18} />
					</button>

					<p class="mt-4 flex items-start gap-2 text-xs leading-relaxed text-zinc-500">
						<LockKeyhole size={15} class="mt-0.5 shrink-0" />
						Peman sekirize. Aksè yo aktive apre konfimasyon.
					</p>
				</aside>
			</section>
		{/if}
	</main>

	<PublicFooter />
</div>

<PaymentMethodModal
	open={showPaymentModal}
	productTitle={bundle?.title || ''}
	amount={bundle?.price || 0}
	amountUsd={bundle?.priceUsd || undefined}
	cardEnabled={Boolean(bundle?.variantId && bundle?.priceUsd)}
	loading={checkoutLoading}
	onSelectMethod={selectMethod}
	onClose={() => (showPaymentModal = false)}
/>
