<script lang="ts">
	import type { Course } from '$lib/types/admin';
	import { X, BookOpen, ExternalLink, Upload, Image as ImageIcon, Trash2 } from 'lucide-svelte';

	let {
		open = false,
		course = null,
		saving = false,
		onClose,
		onSave,
		onManageLessons
	}: {
		open: boolean;
		course: Course | null;
		saving?: boolean;
		onClose: () => void;
		onSave: (courseData: Partial<Course>, coverFile?: File | null) => void;
		onManageLessons?: (courseId: string) => void;
	} = $props();

	// Local state synced with active course
	let title = $state('');
	let description = $state('');
	let cover = $state('');
	let isFree = $state(false);
	let price = $state(2500);
	let priceUsd = $state<number | undefined>(undefined);
	let published = $state(false);
	let variantId = $state('');
	let videoUrl = $state('');

	let coverFile = $state<File | null>(null);
	let coverInputRef = $state<HTMLInputElement | null>(null);
	let submitting = $state(false);

	$effect(() => {
		if (course) {
			title = course.title;
			description = course.description;
			cover = course.cover ?? '';
			isFree = course.isFree;
			price = course.price;
			priceUsd = course.priceUsd;
			published = course.published;
			variantId = course.variantId ?? course.lemonsqueezyVariantId ?? '';
			videoUrl = course.videoUrl ?? course.previewVideoUrl ?? '';
		} else {
			title = '';
			description = '';
			cover = '';
			isFree = false;
			price = 2500;
			priceUsd = undefined;
			published = false;
			variantId = '';
			videoUrl = '';
		}
		coverFile = null;
	});

	function handleCoverSelect(e: Event) {
		const target = e.target as HTMLInputElement;
		if (target.files && target.files.length > 0) {
			const file = target.files[0];
			if (!file.type.startsWith('image/')) {
				alert('Veuillez sélectionner un fichier image valide (JPG, PNG, WEBP).');
				return;
			}
			if (file.size > 10 * 1024 * 1024) {
				alert("L'image est trop volumineuse. La taille maximale autorisée est de 10 MB.");
				return;
			}
			coverFile = file;
			cover = URL.createObjectURL(file);
		}
	}

	function handleDropCover(e: DragEvent) {
		e.preventDefault();
		if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
			const file = e.dataTransfer.files[0];
			if (!file.type.startsWith('image/')) {
				alert('Veuillez sélectionner un fichier image valide (JPG, PNG, WEBP).');
				return;
			}
			if (file.size > 10 * 1024 * 1024) {
				alert("L'image est trop volumineuse. La taille maximale autorisée est de 10 MB.");
				return;
			}
			coverFile = file;
			cover = URL.createObjectURL(file);
		}
	}

	function removeCover() {
		coverFile = null;
		cover = '';
		if (coverInputRef) coverInputRef.value = '';
	}

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		if (submitting || saving) return;
		if (!isFree && (!Number.isInteger(price) || price < 100 || price > 100000)) {
			alert('Le prix doit être un montant entier compris entre 100 et 100 000 HTG.');
			return;
		}
		submitting = true;
		try {
		await onSave(
			{
				id: course?.id,
				title: title.trim() || 'Nouveau cours',
				description,
				cover: cover.trim() || undefined,
				isFree,
				price: isFree ? 0 : price,
				priceUsd: isFree ? undefined : (priceUsd && priceUsd > 0 ? priceUsd : undefined),
				published,
				variantId: variantId.trim() || undefined,
				lemonsqueezyVariantId: variantId.trim() || undefined,
				videoUrl: videoUrl.trim() || undefined,
				previewVideoUrl: videoUrl.trim() || undefined
			},
			coverFile
		);
		} finally {
			submitting = false;
		}
	}
</script>

{#if open}
	<!-- Backdrop Overlay -->
	<button
		type="button"
		class="fixed inset-0 bg-black/50 z-40 transition-opacity"
		onclick={onClose}
		aria-label="Fermer le panneau"
	></button>

	<!-- Right Slide Drawer -->
	<div
		class="fixed right-0 top-0 bottom-0 h-full w-full max-w-lg bg-base-100 shadow-2xl flex flex-col z-50 overflow-hidden border-l border-base-200"
		role="dialog"
		aria-modal="true"
		aria-labelledby="drawer-title"
	>
		<!-- Header -->
		<div class="p-6 border-b border-base-200 flex items-center justify-between shrink-0 bg-base-100">
			<div>
				<h2 id="drawer-title" class="text-xl font-bold text-base-content">
					{course ? 'Modifier le cours' : 'Nouveau cours'}
				</h2>
				<p class="text-xs text-base-content/60 mt-0.5">
					Informations générales et tarification.
				</p>
			</div>
			<button
				type="button"
				class="btn btn-ghost btn-square btn-sm rounded-none text-base-content/60 hover:text-base-content"
				onclick={onClose}
			>
				<X size={20} />
			</button>
		</div>

		<!-- Body Form with internal scrollbar -->
		<form id="course-drawer-form" onsubmit={handleSubmit} class="p-6 flex-1 overflow-y-auto space-y-6 min-h-0">
			<!-- Titre -->
			<div class="form-control w-full">
				<label class="label font-bold text-xs text-base-content/90 tracking-wide pb-1.5" for="drawer-title-input">
					Titre du cours *
				</label>
				<input
					id="drawer-title-input"
					type="text"
					required
					placeholder="Ex: Marketing Digital pour Créateurs"
					bind:value={title}
					class="input input-sm bg-base-100 w-full rounded-none font-bold text-xs border border-base-300 text-base-content shadow-2xs focus:bg-base-100"
				/>
			</div>

			<!-- Description -->
			<div class="form-control w-full">
				<label class="label font-bold text-xs text-base-content/90 tracking-wide pb-1.5" for="drawer-desc-input">
					Description
				</label>
				<textarea
					id="drawer-desc-input"
					rows="3"
					placeholder="Présentez le programme de votre formation..."
					bind:value={description}
					class="textarea textarea-sm bg-base-100 w-full rounded-none text-xs border border-base-300 text-base-content leading-relaxed shadow-2xs focus:bg-base-100"
				></textarea>
			</div>

			<!-- Image de couverture -->
			<div class="form-control w-full">
				<span class="label font-bold text-xs text-base-content/90 tracking-wide pb-1.5">
					Image de couverture du cours
				</span>

				<input
					bind:this={coverInputRef}
					type="file"
					accept="image/*"
					class="hidden"
					onchange={handleCoverSelect}
				/>

				{#if cover}
					<div class="relative w-full aspect-video bg-base-200 border border-base-300 group overflow-hidden">
						<img src={cover} alt="Aperçu couverture" class="w-full h-full object-cover" />
						<div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-4">
							<button
								type="button"
								class="btn btn-sm bg-white text-black hover:bg-white/90 rounded-none border-none font-bold text-xs gap-1.5"
								onclick={() => coverInputRef?.click()}
							>
								<Upload size={14} />
								Changer
							</button>
							<button
								type="button"
								class="btn btn-sm bg-red-600 text-white hover:bg-red-700 rounded-none border-none font-bold text-xs gap-1.5"
								onclick={removeCover}
							>
								<Trash2 size={14} />
								Supprimer
							</button>
						</div>
					</div>
				{:else}
					<!-- Upload Dropzone -->
					<div
						role="button"
						tabindex="0"
						class="border-2 border-dashed border-base-300 hover:border-black p-6 text-center cursor-pointer transition-colors bg-base-200/20 hover:bg-base-200/50 flex flex-col items-center justify-center gap-2"
						onclick={() => coverInputRef?.click()}
						onkeydown={(e) => e.key === 'Enter' && coverInputRef?.click()}
						ondragover={(e) => e.preventDefault()}
						ondrop={handleDropCover}
					>
						<div class="size-10 bg-base-200 rounded-full grid place-items-center text-base-content/70">
							<ImageIcon size={20} />
						</div>
						<div>
							<p class="font-bold text-xs text-base-content">Cliquez pour charger l'image</p>
							<p class="text-[11px] text-base-content/50 mt-0.5">ou glissez-déposez le fichier ici (JPG, PNG, WEBP)</p>
						</div>
					</div>
				{/if}
			</div>

			<!-- Vidéo de présentation -->
			<div class="form-control w-full">
				<label class="label font-bold text-xs text-base-content/90 tracking-wide pb-1.5" for="drawer-video-input">
					Vidéo de présentation (URL optionnelle)
				</label>
				<input
					id="drawer-video-input"
					type="url"
					placeholder="Ex: https://www.youtube.com/watch?v=... ou https://vimeo.com/..."
					bind:value={videoUrl}
					class="input input-bordered bg-base-200/40 w-full rounded-none focus:bg-base-100 text-xs border-base-300"
				/>
				<span class="text-[11px] text-base-content/50 mt-1">
					Lien YouTube, Vimeo, Loom ou MP4 pour la bande-annonce sur la page publique.
				</span>
			</div>

			<!-- Tarification -->
			<div class="space-y-4 pt-2 border-t border-base-200">
				<h3 class="text-sm font-bold text-base-content">Tarification & Visibilité</h3>

				<div class="flex items-center justify-between p-4 bg-base-200/40 rounded-none border border-base-200">
					<div>
						<span class="font-bold text-xs block">Cours gratuit</span>
						<span class="text-[11px] text-base-content/60">Accessible sans paiement</span>
					</div>
					<input
						type="checkbox"
						class="toggle toggle-primary toggle-sm"
						bind:checked={isFree}
					/>
				</div>

				<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<div class="form-control w-full">
						<label class="label font-bold text-xs text-base-content/90 tracking-wide pb-1.5" for="drawer-price-input">
							Prix (HTG) *
						</label>
						<input
							id="drawer-price-input"
							type="number"
							min="100"
							max="100000"
							step="1"
							required={!isFree}
							disabled={isFree}
							bind:value={price}
							class="input input-sm bg-base-100 w-full rounded-none text-xs border border-base-300 font-bold text-base-content shadow-2xs focus:bg-base-100 disabled:bg-base-200/40 disabled:text-base-content/40"
						/>
						<p class="mt-1 text-[10px] text-base-content/50">En Gourdes (HTG).</p>
					</div>

					<div class="form-control w-full">
						<label class="label font-bold text-xs text-base-content/90 tracking-wide pb-1.5" for="drawer-priceusd-input">
							Prix (USD $) <span class="text-base-content/40 font-normal">(Optionnel)</span>
						</label>
						<input
							id="drawer-priceusd-input"
							type="number"
							min="1"
							max="10000"
							step="0.01"
							disabled={isFree}
							bind:value={priceUsd}
							placeholder="Ex: 15"
							class="input input-sm bg-base-100 w-full rounded-none text-xs border border-base-300 text-base-content shadow-2xs focus:bg-base-100 disabled:bg-base-200/40 disabled:text-base-content/40"
						/>
						<p class="mt-1 text-[10px] text-base-content/50">Affiché à côté du prix HTG.</p>
					</div>
				</div>

				<!-- Lemon Squeezy Variant ID -->
				<div class="form-control w-full">
					<label class="label font-bold text-xs text-base-content/90 tracking-wide pb-1.5" for="drawer-variant-input">
						Lemon Squeezy Variant ID (Paiement par Carte)
					</label>
					<input
						id="drawer-variant-input"
						type="text"
						placeholder="Ex: 582910"
						bind:value={variantId}
						class="input input-sm bg-base-100 w-full rounded-none text-xs border border-base-300 font-bold text-base-content shadow-2xs focus:bg-base-100"
					/>
					<p class="mt-1 text-[10px] text-base-content/50">Identifiant du variant de ce cours sur Lemon Squeezy.</p>
				</div>

				<div class="flex items-center justify-between p-4 bg-base-200/40 rounded-none border border-base-200">
					<div>
						<span class="font-bold text-xs block">Publié</span>
						<span class="text-[11px] text-base-content/60">Visible au catalogue</span>
					</div>
					<input
						type="checkbox"
						class="toggle toggle-success toggle-sm"
						bind:checked={published}
					/>
				</div>
			</div>

			{#if course && onManageLessons}
				<div class="pt-4 border-t border-base-200">
					<button
						type="button"
						class="btn btn-ghost bg-base-200/60 hover:bg-base-200 w-full rounded-none font-semibold text-xs gap-2"
						onclick={() => onManageLessons(course.id)}
					>
						<BookOpen size={16} />
						Gérer le contenu et les leçons
						<ExternalLink size={14} class="ml-auto" />
					</button>
				</div>
			{/if}
		</form>

		<!-- Footer Actions -->
		<div class="p-6 border-t border-base-200 flex items-center justify-end gap-3 shrink-0 bg-base-100">
			<button
				type="button"
				class="btn btn-ghost rounded-none text-xs font-semibold"
				onclick={onClose}
			>
				Annuler
			</button>
			<button
				type="submit"
				form="course-drawer-form"
				class="btn bg-black text-white hover:bg-black/90 border-none rounded-none text-xs font-semibold px-6" disabled={saving || submitting}
			>
				{saving || submitting ? "Enregistrement…" : "Enregistrer"}
			</button>
		</div>
	</div>
{/if}
