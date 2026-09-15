// Run with: node --env-file=.env appwrite/migrate-bundles.js
// Adds the bundle schema and the columns/tables required by Lemon Squeezy pre-checks.
import { Client, TablesDB } from 'node-appwrite';

const endpoint = process.env.PUBLIC_APPWRITE_ENDPOINT;
const project = process.env.PUBLIC_APPWRITE_PROJECT;
const databaseId = process.env.PUBLIC_APPWRITE_DATABASE_ID || 'djrakademi';
const key = process.env.APPWRITE_API_KEY;
if (!endpoint || !project || !key) throw new Error('Configuration Appwrite manquante.');

const tables = new TablesDB(new Client().setEndpoint(endpoint).setProject(project).setKey(key));

async function waitForColumn(tableId, columnKey) {
	for (let attempt = 0; attempt < 60; attempt += 1) {
		const { columns } = await tables.listColumns({ databaseId, tableId });
		const column = columns.find((item) => item.key === columnKey);
		if (column?.status === 'available') return;
		if (column?.status === 'failed' || column?.status === 'stuck') throw new Error(`Migration échouée : ${tableId}.${columnKey}`);
		await new Promise((resolve) => setTimeout(resolve, 1000));
	}
	throw new Error(`Délai dépassé : ${tableId}.${columnKey}`);
}

async function addStringColumnIfMissing(tableId, columnKey, size = 100) {
	const { columns } = await tables.listColumns({ databaseId, tableId });
	if (columns.some((column) => column.key === columnKey)) return;
	await tables.createStringColumn({ databaseId, tableId, key: columnKey, size, required: false });
	await waitForColumn(tableId, columnKey);
	console.log(`Colonne ajoutée : ${tableId}.${columnKey}`);
}

async function addIntegerColumnIfMissing(tableId, columnKey) {
	const { columns } = await tables.listColumns({ databaseId, tableId });
	if (columns.some((column) => column.key === columnKey)) return;
	await tables.createIntegerColumn({ databaseId, tableId, key: columnKey, required: false, min: 0 });
	await waitForColumn(tableId, columnKey);
	console.log(`Colonne ajoutée : ${tableId}.${columnKey}`);
}

async function addEnumValue(tableId, columnKey, value) {
	const { columns } = await tables.listColumns({ databaseId, tableId });
	const column = columns.find((item) => item.key === columnKey);
	if (!column || !Array.isArray(column.elements)) throw new Error(`${tableId}.${columnKey} introuvable ou invalide.`);
	if (column.elements.includes(value)) return;
	await tables.updateEnumColumn({
		databaseId,
		tableId,
		key: columnKey,
		elements: [...column.elements, value],
		required: column.required,
		xdefault: column.default ?? null
	});
	await waitForColumn(tableId, columnKey);
	console.log(`Valeur ${value} ajoutée à ${tableId}.${columnKey}.`);
}

try {
	await tables.getTable({ databaseId, tableId: 'bundles' });
	console.log('Table bundles déjà présente.');
} catch (error) {
	if (error?.code !== 404) throw error;
	await tables.createTable({
		databaseId, tableId: 'bundles', name: 'Bundles', permissions: [],
		columns: [
			{ key: 'title', type: 'varchar', size: 255, required: true },
			{ key: 'description', type: 'text', required: true },
			{ key: 'cover_url', type: 'text', required: false },
			{ key: 'price', type: 'integer', required: true, min: 0 },
			{ key: 'price_usd', type: 'integer', required: false, min: 0 },
			{ key: 'variant_id', type: 'varchar', size: 100, required: false },
			{ key: 'published', type: 'boolean', required: true },
			{ key: 'items_json', type: 'text', required: true },
			{ key: 'created_at', type: 'datetime', required: true },
			{ key: 'updated_at', type: 'datetime', required: true }
		],
		indexes: [
			{ key: 'idx_bundle_published', type: 'key', attributes: ['published'] },
			{ key: 'idx_bundle_created_at', type: 'key', attributes: ['created_at'] }
		]
	});
	console.log('Table bundles créée.');
}

const { columns } = await tables.listColumns({ databaseId, tableId: 'orders' });
const productType = columns.find((item) => item.key === 'product_type');
if (!productType || !Array.isArray(productType.elements)) throw new Error('orders.product_type introuvable ou invalide.');
if (!productType.elements.includes('bundle')) {
	await tables.updateEnumColumn({ databaseId, tableId: 'orders', key: 'product_type', elements: [...productType.elements, 'bundle'], required: productType.required, xdefault: productType.default ?? null });
	await waitForColumn('orders', 'product_type');
	console.log('Type de commande bundle ajouté.');
}
if (!columns.some((item) => item.key === 'bundle_items_json')) {
	await tables.createTextColumn({ databaseId, tableId: 'orders', key: 'bundle_items_json', required: false });
	await waitForColumn('orders', 'bundle_items_json');
	console.log('Instantané du contenu du bundle ajouté aux commandes.');
}
await addEnumValue('orders', 'currency', 'USD');
await addEnumValue('orders', 'payment_provider', 'lemonsqueezy');
for (const tableId of ['courses', 'ebooks']) {
	await addIntegerColumnIfMissing(tableId, 'price_usd');
	await addStringColumnIfMissing(tableId, 'lemonsqueezy_variant_id');
	await addStringColumnIfMissing(tableId, 'variant_id');
}

try {
	await tables.getTable({ databaseId, tableId: 'verification_logs' });
	console.log('Table verification_logs déjà présente.');
} catch (error) {
	if (error?.code !== 404) throw error;
	await tables.createTable({
		databaseId,
		tableId: 'verification_logs',
		name: 'Verification logs',
		permissions: [],
		columns: [
			{ key: 'user_id', type: 'varchar', size: 36, required: true },
			{ key: 'input_value', type: 'varchar', size: 255, required: true },
			{ key: 'method', type: 'enum', elements: ['carte', 'mobile'], required: true },
			{ key: 'status', type: 'enum', elements: ['success', 'failed'], required: true },
			{ key: 'message', type: 'text', required: true },
			{ key: 'granted_items', type: 'text', required: false },
			{ key: 'created_at', type: 'datetime', required: true }
		],
		indexes: [
			{ key: 'idx_verification_user', type: 'key', attributes: ['user_id'] },
			{ key: 'idx_verification_status', type: 'key', attributes: ['status'] },
			{ key: 'idx_verification_created', type: 'key', attributes: ['created_at'] }
		]
	});
	console.log('Table verification_logs créée.');
}

console.log('Migration bundles et vérification Lemon Squeezy terminée.');
