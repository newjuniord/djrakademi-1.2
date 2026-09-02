<script lang="ts">
	import { onMount } from 'svelte';
	import PublicHeader from '$lib/components/PublicHeader.svelte';
	import PublicFooter from '$lib/components/PublicFooter.svelte';
	import { User, ChevronLeft, Save, Shield, CheckCircle2, Key, Mail, Phone, Loader2, AlertCircle } from 'lucide-svelte';
	import { authState } from '$lib/auth.svelte';
	import { goto } from '$app/navigation';
	import { updateProfile, getOrCreateProfile } from '$lib/services/profiles';

	$effect(() => {
		if (!authState.loading && !authState.user) {
			goto('/');
		}
	});

	let name = $state('');
	let email = $state('');
	let whatsapp = $state('');
	let saving = $state(false);
	let saveSuccessMessage = $state<string | null>(null);
	let saveErrorMessage = $state<string | null>(null);

	$effect(() => {
		if (authState.user) {
			name = authState.profile?.name || authState.user.name || '';
			email = authState.user.email || '';
			whatsapp = authState.profile?.whatsapp || '';
		}
	});

	async function saveProfile(event: SubmitEvent) {
		event.preventDefault();
		if (!authState.user) return;

		saving = true;
		saveSuccessMessage = null;
		saveErrorMessage = null;

		try {
			const updated = await updateProfile(authState.user.$id, {
				name: name.trim(),
				whatsapp: whatsapp.trim()
			});
			if (updated) {
				authState.profile = updated;
				if (authState.user) {
					authState.user.name = updated.name;
				}
			}
			saveSuccessMessage = 'Enfòmasyon sou kont ou an mete ajou ak siksè !';
			setTimeout(() => {
				saveSuccessMessage = null;
			}, 4000);
		} catch (e: any) {
			console.error('Failed to update profile:', e);
			saveErrorMessage = e.message || 'Nou pa ka mete ajou profil la nan kounye a.';
		} finally {
			saving = false;
		}
	}
</script>

<svelte:head>
	<title>Mon Profil · DJR Akademi</title>
	<meta name="description" content="Gérez votre profil et vos informations personnelles sur DJR Akademi." />
</svelte:head>

<div class="min-h-screen bg-zinc-50 flex flex-col font-sans text-zinc-900">
	<PublicHeader />

	{#if authState.loading}
		<div class="flex-1 flex items-center justify-center">
			<span class="loading loading-spinner text-amber-500 loading-lg"></span>
		</div>
	{:else if authState.user}
		<main class="flex-1 py-10 sm:py-14">
		<div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">

			<!-- Back button -->
			<a
				href="/dashboard"
				class="inline-flex items-center gap-2 text-xs font-bold text-zinc-500 hover:text-zinc-950 transition-colors"
			>
				<ChevronLeft size={16} />
				Tounen nan espas mwen
			</a>

			<!-- Success Notification -->
			{#if saveSuccessMessage}
				<div class="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm font-semibold flex items-center justify-between shadow-sm animate-fade-in">
					<span class="flex items-center gap-2">
						<CheckCircle2 size={18} class="text-emerald-600" />
						{saveSuccessMessage}
					</span>
					<button type="button" onclick={() => (saveSuccessMessage = null)} class="text-emerald-500 hover:text-emerald-700 text-xs">Fèmen</button>
				</div>
			{/if}

			<!-- User Header Card -->
			<div class="bg-zinc-950 text-white rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
				<div class="flex items-center gap-4">
					<div class="size-16 bg-gradient-to-br from-amber-400 to-orange-500 text-black text-xl font-black rounded-2xl grid place-items-center shadow-lg shrink-0">
						<User size={28} />
					</div>
					<div>
						<div class="flex items-center gap-2">
							<h1 class="text-2xl font-black tracking-tight">{name}</h1>
							<span class="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-wider rounded-md border border-emerald-500/30">
								Etidyan
							</span>
						</div>
						<p class="text-white/50 text-xs mt-1 font-mono">{email}</p>
					</div>
				</div>

				{#if authState.isAdmin}
				<a
					href="/admin"
					class="inline-flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/15 text-white border border-white/15 rounded-xl text-xs font-bold transition-colors shrink-0"
				>
					<Shield size={14} class="text-amber-400" />
					Espas Admin
				</a>
				{/if}
			</div>

			<!-- Main Settings Form -->
			<div class="bg-white rounded-2xl border border-zinc-200/80 p-6 sm:p-8 shadow-sm space-y-8">

				<div class="flex items-center gap-3 pb-4 border-b border-zinc-100">
					<div class="size-9 bg-zinc-950 text-amber-400 rounded-xl grid place-items-center">
						<User size={18} />
					</div>
					<div>
						<h2 class="text-xl font-black tracking-tight text-zinc-950">Enfòmasyon Pèsonèl</h2>
						<p class="text-xs text-zinc-400">Chanje non w ak nimewo WhatsApp ou</p>
					</div>
				</div>

				<form onsubmit={saveProfile} class="space-y-6">

					<!-- Personal Info Fields -->
					<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<div>
							<label for="name" class="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2">Non konplè</label>
							<div class="relative">
								<input
									id="name"
									type="text"
									bind:value={name}
									required
									class="w-full h-12 pl-11 pr-4 rounded-xl border border-zinc-200 text-sm font-medium focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 outline-none"
								/>
								<User size={16} class="absolute left-4 top-3.5 text-zinc-400" />
							</div>
						</div>

						<div>
							<label for="email" class="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2">Adrès Imèl</label>
							<div class="relative">
								<input
									id="email"
									type="email"
									bind:value={email}
									readonly
									disabled
									class="w-full h-12 pl-11 pr-4 rounded-xl border border-zinc-200 bg-zinc-100 text-zinc-500 text-sm font-medium outline-none cursor-not-allowed"
								/>
								<Mail size={16} class="absolute left-4 top-3.5 text-zinc-400" />
							</div>
							<p class="text-[10px] text-zinc-400 mt-1">Adrès imèl kont ou (li pa ka chanje la)</p>
						</div>

						<div class="sm:col-span-2 md:col-span-1">
							<label for="whatsapp" class="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2">Nimewo WhatsApp</label>
							<div class="relative">
								<input
									id="whatsapp"
									type="tel"
									bind:value={whatsapp}
									placeholder="+509 XX XX XXXX"
									class="w-full h-12 pl-11 pr-4 rounded-xl border border-zinc-200 text-sm font-medium focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 outline-none"
								/>
								<Phone size={16} class="absolute left-4 top-3.5 text-zinc-400" />
							</div>
						</div>
					</div>

					<!-- Error Notification -->
					{#if saveErrorMessage}
						<div class="p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl text-sm font-semibold flex items-center justify-between shadow-sm animate-fade-in">
							<span class="flex items-center gap-2">
								<AlertCircle size={18} class="text-red-600" />
								{saveErrorMessage}
							</span>
							<button type="button" onclick={() => (saveErrorMessage = null)} class="text-red-500 hover:text-red-700 text-xs">Fèmen</button>
						</div>
					{/if}

					<!-- Save Button -->
					<div class="pt-6 border-t border-zinc-100 flex justify-end">
						<button
							type="submit"
							disabled={saving}
							class="inline-flex items-center gap-2 px-8 py-3.5 bg-zinc-950 hover:bg-zinc-800 text-white font-bold text-xs rounded-xl transition-colors shadow-md disabled:opacity-50"
						>
							{#if saving}
								<Loader2 size={15} class="animate-spin" />
								Enregistre ap fèt…
							{:else}
								<Save size={15} />
								Anregistre profil la
							{/if}
						</button>
					</div>

				</form>
			</div>

			</div>
		</main>
	{/if}
	
	<PublicFooter />
</div>
