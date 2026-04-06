import { generateId } from '../utils/generateId';
import type { CabinetIrRecord, CabinetIrSummary } from '../types/cabinetIr';

const DATABASE_NAME = 'wamp-cabinet-ir-library';
const LEGACY_DATABASE_NAME = 'mac2-cabinet-ir-library';
const STORE_NAME = 'irs';
const DATABASE_VERSION = 1;

type StoredCabinetIrRecord = CabinetIrRecord;

function openDatabase(name: string): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(name, DATABASE_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('updatedAt', 'updatedAt');
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Unable to open IR library database.'));
  });
}

function withStore<T>(
  databaseName: string,
  mode: IDBTransactionMode,
  task: (store: IDBObjectStore, resolve: (value: T) => void, reject: (reason?: unknown) => void) => void
): Promise<T> {
  return openDatabase(databaseName).then((db) => new Promise<T>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, mode);
    const store = tx.objectStore(STORE_NAME);

    tx.oncomplete = () => db.close();
    tx.onerror = () => reject(tx.error ?? new Error('IR library transaction failed.'));
    tx.onabort = () => reject(tx.error ?? new Error('IR library transaction aborted.'));

    task(store, resolve, reject);
  }));
}

function getAllFromDatabase(databaseName: string): Promise<StoredCabinetIrRecord[]> {
  return withStore<StoredCabinetIrRecord[]>(databaseName, 'readonly', (store, resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result as StoredCabinetIrRecord[]);
    request.onerror = () => reject(request.error);
  });
}

async function getPreferredDatabaseName(): Promise<string> {
  const primary = await getAllFromDatabase(DATABASE_NAME);
  if (primary.length > 0) return DATABASE_NAME;

  const legacy = await getAllFromDatabase(LEGACY_DATABASE_NAME);
  return legacy.length > 0 ? LEGACY_DATABASE_NAME : DATABASE_NAME;
}

function toSummary(record: StoredCabinetIrRecord): CabinetIrSummary {
  return {
    id: record.id,
    name: record.name,
    fileName: record.fileName,
    mimeType: record.mimeType,
    sizeBytes: record.sizeBytes,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

export async function listCabinetIrs(): Promise<CabinetIrSummary[]> {
  const databaseName = await getPreferredDatabaseName();
  const entries = await getAllFromDatabase(databaseName);
  return entries
    .map(toSummary)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function getCabinetIr(id: string): Promise<CabinetIrRecord | null> {
  const databaseName = await getPreferredDatabaseName();
  return withStore(databaseName, 'readonly', (store, resolve, reject) => {
    const request = store.get(id);
    request.onsuccess = () => resolve((request.result as CabinetIrRecord | undefined) ?? null);
    request.onerror = () => reject(request.error);
  });
}

export async function saveCabinetIr(input: {
  name: string;
  fileName: string;
  mimeType: string;
  data: ArrayBuffer;
}): Promise<CabinetIrSummary> {
  const timestamp = new Date().toISOString();
  const record: CabinetIrRecord = {
    id: generateId(),
    name: input.name,
    fileName: input.fileName,
    mimeType: input.mimeType,
    sizeBytes: input.data.byteLength,
    createdAt: timestamp,
    updatedAt: timestamp,
    data: input.data,
  };

  return withStore(DATABASE_NAME, 'readwrite', (store, resolve, reject) => {
    const request = store.put(record);
    request.onsuccess = () => resolve(toSummary(record));
    request.onerror = () => reject(request.error);
  });
}

export async function renameCabinetIr(id: string, name: string): Promise<CabinetIrSummary | null> {
  const databaseName = await getPreferredDatabaseName();
  const existing = await withStore<CabinetIrRecord | null>(databaseName, 'readonly', (store, resolve, reject) => {
    const request = store.get(id);
    request.onsuccess = () => resolve((request.result as CabinetIrRecord | undefined) ?? null);
    request.onerror = () => reject(request.error);
  });
  if (!existing) return null;

  const updated: CabinetIrRecord = {
    ...existing,
    name,
    updatedAt: new Date().toISOString(),
  };

  return withStore(databaseName, 'readwrite', (store, resolve, reject) => {
    const request = store.put(updated);
    request.onsuccess = () => resolve(toSummary(updated));
    request.onerror = () => reject(request.error);
  });
}

export async function deleteCabinetIr(id: string): Promise<void> {
  const databaseName = await getPreferredDatabaseName();
  await withStore<void>(databaseName, 'readwrite', (store, resolve, reject) => {
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}
