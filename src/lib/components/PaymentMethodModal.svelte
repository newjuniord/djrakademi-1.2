<script lang="ts">
	import { X, CreditCard, Check, Loader2 } from 'lucide-svelte';
	import { dev } from '$app/environment';
	import { page } from '$app/state';
	import { onMount } from 'svelte';

	let currentLang = $derived<'fr' | 'ht'>(page.url.searchParams.get('lang') === 'ht' ? 'ht' : 'fr');
	const i18n = {
		fr: {
			title: 'Moyen de paiement',
			close: 'Fermer la fenêtre de paiement',
			localMethods: 'Haïti · Paiement local',
			moncashDesc: 'Paiement mobile Digicel',
			natcashDesc: 'Paiement mobile Natcom',
			localCard: 'Carte HTG (test local)',
			testLocalCard: 'Tester le paiement par carte HTG en local',
			testCard: 'Tester',
			international: 'International · Carte bancaire',
			card: 'Carte bancaire',
			cardDesc: 'Visa, Mastercard via Lemon Squeezy',
			preparing: 'Redirection en cours...',
			continueWith: (label: string) => `Continuer avec ${label}`
		},
		ht: {
			title: 'Mwayen peman',
			close: 'Fèmen fenèt peman an',
			localMethods: 'Ayiti · Peman lokal',
			moncashDesc: 'Peman mobil Digicel',
			natcashDesc: 'Peman mobil Natcom',
			localCard: 'Kat HTG (tès lokal)',
			testLocalCard: 'Teste peman ak kat HTG an lokal',
			testCard: 'Teste',
			international: 'Entènasyonal · Kat labank',
			card: 'Kat labank',
			cardDesc: 'Visa, Mastercard ak Lemon Squeezy',
			preparing: 'N ap prepare peman an...',
			continueWith: (label: string) => `Kontinye ak ${label}`
		}
	};
	let t = $derived(i18n[currentLang]);

	let {
		open = false,
		productTitle = '',
		amount = 0,
		amountUsd,
		isFree = false,
		cardEnabled = true,
		loading = false,
		onSelectMethod,
		onClose
	}: {
		open: boolean;
		productTitle: string;
		amount: number;
		amountUsd?: number;
		isFree?: boolean;
		cardEnabled?: boolean;
		loading?: boolean;
		onSelectMethod: (method: 'moncash' | 'natcash' | 'carte' | 'plopplop_carte') => void;
		onClose: () => void;
	} = $props();

	let selectedMethod = $state<'moncash' | 'natcash' | 'carte'>('moncash');
	let isLocalhost = $state(false);
	let localMethodsEnabled = $state(dev);
	let localLoading = $state(false);
	let dialogEl = $state<HTMLDialogElement | null>(null);

	const isLoading = $derived(loading || localLoading);

	const selectedLabel = $derived(
		selectedMethod === 'moncash'
			? 'MonCash'
			: selectedMethod === 'natcash'
				? 'NatCash'
				: t.card
	);

	$effect(() => {
		if (!open) {
			localLoading = false;
		} else if (!localMethodsEnabled) {
			selectedMethod = 'carte';
		}
	});

	$effect(() => {
		if (!loading) {
			localLoading = false;
		}
	});

	$effect(() => {
		const el = dialogEl;
		if (!el) return;
		if (open) {
			if (!el.open) el.showModal();
		} else if (el.open) {
			el.close();
		}
	});

	onMount(() => {
		const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
		localMethodsEnabled = dev || timezone === 'America/Port-au-Prince';

		isLocalhost = dev || (typeof window !== 'undefined' && (
			window.location.hostname === 'localhost' ||
			window.location.hostname === '127.0.0.1' ||
			window.location.hostname.startsWith('192.168.')
		));
	});

	function requestClose() {
		if (isLoading) return;
		onClose();
	}

	function handleDialogCancel(event: Event) {
		if (isLoading) {
			event.preventDefault();
			return;
		}
		onClose();
	}

	function handleDialogClick(event: MouseEvent) {
		const el = dialogEl;
		if (!el || isLoading) return;
		// Fallback for browsers without closedby="any" support (e.g. Safari)
		if (!('closedBy' in HTMLDialogElement.prototype)) {
			if (event.target !== el) return;
			const rect = el.getBoundingClientRect();
			const isDialogContent =
				rect.top <= event.clientY &&
				event.clientY <= rect.top + rect.height &&
				rect.left <= event.clientX &&
				event.clientX <= rect.left + rect.width;
			if (isDialogContent) return;
			requestClose();
		}
	}

	function handleConfirm() {
		if (
			isLoading ||
			(!localMethodsEnabled && selectedMethod !== 'carte') ||
			(selectedMethod === 'carte' && !cardEnabled)
		) return;
		localLoading = true;
		onSelectMethod(selectedMethod);
	}
</script>

<dialog
	bind:this={dialogEl}
	{...({ closedby: isLoading ? 'none' : 'any' } as Record<string, string>)}
	aria-labelledby="payment-modal-title"
	oncancel={handleDialogCancel}
	onclose={() => {
		if (open && !isLoading) onClose();
	}}
	onclick={handleDialogClick}
	class="payment-dialog m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl border border-zinc-200/90 bg-white p-0 text-zinc-900 shadow-xl"
>
	<div class="flex flex-col">
		<!-- Header -->
		<div class="flex items-start justify-between gap-4 px-6 pt-6 pb-4">
			<div class="min-w-0">
				<h2 id="payment-modal-title" class="text-base font-semibold tracking-tight text-zinc-950">
					{t.title}
				</h2>
				{#if productTitle}
					<p class="mt-0.5 line-clamp-1 text-xs font-normal text-zinc-500">
						{productTitle}
					</p>
				{/if}
			</div>

			<button
				type="button"
				onclick={requestClose}
				disabled={isLoading}
				aria-label={t.close}
				class="grid size-8 shrink-0 cursor-pointer place-items-center rounded-full text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-900 disabled:cursor-not-allowed disabled:opacity-40"
			>
				<X size={16} />
			</button>
		</div>

		<!-- Payment Options -->
		<div
			role="radiogroup"
			aria-labelledby="payment-modal-title"
			class="max-h-[70vh] space-y-5 overflow-y-auto px-6 py-2"
		>
			<!-- Local Methods -->
			<div class="space-y-2 {localMethodsEnabled ? '' : 'opacity-45'}">
				<p class="text-[11px] font-medium tracking-wide text-zinc-400 uppercase">
					{t.localMethods}
				</p>

				<div class="space-y-2">
					<!-- MonCash -->
					<button
						type="button"
						role="radio"
						aria-checked={selectedMethod === 'moncash'}
						disabled={isLoading || !localMethodsEnabled}
						onclick={() => (selectedMethod = 'moncash')}
						class="group flex w-full cursor-pointer items-center justify-between gap-3 rounded-xl border p-3.5 text-left transition-colors disabled:cursor-not-allowed {selectedMethod === 'moncash'
							? 'border-zinc-950 bg-zinc-50/80 ring-1 ring-zinc-950/10'
							: 'border-zinc-200/80 bg-white hover:border-zinc-300 hover:bg-zinc-50/50'}"
					>
						<div class="flex items-center gap-3">
							<div class="grid size-10 shrink-0 place-items-center overflow-hidden rounded-lg border border-zinc-200/80 bg-white p-1.5">
								<img src="/moncash.png" alt="MonCash" class="h-full w-full object-contain" />
							</div>
							<div>
								<span class="block text-sm font-semibold text-zinc-950">MonCash</span>
								<span class="block text-xs text-zinc-500">{t.moncashDesc}</span>
							</div>
						</div>

						<span
							aria-hidden="true"
							class="grid size-5 shrink-0 place-items-center rounded-full border transition-colors {selectedMethod === 'moncash'
								? 'border-zinc-950 bg-zinc-950 text-white'
								: 'border-zinc-300 bg-white'}"
						>
							{#if selectedMethod === 'moncash'}
								<Check size={12} strokeWidth={2.75} />
							{/if}
						</span>
					</button>

					{#if isLocalhost}
						<div class="flex items-center justify-between gap-2 rounded-lg border border-zinc-200/80 bg-zinc-50 px-3 py-2 text-xs">
							<span class="font-medium text-zinc-600">{t.localCard}</span>
							<button
								type="button"
								disabled={isLoading}
								onclick={() => onSelectMethod('plopplop_carte')}
								title={t.testLocalCard}
								class="cursor-pointer rounded-md bg-zinc-900 px-2.5 py-1 text-[11px] font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50"
							>
								{t.testCard}
							</button>
						</div>
					{/if}

					<!-- NatCash -->
					<button
						type="button"
						role="radio"
						aria-checked={selectedMethod === 'natcash'}
						disabled={isLoading || !localMethodsEnabled}
						onclick={() => (selectedMethod = 'natcash')}
						class="group flex w-full cursor-pointer items-center justify-between gap-3 rounded-xl border p-3.5 text-left transition-colors disabled:cursor-not-allowed {selectedMethod === 'natcash'
							? 'border-zinc-950 bg-zinc-50/80 ring-1 ring-zinc-950/10'
							: 'border-zinc-200/80 bg-white hover:border-zinc-300 hover:bg-zinc-50/50'}"
					>
						<div class="flex items-center gap-3">
							<div class="grid size-10 shrink-0 place-items-center overflow-hidden rounded-lg border border-zinc-200/80 bg-white p-1.5">
								<img src="/natcash.png" alt="NatCash" class="h-full w-full object-contain" />
							</div>
							<div>
								<span class="block text-sm font-semibold text-zinc-950">NatCash</span>
								<span class="block text-xs text-zinc-500">{t.natcashDesc}</span>
							</div>
						</div>

						<span
							aria-hidden="true"
							class="grid size-5 shrink-0 place-items-center rounded-full border transition-colors {selectedMethod === 'natcash'
								? 'border-zinc-950 bg-zinc-950 text-white'
								: 'border-zinc-300 bg-white'}"
						>
							{#if selectedMethod === 'natcash'}
								<Check size={12} strokeWidth={2.75} />
							{/if}
						</span>
					</button>
				</div>
			</div>

			{#if cardEnabled}
				<!-- International Card -->
				<div class="space-y-2 border-t border-zinc-100 pt-4">
					<p class="text-[11px] font-medium tracking-wide text-zinc-400 uppercase">
						{t.international}
					</p>

					<button
						type="button"
						role="radio"
						aria-checked={selectedMethod === 'carte'}
						disabled={isLoading}
						onclick={() => (selectedMethod = 'carte')}
						class="group flex w-full cursor-pointer items-center justify-between gap-3 rounded-xl border p-3.5 text-left transition-colors disabled:cursor-not-allowed {selectedMethod === 'carte'
							? 'border-zinc-950 bg-zinc-50/80 ring-1 ring-zinc-950/10'
							: 'border-zinc-200/80 bg-white hover:border-zinc-300 hover:bg-zinc-50/50'}"
					>
						<div class="flex items-center gap-3">
							<div class="grid size-10 shrink-0 place-items-center rounded-lg border border-zinc-200/80 bg-zinc-50 text-zinc-800">
								<CreditCard size={18} strokeWidth={1.75} />
							</div>
							<div>
								<span class="block text-sm font-semibold text-zinc-950">{t.card}</span>
								<span class="block text-xs text-zinc-500">{t.cardDesc}</span>
							</div>
						</div>

						<span
							aria-hidden="true"
							class="grid size-5 shrink-0 place-items-center rounded-full border transition-colors {selectedMethod === 'carte'
								? 'border-zinc-950 bg-zinc-950 text-white'
								: 'border-zinc-300 bg-white'}"
						>
							{#if selectedMethod === 'carte'}
								<Check size={12} strokeWidth={2.75} />
							{/if}
						</span>
					</button>
				</div>
			{/if}
		</div>

		<!-- Footer CTA -->
		<div class="px-6 pt-4 pb-6">
			<button
				type="button"
				disabled={isLoading}
				onclick={handleConfirm}
				class="flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-zinc-950 text-sm font-semibold text-white transition-colors hover:bg-zinc-800 active:scale-[0.99] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-55"
			>
				{#if isLoading}
					<Loader2 size={16} class="shrink-0 animate-spin text-white" />
					<span>{t.preparing}</span>
				{:else}
					<span>{t.continueWith(selectedLabel)}</span>
				{/if}
			</button>
		</div>
	</div>
</dialog>

<style>
	.payment-dialog::backdrop {
		background-color: rgb(9 9 11 / 0.45);
		backdrop-filter: blur(4px);
	}

	@media (prefers-reduced-motion: reduce) {
		.payment-dialog,
		.payment-dialog * {
			animation: none !important;
			transition: none !important;
		}
	}
</style>
