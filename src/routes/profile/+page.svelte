<script lang="ts">
	import PublicHeader from '$lib/components/PublicHeader.svelte';
	import PublicFooter from '$lib/components/PublicFooter.svelte';
	import { page } from '$app/state';
	import { User, ChevronLeft, Save, Shield, CheckCircle2, Mail, Phone, Loader2, AlertCircle } from 'lucide-svelte';
	import { authState } from '$lib/auth.svelte';
	import { goto } from '$app/navigation';
	import { updateProfile } from '$lib/services/profiles';

	let currentLang = $derived<'fr' | 'ht'>(page.url.searchParams.get('lang') === 'ht' ? 'ht' : 'fr');

	function getHref(path: string) {
		return currentLang === 'ht' ? `${path}?lang=ht` : path;
	}

	const i18n = {
		fr: {
			pageTitle: 'Mon Profil · DJR Akademi',
			metaDesc: 'Gérez votre profil et vos informations personnelles sur DJR Akademi.',
			loadingProfile: 'Chargement de votre profil...',
			backToSpace: 'Retour à mon espace',
			myAccount: 'Mon compte',
			myProfile: 'Mon profil',
			profileDesc: 'Vérifiez vos informations et mettez-les à jour si nécessaire.',
			close: 'Fermer',
			student: 'Étudiant',
			activeAccount: 'Compte actif',
			accountInfoNote: 'Vous pouvez retrouver tous vos achats et formations dans l\'espace étudiant.',
			goToCourses: 'Accéder à mes cours',
			adminSpace: 'Espace administration',
			accountInfoTag: 'Informations du compte',
			personalInfoTitle: 'Informations personnelles',
			requiredNote: 'Les champs marqués d\'une étoile (*) sont obligatoires.',
			fullNameLabel: 'Nom complet',
			fullNameNote: 'C\'est ce nom qui apparaîtra sur votre compte.',
			emailLabel: 'Adresse email',
			emailNote: 'Cet email est lié à votre compte et ne peut pas être modifié ici.',
			whatsappLabel: 'Numéro WhatsApp',
			whatsappPlaceholder: '+509 00 00 0000',
			whatsappNote: 'Utilisez un numéro sur lequel l\'équipe peut vous contacter en cas de besoin.',
			checkBeforeSave: 'Vérifiez les informations avant d\'enregistrer.',
			saving: 'Enregistrement...',
			saveChanges: 'Enregistrer les modifications',
			successMsg: 'Les informations de votre compte ont été mises à jour avec succès !',
			errorMsg: 'Impossible de mettre à jour le profil pour le moment.'
		},
		ht: {
			pageTitle: 'Pwofil Mwen · DJR Akademi',
			metaDesc: 'Jere pwofil ak enfòmasyon pèsonèl ou sou DJR Akademi.',
			loadingProfile: 'N ap chaje pwofil ou...',
			backToSpace: 'Tounen nan espas mwen',
			myAccount: 'Kont mwen',
			myProfile: 'Pwofil mwen',
			profileDesc: 'Verifye enfòmasyon ou epi mete yo ajou lè sa nesesè.',
			close: 'Fèmen',
			student: 'Etidyan',
			activeAccount: 'Kont aktif',
			accountInfoNote: 'Ou ka jwenn tout acha ak fòmasyon ou yo nan espas etidyan an.',
			goToCourses: 'Ale nan kou mwen yo',
			adminSpace: 'Espas administrasyon',
			accountInfoTag: 'Enfòmasyon kont lan',
			personalInfoTitle: 'Enfòmasyon pèsonèl',
			requiredNote: 'Chan ki make obligatwa yo dwe ranpli.',
			fullNameLabel: 'Non konplè',
			fullNameNote: 'Se non sa a k ap parèt sou kont ou.',
			emailLabel: 'Adrès imèl',
			emailNote: 'Imèl sa a konekte ak kont ou epi li pa ka chanje isit la.',
			whatsappLabel: 'Nimewo WhatsApp',
			whatsappPlaceholder: '+509 00 00 0000',
			whatsappNote: 'Sèvi ak yon nimewo ekip la ka kontakte si ou bezwen sipò.',
			checkBeforeSave: 'Verifye enfòmasyon yo anvan ou anrejistre.',
			saving: 'Anrejistreman...',
			saveChanges: 'Anrejistre chanjman yo',
			successMsg: 'Enfòmasyon sou kont ou an mete ajou ak siksè !',
			errorMsg: 'Nou pa ka mete ajou profil la nan kounye a.'
		}
	};
	let t = $derived(i18n[currentLang]);

	$effect(() => {
		if (!authState.loading && !authState.user) {
			goto(getHref('/'));
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
			saveSuccessMessage = t.successMsg;
			setTimeout(() => {
				saveSuccessMessage = null;
			}, 4000);
		} catch (e: any) {
			console.error('Failed to update profile:', e);
			saveErrorMessage = e.message || t.errorMsg;
		} finally {
			saving = false;
		}
	}
</script>

<svelte:head>
	<title>{t.pageTitle}</title>
	<meta name="description" content={t.metaDesc} />
</svelte:head>

<div class="profile-page">
	<PublicHeader />

	{#if authState.loading}
		<main class="profile-loading" aria-label={t.loadingProfile}>
			<Loader2 size={30} class="animate-spin" />
			<span>{t.loadingProfile}</span>
		</main>
	{:else if authState.user}
		<main class="profile-main">
			<div class="profile-shell">
				<a href={getHref('/dashboard')} class="profile-back">
					<ChevronLeft size={16} />
					{t.backToSpace}
				</a>

				<header class="profile-heading">
					<span>{t.myAccount}</span>
					<h1>{t.myProfile}</h1>
					<p>{t.profileDesc}</p>
				</header>

				{#if saveSuccessMessage}
					<div class="profile-alert profile-alert-success" role="status" aria-live="polite">
						<CheckCircle2 size={19} />
						<span>{saveSuccessMessage}</span>
						<button type="button" onclick={() => (saveSuccessMessage = null)}>{t.close}</button>
					</div>
				{/if}

				<div class="profile-layout">
					<aside class="profile-summary" aria-label={t.myAccount}>
						<div class="profile-avatar"><User size={30} /></div>
						<span class="profile-role">{t.student}</span>
						<h2>{name || t.myAccount}</h2>
						<p>{email}</p>

						<div class="profile-status">
							<span><i></i> {t.activeAccount}</span>
							<small>{t.accountInfoNote}</small>
						</div>

						<a href={getHref('/dashboard')} class="profile-dashboard-link">{t.goToCourses}</a>

						{#if authState.isAdmin}
							<a href="/admin" class="profile-admin-link"><Shield size={15} /> {t.adminSpace}</a>
						{/if}
					</aside>

					<section class="profile-form-panel" aria-labelledby="personal-info-title">
						<div class="profile-form-heading">
							<div>
								<span>{t.accountInfoTag}</span>
								<h2 id="personal-info-title">{t.personalInfoTitle}</h2>
							</div>
							<p>{t.requiredNote}</p>
						</div>

						<form onsubmit={saveProfile} class="profile-form">
							<div class="profile-field">
								<label for="name">{t.fullNameLabel} <strong>*</strong></label>
								<div class="profile-input-wrap">
									<User size={17} />
									<input id="name" type="text" bind:value={name} required autocomplete="name" />
								</div>
								<small>{t.fullNameNote}</small>
							</div>

							<div class="profile-field">
								<label for="email">{t.emailLabel}</label>
								<div class="profile-input-wrap profile-input-disabled">
									<Mail size={17} />
									<input id="email" type="email" bind:value={email} readonly disabled />
								</div>
								<small>{t.emailNote}</small>
							</div>

							<div class="profile-field">
								<label for="whatsapp">{t.whatsappLabel}</label>
								<div class="profile-input-wrap">
									<Phone size={17} />
									<input id="whatsapp" type="tel" bind:value={whatsapp} placeholder={t.whatsappPlaceholder} autocomplete="tel" />
								</div>
								<small>{t.whatsappNote}</small>
							</div>

							{#if saveErrorMessage}
								<div class="profile-alert profile-alert-error" role="alert">
									<AlertCircle size={19} />
									<span>{saveErrorMessage}</span>
									<button type="button" onclick={() => (saveErrorMessage = null)}>{t.close}</button>
								</div>
							{/if}

							<div class="profile-actions">
								<p>{t.checkBeforeSave}</p>
								<button type="submit" disabled={saving}>
									{#if saving}<Loader2 size={17} class="animate-spin" /> {t.saving}{:else}<Save size={17} /> {t.saveChanges}{/if}
								</button>
							</div>
						</form>
					</section>
				</div>
			</div>
		</main>
	{/if}

	<PublicFooter />
</div>

<style>
	.profile-page {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
		background: #f6f2eb;
		color: #191815;
		font-family: ui-sans-serif, system-ui, sans-serif;
	}

	.profile-loading {
		display: flex;
		min-height: 520px;
		align-items: center;
		justify-content: center;
		gap: 12px;
		flex: 1;
		color: #7a7267;
		font-size: 13px;
	}

	.profile-loading :global(svg) { color: #b7791f; }

	.profile-main { flex: 1; padding: 54px 0 90px; }

	.profile-shell {
		width: min(1120px, calc(100% - 48px));
		margin: 0 auto;
	}

	.profile-back {
		display: inline-flex;
		align-items: center;
		gap: 7px;
		color: #6f685e;
		font-size: 12px;
		font-weight: 750;
		transition: color 160ms ease;
	}

	.profile-back:hover { color: #151410; }

	.profile-heading { margin: 38px 0 34px; }

	.profile-heading > span,
	.profile-form-heading span {
		display: block;
		margin-bottom: 8px;
		color: #a36c16;
		font-size: 10px;
		font-weight: 850;
		letter-spacing: 0.16em;
		text-transform: uppercase;
	}

	.profile-heading h1 {
		margin: 0;
		font-family: Georgia, 'Times New Roman', serif;
		font-size: clamp(40px, 5vw, 62px);
		letter-spacing: -0.045em;
		line-height: 1;
	}

	.profile-heading p {
		margin: 13px 0 0;
		color: #746d63;
		font-size: 14px;
	}

	.profile-layout {
		display: grid;
		align-items: start;
		grid-template-columns: minmax(250px, 0.72fr) minmax(0, 1.65fr);
		gap: 26px;
	}

	.profile-summary {
		padding: 32px;
		background: #141412;
		color: #f7f2e9;
	}

	.profile-avatar {
		display: grid;
		width: 66px;
		height: 66px;
		margin-bottom: 22px;
		place-items: center;
		background: #e2ad3d;
		color: #17130d;
	}

	.profile-role {
		display: inline-flex;
		padding: 6px 9px;
		border: 1px solid rgba(226, 173, 61, 0.45);
		color: #e8be65;
		font-size: 9px;
		font-weight: 850;
		letter-spacing: 0.13em;
		text-transform: uppercase;
	}

	.profile-summary h2 {
		margin: 17px 0 0;
		font-family: Georgia, 'Times New Roman', serif;
		font-size: 27px;
		line-height: 1.15;
	}

	.profile-summary > p {
		overflow: hidden;
		margin: 9px 0 0;
		color: rgba(247, 242, 233, 0.54);
		font-size: 12px;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.profile-status {
		margin-top: 30px;
		padding: 20px 0;
		border-top: 1px solid rgba(255, 255, 255, 0.13);
		border-bottom: 1px solid rgba(255, 255, 255, 0.13);
	}

	.profile-status span {
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 12px;
		font-weight: 800;
	}

	.profile-status i {
		width: 7px;
		height: 7px;
		border-radius: 50%;
		background: #53c477;
	}

	.profile-status small {
		display: block;
		margin-top: 9px;
		color: rgba(247, 242, 233, 0.45);
		font-size: 11px;
		line-height: 1.55;
	}

	.profile-dashboard-link,
	.profile-admin-link {
		display: flex;
		min-height: 46px;
		align-items: center;
		justify-content: center;
		margin-top: 20px;
		padding: 0 15px;
		background: #e2ad3d;
		color: #17130d;
		font-size: 11px;
		font-weight: 850;
		text-align: center;
	}

	.profile-admin-link {
		gap: 7px;
		margin-top: 10px;
		border: 1px solid rgba(255, 255, 255, 0.18);
		background: transparent;
		color: #fff;
	}

	.profile-form-panel {
		border: 1px solid #ddd5ca;
		background: #fff;
	}

	.profile-form-heading {
		display: flex;
		align-items: flex-end;
		justify-content: space-between;
		gap: 24px;
		padding: 28px 30px;
		border-bottom: 1px solid #e8e2d9;
	}

	.profile-form-heading h2 {
		margin: 0;
		font-family: Georgia, 'Times New Roman', serif;
		font-size: 29px;
		letter-spacing: -0.03em;
	}

	.profile-form-heading > p {
		max-width: 210px;
		margin: 0;
		color: #8a8176;
		font-size: 10px;
		line-height: 1.5;
		text-align: right;
	}

	.profile-form { padding: 30px; }

	.profile-field + .profile-field { margin-top: 25px; }

	.profile-field label {
		display: block;
		margin-bottom: 9px;
		color: #302e29;
		font-size: 12px;
		font-weight: 800;
	}

	.profile-field label strong { color: #ae741c; }

	.profile-input-wrap {
		display: grid;
		min-height: 52px;
		align-items: center;
		grid-template-columns: auto minmax(0, 1fr);
		gap: 12px;
		padding: 0 15px;
		border: 1px solid #cec6ba;
		background: #fff;
		color: #8b8174;
		transition: border-color 160ms ease, box-shadow 160ms ease;
	}

	.profile-input-wrap:focus-within {
		border-color: #a36c16;
		box-shadow: 0 0 0 3px rgba(163, 108, 22, 0.1);
	}

	.profile-input-wrap input {
		width: 100%;
		height: 50px;
		border: 0;
		outline: 0;
		background: transparent;
		color: #191815;
		font-size: 14px;
		font-weight: 550;
	}

	.profile-input-disabled {
		border-color: #e2ddd5;
		background: #f2efea;
	}

	.profile-input-disabled input { color: #777067; cursor: not-allowed; }

	.profile-field small {
		display: block;
		margin-top: 7px;
		color: #8a8176;
		font-size: 10px;
		line-height: 1.5;
	}

	.profile-actions {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 24px;
		margin-top: 32px;
		padding-top: 24px;
		border-top: 1px solid #e8e2d9;
	}

	.profile-actions p {
		margin: 0;
		color: #8a8176;
		font-size: 10px;
	}

	.profile-actions button {
		display: inline-flex;
		min-height: 50px;
		align-items: center;
		justify-content: center;
		gap: 9px;
		padding: 0 22px;
		border: 0;
		background: #171713;
		color: #fff;
		font-size: 12px;
		font-weight: 850;
		cursor: pointer;
		transition: background-color 160ms ease;
	}

	.profile-actions button:hover { background: #322f29; }
	.profile-actions button:disabled { cursor: wait; opacity: 0.6; }

	.profile-alert {
		display: grid;
		align-items: center;
		grid-template-columns: auto minmax(0, 1fr) auto;
		gap: 11px;
		margin-bottom: 22px;
		padding: 14px 16px;
		font-size: 12px;
		font-weight: 700;
	}

	.profile-alert button {
		border: 0;
		background: transparent;
		font-size: 10px;
		font-weight: 850;
		cursor: pointer;
	}

	.profile-alert-success { border: 1px solid #b9dec1; background: #edf7ef; color: #276538; }
	.profile-alert-error { margin: 24px 0 0; border: 1px solid #ebc1bb; background: #fcf0ee; color: #92392f; }

	@media (max-width: 840px) {
		.profile-layout { grid-template-columns: 1fr; }
		.profile-summary { display: grid; grid-template-columns: auto minmax(0, 1fr); column-gap: 20px; }
		.profile-avatar { grid-row: 1 / 5; margin: 0; }
		.profile-role { width: max-content; align-self: start; }
		.profile-summary h2 { margin-top: 10px; }
		.profile-summary > p { margin-top: 6px; }
		.profile-status, .profile-dashboard-link, .profile-admin-link { grid-column: 1 / -1; }
	}

	@media (max-width: 560px) {
		.profile-main { padding: 36px 0 64px; }
		.profile-shell { width: min(100% - 32px, 1120px); }
		.profile-heading { margin: 30px 0 26px; }
		.profile-heading h1 { font-size: 43px; }
		.profile-summary { padding: 24px; }
		.profile-avatar { width: 56px; height: 56px; }
		.profile-form-heading { align-items: flex-start; padding: 23px 20px; flex-direction: column; }
		.profile-form-heading > p { max-width: none; text-align: left; }
		.profile-form { padding: 22px 20px; }
		.profile-actions { align-items: stretch; flex-direction: column; }
		.profile-actions button { width: 100%; }
		.profile-alert { grid-template-columns: auto minmax(0, 1fr); }
		.profile-alert button { grid-column: 2; justify-self: start; }
	}

	@media (prefers-reduced-motion: reduce) {
		.profile-input-wrap, .profile-actions button { transition: none; }
	}
</style>
