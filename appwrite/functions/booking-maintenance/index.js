import { Client, Query, TablesDB } from 'node-appwrite';

const DATABASE_ID = process.env.COACHING_DATABASE_ID || 'djrakademi';
const TABLES = { slots: 'coaching_slots', bookings: 'bookings', payments: 'payments' };
const MAX_EXPIRED_PER_RUN = 200;

function tablesClient(req) {
  const endpoint = process.env.APPWRITE_FUNCTION_API_ENDPOINT;
  const project = process.env.APPWRITE_FUNCTION_PROJECT_ID;
  const key = req?.headers?.['x-appwrite-key'] || process.env.APPWRITE_FUNCTION_API_KEY;
  if (!endpoint || !project || !key) throw new Error('Configuration Appwrite Function manquante.');
  return new TablesDB(new Client().setEndpoint(endpoint).setProject(project).setKey(key));
}

async function expireBooking(tables, booking, now) {
  const tx = await tables.createTransaction({ ttl: 60 });
  try {
    const current = await tables.getRow({
      databaseId: DATABASE_ID, tableId: TABLES.bookings, rowId: booking.$id, transactionId: tx.$id
    });
    const expiresAt = current.hold_expires_at ? new Date(current.hold_expires_at).getTime() : NaN;
    if (current.status !== 'pending_payment' || !Number.isFinite(expiresAt) || expiresAt >= Date.now()) {
      await tables.updateTransaction({ transactionId: tx.$id, rollback: true });
      return false;
    }

    const slot = await tables.getRow({
      databaseId: DATABASE_ID, tableId: TABLES.slots, rowId: current.slot_id, transactionId: tx.$id
    });
    if (slot.status !== 'held' && slot.status !== 'available') {
      await tables.updateTransaction({ transactionId: tx.$id, rollback: true });
      return false;
    }

    if (slot.status === 'held') {
      await tables.updateRow({
        databaseId: DATABASE_ID, tableId: TABLES.slots, rowId: slot.$id,
        transactionId: tx.$id, data: { status: 'available' }
      });
    }
    await tables.updateRow({
      databaseId: DATABASE_ID, tableId: TABLES.bookings, rowId: current.$id,
      transactionId: tx.$id,
      data: { status: 'expired', payment_status: 'expired', hold_expires_at: null, updated_at: now }
    });

    if (current.payment_id) {
      const payment = await tables.getRow({
        databaseId: DATABASE_ID, tableId: TABLES.payments,
        rowId: current.payment_id, transactionId: tx.$id
      }).catch(() => null);
      if (payment?.status === 'pending') {
        await tables.updateRow({
          databaseId: DATABASE_ID, tableId: TABLES.payments, rowId: payment.$id,
          transactionId: tx.$id,
          data: { status: 'expired', last_checked_at: now, updated_at: now }
        });
      }
    }

    await tables.updateTransaction({ transactionId: tx.$id, commit: true });
    return true;
  } catch (caught) {
    await tables.updateTransaction({ transactionId: tx.$id, rollback: true }).catch(() => {});
    if (caught?.code === 409) return false;
    throw caught;
  }
}

export default async ({ req, res, log, error }) => {
  try {
    const tables = tablesClient(req);
    const now = new Date().toISOString();
    const expiredHolds = await tables.listRows({
      databaseId: DATABASE_ID,
      tableId: TABLES.bookings,
      ttl: 0,
      queries: [
        Query.equal('status', ['pending_payment']),
        Query.lessThan('hold_expires_at', now),
        Query.orderAsc('hold_expires_at'),
        Query.limit(MAX_EXPIRED_PER_RUN)
      ]
    });

    const results = [];
    for (let index = 0; index < expiredHolds.rows.length; index += 10) {
      const batch = expiredHolds.rows.slice(index, index + 10);
      results.push(...await Promise.allSettled(batch.map((booking) => expireBooking(tables, booking, now))));
    }
    const expired = results.filter((result) => result.status === 'fulfilled' && result.value).length;
    const errors = results.filter((result) => result.status === 'rejected').length;
    log(`Réservations examinées: ${expiredHolds.rows.length}; expirées: ${expired}; erreurs: ${errors}`);
    return res.json({ checked: expiredHolds.rows.length, expired, errors });
  } catch (caught) {
    const message = caught instanceof Error ? caught.message : String(caught);
    error(message);
    return res.json({ message: 'Maintenance des réservations impossible.' }, 500);
  }
};
