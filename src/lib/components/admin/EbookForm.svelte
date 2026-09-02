<script lang="ts">
	import type { Ebook } from '$lib/types/admin';
	import { FileText, Upload, Image as ImageIcon, CheckCircle, ArrowLeft, Loader2 } from 'lucide-svelte';

	let {
		ebook = null,
		saving = false,
		onSave,
		onCancel
	}: {
		ebook?: Ebook | null;
		saving?: boolean;
		onSave: (data: Partial<Ebook>, coverFile?: File | null, pdfFile?: File | null) => void;
		onCancel?: () => void;
	} = $props();

	let title = $state('');
	let description = $state('');
	let cover = $state('');
	let fileName = $state('');
	let isFree = $state(false);
	let price = $state(750);
	let published = $state(false);

	let coverFile = $state<File | null>(null);
	let pdfFile = $state<File | null>(null);

	$effect(() => {
		if (ebook) {
			title = ebook.title;
			description = ebook.description;
			cover = ebook.cover ?? '';
			fileName = ebook.fileName ?? '';
			isFree = ebook.isFree;
			price = ebook.price;
			published = ebook.published;
		}
	});

	let pdfInputRef = $state<HTMLInputElement | null>(null);
	let coverInputRef = $state<HTMLInputElement | null>(null);

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

	function handlePdfSelect(e: Event) {
		const target = e.target as HTMLInputElement;
		if (target.files && target.files.length > 0) {
			const file = target.files[0];
			if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
				pdfFile = file;
				fileName = file.name;
			} else {
				alert('Seuls les fichiers PDF sont acceptés pour les ebooks.');
			}
		}
	}

	function handleDropPdf(e: DragEvent) {
		e.preventDefault();
		if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
			const file = e.dataTransfer.files[0];
			if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
				pdfFile = file;
				fileName = file.name;
			} else {
				alert('Seuls les fichiers PDF sont acceptés pour les ebooks.');
			}
		}
	}

	function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		onSave(
			{
				id: ebook?.id,
				title: title.trim() || 'Nouvel Ebook',
				description: description.trim(),
				cover: cover.trim() || undefined,
				fileName: fileName.trim() || 'ebook-document.pdf',
				isFree,
				price: isFree ? 0 : Number(price),
				published,
				salesCount: ebook?.salesCount ?? 0,
				createdAt: ebook?.createdAt ?? new Date().toISOString()
			},
			coverFile,
			pdfFile
		);
	}
</script>

<form onsubmit={handleSubmit} class="space-y-8 bg-base-100 p-6 sm:p-8 shadow-sm rounded-none border-none">
	<!-- Section Informations -->
	<div class="space-y-5">
		<h2 class="text-base font-bold text-base-content border-b border-base-200/70 pb-3 flex items-center gap-2">
			<FileText size={18} class="text-primary" />
			Informations générales
		</h2>

		<!-- Titre -->
		<div class="form-control w-full">
			<label class="label font-bold text-xs text-base-content/90 tracking-wide pb-1.5" for="ebook-title">
				Titre de l'ebook *
			</label>
			<input
				id="ebook-title"
				type="text"
				required
				placeholder="Ex: Guide Instagram 2026"
				bind:value={title}
				class="input input-sm bg-base-100 w-full rounded-none font-bold text-xs border border-base-300 text-base-content shadow-2xs focus:bg-base-100"
			/>
		</div>

		<!-- Description -->
		<div class="form-control w-full">
			<label class="label font-bold text-xs text-base-content/90 tracking-wide pb-1.5" for="ebook-desc">
				Description
			</label>
			<textarea
				id="ebook-desc"
				rows="4"
				placeholder="Présentez le contenu et les avantages de votre ebook..."
				bind:value={description}
				class="textarea textarea-sm bg-base-100 w-full rounded-none text-xs border border-base-300 text-base-content leading-relaxed shadow-2xs focus:bg-base-100"
			></textarea>
		</div>

		<!-- Image de couverture (Fichier & Preview) -->
		<div class="form-control w-full space-y-2">
			<label class="label font-bold text-xs text-base-content/90 tracking-wide pb-0" for="ebook-cover-file">
				Image de couverture (Optionnel)
			</label>

			<input
				id="ebook-cover-file"
				type="file"
				accept="image/png,image/jpeg,image/webp"
				class="hidden"
				bind:this={coverInputRef}
				onchange={handleCoverSelect}
			/>

			<div class="flex items-center gap-3">
				<button
					type="button"
					class="btn btn-outline btn-xs rounded-none gap-2 text-xs"
					onclick={() => coverInputRef?.click()}
				>
					<ImageIcon size={14} />
					{coverFile ? 'Changer la couverture' : 'Téléverser une image de couverture'}
				</button>
				{#if coverFile}
					<span class="text-xs text-success font-semibold flex items-center gap-1">
						<CheckCircle size={14} /> {coverFile.name}
					</span>
				{/if}
			</div>

			{#if cover}
				<div class="mt-3 flex items-center gap-3 p-3 bg-base-200/40 rounded-none border border-base-200/60">
					<img src={cover} alt="Aperçu couverture" class="w-16 h-20 object-cover rounded-none border border-base-200 shrink-0" />
					<div class="text-xs">
						<span class="font-bold text-base-content block">Aperçu de la couverture</span>
						<span class="text-[11px] text-base-content/60">Visuel qui apparaîtra dans le catalogue</span>
					</div>
				</div>
			{/if}
		</div>
	</div>

	<!-- Section Fichier PDF -->
	<div class="space-y-5 pt-4">
		<h2 class="text-base font-bold text-base-content border-b border-base-200/70 pb-3 flex items-center gap-2">
			<Upload size={18} class="text-primary" />
			Fichier de l'ebook (PDF uniquement)
		</h2>

		<input
			type="file"
			accept=".pdf,application/pdf"
			class="hidden"
			bind:this={pdfInputRef}
			onchange={handlePdfSelect}
		/>

		<!-- Upload Drag & Drop Box -->
		<div
			class="p-8 border-2 border-dashed border-base-300 hover:border-primary/60 bg-base-200/20 text-center space-y-3 cursor-pointer transition-colors"
			onclick={() => pdfInputRef?.click()}
			onkeydown={(e) => e.key === 'Enter' && pdfInputRef?.click()}
			ondrop={handleDropPdf}
			ondragover={(e) => e.preventDefault()}
			role="button"
			tabindex="0"
		>
			<Upload size={32} class="mx-auto text-base-content/40" />
			<div>
				<p class="text-xs font-bold text-base-content">
					Cliquez pour sélectionner un fichier PDF ou glissez-déposez ici
				</p>
				<p class="text-[11px] text-base-content/50 mt-0.5">Format PDF stocké sur Appwrite Storage (jusqu'à 50 Mo)</p>
			</div>

			{#if fileName || pdfFile}
				<div class="inline-flex items-center gap-2 px-3 py-1.5 bg-success/15 text-success font-bold text-xs rounded-none">
					<CheckCircle size={14} />
					<span>{pdfFile ? pdfFile.name : fileName}</span>
				</div>
			{/if}
		</div>
	</div>

	<!-- Section Tarification & Visibilité -->
	<div class="space-y-5 pt-4">
		<h2 class="text-base font-bold text-base-content border-b border-base-200/70 pb-3">
			Tarification & Visibilité
		</h2>

		<div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
			<!-- Toggle Ebook Gratuit -->
			<div class="flex items-center justify-between p-4 bg-base-200/40 rounded-none border border-base-200/60">
				<div>
					<span class="font-bold text-xs text-base-content block">Ebook gratuit</span>
					<span class="text-[11px] text-base-content/60">Disponible sans paiement</span>
				</div>
				<input
					type="checkbox"
					class="toggle toggle-primary toggle-sm"
					bind:checked={isFree}
				/>
			</div>

			<!-- Toggle Publié -->
			<div class="flex items-center justify-between p-4 bg-base-200/40 rounded-none border border-base-200/60">
				<div>
					<span class="font-bold text-xs text-base-content block">Publié</span>
					<span class="text-[11px] text-base-content/60">Visible dans votre catalogue</span>
				</div>
				<input
					type="checkbox"
					class="toggle toggle-success toggle-sm"
					bind:checked={published}
				/>
			</div>
		</div>

		{#if !isFree}
			<!-- Champ Prix -->
			<div class="form-control w-full sm:w-1/2">
				<label class="label font-bold text-xs text-base-content/90 tracking-wide pb-1.5" for="ebook-price">
					Prix (HTG) *
				</label>
				<div class="relative">
					<input
						id="ebook-price"
						type="number"
						min="100"
						required
						bind:value={price}
						placeholder="Ex: 750"
						class="input input-sm bg-base-100 w-full rounded-none font-bold text-xs border border-base-300 text-base-content shadow-2xs pr-14 focus:bg-base-100"
					/>
					<span class="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-base-content/50 select-none">
						HTG
					</span>
				</div>
			</div>
		{/if}
	</div>

	<!-- Bottom Action Buttons -->
	<div class="flex items-center justify-end gap-3 pt-6 border-t border-base-200">
		{#if onCancel}
			<button
				type="button"
				class="btn btn-ghost rounded-none text-xs font-semibold"
				disabled={saving}
				onclick={onCancel}
			>
				Annuler
			</button>
		{/if}
		<button
			type="submit"
			disabled={saving}
			class="btn bg-black text-white hover:bg-black/90 border-none rounded-none text-xs font-semibold px-8 gap-2"
		>
			{#if saving}
				<Loader2 size={14} class="animate-spin" />
				Enregistrement...
			{:else}
				Enregistrer
			{/if}
		</button>
	</div>
</form>
