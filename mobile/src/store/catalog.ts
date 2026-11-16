import { create } from 'zustand';
import { collection, onSnapshot } from 'firebase/firestore';
import { config } from '@/lib/config';
import { getDb } from '@/lib/firebase';
import { kv } from '@/lib/mmkv';
import type { Category } from '@/types';

/** What the admin changed about a built-in category (categories/{id} in Firestore). */
export interface CategoryOverride {
  name?: { ar: string; en: string };
  active?: boolean;
}

const KEY = 'qareeb.catalog.v2';

interface Stored {
  overrides: Record<string, CategoryOverride>;
  custom: Category[];
}

interface CatalogState extends Stored {
  /** Follows categories/ in Firestore from now on (once per app run). */
  start: () => void;
}

/** Icon keys the dashboard offers for a new service; anything else falls back to "tools". */
export const CATALOG_ICONS = [
  'droplet', 'zap', 'hammer', 'wind', 'paintbrush', 'sparkles', 'wrench', 'tools', 'plug', 'leaf',
  'satellite', 'truck', 'home', 'camera', 'shield', 'sun', 'lightbulb', 'lock', 'key', 'monitor',
  'scissors', 'car', 'package', 'briefcase',
] as const;

const HEX = /^#[0-9A-Fa-f]{6}$/;

/** A service the admin added in the dashboard (categories/{id} with custom: true). */
function toCustom(id: string, v: Record<string, any>): Category | null {
  const ar = typeof v.name?.ar === 'string' ? v.name.ar.trim() : '';
  if (!ar) return null;
  const en = typeof v.name?.en === 'string' && v.name.en.trim() ? v.name.en.trim() : ar;
  return {
    id,
    slug: id,
    name: { ar, en },
    icon: (CATALOG_ICONS as readonly string[]).includes(v.icon) ? v.icon : 'tools',
    colorHex: HEX.test(v.colorHex ?? '') ? v.colorHex : '#2563EB',
    order: Number.isFinite(v.order) ? v.order : 100,
    active: v.active !== false,
  };
}

let unsubscribe: (() => void) | null = null;
const saved = (!config.useMock && kv.get<Stored>(KEY)) || { overrides: {}, custom: [] };

/**
 * The app ships its category catalog (icons, colours, order); the admin
 * dashboard can rename a category, hide it, or add a new one. Those changes
 * are followed live, and the last copy is kept for the next start.
 */
export const useCatalog = create<CatalogState>((set) => ({
  overrides: saved.overrides,
  custom: saved.custom,
  start: () => {
    const db = getDb();
    if (config.useMock || !db || unsubscribe) return;
    unsubscribe = onSnapshot(
      collection(db, 'categories'),
      (snap) => {
        const overrides: Record<string, CategoryOverride> = {};
        const custom: Category[] = [];
        snap.docs.forEach((d) => {
          const v = d.data();
          if (v.custom === true) {
            const c = toCustom(d.id, v);
            if (c) custom.push(c);
            return;
          }
          overrides[d.id] = { name: v.name?.ar && v.name?.en ? { ar: v.name.ar, en: v.name.en } : undefined, active: v.active };
        });
        kv.set(KEY, { overrides, custom });
        set({ overrides, custom });
      },
      () => {},
    );
  },
}));
