import { tables, account, DATABASE_ID } from '$lib/appwrite';
import { ID, Query } from 'appwrite';

export const COLLECTION_ORDERS = 'orders';

export interface Order {
	id: string;
	userId?: string;
	customerName: string;
	customerEmail: string;
	customerPhone?: string;
	productType: 'course' | 'ebook' | 'coaching';
	productId: string;
	productTitle: string;
	amount: number;
	currency: string;
	paymentProvider: 'moncash' | 'natcash' | 'carte' | 'card' | 'free' | 'admin' | 'lemonsqueezy';
	paymentId?: string;
	status: 'pending' | 'paid' | 'failed' | 'expired';
	createdAt: string;
	paidAt?: string;
}

export function mapOrderDoc(doc: any): Order {
	return {
		id: doc.$id,
		userId: doc.user_id,
		customerName: doc.customer_name || '',
		customerEmail: doc.customer_email || '',
		customerPhone: doc.customer_phone,
		productType: doc.product_type,
		productId: doc.product_id,
		productTitle: doc.product_title || '',
		amount: typeof doc.amount === 'number' ? doc.amount : 0,
		currency: doc.currency || 'HTG',
		paymentProvider: doc.payment_provider || 'free',
		paymentId: doc.payment_id,
		status: doc.status || 'pending',
		createdAt: doc.created_at || doc.$createdAt || new Date().toISOString(),
		paidAt: doc.paid_at
	};
}

export async function createOrder(data: Omit<Order, 'id' | 'createdAt'>): Promise<Order> {
	const now = new Date().toISOString();
	const orderId = ID.unique();
	const payload = {
		user_id: data.userId || undefined,
		customer_name: data.customerName,
		customer_email: data.customerEmail,
		customer_phone: data.customerPhone || undefined,
		product_type: data.productType,
		product_id: data.productId,
		product_title: data.productTitle,
		amount: data.amount,
		currency: data.currency || 'HTG',
		payment_provider: data.paymentProvider,
		payment_id: data.paymentId || undefined,
		status: data.status,
		created_at: now,
		paid_at: data.status === 'paid' ? now : data.paidAt || undefined,
	};

	let doc: any;
	try {
		doc = await tables.createRow(
			DATABASE_ID,
			COLLECTION_ORDERS,
			orderId,
			payload
		);
	} catch (e: any) {
		console.warn('[OrdersService] Appwrite createRow failed (permissions or network), creating client fallback order:', e?.message || e);
		doc = {
			$id: orderId,
			...payload,
			$createdAt: now,
			$updatedAt: now
		};
	}

	return mapOrderDoc(doc);
}

export async function getAllOrders(): Promise<Order[]> {
	try {
		const res = await tables.listRows(DATABASE_ID, COLLECTION_ORDERS, [
			Query.limit(100)
		]);
		return res.rows.map((doc: any) => mapOrderDoc(doc));
	} catch (e) {
		console.warn('[OrdersService] Failed to fetch orders:', e);
		return [];
	}
}

export async function getOrderById(id: string): Promise<Order | null> {
	try {
		const doc: any = await tables.getRow(DATABASE_ID, COLLECTION_ORDERS, id);
		return mapOrderDoc(doc);
	} catch (e) {
		console.warn(`[OrdersService] Failed to fetch order ${id}:`, e);
		return null;
	}
}

export async function getUserOrders(_userId?: string, _email?: string): Promise<Order[]> {
	try {
		const jwt = (await account.createJWT()).jwt;
		const response = await fetch("/api/account/orders", { headers: { Authorization: `Bearer ${jwt}` } });
		const data = await response.json().catch(() => ({}));
		if (!response.ok) throw new Error(data.message || "Impossible de charger vos transactions.");
		return Array.isArray(data.orders) ? data.orders : [];
	} catch (error) {
		console.warn("[OrdersService] Failed to fetch user orders:", error);
		return [];
	}
}

export async function updateOrderStatus(orderId: string, status: 'pending' | 'paid' | 'failed' | 'expired', paymentId?: string): Promise<Order> {
	const now = new Date().toISOString();
	const payload: any = {
		status,
		paid_at: status === 'paid' ? now : undefined
	};
	if (paymentId) payload.payment_id = paymentId;

	try {
		const doc: any = await tables.updateRow(DATABASE_ID, COLLECTION_ORDERS, orderId, payload);
		return mapOrderDoc(doc);
	} catch (e) {
		const existing = await getOrderById(orderId);
		if (existing) {
			existing.status = status;
			if (paymentId) existing.paymentId = paymentId;
			if (status === 'paid') existing.paidAt = now;
			return existing;
		}
		throw e;
	}
}
