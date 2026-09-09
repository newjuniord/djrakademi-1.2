import { Client, TablesDB } from 'node-appwrite';

const endpoint = process.env.PUBLIC_APPWRITE_ENDPOINT || 'https://sfo.cloud.appwrite.io/v1';
const projectId = process.env.PUBLIC_APPWRITE_PROJECT || 'djrakademi';
const databaseId = process.env.PUBLIC_APPWRITE_DATABASE_ID || 'djrakademi';
const apiKey = process.env.APPWRITE_API_KEY;

if (!apiKey) {
  console.error('APPWRITE_API_KEY is required.');
  process.exitCode = 1;
} else {
  const tables = new TablesDB(new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey));
  try {
    await tables.getTable({ databaseId, tableId: 'coaching_unavailability' });
    const bookingColumns = await tables.listColumns({ databaseId, tableId: 'bookings' });
    const reservationKey = bookingColumns.columns.find((column) => column.key === 'reservation_key');
    if (!reservationKey) throw new Error('Run npm run setup:schema before this migration.');

    const legacySlotId = bookingColumns.columns.find((column) => column.key === 'slot_id');
    if (legacySlotId?.required) {
      await tables.updateStringColumn({
        databaseId, tableId: 'bookings', key: 'slot_id', required: false, size: legacySlotId.size || 36
      });
      console.log('bookings.slot_id is now optional for historical compatibility.');
    }

    if (process.env.CONFIRM_DROP_COACHING_SLOTS !== 'yes') {
      console.log('Schema migration complete. Set CONFIRM_DROP_COACHING_SLOTS=yes to remove the legacy table.');
    } else {
      await tables.deleteTable({ databaseId, tableId: 'coaching_slots' }).catch((error) => {
        if (error?.code !== 404) throw error;
      });
      console.log('Legacy coaching_slots table removed.');
    }
  } catch (error) {
    console.error('Dynamic coaching migration failed:', error);
    process.exitCode = 1;
  }
}
