<script lang="ts">
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import { ArrowLeft, CalendarClock, Clock3, ExternalLink, Info, Link2, Loader2 } from 'lucide-svelte';
	import CoachingForm from '$lib/components/coaching/CoachingForm.svelte';
	import AvailabilityEditor from '$lib/components/coaching/AvailabilityEditor.svelte';
	import type { CoachingFormValue, CoachingService, CoachingSettings } from '$lib/types/coaching';
	import {
		getCoachingServiceById,
		getCoachingSettings,
		updateCoachingService,
		DEFAULT_SETTINGS
	} from '$lib/services/coaching';
	import { toast } from '$lib/toast.svelte';

	const serviceId = $derived(page.params.id);
	let service = $state<CoachingService | null>(null);
	let settings = $state<CoachingSettings>(DEFAULT_SETTINGS);
	let loading = $state(true);
	let saving = $state(false);
	let activeTab = $state<'availability' | 'details'>('availability');

	onMount(async () => {
		if (serviceId) {
			try {
				[service, settings] = await Promise.all([getCoachingServiceById(serviceId), getCoachingSettings()]);
			} finally { loading = false; }
		} else { loading = false; }
	});

	async function save(value: CoachingFormValue) {
		if (!serviceId || saving) return;
		saving = true;
		try {
			service = await updateCoachingService(serviceId, {
				title: value.title, slug: value.slug, description: value.description,
				price: value.price, priceUsd: value.priceUsd, isFree: value.isFree,
				durationMinutes: value.durationMinutes, active: value.active,
				variantId: value.variantId, lemonsqueezyVariantId: value.lemonsqueezyVariantId
			});
			toast.success('Modifications enregistrées avec succès.');
		} catch (error: any) {
			toast.error(error?.message || 'Erreur lors de la mise à jour du service.');
		} finally { saving = false; }
	}
</script>

<svelte:head><title>{service?.title ?? 'Coaching'} · Administration</title></svelte:head>

<div class="mx-auto max-w-6xl space-y-6">
	{#if loading}
		<div class="rounded-xl border border-base-300 bg-base-100 p-16 text-center text-base-content/50"><Loader2 size={32} class="mx-auto animate-spin text-primary" /></div>
	{:else if !service}
		<div class="rounded-xl border border-base-300 bg-base-100 p-16 text-center"><p class="text-sm font-bold text-error">Offre de coaching introuvable.</p><a href="/admin/coaching" class="btn btn-ghost btn-xs mt-3">Retour à la liste</a></div>
	{:else}
		<header>
			<a class="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-base-content/55 hover:text-base-content" href="/admin/coaching"><ArrowLeft size={16} /> Toutes les offres</a>
			<div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
				<div class="min-w-0">
					<div class="flex flex-wrap items-center gap-2"><h2 class="truncate text-2xl font-bold tracking-tight sm:text-3xl">{service.title}</h2><span class={`badge badge-sm ${service.active ? 'badge-success badge-soft' : 'badge-ghost'}`}>{service.active ? 'Publiée' : 'Brouillon'}</span></div>
					<p class="mt-1 flex items-center gap-1.5 text-sm text-base-content/50"><Link2 size={14} /> /coaching/{service.slug}</p>
				</div>
				<a class="btn btn-outline min-h-11 bg-base-100" href={`/coaching/${service.slug}`} target="_blank" rel="noreferrer"><ExternalLink size={17} /> Voir la page publique</a>
			</div>
		</header>

		<section class="rounded-xl border border-base-300 bg-base-100">
			<div class="grid grid-cols-2 divide-x divide-base-300">
				<div class="p-4"><p class="flex items-center gap-1.5 text-xs text-base-content/50"><Clock3 size={14} /> Durée</p><p class="mt-2 font-semibold">{service.durationMinutes} minutes</p></div>
				<div class="p-4"><p class="flex items-center gap-1.5 text-xs text-base-content/50"><CalendarClock size={14} /> Disponibilité</p><p class="mt-2 font-semibold">Génération automatique</p></div>
			</div>
		</section>

		<div class="border-b border-base-300">
			<div class="tabs tabs-border w-full" role="tablist" aria-label="Sections de l’offre">
				<button class="tab h-12 gap-2 px-4 font-medium" class:tab-active={activeTab === 'availability'} type="button" role="tab" aria-selected={activeTab === 'availability'} onclick={() => (activeTab = 'availability')}><CalendarClock size={17} /> Horaires & indisponibilités</button>
				<button class="tab h-12 gap-2 px-4 font-medium" class:tab-active={activeTab === 'details'} type="button" role="tab" aria-selected={activeTab === 'details'} onclick={() => (activeTab = 'details')}><Info size={17} /> Informations</button>
			</div>
		</div>

		{#if activeTab === 'availability'}
			<AvailabilityEditor serviceId={service.id} {settings} onSettingsUpdated={(updated) => (settings = updated)} />
		{:else}
			<CoachingForm initial={service} saving={saving} onSave={save} />
		{/if}
	{/if}
</div>
