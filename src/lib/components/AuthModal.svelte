<script lang="ts">
	import { X, Mail, Lock, User as UserIcon, ArrowRight, Loader2, AlertCircle } from 'lucide-svelte';
	import { account, ID } from '$lib/appwrite';
	import { goto } from '$app/navigation';
	import { authState } from '$lib/auth.svelte';
	import { getOrCreateProfile } from '$lib/services/profiles';

	let { isOpen = $bindable(false), onLogin } = $props<{
		isOpen: boolean;
		onLogin: () => void;
	}>();

	// 'login' | 'signup' | 'forgot'
	let view = $state<'login' | 'signup' | 'forgot'>('login');
	
	let name = $state('');
	let email = $state('');
	let password = $state('');
	let loading = $state(false);
	let errorMessage = $state<string | null>(null);
	let successMessage = $state<string | null>(null);

	function close() {
		isOpen = false;
		setTimeout(() => {
			view = 'login'; // Reset view after closing
			errorMessage = null;
			successMessage = null;
			name = '';
			email = '';
			password = '';
		}, 300);
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape' && isOpen) {
			close();
		}
	}

	async function handleSubmit(e: Event) {
		e.preventDefault();
		errorMessage = null;
		successMessage = null;

		if (view === 'login') {
			try {
				loading = true;
				await account.createEmailPasswordSession(email, password);
				const user = await account.get();
				if (user) {
					authState.user = user;
					try {
						authState.profile = await getOrCreateProfile(user.$id, user.name, user.email);
					} catch (pe) {
						console.warn('[AuthModal] Profile fetch warning:', pe);
					}
					close();
					onLogin();
					goto('/dashboard');
				}
			} catch (error: any) {
				errorMessage = error.message || 'Une erreur est survenue lors de la connexion.';
			} finally {
				loading = false;
			}
		} else if (view === 'signup') {
			try {
				loading = true;
				// Create account
				await account.create(ID.unique(), email, password, name);
				// Automatically log in
				await account.createEmailPasswordSession(email, password);
				// Fetch user and set global state
				const user = await account.get();
				if (user) {
					authState.user = user;
					// Automatically create user profile document in Appwrite profiles collection
					try {
						authState.profile = await getOrCreateProfile(user.$id, name, email);
					} catch (pe) {
						console.warn('[AuthModal] Profile creation warning:', pe);
					}
					close();
					onLogin();
					goto('/dashboard');
				}
			} catch (error: any) {
				errorMessage = error.message || "Une erreur est survenue lors de l'inscription.";
			} finally {
				loading = false;
			}
		} else {
			try {
				loading = true;
				const response = await fetch('/api/account/recovery/request', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ email })
				});
				const result = await response.json().catch(() => ({}));
				if (!response.ok) throw new Error(result.message || 'Impossible d’envoyer le lien de récupération.');
				successMessage = result.message;
			} catch (error: any) {
				errorMessage = error.message || 'Impossible d’envoyer le lien de récupération.';
			} finally {
				loading = false;
			}
		}
	}
	
	function switchView(newView: 'login' | 'signup' | 'forgot') {
		view = newView;
		errorMessage = null;
		successMessage = null;
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if isOpen}
	<!-- Backdrop -->
	<button
		type="button"
		onclick={close}
		class="fixed inset-0 bg-black/60 backdrop-blur-md z-[60] transition-opacity cursor-default"
		aria-label="Fermer la fenêtre d'authentification"
	></button>

	<!-- Modal Content -->
	<div class="fixed inset-0 z-[70] flex items-center justify-center p-4 pointer-events-none">
		<div class="w-full max-w-md bg-white text-zinc-950 rounded-3xl shadow-2xl overflow-hidden pointer-events-auto animate-in zoom-in-95 duration-200 border border-zinc-200">
			<!-- Modal Header -->
			<div class="p-6 pb-0 flex items-center justify-between">
				<div class="size-10 bg-amber-400/20 text-amber-500 rounded-xl grid place-items-center">
					<Lock size={20} />
				</div>
				<button
					type="button"
					onclick={close}
					class="size-9 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-600 grid place-items-center transition-colors"
				>
					<X size={18} />
				</button>
			</div>

			<div class="p-6 sm:p-8 pt-6">
				<!-- Dynamic Header Text -->
				<div class="mb-8">
					<h2 class="text-2xl font-black tracking-tight mb-2">
						{#if view === 'login'}
							Mèsi paske ou tounen !
						{:else if view === 'signup'}
							Kreye yon kont
						{:else}
							Mo de pas bliye
						{/if}
					</h2>
					<p class="text-zinc-500 text-sm font-medium">
						{#if view === 'login'}
							Konekte pou w ka jwenn aksè ak fòmasyon ak zouti ou yo.
						{:else if view === 'signup'}
							Rebòne DJR Akademi epi devlope konpetans ou.
						{:else}
							Antre imèl ou pou w ka chanje mo de pas ou.
						{/if}
					</p>
				</div>

				<!-- Form -->
				<form onsubmit={handleSubmit} class="space-y-4">
					{#if view === 'signup'}
						<div class="space-y-1.5">
							<label for="name" class="text-xs font-bold text-zinc-700 ml-1">Non konplè</label>
							<div class="relative">
								<div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-400">
									<UserIcon size={16} />
								</div>
								<input
									id="name"
									type="text"
									required
									bind:value={name}
									disabled={loading}
									class="w-full bg-zinc-50 border border-zinc-200 hover:border-zinc-300 focus:border-amber-400 focus:bg-white rounded-xl py-3 pl-11 pr-4 text-sm text-zinc-950 placeholder-zinc-400 outline-none transition-all disabled:opacity-60"
									placeholder="Jean Dupont"
								/>
							</div>
						</div>
					{/if}

					<div class="space-y-1.5">
						<label for="email" class="text-xs font-bold text-zinc-700 ml-1">Adrès imèl</label>
						<div class="relative">
							<div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-400">
								<Mail size={16} />
							</div>
							<input
								id="email"
								type="email"
								required
								bind:value={email}
								disabled={loading}
								class="w-full bg-zinc-50 border border-zinc-200 hover:border-zinc-300 focus:border-amber-400 focus:bg-white rounded-xl py-3 pl-11 pr-4 text-sm text-zinc-950 placeholder-zinc-400 outline-none transition-all disabled:opacity-60"
								placeholder="jean@exemple.com"
							/>
						</div>
					</div>

					{#if view !== 'forgot'}
						<div class="space-y-1.5">
							<div class="flex items-center justify-between ml-1">
								<label for="password" class="text-xs font-bold text-zinc-700">Mo de pas</label>
								{#if view === 'login'}
									<button
										type="button"
										onclick={() => (view = 'forgot')}
										class="text-[10px] font-bold text-amber-500 hover:text-amber-600 transition-colors"
									>
										Bliye ?
									</button>
								{/if}
							</div>
							<div class="relative">
								<div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-400">
									<Lock size={16} />
								</div>
								<input
									id="password"
									type="password"
									required
									bind:value={password}
									disabled={loading}
									class="w-full bg-zinc-50 border border-zinc-200 hover:border-zinc-300 focus:border-amber-400 focus:bg-white rounded-xl py-3 pl-11 pr-4 text-sm text-zinc-950 placeholder-zinc-400 outline-none transition-all disabled:opacity-60"
									placeholder="••••••••"
								/>
							</div>
						</div>
					{/if}

					{#if errorMessage}
						<div class="p-3 bg-red-50 text-red-600 rounded-xl text-xs font-semibold flex items-start gap-2 animate-fade-in border border-red-100">
							<AlertCircle size={14} class="shrink-0 mt-0.5" />
							<span>{errorMessage}</span>
						</div>
					{/if}
					{#if successMessage}
						<div class="p-3 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-semibold border border-emerald-100">
							{successMessage}
						</div>
					{/if}

					<button
						type="submit"
						disabled={loading}
						class="w-full bg-zinc-950 hover:bg-zinc-800 text-white font-black text-sm py-3.5 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 mt-6 disabled:opacity-70 disabled:cursor-not-allowed"
					>
						{#if loading}
							<Loader2 size={16} class="animate-spin" />
							Tanpri tann yon ti moman...
						{:else if view === 'login'}
							Konekte <ArrowRight size={16} />
						{:else if view === 'signup'}
							Kreye kont mwen <ArrowRight size={16} />
						{:else}
							Voye lyen an
						{/if}
					</button>
				</form>

				<!-- Toggle Views -->
				<div class="mt-6 text-center text-xs font-medium text-zinc-500">
					{#if view === 'login'}
						Ou poko gen yon kont ?
						<button
							type="button"
							onclick={() => switchView('signup')}
							disabled={loading}
							class="text-amber-500 font-bold hover:underline disabled:opacity-60"
						>
							Enskri
						</button>
					{:else if view === 'signup'}
						Ou gen yon kont deja ?
						<button
							type="button"
							onclick={() => switchView('login')}
							disabled={loading}
							class="text-amber-500 font-bold hover:underline disabled:opacity-60"
						>
							Konekte
						</button>
					{:else}
						Mwen sonje mo de pas mwen an.
						<button
							type="button"
							onclick={() => switchView('login')}
							disabled={loading}
							class="text-amber-500 font-bold hover:underline disabled:opacity-60"
						>
							Tounen nan koneksyon
						</button>
					{/if}
				</div>
			</div>
		</div>
	</div>
{/if}
