import { Client, ID, TablesDB } from 'node-appwrite';
import { canHoldSlot } from '../../shared/booking-rules.js';

const DATABASE_ID = process.env.COACHING_DATABASE_ID || 'djrakademi';
const TABLES = { services: 'coaching_services', slots: 'coaching_slots', bookings: 'bookings', payments: 'payments' };
const HOLD_MINUTES = 15;

function json(res, data, status = 200) {
  return res.json(data, status);
}

function safeBody(req) {
  if (req.bodyJson && typeof req.bodyJson === 'object') return req.bodyJson;
  try { return JSON.parse(req.bodyText || '{}'); } catch { return {}; }
}

function validEmail(value) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim()); }
function validPhone(value) { return /^\+[1-9]\d{7,14}$/.test(String(value || '').trim()); }
function validTimezone(value) { try { new Intl.DateTimeFormat('en', { timeZone: value }).format(); return true; } catch { return false; } }

function tablesClient() {
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT)
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
    .setKey(process.env.APPWRITE_FUNCTION_API_KEY);
  return new TablesDB(client);
}

async function createBooking(tables, body) {
  const { slotId, customerName, customerEmail, customerWhatsapp, customerTimezone, userId = null } = body;
  if (!slotId || !String(customerName || '').trim() || !validEmail(customerEmail) || !validPhone(customerWhatsapp) || !validTimezone(customerTimezone)) {
    return { error: 'Informations de réservation invalides.', status: 400 };
  }

  const tx = await tables.createTransaction({ ttl: 30 });
  try {
    const slot = await tables.getRow({ databaseId: DATABASE_ID, tableId: TABLES.slots, rowId: slotId, transactionId: tx.$id });
    if (!canHoldSlot(slot)) throw Object.assign(new Error('slot_unavailable'), { code: 409 });
    const service = await tables.getRow({ databaseId: DATABASE_ID, tableId: TABLES.services, rowId: slot.service_id, transactionId: tx.$id });
    if (!service.active) throw Object.assign(new Error('service_inactive'), { code: 409 });

    const now = new Date();
    const isFree = Boolean(service.is_free);
    const amount = isFree ? 0 : Number(service.price);
    const bookingId = ID.unique();
    const paymentId = isFree ? null : ID.unique();
    const holdExpiresAt = isFree ? null : new Date(now.getTime() + HOLD_MINUTES * 60_000).toISOString();
    const bookingStatus = isFree ? 'confirmed' : 'pending_payment';
    const slotStatus = isFree ? 'booked' : 'held';

    await tables.updateRow({ databaseId: DATABASE_ID, tableId: TABLES.slots, rowId: slot.$id, transactionId: tx.$id, data: { status: slotStatus } });
    await tables.createRow({
      databaseId: DATABASE_ID, tableId: TABLES.bookings, rowId: bookingId, transactionId: tx.$id,
      data: {
        service_id: service.$id, slot_id: slot.$id, user_id: userId, customer_name: String(customerName).trim(),
        customer_email: String(customerEmail).trim().toLowerCase(), customer_whatsapp: String(customerWhatsapp).trim(),
        customer_timezone: customerTimezone, coach_timezone: slot.coach_timezone, start_at: slot.start_at, end_at: slot.end_at,
        amount, currency: 'HTG', status: bookingStatus, payment_id: paymentId, hold_expires_at: holdExpiresAt,
        created_at: now.toISOString(), updated_at: now.toISOString()
      }
    });
    if (paymentId) {
      await tables.createRow({
        databaseId: DATABASE_ID, tableId: TABLES.payments, rowId: paymentId, transactionId: tx.$id,
        data: { booking_id: bookingId, provider: process.env.PAYMENT_PROVIDER || 'unconfigured', provider_transaction_id: '', amount, currency: 'HTG', status: 'pending', created_at: now.toISOString(), updated_at: now.toISOString(), paid_at: null, last_checked_at: null }
      });
    }
    await tables.updateTransaction({ transactionId: tx.$id, commit: true });
    return { bookingId, status: bookingStatus, paymentId, holdExpiresAt, amount, currency: 'HTG' };
  } catch (error) {
    await tables.updateTransaction({ transactionId: tx.$id, rollback: true }).catch(() => {});
    if (error?.code === 409 || error?.message === 'slot_unavailable' || error?.message === 'slot_past') return { error: 'Ce créneau n’est plus disponible.', status: 409 };
    throw error;
  }
}

async function createPayment(tables, body) {
  const booking = await tables.getRow({ databaseId: DATABASE_ID, tableId: TABLES.bookings, rowId: body.bookingId });
  if (booking.status !== 'pending_payment' || !booking.payment_id || new Date(booking.hold_expires_at) <= new Date()) return { error: 'Votre réservation a expiré.', status: 409 };
  const payment = await tables.getRow({ databaseId: DATABASE_ID, tableId: TABLES.payments, rowId: booking.payment_id });
  if (!process.env.PAYMENT_CREATE_URL) return { error: 'Le paiement n’est pas encore configuré.', status: 503 };

  const providerResponse = await fetch(process.env.PAYMENT_CREATE_URL, {
    method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${process.env.PAYMENT_PROVIDER_SECRET || ''}` },
    body: JSON.stringify({ bookingId: booking.$id, amount: payment.amount, currency: payment.currency, customerEmail: booking.customer_email, successUrl: `${process.env.PUBLIC_SITE_URL || ''}/booking/${booking.$id}/success` })
  });
  if (!providerResponse.ok) return { error: 'Impossible de créer le paiement.', status: 502 };
  const provider = await providerResponse.json();
  await tables.updateRow({ databaseId: DATABASE_ID, tableId: TABLES.payments, rowId: payment.$id, data: { provider_transaction_id: String(provider.transactionId || ''), provider: process.env.PAYMENT_PROVIDER || 'custom', updated_at: new Date().toISOString() } });
  return { bookingId: booking.$id, paymentUrl: provider.paymentUrl, holdExpiresAt: booking.hold_expires_at };
}

async function bookingStatus(tables, body) {
  if (!body.bookingId) return { error: 'Réservation introuvable.', status: 400 };
  const booking = await tables.getRow({ databaseId: DATABASE_ID, tableId: TABLES.bookings, rowId: body.bookingId });
  let paymentStatus = 'not_required';
  if (booking.payment_id) {
    const payment = await tables.getRow({ databaseId: DATABASE_ID, tableId: TABLES.payments, rowId: booking.payment_id });
    paymentStatus = payment.status;
  }
  return { bookingId: booking.$id, status: booking.status, paymentStatus };
}

export default async ({ req, res, error }) => {
  if (req.method !== 'POST') return json(res, { message: 'Méthode non autorisée.' }, 405);
  try {
    const body = safeBody(req);
    const tables = tablesClient();
    const result = body.action === 'create_payment' ? await createPayment(tables, body) : body.action === 'status' ? await bookingStatus(tables, body) : await createBooking(tables, body);
    if (result.error) return json(res, { message: result.error }, result.status);
    return json(res, result, 201);
  } catch (caught) {
    error(caught instanceof Error ? caught.message : String(caught));
    return json(res, { message: 'Impossible de créer la réservation.' }, 500);
  }
};
