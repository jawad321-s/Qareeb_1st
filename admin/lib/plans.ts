// Artisan subscription plans as the dashboard shows and prices them. Same ids,
// lengths and default prices as the app (mobile/src/lib/plans.ts); the prices
// the admin sets live in settings/plans and the app follows them at once.
'use client';

import { useEffect, useState } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { getDb, isLive } from './firebase';

export interface AdminPlan {
  id: 'trial' | 'quarter' | 'half' | 'year';
  name: string;
  nameAr: string;
  /** Default price for the whole period, in agorot (0 = free). */
  price: number;
  months: number;
  /** Demo figure (mock mode); live counts come from `subscriptions`. */
  subscribers: number;
  tone: 'neutral' | 'brand' | 'warning';
}

export const PLANS: AdminPlan[] = [
  { id: 'trial', name: '7-day free trial', nameAr: 'تجربة مجانية 7 أيام', price: 0, months: 0, subscribers: 214, tone: 'neutral' },
  { id: 'quarter', name: '3 months', nameAr: '3 أشهر', price: 12900, months: 3, subscribers: 168, tone: 'brand' },
  { id: 'half', name: '6 months', nameAr: '6 أشهر', price: 23900, months: 6, subscribers: 241, tone: 'brand' },
  { id: 'year', name: '1 year', nameAr: 'سنة', price: 44900, months: 12, subscribers: 97, tone: 'warning' },
];

export const MAX_PRICE_SHEKELS = 100_000;

/** The admin's prices (plan id → agorot), followed live; {} until set. */
export function usePlanPrices(): { prices: Record<string, number>; loaded: boolean } {
  const [state, setState] = useState<{ prices: Record<string, number>; loaded: boolean }>({ prices: {}, loaded: !isLive() });
  useEffect(() => {
    const db = getDb();
    if (!isLive() || !db) return;
    return onSnapshot(
      doc(db, 'settings', 'plans'),
      (snap) => setState({ prices: (snap.data()?.prices as Record<string, number>) ?? {}, loaded: true }),
      () => setState((s) => ({ ...s, loaded: true })),
    );
  }, []);
  return state;
}

/** Saves new prices (agorot). Demo mode keeps nothing. */
export async function savePlanPrices(prices: Record<string, number>, by?: string): Promise<void> {
  const db = getDb();
  if (!isLive() || !db) return;
  await setDoc(doc(db, 'settings', 'plans'), { prices, updatedAt: Date.now(), updatedBy: by ?? null }, { merge: true });
}
