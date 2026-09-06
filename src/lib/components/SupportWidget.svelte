<script lang="ts">
	import { onMount } from 'svelte';
	import { authState } from '$lib/auth.svelte';
	import { toast } from '$lib/toast.svelte';
	import {
		MessageSquare,
		X,
		CheckCircle2,
		Clock,
		AlertCircle,
		Send,
		Sparkles,
		Loader2,
		MessageCircle,
		ChevronLeft,
		ShoppingBag,
		ArrowRight
	} from 'lucide-svelte';
	import {
		fetchUserSupportStatus,
		submitUserSupportMessage,
		type ExtendedSupportStatusResponse,
		type UserSupportOrder
	} from '$lib/services/support';
	import type { SupportMessage, SupportPreset } from '$lib/types/support';

	let open = $state(false);
	let loading = $state(false);
	let submitting = $state(false);
	let statusData = $state<ExtendedSupportStatusResponse | null>(null);

	let selectedOrderId = $state<string>('');
	let selectedPresetId = $state<string>('');
	let whatsappNumber = $state<string>('');

	// Tab: 'new' ou 'history'
	let activeTab = $state<'new' | 'history'>('new');

	// Étapes wizard 1 par 1
	let currentStep = $state<1 | 2 | 3>(1);

	async function loadStatus() {
		if (!authState.user) { statusData = null; return; }
		loading = true;
		try {
			const res = await fetchUserSupportStatus();
			statusData = res;
			if (res && res.messages && res.messages.length > 0 && activeTab === 'new') {
				const lastWa = res.messages.find((m) => m.whatsapp)?.whatsapp;
				if (lastWa && !whatsappNumber) whatsappNumber = lastWa;
			}
		} catch (e) {
			console.error('Failed to load support status:', e);
		} finally {
			loading = false;
		}
	}

	onMount(() => { if (authState.user) loadStatus(); });

	$effect(() => {
		if (authState.user && open && !statusData && !loading) loadStatus();
	});

	function toggleWidget() {
		if (!authState.user) {
			toast.info('Tanpri konekte sou kont ou pou w ka sèvi ak asistans sipò an.');
			authState.openLogin(() => { open = true; loadStatus(); });
			return;
		}
		open = !open;
		if (open) loadStatus();
	}

	const selectedOrder = $derived<UserSupportOrder | undefined>(
		statusData?.orders?.find((o) => o.id === selectedOrderId)
	);

	const selectedPreset = $derived<SupportPreset | undefined>(
		statusData?.presets?.find((p) => p.id === selectedPresetId)
	);

	const requiresWhatsapp = $derived(
		Boolean(selectedPreset?.requiresWhatsapp || selectedOrder?.productType === 'coaching')
	);

	function resetForm() {
		selectedOrderId = '';
		selectedPresetId = '';
		currentStep = 1;
	}

	async function handleSubmit() {
		if (!selectedPresetId) { toast.error('Tanpri chwazi yon mesaj sipò.'); return; }
		if (requiresWhatsapp && (!whatsappNumber || whatsappNumber.trim().length < 8)) {
			toast.error('Tanpri mete yon nimewo WhatsApp valid.');
			return;
		}
		if (statusData && statusData.dailyQuota.remaining <= 0) {
			toast.error('Ou rive nan limit 3 mesaj sipò pou jodi a.');
			return;
		}

		submitting = true;
		try {
			const res = await submitUserSupportMessage({
				presetId: selectedPresetId,
				orderId: selectedOrderId || undefined,
				whatsapp: whatsappNumber.trim() || undefined
			});
			if (res.success && res.message) {
				toast.success('Mesaj sipò w la voye ak siksè!');
				resetForm();
				activeTab = 'history';
				await loadStatus();
			} else {
				toast.error(res.error || 'Nou pa ka voye mesaj la. Tanpri re-eseye.');
			}
		} catch (err: any) {
			toast.error(err.message || 'Yon erè rive pandan envoi an.');
		} finally {
			submitting = false;
		}
	}

	function getStatusBadge(status: string) {
		switch (status) {
			case 'resolved': return { text: 'Résolu', emoji: '✅', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
			case 'in_progress': return { text: 'En cours', emoji: '🔄', color: 'bg-blue-50 text-blue-700 border-blue-200' };
			default: return { text: 'En attente', emoji: '⏳', color: 'bg-amber-50 text-amber-700 border-amber-200' };
		}
	}

	function formatDate(iso: string) {
		try {
			return new Intl.DateTimeFormat('fr-FR', {
				day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
			}).format(new Date(iso));
		} catch { return iso; }
	}

	// Emoji par type de produit
	function productEmoji(type: string) {
		if (type === 'coaching') return '🎯';
		if (type === 'ebook') return '📖';
		if (type === 'course') return '🎓';
		return '📦';
	}

	// Couleur badge status commande
	function orderStatusColor(status: string) {
		if (status === 'paid') return 'bg-emerald-100 text-emerald-700';
		if (status === 'pending') return 'bg-amber-100 text-amber-700';
		if (status === 'failed') return 'bg-red-100 text-red-700';
		return 'bg-zinc-100 text-zinc-600';
	}

	// Quota indicator color
	const quotaColor = $derived(
		statusData
			? statusData.dailyQuota.remaining > 1
				? 'text-emerald-600'
				: statusData.dailyQuota.remaining === 1
					? 'text-amber-600'
					: 'text-red-600'
			: ''
	);
</script>

<!-- ─── Bouton flottant ─────────────────────────────────────── -->
<div class="fixed bottom-6 right-6 z-40">
	<button
		type="button"
		onclick={toggleWidget}
		class="group flex items-center gap-2 px-4 py-3 rounded-full bg-zinc-950 text-white text-sm font-semibold shadow-xl hover:shadow-zinc-900/40 hover:bg-zinc-800 transition-all duration-200 hover:scale-105 active:scale-95 border border-white/10 cursor-pointer"
		aria-label="Ouvrir le support"
	>
		<div class="relative">
			<MessageSquare size={18} class="text-amber-400" />
			{#if statusData?.messages?.some((m) => m.status === 'open')}
				<span class="absolute -top-1 -right-1 size-2 rounded-full bg-red-500 animate-ping"></span>
				<span class="absolute -top-1 -right-1 size-2 rounded-full bg-red-500"></span>
			{/if}
		</div>
		<span>Sipò Asistans</span>
	</button>
</div>

<!-- ─── Modal ──────────────────────────────────────────────── -->
{#if open}
	<!-- Backdrop -->
	<div
		class="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4"
		role="dialog"
		aria-modal="true"
		aria-labelledby="support-title"
		onclick={(e) => { if (e.target === e.currentTarget) open = false; }}
	>
		<!-- Panel -->
		<div
			class="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col"
			style="max-height: 92dvh;"
		>

			<!-- ── En-tête ── -->
			<div class="flex items-center justify-between px-5 pt-5 pb-4 border-b border-zinc-100 shrink-0">
				<div class="flex items-center gap-3">
					<div class="size-9 rounded-2xl bg-amber-400 grid place-items-center shrink-0">
						<Sparkles size={17} class="text-black" />
					</div>
					<div>
						<h2 id="support-title" class="text-base font-bold text-zinc-900 leading-tight">
							Sipò Rapid DJR
						</h2>
						<p class="text-xs text-zinc-400 mt-0.5">Asistans pou tranzaksyon & sèvis ou yo</p>
					</div>
				</div>
				<button
					type="button"
					onclick={() => (open = false)}
					class="size-8 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-500 grid place-items-center transition-colors cursor-pointer"
					aria-label="Fermer"
				>
					<X size={16} />
				</button>
			</div>

			<!-- ── Tabs ── -->
			<div class="flex border-b border-zinc-100 shrink-0">
				<button
					type="button"
					onclick={() => (activeTab = 'new')}
					class="flex-1 py-3 text-sm font-semibold transition-all cursor-pointer border-b-2 {activeTab === 'new'
						? 'border-amber-400 text-zinc-900'
						: 'border-transparent text-zinc-400 hover:text-zinc-600'}"
				>
					✉️ Nouvelle demann
				</button>
				<button
					type="button"
					onclick={() => (activeTab = 'history')}
					class="flex-1 py-3 text-sm font-semibold transition-all cursor-pointer border-b-2 relative {activeTab === 'history'
						? 'border-amber-400 text-zinc-900'
						: 'border-transparent text-zinc-400 hover:text-zinc-600'}"
				>
					🕐 Istwa
					{#if statusData?.messages?.length}
						<span class="ml-1 px-1.5 py-0.5 text-[10px] font-bold bg-zinc-100 text-zinc-600 rounded-full">
							{statusData.messages.length}
						</span>
					{/if}
				</button>
			</div>

			<!-- ── Corps scrollable ── -->
			<div class="overflow-y-auto flex-1 px-5 py-4">

				{#if loading}
					<!-- Chargement -->
					<div class="py-16 text-center text-zinc-400 space-y-3">
						<Loader2 size={28} class="mx-auto animate-spin text-zinc-300" />
						<p class="text-sm">Ap chèche done yo…</p>
					</div>

				{:else if !statusData?.eligible}
					<!-- Non éligible -->
					<div class="py-10 text-center space-y-3">
						<div class="size-14 rounded-full bg-amber-50 grid place-items-center mx-auto">
							<ShoppingBag size={24} class="text-amber-500" />
						</div>
						<h3 class="font-bold text-zinc-900">Okenn kòmande jwenn</h3>
						<p class="text-sm text-zinc-500 leading-relaxed max-w-xs mx-auto">
							Sipò sa a disponib sèlman pou moun ki gen yon tranzaksyon aktif (kou, ebook, oubyen coaching).
						</p>
					</div>

				{:else if activeTab === 'new'}
					<!-- ═══════════════════════════════════
					     WIZARD NOUVELLE DEMANDE
					     ═══════════════════════════════════ -->

					<!-- Quota banner -->
					{#if statusData}
						<div class="mb-4 flex items-center justify-between text-xs px-3 py-2 bg-zinc-50 rounded-xl border border-zinc-100">
							<span class="text-zinc-500">Mesaj jodi a :</span>
							<span class="font-bold {quotaColor}">
								{statusData.dailyQuota.remaining} / {statusData.dailyQuota.max} ki rete
							</span>
						</div>
					{/if}

					{#if statusData && statusData.dailyQuota.remaining <= 0}
						<!-- Quota épuisé -->
						<div class="p-4 bg-red-50 border border-red-100 rounded-2xl text-sm text-red-700 text-center space-y-1">
							<p class="font-bold">🚫 Limit atenn pou jodi a</p>
							<p class="text-xs text-red-500">Ou voye 3 mesaj sipò jodi a. Re-eseye demen.</p>
						</div>

					{:else}

						<!-- ─ ÉTAPE 1 : Choisir commande ─ -->
						{#if currentStep === 1}
							<div class="space-y-3">
								<p class="text-sm font-bold text-zinc-900 mb-3">
									Chwazi kòmande ki gen pwoblèm nan :
								</p>

								{#if statusData?.orders && statusData.orders.length > 0}
									<div class="space-y-2.5">
										{#each statusData.orders as order (order.id)}
											<button
												type="button"
												onclick={() => { selectedOrderId = order.id; }}
												class="w-full text-left p-4 rounded-2xl border-2 transition-all duration-150 cursor-pointer active:scale-[0.99] flex items-center gap-3
													{selectedOrderId === order.id
														? 'border-amber-400 bg-amber-50'
														: 'border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50'}"
											>
												<!-- Radio circle -->
												<div class="size-5 rounded-full border-2 shrink-0 grid place-items-center transition-all
													{selectedOrderId === order.id
														? 'border-amber-500 bg-amber-500'
														: 'border-zinc-300 bg-white'}">
													{#if selectedOrderId === order.id}
														<div class="size-2 rounded-full bg-white"></div>
													{/if}
												</div>

												<!-- Emoji produit -->
												<span class="text-xl shrink-0">{productEmoji(order.productType)}</span>

												<!-- Infos -->
												<div class="flex-1 min-w-0">
													<p class="font-semibold text-zinc-900 text-sm truncate">{order.productTitle}</p>
													<div class="flex items-center gap-2 mt-0.5">
														<span class="text-xs text-zinc-500">{order.amount} HTG</span>
														<span class="px-1.5 py-0.5 rounded-md text-[10px] font-bold uppercase {orderStatusColor(order.status)}">
															{order.status}
														</span>
													</div>
													{#if order.createdAt}
														<p class="text-[11px] text-zinc-400 mt-0.5">{formatDate(order.createdAt)}</p>
													{/if}
												</div>
											</button>
										{/each}
									</div>
								{/if}


								<!-- Bouton Kontinye étape 1 -->
								{#if selectedOrderId}
									<button
										type="button"
										onclick={() => { currentStep = 2; }}
										class="w-full h-12 mt-1 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.99]"
									>
										Kontinye ➔
									</button>
								{/if}
							</div>

						<!-- ─ ÉTAPE 2 : Choisir préset ─ -->
						{:else if currentStep === 2}
							<div class="space-y-3">
								<!-- Retour + résumé commande -->
								<div class="flex items-center justify-between mb-3">
									<button
										type="button"
										onclick={() => (currentStep = 1)}
										class="flex items-center gap-1 text-xs font-semibold text-zinc-500 hover:text-zinc-900 transition-colors cursor-pointer"
									>
										<ChevronLeft size={14} />
										Retounen
									</button>
									<div class="text-xs text-zinc-400 font-medium truncate max-w-[200px] text-right">
										{selectedOrder ? selectedOrder.productTitle : 'Kesyon jeneral'}
									</div>
								</div>

								<p class="text-sm font-bold text-zinc-900 mb-3">
									Ki pwoblèm ou an ?
								</p>

								<div class="space-y-2.5">
									{#each statusData?.presets ?? [] as preset (preset.id)}
										<button
											type="button"
											onclick={() => { selectedPresetId = preset.id; }}
											class="w-full text-left p-4 rounded-2xl border-2 transition-all duration-150 cursor-pointer active:scale-[0.99] flex items-start gap-3
												{selectedPresetId === preset.id
													? 'border-amber-400 bg-amber-50'
													: 'border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50'}"
										>
											<!-- Radio circle -->
											<div class="size-5 rounded-full border-2 shrink-0 mt-0.5 grid place-items-center transition-all
												{selectedPresetId === preset.id
													? 'border-amber-500 bg-amber-500'
													: 'border-zinc-300 bg-white'}">
												{#if selectedPresetId === preset.id}
													<div class="size-2 rounded-full bg-white"></div>
												{/if}
											</div>

											<!-- Texte -->
											<div class="flex-1 min-w-0">
												<p class="font-semibold text-zinc-900 text-sm leading-snug">{preset.label}</p>
												{#if preset.description}
													<p class="text-xs text-zinc-400 mt-0.5 leading-relaxed">{preset.description}</p>
												{/if}
											</div>
										</button>
									{/each}
								</div>

								<!-- Bouton Kontinye étape 2 -->
								{#if selectedPresetId}
									<button
										type="button"
										onclick={() => { currentStep = 3; }}
										class="w-full h-12 mt-1 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.99]"
									>
										Kontinye ➔
									</button>
								{/if}
							</div>

						<!-- ─ ÉTAPE 3 : WhatsApp + Confirmation ─ -->
						{:else if currentStep === 3}
							<div class="space-y-4">
								<!-- Résumé -->
								<div class="flex items-center justify-between mb-1">
									<button
										type="button"
										onclick={() => (currentStep = 2)}
										class="flex items-center gap-1 text-xs font-semibold text-zinc-500 hover:text-zinc-900 transition-colors cursor-pointer"
									>
										<ChevronLeft size={14} />
										Chanje mesaj
									</button>
								</div>

								<!-- Card résumé -->
								<div class="p-4 bg-zinc-50 rounded-2xl border border-zinc-100 space-y-1.5 text-sm">
									<div class="flex items-start gap-2">
										<CheckCircle2 size={16} class="text-emerald-500 mt-0.5 shrink-0" />
										<div>
											<p class="font-semibold text-zinc-900">{selectedPreset?.label}</p>
											{#if selectedOrder}
												<p class="text-xs text-zinc-500 mt-0.5">
													{productEmoji(selectedOrder.productType)} {selectedOrder.productTitle}
												</p>
											{/if}
										</div>
									</div>
								</div>

								<!-- WhatsApp input -->
								<div class="space-y-2">
									<label for="support-whatsapp" class="flex items-center justify-between text-sm font-semibold text-zinc-800">
										<span class="flex items-center gap-1.5">
											<MessageCircle size={15} class="text-emerald-500" />
											Nimewo WhatsApp ou
										</span>
										{#if requiresWhatsapp}
											<span class="text-[10px] font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full">Obligatwa</span>
										{:else}
											<span class="text-[10px] text-zinc-400">Opsyonèl</span>
										{/if}
									</label>
									<input
										id="support-whatsapp"
										type="tel"
										placeholder="+509 XXXX-XXXX"
										bind:value={whatsappNumber}
										class="w-full text-sm bg-white border-2 border-zinc-200 focus:border-amber-400 rounded-xl px-4 py-3 focus:outline-none transition-colors font-mono"
									/>
									<p class="text-xs text-zinc-400 leading-relaxed">
										La pifò pwoblèm rezoud otomatikman nan <span class="font-semibold text-zinc-500">72h</span>. Si ou mete nimewo WhatsApp ou, ekip la ka kontakte w si li nesesè.
									</p>
								</div>

								<!-- Bouton Envoyer -->
								<button
									type="button"
									disabled={submitting || !selectedPresetId || (statusData?.dailyQuota.remaining ?? 0) <= 0}
									onclick={handleSubmit}
									class="w-full h-13 rounded-2xl bg-amber-400 hover:bg-amber-300 active:scale-[0.99] text-zinc-900 font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
								>
									{#if submitting}
										<Loader2 size={18} class="animate-spin" />
										<span>N ap voye…</span>
									{:else}
										<Send size={16} />
										<span>Voye Demann Lan 🚀</span>
									{/if}
								</button>
							</div>
						{/if}
					{/if}

				{:else}
					<!-- ═══════════════════════════════════
					     HISTORIQUE
					     ═══════════════════════════════════ -->
					{#if !statusData?.messages?.length}
						<div class="py-14 text-center space-y-2 text-zinc-400">
							<Clock size={28} class="mx-auto text-zinc-200" />
							<p class="text-sm">Ou pa voye okenn demann ankò.</p>
						</div>
					{:else}
						<div class="space-y-3">
							{#each statusData.messages as message (message.id)}
								{@const badge = getStatusBadge(message.status)}
								<div class="p-4 rounded-2xl border border-zinc-100 bg-zinc-50/60 space-y-2.5">
									<div class="flex items-center justify-between gap-2">
										<span class="px-2.5 py-1 rounded-full text-xs font-semibold border {badge.color}">
											{badge.emoji} {badge.text}
										</span>
										<span class="text-xs text-zinc-400">{formatDate(message.createdAt)}</span>
									</div>

									<div>
										<p class="font-semibold text-zinc-900 text-sm">{message.presetLabel}</p>
										{#if message.productTitle}
											<p class="text-xs text-zinc-500 mt-0.5">📦 {message.productTitle}</p>
										{/if}
										{#if message.whatsapp}
											<p class="text-xs text-emerald-600 mt-0.5 flex items-center gap-1">
												<MessageCircle size={11} />
												{message.whatsapp}
											</p>
										{/if}
									</div>

									{#if message.adminReply}
										<div class="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-xs space-y-1">
											<p class="font-bold text-emerald-800 flex items-center gap-1">
												<Sparkles size={11} class="text-emerald-600" />
												Repons Ekip Sipò :
											</p>
											<p class="text-emerald-900 leading-relaxed">{message.adminReply}</p>
										</div>
									{/if}
								</div>
							{/each}
						</div>
					{/if}
				{/if}

			</div>
			<!-- ─ Fin corps scrollable ─ -->

		</div>
	</div>
{/if}
