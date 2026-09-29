<script lang="ts">
	import PublicHeader from '$lib/components/PublicHeader.svelte';
	import PublicFooter from '$lib/components/PublicFooter.svelte';
	import { page } from '$app/state';
	import {
		GraduationCap,
		Target,
		Award,
		Users,
		Zap,
		ShieldCheck,
		ArrowRight,
		Sparkles,
		CheckCircle2,
		MessageSquare,
		BookOpen,
		CalendarCheck,
		CreditCard,
		HelpCircle,
		ChevronDown,
		PlayCircle,
		Check,
		Quote,
		Wand2,
		Briefcase
	} from 'lucide-svelte';

	let currentLang = $derived<'fr' | 'ht'>(page.url.searchParams.get('lang') === 'ht' ? 'ht' : 'fr');

	function getHref(path: string) {
		if (currentLang !== 'ht') return path;
		const url = new URL(path, page.url);
		url.searchParams.set('lang', 'ht');
		return `${url.pathname}${url.search}${url.hash}`;
	}

	const i18n = {
		fr: {
			pageTitle: 'À propos de DJR Akademi · DJR Akademi',
			metaDesc: 'Découvrez la mission de DJR Akademi : apprendre à utiliser l\'intelligence artificielle pour développer vos compétences. Cours, livres numériques, consultations et coaching privé.',
			badge: 'À propos de DJR Akademi',
			heroTitle: 'Apprenez à utiliser l\'intelligence artificielle pour développer vos compétences.',
			heroDesc: 'DJR Akademi s\'adresse à tous ceux qui veulent évoluer à l\'ère de l\'intelligence artificielle. La plateforme est conçue pour les créateurs de contenu, entrepreneurs, étudiants, professionnels, leaders, pasteurs, parents, vendeurs, responsables politiques et toute personne souhaitant mieux s\'exprimer, créer et vendre.',
			check1: '100 % axé sur la pratique et les résultats concrets',
			check2: 'Moyens de paiement locaux simples (MonCash et NatCash)',
			check3: 'Suivi personnalisé et communauté d\'étudiants motivés',
			exploreBtn: 'Explorer nos formations',
			learningTag: 'Apprentissage facile et flexible',
			learningQuote: '"Formez-vous avec des experts du domaine et transformez vos connaissances en opportunités."',
			stats: [
				{ value: '600+', label: 'Étudiants passionnés', detail: 'En Haïti et dans la diaspora' },
				{ value: '98%', label: 'Taux de satisfaction', detail: 'Avis positifs vérifiés' },
				{ value: '24/7', label: 'Accès illimité', detail: 'Apprenez à votre propre rythme' }
			],
			whyTitle: 'Pourquoi choisir DJR Akademi ?',
			whyDesc: 'Nous simplifions l\'apprentissage pour vous offrir une expérience fluide, rapide et axée sur les résultats.',
			values: [
				{
					title: 'Excellence et pratique',
					description: 'Chaque cours est conçu pour une application immédiate dans la vie réelle, sans perdre de temps en théorie inutile.'
				},
				{
					title: 'Paiements locaux simples',
					description: 'Nous facilitons l\'accès à l\'apprentissage en acceptant MonCash, NatCash et les cartes bancaires.'
				},
				{
					title: 'Coaching et mentorat individuel',
					description: 'Bénéficiez d\'un suivi personnalisé pour débloquer vos projets et atteindre vos objectifs plus rapidement.'
				},
				{
					title: 'Autonomie financière',
					description: 'Notre mission principale est de fournir à chaque étudiant des compétences solides pour réussir dans le monde numérique.'
				}
			],
			founderBadge: 'Message du fondateur',
			founderName: 'Jean Ronald Dumervil',
			founderRole: 'Auteur, formateur et créateur de contenu',
			manifestoQuote: '« Après avoir accumulé des millions de vues, réuni près d\'un million d\'abonnés et généré des dizaines de milliers de dollars en ligne, je conclus que : Le monde offre assez de richesses pour que chacun puisse vivre dignement. Mais cela n\'empêche pas un groupe d\'être prospère tandis qu\'un autre stagne. »',
			manifestoText1: 'La ligne qui sépare ces deux groupes s\'appelle le savoir. C\'est pour cela que DJR Akademi a été fondée : pour éliminer cette frontière et briser les barrières de la précarité pour tous ceux qui le souhaitent.',
			manifestoHighlightTitle: 'DJR Akademi s\'adresse à tous ceux qui veulent évoluer avec l\'intelligence artificielle.',
			manifestoHighlightText: 'Elle s\'adresse aux créateurs, entrepreneurs, étudiants, professionnels, leaders, pasteurs, parents, vendeurs, politiciens et à quiconque désire mieux s\'exprimer, créer, vendre et bâtir une vie d\'opportunités.',
			manifestoText2: 'Nombreux sont ceux qui ont du potentiel mais manquent de direction. Ils ne savent pas comment créer du contenu, bâtir une marque, s\'exprimer avec impact ou monétiser ce qu\'ils savent déjà.',
			manifestoText3: 'Sur DJR Akademi, vous trouverez des cours, livres numériques, consultations, coaching privé et services pratiques pour apprendre vite, appliquer facilement et progresser en toute confiance.',
			manifestoNote: 'DJR Akademi n\'est pas qu\'une théorie. C\'est le fruit de l\'expérience de Jean Ronald Dumervil en tant qu\'auteur, formateur, créateur de contenu et conférencier engagé au quotidien.',
			catHeaderBadge: 'Catégories et services',
			catHeaderTitle: '4 grandes catégories de services DJR Akademi',
			catCatalogBtn: 'Explorer le catalogue',
			cat1Badge: 'Catégorie 1',
			cat1Title: 'COURS (Formations vidéo)',
			cat1Desc: 'Formations vidéo complètes structurées en modules pour maîtriser l\'intelligence artificielle, la création de contenu, la prise de parole en public et l\'entrepreneuriat numérique à votre rythme.',
			cat2Badge: 'Catégorie 2',
			cat2Title: 'LIVRES NUMÉRIQUES (PDF)',
			cat2Desc: 'Guides PDF clairs, pratiques et directement téléchargeables sur votre téléphone ou ordinateur pour progresser rapidement.',
			cat3Badge: 'Catégorie 3',
			cat3Title: 'CONSULTATIONS ET SERVICES PRATIQUES',
			cat3Sub1: 'Consultations personnalisées :',
			cat3Sub2: 'Services pratiques que nous réalisons :',
			servicesList: [
				'Rédaction de scripts vidéo',
				'Création de plans de contenu sur 30 jours',
				'Correction et organisation de livres numériques',
				'Rédaction et correction de mémoires de fin d\'études',
				'Conception de livres numériques prêts à la vente',
				'Création de stratégies de marque',
				'Préparation de discours, présentations ou messages publics',
				'Création d\'instructions sur mesure pour l\'IA, adaptées à votre entreprise et à vos contenus'
			],
			consultationsList: [
				'Consultation sur la marque personnelle',
				'Consultation sur la création de contenu',
				'Consultation sur l\'entrepreneuriat numérique',
				'Consultation sur l\'écriture de livres et de livres numériques',
				'Consultation sur la narration et la communication',
				'Consultation sur la stratégie d\'IA pour votre travail ou votre entreprise'
			],
			cat4Badge: 'Catégorie 4',
			cat4Title: 'COACHING PRIVÉ (INDIVIDUEL)',
			cat4Desc: 'Un programme personnalisé pour pasteurs, prêtres, parents, leaders, responsables politiques, vendeurs, dirigeants d\'entreprise et influenceurs désirant s\'exprimer avec clarté, autorité et conviction.',
			faqTitle: 'Foire aux questions',
			faqSubtitle: 'Réponses simples aux questions les plus fréquentes.',
			faqs: [
				{
					q: 'Comment accéder à mes cours après le paiement ?',
					a: 'Dès la confirmation du paiement (MonCash, NatCash ou carte bancaire), votre accès est débloqué dans votre espace étudiant.'
				},
				{
					q: 'Les formations sont-elles accessibles sur smartphone ?',
					a: 'Oui, notre plateforme est adaptée aux smartphones, tablettes et ordinateurs.'
				},
				{
					q: 'Puis-je obtenir un reçu ou une facture pour mon achat ?',
					a: 'Oui ! Dans la rubrique « Mes transactions », vous pouvez télécharger un reçu PDF pour chaque commande.'
				},
				{
					q: 'Comment se déroule une séance de coaching individuel ?',
					a: 'Vous choisissez un créneau disponible dans le calendrier. Une fois confirmé, vous recevez un lien direct pour votre session en ligne.'
				}
			],
			ctaTitle: 'Prêt à monter en compétences ?',
			ctaDesc: 'Rejoignez les étudiants de DJR Akademi et accédez à nos formations.',
			ctaJoin: 'Rejoindre DJR Akademi',
			ctaContact: 'Nous contacter'
		},
		ht: {
			pageTitle: 'Konsènan DJR Akademi · DJR Akademi',
			metaDesc: 'Dekouvri misyon DJR Akademi: aprann sèvi ak entèlijans atifisyèl pou devlope konpetans ou. Kou, liv dijital, konsiltasyon ak ankadreman pèsonalize.',
			badge: 'Konsènan DJR Akademi',
			heroTitle: 'Aprann sèvi ak entèlijans atifisyèl pou devlope konpetans ou.',
			heroDesc: 'DJR Akademi se pou tout moun ki vle avanse nan epòk entèlijans atifisyèl la. Li fèt pou kreyatè kontni, antreprenè, etidyan, pwofesyonèl, lidè, pastè, paran, vandè, politisyen ak tout moun ki vle kominike, kreye ak vann pi byen.',
			check1: '100 % konsantre sou pratik ak rezilta konkrè',
			check2: 'Mwayen peman lokal ki senp (MonCash ak NatCash)',
			check3: 'Swivi pèsonalize ak yon kominote etidyan ki motive',
			exploreBtn: 'Eksplore fòmasyon nou yo',
			learningTag: 'Aprantisaj fasil ak fleksib',
			learningQuote: '"Aprann nan men ekspè nan domèn nan epi fè konesans ou tounen opòtinite."',
			stats: [
				{ value: '600+', label: 'Etidyan ki pasyone', detail: 'Nan Ayiti ak nan dyaspora a' },
				{ value: '98%', label: 'Nivo satisfaksyon', detail: 'Opinyon pozitif ki verifye' },
				{ value: '24/7', label: 'Aksè san limit', detail: 'Aprann nan rit pa w' }
			],
			whyTitle: 'Poukisa pou w chwazi DJR Akademi?',
			whyDesc: 'Nou senplifye aprantisaj la pou ba w yon eksperyans ki fasil, rapid epi ki chita sou rezilta.',
			values: [
				{
					title: 'Ekselans ak pratik',
					description: 'Chak kou fèt pou w ka aplike sa w aprann nan lavi chak jou, san pèdi tan nan teyori ki pa itil.'
				},
				{
					title: 'Peman lokal ki senp',
					description: 'Nou fasilite aksè nan aprantisaj lè nou aksepte MonCash, NatCash ak kat labank.'
				},
				{
					title: 'Ankadreman ak konsèy endividyèl',
					description: 'Jwenn swivi pèsonalize pou fè pwojè w yo avanse epi atenn objektif ou pi vit.'
				},
				{
					title: 'Otonomi finansye',
					description: 'Misyon prensipal nou se bay chak etidyan konpetans solid pou yo reyisi nan mond dijital la.'
				}
			],
			founderBadge: 'Mesaj fondatè a',
			founderName: 'Jean Ronald Dumervil',
			founderRole: 'Otè, fòmatè ak kreyatè kontni',
			manifestoQuote: '« Apre m fin fè plizyè milyon vizyalizasyon, reyini prèske yon milyon moun k ap swiv mwen epi fè plizyè dizèn milye dola sou entènèt, mwen rive nan konklizyon sa a: gen ase richès nan mond lan pou chak moun viv ak diyite. Men sa pa anpeche yon gwoup moun pwospere pandan yon lòt gwoup rete dèyè. »',
			manifestoText1: 'Konesans se sa ki separe de gwoup sa yo. Se poutèt sa DJR Akademi te fonde: pou elimine baryè sa a epi ede moun ki vle yo soti nan prekaryete.',
			manifestoHighlightTitle: 'DJR Akademi se pou tout moun ki vle avanse ak entèlijans atifisyèl.',
			manifestoHighlightText: 'Li fèt pou kreyatè kontni, antreprenè, etidyan, pwofesyonèl, lidè, pastè, paran, vandè, politisyen ak tout moun ki vle kominike, kreye, vann epi bati plis opòtinite.',
			manifestoText2: 'Anpil moun gen kapasite, men yo manke direksyon. Yo pa konnen kijan pou yo kreye kontni, bati yon mak, pale avèk enpak oswa fè konesans yo tounen yon sous revni.',
			manifestoText3: 'Sou DJR Akademi, w ap jwenn kou, liv dijital, konsiltasyon, ankadreman prive ak sèvis pratik pou aprann vit, aplike sa w aprann epi avanse ak konfyans.',
			manifestoNote: 'DJR Akademi baze sou eksperyans Jean Ronald Dumervil kòm otè, fòmatè, kreyatè kontni ak oratè ki angaje nan travay li chak jou.',
			catHeaderBadge: 'Kategori ak sèvis',
			catHeaderTitle: '4 gwo kategori sèvis DJR Akademi',
			catCatalogBtn: 'Eksplore katalòg la',
			cat1Badge: 'Kategori 1',
			cat1Title: 'KOU (Fòmasyon videyo)',
			cat1Desc: 'Fòmasyon videyo konplè ki òganize an modil pou w metrize entèlijans atifisyèl, kreyasyon kontni, pale an piblik ak biznis dijital nan rit pa w.',
			cat2Badge: 'Kategori 2',
			cat2Title: 'LIV DIJITAL (PDF)',
			cat2Desc: 'Gid PDF ki klè e pratik. Ou ka telechaje yo dirèkteman sou telefòn ou oswa òdinatè w pou avanse pi vit.',
			cat3Badge: 'Kategori 3',
			cat3Title: 'KONSILTASYON AK SÈVIS PRATIK',
			cat3Sub1: 'Konsiltasyon pèsonalize:',
			cat3Sub2: 'Sèvis pratik nou bay:',
			servicesList: [
				'Ekri tèks pou videyo',
				'Kreye plan kontni pou 30 jou',
				'Korije ak òganize liv dijital',
				'Ekri ak korije memwa fen etid',
				'Konsepsyon liv dijital pou vann',
				'Kreye estrateji mak',
				'Prepare diskou, prezantasyon oswa mesaj piblik',
				'Kreye enstriksyon pou entèlijans atifisyèl adapte ak biznis ou ak kontni w'
			],
			consultationsList: [
				'Konsiltasyon sou mak pèsonèl',
				'Konsiltasyon sou kreyasyon kontni',
				'Konsiltasyon sou biznis dijital',
				'Konsiltasyon sou ekriti liv ak liv dijital',
				'Konsiltasyon sou rakonte istwa ak kominikasyon',
				'Konsiltasyon sou estrateji entèlijans atifisyèl pou travay ou oswa biznis ou'
			],
			cat4Badge: 'Kategori 4',
			cat4Title: 'ANKADREMAN PRIVE (YON MOUN AK YON MOUN)',
			cat4Desc: 'Yon pwogram pèsonalize pou pastè, prèt, paran, lidè, politisyen, vandè, direktè antrepriz ak moun ki gen enfliyans ki vle pale avèk klète, otorite ak konviksyon.',
			faqTitle: 'Kesyon moun poze souvan',
			faqSubtitle: 'Repons senp pou kesyon moun poze pi souvan yo.',
			faqs: [
				{
					q: 'Kijan pou m jwenn aksè nan kou mwen yo apre peman an?',
					a: 'Depi peman an konfime (MonCash, NatCash oswa kat labank), aksè w la debloke tousuit nan espas etidyan ou an.'
				},
				{
					q: 'Èske fòmasyon yo disponib sou telefòn?',
					a: 'Wi, platfòm nou an adapte ak telefòn, tablèt ak òdinatè. Ou ka suiv kou w yo kote w ye a.'
				},
				{
					q: 'Èske m ka jwenn yon resi oswa yon fakti pou acha mwen?',
					a: 'Wi! Nan seksyon "Tranzaksyon mwen yo", ou ka telechaje yon resi PDF pou chak kòmann.'
				},
				{
					q: 'Kijan yon sesyon konsiltasyon endividyèl fèt?',
					a: 'Ou chwazi yon lè ki disponib nan kalandriye a. Lè rezèvasyon an konfime, ou resevwa yon lyen pou sesyon an sou entènèt.'
				}
			],
			ctaTitle: 'Ou pare pou devlope konpetans ou?',
			ctaDesc: 'Rejwenn lòt etidyan epi jwenn aksè nan fòmasyon DJR Akademi yo.',
			ctaJoin: 'Antre nan DJR Akademi',
			ctaContact: 'Kontakte nou'
		}
	};
	let t = $derived(i18n[currentLang]);

	let activeFaq = $state<number | null>(0);

	function toggleFaq(index: number) {
		activeFaq = activeFaq === index ? null : index;
	}

	const valueIcons = [Target, CreditCard, Users, Zap];
</script>

<svelte:head>
	<title>{t.pageTitle}</title>
	<meta name="description" content={t.metaDesc} />
</svelte:head>

<div class="min-h-screen bg-zinc-50 flex flex-col font-sans text-zinc-900 selection:bg-amber-400 selection:text-black">
	<PublicHeader />

	<main class="flex-1 space-y-16 sm:space-y-24 py-10 sm:py-16">
		
		<!-- Hero Section with Featured Image & Story -->
		<section class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
			<div class="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
				
				<!-- Left Text Column -->
				<div class="lg:col-span-7 space-y-6">
					<div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-700 text-xs font-bold uppercase tracking-wider">
						<Sparkles size={14} class="text-amber-500" />
						<span>{t.badge}</span>
					</div>

					<h1 class="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1] text-zinc-950">
						{t.heroTitle}
					</h1>

					<p class="text-zinc-600 text-sm sm:text-base lg:text-lg font-medium leading-relaxed">
						{t.heroDesc}
					</p>

					<div class="space-y-3 pt-2 text-xs sm:text-sm font-semibold text-zinc-700">
						<div class="flex items-center gap-3">
							<div class="size-5 rounded-full bg-emerald-500/15 text-emerald-600 grid place-items-center shrink-0">
								<Check size={12} />
							</div>
							<span>{t.check1}</span>
						</div>
						<div class="flex items-center gap-3">
							<div class="size-5 rounded-full bg-emerald-500/15 text-emerald-600 grid place-items-center shrink-0">
								<Check size={12} />
							</div>
							<span>{t.check2}</span>
						</div>
						<div class="flex items-center gap-3">
							<div class="size-5 rounded-full bg-emerald-500/15 text-emerald-600 grid place-items-center shrink-0">
								<Check size={12} />
							</div>
							<span>{t.check3}</span>
						</div>
					</div>

					<div class="flex flex-wrap items-center gap-4 pt-4">
						<a
							href={getHref('/catalogue')}
							class="inline-flex items-center gap-2 px-6 py-3.5 bg-zinc-950 text-white font-black text-xs sm:text-sm rounded-2xl hover:bg-zinc-800 shadow-xl transition-all active:scale-95"
						>
							<span>{t.exploreBtn}</span>
							<ArrowRight size={16} class="text-amber-400" />
						</a>
					</div>
				</div>

				<!-- Right Image Card Column -->
				<div class="lg:col-span-5 relative">
					<div class="relative rounded-3xl overflow-hidden shadow-2xl border border-zinc-200 group">
						<img
							src="/about-hero.jpg"
							alt="Etidyan DJR Akademi"
							class="w-full h-[400px] sm:h-[480px] object-cover group-hover:scale-105 transition-transform duration-700"
						/>
						<div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>

						<!-- Floating Glass Overlay Card -->
						<div class="absolute bottom-6 left-6 right-6 p-5 bg-white/90 backdrop-blur-md rounded-2xl border border-white/40 shadow-xl space-y-2">
							<div class="flex items-center gap-2">
								<span class="size-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
								<span class="text-[10px] font-black uppercase tracking-wider text-emerald-800">
									{t.learningTag}
								</span>
							</div>
							<p class="text-xs font-black text-zinc-950">
								{t.learningQuote}
							</p>
						</div>
					</div>
				</div>

			</div>
		</section>

		<!-- Key Statistics -->
		<section class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
			<div class="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
				{#each t.stats as stat}
					<div class="bg-white p-6 sm:p-8 rounded-3xl border border-zinc-200/80 shadow-xs text-center space-y-2 hover:border-zinc-300 transition-colors">
						<span class="block text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-zinc-950 font-mono">
							{stat.value}
						</span>
						<span class="block font-bold text-xs sm:text-sm text-zinc-900">
							{stat.label}
						</span>
						<span class="block text-[11px] text-zinc-500 font-medium">
							{stat.detail}
						</span>
					</div>
				{/each}
			</div>
		</section>

		<!-- Our Values / Pillars -->
		<section class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
			<div class="text-center max-w-2xl mx-auto space-y-3">
				<h2 class="text-2xl sm:text-4xl font-black tracking-tight text-zinc-950">
					{t.whyTitle}
				</h2>
				<p class="text-xs sm:text-sm text-zinc-600 font-medium leading-relaxed">
					{t.whyDesc}
				</p>
			</div>

			<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
				{#each t.values as val, idx}
					{@const IconComponent = valueIcons[idx] || Target}
					<div class="bg-white p-8 rounded-3xl border border-zinc-200/80 shadow-xs space-y-4 hover:shadow-md transition-all flex items-start gap-5">
						<div class="size-12 rounded-2xl bg-zinc-950 text-white grid place-items-center font-bold shadow-md shrink-0">
							<IconComponent size={24} />
						</div>
						<div class="space-y-1.5">
							<h3 class="font-black text-lg text-zinc-950">{val.title}</h3>
							<p class="text-xs sm:text-sm text-zinc-600 font-medium leading-relaxed">
								{val.description}
							</p>
						</div>
					</div>
				{/each}
			</div>
		</section>

		<!-- Founder Manifesto Section -->
		<section class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
			<div class="bg-zinc-950 text-white rounded-3xl p-8 sm:p-12 border border-zinc-800 shadow-2xl relative overflow-hidden space-y-8">
				<div class="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

				<div class="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800 pb-6">
					<div class="flex items-center gap-3">
						<div class="size-10 rounded-xl bg-amber-500/20 text-amber-400 grid place-items-center font-bold shrink-0">
							<Quote size={22} />
						</div>
						<div>
							<span class="text-xs font-black uppercase tracking-wider text-amber-400 block">{t.founderBadge}</span>
							<h2 class="text-lg sm:text-xl font-extrabold text-white">{t.founderName}</h2>
						</div>
					</div>
					<span class="px-3 py-1 rounded-full bg-white/10 text-white/70 text-xs font-bold border border-white/10">
						{t.founderRole}
					</span>
				</div>

				<div class="space-y-5 text-sm sm:text-base text-zinc-300 font-normal leading-relaxed">
					<p class="text-white font-semibold text-base sm:text-lg italic border-l-2 border-amber-400 pl-4 py-1">
						{t.manifestoQuote}
					</p>

					<p>
						{t.manifestoText1}
					</p>

					<div class="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-200 font-medium space-y-2.5">
						<p class="text-amber-400 font-bold text-sm sm:text-base">
							{t.manifestoHighlightTitle}
						</p>
						<p class="text-xs sm:text-sm text-zinc-300 leading-relaxed">
							{t.manifestoHighlightText}
						</p>
					</div>

					<p>
						{t.manifestoText2}
					</p>

					<p>
						{t.manifestoText3}
					</p>

					<p class="text-xs sm:text-sm text-zinc-400 border-t border-zinc-850 pt-4 font-medium">
						{t.manifestoNote}
					</p>
				</div>
			</div>
		</section>

		<!-- 4 Main Categories Section -->
		<section class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
			<div class="bg-zinc-100 rounded-3xl p-8 sm:p-12 border border-zinc-200/80 space-y-8">
				<div class="flex flex-col md:flex-row md:items-center justify-between gap-6">
					<div>
						<span class="text-xs font-black uppercase tracking-wider text-amber-600 block">{t.catHeaderBadge}</span>
						<h2 class="text-2xl sm:text-3xl font-black tracking-tight text-zinc-950 mt-1">
							{t.catHeaderTitle}
						</h2>
					</div>

					<a
						href={getHref('/catalogue')}
						class="inline-flex items-center gap-2 px-5 py-3 bg-zinc-950 text-white font-bold text-xs rounded-xl hover:bg-zinc-800 transition-colors self-start shadow-md"
					>
						<span>{t.catCatalogBtn}</span>
						<ArrowRight size={14} />
					</a>
				</div>

				<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
					<!-- Category 1: KOU -->
					<div class="bg-white p-7 rounded-2xl border border-zinc-200 shadow-xs space-y-4 hover:shadow-md transition-all">
						<div class="flex items-center gap-3">
							<div class="size-11 bg-amber-500/10 text-amber-600 rounded-xl grid place-items-center font-bold shrink-0">
								<BookOpen size={22} />
							</div>
							<div>
								<span class="text-[10px] font-black uppercase tracking-widest text-amber-600 block">{t.cat1Badge}</span>
								<h3 class="font-black text-xl text-zinc-950">{t.cat1Title}</h3>
							</div>
						</div>
						<p class="text-xs sm:text-sm text-zinc-600 leading-relaxed font-medium">
							{t.cat1Desc}
						</p>
					</div>

					<!-- Category 2: EBOOK -->
					<div class="bg-white p-7 rounded-2xl border border-zinc-200 shadow-xs space-y-4 hover:shadow-md transition-all">
						<div class="flex items-center gap-3">
							<div class="size-11 bg-emerald-500/10 text-emerald-600 rounded-xl grid place-items-center font-bold shrink-0">
								<GraduationCap size={22} />
							</div>
							<div>
								<span class="text-[10px] font-black uppercase tracking-widest text-emerald-600 block">{t.cat2Badge}</span>
								<h3 class="font-black text-xl text-zinc-950">{t.cat2Title}</h3>
							</div>
						</div>
						<p class="text-xs sm:text-sm text-zinc-600 leading-relaxed font-medium">
							{t.cat2Desc}
						</p>
					</div>

					<!-- Category 3: KONSILTASYON & SÈVIS -->
					<div class="bg-white p-7 rounded-2xl border border-zinc-200 shadow-xs space-y-4 hover:shadow-md transition-all md:col-span-2">
						<div class="flex items-center gap-3 border-b border-zinc-100 pb-4">
							<div class="size-11 bg-purple-500/10 text-purple-600 rounded-xl grid place-items-center font-bold shrink-0">
								<Wand2 size={22} />
							</div>
							<div>
								<span class="text-[10px] font-black uppercase tracking-widest text-purple-600 block">{t.cat3Badge}</span>
								<h3 class="font-black text-xl text-zinc-950">{t.cat3Title}</h3>
							</div>
						</div>

						<div class="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
							<!-- Konsiltasyon -->
							<div class="space-y-3">
								<h4 class="font-extrabold text-sm text-zinc-900 flex items-center gap-2">
									<Briefcase size={16} class="text-purple-600" />
									{t.cat3Sub1}
								</h4>
								<ul class="space-y-2 text-xs font-semibold text-zinc-700">
									{#each t.consultationsList as item}
										<li class="flex items-center gap-2">
											<span class="size-1.5 rounded-full bg-purple-500 shrink-0"></span>
											<span>{item}</span>
										</li>
									{/each}
								</ul>
							</div>

							<!-- Sèvis Pratik -->
							<div class="space-y-3 bg-purple-50/50 p-4 rounded-xl border border-purple-100">
								<h4 class="font-extrabold text-sm text-purple-900 flex items-center gap-2">
									<Sparkles size={16} class="text-purple-600" />
									{t.cat3Sub2}
								</h4>
								<ul class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-semibold text-zinc-800">
									{#each t.servicesList as serviceItem}
										<li class="flex items-center gap-2">
											<Check size={13} class="text-purple-600 shrink-0" />
											<span>{serviceItem}</span>
										</li>
									{/each}
								</ul>
							</div>
						</div>
					</div>

					<!-- Category 4: COACHING PRIVE -->
					<div class="bg-white p-7 rounded-2xl border border-zinc-200 shadow-xs space-y-4 hover:shadow-md transition-all md:col-span-2">
						<div class="flex items-center gap-3 border-b border-zinc-100 pb-4">
							<div class="size-11 bg-blue-500/10 text-blue-600 rounded-xl grid place-items-center font-bold shrink-0">
								<Users size={22} />
							</div>
							<div>
								<span class="text-[10px] font-black uppercase tracking-widest text-blue-600 block">{t.cat4Badge}</span>
								<h3 class="font-black text-xl text-zinc-950">{t.cat4Title}</h3>
							</div>
						</div>

						<p class="text-xs sm:text-sm text-zinc-700 leading-relaxed font-medium">
							{t.cat4Desc}
						</p>
					</div>
				</div>
			</div>
		</section>

		<!-- FAQ Section -->
		<section class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
			<div class="text-center space-y-2">
				<h2 class="text-2xl sm:text-3xl font-black tracking-tight text-zinc-950 flex items-center justify-center gap-2">
					<HelpCircle size={24} class="text-amber-500" />
					{t.faqTitle}
				</h2>
				<p class="text-xs sm:text-sm text-zinc-500 font-medium">
					{t.faqSubtitle}
				</p>
			</div>

			<div class="space-y-3">
				{#each t.faqs as faq, i}
					<div class="bg-white rounded-2xl border border-zinc-200/80 overflow-hidden shadow-2xs transition-colors">
						<button
							type="button"
							onclick={() => toggleFaq(i)}
							class="w-full p-5 text-left font-black text-sm text-zinc-950 flex items-center justify-between gap-4 hover:bg-zinc-50 transition-colors"
						>
							<span>{faq.q}</span>
							<ChevronDown size={18} class="text-zinc-400 shrink-0 transition-transform duration-200 {activeFaq === i ? 'rotate-180 text-zinc-950' : ''}" />
						</button>

						{#if activeFaq === i}
							<div class="px-5 pb-5 pt-1 text-xs text-zinc-600 font-medium leading-relaxed border-t border-zinc-100">
								{faq.a}
							</div>
						{/if}
					</div>
				{/each}
			</div>
		</section>

		<!-- Bottom CTA Banner -->
		<section class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
			<div class="bg-white text-zinc-950 rounded-3xl p-8 sm:p-12 text-center space-y-6 shadow-md border border-zinc-200/80">
				<div class="max-w-xl mx-auto space-y-3">
					<h2 class="text-2xl sm:text-4xl font-black tracking-tight text-zinc-950">
						{t.ctaTitle}
					</h2>
					<p class="text-xs sm:text-sm font-medium text-zinc-600 leading-relaxed">
						{t.ctaDesc}
					</p>
				</div>

				<div class="flex flex-wrap items-center justify-center gap-4">
					<a
						href={getHref('/catalogue')}
						class="px-6 py-3.5 bg-zinc-950 text-white font-black text-xs sm:text-sm rounded-2xl hover:bg-zinc-800 transition-all shadow-md active:scale-95"
					>
						{t.ctaJoin}
					</a>
					<a
						href={getHref('/contact')}
						class="px-6 py-3.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-900 font-bold text-xs sm:text-sm rounded-2xl border border-zinc-200 transition-all"
					>
						{t.ctaContact}
					</a>
				</div>
			</div>
		</section>

	</main>

	<PublicFooter />
</div>
