import type { Order } from '$lib/services/orders';
import { account } from '$lib/appwrite';

export interface InitiatePaymentParams {
	userId?: string;
	customerName: string;
	customerEmail: string;
	customerPhone?: string;
	productType: 'course' | 'ebook' | 'coaching';
	productId: string;
	productTitle: string;
	amount: number;
	bookingId?: string;
	paymentMethod?: 'moncash' | 'natcash' | 'carte';
}

export interface PaymentInitiationResult {
	success: boolean;
	status?: boolean;
	orderId: string;
	paymentId: string;
	transaction_id?: string;
	url?: string;
	redirectUrl: string;
	message?: string;
}

export interface PaymentConfirmationResult {
	success: boolean;
	order: Order | null;
	message: string;
	emailSent?: boolean;
}

export async function paymentJwt(): Promise<string> {
	return (await account.createJWT()).jwt;
}

export async function initiatePlopplopPayment(
	params: InitiatePaymentParams
): Promise<PaymentInitiationResult> {
	try {
		const jwt = await paymentJwt();
		const response = await fetch('/api/payments/create', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jwt}` },
			body: JSON.stringify({
				productType: params.productType,
				productId: params.productId,
				bookingId: params.bookingId,
				paymentMethod: params.paymentMethod
			})
		});
		const data = await response.json();
		return response.ok ? data : { ...data, success: false };
	} catch (error) {
		return {
			success: false,
			orderId: '',
			paymentId: '',
			redirectUrl: '',
			message: error instanceof Error ? error.message : 'Erreur de connexion au serveur de paiement.'
		};
	}
}

export async function confirmPlopplopPayment(orderId: string): Promise<PaymentConfirmationResult> {
	try {
		const jwt = await paymentJwt();
		const response = await fetch('/api/payments/confirm', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jwt}` },
			body: JSON.stringify({ orderId })
		});
		return await response.json();
	} catch (error) {
		return {
			success: false,
			order: null,
			message: error instanceof Error ? error.message : 'Erreur de connexion au serveur de vérification.'
		};
	}
}

export async function verifyPlopplopReference(reference: string) {
	try {
		const jwt = await paymentJwt();
		const response = await fetch('/api/plopplop/verify', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jwt}` },
			body: JSON.stringify({ reference })
		});
		const data = await response.json();
		return { status: response.status, ok: response.ok, ...data };
	} catch (error) {
		return {
			success: false,
			message: error instanceof Error ? error.message : 'Erreur de connexion lors de la vérification.'
		};
	}
}

export async function verifyLemonSqueezyEmail(email: string) {
	try {
		const jwt = await paymentJwt();
		const response = await fetch('/api/lemonsqueezy/verify', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jwt}` },
			body: JSON.stringify({ email })
		});
		const data = await response.json();
		return { status: response.status, ok: response.ok, ...data };
	} catch (error) {
		return {
			success: false,
			message: error instanceof Error ? error.message : 'Erreur de connexion lors de la vérification.'
		};
	}
}
