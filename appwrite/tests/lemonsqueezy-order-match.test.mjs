import test from 'node:test';
import assert from 'node:assert/strict';
import { matchesPaidLemonOrder } from '../../src/lib/server/lemonsqueezy-order-match.ts';

const paidOrder = {
  id: 'lemon-123',
  attributes: {
    user_email: 'buyer@example.com',
    store_id: 42,
    status: 'paid',
    refunded: false,
    refunded_at: null,
    first_order_item: { variant_id: 501 }
  }
};

test('only a paid, non-refunded order for the account email and exact variant matches', () => {
  assert.equal(matchesPaidLemonOrder(paidOrder, 'buyer@example.com', '42', '501'), true);
  assert.equal(matchesPaidLemonOrder(paidOrder, 'someone-else@example.com', '42', '501'), false);
  assert.equal(matchesPaidLemonOrder(paidOrder, 'buyer@example.com', '99', '501'), false);
  assert.equal(matchesPaidLemonOrder(paidOrder, 'buyer@example.com', '42', '502'), false);
});

test('pending and refunded orders cannot unlock a product', () => {
  assert.equal(matchesPaidLemonOrder({ ...paidOrder, attributes: { ...paidOrder.attributes, status: 'pending' } }, 'buyer@example.com', '42', '501'), false);
  assert.equal(matchesPaidLemonOrder({ ...paidOrder, attributes: { ...paidOrder.attributes, refunded: true } }, 'buyer@example.com', '42', '501'), false);
  assert.equal(matchesPaidLemonOrder({ ...paidOrder, attributes: { ...paidOrder.attributes, refunded_at: '2026-09-01' } }, 'buyer@example.com', '42', '501'), false);
});
