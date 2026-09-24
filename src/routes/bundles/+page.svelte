<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import PublicHeader from '$lib/components/PublicHeader.svelte';
	import PublicFooter from '$lib/components/PublicFooter.svelte';
	import BundleCard from '$lib/components/BundleCard.svelte';
	import { getPublishedBundles, type Bundle } from '$lib/services/bundles';
	import { Layers3, ArrowLeft } from 'lucide-svelte';

	let currentLang = $derived<'fr' | 'ht'>(page.url.searchParams.get('lang') === 'ht' ? 'ht' : 'fr');

	const i18n = {
		fr: {
			metaTitle: "Offres groupées Formations et Livres électroniques · DJR Akademi",
			metaDesc: "Découvrez les offres groupées DJR Akademi : des formations vidéo et des livres électroniques réunis dans une offre unique.",
			backToCatalogue: "Retour au catalogue",
			badge: "Offres groupées",
			heroTitle: "Apprenez plus, ensemble.",
			heroDesc: "Obtenez des formations et des livres électroniques complémentaires dans une seule offre groupée. Un seul paiement pour accéder à toutes vos ressources.",
			loading: "Chargement des offres groupées...",
			loadError: "Impossible de charger les offres groupées pour le moment.",
			emptyTitle: "Aucune offre groupée disponible pour le moment",
			emptyDesc: "De nouvelles offres groupées seront bientôt ajoutées.",
			viewCatalogue: "Voir tout le catalogue",
			allBundlesTitle: "Toutes les offres groupées",
			allBundlesDesc: "Choisissez l'offre idéale selon vos objectifs."
		},
		ht: {
			metaTitle: "Pakèt resous fòmasyon ak liv dijital · DJR Akademi",
			metaDesc: "Dekouvri pakèt resous DJR Akademi: fòmasyon videyo ak liv dijital ansanm nan yon sèl òf.",
			backToCatalogue: "Retounen nan katalòg la",
			badge: "Pakèt resous",
			heroTitle: "Aprann plis, ansanm.",
			heroDesc: "Jwenn fòmasyon ak liv dijital ki mache ansanm nan yon sèl pakèt resous. Yon sèl peman, tout resous yo nan espas ou.",
			loading: "N ap chaje pakèt resous yo…",
			loadError: "Nou pa ka chaje pakèt resous yo kounye a.",
			emptyTitle: "Pa gen pakèt resous disponib kounye a",
			emptyDesc: "Nou pral ajoute nouvo pakèt resous talè.",
			viewCatalogue: "Gade tout katalòg la",
			allBundlesTitle: "Tout pakèt resous yo",
			allBundlesDesc: "Chwazi pakèt ki pi bon pou objektif ou."
		}
	};

	let t = $derived(i18n[currentLang]);

	function getHref(path: string): string {
		if (currentLang !== 'ht') return path;
		const [pathname, search] = path.split('?');
		const params = new URLSearchParams(search || '');
		params.set('lang', 'ht');
		return `${pathname}?${params.toString()}`;
	}

	let bundles = $state<Bundle[]>([]);
	let loading = $state(true);
	let error = $state('');

	onMount(async () => {
		try {
			bundles = await getPublishedBundles();
		} catch {
			error = t.loadError;
		} finally {
			loading = false;
		}
	});
</script>

<svelte:head>
	<title>{t.metaTitle}</title>
	<meta name="description" content={t.metaDesc} />
</svelte:head>

<div class="flex min-h-screen flex-col bg-zinc-50 text-zinc-950">
	<PublicHeader />
	<main class="flex-1">
		<section class="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
			{#if loading}
				<div class="py-20 text-center text-zinc-500">{t.loading}</div>
			{:else if error}
				<div class="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">{error}</div>
			{:else if !bundles.length}
				<div class="rounded-2xl border border-zinc-200 bg-white px-6 py-16 text-center">
					<Layers3 size={34} class="mx-auto mb-4 text-amber-500" />
					<h2 class="text-xl font-black">{t.emptyTitle}</h2>
					<p class="mt-2 text-sm text-zinc-500">{t.emptyDesc}</p>
					<a href={getHref('/catalogue')} class="mt-6 inline-block text-sm font-bold text-amber-700 hover:underline">{t.viewCatalogue}</a>
				</div>
			{:else}
				<div class="mb-8">
					<h2 class="text-2xl font-black">{t.allBundlesTitle}</h2>
					<p class="mt-1 text-sm text-zinc-500">{t.allBundlesDesc}</p>
				</div>
				<div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
					{#each bundles as bundle (bundle.id)}
						<BundleCard {bundle} />
					{/each}
				</div>
			{/if}
		</section>
	</main>
	<PublicFooter />
</div>
