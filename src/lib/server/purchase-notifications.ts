import { Query } from 'node-appwrite';
import type { Order } from '$lib/services/orders';
import { adminServices, DATABASE_ID } from '$lib/server/admin-appwrite';
import { sendPurchaseConfirmationEmail, purchaseAccessLinks, publicAppUrl } from '$lib/server/purchase-email';
import { sendWhatsappMessage } from '$lib/server/whatsapp-message';
import { sendCoachingBookingTemplate, sendBookingConfirmedTemplate, sendCourseAccessV2Template, normalizeWhatsappNumber } from '$lib/server/whatsapp';

async function resolveUserWhatsappPhone(userId?: string, fallbackPhone?: string): Promise<string> {
	if (fallbackPhone) return fallbackPhone;
	if (!userId) return '';
	try {
		const { tables, users } = adminServices();
		const result = await tables.listRows({
			databaseId: DATABASE_ID, tableId: 'profiles',
			queries: [Query.equal('user_id', userId), Query.limit(1)]
		});
		if (result.rows[0]?.whatsapp) return String(result.rows[0].whatsapp);
		const user = await users.get({ userId });
		return String(user.phone || '');
	} catch (error) {
		console.error('[Purchase WhatsApp] Profil indisponible :', error);
		return '';
	}
}

async function customerPhone(order: Order): Promise<string> {
	return resolveUserWhatsappPhone(order.userId, order.customerPhone);
}

/**
 * Envoie le template WhatsApp `course_access_v2` une fois l'accès au cours accordé.
 */
export async function notifyCourseAccessGranted(input: {
	userId?: string;
	phone?: string;
	courseId: string;
	courseTitle: string;
	customerName?: string;
	accessUrl?: string;
}): Promise<boolean> {
	const recipient = await resolveUserWhatsappPhone(input.userId, input.phone);
	if (!recipient) return false;
	const accessUrl = input.accessUrl || `${publicAppUrl()}/learn/${encodeURIComponent(input.courseId)}`;
	try {
		await sendCourseAccessV2Template({
			to: recipient,
			courseTitle: input.courseTitle || 'Formation',
			accessUrl,
			customerName: input.customerName || undefined
		});
		return true;
	} catch (error) {
		console.warn('[Course Access WhatsApp] Échec envoi template course_access_v2 :', error);
		return false;
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
			const accessLink = new URL(purchaseAccessLinks(order).accessUrl);
			if (order.productType === 'coaching') accessLink.searchParams.set('next', '/bookings');
			const accessUrl = accessLink.toString();
			const text = `${order.id} Il y a un problème avec le bouton de connexion. Utilise plutôt ce lien de connexion : ${accessUrl}`;
			
			// Si c'est un coaching, on envoie d'abord la confirmation de réservation dédiée au client
			if (order.productType === 'coaching' && coaching) {
				try {
					const coachContact = normalizeWhatsappNumber(coaching.coachPhone);
					await sendBookingConfirmedTemplate({
						to: recipient,
						booking: coaching.title,
						date: coaching.customerDate,
						hours: coaching.customerTime,
						link: coachContact
							? `Le numéro du coach : +${coachContact} - Le lien : ${accessUrl}`
							: `Le lien : ${accessUrl}`
					});
					whatsappSent = true;
				} catch (bookingErr) {
					console.warn('[Purchase WhatsApp] Échec envoi booking_confirmed au client, tentative repli order :', bookingErr);
					whatsappSent = await sendWhatsappMessage(recipient, text, `Commande ${order.id}`);
				}
			} else if (order.productType === 'course') {
				try {
					await sendCourseAccessV2Template({
						to: recipient,
						courseTitle: order.productTitle || 'Formation',
						accessUrl,
						customerName: order.customerName || undefined
					});
					whatsappSent = true;
				} catch (courseErr) {
					console.warn('[Purchase WhatsApp] Échec envoi course_access_v2 au client, tentative repli order :', courseErr);
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
