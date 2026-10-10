import { Query } from 'node-appwrite';
import type { Order } from '$lib/services/orders';
import { adminServices, DATABASE_ID } from '$lib/server/admin-appwrite';
import { sendPurchaseConfirmationEmail, purchaseAccessLinks, publicAppUrl } from '$lib/server/purchase-email';
import { sendWhatsappMessage } from '$lib/server/whatsapp-message';
import { sendCoachingBookingTemplate, sendBookingConfirmedTemplate } from '$lib/server/whatsapp';

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

function appointment(startAt: string, timezone: string): { full: string; date: string; time: string } {
	try {
		const d = new Date(startAt);
		const full = new Intl.DateTimeFormat('fr-FR', {
			dateStyle: 'full', timeStyle: 'short', timeZone: timezone
		}).format(d) + ` (${timezone})`;
		const date = new Intl.DateTimeFormat('fr-FR', {
			dateStyle: 'full', timeZone: timezone
		}).format(d);
		const time = new Intl.DateTimeFormat('fr-FR', {
			timeStyle: 'short', timeZone: timezone
		}).format(d);
		return { full, date, time };
	} catch {
		return { full: startAt, date: startAt, time: '' };
	}
}

async function coachingDetails(order: Order): Promise<{ customerPhone: string; customerText: string; coachPhone: string; coachText: string; dateCoach: string; customerDate: string; customerTime: string; title: string } | null> {
	try {
		const { tables } = adminServices();
		const [booking, settings] = await Promise.all([
			tables.getRow({ databaseId: DATABASE_ID, tableId: 'bookings', rowId: order.productId }),
			tables.listRows({ databaseId: DATABASE_ID, tableId: 'coaching_settings', queries: [Query.limit(1)] })
		]);
		const coachPhone = String(settings.rows[0]?.whatsapp || '');
		const dateCustomerObj = appointment(String(booking.start_at || ''), String(booking.customer_timezone || 'America/Port-au-Prince'));
		const dateCoachObj = appointment(String(booking.start_at || ''), String(booking.coach_timezone || 'America/Port-au-Prince'));
		const clientPhone = String(booking.customer_whatsapp || order.customerPhone || '');
		return {
			customerPhone: clientPhone,
			customerDate: dateCustomerObj.date,
			customerTime: dateCustomerObj.time,
			customerText: `\n\nRendez-vous : ${dateCustomerObj.full}\nNuméro du coach : ${coachPhone || 'Consultez votre espace de réservation.'}`,
			coachPhone,
			dateCoach: dateCoachObj.full,
			coachText: `DJR Akademi — nouvelle réservation confirmée.\nClient : ${booking.customer_name || order.customerName}\nWhatsApp client : ${clientPhone || 'non renseigné'}\nCoaching : ${order.productTitle}\nRendez-vous : ${dateCoachObj.full}\nRéservation : ${order.productId}`,
			title: String(order.productTitle || 'Coaching')
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
			const { accessUrl } = purchaseAccessLinks(order);
			const text = `${order.id} Il y a un problème avec le bouton de connexion. Utilise plutôt ce lien de connexion : ${accessUrl}`;
			
			// Si c'est un coaching, on envoie d'abord la confirmation de réservation dédiée au client
			if (order.productType === 'coaching' && coaching) {
				try {
					const appUrl = publicAppUrl();
					await sendBookingConfirmedTemplate({
						to: recipient,
						booking: coaching.title,
						date: coaching.customerDate,
						hours: coaching.customerTime,
						link: `${appUrl}/bookings`
					});
					whatsappSent = true;
				} catch (bookingErr) {
					console.warn('[Purchase WhatsApp] Échec envoi booking_confirmed au client, tentative repli order :', bookingErr);
					whatsappSent = await sendWhatsappMessage(recipient, text, `Commande ${order.id}`);
				}
			} else {
				whatsappSent = await sendWhatsappMessage(recipient, text, `Commande ${order.id}`);
			}
		} else {
			console.info('[Purchase WhatsApp] Aucun numéro client pour la commande', order.id);
		}
		if (coaching?.coachPhone) {
			try {
				await sendCoachingBookingTemplate({
					to: coaching.coachPhone,
					date: coaching.dateCoach,
					number: coaching.customerPhone || phone || 'non renseigné'
				});
			} catch (templateErr) {
				console.warn('[Purchase WhatsApp] Échec envoi template coaching_booking au coach, repli message texte :', templateErr);
				await sendWhatsappMessage(coaching.coachPhone, coaching.coachText, `Coach — réservation ${order.productId}`).catch(() => undefined);
			}
		}
	} catch (error) {
		console.error('[Purchase WhatsApp] Préparation impossible pour la commande', order.id, error);
	}
	return { emailSent, whatsappSent };
}
