<script lang="ts">
	import { X, CreditCard, Smartphone, Check, Loader2, Globe, MapPin } from 'lucide-svelte';
	import { dev } from '$app/environment';
	import { onMount } from 'svelte';

	let {
		open = false,
		productTitle = '',
		amount = 0,
		amountUsd,
		isFree = false,
		loading = false,
		onSelectMethod,
		onClose
	}: {
		open: boolean;
		productTitle: string;
		amount: number;
		amountUsd?: number;
		isFree?: boolean;
		loading?: boolean;
		onSelectMethod: (method: 'moncash' | 'natcash' | 'carte' | 'plopplop_carte') => void;
		onClose: () => void;
	} = $props();

	let selectedMethod = $state<'moncash' | 'natcash' | 'carte'>('moncash');
	let isLocalhost = $state(false);

	onMount(() => {
		isLocalhost = dev || (typeof window !== 'undefined' && (
			window.location.hostname === 'localhost' ||
			window.location.hostname === '127.0.0.1' ||
			window.location.hostname.startsWith('192.168.')
		));
	});

	function handleConfirm() {
		if (loading) return;
		onSelectMethod(selectedMethod);
	}
</script>

{#if open}
	<!-- Backdrop Overlay -->
	<div
		class="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
		role="dialog"
		aria-modal="true"
		aria-labelledby="payment-modal-title"
	>
		<!-- Modal Box (BLANC) -->
		<div
			class="w-full max-w-md bg-white text-zinc-900 rounded-3xl border border-zinc-200 shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
		>
			<!-- Header Blanc -->
			<div class="p-6 border-b border-zinc-100 flex items-center justify-between gap-4 bg-white">
				<div>
					<h3 id="payment-modal-title" class="text-lg font-black text-zinc-950 tracking-tight">
						Chwazi fason pou w peye
					</h3>
					<p class="text-xs text-zinc-500 mt-0.5 truncate max-w-xs font-medium">
						{productTitle} · <span class="font-bold text-zinc-900">{isFree ? 'Gratis' : `${amount.toLocaleString('fr-FR')} HTG${amountUsd && amountUsd > 0 ? ` ($${amountUsd} USD)` : ''}`}</span>
					</p>
				</div>

				<button
					type="button"
					onclick={onClose}
					disabled={loading}
					class="size-8 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-500 hover:text-zinc-900 grid place-items-center transition-colors shrink-0 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
					aria-label="Fèmen an"
				>
					<X size={16} />
				</button>
			</div>

			<!-- Body: Payment Options Categorized -->
			<div class="p-6 space-y-5 overflow-y-auto max-h-[75vh]">
				<!-- Section 1: Haïti (Méthodes Locales) -->
				<div class="space-y-2.5">
					<div class="flex items-center gap-1.5 text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
						<MapPin size={13} class="text-red-500" />
						<span>Ayiti 🇭🇹 (Metòd Lokal)</span>
					</div>

					<!-- Option MonCash -->
					<div class="space-y-1.5">
						<button
							type="button"
							disabled={loading}
							onclick={() => (selectedMethod = 'moncash')}
							class="w-full text-left p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 cursor-pointer disabled:cursor-not-allowed group {selectedMethod === 'moncash'
								? 'bg-red-50/80 border-red-500 ring-1 ring-red-500/30'
								: 'bg-zinc-50/80 border-zinc-200/80 hover:border-zinc-300 hover:bg-zinc-100/60'}"
						>
							<div class="flex items-center gap-3.5">
								<div class="size-11 rounded-xl bg-white border border-zinc-200 flex items-center justify-center shadow-xs shrink-0 group-hover:scale-105 transition-transform overflow-hidden p-1">
									<img src="/moncash.png" alt="MonCash Logo" class="w-full h-full object-contain" />
								</div>
								<div>
									<div class="flex items-center gap-2">
										<span class="font-bold text-sm text-zinc-950">MonCash</span>
										<span class="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px] font-extrabold">MonCash</span>
									</div>
									<p class="text-xs text-zinc-500">Peman mobil rapid ak Digicel MonCash</p>
								</div>
							</div>

							<div class="size-5 rounded-full border grid place-items-center shrink-0 {selectedMethod === 'moncash' ? 'bg-red-500 border-red-500 text-white' : 'border-zinc-300'}">
								{#if selectedMethod === 'moncash'}
									<Check size={12} strokeWidth={3} />
								{/if}
							</div>
						</button>

						{#if isLocalhost}
							<div class="p-2 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between gap-2 text-xs">
								<div class="flex items-center gap-1.5 text-amber-900 font-bold text-[11px]">
									<span class="px-1.5 py-0.5 rounded bg-amber-400 text-black text-[9px] font-black uppercase tracking-wider">DEV TEST</span>
									<span>Plopplop (Kat HTG)</span>
								</div>
								<button
									type="button"
									disabled={loading}
									onclick={() => onSelectMethod('plopplop_carte')}
									class="px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-700 active:scale-95 text-white font-bold text-[11px] shadow-xs transition-all cursor-pointer flex items-center gap-1 shrink-0"
									title="Tester le paiement Plopplop avec Carte en local"
								>
									<CreditCard size={12} />
									<span>Test Kat Plopplop</span>
								</button>
							</div>
						{/if}
					</div>

					<!-- Option NatCash -->
					<button
						type="button"
						disabled={loading}
						onclick={() => (selectedMethod = 'natcash')}
						class="w-full text-left p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 cursor-pointer disabled:cursor-not-allowed group {selectedMethod === 'natcash'
							? 'bg-emerald-50/80 border-emerald-500 ring-1 ring-emerald-500/30'
							: 'bg-zinc-50/80 border-zinc-200/80 hover:border-zinc-300 hover:bg-zinc-100/60'}"
					>
						<div class="flex items-center gap-3.5">
							<div class="size-11 rounded-xl bg-white border border-zinc-200 flex items-center justify-center shadow-xs shrink-0 group-hover:scale-105 transition-transform overflow-hidden p-1">
								<img src="/natcash.png" alt="NatCash Logo" class="w-full h-full object-contain" />
							</div>
							<div>
								<div class="flex items-center gap-2">
									<span class="font-bold text-sm text-zinc-950">NatCash</span>
									<span class="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-extrabold">Natcom</span>
								</div>
								<p class="text-xs text-zinc-500">Peman ak pòtfèy mobil Natcom NatCash</p>
							</div>
						</div>

						<div class="size-5 rounded-full border grid place-items-center shrink-0 {selectedMethod === 'natcash' ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-zinc-300'}">
							{#if selectedMethod === 'natcash'}
								<Check size={12} strokeWidth={3} />
							{/if}
						</div>
					</button>
				</div>

				<!-- Section 2: International (Carte Bancaire) -->
				<div class="space-y-2.5 pt-2 border-t border-zinc-100">
					<div class="flex items-center gap-1.5 text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
						<Globe size={13} class="text-blue-500" />
						<span>Entènasyonal 🌐 (Kat Bankè)</span>
					</div>

					<!-- Option Carte Bancaire -->
					<button
						type="button"
						disabled={loading}
						onclick={() => (selectedMethod = 'carte')}
						class="w-full text-left p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 cursor-pointer disabled:cursor-not-allowed group {selectedMethod === 'carte'
							? 'bg-blue-50/80 border-blue-500 ring-1 ring-blue-500/30'
							: 'bg-zinc-50/80 border-zinc-200/80 hover:border-zinc-300 hover:bg-zinc-100/60'}"
					>
						<div class="flex items-center gap-3.5">
							<div class="size-11 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-black text-xs grid place-items-center shadow-sm shrink-0 group-hover:scale-105 transition-transform">
								<CreditCard size={20} />
							</div>
							<div>
								<div class="flex items-center gap-2">
									<span class="font-bold text-sm text-zinc-950">Kat Visa / Mastercard</span>
									<span class="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-extrabold">Entènasyonal</span>
								</div>
								<p class="text-xs text-zinc-500">Kat entènasyonal (Visa, MasterCard, AMEX)</p>
							</div>
						</div>

						<div class="size-5 rounded-full border grid place-items-center shrink-0 {selectedMethod === 'carte' ? 'bg-blue-500 border-blue-500 text-white' : 'border-zinc-300'}">
							{#if selectedMethod === 'carte'}
								<Check size={12} strokeWidth={3} />
							{/if}
						</div>
					</button>
				</div>
			</div>

			<!-- Footer CTA (Bouton Noir & Texte Blanc avec Anti-Double Click & Curseur) -->
			<div class="p-6 border-t border-zinc-100 bg-zinc-50/50 space-y-3">
				<button
					type="button"
					disabled={loading}
					onclick={handleConfirm}
					class="w-full h-12 rounded-2xl bg-black hover:bg-zinc-800 active:scale-[0.99] text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2.5 transition-all shadow-md cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed disabled:pointer-events-none"
				>
					{#if loading}
						<Loader2 size={18} class="animate-spin text-white shrink-0" />
						<span class="text-white animate-pulse">Peman an ap prepare...</span>
					{:else}
						<CreditCard size={18} class="text-white shrink-0" />
						<span class="text-white">Kontinye pou w peye ({selectedMethod.toUpperCase()})</span>
					{/if}
				</button>
			</div>
		</div>
	</div>
{/if}
