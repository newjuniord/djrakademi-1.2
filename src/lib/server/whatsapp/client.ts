import { env } from '$env/dynamic/private';

const DEFAULT_PHONE_NUMBER_ID = '1328054823728545';

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
export async function sendKapsoTemplate(input: KapsoSendTemplateInput): Promise<{ success: boolean; messageId: string }> {
	const number = normalizeWhatsappNumber(input.to);
	if (!number) {
		throw new Error(`Numéro WhatsApp invalide : ${input.to}`);
	}

	const apiKey = env.KAPSO_API_KEY?.trim();
	if (!apiKey) {
		throw new Error('KAPSO_API_KEY n’est pas configurée dans le fichier .env.');
	}
	const phoneNumberId = env.KAPSO_PHONE_NUMBER_ID?.trim() || DEFAULT_PHONE_NUMBER_ID;
	if (!/^\d+$/.test(phoneNumberId)) {
		throw new Error('KAPSO_PHONE_NUMBER_ID doit être l’identifiant numérique du numéro WhatsApp dans Kapso.');
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
		const response = await fetch(`https://api.kapso.ai/meta/whatsapp/v24.0/${phoneNumberId}/messages`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'X-API-Key': apiKey
			},
			body: JSON.stringify(payload),
			signal: controller.signal,
			redirect: 'error'
		});

		const result = await response.json().catch(() => null);

		if (!response.ok || result?.error) {
			const errMsg = result?.error?.message || (result?.message ? String(result.message) : `HTTP ${response.status}`);
			throw new Error(`Réponse Kapso WhatsApp invalide (HTTP ${response.status}, message : ${errMsg.slice(0, 150)}).`);
		}
		const messageId = result?.messages?.[0]?.id;
		if (typeof messageId !== 'string' || !messageId.trim()) {
			throw new Error('Kapso n’a pas confirmé la prise en charge du message WhatsApp (identifiant absent).');
		}

		// La prise en charge est confirmée ici ; la livraison est consultable dans Kapso.
		return {
			success: true,
			messageId
		};
	} finally {
		clearTimeout(timeout);
	}
}
