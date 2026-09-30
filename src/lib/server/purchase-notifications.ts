import { Query } from 'node-appwrite';
import type { Order } from '$lib/services/orders';
import { adminServices, DATABASE_ID } from '$lib/server/admin-appwrite';
import { sendPurchaseConfirmationEmail, purchaseAccessLinks } from '$lib/server/purchase-email';
import { sendWhatsappMessage } from '$lib/server/whatsapp-message';

async function customerPhone(order: Order): Promise<string> {
	if (order.customerPhone) return order.customerPhone;
	if (!order.userId) return '';
	try {
		const { tables, users } = adminServices();
		const result = await tables.listRows({
			databaseId: DATABASE_ID, tableId: 'profiles',
			queries: [Query.equal('user_id', order.userId), Query.limit(1)]
		});
		if (result.rows[0]?.whatsapp) return String(result.rows[0].whatsapp);
		const user = await users.get({ userId: order.userId });
		return String(user.phone || '');
	} catch (error) {
		console.error('[Purchase WhatsApp] Profil indisponible :', error);
		return '';
	}
}

function appointment(startAt: string, timezone: string): string {
	try {
		return new Intl.DateTimeFormat('fr-FR', {
			dateStyle: 'full', timeStyle: 'short', timeZone: timezone
		}).format(new Date(startAt)) + ` (${timezone})`;
	} catch {
		return startAt;
	}
}

async function coachingDetails(order: Order): Promise<{ customerPhone: string; customerText: string; coachPhone: string; coachText: string } | null> {
	try {
		const { tables } = adminServices();
		const [booking, settings] = await Promise.all([
			tables.getRow({ databaseId: DATABASE_ID, tableId: 'bookings', rowId: order.productId }),
			tables.listRows({ databaseId: DATABASE_ID, tableId: 'coaching_settings', queries: [Query.limit(1)] })
		]);
		const coachPhone = String(settings.rows[0]?.whatsapp || '');
		const dateCustomer = appointment(String(booking.start_at || ''), String(booking.customer_timezone || 'America/Port-au-Prince'));
		const dateCoach = appointment(String(booking.start_at || ''), String(booking.coach_timezone || 'America/Port-au-Prince'));
		return {
			customerPhone: String(booking.customer_whatsapp || ''),
			customerText: `\n\nRendez-vous : ${dateCustomer}\nNuméro du coach : ${coachPhone || 'Consultez votre espace de réservation.'}`,
			coachPhone,
			coachText: `DJR Akademi — nouvelle réservation confirmée.\nClient : ${booking.customer_name || order.customerName}\nWhatsApp client : ${booking.customer_whatsapp || 'non renseigné'}\nCoaching : ${order.productTitle}\nRendez-vous : ${dateCoach}\nRéservation : ${order.productId}`
		};
	} catch (error) {
		console.error('[Purchase WhatsApp] Réservation indisponible :', error);
		return null;
	}
}

export async function sendPurchaseNotifications(order: Order): Promise<{ emailSent: boolean; whatsappSent: boolean }> {
	let emailSent = false;
	try {
		emailSent = (await sendPurchaseConfirmationEmail(order)).sent;
	} catch (error) {
		console.error('[Purchase email] Envoi impossible pour la commande', order.id, error);
	}

	let whatsappSent = false;
	try {
		const phone = await customerPhone(order);
		const coaching = order.productType === 'coaching' ? await coachingDetails(order) : null;
		const recipient = coaching?.customerPhone || phone;
		if (recipient) {
			const { accessUrl, downloadUrl } = purchaseAccessLinks(order);
			const text = `Bonjour ${order.customerName || 'Client'},\nVotre achat « ${order.productTitle} » est confirmé.\nAccès direct à votre espace : ${accessUrl}`
				+ (downloadUrl ? `\nTélécharger votre ebook : ${downloadUrl}` : '')
				+ (coaching?.customerText || '')
				+ `\n\nCommande : ${order.id}\nDJR Akademi`;
			whatsappSent = await sendWhatsappMessage(recipient, text, `Commande ${order.id}`);
		} else {
			console.info('[Purchase WhatsApp] Aucun numéro client pour la commande', order.id);
		}
		if (coaching?.coachPhone) {
			await sendWhatsappMessage(coaching.coachPhone, coaching.coachText, `Coach — réservation ${order.productId}`);
		}
	} catch (error) {
		console.error('[Purchase WhatsApp] Préparation impossible pour la commande', order.id, error);
	}
	return { emailSent, whatsappSent };
}
