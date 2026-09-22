<script lang="ts">
	import { ArrowUpRight, ShieldCheck } from 'lucide-svelte';
	import { onMount } from 'svelte';
	import { page } from '$app/state';

	const DEFAULT_SITE_NAME = 'DJR AKADEMI';
	const DEFAULT_LOGO_URL = '/logo.png';

	let siteName = $state(DEFAULT_SITE_NAME);
	let logoUrl = $state(DEFAULT_LOGO_URL);

	let currentLang = $derived<'fr' | 'ht'>(page.url.searchParams.get('lang') === 'ht' ? 'ht' : 'fr');

	const footerI18n = {
		fr: {
			tagline: "Apprenez des compétences numériques pratiques, progressez en toute confiance et créez de nouvelles opportunités.",
			needHelp: "Besoin d'aide ?",
			contactTeam: "Contacter l'équipe",
			kicker: "Apprendre · Progresser · Réussir",
			statement: "Des connaissances pratiques pour passer à l'action.",
			exploreGroup: "Explorer",
			home: "Accueil",
			catalogue: "Catalogue",
			bundles: "Offres groupées",
			about: "À propos",
			supportGroup: "Support",
			verifyPayment: "Vérifier un paiement",
			contact: "Contact",
			terms: "Conditions d'utilisation",
			copyright: (year: number, name: string) => `© ${year} ${name}. Tous droits réservés.`,
			securePayment: "Paiement sécurisé",
			location: "Port-au-Prince, Haïti"
		},
		ht: {
			tagline: "Aprann konpetans dijital ki itil, avanse ak plis konfyans epi bati nouvo opòtinite.",
			needHelp: "Ou bezwen asistans?",
			contactTeam: "Pale avèk ekip la",
			kicker: "Aprann · Avanse · Reyisi",
			statement: "Konesans ki ede w pase nan aksyon.",
			exploreGroup: "Eksplore",
			home: "Akèy",
			catalogue: "Katalòg",
			bundles: "Pakèt resous",
			about: "Konsènan nou",
			supportGroup: "Sipò",
			verifyPayment: "Verifye peman",
			contact: "Kontak",
			terms: "Kondisyon sèvis",
			copyright: (year: number, name: string) => `© ${year} ${name}. Tout dwa rezève.`,
			securePayment: "Peman sekirize",
			location: "Pòtoprens, Ayiti"
		}
	};

	let t = $derived(footerI18n[currentLang]);

	function getHref(path: string): string {
		if (currentLang !== 'ht') return path;
		const [pathname, search] = path.split('?');
		const params = new URLSearchParams(search || '');
		params.set('lang', 'ht');
		return `${pathname}?${params.toString()}`;
	}

	onMount(async () => {
		try {
			const response = await fetch('/api/announcement', { cache: 'no-store' });
			if (!response.ok) return;

			const data = await response.json();
			const configuredSiteName = typeof data.siteName === 'string' ? data.siteName.trim() : '';
			const configuredLogoUrl = typeof data.logoUrl === 'string' ? data.logoUrl.trim() : '';
			siteName = configuredSiteName || DEFAULT_SITE_NAME;
			logoUrl = configuredLogoUrl || DEFAULT_LOGO_URL;
		} catch (error) {
			console.error('Failed to load footer branding:', error);
		}
	});
</script>

<footer class="site-footer">
	<div class="footer-shell">
		<div class="footer-lead">
			<div class="footer-brand">
				<a href={getHref('/')} class="footer-logo" aria-label={siteName + (currentLang === 'ht' ? ' — Akèy' : ' — Accueil')}>
					<img src={logoUrl} alt={siteName} />
					<span>{siteName}</span>
				</a>
				<p>{t.tagline}</p>
			</div>

			<div class="footer-contact">
				<span>{t.needHelp}</span>
				<a href={getHref('/contact')}>{t.contactTeam} <ArrowUpRight size={18} /></a>
			</div>
		</div>

		<div class="footer-directory">
			<div class="footer-statement">
				<span class="footer-kicker">{t.kicker}</span>
				<h2>{t.statement}</h2>
			</div>

			<nav class="footer-column" aria-label={t.exploreGroup}>
				<h3>{t.exploreGroup}</h3>
				<a href={getHref('/')}>{t.home}</a>
				<a href={getHref('/catalogue')}>{t.catalogue}</a>
				<a href={getHref('/bundles')}>{t.bundles}</a>
				<a href={getHref('/about')}>{t.about}</a>
			</nav>

			<nav class="footer-column" aria-label={t.supportGroup}>
				<h3>{t.supportGroup}</h3>
				<a href={getHref('/verify')}>{t.verifyPayment}</a>
				<a href={getHref('/contact')}>{t.contact}</a>
				<a href={getHref('/terms')}>{t.terms}</a>
			</nav>
		</div>

		<div class="footer-bottom">
			<p>{t.copyright(2026, siteName)}</p>
			<div class="footer-trust">
				<span><ShieldCheck size={14} /> {t.securePayment}</span>
				<span>MonCash · Natcash</span>
				<span>{t.location}</span>
			</div>
		</div>
	</div>

	<div class="footer-wordmark" aria-hidden="true">{siteName}</div>
</footer>

<style>
	.site-footer {
		overflow: hidden;
		border-top: 1px solid rgba(255, 255, 255, 0.1);
		background:
			radial-gradient(circle at 88% 5%, rgba(220, 164, 45, 0.12), transparent 30%),
			#0d0d0b;
		color: #f5f1e9;
	}

	.footer-shell {
		width: min(1320px, calc(100% - 48px));
		margin: 0 auto;
	}

	.footer-lead {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 48px;
		padding: 58px 0 48px;
		border-bottom: 1px solid rgba(255, 255, 255, 0.12);
	}

	.footer-brand { max-width: 470px; }

	.footer-logo {
		display: inline-flex;
		align-items: center;
		gap: 13px;
		color: #fff;
	}

	.footer-logo img {
		display: block;
		width: auto;
		height: 42px;
		object-fit: contain;
	}

	.footer-logo span {
		font-family: Georgia, 'Times New Roman', serif;
		font-size: 19px;
		font-weight: 700;
		letter-spacing: 0.035em;
	}

	.footer-brand p {
		max-width: 450px;
		margin: 18px 0 0;
		color: rgba(245, 241, 233, 0.56);
		font-size: 13px;
		line-height: 1.7;
	}

	.footer-contact {
		display: flex;
		align-items: center;
		gap: 20px;
	}

	.footer-contact > span {
		color: rgba(245, 241, 233, 0.54);
		font-size: 12px;
		font-weight: 700;
	}

	.footer-contact a {
		display: inline-flex;
		min-height: 52px;
		align-items: center;
		justify-content: center;
		gap: 12px;
		padding: 0 22px;
		background: #e4ad38;
		color: #14120e;
		font-size: 13px;
		font-weight: 850;
		transition: background-color 180ms ease, transform 180ms ease;
	}

	.footer-contact a:hover {
		background: #efbd50;
		transform: translateY(-2px);
	}

	.footer-directory {
		display: grid;
		grid-template-columns: minmax(0, 1.7fr) minmax(150px, 0.5fr) minmax(150px, 0.5fr);
		gap: 64px;
		padding: 62px 0;
	}

	.footer-statement { max-width: 590px; }

	.footer-kicker {
		display: block;
		margin-bottom: 13px;
		color: #e4ad38;
		font-size: 10px;
		font-weight: 850;
		letter-spacing: 0.18em;
		text-transform: uppercase;
	}

	.footer-statement h2 {
		margin: 0;
		font-family: Georgia, 'Times New Roman', serif;
		font-size: clamp(32px, 3.6vw, 52px);
		font-weight: 700;
		letter-spacing: -0.04em;
		line-height: 1.05;
	}

	.footer-column {
		display: flex;
		align-items: flex-start;
		gap: 13px;
		flex-direction: column;
	}

	.footer-column h3 {
		margin: 0 0 8px;
		color: rgba(245, 241, 233, 0.4);
		font-size: 10px;
		font-weight: 850;
		letter-spacing: 0.16em;
		text-transform: uppercase;
	}

	.footer-column a {
		color: rgba(245, 241, 233, 0.78);
		font-size: 13px;
		font-weight: 650;
		transition: color 160ms ease, transform 160ms ease;
	}

	.footer-column a:hover {
		color: #e7b64d;
		transform: translateX(3px);
	}

	.footer-bottom {
		display: flex;
		min-height: 70px;
		align-items: center;
		justify-content: space-between;
		gap: 28px;
		border-top: 1px solid rgba(255, 255, 255, 0.12);
		color: rgba(245, 241, 233, 0.42);
		font-size: 11px;
	}

	.footer-bottom p { margin: 0; }

	.footer-trust {
		display: flex;
		align-items: center;
		gap: 22px;
	}

	.footer-trust span { white-space: nowrap; }

	.footer-trust span:first-child {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		color: rgba(245, 241, 233, 0.64);
	}

	.footer-wordmark {
		overflow: hidden;
		margin-bottom: -0.09em;
		color: rgba(255, 255, 255, 0.055);
		font-size: clamp(72px, 13.2vw, 214px);
		font-weight: 950;
		letter-spacing: -0.075em;
		line-height: 0.78;
		text-align: center;
		white-space: nowrap;
		user-select: none;
	}

	@media (max-width: 820px) {
		.footer-lead {
			align-items: flex-start;
			flex-direction: column;
		}

		.footer-directory {
			grid-template-columns: 1fr 1fr;
			gap: 48px 28px;
		}

		.footer-statement { grid-column: 1 / -1; }

		.footer-bottom {
			align-items: flex-start;
			padding: 24px 0;
			flex-direction: column;
		}
	}

	@media (max-width: 560px) {
		.footer-shell { width: min(100% - 32px, 1320px); }
		.footer-lead { gap: 30px; padding: 44px 0 38px; }
		.footer-contact { width: 100%; align-items: flex-start; flex-direction: column; gap: 12px; }
		.footer-contact a { width: 100%; }
		.footer-directory { gap: 42px 24px; padding: 46px 0; }
		.footer-statement h2 { font-size: 34px; }
		.footer-trust { align-items: flex-start; flex-wrap: wrap; gap: 11px 18px; }
		.footer-wordmark { padding-top: 18px; font-size: 22vw; }
	}

	@media (prefers-reduced-motion: reduce) {
		.footer-contact a,
		.footer-column a { transition: none; }
	}
</style>
