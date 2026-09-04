<script lang="ts">
	import { untrack } from 'svelte';
	import type { Course, CourseModule, Lesson } from '$lib/types/admin';
	import {
		Plus,
		Trash2,
		ArrowUp,
		ArrowDown,
		Video,
		FileText,
		Check,
		X,
		BookOpen,
		Upload,
		Image as ImageIcon
	} from 'lucide-svelte';

	let {
		course,
		saving = false,
		onSave,
		onCancel
	}: {
		course?: Course;
		saving?: boolean;
		onSave: (courseData: Course, coverFile?: File | null) => void;
		onCancel: () => void;
	} = $props();

	const initialCourse = untrack(() => course);

	// Initialize reactive form state
	let title = $state(initialCourse?.title ?? '');
	let description = $state(initialCourse?.description ?? '');
	let cover = $state(initialCourse?.cover ?? '');
	let isFree = $state(initialCourse?.isFree ?? false);
	let price = $state(initialCourse?.price ?? 2500);
	let priceUsd = $state<number | undefined>(initialCourse?.priceUsd);
	let published = $state(initialCourse?.published ?? false);
	let variantId = $state(initialCourse?.variantId ?? initialCourse?.lemonsqueezyVariantId ?? '');
	let videoUrl = $state(initialCourse?.videoUrl ?? initialCourse?.previewVideoUrl ?? '');

	let coverFile = $state<File | null>(null);
	let coverInputRef = $state<HTMLInputElement | null>(null);
	let submitting = $state(false);

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

	// Deep clone modules for editable state
	let modules = $state<CourseModule[]>(
		initialCourse?.modules
			? JSON.parse(JSON.stringify(initialCourse.modules))
			: [
					{
						id: `mod-${Date.now()}`,
						title: 'Module 1 — Introduction',
						lessons: [
							{
								id: `les-${Date.now()}`,
								title: 'Bienvenue dans la formation',
								type: 'video',
								videoUrl: ''
							}
						]
					}
			  ]
	);

	// Module actions
	function addModule() {
		modules = [
			...modules,
			{
				id: `mod-${Date.now()}`,
				title: `Module ${modules.length + 1} — Nouveau module`,
				lessons: []
			}
		];
	}

	function moveModuleUp(index: number) {
		if (index <= 0) return;
		const updated = [...modules];
		const temp = updated[index];
		updated[index] = updated[index - 1];
		updated[index - 1] = temp;
		modules = updated;
	}

	function moveModuleDown(index: number) {
		if (index >= modules.length - 1) return;
		const updated = [...modules];
		const temp = updated[index];
		updated[index] = updated[index + 1];
		updated[index + 1] = temp;
		modules = updated;
	}

	function deleteModule(index: number) {
		modules = modules.filter((_, i) => i !== index);
	}

	// Lesson actions
	function addLesson(moduleIndex: number) {
		const updated = [...modules];
		updated[moduleIndex].lessons = [
			...updated[moduleIndex].lessons,
			{
				id: `les-${Date.now()}`,
				title: 'Nouvelle leçon',
				type: 'video',
				videoUrl: ''
			}
		];
		modules = updated;
	}

	function moveLessonUp(moduleIndex: number, lessonIndex: number) {
		if (lessonIndex <= 0) return;
		const updated = [...modules];
		const lessons = [...updated[moduleIndex].lessons];
		const temp = lessons[lessonIndex];
		lessons[lessonIndex] = lessons[lessonIndex - 1];
		lessons[lessonIndex - 1] = temp;
		updated[moduleIndex].lessons = lessons;
		modules = updated;
	}

	function moveLessonDown(moduleIndex: number, lessonIndex: number) {
		const updated = [...modules];
		const lessons = [...updated[moduleIndex].lessons];
		if (lessonIndex >= lessons.length - 1) return;
		const temp = lessons[lessonIndex];
		lessons[lessonIndex] = lessons[lessonIndex + 1];
		lessons[lessonIndex + 1] = temp;
		updated[moduleIndex].lessons = lessons;
		modules = updated;
	}

	function deleteLesson(moduleIndex: number, lessonIndex: number) {
		const updated = [...modules];
		updated[moduleIndex].lessons = updated[moduleIndex].lessons.filter(
			(_, i) => i !== lessonIndex
		);
		modules = updated;
	}

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		if (submitting || saving) return;
		if (!isFree && (!Number.isInteger(price) || price < 100 || price > 100000)) {
			alert('Le prix doit être un montant entier compris entre 100 et 100 000 HTG.');
			return;
		}
		submitting = true;
		const courseData: Course = {
			id: initialCourse?.id ?? `crs-${Date.now()}`,
			title: title.trim() || 'Nouveau cours',
			description,
			cover: cover.trim() || undefined,
			isFree,
			price: isFree ? 0 : price,
			priceUsd: isFree ? undefined : (priceUsd && priceUsd > 0 ? priceUsd : undefined),
			published,
			studentCount: initialCourse?.studentCount ?? 0,
			variantId: variantId.trim() || undefined,
			lemonsqueezyVariantId: variantId.trim() || undefined,
			videoUrl: videoUrl.trim() || undefined,
			previewVideoUrl: videoUrl.trim() || undefined,
			modules
		};
		try {
			await onSave(courseData, coverFile);
		} finally {
			submitting = false;
		}
	}
</script>

<form onsubmit={handleSubmit} class="space-y-10">
	<!-- Section: Informations -->
	<div class="bg-base-100 p-6 shadow-sm rounded-none border-none flex flex-col gap-6">
		<h2 class="text-lg font-bold text-base-content border-b border-base-200/70 pb-3">
			Informations générales
		</h2>

		<!-- Titre -->
		<div class="form-control w-full">
			<label class="label font-semibold text-xs text-base-content/70" for="title">
				Titre du cours *
			</label>
			<input
				id="title"
				type="text"
				required
				placeholder="Ex: Marketing Digital pour Créateurs"
				bind:value={title}
				class="input input-bordered bg-base-200/40 w-full rounded-none focus:bg-base-100 text-sm border-base-300"
			/>
		</div>

		<!-- Description -->
		<div class="form-control w-full">
			<label class="label font-semibold text-xs text-base-content/70" for="description">
				Description
			</label>
			<textarea
				id="description"
				rows="3"
				placeholder="Présentez le programme de votre formation..."
				bind:value={description}
				class="textarea textarea-bordered bg-base-200/40 w-full rounded-none focus:bg-base-100 text-sm border-base-300"
			></textarea>
		</div>

		<!-- Image de couverture -->
		<div class="form-control w-full">
			<span class="label font-semibold text-xs text-base-content/70">
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
				<div class="relative w-full max-w-md aspect-video bg-base-200 border border-base-300 group overflow-hidden">
					<img src={cover} alt="Aperçu couverture" class="w-full h-full object-cover" />
					<div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-4">
						<button
							type="button"
							class="btn btn-sm bg-white text-black hover:bg-white/90 rounded-none border-none font-bold text-xs gap-1.5"
							onclick={() => coverInputRef?.click()}
						>
							<Upload size={14} />
							Changer l'image
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
					class="border-2 border-dashed border-base-300 hover:border-black p-8 text-center cursor-pointer transition-colors bg-base-200/20 hover:bg-base-200/50 flex flex-col items-center justify-center gap-2 max-w-md"
					onclick={() => coverInputRef?.click()}
					onkeydown={(e) => e.key === 'Enter' && coverInputRef?.click()}
					ondragover={(e) => e.preventDefault()}
					ondrop={handleDropCover}
				>
					<div class="size-12 bg-base-200 rounded-full grid place-items-center text-base-content/70">
						<ImageIcon size={24} />
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
			<label class="label font-semibold text-xs text-base-content/70" for="videoUrl">
				Vidéo de présentation / Bande-annonce (URL optionnelle)
			</label>
			<input
				id="videoUrl"
				type="url"
				placeholder="Ex: https://www.youtube.com/watch?v=... ou https://vimeo.com/..."
				bind:value={videoUrl}
				class="input input-bordered bg-base-200/40 w-full rounded-none focus:bg-base-100 text-sm border-base-300"
			/>
			<span class="text-[11px] text-base-content/50 mt-1">
				Lien YouTube, Vimeo, Loom ou MP4 direct pour la vidéo de présentation sur la page du cours (optionnel).
			</span>
		</div>
	</div>

	<!-- Section: Vente & Publication -->
	<div class="bg-base-100 p-6 shadow-sm rounded-none border-none flex flex-col gap-6">
		<h2 class="text-lg font-bold text-base-content border-b border-base-200/70 pb-3">
			Tarification & Publication
		</h2>

		<div class="grid grid-cols-1 sm:grid-cols-3 gap-6">
			<!-- Gratuit Switch -->
			<div class="flex items-center justify-between p-4 bg-base-200/40 rounded-none border border-base-200">
				<div>
					<span class="font-bold text-sm block">Cours gratuit</span>
					<span class="text-xs text-base-content/60">Accessible sans paiement</span>
				</div>
				<input
					type="checkbox"
					class="toggle toggle-primary toggle-sm"
					bind:checked={isFree}
				/>
			</div>

			<!-- Prix HTG -->
			<div class="form-control w-full">
				<label class="label font-semibold text-xs text-base-content/70" for="price">
					Prix (HTG) *
				</label>
				<input
					id="price"
					type="number"
					min="100"
					max="100000"
					step="1"
					required={!isFree}
					disabled={isFree}
					bind:value={price}
					class="input input-bordered bg-base-200/40 w-full rounded-none focus:bg-base-100 text-sm border-base-300 disabled:bg-base-200/20 disabled:text-base-content/40"
				/>
				<p class="mt-1 text-[10px] text-base-content/50">Entre 100 et 100 000 HTG.</p>
			</div>

			<!-- Prix USD -->
			<div class="form-control w-full">
				<label class="label font-semibold text-xs text-base-content/70" for="priceUsd">
					Prix (USD $) <span class="text-base-content/40 font-normal">(Optionnel)</span>
				</label>
				<input
					id="priceUsd"
					type="number"
					min="1"
					max="10000"
					step="0.01"
					disabled={isFree}
					bind:value={priceUsd}
					placeholder="Ex: 15"
					class="input input-bordered bg-base-200/40 w-full rounded-none focus:bg-base-100 text-sm border-base-300 disabled:bg-base-200/20 disabled:text-base-content/40"
				/>
				<p class="mt-1 text-[10px] text-base-content/50">Affiché à côté du prix HTG.</p>
			</div>
		</div>

		<!-- Variant ID Lemon Squeezy -->
		<div class="form-control w-full">
			<label class="label font-semibold text-xs text-base-content/70" for="variantId">
				Lemon Squeezy Variant ID (Paiement par Carte)
			</label>
			<input
				id="variantId"
				type="text"
				placeholder="Ex: 582910"
				bind:value={variantId}
				class="input input-bordered bg-base-200/40 w-full rounded-none focus:bg-base-100 text-sm border-base-300"
			/>
			<p class="mt-1 text-[10px] text-base-content/50">Identifiant du variant produit sur votre compte Lemon Squeezy.</p>
		</div>

		<!-- Publication Switch -->
		<div class="flex items-center justify-between p-4 bg-base-200/40 rounded-none border border-base-200 mt-2">
			<div>
				<span class="font-bold text-sm block">Publié</span>
				<span class="text-xs text-base-content/60">Rendre la formation visible au catalogue</span>
			</div>
			<input
				type="checkbox"
				class="toggle toggle-success toggle-sm"
				bind:checked={published}
			/>
		</div>
	</div>

	<!-- Section: Contenu (Modules et leçons) -->
	<div class="bg-base-100 p-6 shadow-sm rounded-none border-none flex flex-col gap-6">
		<div class="flex items-center justify-between border-b border-base-200/70 pb-4">
			<div>
				<h2 class="text-lg font-bold text-base-content">Modules et leçons</h2>
				<p class="text-xs text-base-content/60 mt-0.5">Structurez le contenu de votre formation.</p>
			</div>
			<button
				type="button"
				class="btn btn-sm bg-black text-white hover:bg-black/90 border-none rounded-none gap-1.5 font-semibold text-xs"
				onclick={addModule}
			>
				<Plus size={16} />
				Ajouter un module
			</button>
		</div>

		{#if modules.length === 0}
			<div class="py-12 text-center text-base-content/50 border border-dashed border-base-300 p-6">
				<BookOpen size={32} class="mx-auto mb-2 opacity-40" />
				<p class="text-sm font-medium">Aucun module pour l'instant.</p>
				<p class="text-xs mt-1">Cliquez sur "Ajouter un module" pour démarrer le programme.</p>
			</div>
		{:else}
			<div class="space-y-6">
				{#each modules as mod, mIndex (mod.id)}
					<div class="bg-base-200/40 p-5 border border-base-200 rounded-none space-y-4">
						<!-- Module Header Controls -->
						<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
							<div class="flex items-center gap-2 flex-1">
								<span class="font-bold text-xs uppercase tracking-wider text-base-content/50 shrink-0">
									Module {mIndex + 1}
								</span>
								<input
									type="text"
									placeholder="Titre du module (ex: Module 1 — Introduction)"
									bind:value={mod.title}
									class="input input-sm bg-base-100 w-full rounded-none font-bold text-sm border-base-300 focus:border-primary"
								/>
							</div>

							<!-- Module Actions -->
							<div class="flex items-center gap-1 shrink-0 self-end sm:self-auto">
								<button
									type="button"
									class="btn btn-ghost btn-xs rounded-none border-none bg-base-100 hover:bg-base-200"
									disabled={mIndex === 0}
									onclick={() => moveModuleUp(mIndex)}
									title="Monter le module"
								>
									<ArrowUp size={14} />
									<span class="hidden sm:inline">Monter</span>
								</button>
								<button
									type="button"
									class="btn btn-ghost btn-xs rounded-none border-none bg-base-100 hover:bg-base-200"
									disabled={mIndex === modules.length - 1}
									onclick={() => moveModuleDown(mIndex)}
									title="Descendre le module"
								>
									<ArrowDown size={14} />
									<span class="hidden sm:inline">Descendre</span>
								</button>
								<button
									type="button"
									class="btn btn-ghost btn-xs rounded-none border-none bg-error/10 text-error hover:bg-error/20"
									onclick={() => deleteModule(mIndex)}
									title="Supprimer le module"
								>
									<Trash2 size={14} />
									<span class="hidden sm:inline">Supprimer</span>
								</button>
							</div>
						</div>

						<!-- Lessons List inside Module -->
						<div class="pl-0 sm:pl-4 space-y-3 pt-2">
							{#each mod.lessons as lesson, lIndex (lesson.id)}
								<div class="bg-base-100 p-4 border border-base-200 rounded-none space-y-3">
									<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
										<div class="flex items-center gap-2 flex-1">
											<span class="text-xs font-semibold text-base-content/40 shrink-0">
												Leçon {lIndex + 1}
											</span>
											<input
												type="text"
												placeholder="Titre de la leçon"
												bind:value={lesson.title}
												class="input input-sm bg-base-200/40 w-full rounded-none text-xs font-semibold border-base-200"
											/>
										</div>

										<div class="flex items-center gap-2 shrink-0">
											<select
												bind:value={lesson.type}
												class="select select-sm bg-base-200/50 rounded-none text-xs border-base-200"
											>
												<option value="video">Vidéo</option>
												<option value="text">Texte</option>
											</select>

											<button
												type="button"
												class="btn btn-ghost btn-xs rounded-none"
												disabled={lIndex === 0}
												onclick={() => moveLessonUp(mIndex, lIndex)}
												title="Monter la leçon"
											>
												<ArrowUp size={13} />
											</button>
											<button
												type="button"
												class="btn btn-ghost btn-xs rounded-none"
												disabled={lIndex === mod.lessons.length - 1}
												onclick={() => moveLessonDown(mIndex, lIndex)}
												title="Descendre la leçon"
											>
												<ArrowDown size={13} />
											</button>
											<button
												type="button"
												class="btn btn-ghost btn-xs text-error hover:bg-error/10 rounded-none"
												onclick={() => deleteLesson(mIndex, lIndex)}
												title="Supprimer la leçon"
											>
												<Trash2 size={13} />
											</button>
										</div>
									</div>

									<!-- Lesson Type specific fields -->
									{#if lesson.type === 'video'}
										<div class="pt-1">
											<input
												type="text"
												placeholder="URL YouTube, Vimeo ou MP4 (ex: https://www.youtube.com/watch?v=... ou https://vimeo.com/...)"
												bind:value={lesson.videoUrl}
												class="input input-xs bg-base-200/30 w-full rounded-none text-xs border-base-200"
											/>
										</div>
									{:else}
										<div class="pt-1">
											<textarea
												rows="2"
												placeholder="Contenu texte de la leçon..."
												bind:value={lesson.content}
												class="textarea textarea-xs bg-base-200/30 w-full rounded-none text-xs border-base-200"
											></textarea>
										</div>
									{/if}
								</div>
							{/each}

							<button
								type="button"
								class="btn btn-ghost btn-xs rounded-none bg-base-100 hover:bg-base-200 gap-1.5 font-semibold text-xs border border-base-200 mt-2"
								onclick={() => addLesson(mIndex)}
							>
								<Plus size={13} />
								Ajouter une leçon
							</button>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>

	<!-- Section: Action Footer (Enregistrer & Annuler) -->
	<div class="flex items-center justify-end gap-3 pt-4 border-t border-base-200">
		<button
			type="button"
			class="btn btn-ghost rounded-none font-semibold text-xs"
			onclick={onCancel}
		>
			Annuler
		</button>
		<button
			type="submit"
			class="btn bg-black text-white hover:bg-black/90 border-none rounded-none font-semibold text-xs px-6" disabled={saving || submitting}
		>
			{saving || submitting ? "Enregistrement…" : "Enregistrer"}
		</button>
	</div>
</form>
