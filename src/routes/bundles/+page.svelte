<script lang="ts">
	import { onMount } from 'svelte';
	import PublicHeader from '$lib/components/PublicHeader.svelte';
	import PublicFooter from '$lib/components/PublicFooter.svelte';
	import BundleCard from '$lib/components/BundleCard.svelte';
	import { getPublishedBundles, type Bundle } from '$lib/services/bundles';
	import { Layers3, ArrowLeft } from 'lucide-svelte';
	let bundles = $state<Bundle[]>([]);
	let loading = $state(true);
	let error = $state('');
	onMount(async () => { try { bundles = await getPublishedBundles(); } catch { error = 'Nou pa ka chaje bundles yo kounye a.'; } finally { loading = false; } });
</script>
<svelte:head><title>Bundles fòmasyon ak e-books · DJR Akademi</title><meta name="description" content="Dekouvri bundles DJR Akademi: fòmasyon videyo ak e-books ansanm nan yon sèl òf." /></svelte:head>
<div class="flex min-h-screen flex-col bg-zinc-50 text-zinc-950">
	<PublicHeader />
	<main class="flex-1">
		<section class="relative overflow-hidden bg-zinc-950 px-4 py-16 text-white sm:py-24">
			<div class="pointer-events-none absolute -right-24 -top-32 size-96 rounded-full bg-amber-500/10 blur-3xl"></div>
			<div class="relative mx-auto max-w-7xl">
				<a href="/catalogue" class="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-white/60 hover:text-white"><ArrowLeft size={16} /> Retounen nan katalòg la</a>
				<div class="mb-5 inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-amber-400"><Layers3 size={14} /> Pak espesyal</div>
				<h1 class="max-w-3xl text-4xl font-black tracking-tight sm:text-6xl">Aprann plis, ansanm.</h1>
				<p class="mt-5 max-w-2xl text-base leading-relaxed text-zinc-300 sm:text-lg">Jwenn fòmasyon ak e-books ki mache ansanm nan yon sèl bundle. Yon sèl peman, tout resous yo nan espas ou.</p>
			</div>
		</section>
		<section class="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
			{#if loading}<div class="py-20 text-center text-zinc-500">N ap chaje bundles yo…</div>
			{:else if error}<div class="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">{error}</div>
			{:else if !bundles.length}<div class="rounded-2xl border border-zinc-200 bg-white px-6 py-16 text-center"><Layers3 size={34} class="mx-auto mb-4 text-amber-500" /><h2 class="text-xl font-black">Pa gen bundle disponib pou kounye a</h2><p class="mt-2 text-sm text-zinc-500">Nou pral ajoute nouvo pak talè.</p><a href="/catalogue" class="mt-6 inline-block text-sm font-bold text-amber-700 hover:underline">Gade tout katalòg la</a></div>
			{:else}<div class="mb-8"><h2 class="text-2xl font-black">Tout bundles yo</h2><p class="mt-1 text-sm text-zinc-500">Chwazi pak ki pi bon pou objektif ou.</p></div><div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{#each bundles as bundle (bundle.id)}<BundleCard {bundle} />{/each}</div>{/if}
		</section>
	</main>
	<PublicFooter />
</div>
