import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { get, set, del } from 'idb-keyval';

/**
 * Storage adapter wrapping idb-keyval to satisfy AsyncStorage interface for TanStack Query v5.
 */
const idbStorage = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      const value = await get<string>(key);
      return value ?? null;
    } catch {
      return null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      await set(key, value);
    } catch (err) {
      console.warn('Failed to persist query cache to IndexedDB:', err);
    }
  },
  removeItem: async (key: string): Promise<void> => {
    try {
      await del(key);
    } catch (err) {
      console.warn('Failed to remove query cache key from IndexedDB:', err);
    }
  },
};

export const queryPersister = createAsyncStoragePersister({
  storage: idbStorage,
  key: 'STUDYSYNC_QUERY_PERSIST_CACHE',
  throttleTime: 1000,
});
