<script lang="ts">
	import { page } from '$app/state';
	import WhatsAppIcon from '$lib/components/icons/WhatsAppIcon.svelte';

	let lang = $derived(page.url.searchParams.get('lang') === 'ht' ? 'ht' : 'fr');
	let message = $derived(lang === 'ht'
		? 'Bonjou, mwen gen yon kesyon sou DJR Akademi.'
		: 'Bonjour, j’ai une question concernant DJR Akademi.');
	let href = $derived(`https://wa.me/12015342884?text=${encodeURIComponent(message)}`);
	let label = $derived(lang === 'ht' ? 'Kontakte nou sou WhatsApp' : 'Nous contacter sur WhatsApp');
</script>

<a
	{href}
	target="_blank"
	rel="noopener noreferrer"
	aria-label={label}
	title={label}
	class="fixed bottom-[calc(1.25rem+env(safe-area-inset-bottom))] right-5 z-40 flex size-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg shadow-emerald-900/25 transition-transform duration-200 hover:scale-110 hover:bg-[#20bd5a] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#25D366] sm:bottom-7 sm:right-7"
>
	<WhatsAppIcon size={30} />
</a>
