// Web fallback for the MMKV store. react-native-mmkv is native-only, so on web
// we back the same tiny API with localStorage. Metro loads this file for the
// web platform automatically (in place of mmkv.ts).

const mem = new Map<string, string>();
const ls = typeof localStorage !== 'undefined' ? localStorage : null;

export const storage = {
  getString(key: string): string | undefined {
    return (ls ? ls.getItem(key) : mem.get(key)) ?? undefined;
  },
  set(key: string, value: string) {
    ls ? ls.setItem(key, value) : mem.set(key, value);
  },
  delete(key: string) {
    ls ? ls.removeItem(key) : mem.delete(key);
  },
  clearAll() {
    ls ? ls.clear() : mem.clear();
  },
};

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
