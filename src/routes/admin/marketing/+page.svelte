<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { CheckCircle2, CircleAlert, Loader2, Mail, RefreshCw, Send } from 'lucide-svelte';
	import { adminAuthorizedFetch, adminRequest } from '$lib/admin/admin-client';
	import MarketingEmailCanvas from '$lib/components/admin/MarketingEmailCanvas.svelte';
	type MarketingRecipient = { email: string; name: string; hasPurchased: boolean };

	type Segment = 'all' | 'buyers' | 'nonbuyers';
	type SendState = { email: string; status: 'waiting' | 'sending' | 'success' | 'error'; error?: string };
	let lang = $derived<'fr' | 'ht'>(page.url.searchParams.get('lang') === 'ht' ? 'ht' : 'fr');
	const copy = {
		fr: {
			title: 'E-mails marketing', intro: 'Créez votre message, choisissez les comptes destinataires et suivez chaque envoi en direct.',
			all: 'Tous les comptes', buyers: 'Ont déjà acheté', nonbuyers: 'N’ont jamais acheté', subscribers: 'Comptes affichés',
			select: 'Destinataires', search: 'Rechercher un nom ou une adresse…', chooseAll: 'Sélectionner tous les comptes du filtre', clear: 'Effacer la sélection',
			page: 'Page', of: 'sur', previous: 'Précédent', next: 'Suivant',
			bought: 'A acheté', noPurchase: 'Aucun achat',
			send: 'Envoyer les e-mails', sending: 'Envoi en cours…', selected: 'sélectionné(s)',
			progress: 'Suivi des envois', waiting: 'En attente', inProgress: 'En cours', success: 'Accepté par Resend', failed: 'Échec',
			reload: 'Actualiser', empty: 'Aucun compte dans ce filtre.', consent: 'Les adresses proviennent des comptes de la plateforme.',
			note: 'Le modèle et le suivi restent dans cette page pendant la session. Aucun historique de campagne n’est enregistré dans l’application.',
			loadError: 'Impossible de charger les comptes.', sendError: 'L’envoi a été interrompu.'
		},
		ht: {
			title: 'Imèl maketing', intro: 'Ekri mesaj ou a, chwazi kont k ap resevwa l epi suiv chak voye an dirèk.',
			all: 'Tout kont yo', buyers: 'Moun ki deja achte', nonbuyers: 'Moun ki poko achte', subscribers: 'Kont ki parèt yo',
			select: 'Destinatè yo', search: 'Chèche yon non oswa yon imèl…', chooseAll: 'Chwazi tout kont ki nan filtè a', clear: 'Efase seleksyon an',
			page: 'Paj', of: 'sou', previous: 'Anvan', next: 'Apre',
			bought: 'Deja achte', noPurchase: 'Poko achte',
			send: 'Voye imèl yo', sending: 'Ap voye…', selected: 'chwazi',
			progress: 'Swivi imèl yo', waiting: 'Ap tann', inProgress: 'Ap voye', success: 'Resend aksepte l', failed: 'Echèk',
			reload: 'Rafrechi', empty: 'Pa gen kont nan filtè sa a.', consent: 'Adrès imèl yo soti nan kont sou platfòm nan.',
			note: 'Modèl la ak swivi a rete sou paj sa a pandan sesyon an. Aplikasyon an pa anrejistre okenn istorik kanpay.',
			loadError: 'Nou pa ka chaje kont yo.', sendError: 'Voye imèl yo te kanpe.'
		}
	};
	let t = $derived(copy[lang]);
	let recipients = $state<MarketingRecipient[]>([]);
	let selected = $state<string[]>([]);
	let activeTab = $state<'recipients' | 'canvas'>('recipients');
	let segment = $state<Segment>('all');
	let search = $state('');
	let loading = $state(true);
	let configured = $state(false);
	let busy = $state(false);
	let error = $state('');
	let subject = $state('');
	let html = $state('');
	let results = $state<SendState[]>([]);
	const pageSize = 100;
	let recipientPage = $state(1);
	let resultPage = $state(1);
	let filtered = $derived(recipients.filter((recipient) =>
		(segment === 'all' || (segment === 'buyers' ? recipient.hasPurchased : !recipient.hasPurchased)) &&
		(!search.trim() || `${recipient.name} ${recipient.email}`.toLowerCase().includes(search.trim().toLowerCase()))
	));
	let recipientPages = $derived(Math.max(1, Math.ceil(filtered.length / pageSize)));
	let visibleRecipients = $derived(filtered.slice((recipientPage - 1) * pageSize, recipientPage * pageSize));
	let resultPages = $derived(Math.max(1, Math.ceil(results.length / pageSize)));
	let visibleResults = $derived(results.slice((resultPage - 1) * pageSize, resultPage * pageSize));
	let previewRecipient = $derived(recipients.find((recipient) => recipient.email === selected[0]) || filtered[0]);
	let successCount = $derived(results.filter((item) => item.status === 'success').length);
	let errorCount = $derived(results.filter((item) => item.status === 'error').length);

	async function loadRecipients() {
		loading = true; error = '';
		try {
			const data = await adminRequest<{ recipients: MarketingRecipient[]; configured: boolean }>('/marketing/audience');
			recipients = data.recipients;
			configured = data.configured;
			selected = selected.filter((email) => recipients.some((recipient) => recipient.email === email));
		} catch (cause) { error = cause instanceof Error ? cause.message : t.loadError; }
		finally { loading = false; }
	}
	onMount(loadRecipients);

	function toggle(email: string) { selected = selected.includes(email) ? selected.filter((item) => item !== email) : [...selected, email]; }
	function chooseSegment(value: Segment) {
		segment = value;
		recipientPage = 1;
		selected = recipients
			.filter((recipient) => value === 'all' || (value === 'buyers' ? recipient.hasPurchased : !recipient.hasPurchased))
			.map((recipient) => recipient.email);
	}
	function selectAllFiltered() {
		selected = [...new Set([...selected, ...filtered.map((recipient) => recipient.email)])];
	}
	$effect(() => { search; recipientPage = 1; });

	async function send() {
		if (busy || !selected.length || !subject.trim() || !html.trim()) return;
		busy = true; error = '';
		const emails = [...selected];
		results = emails.map((email) => ({ email, status: 'waiting' }));
		resultPage = 1;
		try {
			for (let offset = 0; offset < emails.length; offset += 25) {
				const batch = emails.slice(offset, offset + 25);
				const response = await adminAuthorizedFetch('/marketing/send', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ emails: batch, subject, html, lang }) });
				if (!response.ok || !response.body) {
					const detail = await response.json().catch(() => ({}));
					throw new Error(detail.error || t.sendError);
				}
				const reader = response.body.getReader();
				const decoder = new TextDecoder();
				let pending = '';
				while (true) {
					const { value, done } = await reader.read();
					if (done) break;
					pending += decoder.decode(value, { stream: true });
					const lines = pending.split('\n');
					pending = lines.pop() || '';
					for (const line of lines) {
						if (!line) continue;
						const update = JSON.parse(line) as SendState;
						results = results.map((item) => item.email === update.email ? update : item);
					}
				}
				if (pending.trim()) {
					const update = JSON.parse(pending) as SendState;
					results = results.map((item) => item.email === update.email ? update : item);
				}
				if (results.some((item) => batch.includes(item.email) && (item.status === 'waiting' || item.status === 'sending'))) throw new Error(t.sendError);
			}
		} catch (cause) {
			error = cause instanceof Error ? cause.message : t.sendError;
			results = results.map((item) => item.status === 'waiting' || item.status === 'sending' ? { ...item, status: 'error', error: t.sendError } : item);
		}
		finally { busy = false; }
	}
</script>

<svelte:head><title>{t.title} | DJR Akademi</title></svelte:head>

<div class="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
	<div class="flex flex-wrap items-start justify-between gap-4">
		<div><div class="flex items-center gap-3"><span class="rounded-xl bg-primary/10 p-3 text-primary"><Mail size={24} /></span><h1 class="text-2xl font-bold">{t.title}</h1></div><p class="mt-2 text-sm text-base-content/65">{t.intro}</p></div>
		<button class="btn btn-ghost btn-sm" onclick={loadRecipients} disabled={loading || busy}><RefreshCw size={16} class={loading ? 'animate-spin' : ''} />{t.reload}</button>
	</div>
	{#if error}<div class="alert alert-error text-sm" role="alert"><CircleAlert size={18} />{error}</div>{/if}
	{#if !configured && !loading}<div class="alert alert-warning text-sm" role="status"><CircleAlert size={18} />{lang === 'fr' ? 'Envoi désactivé : vérifiez la clé Resend et les adresses e-mail de contact.' : 'Voye dezaktive : verifye kle Resend la ak adrès imèl kontak yo.'}</div>{/if}
	<div role="tablist" class="tabs tabs-box w-full max-w-lg bg-base-200/70 p-1">
		<button role="tab" aria-selected={activeTab === 'recipients'} class="tab flex-1 font-semibold" class:tab-active={activeTab === 'recipients'} onclick={() => activeTab = 'recipients'}>1 · {t.select} <span class="ml-2 badge badge-sm">{selected.length}</span></button>
		<button role="tab" aria-selected={activeTab === 'canvas'} class="tab flex-1 font-semibold" class:tab-active={activeTab === 'canvas'} onclick={() => activeTab = 'canvas'}>2 · {lang === 'fr' ? 'Canvas e-mail' : 'Canvas imèl'}</button>
	</div>
	<div class:hidden={activeTab !== 'recipients'}>
		<section class="card border border-base-200 bg-base-100 shadow-sm"><div class="card-body gap-4 p-5">
			<div class="flex items-center justify-between"><h2 class="card-title text-lg">{t.select}</h2><span class="badge badge-primary">{selected.length} {t.selected}</span></div>
			<div class="grid grid-cols-3 gap-2">
				{#each (['all', 'buyers', 'nonbuyers'] as Segment[]) as option}
					<button class:btn-primary={segment === option} class="btn btn-sm h-auto min-h-12 whitespace-normal" onclick={() => chooseSegment(option)}>{t[option]}<span class="opacity-70">{recipients.filter((r) => option === 'all' || (option === 'buyers' ? r.hasPurchased : !r.hasPurchased)).length}</span></button>
				{/each}
			</div>
			<label class="input input-bordered flex w-full items-center gap-2"><span class="sr-only">{t.search}</span><input class="grow" placeholder={t.search} bind:value={search} /></label>
			<div class="flex flex-wrap items-center justify-between gap-2 text-xs"><span>{t.subscribers}: {filtered.length}</span><div class="flex gap-2"><button class="link link-primary" onclick={selectAllFiltered} disabled={busy || !filtered.length}>{t.chooseAll}</button><button class="link" onclick={() => selected = []} disabled={busy}>{t.clear}</button></div></div>
			<p class="text-xs text-base-content/60">{t.consent}</p>
			<div class="max-h-[600px] space-y-2 overflow-y-auto pr-1">
				{#if loading}<div class="flex justify-center p-8"><Loader2 class="animate-spin" /></div>
				{:else if !filtered.length}<p class="py-8 text-center text-sm text-base-content/50">{t.empty}</p>
				{:else}{#each visibleRecipients as recipient (recipient.email)}
					<label class="flex cursor-pointer items-center gap-3 rounded-xl border border-base-200 p-3 transition-colors hover:bg-base-200/50">
						<input type="checkbox" class="checkbox checkbox-primary checkbox-sm" checked={selected.includes(recipient.email)} disabled={busy} onchange={() => toggle(recipient.email)} />
						<span class="min-w-0 flex-1"><span class="block truncate text-sm font-semibold">{recipient.name}</span><span class="block truncate text-xs text-base-content/60">{recipient.email}</span></span>
						<span class="text-right text-[11px]"><span class="block">{recipient.hasPurchased ? t.bought : t.noPurchase}</span></span>
					</label>
				{/each}{/if}
			</div>
			{#if !loading && filtered.length > pageSize}<div class="flex items-center justify-between gap-3 text-xs"><span>{t.page} {recipientPage} {t.of} {recipientPages}</span><div class="flex gap-2"><button class="btn btn-sm btn-outline" disabled={recipientPage <= 1} onclick={() => recipientPage--}>{t.previous}</button><button class="btn btn-sm btn-outline" disabled={recipientPage >= recipientPages} onclick={() => recipientPage++}>{t.next}</button></div></div>{/if}
		</div></section>
	</div>
	<div class:hidden={activeTab !== 'canvas'} class="space-y-5">
		<MarketingEmailCanvas {lang} recipient={previewRecipient} bind:subject bind:html />
		<div class="rounded-2xl border border-base-200 bg-base-100 p-5 shadow-sm">
			<div class="flex flex-wrap items-center justify-between gap-3"><div><p class="font-semibold">{selected.length} {t.selected}</p><p class="text-xs text-base-content/55">{t.note}</p></div><button class="btn btn-primary" onclick={send} disabled={!configured || busy || !selected.length || !subject.trim() || !html.trim()}>{#if busy}<Loader2 class="animate-spin" size={18} />{t.sending}{:else}<Send size={18} />{t.send}{/if}</button></div>
		</div>
	</div>
	{#if results.length}
		<section class="card border border-base-200 bg-base-100 shadow-sm">
			<div class="card-body gap-4 p-5">
				<div class="flex flex-wrap items-center justify-between gap-2"><h2 class="card-title text-lg">{t.progress}</h2><span class="text-sm">{successCount}/{results.length} · {errorCount} {t.failed.toLowerCase()}</span></div>
				<progress class="progress progress-primary w-full" value={successCount + errorCount} max={results.length}></progress>
				<div class="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
					{#each visibleResults as result (result.email)}
						<div class="flex items-center gap-3 rounded-xl border border-base-200 p-3"><span class="grid size-9 shrink-0 place-items-center rounded-full border-2" class:border-primary={result.status === 'sending'} class:border-success={result.status === 'success'} class:border-error={result.status === 'error'} class:border-base-300={result.status === 'waiting'}>{#if result.status === 'sending'}<span class="size-5 animate-spin rounded-full border-2 border-primary border-t-transparent"></span>{:else if result.status === 'success'}<CheckCircle2 class="text-success" size={21} />{:else if result.status === 'error'}<CircleAlert class="text-error" size={21} />{:else}<Mail size={17} />{/if}</span><span class="min-w-0"><span class="block truncate text-sm font-medium">{result.email}</span><span class="block text-xs text-base-content/60">{result.error || (result.status === 'waiting' ? t.waiting : result.status === 'sending' ? t.inProgress : result.status === 'success' ? t.success : t.failed)}</span></span></div>
					{/each}
				</div>
				{#if results.length > pageSize}<div class="flex items-center justify-between gap-3 text-xs"><span>{t.page} {resultPage} {t.of} {resultPages}</span><div class="flex gap-2"><button class="btn btn-sm btn-outline" disabled={resultPage <= 1} onclick={() => resultPage--}>{t.previous}</button><button class="btn btn-sm btn-outline" disabled={resultPage >= resultPages} onclick={() => resultPage++}>{t.next}</button></div></div>{/if}
			</div>
		</section>
	{/if}
</div>
