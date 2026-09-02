<script lang="ts">
	import { goto } from '$app/navigation';
	import { ArrowLeft } from 'lucide-svelte';
	import CoachingForm from '$lib/components/coaching/CoachingForm.svelte';
	import type { CoachingFormValue } from '$lib/types/coaching';
	import { createCoachingService } from '$lib/services/coaching';
	import { toast } from '$lib/toast.svelte';

	let saving = $state(false);

	async function save(value: CoachingFormValue) {
		saving = true;
		try {
			await createCoachingService({
				title: value.title,
				slug: value.slug,
				description: value.description,
				price: value.price,
				isFree: value.isFree,
				durationMinutes: value.durationMinutes,
				active: value.active
			});
			toast.success('Offre de coaching créée avec succès.');
			await goto('/admin/coaching');
		} catch (error: any) {
			console.error('Failed to create coaching service in Appwrite:', error);
			toast.error(error?.message || 'Erreur lors de la création du coaching.');
		} finally {
			saving = false;
		}
	}
</script>

<svelte:head>
	<title>Nouveau Coaching · DJR Akademi Admin</title>
</svelte:head>

<div class="mx-auto max-w-5xl space-y-6">
	<!-- Top Navigation & Header Banner -->
	<div class="space-y-3">
		<a
			href="/admin/coaching"
			class="btn btn-ghost btn-xs rounded-none gap-1 font-semibold text-xs text-base-content/60 hover:text-base-content self-start inline-flex items-center"
		>
			<ArrowLeft size={14} />
			Retour aux offres de coaching
		</a>

		<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
			<div>
				<h1 class="text-2xl sm:text-3xl font-black text-base-content tracking-tight">
					Créer une offre de coaching
				</h1>
				<p class="text-xs sm:text-sm text-base-content/60 mt-1 font-medium">
					Définissez le titre, la durée et le tarif de votre nouvelle consultation 1-on-1.
				</p>
			</div>
			<span class="badge badge-primary font-bold text-xs px-3 py-2 shrink-0">
				Nouveau Service
			</span>
		</div>
	</div>

	<!-- Form Component -->
	<CoachingForm saving={saving} onSave={save} submitLabel="Créer l'offre de coaching" />
</div>
