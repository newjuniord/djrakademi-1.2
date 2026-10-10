<script lang="ts">
	import { ArrowDown, ArrowUp, Heading1, Image, Link2, Minus, Trash2, Type } from 'lucide-svelte';
	import { untrack } from 'svelte';

	type Recipient = { email: string; name: string };
	type BlockType = 'heading' | 'text' | 'button' | 'image' | 'divider';
	type EmailBlock = { id: number; type: BlockType; content: string; url: string };
	let { lang, recipient, subject = $bindable(''), html = $bindable('') }: {
		lang: 'fr' | 'ht'; recipient?: Recipient; subject?: string; html?: string;
	} = $props();
	const initialLang = untrack(() => lang);
	const words = {
		fr: {
			title: 'Canvas e-mail', description: 'Construisez votre e-mail avec des blocs. Le HTML est créé automatiquement.',
			subject: 'Objet de l’e-mail', layout: 'Blocs du message', add: 'Ajouter un bloc',
			heading: 'Titre', text: 'Texte', button: 'Bouton', image: 'Image', divider: 'Séparateur',
			content: 'Contenu', altText: 'Description de l’image', link: 'Lien du bouton', imageUrl: 'URL de l’image',
			colors: 'Couleurs', accent: 'Couleur principale', background: 'Fond du message',
			preview: 'Aperçu de l’e-mail', previewHint: 'Les variables sont remplacées avec le destinataire sélectionné.', footerHint: 'Un lien pour demander le désabonnement sera ajouté lors de l’envoi.',
			variables: 'Insérer une variable', moveUp: 'Monter', moveDown: 'Descendre', remove: 'Supprimer',
			urlHint: 'Utilisez un lien complet commençant par https://.',
			subjectDefault: 'Une nouveauté pour vous, [name]',
			headingDefault: 'Bonjour [name],', textDefault: 'Nous avons une nouvelle à partager avec vous.', buttonDefault: 'Découvrir',
			imageDefault: 'Image de la campagne'
		},
		ht: {
			title: 'Canvas imèl', description: 'Konstwi imèl ou ak blòk. HTML la fèt otomatikman.',
			subject: 'Sijè imèl la', layout: 'Blòk mesaj la', add: 'Ajoute yon blòk',
			heading: 'Tit', text: 'Tèks', button: 'Bouton', image: 'Imaj', divider: 'Separatè',
			content: 'Kontni', altText: 'Deskripsyon imaj la', link: 'Lyen bouton an', imageUrl: 'URL imaj la',
			colors: 'Koulè yo', accent: 'Koulè prensipal', background: 'Fon mesaj la',
			preview: 'Apèsi imèl la', previewHint: 'Varyab yo ranplase ak enfòmasyon destinatè ou chwazi a.', footerHint: 'N ap ajoute yon lyen pou mande dezabònman lè imèl la voye.',
			variables: 'Mete yon varyab', moveUp: 'Monte', moveDown: 'Desann', remove: 'Efase',
			urlHint: 'Sèvi ak yon lyen konplè ki kòmanse ak https://.',
			subjectDefault: 'Yon nouvote pou ou, [name]',
			headingDefault: 'Bonjou [name],', textDefault: 'Nou gen yon nouvèl pou pataje avè w.', buttonDefault: 'Dekouvri',
			imageDefault: 'Imaj kanpay la'
		}
	};
	let t = $derived(words[lang]);
	let blocks = $state<EmailBlock[]>([
		{ id: 1, type: 'heading', content: words[initialLang].headingDefault, url: '' },
		{ id: 2, type: 'text', content: words[initialLang].textDefault, url: '' },
		{ id: 3, type: 'button', content: words[initialLang].buttonDefault, url: 'https://djrakademi.net' }
	]);
	let nextId = 4;
	let selectedId = $state(1);
	let accent = $state('#1d4ed8');
	let background = $state('#f4f7fb');
	let focusedField = $state<'subject' | 'content'>('content');
	let activeBlock = $derived(blocks.find((block) => block.id === selectedId));
	if (!subject) subject = words[initialLang].subjectDefault;

	function escape(value: string) {
		return value.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character] || character);
	}
	function safeUrl(value: string) {
		try { const url = new URL(value); return url.protocol === 'https:' ? escape(url.href) : ''; }
		catch { return ''; }
	}
	function blockHtml(block: EmailBlock) {
		const content = escape(block.content).replace(/\n/g, '<br>');
		if (block.type === 'heading') return `<h1 style="font-family:Arial,sans-serif;font-size:30px;line-height:1.25;margin:0 0 20px;color:#17202a">${content}</h1>`;
		if (block.type === 'text') return `<p style="font-family:Arial,sans-serif;font-size:16px;line-height:1.7;margin:0 0 22px;color:#344054">${content}</p>`;
		if (block.type === 'button') {
			const url = safeUrl(block.url);
			return url ? `<p style="margin:8px 0 24px"><a href="${url}" style="display:inline-block;background:${accent};color:#ffffff;text-decoration:none;font-family:Arial,sans-serif;font-size:16px;font-weight:bold;padding:14px 24px;border-radius:10px">${content}</a></p>` : '';
		}
		if (block.type === 'image') {
			const url = safeUrl(block.url);
			return url ? `<p style="margin:0 0 24px"><img src="${url}" alt="${escape(block.content)}" width="536" style="display:block;width:100%;max-width:536px;height:auto;border-radius:10px"></p>` : '';
		}
		return '<hr style="border:0;border-top:1px solid #e5e7eb;margin:24px 0">';
	}
	let generatedHtml = $derived(`<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:${background};padding:28px 12px"><tr><td align="center"><table role="presentation" cellpadding="0" cellspacing="0" width="600" style="width:100%;max-width:600px;background:#ffffff;border-radius:16px"><tr><td style="padding:32px"><p style="font-family:Arial,sans-serif;color:${accent};font-weight:bold;font-size:15px;margin:0 0 28px">DJR Akademi</p>${blocks.map(blockHtml).join('')}</td></tr></table></td></tr></table>`);
	$effect(() => { html = generatedHtml; });
	let previewHtml = $derived(generatedHtml.replace(/\[(name|email)\]/gi, (_, key: string) => escape(key.toLowerCase() === 'name' ? recipient?.name || 'Marie' : recipient?.email || 'marie@example.com')));

	function updateBlock(id: number, patch: Partial<EmailBlock>) { blocks = blocks.map((block) => block.id === id ? { ...block, ...patch } : block); }
	function addBlock(type: BlockType) {
		const content = type === 'heading' ? t.headingDefault : type === 'text' ? t.textDefault : type === 'button' ? t.buttonDefault : type === 'image' ? t.imageDefault : '';
		const block = { id: nextId++, type, content, url: type === 'button' ? 'https://djrakademi.net' : '' };
		blocks = [...blocks, block]; selectedId = block.id;
	}
	function moveBlock(index: number, direction: -1 | 1) {
		const target = index + direction;
		if (target < 0 || target >= blocks.length) return;
		const reordered = [...blocks];
		[reordered[index], reordered[target]] = [reordered[target], reordered[index]];
		blocks = reordered;
	}
	function removeBlock(id: number) { blocks = blocks.filter((block) => block.id !== id); if (selectedId === id) selectedId = blocks[0]?.id || 0; }
	function insertVariable(value: string) {
		if (focusedField === 'subject') subject += value;
		else if (activeBlock && activeBlock.type !== 'divider' && activeBlock.type !== 'image') updateBlock(activeBlock.id, { content: activeBlock.content + value });
	}
</script>

<div class="space-y-5">
	<div><h2 class="text-xl font-bold">{t.title}</h2><p class="text-sm text-base-content/60">{t.description}</p></div>
	<label class="block"><span class="mb-1 block text-sm font-semibold">{t.subject}</span><input class="input input-bordered w-full" bind:value={subject} maxlength="200" onfocus={() => focusedField = 'subject'} /></label>
	<div class="flex flex-wrap items-center gap-2"><span class="text-xs font-semibold">{t.variables} :</span>{#each ['[name]', '[email]'] as variable}<button class="btn btn-outline btn-xs font-mono" onclick={() => insertVariable(variable)}>{variable}</button>{/each}</div>
	<div class="grid gap-5 xl:grid-cols-[minmax(310px,0.9fr)_minmax(0,1.1fr)]">
		<div class="space-y-4">
			<section class="rounded-2xl border border-base-200 bg-base-100 p-4 shadow-sm"><h3 class="mb-3 font-bold">{t.colors}</h3><div class="grid grid-cols-2 gap-3"><label class="flex items-center gap-2 text-sm"><input type="color" class="h-9 w-11 cursor-pointer" bind:value={accent} />{t.accent}</label><label class="flex items-center gap-2 text-sm"><input type="color" class="h-9 w-11 cursor-pointer" bind:value={background} />{t.background}</label></div></section>
			<section class="rounded-2xl border border-base-200 bg-base-100 p-4 shadow-sm"><h3 class="mb-3 font-bold">{t.layout}</h3><div class="space-y-2">{#each blocks as block, index (block.id)}<div class="rounded-xl border p-3 {selectedId === block.id ? 'border-primary bg-primary/5' : 'border-base-200'}"><div class="flex items-center gap-2"><button class="min-w-0 flex-1 text-left text-sm font-semibold" onclick={() => selectedId = block.id}>{t[block.type]} <span class="block truncate text-xs font-normal text-base-content/60">{block.content}</span></button><button class="btn btn-ghost btn-xs" aria-label={t.moveUp} title={t.moveUp} disabled={index === 0} onclick={() => moveBlock(index, -1)}><ArrowUp size={15} /></button><button class="btn btn-ghost btn-xs" aria-label={t.moveDown} title={t.moveDown} disabled={index === blocks.length - 1} onclick={() => moveBlock(index, 1)}><ArrowDown size={15} /></button><button class="btn btn-ghost btn-xs text-error" aria-label={t.remove} title={t.remove} disabled={blocks.length === 1} onclick={() => removeBlock(block.id)}><Trash2 size={15} /></button></div>
				{#if selectedId === block.id && block.type !== 'divider'}<div class="mt-3 space-y-2 border-t border-base-200 pt-3">{#if block.type === 'text'}<label class="block text-xs font-semibold">{t.content}<textarea class="textarea textarea-bordered mt-1 min-h-24 w-full text-sm" value={block.content} onfocus={() => focusedField = 'content'} oninput={(event) => updateBlock(block.id, { content: event.currentTarget.value })}></textarea></label>{:else}<label class="block text-xs font-semibold">{block.type === 'image' ? t.altText : t.content}<input class="input input-bordered mt-1 w-full text-sm" value={block.content} onfocus={() => focusedField = 'content'} oninput={(event) => updateBlock(block.id, { content: event.currentTarget.value })} /></label>{/if}{#if block.type === 'button' || block.type === 'image'}<label class="block text-xs font-semibold">{block.type === 'button' ? t.link : t.imageUrl}<input class="input input-bordered mt-1 w-full text-sm" type="url" value={block.url} placeholder="https://…" oninput={(event) => updateBlock(block.id, { url: event.currentTarget.value })} /></label><p class="text-xs text-base-content/50">{t.urlHint}</p>{/if}</div>{/if}</div>{/each}</div></section>
			<section class="rounded-2xl border border-dashed border-base-300 bg-base-100 p-4"><h3 class="mb-3 text-sm font-bold">{t.add}</h3><div class="flex flex-wrap gap-2"><button class="btn btn-outline btn-sm" onclick={() => addBlock('heading')}><Heading1 size={16} />{t.heading}</button><button class="btn btn-outline btn-sm" onclick={() => addBlock('text')}><Type size={16} />{t.text}</button><button class="btn btn-outline btn-sm" onclick={() => addBlock('button')}><Link2 size={16} />{t.button}</button><button class="btn btn-outline btn-sm" onclick={() => addBlock('image')}><Image size={16} />{t.image}</button><button class="btn btn-outline btn-sm" onclick={() => addBlock('divider')}><Minus size={16} />{t.divider}</button></div></section>
		</div>
		<section class="min-w-0 rounded-2xl border border-base-200 bg-base-100 p-4 shadow-sm"><div class="mb-3"><h3 class="font-bold">{t.preview}</h3><p class="text-xs text-base-content/50">{t.previewHint}</p></div><iframe title={t.preview} class="h-[600px] w-full rounded-xl border border-base-200 bg-white" sandbox="" srcdoc={previewHtml}></iframe><p class="mt-2 text-xs text-base-content/50">{t.footerHint}</p></section>
	</div>
</div>
