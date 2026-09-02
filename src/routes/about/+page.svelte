<script lang="ts">
	import PublicHeader from '$lib/components/PublicHeader.svelte';
	import PublicFooter from '$lib/components/PublicFooter.svelte';
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

	let activeFaq = $state<number | null>(0);

	const servicesList = [
		'Ekri script videyo',
		'Kreye plan kontni pou 30 jou',
		'Korije / òganize ebook',
		'Ekri ak korije memwa sòti inivèsite',
		'Konseptyalize ebook pou vann',
		'Kreye estrateji brand',
		'Prepare diskou, prezantasyon, oswa mesaj piblik',
		'Kreye prompt AI pou biznis ou ak kontni'
	];

	const consultationsList = [
		'Konsiltasyon Brand Pèsonèl',
		'Konsiltasyon Kreyasyon Kontni',
		'Konsiltasyon Biznis Dijital',
		'Konsiltasyon Ekriti Liv / Ebook',
		'Konsiltasyon Storytelling ak Kominikasyon',
		'Konsiltasyon Estrateji AI pou travay oswa biznis ou'
	];

	function toggleFaq(index: number) {
		activeFaq = activeFaq === index ? null : index;
	}

	const stats = [
		{ value: '480+', label: 'Etidyan ki pasyone', detail: 'Nan tout Ayiti ak nan dyaspora a' },
		{ value: '98%', label: 'Nivo satisfaksyon', detail: 'Avis pozitif ki verifye' },
		{ value: '24/7', label: 'Aksè san limit', detail: 'Aprann nan pwòp rythm ou' }
	];

	const values = [
		{
			icon: Target,
			color: 'from-amber-400 to-orange-500',
			title: 'Ekselans ak Pratik',
			description: 'Chak kou fèt pou w ka sèvi ak li menm kote a nan lavi reyèl la, san pèdi tan nan teyori ki pa itil.'
		},
		{
			icon: CreditCard,
			color: 'from-emerald-400 to-teal-600',
			title: 'Peman Lokal ki Fasil',
			description: 'Nou rann aprantisaj la fasil lè nou aksepte MonCash, Natcash ak kat bankè san okenn tèt chaje.'
		},
		{
			icon: Users,
			color: 'from-blue-400 to-indigo-600',
			title: 'Coaching ak Mentora 1:1',
			description: 'Jwenn yon swivi pèsonalize pou w debloke pwojè w yo epi rive nan objektif ou pi vit.'
		},
		{
			icon: Zap,
			color: 'from-purple-400 to-pink-600',
			title: 'Otonomi Finansyè',
			description: 'Misyon prensipal nou se ba chak etidyan konpetans solid pou yo reyisi nan mond dijital la.'
		}
	];

	const faqs = [
		{
			q: 'Kouman pou m jwenn aksè nan kou mwen yo apre peman an ?',
			a: 'Kominikou peman an konfime (MonCash, Natcash oswa Kat), aksè w la debloke menm kote a. Ou ap jwenn tout fòmasyon w yo nan espas etidyan ou an.'
		},
		{
			q: 'Èske fòmasyon yo disponib sou telefòn ?',
			a: 'Wi, 100% nan platfòm nou an fèt pou mache trè byen sou telefòn, tablèt ak konpitè. Ou ka swiv kou w yo nenpòt kote w ye.'
		},
		{
			q: 'Èske m ka jwenn yon resi oswa faktir pou achte m an ?',
			a: 'Absoliman ! Nan seksyon "Tranzaksyon Mwen Yo", ou ka telechaje ak enprime yon resi PDF ofisyèl pou chak kòmand ou fè.'
		},
		{
			q: 'Kouman yon sesyon Coaching 1:1 mache ?',
			a: 'Ou chwazi yon dat ak lè ki disponib nan kalandriye a. Lè l konfime, ou resevwa yon lyen dirèk pou sesyon an sou entènèt ak coach ou an.'
		}
	];
</script>

<svelte:head>
	<title>Konsènan DJR Akademi · DJR Akademi</title>
	<meta name="description" content="Dekouvri misyon DJR Akademi : Aprann sèvi ak IA pou w ka sispann razè. Kou, Ebook, Konsiltasyon ak Coaching Prive." />
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
						<span>Konsènan DJR Akademi</span>
					</div>

					<h1 class="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1] text-zinc-950">
						Aprann sèvi ak IA pou w ka sispann razè.
					</h1>

					<p class="text-zinc-600 text-sm sm:text-base lg:text-lg font-medium leading-relaxed">
						DJR Akademi se pou Ayisyen ki pa vle rete dèyè nan epòk AI a. Li fèt pou kreyatè kontni, antreprenè, elèv, pwofesyonèl, lidè, pastè, paran, vandè, politisyen ak tout moun ki vle aprann pale pi byen, kreye pi byen, vann pi byen, epi konstwi yon lavi ki gen plis opòtinite.
					</p>

					<div class="space-y-3 pt-2 text-xs sm:text-sm font-semibold text-zinc-700">
						<div class="flex items-center gap-3">
							<div class="size-5 rounded-full bg-emerald-500/15 text-emerald-600 grid place-items-center shrink-0">
								<Check size={12} />
							</div>
							<span>100% bati sou pratik ak fè lajan pou tout bon</span>
						</div>
						<div class="flex items-center gap-3">
							<div class="size-5 rounded-full bg-emerald-500/15 text-emerald-600 grid place-items-center shrink-0">
								<Check size={12} />
							</div>
							<span>Mwayen peman lokal ki fasil (MonCash &amp; Natcash)</span>
						</div>
						<div class="flex items-center gap-3">
							<div class="size-5 rounded-full bg-emerald-500/15 text-emerald-600 grid place-items-center shrink-0">
								<Check size={12} />
							</div>
							<span>Swivi pèsonalize ak yon kominote etidyan ki motivé</span>
						</div>
					</div>

					<div class="flex flex-wrap items-center gap-4 pt-4">
						<a
							href="/catalogue"
							class="inline-flex items-center gap-2 px-6 py-3.5 bg-zinc-950 text-white font-black text-xs sm:text-sm rounded-2xl hover:bg-zinc-800 shadow-xl transition-all active:scale-95"
						>
							<span>Eksplore fòmasyon nou yo</span>
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
									Aprantisaj Fasil ak Soupl
								</span>
							</div>
							<p class="text-xs font-black text-zinc-950">
								"Fòme w ak moun ki mèt nan domèn nan epi transfòme konesans ou an lajan."
							</p>
						</div>
					</div>
				</div>

			</div>
		</section>

		<!-- Key Statistics -->
		<section class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
			<div class="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
				{#each stats as stat}
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
					Poukisa pou w Chwazi DJR Akademi ?
				</h2>
				<p class="text-xs sm:text-sm text-zinc-600 font-medium leading-relaxed">
					Nou retire tout tèt chaje nan fason moun te konn aprann anvan pou n ba w yon ekspeyans ki fasil, rapid epi ki bay rezilta.
				</p>
			</div>

			<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
				{#each values as val}
					<div class="bg-white p-8 rounded-3xl border border-zinc-200/80 shadow-xs space-y-4 hover:shadow-md transition-all flex items-start gap-5">
						<div class="size-12 rounded-2xl bg-zinc-950 text-white grid place-items-center font-bold shadow-md shrink-0">
							<val.icon size={24} />
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
							<span class="text-xs font-black uppercase tracking-wider text-amber-400 block">Mesaj Fondatè a</span>
							<h2 class="text-lg sm:text-xl font-extrabold text-white">Jean Ronald Dumervil</h2>
						</div>
					</div>
					<span class="px-3 py-1 rounded-full bg-white/10 text-white/70 text-xs font-bold border border-white/10">
						Otè, Fòmatè & Kreyatè Kontni
					</span>
				</div>

				<div class="space-y-5 text-sm sm:text-base text-zinc-300 font-normal leading-relaxed">
					<p class="text-white font-semibold text-base sm:text-lg italic border-l-2 border-amber-400 pl-4 py-1">
						“Apre m fin ranmase plizyè milyon vyouz, gen prèske yon milyon moun kap swiv mwen, fè plizyè dizèn milye dola benefis sou entènèt la, mwen konkli ke: <span class="text-amber-400 font-bold">Mond lan gen ase richès pou tout moun jwenn epi viv byen.</span> Men sa pa anpeche gen yon gwoup moun kap viv nan richès ak yon lòt gwoup kap viv nan povrete.”
					</p>

					<p>
						Liy ki separe de gwoup moun sa yo rele <strong class="text-white font-bold">konesans</strong>. Se pou sa DJR Akademi fonde: pou elimine liy sa a, men tou kraze baryè povrete sa a nan lavi tout Ayisyen ki vle.
					</p>

					<div class="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-200 font-medium space-y-2.5">
						<p class="text-amber-400 font-bold text-sm sm:text-base">
							DJR Akademi se pou Ayisyen ki pa vle rete dèyè nan epòk AI a.
						</p>
						<p class="text-xs sm:text-sm text-zinc-300 leading-relaxed">
							Li fèt pou kreyatè kontni, antreprenè, elèv, pwofesyonèl, lidè, pastè, paran, vandè, politisyen ak tout moun ki vle aprann pale pi byen, kreye pi byen, vann pi byen, epi konstwi yon lavi ki gen plis opòtinite.
						</p>
					</div>

					<p>
						Anpil moun gen kapasite, men yo pa gen direksyon. Yo pa konn kijan pou yo kreye kontni, kijan pou yo bati yon mak, kijan pou yo pale pou enfliyanse, ni kijan pou yo itilize sa yo deja konnen pou fè lajan.
					</p>

					<p>
						Sou DJR Akademi, gen kou, ebook, konsiltasyon, coaching prive, ak sèvis pratik ki ede w aprann vit, aplike fasil, epi avanse ak plis konfyans.
					</p>

					<p class="text-xs sm:text-sm text-zinc-400 border-t border-zinc-850 pt-4 font-medium">
						DJR Akademi pa sèlman baze sou teyori. Se eksperyans Jean Ronald Dumervil kòm otè, fòmatè, kreyatè kontni, oratè, ak moun ki ap travay chak jou pou ede Ayisyen devlope konpetans yo, itilize teknoloji, epi pa rete viktim povrete, mank opòtinite, ak mank direksyon.
					</p>
				</div>
			</div>
		</section>

		<!-- 4 Main Categories Section -->
		<section class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
			<div class="bg-zinc-100 rounded-3xl p-8 sm:p-12 border border-zinc-200/80 space-y-8">
				<div class="flex flex-col md:flex-row md:items-center justify-between gap-6">
					<div>
						<span class="text-xs font-black uppercase tracking-wider text-amber-600 block">Kategori &amp; Sèvis</span>
						<h2 class="text-2xl sm:text-3xl font-black tracking-tight text-zinc-950 mt-1">
							4 Gwo Kategori Sèvis DJR Akademi
						</h2>
					</div>

					<a
						href="/catalogue"
						class="inline-flex items-center gap-2 px-5 py-3 bg-zinc-950 text-white font-bold text-xs rounded-xl hover:bg-zinc-800 transition-colors self-start shadow-md"
					>
						<span>Eksplore katalòg la</span>
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
								<span class="text-[10px] font-black uppercase tracking-widest text-amber-600 block">Kategori 1</span>
								<h3 class="font-black text-xl text-zinc-950">KOU (Fòmasyon Videyo)</h3>
							</div>
						</div>
						<p class="text-xs sm:text-sm text-zinc-600 leading-relaxed font-medium">
							Fòmasyon videyo konplè ki bati pa modil pou w ka mèt sou AI, kreyasyon kontni, pale an piblik ak biznis dijital nan pwòp rit ou.
						</p>
					</div>

					<!-- Category 2: EBOOK -->
					<div class="bg-white p-7 rounded-2xl border border-zinc-200 shadow-xs space-y-4 hover:shadow-md transition-all">
						<div class="flex items-center gap-3">
							<div class="size-11 bg-emerald-500/10 text-emerald-600 rounded-xl grid place-items-center font-bold shrink-0">
								<GraduationCap size={22} />
							</div>
							<div>
								<span class="text-[10px] font-black uppercase tracking-widest text-emerald-600 block">Kategori 2</span>
								<h3 class="font-black text-xl text-zinc-950">EBOOK (Liv Dijital PDF)</h3>
							</div>
						</div>
						<p class="text-xs sm:text-sm text-zinc-600 leading-relaxed font-medium">
							Gid PDF ki klè, pratik ak konsèy dirèk, ou ka telechaje ak aksepte menm kote a sou telefòn ou oswa konpitè w pou avanse rapid.
						</p>
					</div>

					<!-- Category 3: KONSILTASYON & SÈVIS -->
					<div class="bg-white p-7 rounded-2xl border border-zinc-200 shadow-xs space-y-4 hover:shadow-md transition-all md:col-span-2">
						<div class="flex items-center gap-3 border-b border-zinc-100 pb-4">
							<div class="size-11 bg-purple-500/10 text-purple-600 rounded-xl grid place-items-center font-bold shrink-0">
								<Wand2 size={22} />
							</div>
							<div>
								<span class="text-[10px] font-black uppercase tracking-widest text-purple-600 block">Kategori 3</span>
								<h3 class="font-black text-xl text-zinc-950">KONSILTASYON AK SÈVIS PRATIK</h3>
							</div>
						</div>

						<div class="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
							<!-- Konsiltasyon -->
							<div class="space-y-3">
								<h4 class="font-extrabold text-sm text-zinc-900 flex items-center gap-2">
									<Briefcase size={16} class="text-purple-600" />
									Konsiltasyon Pèsonalize :
								</h4>
								<ul class="space-y-2 text-xs font-semibold text-zinc-700">
									{#each consultationsList as item}
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
									Sèvis Nou Ede W Realize :
								</h4>
								<ul class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-semibold text-zinc-800">
									{#each servicesList as serviceItem}
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
								<span class="text-[10px] font-black uppercase tracking-widest text-blue-600 block">Kategori 4</span>
								<h3 class="font-black text-xl text-zinc-950">COACHING PRIVE (1-ak-1)</h3>
							</div>
						</div>

						<p class="text-xs sm:text-sm text-zinc-700 leading-relaxed font-medium">
							Yon pwogram pèsonalize pou <strong class="text-zinc-950">pastè, pè, paran, lidè, politisyen, vandè, CEO ak enfliyansè</strong> ki vle aprann pale ak plis klète, otorite, emosyon ak konviksyon, pou yo ka enfliyanse, konvenk, dirije epi touche moun yo ap adrese yo.
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
					Kesyon Moun Poze Souvan (FAQ)
				</h2>
				<p class="text-xs sm:text-sm text-zinc-500 font-medium">
					Repons ki senp pou kesyon moun plis poze yo.
				</p>
			</div>

			<div class="space-y-3">
				{#each faqs as faq, i}
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
						Ou pare pou w moute nivo konpetans ou ?
					</h2>
					<p class="text-xs sm:text-sm font-medium text-zinc-600 leading-relaxed">
						Antre ansanm ak plizyè milye etidyan epi jwenn aksè dirèkteman nan pi bon fòmasyon nan peyi Ayiti.
					</p>
				</div>

				<div class="flex flex-wrap items-center justify-center gap-4">
					<a
						href="/catalogue"
						class="px-6 py-3.5 bg-zinc-950 text-white font-black text-xs sm:text-sm rounded-2xl hover:bg-zinc-800 transition-all shadow-md active:scale-95"
					>
						Antre nan DJR Akademi
					</a>
					<a
						href="/contact"
						class="px-6 py-3.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-900 font-bold text-xs sm:text-sm rounded-2xl border border-zinc-200 transition-all"
					>
						Kontakte nou
					</a>
				</div>
			</div>
		</section>

	</main>

	<PublicFooter />
</div>
