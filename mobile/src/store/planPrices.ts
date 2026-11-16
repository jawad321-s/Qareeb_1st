import { create } from 'zustand';
import { doc, onSnapshot } from 'firebase/firestore';
import { config } from '@/lib/config';
import { getDb } from '@/lib/firebase';
import { kv } from '@/lib/mmkv';

const KEY = 'qareeb.planPrices';

interface PlanPricesState {
  /** settings/plans.prices: plan id → price for the whole period, in agorot. */
  prices: Record<string, number>;
  /** Follows the admin's prices from now on (once per app run). */
  start: () => void;
}

let unsubscribe: (() => void) | null = null;
const validPrice = (v: unknown): v is number => Number.isInteger(v) && (v as number) > 0 && (v as number) <= 10_000_000;

/**
 * Subscription prices set in the admin dashboard (Subscriptions → edit).
 * New purchases use them; plans already bought keep what was paid.
 */
export const usePlanPrices = create<PlanPricesState>((set) => ({
  prices: (!config.useMock && kv.get<Record<string, number>>(KEY)) || {},
  start: () => {
    const db = getDb();
    if (config.useMock || !db || unsubscribe) return;
    unsubscribe = onSnapshot(
      doc(db, 'settings', 'plans'),
      (snap) => {
        const raw = (snap.data()?.prices ?? {}) as Record<string, unknown>;
        const prices: Record<string, number> = {};
        for (const [id, v] of Object.entries(raw)) if (validPrice(v)) prices[id] = v;
        kv.set(KEY, prices);
        set({ prices });
      },
      () => {},
    );
  },
}));
