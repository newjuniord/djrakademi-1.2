<script lang="ts">
	import { Wrench, X } from 'lucide-svelte';
	import { page } from '$app/state';

	let { open = false, onClose }: { open: boolean; onClose: () => void } = $props();

	let currentLang = $derived<'fr' | 'ht'>(page.url.searchParams.get('lang') === 'ht' ? 'ht' : 'fr');

	const i18n = {
		fr: {
			title: 'Maintenance en cours',
			heading: 'L\'application est actuellement en maintenance.',
			body: 'Nous ne pouvons pas traiter les achats ou réservations pour le moment. Veuillez réessayer plus tard.',
			understand: 'J\'ai compris',
			close: 'Fermer'
		},
		ht: {
			title: 'Antretyen ankou',
			heading: 'Aplikasyon an, nan antretyen kounye a.',
			body: 'Nou pa ka trete acha oswa rezèvasyon pou moman an. Tanpri eseye ankò pita.',
			understand: 'Mwen konprann',
			close: 'Fèmen'
		}
	};

	let t = $derived(i18n[currentLang]);
</script>

{#if open}
	<div class="fixed inset-0 z-[70] grid place-items-center bg-black/60 p-4 backdrop-blur-xs" role="presentation">
		<div class="w-full max-w-md overflow-hidden rounded-3xl bg-white text-zinc-900 shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="maintenance-title">
			<div class="flex items-center justify-between border-b border-amber-100 bg-amber-50 p-5">
				<div class="flex items-center gap-3">
					<div class="grid size-10 place-items-center rounded-xl bg-amber-500 text-white"><Wrench size={20} /></div>
					<h2 id="maintenance-title" class="text-lg font-black">{t.title}</h2>
				</div>
				<button type="button" class="grid size-8 place-items-center rounded-full bg-white text-zinc-500 hover:text-zinc-900" onclick={onClose} aria-label={t.close}>
					<X size={17} />
				</button>
			</div>
			<div class="space-y-3 p-6">
				<p class="text-sm font-bold">{t.heading}</p>
				<p class="text-sm leading-relaxed text-zinc-600">{t.body}</p>
			</div>
			<div class="border-t border-zinc-100 bg-zinc-50 p-5">
				<button type="button" class="btn w-full rounded-xl bg-black text-xs font-bold text-white hover:bg-zinc-800" onclick={onClose}>{t.understand}</button>
			</div>
		</div>
	</div>
{/if}
