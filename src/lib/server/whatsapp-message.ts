import { env } from '$env/dynamic/private';
import { adminServices, DATABASE_ID, SETTINGS_ROW_ID, SETTINGS_TABLE } from '$lib/server/admin-appwrite';
import { sendOrderConfirmationTemplate, normalizeWhatsappNumber } from '$lib/server/whatsapp';
export { normalizeWhatsappNumber };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function postWhatsapp(number: string, text: string): Promise<void> {
	await sendOrderConfirmationTemplate({
		to: number,
		orderNumberText: text
	});
}

async function alertWhatsappFailure(context: string, number: string, reason: string): Promise<void> {
	let contactEmail = '';
	let officialNumber = '';
	try {
		const { tables } = adminServices();
		const settings: any = await tables.getRow({ databaseId: DATABASE_ID, tableId: SETTINGS_TABLE, rowId: SETTINGS_ROW_ID });
		contactEmail = String(settings.contact_email || '').trim();
		officialNumber = String(settings.whatsapp_number || '').trim();
	} catch (error) {
		console.error('[WhatsApp] Paramètres de contact indisponibles :', error);
	}

	const subject = `[DJR Akademi] Échec d’envoi WhatsApp — ${context}`;
	const body = `L’envoi WhatsApp a échoué.\nContexte : ${context}\nDestinataire : ${number}\nErreur : ${reason}\n\nAucun lien de connexion n’est inclus dans cette alerte.`;
	const recipients = [...new Set([env.CONTACT_TO_EMAIL?.trim(), contactEmail].filter((value): value is string => Boolean(value && EMAIL_PATTERN.test(value))))];
	const resendKey = env.RESEND_API_KEY?.trim();
	if (resendKey && recipients.length) {
		const fromValue = env.CONTACT_FROM_EMAIL?.trim() || 'contact@djrakademi.net';
		const from = fromValue.includes('<') ? fromValue : `DJR Akademi <${fromValue}>`;
		try {
			const response = await fetch('https://api.resend.com/emails', {
				method: 'POST',
				headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
				body: JSON.stringify({ from, to: recipients, subject, text: body }),
				signal: AbortSignal.timeout(12_000)
			});
			if (!response.ok) console.error('[WhatsApp] Alerte e-mail refusée :', response.status);
		} catch (error) {
			console.error('[WhatsApp] Alerte e-mail impossible :', error);
		}
	}

	const backupNumber = env.WHATSAPP_BACKUP_NUMBER?.trim() || '';
	const alertNumbers = [officialNumber, backupNumber]
		.map(normalizeWhatsappNumber)
		.filter((value): value is string => Boolean(value && value !== number));
	for (const alertNumber of new Set(alertNumbers)) {
		try {
			await postWhatsapp(alertNumber, `${subject}\nDestinataire : ${number}\nErreur : ${reason}`);
			return;
		} catch (error) {
			console.error('[WhatsApp] Alerte WhatsApp impossible pour', alertNumber, error);
		}
	}
}

export async function sendWhatsappMessage(numberInput: string, text: string, context: string): Promise<boolean> {
	const number = normalizeWhatsappNumber(numberInput);
	if (!number || !text.trim() || text.length > 10_000) throw new Error('Numéro ou message WhatsApp invalide.');
	try {
		await postWhatsapp(number, text);
		return true;
	} catch (error) {
		const reason = error instanceof Error ? error.message : String(error);
		console.error('[WhatsApp] Envoi impossible :', context, number, reason);
		await alertWhatsappFailure(context, number, reason);
		return false;
	}
}
