export type VideoSource =
	| { type: 'iframe'; embedUrl: string }
	| { type: 'direct'; src: string }
	| null;

export function parseVideoUrl(url?: string): VideoSource {
	if (!url || !url.trim()) return null;
	const trimmed = url.trim();

	// YouTube
	const ytMatch = trimmed.match(
		/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i
	);
	if (ytMatch && ytMatch[1]) {
		return {
			type: 'iframe',
			embedUrl: `https://www.youtube-nocookie.com/embed/${ytMatch[1]}?autoplay=1&rel=0`
		};
	}

	// Vimeo
	const vimeoMatch = trimmed.match(/(?:vimeo\.com\/|player\.vimeo\.com\/video\/)(\d+)/i);
	if (vimeoMatch && vimeoMatch[1]) {
		return {
			type: 'iframe',
			embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1&title=0&byline=0&portrait=0`
		};
	}

	// Loom
	const loomMatch = trimmed.match(/loom\.com\/(?:share|embed)\/([a-zA-Z0-9]+)/i);
	if (loomMatch && loomMatch[1]) {
		return {
			type: 'iframe',
			embedUrl: `https://www.loom.com/embed/${loomMatch[1]}?autoplay=1`
		};
	}

	// Generic embed link with /embed/
	if (trimmed.includes('/embed/')) {
		return {
			type: 'iframe',
			embedUrl: trimmed
		};
	}

	// Direct video URL (.mp4, .webm, Appwrite bucket URL, etc.)
	return {
		type: 'direct',
		src: trimmed
	};
}
