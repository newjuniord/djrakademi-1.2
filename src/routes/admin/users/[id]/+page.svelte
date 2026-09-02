<script lang="ts">
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import type { AdminUser, UserStatus } from '$lib/types/admin';
	import { ArrowLeft, BookOpen, FileText, Mail, Calendar, User, UserX, UserCheck, Loader2, Phone, LogIn } from 'lucide-svelte';
	import { getAdminUser, setAdminUserStatus, startAdminImpersonation } from '$lib/admin/admin-client';

	let userId = $derived(page.params.id);
	
	let user = $state<AdminUser | null>(null);
	let whatsapp = $state('');
	let loading = $state(true);
	let impersonating = $state(false);

	onMount(async () => {
		if (userId) {
			try {
				const p = await getAdminUser(userId);
				if (p) {
					user = {
						id: p.id,
						name: p.name || 'Utilisateur',
						email: p.email,
						status: p.status,
						courseCount: p.courseCount,
						ebookCount: p.ebookCount,
						createdAt: new Date(p.createdAt).toLocaleDateString('fr-FR', {
							day: 'numeric',
							month: 'short',
							year: 'numeric'
						})
					};
					whatsapp = p.whatsapp || '';
				}
			} finally {
				loading = false;
			}
		} else {
			loading = false;
		}
	});

	import { toast } from '$lib/toast.svelte';

	function showToast(msg: string) {
		toast.success(msg);
	}

	async function toggleStatus() {
		if (!user) return;
		const newStatus: UserStatus = user.status === 'active' ? 'disabled' : 'active';
		try {
			await setAdminUserStatus(user.id, newStatus);
			user = { ...user, status: newStatus };
			toast.success(newStatus === 'disabled' ? 'Utilisateur désactivé avec succès.' : 'Utilisateur réactivé avec succès.');
		} catch (e) {
			console.error('Failed to toggle status:', e);
			toast.error('Erreur lors du changement de statut.');
		}
	}

	async function loginAsUser() {
		if (!user || impersonating) return;
		impersonating = true;
		try { await startAdminImpersonation(user.id); }
		catch (error) {
			toast.error(error instanceof Error ? error.message : 'Impossible d’ouvrir la session utilisateur.');
			impersonating = false;
		}
	}

	function getInitials(name: string): string {
		return name
			.split(' ')
			.map((n) => n[0])
			.join('')
			.toUpperCase()
			.slice(0, 2);
	}
</script>

<svelte:head>
	<title>{user ? user.name : 'Utilisateur'} · Fiche Utilisateur</title>
</svelte:head>

<div class="space-y-6">
	<!-- Back Button -->
	<div>
		<a
			href="/admin/users"
			class="inline-flex items-center gap-1.5 text-xs font-bold text-base-content/60 hover:text-primary transition-colors"
		>
			<ArrowLeft size={16} />
			Retour à la liste des utilisateurs
		</a>
	</div>

	{#if loading}
		<div class="card bg-base-100 border border-base-300/70 p-12 text-center text-base-content/50 space-y-3">
			<Loader2 size={32} class="mx-auto animate-spin text-primary" />
			<p class="text-xs font-semibold">Chargement du profil utilisateur...</p>
		</div>
	{:else if !user}
		<div class="card bg-base-100 border border-base-300/70 p-12 text-center text-base-content/50 space-y-3">
			<p class="text-sm font-bold text-error">Utilisateur introuvable dans Appwrite.</p>
			<a href="/admin/users" class="btn btn-xs btn-ghost">Retour aux utilisateurs</a>
		</div>
	{:else}
		<!-- User Profile Header Card -->
		<div class="card bg-base-100 border border-base-300/70 shadow-xs p-6">
			<div class="flex flex-col md:flex-row md:items-center justify-between gap-6">
				<div class="flex items-start sm:items-center gap-4">
					<div class="avatar placeholder shrink-0">
						<div class="w-16 rounded-2xl bg-gradient-to-tr from-primary to-accent text-primary-content font-bold text-xl ring-4 ring-primary/10 shadow-md flex items-center justify-center">
							<User size={28} />
						</div>
					</div>
					<div>
						<div class="flex items-center gap-3">
							<h1 class="text-2xl font-bold tracking-tight text-base-content">{user.name}</h1>
							{#if user.status === 'active'}
								<span class="badge badge-success badge-sm gap-1 font-semibold text-[11px] bg-success/15 text-success border-none">
									<span class="size-1.5 rounded-full bg-success"></span>
									Actif
								</span>
							{:else}
								<span class="badge badge-neutral badge-sm gap-1 font-semibold text-[11px] bg-base-300 text-base-content/60 border-none">
									<span class="size-1.5 rounded-full bg-base-content/40"></span>
									Désactivé
								</span>
							{/if}
						</div>
						<div class="flex flex-wrap items-center gap-4 mt-2 text-xs text-base-content/60">
							<a href="mailto:{user.email}" class="flex items-center gap-1.5 hover:underline">
								<Mail size={14} />
								{user.email}
							</a>
							{#if whatsapp}
								<span class="flex items-center gap-1.5 font-mono">
									<Phone size={14} class="text-success" />
									{whatsapp}
								</span>
							{/if}
							<span class="flex items-center gap-1.5">
								<Calendar size={14} />
								Inscrit le {user.createdAt}
							</span>
						</div>
					</div>
				</div>

				<!-- User Actions -->
				<div class="flex flex-wrap items-center gap-2">
					<button type="button" class="btn btn-primary btn-sm rounded-xl text-xs" onclick={loginAsUser} disabled={impersonating}>
						{#if impersonating}<Loader2 size={15} class="animate-spin" />{:else}<LogIn size={15} />{/if}
						Se connecter comme cet utilisateur
					</button>
					{#if user.status === 'active'}
						<button
							type="button"
							class="btn btn-outline btn-error btn-sm font-semibold rounded-xl text-xs"
							onclick={toggleStatus}
						>
							<UserX size={15} />
							Désactiver l'utilisateur
						</button>
					{:else}
						<button
							type="button"
							class="btn btn-outline btn-success btn-sm font-semibold rounded-xl text-xs"
							onclick={toggleStatus}
						>
							<UserCheck size={15} />
							Réactiver l'utilisateur
						</button>
					{/if}
				</div>
			</div>
		</div>

		<!-- Access Summary & Stats -->
		<div class="grid gap-4 sm:grid-cols-2">
			<div class="card bg-base-100 border border-base-300/70 shadow-xs p-5">
				<div class="flex items-center gap-3">
					<div class="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
						<BookOpen size={20} />
					</div>
					<div>
						<p class="text-xs font-medium text-base-content/60">Cours débloqués</p>
						<p class="text-2xl font-bold text-base-content">{user.courseCount}</p>
					</div>
				</div>
			</div>

			<div class="card bg-base-100 border border-base-300/70 shadow-xs p-5">
				<div class="flex items-center gap-3">
					<div class="grid size-10 place-items-center rounded-xl bg-secondary/10 text-secondary">
						<FileText size={20} />
					</div>
					<div>
						<p class="text-xs font-medium text-base-content/60">Ebooks débloqués</p>
						<p class="text-2xl font-bold text-base-content">{user.ebookCount}</p>
					</div>
				</div>
			</div>
		</div>
	{/if}
</div>


