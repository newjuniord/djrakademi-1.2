import { Client, Account, Databases, TablesDB, Storage, Query, ID } from 'appwrite';
import { PUBLIC_APPWRITE_ENDPOINT, PUBLIC_APPWRITE_PROJECT } from '$env/static/public';

const client = new Client()
	.setEndpoint(PUBLIC_APPWRITE_ENDPOINT)
	.setProject(PUBLIC_APPWRITE_PROJECT);

const account = new Account(client);
const databases = new Databases(client);
const tablesClient = new TablesDB(client);

const tables = {
	listRows: (databaseId: string, tableId: string, queries?: string[]) =>
		tablesClient.listRows({ databaseId, tableId, queries }),
	getRow: (databaseId: string, tableId: string, rowId: string) =>
		tablesClient.getRow({ databaseId, tableId, rowId }),
	createRow: (databaseId: string, tableId: string, rowId: string, data: object) =>
		tablesClient.createRow({ databaseId, tableId, rowId, data }),
	updateRow: (databaseId: string, tableId: string, rowId: string, data: object) =>
		tablesClient.updateRow({ databaseId, tableId, rowId, data }),
	deleteRow: (databaseId: string, tableId: string, rowId: string) =>
		tablesClient.deleteRow({ databaseId, tableId, rowId })
};
const storage = new Storage(client);

export const DATABASE_ID = 'djrakademi';

export { client, account, databases, tables, storage, Query, ID };

