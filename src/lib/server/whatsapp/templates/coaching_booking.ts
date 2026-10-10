import { sendKapsoTemplate } from '../client';

export interface CoachingBookingParams {
	to: string;
	date: string;   // {{1}} Ex: "15 Octobre 2026 à 14:00"
	number: string; // {{2}} Ex: "+50937000000"
	languageCode?: string; // Défaut 'en_US', comme le modèle dans Kapso
}

/**
 * Envoie le template `coaching_booking` au coach via Kapso Meta Cloud API.
 *
 * Contenu du template Meta WhatsApp :
 * "You have a new booking for {{1}}. The client's phone number is: {{2}}.
 *
 * DJR Akademi."
 */
export async function sendCoachingBookingTemplate(input: CoachingBookingParams) {
	return sendKapsoTemplate({
		to: input.to,
		templateName: 'coaching_booking',
		languageCode: input.languageCode || 'en_US',
		parameters: [
			{ type: 'text', parameter_name: 'date', text: input.date },
			{ type: 'text', parameter_name: 'number', text: input.number }
		]
	});
}
