<script lang="ts">
	import { page } from '$app/state';

	const labels: Record<string, string> = {
		courses: 'Nouveau cours',
		ebooks: 'Nouvel ebook',
		coaching: 'Nouveau coaching'
	};

	let title = $derived(labels[page.params.section ?? ''] ?? 'Nouveau contenu');
</script>

<svelte:head><title>{title} · DJR Akademi</title></svelte:head>

<section class="card border border-base-300 bg-base-100 shadow-none">
	<div class="card-body py-12 text-center">
		<h2 class="text-xl font-bold">{title}</h2>
		<p class="text-base-content/60">Le formulaire sera ajouté dans une prochaine étape.</p>
	</div>
</section>
