<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import EbookForm from '$lib/components/admin/EbookForm.svelte';
	import type { Ebook } from '$lib/types/admin';
	import { getEbookById, updateEbook } from '$lib/services/ebooks';
	import { ArrowLeft, Loader2 } from 'lucide-svelte';
	import { toast } from '$lib/toast.svelte';

	const ebookId = $derived(page.params.id);

	let currentEbook = $state<Ebook | null>(null);
	let loading = $state(true);
	let saving = $state(false);

	onMount(async () => {
		if (ebookId) {
			try {
				currentEbook = await getEbookById(ebookId);
			} finally {
				loading = false;
			}
		} else {
			loading = false;
		}
	});

	async function handleSave(updated: Partial<Ebook>, coverFile?: File | null, pdfFile?: File | null) {
		if (!ebookId) return;
		saving = true;
		try {
			await updateEbook(
				ebookId,
				{
					title: updated.title || 'Ebook',
					description: updated.description || '',
					price: updated.price ?? 0,
					isFree: Boolean(updated.isFree),
					published: Boolean(updated.published),
					variantId: updated.variantId || updated.lemonsqueezyVariantId || '',
					lemonsqueezyVariantId: updated.lemonsqueezyVariantId || updated.variantId || ''
				},
				coverFile,
				pdfFile
			);
			toast.success('Ebook mis à jour avec succès.');
			goto('/admin/ebooks');
		} catch (error: any) {
			console.error('Failed to update ebook in Appwrite:', error);
			toast.error(`Erreur : ${error?.message || "Impossible de mettre à jour l'ebook."}`);
		} finally {
			saving = false;
		}
	}

	function handleCancel() {
		goto('/admin/ebooks');
	}
</script>

<svelte:head>
	<title>Modifier {currentEbook?.title ?? 'Ebook'} · DJR Akademi Admin</title>
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
				Modifier l'ebook
			</h1>
			<p class="text-xs text-base-content/60 mt-1">
				Mettez à jour les informations et le fichier de votre ebook.
			</p>
		</div>
	</div>

	<!-- Reusable Form Component -->
	{#if loading}
		<div class="bg-base-100 p-12 text-center text-base-content/50 space-y-3">
			<Loader2 size={32} class="mx-auto animate-spin text-primary" />
			<p class="text-xs font-semibold">Chargement de l'ebook...</p>
		</div>
	{:else if currentEbook}
		<EbookForm ebook={currentEbook} {saving} onSave={handleSave} onCancel={handleCancel} />
	{:else}
		<div class="bg-base-100 p-12 text-center text-base-content/50 space-y-3">
			<p class="text-sm font-bold text-error">Ebook introuvable.</p>
			<a href="/admin/ebooks" class="btn btn-ghost btn-xs rounded-none">Retour à la liste</a>
		</div>
	{/if}
</div>
