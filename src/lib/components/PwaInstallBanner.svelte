<script lang="ts">
	import { onMount } from 'svelte';
	import { Download, X, Smartphone } from 'lucide-svelte';
	import { toast } from '$lib/toast.svelte';

	let deferredPrompt = $state<any>(null);
	let showBanner = $state(false);
	let isIos = $state(false);

	onMount(() => {
		if (typeof window === 'undefined') return;

		// Check if already running as installed standalone app
		const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone;
		if (isStandalone) return;

		// Check if iOS Safari
		const ua = window.navigator.userAgent;
		isIos = /iphone|ipad|ipod/i.test(ua);

		// Check if user previously dismissed in last 7 days
		const dismissed = localStorage.getItem('pwa_prompt_dismissed');
		if (dismissed && Date.now() - Number(dismissed) < 7 * 24 * 60 * 60 * 1000) {
			return;
		}

		window.addEventListener('beforeinstallprompt', (e) => {
			e.preventDefault();
			deferredPrompt = e;
			showBanner = true;
		});

		// On iOS Safari, show prompt after 3s if not standalone
		if (isIos && !isStandalone) {
			setTimeout(() => {
				showBanner = true;
			}, 3000);
		}
	});

	async function handleInstall() {
		if (deferredPrompt) {
			deferredPrompt.prompt();
			const { outcome } = await deferredPrompt.userChoice;
			if (outcome === 'accepted') {
				showBanner = false;
			}
			deferredPrompt = null;
		} else if (isIos) {
			toast.info('Pou w enstale sou iPhone: klike sou bouton Pataje ⎋ nan Safari, epi chwazi "Ajoute sou ekran prensipal".', 8000);
		} else {
			toast.info('Pou w enstale aplikasyon an, klike sou meni navigatè w la epi chwazi "Enstale DJR Akademi".', 6000);
		}
	}

	function dismiss() {
		showBanner = false;
		try {
			localStorage.setItem('pwa_prompt_dismissed', String(Date.now()));
		} catch {
			/* localStorage disabled */
		}
	}
</script>

{#if showBanner}
	<div class="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-sm z-50 transition-all">
		<div class="bg-zinc-950 border border-amber-400/40 text-white rounded-2xl p-4 shadow-2xl backdrop-blur-md flex items-center justify-between gap-3">
			<div class="flex items-center gap-3">
				<div class="size-10 bg-amber-400/15 text-amber-400 rounded-xl grid place-items-center shrink-0">
					<Smartphone size={20} />
				</div>
				<div class="text-left">
					<p class="text-xs font-bold text-white">Enstale DJR Akademi</p>
					<p class="text-[11px] text-zinc-400">Aksè rapid ak yon sèl klik</p>
				</div>
			</div>
			<div class="flex items-center gap-2 shrink-0">
				<button
					type="button"
					onclick={handleInstall}
					class="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-zinc-950 font-black text-xs rounded-xl flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-md"
				>
					<Download size={13} />
					<span>Enstale</span>
				</button>
				<button
					type="button"
					onclick={dismiss}
					aria-label="Fèmen"
					class="size-7 grid place-items-center text-zinc-400 hover:text-white rounded-lg transition-colors cursor-pointer"
				>
					<X size={15} />
				</button>
			</div>
		</div>
	</div>
{/if}
