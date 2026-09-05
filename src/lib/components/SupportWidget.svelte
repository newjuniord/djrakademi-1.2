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
		PhoneCall,
		HelpCircle,
		Sparkles,
		ShoppingBag,
		Loader2,
		MessageCircle
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

	// Active tab: 'new' or 'history'
	let activeTab = $state<'new' | 'history'>('new');

	async function loadStatus() {
		if (!authState.user) {
			statusData = null;
			return;
		}
		loading = true;
		try {
			const res = await fetchUserSupportStatus();
			statusData = res;
			if (res && res.messages && res.messages.length > 0 && activeTab === 'new') {
				// Pre-fill whatsapp from last message if available
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
		if (authState.user) {
			loadStatus();
		}
	});

	$effect(() => {
		if (authState.user && open && !statusData && !loading) {
			loadStatus();
		}
	});

	function toggleWidget() {
		if (!authState.user) {
			toast.info('Tanpri konekte sou kont ou pou w ka sèvi ak asistans sipò an.');
			authState.openLogin(() => {
				open = true;
				loadStatus();
			});
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

	async function handleSubmit() {
		if (!selectedPresetId) {
			toast.error('Tanpri chwazi yon mesaj ki korresponn ak pwoblèm ou an.');
			return;
		}

		if (requiresWhatsapp && (!whatsappNumber || whatsappNumber.trim().length < 8)) {
			toast.error('Tanpri mete yon nimewo WhatsApp valid pou nou ka kontakte w.');
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
				toast.success('Mesaj sipò w la voye ak siksè! Ekip la ap suiv li.');
				selectedPresetId = '';
				selectedOrderId = '';
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
			case 'resolved':
				return { text: 'Résolu ✅', class: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
			case 'in_progress':
				return { text: 'En cours 🔄', class: 'bg-blue-100 text-blue-800 border-blue-300' };
			default:
				return { text: 'En attente ⏳', class: 'bg-amber-100 text-amber-800 border-amber-300' };
		}
	}

	function formatDate(iso: string) {
		try {
			return new Intl.DateTimeFormat('fr-FR', {
				day: '2-digit',
				month: 'short',
				hour: '2-digit',
				minute: '2-digit'
			}).format(new Date(iso));
		} catch {
			return iso;
		}
	}
</script>

<!-- Floating Support Button (Bottom-Right) -->
<div class="fixed bottom-6 right-6 z-40">
	<button
		type="button"
		onclick={toggleWidget}
		class="group relative flex items-center gap-2.5 px-4 py-3 rounded-full bg-zinc-950 hover:bg-zinc-800 text-white font-bold text-xs shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95 border border-zinc-700/60 cursor-pointer"
		aria-label="Ouvrir le chat de support"
	>
		<div class="relative grid place-items-center">
			<MessageSquare size={18} class="text-amber-400 group-hover:rotate-12 transition-transform" />
			{#if statusData && statusData.messages.some((m) => m.status === 'open')}
				<span class="absolute -top-1 -right-1 size-2.5 rounded-full bg-red-500 animate-ping"></span>
				<span class="absolute -top-1 -right-1 size-2.5 rounded-full bg-red-500"></span>
			{/if}
		</div>
		<span class="tracking-wide">Sipò Asistans</span>
		<span class="px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-[10px] font-mono font-black border border-amber-400/30">
			⚡ Quick
		</span>
	</button>
</div>

<!-- Support Modal / Drawer -->
{#if open}
	<div
		class="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
		role="dialog"
		aria-modal="true"
		aria-labelledby="support-modal-title"
	>
		<div
			class="w-full max-w-lg bg-white text-zinc-900 rounded-3xl border border-zinc-200 shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200"
		>
			<!-- Header -->
			<div class="p-5 border-b border-zinc-100 flex items-center justify-between gap-4 bg-zinc-950 text-white">
				<div class="flex items-center gap-3">
					<div class="size-10 rounded-2xl bg-amber-400/10 border border-amber-400/30 grid place-items-center text-amber-400 shrink-0">
						<Sparkles size={20} />
					</div>
					<div>
						<h3 id="support-modal-title" class="text-base font-black text-white tracking-tight flex items-center gap-2">
							<span>Sipò Asistans Rapide</span>
							<span class="px-2 py-0.5 rounded-full bg-amber-400 text-black text-[9px] font-extrabold uppercase">DJR</span>
						</h3>
						<p class="text-xs text-zinc-400 font-medium">Aide directe pour vos transactions et services</p>
					</div>
				</div>

				<button
					type="button"
					onclick={() => (open = false)}
					class="size-8 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 grid place-items-center transition-colors shrink-0 cursor-pointer"
					aria-label="Fermer"
				>
					<X size={16} />
				</button>
			</div>

			<!-- Eligibility Check Banner -->
			{#if statusData}
				<div class="px-5 py-2.5 bg-zinc-50 border-b border-zinc-100 flex items-center justify-between gap-3 text-xs">
					{#if !statusData.eligible}
						<div class="flex items-center gap-1.5 text-red-600 font-bold">
							<AlertCircle size={14} />
							<span>Ou pa gen tranzaksyon kreyòl pou w sèvi ak sipò sa a.</span>
						</div>
					{:else}
						<div class="flex items-center gap-1.5 text-zinc-600 font-medium">
							<ShoppingBag size={14} class="text-emerald-600" />
							<span>Tranzaksyon w yo : <strong class="text-zinc-900 font-bold">{statusData.orderCount}</strong></span>
						</div>

						<div class="flex items-center gap-1.5 font-bold">
							<span class="text-zinc-500">Limiting jodi a :</span>
							<span class="px-2 py-0.5 rounded-md font-mono font-black text-[11px] {statusData.dailyQuota.remaining > 0 ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-red-100 text-red-800 border border-red-300'}">
								{statusData.dailyQuota.remaining} / {statusData.dailyQuota.max} ki rete
							</span>
						</div>
					{/if}
				</div>
			{/if}

			<!-- Navigation Tabs -->
			<div class="flex border-b border-zinc-200 bg-white">
				<button
					type="button"
					onclick={() => (activeTab = 'new')}
					class="flex-1 py-3 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center justify-center gap-2 {activeTab === 'new'
						? 'border-zinc-950 text-zinc-950 bg-zinc-50/50'
						: 'border-transparent text-zinc-400 hover:text-zinc-700'}"
				>
					<Send size={14} />
					<span>Voye yon Demann</span>
				</button>
				<button
					type="button"
					onclick={() => (activeTab = 'history')}
					class="flex-1 py-3 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center justify-center gap-2 relative {activeTab === 'history'
						? 'border-zinc-950 text-zinc-950 bg-zinc-50/50'
						: 'border-transparent text-zinc-400 hover:text-zinc-700'}"
				>
					<Clock size={14} />
					<span>Istwa Mesaj ({statusData?.messages?.length || 0})</span>
				</button>
			</div>

			<!-- Body Content -->
			<div class="p-5 space-y-4 overflow-y-auto flex-1">
				{#if loading}
					<div class="p-12 text-center text-zinc-400 space-y-3">
						<Loader2 size={32} class="mx-auto animate-spin text-zinc-900" />
						<p class="text-xs font-semibold">Vérification de votre compte...</p>
					</div>
				{:else if !statusData?.eligible}
					<div class="p-8 text-center space-y-3 bg-amber-50/60 rounded-2xl border border-amber-200">
						<AlertCircle size={36} class="mx-auto text-amber-600" />
						<h4 class="font-bold text-sm text-zinc-900">Aucune commande trouvée</h4>
						<p class="text-xs text-zinc-600 max-w-xs mx-auto leading-relaxed">
							Sipò sa a rezève pou moun ki te kreyè yon tranzaksyon (kou, ebook oubyen coaching), menm si tranzaksyon an te en sispann oswa echwe.
						</p>
					</div>
				{:else if activeTab === 'new'}
					<!-- NEW SUPPORT MESSAGE TAB -->
					{#if statusData.dailyQuota.remaining <= 0}
						<div class="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-800 space-y-1">
							<p class="font-bold flex items-center gap-1.5">
								<AlertCircle size={15} />
								<span>Limit mesaj atenn pou jodi a (3/3)</span>
							</p>
							<p class="text-red-700">
								Ou voye 3 mesaj sipò jodi a deja. Tanpri re-eseye demen si pwoblèm ou an pa rezoud.
							</p>
						</div>
					{/if}

					<!-- Step 1: Select Order (Optional) -->
					{#if statusData.orders && statusData.orders.length > 0}
						<div class="space-y-1.5">
							<label class="block text-xs font-bold text-zinc-700" for="support-order-select">
								1. Chwazi kòmande ki gen pwoblèm nan :
							</label>
							<select
								id="support-order-select"
								bind:value={selectedOrderId}
								class="w-full text-xs font-medium bg-zinc-50 border border-zinc-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-zinc-950"
							>
								<option value="">-- Tout tranzaksyon ou yo ({statusData.orders.length}) --</option>
								{#each statusData.orders as order (order.id)}
									<option value={order.id}>
										[{order.productType.toUpperCase()}] {order.productTitle} - {order.amount} HTG ({order.status})
									</option>
								{/each}
							</select>
						</div>
					{/if}

					<!-- Step 2: Select Click-to-Send Preset Message (ONLY AUTOMATED PRESETS ALLOWED) -->
					<div class="space-y-2">
						<span class="block text-xs font-bold text-zinc-700">
							2. Klike sou mesaj ki deskri pwoblèm ou an :
						</span>

						<div class="space-y-2 max-h-[30vh] overflow-y-auto pr-1">
							{#each statusData.presets as preset (preset.id)}
								<button
									type="button"
									onclick={() => (selectedPresetId = preset.id)}
									class="w-full text-left p-3 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 text-xs group {selectedPresetId === preset.id
										? 'bg-zinc-950 text-white border-zinc-950 shadow-md'
										: 'bg-zinc-50 border-zinc-200 text-zinc-900 hover:border-zinc-300 hover:bg-zinc-100/80'}"
								>
									<div class="size-6 rounded-full border grid place-items-center shrink-0 mt-0.5 {selectedPresetId === preset.id ? 'bg-amber-400 text-black border-amber-400 font-bold' : 'border-zinc-300 bg-white'}">
										{#if selectedPresetId === preset.id}
											<CheckCircle2 size={14} />
										{:else}
											<span class="text-[10px] text-zinc-500">•</span>
										{/if}
									</div>

									<div class="flex-1 min-w-0">
										<p class="font-bold text-xs leading-snug">{preset.label}</p>
										<p class="text-[11px] mt-0.5 truncate {selectedPresetId === preset.id ? 'text-zinc-300' : 'text-zinc-500'}">
											{preset.description}
										</p>
									</div>
								</button>
							{/each}
						</div>
					</div>

					<!-- Step 3: WhatsApp Number Input (Mandatory if Coaching or requiresWhatsapp) -->
					{#if requiresWhatsapp || selectedPresetId}
						<div class="space-y-1.5 pt-2 border-t border-zinc-100">
							<label class="block text-xs font-bold text-zinc-700 flex items-center justify-between" for="support-whatsapp">
								<span class="flex items-center gap-1.5">
									<MessageCircle size={14} class="text-emerald-600" />
									<span>Nimewo WhatsApp ou :</span>
								</span>
								{#if requiresWhatsapp}
									<span class="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">Obligatwa</span>
								{:else}
									<span class="text-[10px] text-zinc-400 font-medium">Opksyonèl</span>
								{/if}
							</label>

							<div class="relative">
								<input
									id="support-whatsapp"
									type="tel"
									placeholder="+509 XXXX-XXXX"
									bind:value={whatsappNumber}
									class="w-full text-xs font-mono font-bold bg-zinc-50 border border-zinc-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-zinc-950"
								/>
							</div>
							<p class="text-[11px] text-zinc-500">
								Ekip la va kontakte w sou WhatsApp si yo bezwen plis enfòmasyon sou tranzaksyon w lan.
							</p>
						</div>
					{/if}

					<!-- Submit Button -->
					<div class="pt-2">
						<button
							type="button"
							disabled={submitting || !selectedPresetId || statusData.dailyQuota.remaining <= 0}
							onclick={handleSubmit}
							class="w-full h-11 rounded-2xl bg-zinc-950 hover:bg-zinc-800 active:scale-[0.99] text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{#if submitting}
								<Loader2 size={16} class="animate-spin text-white" />
								<span>N ap voye demann lan...</span>
							{:else}
								<Send size={16} class="text-amber-400" />
								<span>Voye demann asistans lan</span>
							{/if}
						</button>
					</div>
				{:else}
					<!-- HISTORY TAB -->
					<div class="space-y-3">
						{#if !statusData.messages || statusData.messages.length === 0}
							<div class="p-8 text-center text-zinc-400 space-y-2">
								<Clock size={32} class="mx-auto text-zinc-300" />
								<p class="text-xs font-semibold">Ou pa voye okenn demann sipò ankò.</p>
							</div>
						{:else}
							{#each statusData.messages as message (message.id)}
								{@const badge = getStatusBadge(message.status)}
								<div class="p-4 rounded-2xl border border-zinc-200 bg-zinc-50/60 space-y-2.5 text-xs">
									<div class="flex items-center justify-between gap-2">
										<span class="px-2 py-0.5 rounded-md font-mono font-bold text-[10px] border {badge.class}">
											{badge.text}
										</span>
										<span class="text-[11px] text-zinc-400 font-medium">
											{formatDate(message.createdAt)}
										</span>
									</div>

									<div>
										<p class="font-bold text-zinc-950 text-xs">{message.presetLabel}</p>
										{#if message.productTitle}
											<p class="text-[11px] text-zinc-500 font-medium mt-0.5">
												Pwodui : <span class="text-zinc-900 font-semibold">{message.productTitle}</span>
											</p>
										{/if}
										{#if message.whatsapp}
											<p class="text-[11px] text-emerald-700 font-medium mt-0.5 flex items-center gap-1">
												<MessageCircle size={12} />
												<span>WhatsApp: {message.whatsapp}</span>
											</p>
										{/if}
									</div>

									{#if message.adminReply}
										<div class="p-3 bg-emerald-50/80 border border-emerald-200 rounded-xl text-xs space-y-1">
											<div class="flex items-center gap-1.5 text-emerald-900 font-extrabold text-[11px]">
												<Sparkles size={13} class="text-emerald-600" />
												<span>Repons Ekip Sipò :</span>
											</div>
											<p class="text-emerald-950 font-medium leading-relaxed">
												{message.adminReply}
											</p>
										</div>
									{/if}
								</div>
							{/each}
						{/if}
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}
