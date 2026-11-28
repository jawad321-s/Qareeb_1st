import { create } from 'zustand';
import { doc, onSnapshot } from 'firebase/firestore';
import { config } from '@/lib/config';
import { getDb } from '@/lib/firebase';
import { kv } from '@/lib/mmkv';
import type { CustomPlanDoc } from '@/lib/plans';

const KEY = 'qareeb.planPrices';
const CUSTOM_KEY = 'qareeb.customPlans';
const BASE_IDS = ['trial', 'quarter', 'half', 'year'];

interface PlanPricesState {
  /** settings/plans.prices: plan id → price for the whole period, in agorot. */
  prices: Record<string, number>;
  /** settings/plans.custom: plans and special offers the admin added, by id. */
  custom: Record<string, CustomPlanDoc>;
  /** Follows the admin's prices and plans from now on (once per app run). */
  start: () => void;
}

let unsubscribe: (() => void) | null = null;
const validPrice = (v: unknown): v is number => Number.isInteger(v) && (v as number) > 0 && (v as number) <= 10_000_000;
const validText = (v: unknown, max: number) => typeof v === 'string' && v.trim().length > 0 && v.length <= max;

/** Keeps only well-formed added plans; anything else the app ignores. */
export function parseCustomPlans(raw: unknown): Record<string, CustomPlanDoc> {
  const out: Record<string, CustomPlanDoc> = {};
  if (!raw || typeof raw !== 'object') return out;
  for (const [id, v] of Object.entries(raw as Record<string, Record<string, unknown>>)) {
    if (!v || BASE_IDS.includes(id)) continue;
    const kind = v.kind === 'offer' ? 'offer' : v.kind === 'plan' ? 'plan' : null;
    const days = v.durationDays;
    if (!kind || !validText(v.nameAr, 60) || !validPrice(v.price)) continue;
    if (!Number.isInteger(days) || (days as number) < 1 || (days as number) > 730) continue;
    if (kind === 'offer' && !(typeof v.endsAt === 'number' && Number.isFinite(v.endsAt))) continue;
    out[id] = {
      kind,
      nameAr: (v.nameAr as string).trim(),
      nameEn: validText(v.nameEn, 60) ? (v.nameEn as string).trim() : (v.nameAr as string).trim(),
      price: v.price as number,
      durationDays: days as number,
      active: v.active !== false,
      endsAt: kind === 'offer' ? (v.endsAt as number) : undefined,
      createdAt: typeof v.createdAt === 'number' ? v.createdAt : undefined,
    };
  }
  return out;
}

/**
 * Subscription prices, and the plans and special offers added in the admin
 * dashboard (Subscriptions). New purchases use them; plans already bought
 * keep what was paid.
 */
export const usePlanPrices = create<PlanPricesState>((set) => ({
  prices: (!config.useMock && kv.get<Record<string, number>>(KEY)) || {},
  custom: (!config.useMock && parseCustomPlans(kv.get(CUSTOM_KEY))) || {},
  start: () => {
    const db = getDb();
    if (config.useMock || !db || unsubscribe) return;
    unsubscribe = onSnapshot(
      doc(db, 'settings', 'plans'),
      (snap) => {
        const data = snap.data() ?? {};
        const raw = (data.prices ?? {}) as Record<string, unknown>;
        const prices: Record<string, number> = {};
        for (const [id, v] of Object.entries(raw)) if (validPrice(v)) prices[id] = v;
        const custom = parseCustomPlans(data.custom);
        kv.set(KEY, prices);
        kv.set(CUSTOM_KEY, custom);
        set({ prices, custom });
      },
      () => {},
    );
  },
}));
