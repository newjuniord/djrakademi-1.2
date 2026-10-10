import { sendKapsoTemplate } from '../client';

export interface OrderConfirmationParams {
	to: string;
	orderNumberText: string; // Ex: "ORD-12345 Il y a un problème avec le bouton de connexion. Utilise plutôt ce lien de connexion : https://..."
	languageCode?: string;   // Défaut 'fr'
}

/**
 * Envoie le template `order_confirmation`.
 *
 * Exemple de texte du template WhatsApp Meta :
 * "Paiement confirmé. {{order_number}}"
 */
export async function sendOrderConfirmationTemplate(input: OrderConfirmationParams) {
	return sendKapsoTemplate({
		to: input.to,
		templateName: 'order_confirmation',
		languageCode: input.languageCode || 'fr',
		parameters: [
			{ type: 'text', parameter_name: 'order_number', text: input.orderNumberText }
		]
	});
}
