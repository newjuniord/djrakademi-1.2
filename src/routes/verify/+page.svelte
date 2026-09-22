<script lang="ts">
	import PublicHeader from '$lib/components/PublicHeader.svelte';
	import PublicFooter from '$lib/components/PublicFooter.svelte';
	import { toast } from '$lib/toast.svelte';
	import { goto } from '$app/navigation';

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

	import { page } from '$app/state';
	import { authState } from '$lib/auth.svelte';
	import { verifyLemonSqueezyEmail, verifyPlopplopReference } from '$lib/services/payments';

	let currentLang = $derived<'fr' | 'ht'>(page.url.searchParams.get('lang') === 'ht' ? 'ht' : 'fr');

	function getHref(path: string) {
		return currentLang === 'ht' ? `${path}?lang=ht` : path;
	}

	const i18n = {
		fr: {
			pageTitle: 'Vérification de Paiement & Déblocage d\'Accès · DJR Akademi',
			metaDesc: 'Page officielle pour vérifier vos paiements par carte bancaire (Lemon Squeezy), MonCash et Natcash afin de débloquer votre accès immédiatement.',
			backHome: 'Retour à l\'accueil',
			title: 'Vérification de Paiement & Déblocage d\'Accès',
			subtitle: 'Vérifiez votre transaction par carte bancaire ou paiement mobile sans attendre.',
			supportBadge: 'Support & Vérification Directe',
			supportHeading: 'Si vous avez déjà payé sur l\'ancien site et n\'avez pas reçu l\'accès, entrez votre email.',
			supportDesc: 'Si vous avez payé par carte bancaire sur Lemon Squeezy ou via MonCash / Natcash et que votre accès n\'est pas activé automatiquement, nous le vérifierons immédiatement.',
			chooseMethod: 'Choisissez votre mode de paiement :',
			cardMethod: 'Carte bancaire (Lemon Squeezy)',
			mobileMethod: 'MonCash / Natcash',
			cardEmailLabel: 'Email utilisé lors de votre paiement sur Lemon Squeezy *',
			cardEmailPlaceholder: 'ex: email-paiement@gmail.com',
			cardEmailNote: 'Saisissez l\'email utilisé lors du paiement. L\'accès sera débloqué uniquement sur votre compte actuel (',
			connectToSee: 'connectez-vous pour voir votre email',
			otpPlaceholder: 'Code OTP',
			mobileRefLabel: 'Numéro de référence de transaction MonCash / Natcash *',
			mobileRefPlaceholder: 'ex: 6a94b44a001655dbf38d',
			mobileRefNote: 'Entrez le numéro de référence présent sur votre message de confirmation MonCash / Natcash.',
			verifying: 'Vérification du paiement en cours...',
			verifyBtn: 'Vérifier et débloquer mon accès',
			successTitle: 'Succès !',
			accessDashboard: 'Accéder à mon espace étudiant',
			loginError: 'Vous devez être connecté à votre compte pour vérifier un paiement.',
			emailRequiredError: 'Veuillez saisir une adresse email valide.',
			otpSent: 'Code envoyé à votre adresse email.',
			cardSuccess: 'Votre paiement par carte a été vérifié avec succès ! Redirection en cours...',
			cardSuccessToast: 'Accès débloqué avec succès ! Redirection en cours...',
			cardError: 'Erreur lors de la vérification.',
			refRequiredError: 'Veuillez saisir le numéro de référence de la transaction.',
			mobileSuccess: 'Paiement vérifié avec succès ! Redirection en cours...',
			mobileSuccessToast: 'Accès débloqué avec succès ! Redirection en cours...',
			genericError: 'Une erreur est survenue pendant la vérification. Veuillez nous contacter directement.'
		},
		ht: {
			pageTitle: 'Verifikasyon Peman & Debloke Aksè · DJR Akademi',
			metaDesc: 'Paj ofisyèl pou verifye peman kat bancaire (Lemon Squeezy), MonCash ak Natcash pou debloke aksè nan fòmasyon ak ebook ou yo imedyatman.',
			backHome: 'Tounen nan paj akèy',
			title: 'Verifikasyon Peman & Debloke Aksè',
			subtitle: 'Verifye tranzaksyon ou pa kat bancaire oswa mobil san ou pa bezwen tann.',
			supportBadge: 'Sipò & Verifikasyon Directe',
			supportHeading: 'Si ou te peye deja sou lòt sit la epi ou pa jwenn kou an, mete imèl ou.',
			supportDesc: 'Si w te peye pa kat bancaire sou Lemon Squeezy oubyen via MonCash / Natcash epi aksè a pa aktive otomatikman, n ap verifye li pou w imedyatman.',
			chooseMethod: 'Chwazi fason w te peye an :',
			cardMethod: 'Kat bancaire (Lemon Squeezy)',
			mobileMethod: 'MonCash / Natcash',
			cardEmailLabel: 'Imel ou te itilize pou w peye sou Lemon Squeezy an *',
			cardEmailPlaceholder: 'ex: imel-peman-ou@gmail.com',
			cardEmailNote: 'Mete imel ou te antre lè w t ap peye an. Aksè a ap debloke sou kont ou an sèlman (',
			connectToSee: 'konekte pou wè imel ou',
			otpPlaceholder: 'Kòd OTP',
			mobileRefLabel: 'Nimewo referans tranzaksyon MonCash / Natcash an *',
			mobileRefPlaceholder: 'ex: 6a94b44a001655dbf38d',
			mobileRefNote: 'Antre nimewo referans ki sou mesaj konfimasyon MonCash / Natcash ou an pou n ka debloke kont ou.',
			verifying: 'N ap verifye peman an...',
			verifyBtn: 'Verifye ak debloke aksè mwen',
			successTitle: 'Siksè !',
			accessDashboard: 'Aksede nan espas etidyan mwen',
			loginError: 'Ou dwe konekte sou kont ou pou w ka verifye yon peman.',
			emailRequiredError: 'Tanpri antre yon adres imel ki valab.',
			otpSent: 'Nou voye kòd la sou imel ou.',
			cardSuccess: 'Peman pa kat ou a verifye avèk siksè! N ap redirije w pou w kòmanse gade fòmasyon an...',
			cardSuccessToast: 'Aksè debloke ak siksè ! Redirèksyon en kous...',
			cardError: 'Erè nan verifikasyon an.',
			refRequiredError: 'Tanpri antre nimewo referans tranzaksyon an.',
			mobileSuccess: 'Peman verifye avèk siksè! N ap redirije w pou w kòmanse gade fòmasyon an...',
			mobileSuccessToast: 'Aksè debloke ak siksè ! Redirèksyon en kous...',
			genericError: 'Yon erè rive pandan verifikasyon an. Tanpri kontakte nou dirèkteman.'
		}
	};
	let t = $derived(i18n[currentLang]);

	// Verification Form State
	let supportMethod = $state<'carte' | 'mobile'>('carte');
	let supportEmail = $state('');
	let supportReference = $state('');
	let supportLoading = $state(false);
	let supportSuccessMessage = $state<string | null>(null);
	let supportErrorMessage = $state<string | null>(null);
	let otpChallenge = $state<string | null>(null);
	let otpCode = $state('');

	$effect(() => {
		if (authState.user?.email && !supportEmail) {
			supportEmail = authState.user.email;
		}
	});

	async function handleVerifySubmit(e: SubmitEvent) {
		e.preventDefault();
		supportSuccessMessage = null;
		supportErrorMessage = null;

		if (!authState.user) {
			toast.error(t.loginError);
			return;
		}

		supportLoading = true;

		try {
			if (supportMethod === 'carte') {
				const email = supportEmail.trim();
				if (!email || !email.includes('@')) {
					toast.error(t.emailRequiredError);
					supportLoading = false;
					return;
				}

				const resData = await verifyLemonSqueezyEmail(email, otpChallenge ? "confirm_otp" : "request_otp", otpChallenge || undefined, otpChallenge ? otpCode.trim() : undefined);

				if (resData.otpRequired && resData.challenge) { otpChallenge = resData.challenge; supportSuccessMessage = resData.message; toast.success(t.otpSent); } else if (resData.ok && resData.success) {
					const targetUrl = resData.courseId ? getHref(`/learn/${resData.courseId}`) : getHref('/dashboard');
					supportSuccessMessage = t.cardSuccess;
					toast.success(t.cardSuccessToast);
					setTimeout(() => {
						goto(targetUrl);
					}, 1000);
				} else {
					supportErrorMessage = resData.message || t.cardError;
					toast.error(t.cardError);
				}
			} else {
				const ref = supportReference.trim();
				if (!ref) {
					toast.error(t.refRequiredError);
					supportLoading = false;
					return;
				}

				const resData = await verifyPlopplopReference(ref);

				if (resData.ok && resData.success) {
					const targetUrl = resData.courseId ? getHref(`/learn/${resData.courseId}`) : getHref('/dashboard');
					supportSuccessMessage = t.mobileSuccess;
					toast.success(t.mobileSuccessToast);
					setTimeout(() => {
						goto(targetUrl);
					}, 1000);
				} else {
					supportErrorMessage = resData.message || t.cardError;
					toast.error(t.cardError);
				}
			}
		} catch (error) {
			console.error('Verify error:', error);
			supportErrorMessage = t.genericError;
			toast.error(t.cardError);
		} finally {
			supportLoading = false;
		}
	}
</script>

<svelte:head>
	<title>{t.pageTitle}</title>
	<meta
		name="description"
		content={t.metaDesc}
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
					href={getHref('/')}
					class="inline-flex items-center gap-2 text-xs font-bold text-white/50 hover:text-white transition-colors"
				>
					<ArrowLeft size={16} />
					{t.backHome}
				</a>

				<div class="flex items-center gap-3">
					<div class="size-10 bg-amber-400 text-black grid place-items-center rounded-xl font-black">
						<ShieldCheck size={22} />
					</div>
					<div>
						<h1 class="text-2xl sm:text-4xl font-black tracking-tight">{t.title}</h1>
						<p class="text-white/60 text-xs sm:text-sm font-medium mt-1">
							{t.subtitle}
						</p>
					</div>
				</div>
			</div>
		</section>

		<!-- Main Verification Section -->
		<section class="py-16 sm:py-20 bg-zinc-950 text-white relative overflow-hidden flex-1">
			<div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
				<div class="space-y-6">
						<div class="space-y-3">
							<div class="inline-flex items-center gap-2 px-3.5 py-1.5 bg-amber-400/10 border border-amber-400/20 rounded-full text-amber-400 text-xs font-bold uppercase tracking-wider">
								<HelpCircle size={14} />
								{t.supportBadge}
							</div>
							<h2 class="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
								{t.supportHeading}
							</h2>
							<p class="text-white/60 text-sm leading-relaxed max-w-xl">
								{t.supportDesc}
							</p>
						</div>

						<!-- Payment Method Tabs -->
						<div class="space-y-3">
							<span class="text-xs font-bold text-white/50 uppercase tracking-widest block">{t.chooseMethod}</span>
							<div class="grid grid-cols-2 gap-2 p-1.5 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md">
								<button
									type="button"
									onclick={() => { supportMethod = 'carte'; supportSuccessMessage = null; supportErrorMessage = null; }}
									class="flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl font-bold text-xs transition-all duration-200 cursor-pointer {supportMethod === 'carte' ? 'bg-amber-400 text-black shadow-lg shadow-amber-400/20' : 'text-white/70 hover:text-white hover:bg-white/5'}"
								>
									<CreditCard size={16} />
									<span>{t.cardMethod}</span>
								</button>
								<button
									type="button"
									onclick={() => { supportMethod = 'mobile'; supportSuccessMessage = null; supportErrorMessage = null; }}
									class="flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl font-bold text-xs transition-all duration-200 cursor-pointer {supportMethod === 'mobile' ? 'bg-amber-400 text-black shadow-lg shadow-amber-400/20' : 'text-white/70 hover:text-white hover:bg-white/5'}"
								>
									<Smartphone size={16} />
									<span>{t.mobileMethod}</span>
								</button>
							</div>
						</div>

						<!-- Interactive Form -->
						<form onsubmit={handleVerifySubmit} class="p-6 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-xl space-y-5">
							{#if supportMethod === 'carte'}
								<!-- Lemon Squeezy Card Email Input -->
								<div class="space-y-2">
									<label for="verify-card-email" class="block text-xs font-bold text-white/90">
										{t.cardEmailLabel}
									</label>
									<div class="relative">
										<input
											id="verify-card-email"
											type="email"
											required
											placeholder={t.cardEmailPlaceholder}
											bind:value={supportEmail}
											class="w-full h-12 px-4 bg-zinc-900/90 border border-white/15 focus:border-amber-400 rounded-xl text-sm font-medium text-white placeholder-white/30 outline-none transition-colors"
                                        />
                                </div>
                                <p class="text-[11px] text-white/50 leading-relaxed">{t.cardEmailNote}<span class="text-amber-400 font-bold">{authState.user?.email || t.connectToSee}</span>).</p>
                                {#if otpChallenge}<input id="verify-otp" inputmode="numeric" autocomplete="one-time-code" maxlength="6" required bind:value={otpCode} placeholder={t.otpPlaceholder} class="w-full h-12 px-4 bg-zinc-900/90 border border-white/15 focus:border-amber-400 rounded-xl text-sm text-white" />{/if}
                            </div>
							{:else}
								<!-- MonCash / Natcash Input -->
								<div class="space-y-2">
									<label for="verify-ref" class="block text-xs font-bold text-white/90">
										{t.mobileRefLabel}
									</label>
									<input
										id="verify-ref"
										type="text"
										required
										placeholder={t.mobileRefPlaceholder}
										bind:value={supportReference}
										class="w-full h-12 px-4 bg-zinc-900/90 border border-white/15 focus:border-amber-400 rounded-xl text-sm font-medium text-white placeholder-white/30 outline-none transition-colors"
									/>
									<p class="text-[11px] text-white/40">
										{t.mobileRefNote}
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
									<span>{t.verifying}</span>
								{:else}
									<Send size={15} />
									<span>{t.verifyBtn}</span>
								{/if}
							</button>
						</form>

						<!-- Alert Feedback -->
						{#if supportSuccessMessage}
							<div class="p-5 bg-emerald-500/15 border border-emerald-500/30 rounded-2xl space-y-3 text-emerald-300 text-xs leading-relaxed animate-in fade-in">
								<div class="flex items-start gap-3">
									<CheckCircle2 size={20} class="shrink-0 mt-0.5 text-emerald-400" />
									<div class="space-y-1">
										<p class="font-bold text-sm text-white">{t.successTitle}</p>
										<p>{supportSuccessMessage}</p>
									</div>
								</div>
								<div class="pt-2 border-t border-emerald-500/20 flex items-center justify-end">
									<a
										href={getHref('/dashboard')}
										class="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-500 text-black font-bold text-xs rounded-xl hover:bg-emerald-400 transition-colors shadow-sm"
									>
										<Sparkles size={14} />
										<span>{t.accessDashboard}</span>
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
		</section>
	</main>

	<PublicFooter />
</div>
