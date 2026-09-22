<script lang="ts">
	import PublicHeader from '$lib/components/PublicHeader.svelte';
	import PublicFooter from '$lib/components/PublicFooter.svelte';
	import { page } from '$app/state';
	import { Shield, FileText, CheckCircle2, AlertTriangle, Scale } from 'lucide-svelte';

	let currentLang = $derived<'fr' | 'ht'>(page.url.searchParams.get('lang') === 'ht' ? 'ht' : 'fr');

	const i18n = {
		fr: {
			pageTitle: 'Conditions de Service et d\'Utilisation | DJR Akademi',
			metaDesc: 'Conditions générales d\'utilisation et de service sur la plateforme d\'apprentissage DJR Akademi.',
			badge: 'Document Légal',
			title: 'Conditions de Service et d\'Utilisation',
			subtitle: 'Veuillez lire attentivement ces conditions avant d\'utiliser la plateforme DJR Akademi.',
			lastUpdated: 'Dernière mise à jour : 8 Septembre 2026',
			sec1Title: '1. Acceptation des Conditions',
			sec1Desc: 'En créant un compte, en achetant une formation, un ebook ou en réservant un service de coaching sur DJR Akademi, vous reconnaissez avoir lu, compris et accepté l\'ensemble de ces conditions générales d\'utilisation sans réserve.',
			sec2Title: '2. Accès et Compte Utilisateur',
			sec2Desc: 'Chaque compte créé sur DJR Akademi est destiné à un seul utilisateur individuel. Vous êtes responsable de la sécurité de votre mot de passe. Le partage ou la revente d\'accès à votre compte à des tiers constitue une violation entraînant la suspension du compte sans remboursement.',
			sec3Title: '3. Paiement et Validation',
			sec3Desc: 'DJR Akademi accepte les paiements par MonCash, NatCash, ainsi que les cartes bancaires (Visa, MasterCard et autres via Lemon Squeezy). Les paiements sont effectués en Gourdes (HTG) ou en Dollars Américains (USD). L\'accès aux produits numériques (cours et ebooks) ou la confirmation du coaching est débloqué automatiquement sur votre compte dès la validation de la transaction.',
			sec4Title: '4. Politique de Remboursement et d\'Annulation',
			sec4Item1Title: 'Produits numériques (Cours & Ebooks) :',
			sec4Item1Desc: 'En raison de la nature numérique immédiate du contenu, les achats de formations et ebooks sont définitifs et non remboursables une fois l\'accès débloqué.',
			sec4Item2Title: 'Sessions de Coaching :',
			sec4Item2Desc: 'Si vous devez reporter une session de coaching, veuillez nous contacter au moins 24 heures avant l\'heure confirmée. Une réservation en attente de paiement expirera automatiquement si le paiement n\'est pas effectué dans le délai imparti.',
			sec5Title: '5. Propriété Intellectuelle',
			sec5Desc: 'L\'ensemble des vidéos, textes, ebooks, supports et contenus présents sur DJR Akademi est la propriété exclusive de DJR Akademi. Il est strictement interdit de copier, redistribuer, enregistrer pour revente ou publier un contenu quelconque sans autorisation écrite préalable.',
			sec6Title: '6. Confidentialité et Cookies',
			sec6Desc: 'DJR Akademi n\'utilise aucun cookie publicitaire ou de suivi (tracking). Seuls les cookies techniques nécessaires pour maintenir votre connexion sécurisée à votre compte sont utilisés.'
		},
		ht: {
			pageTitle: 'Kondisyon Sèvis ak Itilizasyon | DJR Akademi',
			metaDesc: 'Kondisyon jeneral d\'itilizasyon ak sèvis nan platfòm aprantisaj DJR Akademi.',
			badge: 'Dokiman Legal',
			title: 'Kondisyon Sèvis ak Itilizasyon',
			subtitle: 'Tanpri li kondisyon sa yo avèk atansyon anvan ou sèvi ak platfòm DJR Akademi an.',
			lastUpdated: 'Dènye maj : 8 Sèptanm 2026',
			sec1Title: '1. Akseptasyon Kondisyon Yo',
			sec1Desc: 'Lè ou kreye yon kont, achte yon fòmasyon, yon ebook, oubyen ou rezève yon sèvis coaching sou DJR Akademi, ou rekonèt ke ou li, konprann ak aksepte tout kondisyon jeneral d\'itilizasyon sa yo san okenn rezèv.',
			sec2Title: '2. Aksè ak Kont Itilizatè',
			sec2Desc: 'Chak kont kreye sou DJR Akademi se pou yon sèl itilizatè endividyèl. Ou responsab pou kenbe mo de pas ou an sekirite. Pataje yon kont oubyen revann aksè ak kont ou bay lòt moun se yon vyolasyon ki ka mennen nan suspansyon kont lan san ranbousman.',
			sec3Title: '3. Peman ak Validasyon',
			sec3Desc: 'DJR Akademi aksepte peman pa MonCash, NatCash, ansanm ak kat bankè (Visa, MasterCard ak lòt kat ak Lemon Squeezy). Peman yo fèt an Gourdes (HTG) oubyen Dola Ameriken (USD). Aksè ak pwodui dijital yo (kou ak ebook) oswa konfimasyon coaching an debloke otomatikman sou kont ou lè tranzaksyon an valide.',
			sec4Title: '4. Politik Ranbousman ak Annilasyon',
			sec4Item1Title: 'Pwodui dijital (Kou & Ebooks) :',
			sec4Item1Desc: 'Akòz nati dijital imedyat kontni an, achte fòmasyon ak ebook yo se peman final san ranbousman apre aksè an fin debloke.',
			sec4Item2Title: 'Sesyon Coaching :',
			sec4Item2Desc: 'Si ou bezwen ranvwaye yon sesyon coaching, tanpri kontakte nou omwen 24 èdtan anvan lè konfime an. Yon rezèvasyon ki an atant peman ap ekspire otomatikman si peman an pa fèt nan tan limite an.',
			sec5Title: '5. Pwopriyete Entèlektyèl',
			sec5Desc: 'Tout videyo, tèks, ebook, materyèl ak kontni ki sou DJR Akademi se pwopriyete eksklizif DJR Akademi. Li entèdi pou kopye, redistribiye, anrejistre pou revann oubyen pibliye okenn kontni san otorizasyon ekri anvan.',
			sec6Title: '6. Konfidentialite ak Cookies',
			sec6Desc: 'DJR Akademi pa sèvi ak okenn cookies piblisitè oubyen cookies pou swiv (tracking). Sèl cookies ki itilize se cookies teknik ki nesesè pou kenbe ou konekte nan kont ou an sekirite.'
		}
	};
	let t = $derived(i18n[currentLang]);
</script>

<svelte:head>
	<title>{t.pageTitle}</title>
	<meta name="description" content={t.metaDesc} />
</svelte:head>

<div class="min-h-screen bg-zinc-950 text-white flex flex-col font-sans">
	<PublicHeader />

	<main class="flex-1 py-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full space-y-12">
		<!-- Header Section -->
		<div class="text-center space-y-4">
			<div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold">
				<Scale size={14} />
				<span>{t.badge}</span>
			</div>
			<h1 class="text-3xl sm:text-4xl font-black text-white uppercase tracking-tight">
				{t.title}
			</h1>
			<p class="text-zinc-400 text-sm max-w-xl mx-auto leading-relaxed">
				{t.subtitle}
			</p>
			<p class="text-xs text-zinc-500 font-mono">{t.lastUpdated}</p>
		</div>

		<!-- Main Legal Content -->
		<div class="space-y-8 text-sm text-zinc-300 leading-relaxed bg-zinc-900/60 p-6 sm:p-10 rounded-3xl border border-zinc-800">
			<!-- Section 1 -->
			<section class="space-y-3">
				<div class="flex items-center gap-2.5 text-amber-400 font-bold text-base">
					<FileText size={18} />
					<h2>{t.sec1Title}</h2>
				</div>
				<p class="text-zinc-400">
					{t.sec1Desc}
				</p>
			</section>

			<hr class="border-zinc-800" />

			<!-- Section 2 -->
			<section class="space-y-3">
				<div class="flex items-center gap-2.5 text-amber-400 font-bold text-base">
					<Shield size={18} />
					<h2>{t.sec2Title}</h2>
				</div>
				<p class="text-zinc-400">
					{t.sec2Desc}
				</p>
			</section>

			<hr class="border-zinc-800" />

			<!-- Section 3 -->
			<section class="space-y-3">
				<div class="flex items-center gap-2.5 text-amber-400 font-bold text-base">
					<CheckCircle2 size={18} />
					<h2>{t.sec3Title}</h2>
				</div>
				<p class="text-zinc-400">
					{t.sec3Desc}
				</p>
			</section>

			<hr class="border-zinc-800" />

			<!-- Section 4 -->
			<section class="space-y-3">
				<div class="flex items-center gap-2.5 text-amber-400 font-bold text-base">
					<AlertTriangle size={18} />
					<h2>{t.sec4Title}</h2>
				</div>
				<ul class="list-disc pl-5 space-y-2 text-zinc-400">
					<li><strong>{t.sec4Item1Title}</strong> {t.sec4Item1Desc}</li>
					<li><strong>{t.sec4Item2Title}</strong> {t.sec4Item2Desc}</li>
				</ul>
			</section>

			<hr class="border-zinc-800" />

			<!-- Section 5 -->
			<section class="space-y-3">
				<div class="flex items-center gap-2.5 text-amber-400 font-bold text-base">
					<Scale size={18} />
					<h2>{t.sec5Title}</h2>
				</div>
				<p class="text-zinc-400">
					{t.sec5Desc}
				</p>
			</section>

			<hr class="border-zinc-800" />

			<!-- Section 6 -->
			<section class="space-y-3">
				<div class="flex items-center gap-2.5 text-amber-400 font-bold text-base">
					<Shield size={18} />
					<h2>{t.sec6Title}</h2>
				</div>
				<p class="text-zinc-400">
					{t.sec6Desc}
				</p>
			</section>
		</div>
	</main>

	<PublicFooter />
</div>
