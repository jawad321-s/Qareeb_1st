import { create } from 'zustand';
import { kv } from '@/lib/mmkv';
import type { PlanId } from '@/lib/plans';
import type { CardBrand } from '@/lib/payment';

const STORE_KEY = 'qareeb.subscriptions';

/** The plan an artisan is on, plus the receipt of the payment that bought it. */
export interface ActiveSubscription {
  planId: PlanId;
  activatedAt: number;
  renewsAt: number | null; // null on the free plan
  amount: number; // minor units actually charged
  brand?: CardBrand;
  last4?: string;
  transactionId?: string;
}

const MONTH_MS = 30 * 24 * 3600_000;

/** Every artisan starts on the free plan until they pay for an upgrade. */
const FREE: ActiveSubscription = { planId: 'free', activatedAt: 0, renewsAt: null, amount: 0 };

interface SubscriptionState {
  /** Keyed by artisan uid so switching demo accounts keeps plans separate. */
  byUser: Record<string, ActiveSubscription>;
  activate: (uid: string, sub: Omit<ActiveSubscription, 'activatedAt' | 'renewsAt'> & { activatedAt?: number }) => ActiveSubscription;
}

export const useSubscriptionStore = create<SubscriptionState>((set, get) => ({
  byUser: kv.get<Record<string, ActiveSubscription>>(STORE_KEY) ?? {},
  activate: (uid, input) => {
    const activatedAt = input.activatedAt ?? Date.now();
    const sub: ActiveSubscription = {
      ...input,
      activatedAt,
      renewsAt: input.planId === 'free' ? null : activatedAt + MONTH_MS,
    };
    const byUser = { ...get().byUser, [uid]: sub };
    kv.set(STORE_KEY, byUser);
    set({ byUser });
    return sub;
  },
}));

/** The signed-in artisan's current plan (free when they never subscribed). */
export function useMySubscription(uid: string | undefined): ActiveSubscription {
  return useSubscriptionStore((s) => (uid && s.byUser[uid]) || FREE);
}
