export type LemonOrder = {
  id?: string;
  attributes?: {
    status?: string;
    user_email?: string;
    store_id?: string | number;
    refunded?: boolean;
    refunded_at?: string | null;
    first_order_item?: { variant_id?: string | number; product_name?: string };
  };
};

export function matchesPaidLemonOrder(
  order: LemonOrder,
  email: string,
  storeId: string | undefined,
  variantId: string
): boolean {
  const attributes = order.attributes;
  return Boolean(
    String(order.id || '').trim() &&
    attributes &&
    String(attributes.user_email || '').trim().toLowerCase() === email &&
    (!storeId || String(attributes.store_id || '') === storeId) &&
    String(attributes.status || '').toLowerCase() === 'paid' &&
    !attributes.refunded &&
    !attributes.refunded_at &&
    String(attributes.first_order_item?.variant_id || '') === variantId
  );
}
