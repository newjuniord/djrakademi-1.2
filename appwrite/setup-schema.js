import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Client, Storage, TablesDB } from 'node-appwrite';

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const schema = JSON.parse(fs.readFileSync(path.join(currentDirectory, 'schema.json'), 'utf8'));

const endpoint = process.env.PUBLIC_APPWRITE_ENDPOINT || 'https://sfo.cloud.appwrite.io/v1';
const projectId = process.env.PUBLIC_APPWRITE_PROJECT || 'djrakademi';
const databaseId = process.env.PUBLIC_APPWRITE_DATABASE_ID || schema.databaseId;
const apiKey = process.env.APPWRITE_API_KEY;

function parseColumn(key, descriptor) {
  const required = descriptor.includes(' required');
  const minMatch = descriptor.match(/min:(-?\d+)/);
  const varcharMatch = descriptor.match(/^varchar\((\d+)\)/);
  const enumMatch = descriptor.match(/^enum\[([^\]]+)\]/);

  if (varcharMatch) {
    return { key, type: 'varchar', size: Number(varcharMatch[1]), required };
  }
  if (enumMatch) {
    return { key, type: 'enum', elements: enumMatch[1].split(','), required };
  }
  if (descriptor.startsWith('integer')) {
    return { key, type: 'integer', required, ...(minMatch ? { min: Number(minMatch[1]) } : {}) };
  }
  if (descriptor.startsWith('boolean')) return { key, type: 'boolean', required };
  if (descriptor.startsWith('datetime')) return { key, type: 'datetime', required };
  if (descriptor.startsWith('email')) return { key, type: 'email', required };
  if (descriptor.startsWith('text')) return { key, type: 'text', required };

  throw new Error('Unsupported column descriptor for ' + key + ': ' + descriptor);
}

function parseIndex(descriptor, position) {
	const match = descriptor.match(/^(key|unique|fulltext)\(([^)]+)\)$/);
  if (!match) throw new Error('Unsupported index descriptor: ' + descriptor);
  const attributes = match[2].split(',');
  const suffix = attributes.join('_').replace(/[^a-z0-9_]/gi, '_');
  return {
    key: ('idx_' + position + '_' + suffix).slice(0, 36),
    type: match[1],
    attributes
  };
}


async function waitForColumn(tables, databaseId, tableId, key) {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    const current = await tables.listColumns({ databaseId, tableId });
    const column = current.columns.find((item) => item.key === key);
    if (column?.status === 'available') return;
    if (column?.status === 'failed' || column?.status === 'stuck') {
      throw new Error('Column migration failed: ' + tableId + '.' + key);
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new Error('Timed out waiting for column: ' + tableId + '.' + key);
}

async function setupSchema() {
  if (!apiKey) {
    console.error('APPWRITE_API_KEY is required.');
    process.exitCode = 1;
    return;
  }

  const client = new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
  const tables = new TablesDB(client);
  const storage = new Storage(client);

  try {
    await tables.get({ databaseId });
    console.log('Database exists: ' + databaseId);
  } catch (error) {
    if (error?.code !== 404) throw error;
    await tables.create({ databaseId, name: 'DJR Akademi DB' });
    console.log('Database created: ' + databaseId);
  }

  for (const table of schema.tables) {
	let exists = false;
    try {
      await tables.getTable({ databaseId, tableId: table.id });
      console.log('Table exists: ' + table.id);
	  exists = true;
    } catch (error) {
      if (error?.code !== 404) throw error;
    }

	const columns = Object.entries(table.columns).map(([key, descriptor]) =>
      parseColumn(key, descriptor)
    );
    const indexes = table.indexes.map(parseIndex);

	if (!exists) {
	  await tables.createTable({ databaseId, tableId: table.id, name: table.id.replaceAll('_', ' '), permissions: table.permissions, columns, indexes });
	  console.log('Table created: ' + table.id);
	  continue;
	}

	await tables.updateTable({ databaseId, tableId: table.id, permissions: table.permissions, rowSecurity: false, enabled: true, purge: true });
	console.log("Permissions synchronized: " + table.id);

	// Add missing columns without mutating existing data.
	const currentColumns = await tables.listColumns({ databaseId, tableId: table.id });
	const existingColumnKeys = new Set(currentColumns.columns.map((column) => column.key));
	for (const column of columns) {
	  if (existingColumnKeys.has(column.key)) continue;
	  const base = { databaseId, tableId: table.id, key: column.key, required: column.required };
	  if (column.type === 'boolean') await tables.createBooleanColumn(base);
	  else if (column.type === 'varchar') await tables.createStringColumn({ ...base, size: column.size });
	  else if (column.type === 'integer') await tables.createIntegerColumn({ ...base, ...(column.min !== undefined ? { min: column.min } : {}) });
	  else if (column.type === 'enum') await tables.createEnumColumn({ ...base, elements: column.elements });
	  else if (column.type === 'datetime') await tables.createDatetimeColumn(base);
	  else if (column.type === 'email') await tables.createEmailColumn(base);
	  else throw new Error('Automatic migration is not implemented for column type: ' + column.type);
	  console.log('Column created: ' + table.id + '.' + column.key);
	}

	const current = await tables.listIndexes({ databaseId, tableId: table.id });
	const existingKeys = new Set(current.indexes.map((index) => index.key));
	for (const index of indexes) {
	  if (existingKeys.has(index.key)) continue;
	  await tables.createIndex({ databaseId, tableId: table.id, key: index.key, type: index.type, columns: index.attributes });
	  console.log('Index created: ' + table.id + '.' + index.key);
	}
  }
  const ebookBucket = await storage.getBucket({ bucketId: "ebooks" });
  await storage.updateBucket({
    bucketId: "ebooks",
    name: ebookBucket.name,
    permissions: ["create(\"team:admins\")", "update(\"team:admins\")", "delete(\"team:admins\")"],
    fileSecurity: true
  });
  console.log("Private ebook file security enabled.");
}

setupSchema().catch((error) => {
  console.error('Appwrite schema setup failed:', error);
  process.exitCode = 1;
});
