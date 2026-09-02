<script lang="ts">
	import type { ApiLogEntry } from '$lib/types/admin';
	import {
		X,
		Activity,
		Copy,
		Check,
		Globe,
		Clock,
		Cpu,
		Code2,
		ArrowRight,
		CheckCircle2,
		AlertTriangle,
		XCircle
	} from 'lucide-svelte';

	let {
		open = false,
		log = null,
		onClose
	}: {
		open: boolean;
		log: ApiLogEntry | null;
		onClose: () => void;
	} = $props();

	let copiedReq = $state(false);
	let copiedRes = $state(false);

	function copyToClipboard(text: string, type: 'req' | 'res') {
		navigator.clipboard.writeText(text);
		if (type === 'req') {
			copiedReq = true;
			setTimeout(() => (copiedReq = false), 2000);
		} else {
			copiedRes = true;
			setTimeout(() => (copiedRes = false), 2000);
		}
	}

	function formatJson(obj?: any): string {
		if (!obj) return 'null';
		try {
			return JSON.stringify(obj, null, 2);
		} catch {
			return String(obj);
		}
	}
</script>

{#if open && log}
	<!-- Backdrop Overlay -->
	<button
		type="button"
		class="fixed inset-0 bg-black/50 z-40 transition-opacity"
		onclick={onClose}
		aria-label="Fermer le détails du log"
	></button>

	<!-- Right Slide Drawer -->
	<div
		class="fixed right-0 top-0 bottom-0 h-full w-full max-w-xl bg-base-100 shadow-2xl flex flex-col z-50 overflow-hidden border-l border-base-200"
		role="dialog"
		aria-modal="true"
		aria-labelledby="log-drawer-title"
	>
		<!-- Header Sticky Bar -->
		<div class="p-6 border-b border-base-200 flex items-center justify-between shrink-0 bg-base-100">
			<div>
				<div class="flex items-center gap-2">
					<!-- Method Badge -->
					<span
						class="badge badge-sm font-extrabold text-[10px] uppercase rounded-none border-none {log.method === 'GET' ? 'bg-info/20 text-info' : log.method === 'POST' ? 'bg-success/20 text-success' : log.method === 'PUT' ? 'bg-warning/20 text-warning' : 'bg-error/20 text-error'}"
					>
						{log.method}
					</span>

					<h2 id="log-drawer-title" class="text-base font-mono font-bold text-base-content truncate max-w-xs">
						{log.endpoint}
					</h2>
				</div>
				<p class="text-xs text-base-content/60 mt-1">
					ID Requête: <span class="font-mono text-base-content/80 font-bold">{log.id}</span>
				</p>
			</div>

			<button
				type="button"
				class="btn btn-ghost btn-square btn-sm rounded-none text-base-content/60 hover:text-base-content"
				onclick={onClose}
			>
				<X size={20} />
			</button>
		</div>

		<!-- Body Inspector Content with internal scrollbar -->
		<div class="p-6 flex-1 overflow-y-auto space-y-6 text-xs min-h-0">
			<!-- Overview Status Box -->
			<div class="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-base-200/50 p-4 border border-base-200/60 rounded-none">
				<div>
					<span class="text-[11px] text-base-content/60 block font-semibold">Statut</span>
					<div class="flex items-center gap-1 mt-0.5">
						{#if log.statusCode < 300}
							<CheckCircle2 size={14} class="text-success" />
							<span class="font-bold text-success">{log.statusCode} {log.statusText}</span>
						{:else if log.statusCode < 500}
							<AlertTriangle size={14} class="text-warning" />
							<span class="font-bold text-warning">{log.statusCode} {log.statusText}</span>
						{:else}
							<XCircle size={14} class="text-error" />
							<span class="font-bold text-error">{log.statusCode} {log.statusText}</span>
						{/if}
					</div>
				</div>

				<div>
					<span class="text-[11px] text-base-content/60 block font-semibold">Temps réponse</span>
					<span class="font-mono font-bold text-base-content mt-0.5 block">{log.responseTimeMs} ms</span>
				</div>

				<div>
					<span class="text-[11px] text-base-content/60 block font-semibold">Client IP</span>
					<span class="font-mono font-bold text-base-content mt-0.5 block">{log.clientIp}</span>
				</div>

				<div>
					<span class="text-[11px] text-base-content/60 block font-semibold">Horodatage</span>
					<span class="font-mono text-base-content/80 mt-0.5 block text-[11px]">{log.timestamp.split('T')[1].replace('Z', '')}</span>
				</div>
			</div>

			<!-- User Agent -->
			<div class="space-y-1">
				<span class="text-xs font-bold text-base-content/70">User Agent</span>
				<div class="p-2.5 bg-base-200/30 border border-base-200/60 text-[11px] font-mono text-base-content/80 break-all">
					{log.userAgent}
				</div>
			</div>

			<!-- Request Headers -->
			<div class="space-y-2">
				<span class="text-xs font-bold text-base-content/70 flex items-center gap-1.5">
					<Code2 size={14} class="text-primary" />
					En-têtes Requête (Request Headers)
				</span>
				<pre class="p-3 bg-neutral text-neutral-content text-[11px] font-mono rounded-none overflow-x-auto leading-relaxed">{formatJson(log.requestHeaders)}</pre>
			</div>

			<!-- Request JSON Body Payload -->
			<div class="space-y-2">
				<div class="flex items-center justify-between">
					<span class="text-xs font-bold text-base-content/70 flex items-center gap-1.5">
						<Code2 size={14} class="text-primary" />
						Payload Requête JSON (Request Payload)
					</span>
					{#if log.requestPayload}
						<button
							type="button"
							class="btn btn-ghost btn-xs rounded-none gap-1 font-semibold text-[11px]"
							onclick={() => copyToClipboard(formatJson(log.requestPayload), 'req')}
						>
							{#if copiedReq}
								<Check size={13} class="text-success" />
								<span>Copié !</span>
							{:else}
								<Copy size={13} />
								<span>Copier JSON</span>
							{/if}
						</button>
					{/if}
				</div>
				<pre class="p-4 bg-neutral text-neutral-content text-[11px] font-mono rounded-none overflow-x-auto leading-relaxed border border-neutral-content/10">{formatJson(log.requestPayload)}</pre>
			</div>

			<!-- Response JSON Body Payload -->
			<div class="space-y-2">
				<div class="flex items-center justify-between">
					<span class="text-xs font-bold text-base-content/70 flex items-center gap-1.5">
						<Code2 size={14} class="text-accent" />
						Réponse JSON (Response Payload)
					</span>
					{#if log.responsePayload}
						<button
							type="button"
							class="btn btn-ghost btn-xs rounded-none gap-1 font-semibold text-[11px]"
							onclick={() => copyToClipboard(formatJson(log.responsePayload), 'res')}
						>
							{#if copiedRes}
								<Check size={13} class="text-success" />
								<span>Copié !</span>
							{:else}
								<Copy size={13} />
								<span>Copier JSON</span>
							{/if}
						</button>
					{/if}
				</div>
				<pre class="p-4 bg-neutral text-neutral-content text-[11px] font-mono rounded-none overflow-x-auto leading-relaxed border border-neutral-content/10">{formatJson(log.responsePayload)}</pre>
			</div>
		</div>

		<!-- Footer Action -->
		<div class="p-6 border-t border-base-200 flex items-center justify-end shrink-0 bg-base-100">
			<button
				type="button"
				class="btn bg-black text-white hover:bg-black/90 border-none rounded-none text-xs font-semibold px-6"
				onclick={onClose}
			>
				Fermer l'inspecteur
			</button>
		</div>
	</div>
{/if}
