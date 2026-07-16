import SQLiteStorage from 'expo-sqlite/kv-store';

/**
 * Global key-value store — theme preference, session snapshot, locale and
 * onboarding flags. Backed by expo-sqlite's synchronous key-value store, which
 * works in **Expo Go** and every build (unlike native-only MMKV). The `storage`
 * surface stays MMKV-compatible so callers didn't have to change.
 *
 * A tiny in-memory fallback guards the very first boot so the app can never
 * crash on a storage read.
 */
interface Backend {
  getString(key: string): string | undefined;
  set(key: string, value: string): void;
  delete(key: string): void;
  clearAll(): void;
}

function makeBackend(): Backend {
  try {
    const S = SQLiteStorage as any;
    if (typeof S?.getItemSync === 'function') {
      return {
        getString: (k) => S.getItemSync(k) ?? undefined,
        set: (k, v) => S.setItemSync(k, v),
        delete: (k) => S.removeItemSync(k),
        clearAll: () => S.clearSync(),
      };
    }
  } catch {
    // fall through to in-memory
  }
  const mem = new Map<string, string>();
  return {
    getString: (k) => mem.get(k),
    set: (k, v) => void mem.set(k, v),
    delete: (k) => void mem.delete(k),
    clearAll: () => mem.clear(),
  };
}

export const storage = makeBackend();

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
