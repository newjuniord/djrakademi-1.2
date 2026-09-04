import { Client, ID, Query, TablesDB } from 'node-appwrite';

const DATABASE_ID = process.env.PAYMENTS_DATABASE_ID || 'djrakademi';
const VERIFY_URL = process.env.PLOPPLOP_VERIFY_URL || 'https://plopplop.solutionip.app/api/paiement-verify';
const ORDER_EXPIRATION_MS = 30 * 60 * 1000; // 30 minutes
const MAX_EXPIRED_PER_RUN = 200;
const TABLES = {
  orders: 'orders',
  access: 'access_grants',
  bookings: 'bookings',
  slots: 'coaching_slots',
  logs: 'payment_logs'
};

function tablesClient(req) {
  const endpoint = process.env.APPWRITE_FUNCTION_API_ENDPOINT;
  const project = process.env.APPWRITE_FUNCTION_PROJECT_ID;
  const key = req?.headers?.['x-appwrite-key'] || process.env.APPWRITE_FUNCTION_API_KEY;
  if (!endpoint || !project || !key) throw new Error('Configuration Appwrite Function manquante.');
  return new TablesDB(new Client().setEndpoint(endpoint).setProject(project).setKey(key));
}

function providerConfig() {
  const clientId = String(process.env.PLOPPLOP_CLIENT_ID || '').trim();
  const apiKey = String(process.env.PLOPPLOP_API_KEY || process.env.PLOPPLOP_SECRET_KEY || '').trim();
  const headers = { 'Content-Type': 'application/json' };
  if (apiKey) {
    headers.Authorization = `Bearer ${apiKey}`;
    headers['x-api-key'] = apiKey;
  }
  return { clientId, headers, hasClient: Boolean(clientId) };
}

async function verifyOrder(order, config) {
  const payload = {
    client_id: config.clientId,
    refference_id: order.$id,
    ...(order.payment_id ? { transaction_id: order.payment_id } : {})
  };
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  try {
    const response = await fetch(VERIFY_URL, {
      method: 'POST',
      headers: config.headers,
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    const text = await response.text();
    let data = null;
    try { data = text ? JSON.parse(text) : null; } catch { /* handled below */ }
    return {
      statusCode: response.status,
      headers: Object.fromEntries(response.headers.entries()),
      data,
      rawBody: data ? undefined : text,
      invalidJson: Boolean(text && !data)
    };
  } finally {
    clearTimeout(timeout);
  }
}

function validatePaidResponse(order, verification) {
  if (verification.statusCode < 200 || verification.statusCode >= 300 || verification.invalidJson) {
    return { paid: false, reason: verification.invalidJson ? 'Réponse JSON invalide.' : `HTTP ${verification.statusCode}.` };
  }
  const data = verification.data;
  if (String(data?.trans_status || '').trim().toLowerCase() !== 'ok') {
    return { paid: false, reason: 'Transaction encore non confirmée.' };
  }
  const returnedReference = data?.refference_id ?? data?.reference_id;
  if (returnedReference != null && String(returnedReference) !== order.$id) {
    return { paid: false, reason: 'Référence retournée différente de la commande.' };
  }
  const rawAmount = data?.montant ?? data?.amount;
  if (rawAmount != null && (!Number.isFinite(Number(rawAmount)) || Number(rawAmount) !== Number(order.amount))) {
    return { paid: false, reason: 'Montant retourné différent de la commande.' };
  }
  const returnedTransaction = String(data?.transaction_id ?? data?.id_transaction ?? '').trim();
  if (order.payment_id && returnedTransaction && returnedTransaction !== String(order.payment_id)) {
    return { paid: false, reason: 'Identifiant de transaction différent de la commande.' };
  }
  return { paid: true, transactionId: returnedTransaction || String(order.payment_id || '') };
}

async function confirmPaidOrder(tables, order, transactionId) {
  const tx = await tables.createTransaction({ ttl: 60 });
  const now = new Date().toISOString();
  let accessAlreadyExisted = false;
  try {
    const current = await tables.getRow({
      databaseId: DATABASE_ID, tableId: TABLES.orders, rowId: order.$id, transactionId: tx.$id
    });
    if (current.status === 'paid') {
      await tables.updateTransaction({ transactionId: tx.$id, rollback: true });
      return { state: 'already_paid', accessAlreadyExisted: true };
    }
    if (current.status !== 'pending') {
      await tables.updateTransaction({ transactionId: tx.$id, rollback: true });
      return { state: 'skipped', accessAlreadyExisted: false };
    }

    if (current.product_type === 'course' || current.product_type === 'ebook') {
      if (!current.user_id) throw new Error('Commande sans utilisateur: accès impossible.');
      const access = await tables.listRows({
        databaseId: DATABASE_ID,
        tableId: TABLES.access,
        transactionId: tx.$id,
        ttl: 0,
        queries: [
          Query.equal('user_id', current.user_id),
          Query.equal('item_type', current.product_type),
          Query.equal('item_id', current.product_id),
          Query.limit(1)
        ]
      });
      accessAlreadyExisted = access.rows.length > 0;
      if (!accessAlreadyExisted) {
        await tables.createRow({
          databaseId: DATABASE_ID,
          tableId: TABLES.access,
          rowId: ID.unique(),
          transactionId: tx.$id,
          data: {
            user_id: current.user_id,
            item_type: current.product_type,
            item_id: current.product_id,
            granted_by: 'purchase',
            created_at: now
          }
        });
      }
    } else if (current.product_type === 'coaching') {
      const booking = await tables.getRow({
        databaseId: DATABASE_ID, tableId: TABLES.bookings, rowId: current.product_id, transactionId: tx.$id
      });
      if (current.user_id && booking.user_id && booking.user_id !== current.user_id) {
        throw new Error('La réservation appartient à un autre utilisateur.');
      }
      const slot = await tables.getRow({
        databaseId: DATABASE_ID, tableId: TABLES.slots, rowId: booking.slot_id, transactionId: tx.$id
      });
      const alreadyConfirmed = booking.status === 'confirmed' && booking.payment_status === 'paid';
      const canRecoverExpired = booking.status === 'expired' && slot.status === 'available';
      const canConfirmPending = booking.status === 'pending_payment' && slot.status === 'held';
      if (!alreadyConfirmed && !canRecoverExpired && !canConfirmPending) {
        throw new Error('Le créneau de coaching ne peut plus être confirmé automatiquement.');
      }
      accessAlreadyExisted = alreadyConfirmed;
      if (!alreadyConfirmed) {
        await tables.updateRow({
          databaseId: DATABASE_ID,
          tableId: TABLES.slots,
          rowId: slot.$id,
          transactionId: tx.$id,
          data: { status: 'booked' }
        });
        await tables.updateRow({
          databaseId: DATABASE_ID,
          tableId: TABLES.bookings,
          rowId: booking.$id,
          transactionId: tx.$id,
          data: {
            status: 'confirmed',
            payment_status: 'paid',
            payment_id: transactionId || undefined,
            hold_expires_at: null,
            updated_at: now
          }
        });
      }
    } else {
      throw new Error(`Type de produit non pris en charge: ${current.product_type}.`);
    }

    await tables.updateRow({
      databaseId: DATABASE_ID,
      tableId: TABLES.orders,
      rowId: current.$id,
      transactionId: tx.$id,
      data: { status: 'paid', payment_id: transactionId || undefined, paid_at: now }
    });
    await tables.updateTransaction({ transactionId: tx.$id, commit: true });
    return { state: 'confirmed', accessAlreadyExisted };
  } catch (caught) {
    await tables.updateTransaction({ transactionId: tx.$id, rollback: true }).catch(() => {});
    if (caught?.code === 409) return { state: 'race_lost', accessAlreadyExisted: true };
    throw caught;
  }
}

const SENSITIVE_LOG_KEY = /authorization|cookie|api[-_]?key|secret|password|token|client[-_]?id/i;

function sanitizeForLog(value, depth = 0) {
  if (depth > 8) return '[depth-limit]';
  if (value == null || typeof value === 'number' || typeof value === 'boolean') return value;
  if (typeof value === 'string') return value.length > 4000 ? value.slice(0, 4000) + '…[truncated]' : value;
  if (Array.isArray(value)) return value.slice(0, 100).map((item) => sanitizeForLog(item, depth + 1));
  if (typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).slice(0, 200).map(([key, item]) => [
      key,
      SENSITIVE_LOG_KEY.test(key) ? '[redacted]' : sanitizeForLog(item, depth + 1)
    ]));
  }
  return String(value);
}

function stringifyForLog(payload) {
  if (payload === undefined) return undefined;
  const serialized = JSON.stringify(sanitizeForLog(payload));
  if (serialized.length <= 24_000) return serialized;
  return JSON.stringify({ truncated: true, originalLength: serialized.length, preview: serialized.slice(0, 23_000) });
}

async function createCronLog(tables, order, { statusCode, requestPayload, responsePayload, errorMessage }) {
  const code = Math.max(100, Math.min(599, Number(statusCode) || 503));
  await tables.createRow({
    databaseId: DATABASE_ID,
    tableId: TABLES.logs,
    rowId: ID.unique(),
    data: {
      order_id: order.$id,
      payment_id: order.payment_id || undefined,
      event_type: 'cron_verification',
      status_code: code,
      request_payload: stringifyForLog(requestPayload),
      response_payload: stringifyForLog(responsePayload),
      error_message: errorMessage || undefined,
      created_at: new Date().toISOString()
    }
  }).catch(() => {});
}

async function writeLog(tables, order, verification, errorMessage) {
  return createCronLog(tables, order, {
    statusCode: verification?.statusCode || 503,
    requestPayload: {
      method: 'POST',
      endpoint: VERIFY_URL,
      headers: { 'Content-Type': 'application/json', Authorization: '[redacted]', 'x-api-key': '[redacted]' },
      body: {
        client_id: '[redacted]',
        refference_id: order.$id,
        ...(order.payment_id ? { transaction_id: order.payment_id } : {})
      }
    },
    responsePayload: verification ? {
      statusCode: verification.statusCode,
      headers: verification.headers,
      invalidJson: verification.invalidJson,
      body: verification.data ?? verification.rawBody
    } : undefined,
    errorMessage
  });
}

async function writeExpirationLog(tables, order) {
  return createCronLog(tables, order, {
    statusCode: 408,
    requestPayload: {
      source: 'payment-maintenance',
      action: 'expire_order',
      rule: 'pending_older_than_60_minutes',
      order_id: order.$id
    },
    responsePayload: { status: 'failed' },
    errorMessage: 'Commande expirée après 60 minutes.'
  });
}

async function processOrder(tables, order, config) {
  if (order.payment_provider === 'lemonsqueezy') {
    return { state: 'pending' };
  }
  if (!config.hasClient) {
    await writeLog(tables, order, undefined, 'PLOPPLOP_CLIENT_ID manquant.');
    return { state: 'error', message: 'PLOPPLOP_CLIENT_ID manquant dans l’environnement Appwrite.' };
  }
  let verification;
  try {
    verification = await verifyOrder(order, config);
    const validation = validatePaidResponse(order, verification);
    if (!validation.paid) {
      await writeLog(tables, order, verification, validation.reason);
      return { state: 'pending' };
    }
    const result = await confirmPaidOrder(tables, order, validation.transactionId);
    await writeLog(tables, order, verification, result.state === 'skipped' ? 'Commande déjà finalisée autrement.' : undefined);
    return result;
  } catch (caught) {
    const message = caught instanceof Error ? caught.message : String(caught);
    await writeLog(tables, order, verification, message);
    return { state: 'error', message };
  }
}

async function expireOldOrder(tables, order) {
  const tx = await tables.createTransaction({ ttl: 60 });
  try {
    const current = await tables.getRow({
      databaseId: DATABASE_ID, tableId: TABLES.orders, rowId: order.$id, transactionId: tx.$id
    });
    const createdAt = new Date(current.created_at || current.$createdAt).getTime();
    if (current.status !== 'pending' || !Number.isFinite(createdAt) || Date.now() - createdAt < ORDER_EXPIRATION_MS) {
      await tables.updateTransaction({ transactionId: tx.$id, rollback: true });
      return false;
    }
    await tables.updateRow({
      databaseId: DATABASE_ID,
      tableId: TABLES.orders,
      rowId: current.$id,
      transactionId: tx.$id,
      data: { status: 'expired' }
    });
    await tables.updateTransaction({ transactionId: tx.$id, commit: true });
    await writeExpirationLog(tables, order);
    return true;
  } catch (caught) {
    await tables.updateTransaction({ transactionId: tx.$id, rollback: true }).catch(() => {});
    if (caught?.code === 409) return false;
    throw caught;
  }
}

async function expireOldOrders(tables, cutoff) {
  let expired = 0;
  while (expired < MAX_EXPIRED_PER_RUN) {
    const batch = await tables.listRows({
      databaseId: DATABASE_ID,
      tableId: TABLES.orders,
      ttl: 0,
      queries: [
        Query.equal('status', ['pending']),
        Query.lessThan('created_at', cutoff),
        Query.orderAsc('created_at'),
        Query.limit(Math.min(50, MAX_EXPIRED_PER_RUN - expired))
      ]
    });
    if (!batch.rows.length) break;
    const results = await Promise.all(batch.rows.map((order) => expireOldOrder(tables, order)));
    const changed = results.filter(Boolean).length;
    expired += changed;
    if (changed === 0) break;
  }
  return expired;
}

export default async ({ req, res, log, error }) => {
  try {
    const tables = tablesClient(req);
    const config = providerConfig();
    const cutoff = new Date(Date.now() - ORDER_EXPIRATION_MS).toISOString();
    const expired = await expireOldOrders(tables, cutoff);
    const pendingOrders = await tables.listRows({
      databaseId: DATABASE_ID,
      tableId: TABLES.orders,
      ttl: 0,
      queries: [
        Query.equal('status', ['pending']),
        Query.greaterThanEqual('created_at', cutoff),
        Query.orderAsc('created_at'),
        Query.limit(50)
      ]
    });
    const results = [];
    for (let index = 0; index < pendingOrders.rows.length; index += 5) {
      const batch = pendingOrders.rows.slice(index, index + 5);
      results.push(...await Promise.all(batch.map((order) => processOrder(tables, order, config))));
    }
    const summary = {
      checked: results.length,
      expired,
      confirmed: results.filter((item) => item.state === 'confirmed').length,
      alreadyOwned: results.filter((item) => item.accessAlreadyExisted).length,
      pending: results.filter((item) => item.state === 'pending').length,
      skipped: results.filter((item) => ['already_paid', 'skipped', 'race_lost'].includes(item.state)).length,
      errors: results.filter((item) => item.state === 'error').length
    };
    log(`Commandes expirées: ${summary.expired}; vérifiées: ${summary.checked}; confirmées: ${summary.confirmed}; en attente: ${summary.pending}; erreurs: ${summary.errors}`);
    return res.json(summary);
  } catch (caught) {
    const message = caught instanceof Error ? caught.message : String(caught);
    error(`[payment-maintenance error]: ${message}`);
    return res.json({ success: false, message: 'Vérification automatique impossible.', error: message }, 500);
  }
};
