import { create } from 'zustand';
import { collection, getDocs } from 'firebase/firestore';
import { config } from '@/lib/config';
import { getDb } from '@/lib/firebase';
import { kv } from '@/lib/mmkv';

/** What the admin changed about a built-in category (categories/{id} in Firestore). */
export interface CategoryOverride {
  name?: { ar: string; en: string };
  active?: boolean;
}

const KEY = 'qareeb.catalog';

interface CatalogState {
  overrides: Record<string, CategoryOverride>;
  /** Fetches the admin's changes; the last copy is kept for the next start. */
  load: () => Promise<void>;
}

/**
 * The app ships its category catalog (icons, colours, order); the admin
 * dashboard can rename a category or hide it, and those changes live here.
 */
export const useCatalog = create<CatalogState>((set) => ({
  overrides: (!config.useMock && kv.get<Record<string, CategoryOverride>>(KEY)) || {},
  load: async () => {
    const db = getDb();
    if (config.useMock || !db) return;
    const snap = await getDocs(collection(db, 'categories'));
    const overrides: Record<string, CategoryOverride> = {};
    snap.docs.forEach((d) => {
      const v = d.data();
      overrides[d.id] = { name: v.name?.ar && v.name?.en ? { ar: v.name.ar, en: v.name.en } : undefined, active: v.active };
    });
    kv.set(KEY, overrides);
    set({ overrides });
  },
}));
