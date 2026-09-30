<script lang="ts">
	let { visible }: { visible: boolean } = $props();

	const scriptId = 'tawk-chat-script';
	const scriptUrl = 'https://embed.tawk.to/6abc9a6a9b48fc343fb47dc0/1k3obmcjc';

	type TawkApi = {
		hideWidget?: () => void;
		showWidget?: () => void;
		onLoad?: () => void;
	};

	function tawkWindow() {
		return window as Window & {
			Tawk_API?: TawkApi;
			Tawk_LoadStart?: Date;
		};
	}

	function ensureScript() {
		if (document.getElementById(scriptId)) return;

		const tawk = tawkWindow();
		tawk.Tawk_API ??= {};
		tawk.Tawk_LoadStart = new Date();
		tawk.Tawk_API.onLoad = () => {
			if (visible) tawk.Tawk_API?.showWidget?.();
			else tawk.Tawk_API?.hideWidget?.();
		};

		const script = document.createElement('script');
		script.id = scriptId;
		script.async = true;
		script.src = scriptUrl;
		script.charset = 'UTF-8';
		script.setAttribute('crossorigin', '*');
		document.head.appendChild(script);
	}

	$effect(() => {
		if (visible) {
			ensureScript();
			tawkWindow().Tawk_API?.showWidget?.();
		} else {
			tawkWindow().Tawk_API?.hideWidget?.();
		}
	});
</script>
