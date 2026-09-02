import test from 'node:test';
import assert from 'node:assert/strict';
import { canHoldSlot, pendingBookingAction, transitionState } from './booking-rules.js';

const now = new Date('2026-08-28T20:00:00.000Z');

test('only a future available slot can be held', () => {
  assert.equal(canHoldSlot({ status: 'available', start_at: '2026-08-29T18:00:00.000Z' }, now), true);
  assert.equal(canHoldSlot({ status: 'held', start_at: '2026-08-29T18:00:00.000Z' }, now), false);
  assert.equal(canHoldSlot({ status: 'available', start_at: '2026-08-27T18:00:00.000Z' }, now), false);
});

test('an unconfirmed payment never confirms a booking', () => {
  assert.equal(pendingBookingAction('pending', '2026-08-28T20:10:00.000Z', now), 'wait');
  assert.equal(transitionState('wait'), null);
});

test('only a paid payment books the slot', () => {
  assert.equal(pendingBookingAction('paid', '2026-08-28T20:10:00.000Z', now), 'confirm');
  assert.deepEqual(transitionState('confirm'), { booking: 'confirmed', slot: 'booked', payment: 'paid' });
});

test('expired holds release their slot', () => {
  assert.equal(pendingBookingAction('pending', '2026-08-28T19:59:00.000Z', now), 'expire');
  assert.deepEqual(transitionState('expire'), { booking: 'expired', slot: 'available', payment: 'expired' });
});
