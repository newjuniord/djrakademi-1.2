<script lang="ts">
	import { onMount } from 'svelte';
	import PublicHeader from '$lib/components/PublicHeader.svelte';
	import PublicFooter from '$lib/components/PublicFooter.svelte';
	import BundleCard from '$lib/components/BundleCard.svelte';
	import { getPublishedBundles, type Bundle } from '$lib/services/bundles';
	import { getPublishedCourses } from '$lib/services/courses';
	import { getPublishedEbooks } from '$lib/services/ebooks';
	import { getActiveCoachingServices } from '$lib/services/coaching';
	import type { Course, Ebook } from '$lib/types/admin';
	import type { CoachingService } from '$lib/types/coaching';
	import { formatPublicPrice } from '$lib/utils/public-price';
	import {
		BookOpen,
		FileText,
		CalendarCheck,
		Search,
		Play,
		Download,
		Users,
		ArrowRight,
		ChevronDown,
		ChevronUp,
	} from 'lucide-svelte';

	let searchQuery = $state('');

	// Pagination limits for sections (10 items max by default)
	let coursesLimit = $state(10);
	let ebooksLimit = $state(10);
	let coachingLimit = $state(10);

	// All published items
	let publishedCourses = $state<Course[]>([]);
	let publishedEbooks = $state<Ebook[]>([]);
	let activeCoaching = $state<CoachingService[]>([]);
	let publishedBundles = $state<Bundle[]>([]);

	onMount(async () => {
		const [courses, ebooks, coaching] = await Promise.all([
			getPublishedCourses(),
			getPublishedEbooks(),
			getActiveCoachingServices()
		]);
		publishedCourses = courses;
		publishedEbooks = ebooks;
		activeCoaching = coaching;
		getPublishedBundles().then((bundles) => publishedBundles = bundles).catch(() => undefined);
	});

	// Search filter
	const filteredCourses = $derived(
		publishedCourses.filter(
			(c) =>
				c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
				c.description.toLowerCase().includes(searchQuery.toLowerCase())
		)
	);

	const filteredEbooks = $derived(
		publishedEbooks.filter(
			(e) =>
				e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
				e.description.toLowerCase().includes(searchQuery.toLowerCase())
		)
	);

	const filteredBundles = $derived(publishedBundles.filter((b) => b.title.toLowerCase().includes(searchQuery.toLowerCase()) || b.description.toLowerCase().includes(searchQuery.toLowerCase()) || b.items.some((item) => item.title.toLowerCase().includes(searchQuery.toLowerCase()))));

	const filteredCoaching = $derived(
		activeCoaching.filter(
			(s) =>
				s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
				s.description.toLowerCase().includes(searchQuery.toLowerCase())
		)
	);

	// Displayed sliced items (max 10 or all if expanded)
	const displayedCourses = $derived(filteredCourses.slice(0, coursesLimit));
	const displayedEbooks = $derived(filteredEbooks.slice(0, ebooksLimit));
	const displayedCoaching = $derived(filteredCoaching.slice(0, coachingLimit));


	const totalFiltered = $derived(
		filteredCourses.length + filteredEbooks.length + filteredBundles.length + filteredCoaching.length
	);
</script>

<svelte:head>
	<title>Catalogue complet · DJR Akademi</title>
	<meta
		name="description"
		content="Explorez toutes nos formations vidéo, nos ebooks PDF et nos offres de coaching individuel sur DJR Akademi."
	/>
</svelte:head>

<div class="catalogue-page">
	<PublicHeader />

	<main class="catalogue-main">
		<section class="catalogue-hero" aria-labelledby="catalogue-title">
			<div class="catalogue-shell catalogue-hero-inner">
				<div class="catalogue-intro">
					<span class="catalogue-eyebrow">DJR Akademi · Katalòg</span>
					<h1 id="catalogue-title">Chwazi resous ki ka fè w avanse.</h1>
					<p>Fòmasyon videyo, gid PDF, bundles ak coaching—tout òganize pou w jwenn sa w bezwen fasil.</p>
				</div>

				<label class="catalogue-search" for="catalogue-search">
					<Search size={20} aria-hidden="true" />
					<input id="catalogue-search" type="search" bind:value={searchQuery} placeholder="Chèche yon fòmasyon, ebook oswa sèvis..." />
					<span>{totalFiltered} rezilta</span>
				</label>

				<nav class="catalogue-nav" aria-label="Kategori katalòg">
					<a href="#sec-courses">Fòmasyon <span>{filteredCourses.length}</span></a>
					<a href="#sec-ebooks">Ebooks <span>{filteredEbooks.length}</span></a>
					<a href="#sec-bundles">Bundles <span>{filteredBundles.length}</span></a>
					<a href="#sec-coaching">Coaching <span>{filteredCoaching.length}</span></a>
				</nav>
			</div>
		</section>

		<div class="catalogue-shell catalogue-content">
			{#if totalFiltered === 0}
				<div class="catalogue-empty">
					<span><Search size={26} /></span>
					<h2>Pa gen rezilta pou “{searchQuery}”</h2>
					<p>Eseye yon lòt mo pou jwenn sa w ap chèche a.</p>
					<button type="button" onclick={() => (searchQuery = '')}>Efase rechèch la</button>
				</div>
			{/if}

			{#if filteredCourses.length > 0}
				<section id="sec-courses" class="catalogue-section">
					<div class="section-heading">
						<div class="section-heading-copy">
							<span class="section-icon"><BookOpen size={17} /></span>
							<div><span>01 · Aprann ak videyo</span><h2>Fòmasyon videyo</h2><p>Pwogram byen estriktire ou ka suiv nan ritm pa w.</p></div>
						</div>
						<span class="section-count">{displayedCourses.length} / {filteredCourses.length}</span>
					</div>

					<div class="catalogue-grid course-grid">
						{#each displayedCourses as course (course.id)}
							<a href="/cours/{course.id}" class="catalogue-card course-card">
								<div class="card-media course-media">
									{#if course.cover}<img src={course.cover} alt={course.title} loading="lazy" />{:else}<div class="media-placeholder"><BookOpen size={30} /></div>{/if}
									<span class="media-type">Videyo</span>
								</div>
								<div class="card-body">
									<h3>{course.title}</h3>
									<p>{course.description}</p>
									<div class="card-footer"><strong>{course.isFree || course.price === 0 ? 'Gratis' : formatPublicPrice(course.price, course.priceUsd)}</strong><span>Gade kou a <ArrowRight size={14} /></span></div>
								</div>
							</a>
						{/each}
					</div>

					{#if filteredCourses.length > 10}
						<div class="section-more">
							<button type="button" onclick={() => (coursesLimit = coursesLimit === 10 ? filteredCourses.length : 10)}>
								{coursesLimit === 10 ? `Gade ${filteredCourses.length - 10} lòt fòmasyon` : 'Gade mwens'}
								{#if coursesLimit === 10}<ChevronDown size={16} />{:else}<ChevronUp size={16} />{/if}
							</button>
						</div>
					{/if}
				</section>
			{/if}

			{#if filteredEbooks.length > 0}
				<section id="sec-ebooks" class="catalogue-section">
					<div class="section-heading">
						<div class="section-heading-copy">
							<span class="section-icon"><FileText size={17} /></span>
							<div><span>02 · Li epi aplike</span><h2>Ebook ak gid PDF</h2><p>Resous pratik pou w konsève epi konsilte nenpòt ki lè.</p></div>
						</div>
						<span class="section-count">{displayedEbooks.length} / {filteredEbooks.length}</span>
					</div>

					<div class="catalogue-grid ebook-grid">
						{#each displayedEbooks as ebook (ebook.id)}
							<a href="/ebooks/{ebook.id}" class="catalogue-card ebook-card">
								<div class="card-media ebook-media">
									{#if ebook.cover}<img src={ebook.cover} alt={ebook.title} loading="lazy" />{:else}<div class="media-placeholder"><FileText size={30} /></div>{/if}
									<span class="media-type">PDF</span>
								</div>
								<div class="card-body">
									<h3>{ebook.title}</h3>
									<div class="card-footer"><strong>{ebook.isFree || ebook.price === 0 ? 'Gratis' : formatPublicPrice(ebook.price, ebook.priceUsd)}</strong><span>Li gid la <ArrowRight size={14} /></span></div>
								</div>
							</a>
						{/each}
					</div>

					{#if filteredEbooks.length > 10}
						<div class="section-more"><button type="button" onclick={() => (ebooksLimit = ebooksLimit === 10 ? filteredEbooks.length : 10)}>{ebooksLimit === 10 ? `Gade ${filteredEbooks.length - 10} lòt ebook` : 'Gade mwens'}{#if ebooksLimit === 10}<ChevronDown size={16} />{:else}<ChevronUp size={16} />{/if}</button></div>
					{/if}
				</section>
			{/if}

			{#if filteredBundles.length > 0}
				<section id="sec-bundles" class="catalogue-section">
					<div class="section-heading">
						<div class="section-heading-copy"><span class="section-icon"><Download size={17} /></span><div><span>03 · Plis valè</span><h2>Bundles espesyal</h2><p>Plizyè resous ansanm nan yon sèl acha.</p></div></div>
						<a href="/bundles" class="section-link">Tout bundles yo <ArrowRight size={15} /></a>
					</div>
					<div class="catalogue-grid bundle-grid">{#each filteredBundles as bundle (bundle.id)}<BundleCard {bundle} />{/each}</div>
				</section>
			{/if}

			{#if filteredCoaching.length > 0}
				<section id="sec-coaching" class="catalogue-section">
					<div class="section-heading">
						<div class="section-heading-copy"><span class="section-icon"><CalendarCheck size={17} /></span><div><span>04 · Akonpayman</span><h2>Coaching 1:1</h2><p>Yon espas pèsonèl pou jwenn direksyon ak repons klè.</p></div></div>
						<span class="section-count">{displayedCoaching.length} / {filteredCoaching.length}</span>
					</div>

					<div class="catalogue-grid coaching-grid">
						{#each displayedCoaching as coaching (coaching.id)}
							<a href="/coaching/{coaching.slug}" class="coaching-card">
								<div class="coaching-card-top"><span><CalendarCheck size={20} /></span><small>{coaching.durationMinutes} min</small></div>
								<h3>{coaching.title}</h3><p>{coaching.description}</p>
								<div class="coaching-card-footer"><strong>{coaching.isFree ? 'Gratis' : formatPublicPrice(coaching.price, coaching.priceUsd)}</strong><span><ArrowRight size={17} /></span></div>
							</a>
						{/each}
					</div>

					{#if filteredCoaching.length > 10}
						<div class="section-more"><button type="button" onclick={() => (coachingLimit = coachingLimit === 10 ? filteredCoaching.length : 10)}>{coachingLimit === 10 ? `Gade ${filteredCoaching.length - 10} lòt sèvis` : 'Gade mwens'}{#if coachingLimit === 10}<ChevronDown size={16} />{:else}<ChevronUp size={16} />{/if}</button></div>
					{/if}
				</section>
			{/if}
		</div>
	</main>

	<PublicFooter />
</div>


<style>
	.catalogue-page {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
		background: #f7f4ee;
		color: #171713;
		font-family: ui-sans-serif, system-ui, sans-serif;
	}

	.catalogue-main { flex: 1; }

	.catalogue-shell {
		width: min(1280px, calc(100% - 48px));
		margin: 0 auto;
	}

	.catalogue-hero {
		position: relative;
		overflow: hidden;
		border-top: 1px solid rgba(255, 255, 255, 0.08);
		background:
			radial-gradient(circle at 78% 18%, rgba(226, 169, 54, 0.16), transparent 30%),
			#11110f;
		color: #f8f4ed;
	}

	.catalogue-hero-inner { padding-top: 76px; }

	.catalogue-intro { max-width: 760px; }

	.catalogue-eyebrow {
		display: block;
		margin-bottom: 14px;
		color: #e1ac3b;
		font-size: 12px;
		font-weight: 800;
		letter-spacing: 0.18em;
		text-transform: uppercase;
	}

	.catalogue-intro h1 {
		margin: 0;
		font-family: Georgia, 'Times New Roman', serif;
		font-size: clamp(44px, 6vw, 76px);
		font-weight: 700;
		letter-spacing: -0.048em;
		line-height: 0.98;
	}

	.catalogue-intro p {
		max-width: 650px;
		margin: 22px 0 0;
		color: rgba(248, 244, 237, 0.62);
		font-size: 16px;
		line-height: 1.65;
	}

	.catalogue-search {
		display: grid;
		min-height: 62px;
		align-items: center;
		grid-template-columns: auto minmax(0, 1fr) auto;
		gap: 14px;
		max-width: 820px;
		margin-top: 38px;
		padding: 0 20px;
		border: 1px solid rgba(255, 255, 255, 0.2);
		background: rgba(0, 0, 0, 0.28);
		color: rgba(255, 255, 255, 0.58);
		transition: border-color 180ms ease, background-color 180ms ease;
	}

	.catalogue-search:focus-within {
		border-color: #e1ac3b;
		background: rgba(0, 0, 0, 0.42);
	}

	.catalogue-search input {
		width: 100%;
		border: 0;
		outline: 0;
		background: transparent;
		color: #fff;
		font-size: 15px;
	}

	.catalogue-search input::placeholder { color: rgba(255, 255, 255, 0.4); }

	.catalogue-search > span {
		padding-left: 16px;
		border-left: 1px solid rgba(255, 255, 255, 0.16);
		color: #e8c36e;
		font-size: 12px;
		font-weight: 800;
		white-space: nowrap;
	}

	.catalogue-nav {
		display: flex;
		gap: 2px;
		margin-top: 58px;
		overflow-x: auto;
		scrollbar-width: none;
	}

	.catalogue-nav::-webkit-scrollbar { display: none; }

	.catalogue-nav a {
		display: inline-flex;
		min-height: 54px;
		align-items: center;
		gap: 10px;
		padding: 0 22px;
		border: 1px solid rgba(255, 255, 255, 0.12);
		border-bottom: 0;
		color: rgba(255, 255, 255, 0.7);
		font-size: 13px;
		font-weight: 750;
		white-space: nowrap;
		transition: color 180ms ease, background-color 180ms ease;
	}

	.catalogue-nav a:hover {
		background: rgba(255, 255, 255, 0.07);
		color: #fff;
	}

	.catalogue-nav a span {
		display: grid;
		min-width: 24px;
		height: 24px;
		place-items: center;
		border-radius: 999px;
		background: rgba(225, 172, 59, 0.14);
		color: #e8c36e;
		font-size: 10px;
	}

	.catalogue-content { padding: 86px 0 100px; }

	.catalogue-section {
		scroll-margin-top: 112px;
	}

	.catalogue-section + .catalogue-section {
		margin-top: 96px;
		padding-top: 96px;
		border-top: 1px solid #dcd5ca;
	}

	.section-heading {
		display: flex;
		align-items: flex-end;
		justify-content: space-between;
		gap: 28px;
		margin-bottom: 32px;
	}

	.section-heading-copy {
		display: flex;
		align-items: flex-start;
		gap: 16px;
	}

	.section-icon {
		display: grid;
		width: 42px;
		height: 42px;
		flex: 0 0 auto;
		place-items: center;
		background: #171713;
		color: #e2ad3c;
	}

	.section-heading-copy > div > span {
		display: block;
		margin-bottom: 6px;
		color: #a16b17;
		font-size: 11px;
		font-weight: 850;
		letter-spacing: 0.13em;
		text-transform: uppercase;
	}

	.section-heading h2 {
		margin: 0;
		font-family: Georgia, 'Times New Roman', serif;
		font-size: clamp(30px, 3vw, 42px);
		letter-spacing: -0.035em;
		line-height: 1.05;
	}

	.section-heading p {
		margin: 9px 0 0;
		color: #736d64;
		font-size: 14px;
		line-height: 1.5;
	}

	.section-count {
		flex: 0 0 auto;
		padding: 8px 12px;
		border: 1px solid #d9d1c5;
		color: #6f685e;
		font-size: 11px;
		font-weight: 800;
	}

	.section-link {
		display: inline-flex;
		align-items: center;
		gap: 7px;
		color: #171713;
		font-size: 12px;
		font-weight: 850;
	}

	.catalogue-grid { display: grid; gap: 24px; }
	.course-grid, .bundle-grid, .coaching-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
	.ebook-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); }

	.catalogue-card {
		display: flex;
		min-width: 0;
		flex-direction: column;
		border: 1px solid #ddd6cb;
		background: #fff;
		color: #171713;
		transition: border-color 250ms ease, box-shadow 250ms ease, transform 250ms ease;
	}

	.catalogue-card:hover {
		border-color: #b8aa96;
		box-shadow: 0 18px 45px rgba(38, 29, 16, 0.1);
		transform: translateY(-4px);
	}

	.card-media {
		position: relative;
		overflow: hidden;
		background: #ebe7df;
	}

	.course-media { aspect-ratio: 16 / 10; }
	.ebook-media { aspect-ratio: 3 / 4; }

	.card-media img {
		display: block;
		width: 100%;
		height: 100%;
		object-fit: cover;
		transition: transform 700ms cubic-bezier(0.22, 1, 0.36, 1);
	}

	.catalogue-card:hover .card-media img { transform: scale(1.055); }

	.media-placeholder {
		display: grid;
		height: 100%;
		place-items: center;
		background: linear-gradient(135deg, #e9e3d9, #d8cdbd);
		color: #948775;
	}

	.media-type {
		position: absolute;
		top: 12px;
		right: 12px;
		padding: 6px 9px;
		background: rgba(14, 14, 12, 0.86);
		color: #fff;
		font-size: 9px;
		font-weight: 850;
		letter-spacing: 0.12em;
		text-transform: uppercase;
	}

	.card-body {
		display: flex;
		min-height: 178px;
		padding: 22px;
		flex: 1;
		flex-direction: column;
	}

	.ebook-card .card-body { min-height: 116px; padding: 18px; }

	.card-body h3 {
		margin: 0;
		font-size: 16px;
		font-weight: 800;
		line-height: 1.35;
	}

	.card-body > p {
		display: -webkit-box;
		overflow: hidden;
		margin: 10px 0 20px;
		color: #777066;
		font-size: 12px;
		line-height: 1.65;
		-webkit-box-orient: vertical;
		-webkit-line-clamp: 2;
	}

	.card-footer {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		margin-top: auto;
		padding-top: 15px;
		border-top: 1px solid #eee9e1;
	}

	.card-footer strong {
		color: #a86f17;
		font-size: 13px;
		font-weight: 850;
	}

	.card-footer span {
		display: inline-flex;
		align-items: center;
		gap: 5px;
		color: #292823;
		font-size: 11px;
		font-weight: 800;
	}

	.coaching-card {
		display: flex;
		min-height: 280px;
		padding: 26px;
		flex-direction: column;
		border: 1px solid #dcd4c8;
		background: #fff;
		color: #171713;
		transition: border-color 250ms ease, transform 250ms ease, box-shadow 250ms ease;
	}

	.coaching-card:hover {
		border-color: #b9aa93;
		box-shadow: 0 18px 45px rgba(38, 29, 16, 0.09);
		transform: translateY(-4px);
	}

	.coaching-card-top, .coaching-card-footer {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.coaching-card-top > span {
		display: grid;
		width: 44px;
		height: 44px;
		place-items: center;
		background: #171713;
		color: #e2ad3c;
	}

	.coaching-card-top small {
		color: #837a6e;
		font-size: 11px;
		font-weight: 800;
	}

	.coaching-card h3 {
		margin: 28px 0 0;
		font-family: Georgia, 'Times New Roman', serif;
		font-size: 24px;
		line-height: 1.15;
	}

	.coaching-card > p {
		display: -webkit-box;
		overflow: hidden;
		margin: 12px 0 24px;
		color: #746e65;
		font-size: 13px;
		line-height: 1.65;
		-webkit-box-orient: vertical;
		-webkit-line-clamp: 3;
	}

	.coaching-card-footer {
		margin-top: auto;
		padding-top: 18px;
		border-top: 1px solid #ece6dd;
	}

	.coaching-card-footer strong { color: #a86f17; font-size: 15px; }

	.coaching-card-footer span {
		display: grid;
		width: 36px;
		height: 36px;
		place-items: center;
		border: 1px solid #d8d0c4;
		transition: background-color 180ms ease, color 180ms ease;
	}

	.coaching-card:hover .coaching-card-footer span { background: #171713; color: #fff; }

	.section-more {
		display: flex;
		justify-content: center;
		margin-top: 34px;
	}

	.section-more button, .catalogue-empty button {
		display: inline-flex;
		min-height: 46px;
		align-items: center;
		justify-content: center;
		gap: 9px;
		padding: 0 20px;
		border: 1px solid #171713;
		background: transparent;
		color: #171713;
		font-size: 12px;
		font-weight: 850;
		cursor: pointer;
		transition: background-color 180ms ease, color 180ms ease;
	}

	.section-more button:hover, .catalogue-empty button:hover { background: #171713; color: #fff; }

	.catalogue-empty {
		max-width: 680px;
		margin: 0 auto;
		padding: 72px 24px;
		border: 1px solid #ddd6cb;
		background: #fff;
		text-align: center;
	}

	.catalogue-empty > span {
		display: grid;
		width: 58px;
		height: 58px;
		margin: 0 auto 22px;
		place-items: center;
		background: #f1ece4;
		color: #806f58;
	}

	.catalogue-empty h2 { margin: 0; font-family: Georgia, 'Times New Roman', serif; font-size: 28px; }
	.catalogue-empty p { margin: 10px 0 24px; color: #756e64; font-size: 14px; }

	@media (max-width: 1023px) {
		.course-grid, .bundle-grid, .coaching-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
		.ebook-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
	}

	@media (max-width: 700px) {
		.catalogue-shell { width: min(100% - 32px, 1280px); }
		.catalogue-hero-inner { padding-top: 54px; }
		.catalogue-intro h1 { font-size: clamp(42px, 13vw, 58px); }
		.catalogue-intro p { font-size: 14px; }
		.catalogue-search { grid-template-columns: auto minmax(0, 1fr); margin-top: 30px; padding: 0 16px; }
		.catalogue-search > span { display: none; }
		.catalogue-nav { margin-top: 42px; margin-right: -16px; }
		.catalogue-nav a { min-height: 50px; padding: 0 17px; }
		.catalogue-content { padding: 62px 0 76px; }
		.catalogue-section + .catalogue-section { margin-top: 66px; padding-top: 66px; }
		.section-heading { align-items: flex-start; }
		.section-count { display: none; }
		.section-heading-copy { gap: 12px; }
		.section-icon { width: 38px; height: 38px; }
		.section-heading h2 { font-size: 30px; }
		.course-grid, .bundle-grid, .coaching-grid { grid-template-columns: 1fr; }
		.ebook-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
		.ebook-card .card-body { padding: 14px; }
		.ebook-card .card-body h3 { font-size: 14px; }
		.ebook-card .card-footer { align-items: flex-start; flex-direction: column; }
		.ebook-card .card-footer span { display: none; }
		.section-link { margin-top: 8px; }
	}

	@media (max-width: 420px) {
		.ebook-grid { grid-template-columns: 1fr; }
		.ebook-media { aspect-ratio: 4 / 5; }
	}

	@media (prefers-reduced-motion: reduce) {
		.catalogue-card, .catalogue-card img, .coaching-card { transition: none; }
	}
</style>
