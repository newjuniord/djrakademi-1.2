import { env } from '$env/dynamic/private';

export const KAPSO_ENDPOINT = 'https://api.kapso.ai/meta/whatsapp/v24.0/1328054823728545/messages';

/**
 * Nettoie et formate un numéro de téléphone au format international sans '+' ni espaces.
 */
export function normalizeWhatsappNumber(value: string): string | null {
	const number = value.replace(/[\s().-]/g, '').replace(/^\+/, '');
	return /^[1-9]\d{7,14}$/.test(number) ? number : null;
}

export interface KapsoTemplateParam {
	type: 'text';
	parameter_name?: string;
	text: string;
}

export interface KapsoSendTemplateInput {
	to: string;
	templateName: string;
	languageCode?: string; // Défaut 'fr'
	parameters: KapsoTemplateParam[];
}

/**
 * Envoie un message template WhatsApp via l'API Kapso Meta Cloud API.
 */
export async function sendKapsoTemplate(input: KapsoSendTemplateInput): Promise<{ success: boolean; messageId?: string }> {
	const number = normalizeWhatsappNumber(input.to);
	if (!number) {
		throw new Error(`Numéro WhatsApp invalide : ${input.to}`);
	}

	const apiKey = env.KAPSO_API_KEY?.trim();
	if (!apiKey) {
		throw new Error('KAPSO_API_KEY n’est pas configurée dans le fichier .env.');
	}

	const payload = {
		messaging_product: 'whatsapp',
		to: number,
		type: 'template',
		template: {
			name: input.templateName,
			language: {
				code: input.languageCode || 'fr'
			},
			components: [
				{
					type: 'body',
					parameters: input.parameters
				}
			]
		}
	};

	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), 12_000);

	try {
		const response = await fetch(KAPSO_ENDPOINT, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'X-Kapso-API-Key': apiKey,
				'Authorization': `Bearer ${apiKey}`
			},
			body: JSON.stringify(payload),
			signal: controller.signal
		});

		const result = await response.json().catch(() => null);

		if (!response.ok || (result?.error && !result?.messages?.[0]?.id)) {
			const errMsg = result?.error?.message || (result?.message ? String(result.message) : `HTTP ${response.status}`);
			throw new Error(`Réponse Kapso WhatsApp invalide (HTTP ${response.status}, message : ${errMsg.slice(0, 150)}).`);
		}

		return {
			success: true,
			messageId: result?.messages?.[0]?.id
		};
	} finally {
		clearTimeout(timeout);
	}
}
