import test from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { matchesPlopplopOrder, parsePlopplopWebhook, verifyPlopplopSignature } from './plopplop-webhook.ts';

const event = {
	event: 'transaction.status_changed', timestamp: '2026-09-16T15:31:20+00:00',
	transaction: { transaction_id: 'tx-123', reference_id: 'order-1', amount: 250, new_status: 'ok' },
	merchant: { client_id: 'merchant-1' }
};

test('signature requires the exact raw JSON body and configured secret', () => {
	const raw = JSON.stringify(event);
	const header = `sha256=${createHmac('sha256', 'private-secret').update(raw).digest('hex')}`;
	assert.equal(verifyPlopplopSignature(raw, header, 'private-secret'), true);
	assert.equal(verifyPlopplopSignature(`${raw} `, header, 'private-secret'), false);
	assert.equal(verifyPlopplopSignature(raw, header, 'wrong-secret'), false);
	assert.equal(verifyPlopplopSignature(raw, null, 'private-secret'), false);
	assert.equal(verifyPlopplopSignature(raw, header, ''), false);
});

test('only a valid merchant and supported status event parse', () => {
	const raw = JSON.stringify(event);
	assert.equal(parsePlopplopWebhook(raw, 'merchant-1')?.transaction.new_status, 'ok');
	assert.equal(parsePlopplopWebhook(raw, 'another-merchant'), null);
	assert.equal(parsePlopplopWebhook(JSON.stringify({ ...event, transaction: { ...event.transaction, new_status: 'paid' } }), 'merchant-1'), null);
	assert.equal(parsePlopplopWebhook(JSON.stringify({ ...event, transaction: { ...event.transaction, amount: '250' } }), 'merchant-1'), null);
	assert.equal(parsePlopplopWebhook('invalid', 'merchant-1'), null);
	assert.equal(parsePlopplopWebhook(JSON.stringify({ ...event, event: 'transaction.created', transaction: { ...event.transaction, new_status: undefined } }), 'merchant-1')?.event, 'transaction.created');
});

test('order must match provider, amount and transaction', () => {
	const order = { payment_provider: 'moncash', amount: 250, payment_id: 'tx-123' };
	assert.equal(matchesPlopplopOrder(order, event.transaction), true);
	assert.equal(matchesPlopplopOrder({ ...order, payment_provider: 'lemonsqueezy' }, event.transaction), false);
	assert.equal(matchesPlopplopOrder({ ...order, amount: 251 }, event.transaction), false);
	assert.equal(matchesPlopplopOrder({ ...order, payment_id: 'another' }, event.transaction), false);
});
