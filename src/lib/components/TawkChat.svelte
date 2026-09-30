<script lang="ts">
	import { onMount } from 'svelte';

	const scriptId = 'tawk-chat-script';
	const scriptUrl = 'https://embed.tawk.to/6abc9a6a9b48fc343fb47dc0/1k3obmcjc';

	onMount(() => {
		if (document.getElementById(scriptId)) return;

		const tawkWindow = window as Window & {
			Tawk_API?: Record<string, unknown>;
			Tawk_LoadStart?: Date;
		};
		tawkWindow.Tawk_API ??= {};
		tawkWindow.Tawk_LoadStart = new Date();

		const script = document.createElement('script');
		script.id = scriptId;
		script.async = true;
		script.src = scriptUrl;
		script.charset = 'UTF-8';
		script.setAttribute('crossorigin', '*');
		document.head.appendChild(script);
	});
</script>
