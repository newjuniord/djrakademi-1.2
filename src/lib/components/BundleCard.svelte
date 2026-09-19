<script lang="ts">
	import type { Bundle } from '$lib/services/bundles';
	import { formatPublicPrice, useHTG } from '$lib/utils/public-price';
	import { ArrowRight, BookOpen, FileText, Layers3 } from 'lucide-svelte';
	let { bundle }: { bundle: Bundle } = $props();
	const courseCount = $derived(bundle.items.filter((item) => item.type === 'course').length);
	const ebookCount = $derived(bundle.items.filter((item) => item.type === 'ebook').length);
</script>

<a href={`/bundles/${bundle.id}`} class="group flex h-full flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition-all hover:-translate-y-1 hover:border-amber-400/50 hover:shadow-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-500">
	<div class="relative aspect-[16/10] overflow-hidden bg-zinc-900">
		{#if bundle.cover}
			<img src={bundle.cover} alt={bundle.title} class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
		{:else}
			<div class="grid h-full place-items-center bg-gradient-to-br from-zinc-950 via-zinc-800 to-amber-900"><Layers3 size={56} class="text-amber-400" /></div>
		{/if}
		<div class="absolute left-4 top-4 rounded-full bg-amber-400 px-3 py-1.5 text-[11px] font-black uppercase tracking-wide text-zinc-950">Bundle · {bundle.items.length} resous</div>
	</div>
	<div class="flex flex-1 flex-col gap-4 p-5 sm:p-6">
		<div>
			<h3 class="text-lg font-black text-zinc-950 transition-colors group-hover:text-amber-700">{bundle.title}</h3>
			<p class="mt-2 line-clamp-2 text-sm leading-relaxed text-zinc-500">{bundle.description}</p>
		</div>
		<div class="flex flex-wrap gap-2 text-[11px] font-bold text-zinc-600">
			{#if courseCount}<span class="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2.5 py-1"><BookOpen size={13} /> {courseCount} fòmasyon</span>{/if}
			{#if ebookCount}<span class="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2.5 py-1"><FileText size={13} /> {ebookCount} e-book</span>{/if}
		</div>
		<div class="mt-auto flex items-end justify-between gap-3 border-t border-zinc-100 pt-4">
			<div><span class="block text-[11px] font-semibold text-zinc-500">Pri bundle la</span><strong class="text-xl font-black text-zinc-950">{formatPublicPrice(bundle.price, bundle.priceUsd)}</strong>{#if useHTG && bundle.originalPrice > bundle.price}<span class="ml-2 text-xs text-zinc-400 line-through">{bundle.originalPrice.toLocaleString('fr-FR')}</span>{/if}</div>
			<span class="grid size-10 shrink-0 place-items-center rounded-full bg-zinc-950 text-white transition-colors group-hover:bg-amber-500 group-hover:text-zinc-950"><ArrowRight size={18} /></span>
		</div>
	</div>
</a>
