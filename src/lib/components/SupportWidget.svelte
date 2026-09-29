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
		ArrowRight,
		HelpCircle
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

	import { page } from '$app/state';

	// Étapes wizard 1 par 1
	let currentStep = $state<1 | 2 | 3>(1);

	let currentLang = $derived<'fr' | 'ht'>(page.url.searchParams.get('lang') === 'ht' ? 'ht' : 'fr');
	let buttonText = $derived(currentLang === 'ht' ? 'Asistans' : 'Assistance');

	const widgetI18n = {
		fr: {
			title: 'Assistance DJR',
			subtitle: 'Assistance pour vos transactions et services',
			close: 'Fermer',
			newRequest: '✉️ Nouvelle demande',
			history: '🕐 Historique',
			loading: 'Chargement des données…',
			noOrder: 'Aucune commande trouvée',
			noOrderHelp: 'Cette assistance est réservée aux personnes ayant une transaction active (cours, livre numérique ou consultation).',
			todayMessages: 'Messages aujourd’hui :',
			remaining: 'restants',
			quotaReached: '🚫 Limite atteinte pour aujourd’hui',
			quotaHelp: 'Vous avez envoyé 3 demandes aujourd’hui. Réessayez demain.',
			selectOrder: 'Choisissez la commande concernée :',
			continue: 'Continuer ➔',
			back: 'Retour',
			generalQuestion: 'Question générale',
			selectIssue: 'Quel est votre problème ?',
			changeMessage: 'Changer de message',
			whatsapp: 'Votre numéro WhatsApp',
			required: 'Obligatoire',
			optional: 'Facultatif',
			whatsappHelp: 'La plupart des problèmes se résolvent automatiquement en 72 h. Si vous indiquez votre numéro WhatsApp, l’équipe pourra vous contacter si nécessaire.',
			sending: 'Envoi en cours…',
			send: 'Envoyer la demande 🚀',
			noHistory: 'Vous n’avez encore envoyé aucune demande.',
			teamReply: 'Réponse de l’équipe d’assistance :',
			statusResolved: 'Résolu',
			statusProgress: 'En cours',
			statusPending: 'En attente',
			orderPaid: 'Payée',
			orderPending: 'En attente',
			orderFailed: 'Échouée',
			orderExpired: 'Expirée',
			loginToast: 'Veuillez vous connecter à votre compte pour utiliser le service d\'assistance.',
			errSelectPreset: 'Veuillez choisir un message d\'assistance.',
			errInvalidWhatsapp: 'Veuillez saisir un numéro WhatsApp valide.',
			errQuotaLimit: 'Vous avez atteint la limite de 3 messages d\'assistance pour aujourd\'hui.',
			successSend: 'Votre message d\'assistance a été envoyé avec succès !',
			errSendFailed: 'Impossible d\'envoyer le message. Veuillez réessayer.',
			errGeneric: 'Une erreur est survenue lors de l\'envoi.'
		},
		ht: {
			title: 'Sipò DJR',
			subtitle: 'Asistans pou tranzaksyon ak sèvis ou yo',
			close: 'Fèmen',
			newRequest: '✉️ Nouvo demann',
			history: '🕐 Istwa',
			loading: 'Done yo ap chaje…',
			noOrder: 'Nou pa jwenn okenn kòmand',
			noOrderHelp: 'Asistans sa a disponib sèlman pou moun ki gen yon tranzaksyon aktif (kou, liv dijital oswa konsiltasyon).',
			todayMessages: 'Mesaj jodi a :',
			remaining: 'ki rete',
			quotaReached: '🚫 Ou rive nan limit pou jodi a',
			quotaHelp: 'Ou voye 3 demann jodi a. Eseye ankò demen.',
			selectOrder: 'Chwazi kòmand ki gen pwoblèm nan :',
			continue: 'Kontinye ➔',
			back: 'Retounen',
			generalQuestion: 'Kesyon jeneral',
			selectIssue: 'Ki pwoblèm ou genyen ?',
			changeMessage: 'Chanje mesaj',
			whatsapp: 'Nimewo WhatsApp ou',
			required: 'Obligatwa',
			optional: 'Si ou vle',
			whatsappHelp: 'Pifò pwoblèm yo rezoud otomatikman nan 72 èdtan. Si ou bay nimewo WhatsApp ou, ekip la ka kontakte w si sa nesesè.',
			sending: 'N ap voye demann nan…',
			send: 'Voye demann nan 🚀',
			noHistory: 'Ou poko voye okenn demann.',
			teamReply: 'Repons ekip sipò a :',
			statusResolved: 'Rezoud',
			statusProgress: 'Ankou',
			statusPending: 'Annatant',
			orderPaid: 'Peye',
			orderPending: 'Annatant',
			orderFailed: 'Echwe',
			orderExpired: 'Ekspire',
			loginToast: 'Tanpri konekte sou kont ou pou w ka itilize sèvis asistans lan.',
			errSelectPreset: 'Tanpri chwazi yon mesaj sipò.',
			errInvalidWhatsapp: 'Tanpri antre yon nimewo WhatsApp ki valab.',
			errQuotaLimit: 'Ou rive nan limit 3 mesaj sipò pou jodi a.',
			successSend: 'Mesaj sipò w la voye ak siksè!',
			errSendFailed: 'Nou pa ka voye mesaj la. Tanpri eseye ankò.',
			errGeneric: 'Yon erè rive pandan nou t ap voye mesaj la.'
		}
	};

	let wt = $derived(widgetI18n[currentLang]);

	const presetI18n: Record<string, { fr: { label: string; description: string }; ht: { label: string; description: string } }> = {
		no_access_after_payment: {
			fr: { label: 'J’ai payé, mais je n’ai pas accès au produit', description: 'Le paiement a réussi, mais l’accès n’a pas été activé dans mon compte.' },
			ht: { label: 'Mwen peye, men mwen pa jwenn aksè nan pwodui a', description: 'Peman an reyisi, men aksè a pa aktive nan kont mwen.' }
		},
		pending_transaction_help: {
			fr: { label: 'J’ai payé, mais la transaction est toujours en attente', description: 'La transaction est encore en attente sur MonCash, NatCash ou par carte.' },
			ht: { label: 'Mwen peye, men tranzaksyon an toujou ap tann', description: 'Tranzaksyon an toujou ap tann sou MonCash, NatCash oswa kat labank.' }
		},
		coaching_booking_issue: {
			fr: { label: 'J’ai un problème avec ma réservation de consultation', description: 'J’ai besoin d’aide pour ma réservation de consultation.' },
			ht: { label: 'Mwen gen yon pwoblèm ak rezèvasyon konsiltasyon mwen an', description: 'Mwen bezwen asistans pou rezèvasyon konsiltasyon mwen an.' }
		}
	};

	function presetLabel(id: string, fallback: string): string {
		return presetI18n[id]?.[currentLang].label ?? fallback;
	}

	function presetDescription(id: string, fallback: string): string {
		return presetI18n[id]?.[currentLang].description ?? fallback;
	}

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

	onMount(() => {
		if (authState.user) loadStatus();
		const handleOpenSupport = () => toggleWidget();
		window.addEventListener('djr:open-support', handleOpenSupport);
		return () => {
			window.removeEventListener('djr:open-support', handleOpenSupport);
		};
	});

	$effect(() => {
		if (authState.user && open && !statusData && !loading) loadStatus();
	});

	function toggleWidget() {
		if (!authState.user) {
			toast.info(wt.loginToast);
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
		if (!selectedPresetId) { toast.error(wt.errSelectPreset); return; }
		if (requiresWhatsapp && (!whatsappNumber || whatsappNumber.trim().length < 8)) {
			toast.error(wt.errInvalidWhatsapp);
			return;
		}
		if (statusData && statusData.dailyQuota.remaining <= 0) {
			toast.error(wt.errQuotaLimit);
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
				toast.success(wt.successSend);
				resetForm();
				activeTab = 'history';
				await loadStatus();
			} else {
				toast.error(wt.errSendFailed);
			}
		} catch (err: any) {
			console.error('Failed to send support message:', err);
			toast.error(wt.errGeneric);
		} finally {
			submitting = false;
		}
	}

	function getStatusBadge(status: string) {
		switch (status) {
			case 'resolved': return { text: wt.statusResolved, emoji: '✅', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
			case 'in_progress': return { text: wt.statusProgress, emoji: '🔄', color: 'bg-blue-50 text-blue-700 border-blue-200' };
			default: return { text: wt.statusPending, emoji: '⏳', color: 'bg-amber-50 text-amber-700 border-amber-200' };
		}
	}

	function orderStatusLabel(status: string): string {
		if (status === 'paid') return wt.orderPaid;
		if (status === 'pending') return wt.orderPending;
		if (status === 'failed') return wt.orderFailed;
		return wt.orderExpired;
	}

	function formatDate(iso: string) {
		try {
			const formatter = new Intl.DateTimeFormat('fr-FR', {
				day: '2-digit', month: currentLang === 'ht' ? 'numeric' : 'short', hour: '2-digit', minute: '2-digit'
			});
			const date = new Date(iso);
			if (currentLang === 'fr') return formatter.format(date);
			const parts = Object.fromEntries(formatter.formatToParts(date).map((part) => [part.type, part.value]));
			const months = ['janvye', 'fevriye', 'mas', 'avril', 'me', 'jen', 'jiyè', 'out', 'septanm', 'oktòb', 'novanm', 'desanm'];
			return `${parts.day} ${months[Number(parts.month) - 1]} ${parts.hour}:${parts.minute}`;
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

<!-- ─── Floating Support Button (Bottom Right) ────────────────────────── -->
{#if authState.user && !open}
	<button
		type="button"
		onclick={toggleWidget}
		class="fixed bottom-6 right-6 z-40 inline-flex items-center gap-2.5 px-4.5 py-3 rounded-full bg-zinc-950 text-white font-bold text-sm shadow-2xl border border-zinc-700/80 hover:bg-amber-400 hover:text-zinc-950 hover:border-amber-300 transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer group"
		aria-label={buttonText}
	>
		<div class="size-7 rounded-full bg-amber-400 text-zinc-950 grid place-items-center font-black group-hover:bg-zinc-950 group-hover:text-amber-400 transition-colors">
			<HelpCircle size={17} />
		</div>
		<span>{buttonText}</span>
	</button>
{/if}


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
						<h2 id="support-title" class="text-base font-bold text-zinc-900 leading-tight">{wt.title}</h2>
						<p class="text-xs text-zinc-400 mt-0.5">{wt.subtitle}</p>
					</div>
				</div>
				<button
					type="button"
					onclick={() => (open = false)}
					class="size-8 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-500 grid place-items-center transition-colors cursor-pointer"
					aria-label={wt.close}
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
					{wt.newRequest}
				</button>
				<button
					type="button"
					onclick={() => (activeTab = 'history')}
					class="flex-1 py-3 text-sm font-semibold transition-all cursor-pointer border-b-2 relative {activeTab === 'history'
						? 'border-amber-400 text-zinc-900'
						: 'border-transparent text-zinc-400 hover:text-zinc-600'}"
				>
					{wt.history}
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
					<p class="text-sm">{wt.loading}</p>
					</div>

				{:else if !statusData?.eligible}
					<!-- Non éligible -->
					<div class="py-10 text-center space-y-3">
						<div class="size-14 rounded-full bg-amber-50 grid place-items-center mx-auto">
							<ShoppingBag size={24} class="text-amber-500" />
						</div>
					<h3 class="font-bold text-zinc-900">{wt.noOrder}</h3>
					<p class="text-sm text-zinc-500 leading-relaxed max-w-xs mx-auto">{wt.noOrderHelp}</p>
					</div>

				{:else if activeTab === 'new'}
					<!-- ═══════════════════════════════════
					     WIZARD NOUVELLE DEMANDE
					     ═══════════════════════════════════ -->

					<!-- Quota banner -->
					{#if statusData}
						<div class="mb-4 flex items-center justify-between text-xs px-3 py-2 bg-zinc-50 rounded-xl border border-zinc-100">
							<span class="text-zinc-500">{wt.todayMessages}</span>
							<span class="font-bold {quotaColor}">
								{statusData.dailyQuota.remaining} / {statusData.dailyQuota.max} {wt.remaining}
							</span>
						</div>
					{/if}

					{#if statusData && statusData.dailyQuota.remaining <= 0}
						<!-- Quota épuisé -->
						<div class="p-4 bg-red-50 border border-red-100 rounded-2xl text-sm text-red-700 text-center space-y-1">
						<p class="font-bold">{wt.quotaReached}</p>
						<p class="text-xs text-red-500">{wt.quotaHelp}</p>
						</div>

					{:else}

						<!-- ─ ÉTAPE 1 : Choisir commande ─ -->
						{#if currentStep === 1}
							<div class="space-y-3">
								<p class="text-sm font-bold text-zinc-900 mb-3">{wt.selectOrder}</p>

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
															{orderStatusLabel(order.status)}
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
										{wt.continue}
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
										{wt.back}
									</button>
									<div class="text-xs text-zinc-400 font-medium truncate max-w-[200px] text-right">
										{selectedOrder ? selectedOrder.productTitle : wt.generalQuestion}
									</div>
								</div>

								<p class="text-sm font-bold text-zinc-900 mb-3">{wt.selectIssue}</p>

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
												<p class="font-semibold text-zinc-900 text-sm leading-snug">{presetLabel(preset.id, preset.label)}</p>
												{#if preset.description}
													<p class="text-xs text-zinc-400 mt-0.5 leading-relaxed">{presetDescription(preset.id, preset.description)}</p>
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
										{wt.continue}
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
										{wt.changeMessage}
									</button>
								</div>

								<!-- Card résumé -->
								<div class="p-4 bg-zinc-50 rounded-2xl border border-zinc-100 space-y-1.5 text-sm">
									<div class="flex items-start gap-2">
										<CheckCircle2 size={16} class="text-emerald-500 mt-0.5 shrink-0" />
										<div>
							<p class="font-semibold text-zinc-900">{selectedPreset ? presetLabel(selectedPreset.id, selectedPreset.label) : ''}</p>
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
							{wt.whatsapp}
										</span>
										{#if requiresWhatsapp}
							<span class="text-[10px] font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full">{wt.required}</span>
										{:else}
							<span class="text-[10px] text-zinc-400">{wt.optional}</span>
										{/if}
									</label>
									<input
										id="support-whatsapp"
										type="tel"
										placeholder="+509 XXXX-XXXX"
										bind:value={whatsappNumber}
										class="w-full text-sm bg-white border-2 border-zinc-200 focus:border-amber-400 rounded-xl px-4 py-3 focus:outline-none transition-colors font-mono"
									/>
								<p class="text-xs text-zinc-400 leading-relaxed">{wt.whatsappHelp}</p>
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
										<span>{wt.sending}</span>
									{:else}
										<Send size={16} />
										<span>{wt.send}</span>
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
						<p class="text-sm">{wt.noHistory}</p>
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
										<p class="font-semibold text-zinc-900 text-sm">{presetLabel(message.presetId, message.presetLabel)}</p>
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
												{wt.teamReply}
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
