import { MMKV } from 'react-native-mmkv';

/**
 * Global key-value store used for the persisted React Query cache, theme
 * preference, session snapshot and onboarding flags.
 */
export const storage = new MMKV({ id: 'qareeb.storage' });

/** Thin JSON helpers so callers don't repeat parse/stringify everywhere. */
export const kv = {
  get<T>(key: string): T | undefined {
    const raw = storage.getString(key);
    if (!raw) return undefined;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return undefined;
    }
  },
  set<T>(key: string, value: T) {
    storage.set(key, JSON.stringify(value));
  },
  remove(key: string) {
    storage.delete(key);
  },
  clearAll() {
    storage.clearAll();
  },
};
