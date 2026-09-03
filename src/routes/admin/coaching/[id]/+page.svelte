<script lang="ts">
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import { ArrowLeft, CalendarClock, Clock3, ExternalLink, Globe2, Info, Link2, Loader2 } from 'lucide-svelte';
	import CoachingForm from '$lib/components/coaching/CoachingForm.svelte';
	import SlotList from '$lib/components/coaching/SlotList.svelte';
	import type { CoachingFormValue, CoachingService, CoachingSettings, CoachingSlot } from '$lib/types/coaching';
	import {
		getCoachingServiceById,
		getCoachingSlots,
		getCoachingSettings,
		updateCoachingService,
		createCoachingSlot,
		createCoachingSlotsBatch,
		deleteCoachingSlot,
		DEFAULT_SETTINGS
	} from '$lib/services/coaching';
	import { toast } from '$lib/toast.svelte';

	const serviceId = $derived(page.params.id);

	let service = $state<CoachingService | null>(null);
	let slots = $state<CoachingSlot[]>([]);
	let settings = $state<CoachingSettings>(DEFAULT_SETTINGS);
	let loading = $state(true);
	let saving = $state(false);
	let activeTab = $state<'availability' | 'details'>('availability');

	onMount(async () => {
		if (serviceId) {
			try {
				const [fetchedService, fetchedSlots, fetchedSettings] = await Promise.all([
					getCoachingServiceById(serviceId),
					getCoachingSlots(serviceId),
					getCoachingSettings()
				]);
				service = fetchedService;
				slots = fetchedSlots;
				settings = fetchedSettings;
			} finally {
				loading = false;
			}
		} else {
			loading = false;
		}
	});

	let availableCount = $derived(slots.filter((slot) => slot.status === 'available').length);
	let bookedCount = $derived(slots.filter((slot) => slot.status === 'booked').length);

	async function save(value: CoachingFormValue) {
		if (!serviceId || saving) return;
		saving = true;
		try {
			const updated = await updateCoachingService(serviceId, {
				title: value.title,
				slug: value.slug,
				description: value.description,
				price: value.price,
				isFree: value.isFree,
				durationMinutes: value.durationMinutes,
				active: value.active,
				variantId: value.variantId,
				lemonsqueezyVariantId: value.lemonsqueezyVariantId
			});
			service = updated;
			toast.success('Modifications enregistrées avec succès.');
		} catch (e: any) {
			console.error('Failed to update service:', e);
			toast.error(e?.message || 'Erreur lors de la mise à jour du service.');
		} finally {
			saving = false;
		}
	}

	async function addSlot(slot: CoachingSlot) {
		if (!serviceId) return;
		try {
			const created = await createCoachingSlot(
				serviceId,
				slot.startAt,
				slot.endAt,
				settings.timezone
			);
			slots = [...slots, created].sort((a, b) => a.startAt.localeCompare(b.startAt));
			toast.success('Le créneau a été ajouté avec succès.');
		} catch (e: any) {
			console.error('Failed to add slot:', e);
			toast.error(e?.message || 'Erreur lors de l\'ajout du créneau.');
		}
	}

	async function addSlotsBatch(batch: { startAt: string; endAt: string }[]): Promise<number> {
		if (!serviceId || batch.length === 0) return 0;
		try {
			const createdList = await createCoachingSlotsBatch(
				serviceId,
				batch,
				settings.timezone
			);
			if (createdList.length > 0) {
				const existingIds = new Set(slots.map(s => s.id));
				const newUnique = createdList.filter(s => !existingIds.has(s.id));
				slots = [...slots, ...newUnique].sort((a, b) => a.startAt.localeCompare(b.startAt));
				toast.success(`${createdList.length} créneaux ajoutés avec succès !`);
			}
			return createdList.length;
		} catch (e: any) {
			console.error('Failed to add slots batch:', e);
			toast.error('Erreur lors de la génération des créneaux.');
			return 0;
		}
	}

	async function handleDeleteSlot(id: string) {
		try {
			await deleteCoachingSlot(id);
			slots = slots.filter((slot) => slot.id !== id);
			toast.success('Le créneau a été supprimé.');
		} catch (e: any) {
			console.error('Failed to delete slot:', e);
			toast.error('Erreur lors de la suppression du créneau.');
		}
	}
</script>

<svelte:head><title>{service?.title ?? 'Coaching'} · Administration</title></svelte:head>

<div class="mx-auto max-w-6xl space-y-6">
	{#if loading}
		<div class="p-16 text-center text-base-content/50 space-y-3 bg-base-100 rounded-xl border border-base-300">
			<Loader2 size={32} class="mx-auto animate-spin text-primary" />
			<p class="text-xs font-semibold">Chargement du coaching...</p>
		</div>
	{:else if !service}
		<div class="p-16 text-center text-base-content/50 space-y-3 bg-base-100 rounded-xl border border-base-300">
			<p class="text-sm font-bold text-error">Offre de coaching introuvable.</p>
			<a href="/admin/coaching" class="btn btn-ghost btn-xs">Retour à la liste</a>
		</div>
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



		<section class="rounded-xl border border-base-300 bg-base-100" aria-label="Résumé de l’offre">
			<div class="grid grid-cols-2 divide-x divide-y divide-base-300 sm:grid-cols-4 sm:divide-y-0">
				<div class="p-4"><p class="flex items-center gap-1.5 text-xs text-base-content/50"><Clock3 size={14} /> Durée</p><p class="mt-2 font-semibold">{service.durationMinutes} minutes</p></div>
				<div class="p-4"><p class="flex items-center gap-1.5 text-xs text-base-content/50"><Info size={14} /> Tarif</p><p class="mt-2 font-semibold">{service.isFree ? 'Gratuit' : `${service.price.toLocaleString('fr-FR')} HTG`}</p></div>
				<div class="p-4"><p class="flex items-center gap-1.5 text-xs text-base-content/50"><CalendarClock size={14} /> Disponibles</p><p class="mt-2 font-semibold">{availableCount} créneaux</p></div>
				<div class="p-4"><p class="flex items-center gap-1.5 text-xs text-base-content/50"><Globe2 size={14} /> Réservés</p><p class="mt-2 font-semibold">{bookedCount} créneau</p></div>
			</div>
		</section>

		<div class="border-b border-base-300">
			<div class="tabs tabs-border w-full" role="tablist" aria-label="Sections de l’offre">
				<button class="tab h-12 gap-2 px-4 font-medium" class:tab-active={activeTab === 'availability'} type="button" role="tab" aria-selected={activeTab === 'availability'} onclick={() => (activeTab = 'availability')}><CalendarClock size={17} /> Disponibilités <span class="badge badge-sm">{slots.length}</span></button>
				<button class="tab h-12 gap-2 px-4 font-medium" class:tab-active={activeTab === 'details'} type="button" role="tab" aria-selected={activeTab === 'details'} onclick={() => (activeTab = 'details')}><Info size={17} /> Informations</button>
			</div>
		</div>

		{#if activeTab === 'availability'}
			<SlotList {slots} timezone={settings.timezone} serviceId={service.id} serviceDuration={service.durationMinutes} onAdd={addSlot} onAddBatch={addSlotsBatch} onDelete={handleDeleteSlot} />
		{:else}
			<CoachingForm initial={service} saving={saving} onSave={save} />
		{/if}
	{/if}
</div>
