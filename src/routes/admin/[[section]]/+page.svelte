<script lang="ts">
	import { page } from '$app/state';

	const labels: Record<string, string> = {
		users: 'Utilisateurs',
		courses: 'Cours',
		ebooks: 'Ebooks',
		coaching: 'Coaching',
		orders: 'Commandes',
		settings: 'Paramètres'
	};

	let label = $derived(labels[page.params.section ?? ''] ?? 'Administration');
</script>

<svelte:head><title>{label} · Administration</title></svelte:head>

<section class="card border border-base-300 bg-base-100 shadow-none">
	<div class="card-body py-12 text-center">
		<h2 class="text-xl font-bold">{label}</h2>
		<p class="text-base-content/60">Cette page est prête à accueillir son futur contenu.</p>
	</div>
</section>
