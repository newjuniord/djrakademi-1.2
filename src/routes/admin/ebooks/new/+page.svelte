<script lang="ts">
	import { goto } from '$app/navigation';
	import EbookForm from '$lib/components/admin/EbookForm.svelte';
	import type { Ebook } from '$lib/types/admin';
	import { createEbook } from '$lib/services/ebooks';
	import { ArrowLeft } from 'lucide-svelte';
	import { toast } from '$lib/toast.svelte';

	let saving = $state(false);

	async function handleSave(newEbook: Partial<Ebook>, coverFile?: File | null, pdfFile?: File | null) {
		saving = true;
		try {
			await createEbook(
				{
					title: newEbook.title || 'Nouvel Ebook',
					description: newEbook.description || '',
					price: newEbook.price ?? 0,
					priceUsd: newEbook.priceUsd,
					isFree: Boolean(newEbook.isFree),
					published: Boolean(newEbook.published),
					variantId: newEbook.variantId || newEbook.lemonsqueezyVariantId || '',
					lemonsqueezyVariantId: newEbook.lemonsqueezyVariantId || newEbook.variantId || ''
				},
				coverFile,
				pdfFile
			);
			toast.success('Ebook créé avec succès.');
			goto('/admin/ebooks');
		} catch (error: any) {
			console.error('Failed to create ebook in Appwrite:', error);
			toast.error(`Erreur : ${error?.message || "Impossible de créer l'ebook."}`);
		} finally {
			saving = false;
		}
	}

	function handleCancel() {
		goto('/admin/ebooks');
	}
</script>

<svelte:head>
	<title>Nouvel Ebook · DJR Akademi Admin</title>
</svelte:head>

<div class="space-y-6 p-1 max-w-4xl mx-auto">
	<!-- Top Banner Header -->
	<div class="bg-base-100 p-6 shadow-sm rounded-none border-none flex flex-col gap-4">
		<a
			href="/admin/ebooks"
			class="btn btn-ghost btn-xs rounded-none gap-1 font-semibold text-xs text-base-content/60 hover:text-base-content self-start"
		>
			<ArrowLeft size={14} />
			Retour aux ebooks
		</a>

		<div>
			<h1 class="text-xl font-bold tracking-tight text-base-content sm:text-2xl">
				Créer un ebook
			</h1>
			<p class="text-xs text-base-content/60 mt-1">
				Ajoutez un nouvel ebook à votre catalogue.
			</p>
		</div>
	</div>

	<!-- Reusable Form Component -->
	<EbookForm {saving} onSave={handleSave} onCancel={handleCancel} />
</div>
