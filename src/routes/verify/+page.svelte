<script lang="ts">
	import PublicHeader from '$lib/components/PublicHeader.svelte';
	import PublicFooter from '$lib/components/PublicFooter.svelte';
	import { toast } from '$lib/toast.svelte';

	import {
		CreditCard,
		Smartphone,
		ShieldCheck,
		HelpCircle,
		Send,
		Loader2,
		AlertCircle,
		CheckCircle2,
		ArrowLeft,
		Sparkles
	} from 'lucide-svelte';

	import { authState } from '$lib/auth.svelte';
	import { verifyLemonSqueezyEmail, verifyPlopplopReference } from '$lib/services/payments';

	// Verification Form State
	let supportMethod = $state<'carte' | 'mobile'>('carte');
	let supportEmail = $state('');
	let supportReference = $state('');
	let supportLoading = $state(false);
	let supportSuccessMessage = $state<string | null>(null);
	let supportErrorMessage = $state<string | null>(null);

	async function handleVerifySubmit(e: SubmitEvent) {
		e.preventDefault();
		supportSuccessMessage = null;
		supportErrorMessage = null;

		if (!authState.user) {
			toast.error('Ou dwe konekte sou kont ou pou w ka verifye yon peman.');
			return;
		}

		supportLoading = true;

		try {
			if (supportMethod === 'carte') {
				const email = supportEmail.trim();
				if (!email || !email.includes('@')) {
					toast.error('Tanpri antre yon adres imel ki valab.');
					supportLoading = false;
					return;
				}

				const resData = await verifyLemonSqueezyEmail(email);

				if (resData.ok && resData.success) {
					supportSuccessMessage = resData.message || 'Peman pa kat ou a verifye avèk siksè! Aksè a debloke sou kont ou.';
					toast.success('Peman pa kat verifye ak siksè !');
				} else {
					supportErrorMessage = resData.message || `Nou pa jwenn okenn peman konfime sou Lemon Squeezy pou imel "${email}".`;
					toast.error('Erè nan verifikasyon an.');
				}
			} else {
				const ref = supportReference.trim();
				if (!ref) {
					toast.error('Tanpri antre nimewo referans tranzaksyon an.');
					supportLoading = false;
					return;
				}

				const resData = await verifyPlopplopReference(ref);

				if (resData.ok && resData.success) {
					supportSuccessMessage = resData.message || `Peman MonCash / Natcash (${ref}) verifye ak siksè !`;
					toast.success('Peman MonCash / Natcash verifye ak siksè !');
				} else {
					supportErrorMessage = resData.message || `Nou pa jwenn okenn peman valide pou referans "${ref}".`;
					toast.error('Erè nan verifikasyon an.');
				}
			}
		} catch (error) {
			console.error('Verify error:', error);
			supportErrorMessage = 'Yon erè rive pandan verifikasyon an. Tanpri kontakte nou dirèkteman.';
			toast.error('Erè nan verifikasyon an.');
		} finally {
			supportLoading = false;
		}
	}
</script>

<svelte:head>
	<title>Verifikasyon Peman & Debloke Aksè · DJR Akademi</title>
	<meta
		name="description"
		content="Paj ofisyèl pou verifye peman kat bancaire (Lemon Squeezy), MonCash ak Natcash pou debloke aksè nan fòmasyon ak ebook ou yo imedyatman."
	/>
</svelte:head>

<div class="min-h-screen bg-white flex flex-col font-sans text-zinc-900">
	<PublicHeader />

	<main class="flex-1">
		<!-- Page Banner Section -->
		<section class="bg-zinc-950 text-white py-12 sm:py-16 relative overflow-hidden border-b border-zinc-800">
			<div class="absolute inset-0 pointer-events-none">
				<div class="absolute top-0 left-1/3 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl"></div>
				<div class="absolute bottom-0 right-1/4 w-80 h-80 bg-orange-600/10 rounded-full blur-3xl"></div>
			</div>

			<div class="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
				<a
					href="/"
					class="inline-flex items-center gap-2 text-xs font-bold text-white/50 hover:text-white transition-colors"
				>
					<ArrowLeft size={16} />
					Tounen nan paj akèy
				</a>

				<div class="flex items-center gap-3">
					<div class="size-10 bg-amber-400 text-black grid place-items-center rounded-xl font-black">
						<ShieldCheck size={22} />
					</div>
					<div>
						<h1 class="text-2xl sm:text-4xl font-black tracking-tight">Verifikasyon Peman & Debloke Aksè</h1>
						<p class="text-white/60 text-xs sm:text-sm font-medium mt-1">
							Verifye tranzaksyon ou pa kat bancaire oswa mobil san ou pa bezwen tann.
						</p>
					</div>
				</div>
			</div>
		</section>

		<!-- Main Verification Section -->
		<section class="py-16 sm:py-20 bg-zinc-950 text-white relative overflow-hidden flex-1">
			<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div class="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

					<!-- Left Visual: Banana Assistant -->
					<div class="lg:col-span-5 relative group">
						<div class="relative rounded-3xl overflow-hidden border border-white/15 bg-gradient-to-b from-white/10 to-white/5 backdrop-blur-xl p-2 shadow-2xl">
							<img
								src="/payment-banana.png"
								alt="Sipò Peman DJR Akademi - Banana Assistant"
								class="w-full h-auto object-cover rounded-2xl group-hover:scale-102 transition-transform duration-500"
							/>
							<div class="absolute bottom-6 left-6 right-6 bg-zinc-950/85 backdrop-blur-md border border-white/15 p-4 rounded-xl shadow-xl">
								<div class="flex items-center gap-3">
									<div class="size-10 bg-amber-400 text-black grid place-items-center rounded-lg font-black shrink-0">
										<ShieldCheck size={20} />
									</div>
									<div>
										<p class="text-xs font-bold text-white">Sistèm Otomatik 24/7</p>
										<p class="text-[11px] text-white/60">Debloke kou ou yo imedyatman apre verifikasyon</p>
									</div>
								</div>
							</div>
						</div>
					</div>

					<!-- Right Form Container -->
					<div class="lg:col-span-7 space-y-6">
						<div class="space-y-3">
							<div class="inline-flex items-center gap-2 px-3.5 py-1.5 bg-amber-400/10 border border-amber-400/20 rounded-full text-amber-400 text-xs font-bold uppercase tracking-wider">
								<HelpCircle size={14} />
								Sipò & Verifikasyon Directe
							</div>
							<h2 class="text-3xl sm:text-4xl font-black tracking-tight leading-tight">
								Antre enfòmasyon peman ou yo
							</h2>
							<p class="text-white/60 text-sm leading-relaxed max-w-xl">
								Si w te peye pa kat bancaire sou Lemon Squeezy oubyen via MonCash / Natcash epi aksè a pa aktive otomatikman, n ap verifye li pou w imedyatman.
							</p>
						</div>

						<!-- Payment Method Tabs -->
						<div class="space-y-3">
							<span class="text-xs font-bold text-white/50 uppercase tracking-widest block">Chwazi fason w te peye an :</span>
							<div class="grid grid-cols-2 gap-2 p-1.5 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md">
								<button
									type="button"
									onclick={() => { supportMethod = 'carte'; supportSuccessMessage = null; supportErrorMessage = null; }}
									class="flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl font-bold text-xs transition-all duration-200 cursor-pointer {supportMethod === 'carte' ? 'bg-amber-400 text-black shadow-lg shadow-amber-400/20' : 'text-white/70 hover:text-white hover:bg-white/5'}"
								>
									<CreditCard size={16} />
									<span>Kat bancaire (Lemon Squeezy)</span>
								</button>
								<button
									type="button"
									onclick={() => { supportMethod = 'mobile'; supportSuccessMessage = null; supportErrorMessage = null; }}
									class="flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl font-bold text-xs transition-all duration-200 cursor-pointer {supportMethod === 'mobile' ? 'bg-amber-400 text-black shadow-lg shadow-amber-400/20' : 'text-white/70 hover:text-white hover:bg-white/5'}"
								>
									<Smartphone size={16} />
									<span>MonCash / Natcash</span>
								</button>
							</div>
						</div>

						<!-- Interactive Form -->
						<form onsubmit={handleVerifySubmit} class="p-6 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-xl space-y-5">
							{#if supportMethod === 'carte'}
								<!-- Lemon Squeezy Card Email Input -->
								<div class="space-y-2">
									<label for="verify-card-email" class="block text-xs font-bold text-white/90">
										Imel ou te itilize sou Lemon Squeezy lè w t ap peye pa kat la *
									</label>
									<div class="relative">
										<input
											id="verify-card-email"
											type="email"
											required
											placeholder="ex: nom.prenom@gmail.com"
											bind:value={supportEmail}
											class="w-full h-12 px-4 bg-zinc-900/90 border border-white/15 focus:border-amber-400 rounded-xl text-sm font-medium text-white placeholder-white/30 outline-none transition-colors"
										/>
									</div>
									<p class="text-[11px] text-white/40">
										API Lemon Squeezy a ap verifye peman ki lye ak imel sa a epi matche li ak pwodui DJR Akademi an.
									</p>
								</div>
							{:else}
								<!-- MonCash / Natcash Input -->
								<div class="space-y-2">
									<label for="verify-ref" class="block text-xs font-bold text-white/90">
										Nimewo referans tranzaksyon MonCash / Natcash an *
									</label>
									<input
										id="verify-ref"
										type="text"
										required
										placeholder="ex: 6a94b44a001655dbf38d"
										bind:value={supportReference}
										class="w-full h-12 px-4 bg-zinc-900/90 border border-white/15 focus:border-amber-400 rounded-xl text-sm font-medium text-white placeholder-white/30 outline-none transition-colors"
									/>
									<p class="text-[11px] text-white/40">
										Antre nimewo referans ki sou mesaj konfimasyon MonCash / Natcash ou an pou n ka debloke kont ou.
									</p>
								</div>
							{/if}

							<!-- Submit Button -->
							<button
								type="submit"
								disabled={supportLoading}
								class="w-full h-12 bg-amber-400 hover:bg-amber-300 text-black font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-amber-400/15 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
							>
								{#if supportLoading}
									<Loader2 size={16} class="animate-spin" />
									<span>N ap verifye peman an...</span>
								{:else}
									<Send size={15} />
									<span>Verifye ak debloke aksè mwen</span>
								{/if}
							</button>
						</form>

						<!-- Alert Feedback -->
						{#if supportSuccessMessage}
							<div class="p-5 bg-emerald-500/15 border border-emerald-500/30 rounded-2xl space-y-3 text-emerald-300 text-xs leading-relaxed animate-in fade-in">
								<div class="flex items-start gap-3">
									<CheckCircle2 size={20} class="shrink-0 mt-0.5 text-emerald-400" />
									<div class="space-y-1">
										<p class="font-bold text-sm text-white">Siksè !</p>
										<p>{supportSuccessMessage}</p>
									</div>
								</div>
								<div class="pt-2 border-t border-emerald-500/20 flex items-center justify-end">
									<a
										href="/dashboard"
										class="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-500 text-black font-bold text-xs rounded-xl hover:bg-emerald-400 transition-colors shadow-sm"
									>
										<Sparkles size={14} />
										<span>Aksede nan espas etidyan mwen</span>
									</a>
								</div>
							</div>
						{/if}

						{#if supportErrorMessage}
							<div class="p-5 bg-rose-500/15 border border-rose-500/30 rounded-2xl flex items-start gap-3 text-rose-300 text-xs leading-relaxed animate-in fade-in">
								<AlertCircle size={20} class="shrink-0 mt-0.5 text-rose-400" />
								<div>{supportErrorMessage}</div>
							</div>
						{/if}
					</div>

				</div>
			</div>
		</section>
	</main>

	<PublicFooter />
</div>
