import { env } from '$env/dynamic/private';
import { adminServices, DATABASE_ID } from '$lib/server/admin-appwrite';
import { parseBundleItems } from '$lib/server/bundles';
import { matchesPaidLemonOrder, type LemonOrder } from '$lib/server/lemonsqueezy-order-match';
import { ID, Query, type TablesDB } from 'node-appwrite';

type PurchaseType = 'course' | 'ebook' | 'bundle';

async function grantAccessIfMissing(
  tables: TablesDB,
  userId: string,
  itemType: 'course' | 'ebook',
  itemId: string,
  transactionId: string,
  createdAt: string
): Promise<boolean> {
  const existing = await tables.listRows({
    databaseId: DATABASE_ID,
    tableId: 'access_grants',
    transactionId,
    ttl: 0,
    queries: [
      Query.equal('user_id', userId),
      Query.equal('item_type', itemType),
      Query.equal('item_id', itemId),
      Query.limit(1)
    ]
  });
  if (existing.rows.length) return false;

  await tables.createRow({
    databaseId: DATABASE_ID,
    tableId: 'access_grants',
    rowId: ID.unique(),
    transactionId,
    data: {
      user_id: userId,
      item_type: itemType,
      item_id: itemId,
      granted_by: 'purchase',
      created_at: createdAt
    }
  });
  return true;
}

export async function verifyPurchaseBeforeCheckout(
  email: string,
  userId: string,
  productType: PurchaseType,
  productId: string
) {
  const normalizedEmail = email.trim().toLowerCase();
  const apiKey = env.LEMONSQUEEZY_API_KEY?.trim();
  if (!apiKey) throw new Error('Vérification Lemon Squeezy indisponible pour le moment. Tanpri eseye ankò.');

  const { tables } = adminServices();

  const previousClaims = await tables.listRows({ databaseId: DATABASE_ID, tableId: "verification_logs", queries: [Query.equal("input_value", normalizedEmail), Query.equal("status", "success"), Query.limit(25)] }).catch(() => ({ rows: [] }));
  const foreignClaim = previousClaims.rows.find((row: any) => row.user_id && row.user_id !== userId);
  if (foreignClaim) return { success: false, notFound: false, alreadyClaimed: true, message: `Imel ${normalizedEmail} la deja bay aksè sou yon lòt kont. Tanpri konekte ak kont ki te resevwa aksè a.` };
  const tableId = productType === 'course' ? 'courses' : productType === 'ebook' ? 'ebooks' : 'bundles';
  const product: any = await tables.getRow({ databaseId: DATABASE_ID, tableId, rowId: productId });
  const title = String(product.title || 'Pwogram');
  const variantId = String(product.lemonsqueezy_variant_id || product.variant_id || '').trim();
  if (!variantId) {
    return { success: false, notFound: true, message: `Pa gen okenn acha Lemon Squeezy pou ${title} ak imel ${normalizedEmail}.` };
  }

  const storeId = env.LEMONSQUEEZY_STORE_ID?.trim();
  const url = new URL('https://api.lemonsqueezy.com/v1/orders');
  url.searchParams.set('filter[user_email]', normalizedEmail);
  if (storeId) url.searchParams.set('filter[store_id]', storeId);
  url.searchParams.set('page[size]', '100');
  const headers = {
    Accept: 'application/vnd.api+json',
    'Content-Type': 'application/vnd.api+json',
    Authorization: `Bearer ${apiKey}`
  };

  for (let pageNumber = 1; pageNumber <= 20; pageNumber++) {
    url.searchParams.set('page[number]', String(pageNumber));
    const response = await fetch(url, { headers });
    if (!response.ok) throw new Error('Vérification Lemon Squeezy indisponible pour le moment. Tanpri eseye ankò.');
    const body = await response.json();
    if (!Array.isArray(body?.data)) throw new Error('Repons Lemon Squeezy pa valab. Tanpri eseye ankò.');

    for (const order of body.data as LemonOrder[]) {
      if (!matchesPaidLemonOrder(order, normalizedEmail, storeId, variantId)) continue;
      const attributes = order.attributes!;
      const orderId = String(order.id).trim();

      // A Lemon order already attached to another account cannot be reclaimed.
      const claimed = await tables.listRows({
        databaseId: DATABASE_ID,
        tableId: 'orders',
        queries: [Query.equal('payment_id', orderId), Query.equal('status', 'paid'), Query.limit(1)]
      });
      if (claimed.rows.some((row: any) => row.user_id && row.user_id !== userId)) continue;

      const transaction = await tables.createTransaction({ ttl: 60 });
      try {
        const createdAt = new Date().toISOString();
        let grantedCount = 0;
        if (productType === 'bundle') {
          const items = parseBundleItems(product.items_json);
          if (!items.length) throw new Error('Bundle la pa gen okenn kou oswa ebook valab.');
          for (const item of items) {
            if (await grantAccessIfMissing(tables, userId, item.type, item.id, transaction.$id, createdAt)) {
              grantedCount++;
            }
          }
        } else if (await grantAccessIfMissing(tables, userId, productType, productId, transaction.$id, createdAt)) {
          grantedCount = 1;
        }

        if (grantedCount > 0) {
          const details = JSON.stringify({
            email: normalizedEmail,
            status: attributes.status,
            variant_id: attributes.first_order_item?.variant_id,
            store_id: attributes.store_id,
            refunded: attributes.refunded,
            product_name: attributes.first_order_item?.product_name,
            access_grants_created: grantedCount
          });
          const logMessage = `Statut: success | Produit débloqué: ${title} | Lemon Order ID: ${orderId} | Détails de la réponse API: ${details}`;
          await tables.createRow({
            databaseId: DATABASE_ID,
            tableId: 'verification_logs',
            rowId: ID.unique(),
            transactionId: transaction.$id,
            data: {
              user_id: userId,
              input_value: normalizedEmail,
              method: 'carte',
              status: 'success',
              message: logMessage.slice(0, 1000),
              granted_items: title.slice(0, 500),
              created_at: createdAt
            }
          });
        }
        await tables.updateTransaction({ transactionId: transaction.$id, commit: true });
      } catch (error) {
        await tables.updateTransaction({ transactionId: transaction.$id, rollback: true }).catch(() => undefined);
        throw error;
      }

      return {
        success: true,
        notFound: false,
        message: `Ou te deja achte pwogram sa a sou Lemon Squeezy ! Aksè w la debloke ak siksè. Imel: ${normalizedEmail}`,
        productType,
        productId
      };
    }

    if (!body.links?.next) {
      return { success: false, notFound: true, message: `Pa gen okenn acha Lemon Squeezy pou ${title} ak imel ${normalizedEmail}.` };
    }
  }
  throw new Error('Gen twòp acha pou verifye. Tanpri eseye ankò pita.');
}
