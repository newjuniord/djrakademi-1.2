import { createHmac } from 'node:crypto';
import { env } from '$env/dynamic/private';

/**
 * Generates a permanent, deterministic HMAC token for a purchase access link.
 * This token never expires and allows the customer to access their purchase unlimited times.
 */
export function createPurchaseAccessToken(orderId: string, userId: string): string {
	const secret = env.APPWRITE_API_KEY || env.LEMONSQUEEZY_WEBHOOK_SECRET || 'djrakademi-permanent-purchase-secret';
	return createHmac('sha256', secret)
		.update(`purchase-access:${orderId}:${userId}`)
		.digest('hex');
}

/**
 * Verifies that a given HMAC token matches the expected signature for an order and user.
 */
export function verifyPurchaseAccessToken(orderId: string, userId: string, token: string): boolean {
	if (!orderId || !userId || !token) return false;
	const expected = createPurchaseAccessToken(orderId, userId);
	return token.trim().toLowerCase() === expected.toLowerCase();
}
