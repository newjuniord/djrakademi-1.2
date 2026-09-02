<script lang="ts">
	import type { Ebook } from '$lib/types/admin';
	import { ArrowRight, FileText } from 'lucide-svelte';

	let {
		ebook,
		onSelect
	}: {
		ebook: Ebook;
		onSelect?: (ebook: Ebook) => void;
	} = $props();
</script>

<div class="card bg-base-100 shadow-sm border border-base-200/80 rounded-none overflow-hidden hover:shadow-md transition-shadow flex flex-col justify-between h-full group">
	<div>
		<!-- Cover Image -->
		<div class="relative aspect-4/3 bg-base-200 overflow-hidden">
			{#if ebook.cover}
				<img
					src={ebook.cover}
					alt={ebook.title}
					class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
					loading="lazy"
				/>
			{:else}
				<div class="w-full h-full flex items-center justify-center bg-base-300/40 text-base-content/40">
					<FileText size={32} />
				</div>
			{/if}

			<!-- Price Badge Overlay -->
			<div class="absolute top-3 right-3">
				{#if ebook.isFree || ebook.price === 0}
					<span class="badge badge-success font-bold text-xs bg-success text-white border-none rounded-none px-2.5 py-1">
						Gratis
					</span>
				{:else}
					<span class="badge bg-black text-white font-bold text-xs border-none rounded-none px-2.5 py-1">
						{ebook.price.toLocaleString('fr-FR')} HTG
					</span>
				{/if}
			</div>
		</div>

		<!-- Card Body -->
		<div class="p-5 space-y-2">
			<h3 class="font-bold text-base text-base-content line-clamp-1 group-hover:text-primary transition-colors">
				{ebook.title}
			</h3>
			<p class="text-xs text-base-content/65 line-clamp-2 leading-relaxed">
				{ebook.description}
			</p>
		</div>
	</div>

	<!-- Footer Button -->
	<div class="p-5 pt-0">
		{#if onSelect}
			<button
				type="button"
				class="btn btn-outline border-base-300 w-full rounded-none btn-sm text-xs font-bold gap-2 group-hover:bg-black group-hover:text-white group-hover:border-black transition-all"
				onclick={() => onSelect?.(ebook)}
			>
				<span>Gade ebook la</span>
				<ArrowRight size={14} />
			</button>
		{:else}
			<a
				href="#ebooks"
				class="btn btn-outline border-base-300 w-full rounded-none btn-sm text-xs font-bold gap-2 group-hover:bg-black group-hover:text-white group-hover:border-black transition-all"
			>
				<span>Gade ebook la</span>
				<ArrowRight size={14} />
			</a>
		{/if}
	</div>
</div>
