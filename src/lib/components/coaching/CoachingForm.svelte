<script lang="ts">
	import { untrack } from 'svelte';
	import { AlertCircle, BadgeDollarSign, CheckCircle2, Clock3, Globe2, Save, Link2, Sparkles, Loader2 } from 'lucide-svelte';
	import { slugify, validateCoaching } from '$lib/coaching/validation';
	import type { CoachingDuration, CoachingFormValue } from '$lib/types/coaching';

	let { initial, onSave, saving = false, submitLabel = 'Enregistrer les modifications' }: {
		initial?: Partial<CoachingFormValue>; saving?: boolean; onSave: (value: CoachingFormValue) => void; submitLabel?: string;
	} = $props();
	const defaults = untrack(() => initial);

	let title = $state(defaults?.title ?? '');
	let slug = $state(defaults?.slug ?? '');
	let description = $state(defaults?.description ?? '');
	let price = $state(defaults?.price ?? 3000);
	let priceUsd = $state<number | undefined>(defaults?.priceUsd);
	let isFree = $state(defaults?.isFree ?? false);
	let durationMinutes = $state<CoachingDuration>(defaults?.durationMinutes ?? 60);
	let active = $state(defaults?.active ?? true);
	let variantId = $state(defaults?.variantId ?? defaults?.lemonsqueezyVariantId ?? '');
	let error = $state('');
	let slugEdited = $state(Boolean(defaults?.slug));
	let submitting = $state(false);

	function updateTitle(value: string) {
		title = value;
		if (!slugEdited) slug = slugify(value);
	}

	async function submit(event: SubmitEvent) {
		event.preventDefault();
		if (submitting || saving) return;
		const value: CoachingFormValue = {
			title: title.trim(),
			slug: slugify(slug),
			description: description.trim(),
			price: isFree ? 0 : Number(price),
			priceUsd: isFree ? undefined : (priceUsd && priceUsd > 0 ? Number(priceUsd) : undefined),
			isFree,
			durationMinutes,
			active,
			variantId: variantId.trim(),
			lemonsqueezyVariantId: variantId.trim()
		};
		error = validateCoaching(value) ?? '';
		if (!error) {
			submitting = true;
			try { await onSave(value); } finally { submitting = false; }
		}
	}
</script>

<form class="space-y-6" onsubmit={submit}>
	{#if error}
		<div class="alert alert-error shadow-sm rounded-2xl">
			<AlertCircle size={18} />
			<span class="font-bold text-xs">{error}</span>
		</div>
	{/if}

	<div class="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
		<!-- LEFT MAIN CARD: INFORMATIONS DE L'OFFRE -->
		<section class="card border border-base-300 bg-base-100 shadow-xs rounded-2xl overflow-hidden">
			<div class="border-b border-base-200/80 px-6 py-5 flex items-center justify-between">
				<div>
					<h3 class="font-extrabold text-base text-base-content tracking-tight">Informations de la Session</h3>
					<p class="mt-0.5 text-xs text-base-content/60 font-medium">Présentez votre offre de coaching et le programme de la consultation.</p>
				</div>
				<span class="size-8 bg-primary/10 text-primary rounded-xl grid place-items-center font-bold">
					<Sparkles size={16} />
				</span>
			</div>

			<div class="space-y-6 p-6 sm:p-7">
				<!-- Titre de l'offre -->
				<div class="form-control gap-2">
					<label for="coaching-title" class="label-text font-bold text-[11px] uppercase tracking-wider text-base-content/70">
						Titre de l'offre de coaching <span class="text-error">*</span>
					</label>
					<input
						id="coaching-title"
						class="input input-bordered w-full rounded-xl text-xs font-bold text-base-content bg-base-100 border-base-300 shadow-2xs focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:font-normal placeholder:text-base-content/30"
						required
						value={title}
						oninput={(event) => updateTitle(event.currentTarget.value)}
						placeholder="Ex: Coaching 1-on-1 Business DJing & Productivité"
					/>
				</div>

				<!-- Description -->
				<div class="form-control gap-2">
					<label for="coaching-desc" class="label-text font-bold text-[11px] uppercase tracking-wider text-base-content/70">
						Description & Objectifs de la session <span class="text-error">*</span>
					</label>
					<textarea
						id="coaching-desc"
						class="textarea textarea-bordered w-full min-h-40 rounded-xl text-xs text-base-content leading-relaxed bg-base-100 border-base-300 shadow-2xs focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-base-content/30"
						required
						bind:value={description}
						placeholder="Décrivez précisément ce que le client apprendra pendant cette session : analyse de carrière, optimisation du setup audio, stratégie de réservation…"
					></textarea>
					<p class="text-[11px] text-base-content/50 font-medium">💡 Soyez clair sur le résultat concret obtenu à la fin de la séance.</p>
				</div>

				<!-- URL Slug -->
				<div class="form-control gap-2">
					<label for="coaching-slug" class="label-text font-bold text-[11px] uppercase tracking-wider text-base-content/70 flex items-center gap-1.5">
						<Link2 size={13} class="text-base-content/50" />
						<span>Adresse personnalisée de la page (URL Slug)</span>
					</label>
					<div class="join w-full shadow-2xs rounded-xl overflow-hidden border border-base-300 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all bg-base-100">
						<span class="join-item bg-base-200/60 text-base-content/60 text-xs font-mono font-semibold px-3.5 flex items-center border-r border-base-300 select-none">
							/coaching/
						</span>
						<input
							id="coaching-slug"
							class="input input-sm join-item border-none bg-transparent min-w-0 flex-1 text-xs font-mono font-bold text-base-content focus:outline-none placeholder:font-normal placeholder:text-base-content/30"
							required
							bind:value={slug}
							oninput={() => (slugEdited = true)}
							placeholder="coaching-business-djing"
						/>
					</div>
				</div>
			</div>
		</section>

		<!-- RIGHT SIDEBAR CARD: TARIFICATION & VISIBILITÉ -->
		<aside class="card border border-base-300 bg-base-100 shadow-xs rounded-2xl overflow-hidden space-y-6 p-6">
			<div class="pb-4 border-b border-base-200/80">
				<h3 class="font-extrabold text-base text-base-content tracking-tight">Paramètres d'Accès</h3>
				<p class="mt-0.5 text-xs text-base-content/60 font-medium">Durée, tarification et visibilité publique.</p>
			</div>

			<!-- Durée -->
			<div class="form-control gap-2">
				<label for="coaching-duration" class="label-text font-bold text-[11px] uppercase tracking-wider text-base-content/70 flex items-center gap-1.5">
					<Clock3 size={14} class="text-primary" />
					<span>Durée de la séance</span>
				</label>
				<div class="grid grid-cols-2 gap-2">
					{#each [30, 45, 60, 90] as duration}
						<button
							type="button"
							class={`btn btn-sm rounded-xl font-bold text-xs transition-all ${durationMinutes === duration ? 'btn-primary shadow-xs' : 'btn-ghost bg-base-200/50 hover:bg-base-200 text-base-content/70'}`}
							onclick={() => (durationMinutes = duration as CoachingDuration)}
						>
							{duration} min
						</button>
					{/each}
				</div>
			</div>

			<div class="divider my-0 border-base-200/60"></div>

			<!-- Tarif -->
			<div class="space-y-3">
				<div class="flex items-center justify-between">
					<label for="is-free-toggle" class="label-text font-bold text-[11px] uppercase tracking-wider text-base-content/70 flex items-center gap-1.5">
						<BadgeDollarSign size={14} class="text-emerald-600" />
						<span>Tarif de la session</span>
					</label>
				</div>

				<div class="p-3.5 rounded-2xl bg-base-200/40 border border-base-300/80 space-y-3">
					<label class="flex cursor-pointer items-center justify-between">
						<span class="text-xs font-bold text-base-content">Session offerte (Gratuite)</span>
						<input id="is-free-toggle" type="checkbox" class="toggle toggle-primary toggle-sm" bind:checked={isFree} />
					</label>

					{#if !isFree}
						<div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
							<div class="form-control gap-1">
								<span class="text-[10px] font-bold uppercase tracking-wider text-base-content/50">Prix (HTG) *</span>
								<div class="join w-full shadow-2xs rounded-xl overflow-hidden border border-base-300 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all bg-base-100">
									<input
										class="input input-sm join-item border-none bg-transparent min-w-0 flex-1 text-xs font-mono font-black text-base-content focus:outline-none"
										type="number"
										min="0"
										bind:value={price}
										required
									/>
									<span class="join-item bg-base-200/60 text-base-content/70 text-xs font-bold px-3 flex items-center border-l border-base-300">
										HTG
									</span>
								</div>
							</div>

							<div class="form-control gap-1">
								<span class="text-[10px] font-bold uppercase tracking-wider text-base-content/50">Prix (USD $) (Optionnel)</span>
								<div class="join w-full shadow-2xs rounded-xl overflow-hidden border border-base-300 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all bg-base-100">
									<input
										class="input input-sm join-item border-none bg-transparent min-w-0 flex-1 text-xs font-mono font-black text-base-content focus:outline-none"
										type="number"
										min="1"
										step="0.01"
										bind:value={priceUsd}
										placeholder="Ex: 20"
									/>
									<span class="join-item bg-base-200/60 text-base-content/70 text-xs font-bold px-3 flex items-center border-l border-base-300">
										USD
									</span>
								</div>
							</div>
						</div>

						<div class="form-control gap-1 pt-2 border-t border-base-200/60">
							<label for="lemonsqueezy-variant-id" class="label-text font-bold text-[10px] uppercase tracking-wider text-base-content/60 flex items-center justify-between">
								<span>Lemon Squeezy Variant ID</span>
								<span class="text-[9px] font-normal text-base-content/40 font-mono">Paiement par Kat</span>
							</label>
							<input
								id="lemonsqueezy-variant-id"
								type="text"
								placeholder="ex: 482049"
								bind:value={variantId}
								class="input input-sm input-bordered w-full rounded-xl text-xs font-mono font-bold text-base-content bg-base-100 border-base-300 shadow-2xs focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:font-normal placeholder:text-base-content/30"
							/>
						</div>
					{:else}
						<p class="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
							<CheckCircle2 size={13} /> Réservation gratuite sans paiement
						</p>
					{/if}
				</div>
			</div>

			<div class="divider my-0 border-base-200/60"></div>

			<!-- Publication / Statut -->
			<div class="space-y-3">
				<label class="flex cursor-pointer items-start justify-between gap-3">
					<div>
						<span class="flex items-center gap-1.5 text-xs font-bold text-base-content">
							<Globe2 size={14} class="text-primary" />
							Offre active & publiée
						</span>
						<span class="mt-0.5 block text-[11px] font-medium text-base-content/50 leading-relaxed">
							Accessible immédiatement pour la réservation.
						</span>
					</div>
					<input type="checkbox" class="toggle toggle-primary toggle-sm mt-0.5" bind:checked={active} />
				</label>

				<div class={`rounded-xl p-3 text-xs font-bold flex items-center gap-2 ${active ? 'bg-emerald-500/10 text-emerald-700 border border-emerald-500/20' : 'bg-base-200 text-base-content/60'}`}>
					<CheckCircle2 size={15} class="shrink-0" />
					<span>{active ? 'Visible sur la plateforme' : 'Enregistrée comme brouillon'}</span>
				</div>
			</div>
		</aside>
	</div>

	<!-- SUBMIT ACTION BAR -->
	<div class="flex items-center justify-end gap-3 rounded-2xl border border-base-300 bg-base-100 p-4 shadow-xs">
		<button class="btn btn-primary min-h-11 px-8 rounded-xl font-bold gap-2 text-sm shadow-md" type="submit" disabled={saving || submitting}>
			{#if saving || submitting}
				<Loader2 size={18} class="animate-spin" />
				<span>Enregistrement…</span>
			{:else}
				<Save size={18} />
				<span>{submitLabel}</span>
			{/if}
		</button>
	</div>
</form>
