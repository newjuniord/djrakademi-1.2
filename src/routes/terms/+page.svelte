<script lang="ts">
	import PublicHeader from '$lib/components/PublicHeader.svelte';
	import PublicFooter from '$lib/components/PublicFooter.svelte';
	import { Shield, FileText, CheckCircle2, AlertTriangle, Scale } from 'lucide-svelte';
</script>

<svelte:head>
	<title>Kondisyon Sèvis ak Itilizasyon | DJR Akademi</title>
	<meta name="description" content="Kondisyon jeneral d'itilizasyon ak sèvis nan platfòm aprantisaj DJR Akademi." />
</svelte:head>

<div class="min-h-screen bg-zinc-950 text-white flex flex-col font-sans">
	<PublicHeader />

	<main class="flex-1 py-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full space-y-12">
		<!-- Header Section -->
		<div class="text-center space-y-4">
			<div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold">
				<Scale size={14} />
				<span>Dokiman Legal</span>
			</div>
			<h1 class="text-3xl sm:text-4xl font-black text-white uppercase tracking-tight">
				Kondisyon Sèvis ak Itilizasyon
			</h1>
			<p class="text-zinc-400 text-sm max-w-xl mx-auto leading-relaxed">
				Tanpri li kondisyon sa yo avèk atansyon anvan ou sèvi ak platfòm DJR Akademi an.
			</p>
			<p class="text-xs text-zinc-500 font-mono">Dènye maj : 8 Sèptanm 2026</p>
		</div>

		<!-- Main Legal Content -->
		<div class="space-y-8 text-sm text-zinc-300 leading-relaxed bg-zinc-900/60 p-6 sm:p-10 rounded-3xl border border-zinc-800">
			<!-- Section 1 -->
			<section class="space-y-3">
				<div class="flex items-center gap-2.5 text-amber-400 font-bold text-base">
					<FileText size={18} />
					<h2>1. Akseptasyon Kondisyon Yo</h2>
				</div>
				<p class="text-zinc-400">
					Lè ou kreye yon kont, achte yon fòmasyon, yon ebook, oubyen ou rezève yon sèvis coaching sou DJR Akademi, ou rekonèt ke ou li, konprann ak aksepte tout kondisyon jeneral d'itilizasyon sa yo san okenn rezèv.
				</p>
			</section>

			<hr class="border-zinc-800" />

			<!-- Section 2 -->
			<section class="space-y-3">
				<div class="flex items-center gap-2.5 text-amber-400 font-bold text-base">
					<Shield size={18} />
					<h2>2. Aksè ak Kont Itilizatè</h2>
				</div>
				<p class="text-zinc-400">
					Chak kont kreye sou DJR Akademi se pou yon sèl itilizatè endividyèl. Ou responsab pou kenbe mo de pas ou an sekirite. Pataje yon kont oubyen revann aksè ak kont ou bay lòt moun se yon vyolasyon ki ka mennen nan suspansyon kont lan san ranbousman.
				</p>
			</section>

			<hr class="border-zinc-800" />

			<!-- Section 3 -->
			<section class="space-y-3">
				<div class="flex items-center gap-2.5 text-amber-400 font-bold text-base">
					<CheckCircle2 size={18} />
					<h2>3. Peman ak Validasyon</h2>
				</div>
				<p class="text-zinc-400">
					DJR Akademi aksepte peman pa MonCash, NatCash, ansanm ak kat bankè (Visa, MasterCard ak lòt kat ak Lemon Squeezy). Peman yo fèt an Gourdes (HTG) oubyen Dola Ameriken (USD). Aksè ak pwodui dijital yo (kou ak ebook) oswa konfimasyon coaching an debloke otomatikman sou kont ou lè tranzaksyon an valide.
				</p>
			</section>

			<hr class="border-zinc-800" />

			<!-- Section 4 -->
			<section class="space-y-3">
				<div class="flex items-center gap-2.5 text-amber-400 font-bold text-base">
					<AlertTriangle size={18} />
					<h2>4. Politik Ranbousman ak Annilasyon</h2>
				</div>
				<ul class="list-disc pl-5 space-y-2 text-zinc-400">
					<li><strong>Pwodui dijital (Kou & Ebooks) :</strong> Akòz nati dijital imedyat kontni an, achte fòmasyon ak ebook yo se peman final san ranbousman apre aksè an fin debloke.</li>
					<li><strong>Sesyon Coaching :</strong> Si ou bezwen ranvwaye yon sesyon coaching, tanpri kontakte nou omwen 24 èdtan anvan lè konfime an. Yon rezèvasyon ki an atant peman ap ekspire otomatikman si peman an pa fèt nan tan limite an.</li>
				</ul>
			</section>

			<hr class="border-zinc-800" />

			<!-- Section 5 -->
			<section class="space-y-3">
				<div class="flex items-center gap-2.5 text-amber-400 font-bold text-base">
					<Scale size={18} />
					<h2>5. Pwopriyete Entèlektyèl</h2>
				</div>
				<p class="text-zinc-400">
					Tout videyo, tèks, ebook, materyèl ak kontni ki sou DJR Akademi se pwopriyete eksklizif DJR Akademi. Li entèdi pou kopye, redistribiye, anrejistre pou revann oubyen pibliye okenn kontni san otorizasyon ekri anvan.
				</p>
			</section>

			<hr class="border-zinc-800" />

			<!-- Section 6 -->
			<section class="space-y-3">
				<div class="flex items-center gap-2.5 text-amber-400 font-bold text-base">
					<Shield size={18} />
					<h2>6. Konfidentialite ak Cookies</h2>
				</div>
				<p class="text-zinc-400">
					DJR Akademi pa sèvi ak okenn cookies piblisitè oubyen cookies pou swiv (tracking). Sèl cookies ki itilize se cookies teknik ki nesesè pou kenbe ou konekte nan kont ou an sekirite.
				</p>
			</section>
		</div>
	</main>

	<PublicFooter />
</div>
