import { sendKapsoTemplate } from '../client';

export interface BookingConfirmedParams {
	to: string;
	booking: string; // {{1}} Ex: "Coaching Personnalisé DJ"
	date: string;    // {{2}} Ex: "Mardi 15 Octobre 2026"
	hours: string;   // {{3}} Ex: "14:00"
	link: string;    // {{4}} Lien de connexion automatique /account/purchase-access avec next=/bookings
	languageCode?: string; // Défaut 'fr'
}

/**
 * Envoie le template `booking_confirmed` (4 paramètres).
 *
 * Exemple de texte du template WhatsApp Meta :
 * "Votre réservation pour {{1}} est confirmée.
 *  📅 Date : {{2}}
 *  🕒 Heure : {{3}}
 *  Vous pouvez consulter les détails de votre réservation ici :
 *  {{4}}
 *  Merci d'avoir choisi dJrAkademi."
 */
export async function sendBookingConfirmedTemplate(input: BookingConfirmedParams) {
	return sendKapsoTemplate({
		to: input.to,
		templateName: 'booking_confirmed',
		languageCode: input.languageCode || 'fr',
		parameters: [
			{ type: 'text', parameter_name: 'booking', text: input.booking },
			{ type: 'text', parameter_name: 'date', text: input.date },
			{ type: 'text', parameter_name: 'hours', text: input.hours },
			{ type: 'text', parameter_name: 'link', text: input.link }
		]
	});
}
