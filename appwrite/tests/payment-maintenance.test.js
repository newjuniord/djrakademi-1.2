import test from 'node:test';
import assert from 'node:assert/strict';
import { confirmPaidOrder } from '../functions/payment-maintenance/index.js';

function makeTables(order, { bundleItems, existing = [] } = {}) {
  const calls = [];
  const owned = new Set(existing);
  const tables = {
    async createTransaction() {
      calls.push({ action: 'transaction' });
      return { $id: 'tx-1' };
    },
    async getRow({ tableId, rowId, transactionId }) {
      assert.equal(transactionId, 'tx-1');
      calls.push({ action: 'get', tableId, rowId });
      if (tableId === 'orders') return order;
      if (tableId === 'bundles') return { $id: rowId, items_json: bundleItems };
      throw new Error(`Unexpected table: ${tableId}`);
    },
    async listRows({ tableId, transactionId, queries }) {
      assert.equal(tableId, 'access_grants');
      assert.equal(transactionId, 'tx-1');
      const parsed = queries.map((query) => JSON.parse(query));
      const valueFor = (attribute) => parsed.find((query) => query.attribute === attribute)?.values[0];
      const userId = valueFor('user_id');
      const type = valueFor('item_type');
      const id = valueFor('item_id');
      calls.push({ action: 'list', userId, type, id });
      return { rows: owned.has(`${type}:${id}`) ? [{ $id: 'existing' }] : [] };
    },
    async createRow({ tableId, transactionId, data }) {
      assert.equal(tableId, 'access_grants');
      assert.equal(transactionId, 'tx-1');
      calls.push({ action: 'grant', data });
      owned.add(`${data.item_type}:${data.item_id}`);
    },
    async updateRow({ tableId, transactionId, data }) {
      assert.equal(tableId, 'orders');
      assert.equal(transactionId, 'tx-1');
      calls.push({ action: 'update', data });
    },
    async updateTransaction({ transactionId, commit, rollback }) {
      assert.equal(transactionId, 'tx-1');
      calls.push({ action: commit ? 'commit' : rollback ? 'rollback' : 'unknown' });
    }
  };
  return { tables, calls };
}

function pendingBundle(overrides = {}) {
  return {
    $id: 'order-1', status: 'pending', product_type: 'bundle',
    product_id: 'bundle-1', user_id: 'user-1', ...overrides
  };
}

test('bundle snapshot grants each missing course or ebook before marking paid', async () => {
  const order = pendingBundle({
    bundle_items_json: JSON.stringify([
      { type: 'course', id: 'course-1' },
      { type: 'ebook', id: 'ebook-1' },
      { type: 'ebook', id: 'ebook-1' },
      { type: 'coaching', id: 'booking-1' }
    ])
  });
  const { tables, calls } = makeTables(order, { existing: ['course:course-1'] });

  const result = await confirmPaidOrder(tables, order, 'payment-1');

  assert.deepEqual(result, { state: 'confirmed', accessAlreadyExisted: false });
  assert.deepEqual(calls.filter((call) => call.action === 'get').map((call) => call.tableId), ['orders']);
  assert.deepEqual(calls.filter((call) => call.action === 'list').map((call) => [call.userId, call.type, call.id]), [
    ['user-1', 'course', 'course-1'], ['user-1', 'ebook', 'ebook-1']
  ]);
  assert.deepEqual(calls.filter((call) => call.action === 'grant').map((call) => ({
    userId: call.data.user_id, type: call.data.item_type, id: call.data.item_id, grantedBy: call.data.granted_by
  })), [{ userId: 'user-1', type: 'ebook', id: 'ebook-1', grantedBy: 'purchase' }]);
  assert.equal(calls.find((call) => call.action === 'update').data.status, 'paid');
  assert.equal(calls.at(-1).action, 'commit');
});

test('missing or invalid snapshot falls back to the bundles table', async () => {
  for (const snapshot of [undefined, '{invalid json']) {
    const order = pendingBundle({ bundle_items_json: snapshot });
    const { tables, calls } = makeTables(order, {
      bundleItems: JSON.stringify(['course:course-2', 'ebook:ebook-2'])
    });

    const result = await confirmPaidOrder(tables, order, 'payment-2');

    assert.equal(result.state, 'confirmed');
    assert.deepEqual(calls.filter((call) => call.action === 'get').map((call) => call.tableId), ['orders', 'bundles']);
    assert.deepEqual(calls.filter((call) => call.action === 'grant').map((call) => call.data.item_id), ['course-2', 'ebook-2']);
  }
});

test('already owned bundle items are not granted twice', async () => {
  const order = pendingBundle({ bundle_items_json: JSON.stringify([{ type: 'course', id: 'course-1' }]) });
  const { tables, calls } = makeTables(order, { existing: ['course:course-1'] });

  const result = await confirmPaidOrder(tables, order, 'payment-3');

  assert.deepEqual(result, { state: 'confirmed', accessAlreadyExisted: true });
  assert.equal(calls.filter((call) => call.action === 'grant').length, 0);
  assert.equal(calls.at(-1).action, 'commit');
});

test('empty bundle contents roll back without marking the order paid', async () => {
  const order = pendingBundle({ bundle_items_json: 'invalid' });
  const { tables, calls } = makeTables(order, { bundleItems: '[]' });

  await assert.rejects(confirmPaidOrder(tables, order, 'payment-4'), /aucun cours ou ebook valide/);

  assert.equal(calls.filter((call) => call.action === 'grant').length, 0);
  assert.equal(calls.filter((call) => call.action === 'update').length, 0);
  assert.equal(calls.at(-1).action, 'rollback');
});
