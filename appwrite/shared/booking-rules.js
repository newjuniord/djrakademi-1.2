export function canHoldSlot(slot, now = new Date()) {
  return slot.status === 'available' && new Date(slot.start_at) > now;
}

export function pendingBookingAction(paymentStatus, holdExpiresAt, now = new Date()) {
  if (paymentStatus === 'paid') return 'confirm';
  if (paymentStatus === 'failed' || paymentStatus === 'expired') return 'expire';
  if (holdExpiresAt && new Date(holdExpiresAt) <= now) return 'expire';
  return 'wait';
}

export function transitionState(action) {
  if (action === 'confirm') return { booking: 'confirmed', slot: 'booked', payment: 'paid' };
  if (action === 'expire') return { booking: 'expired', slot: 'available', payment: 'expired' };
  return null;
}
