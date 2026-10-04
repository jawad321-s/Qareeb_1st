import { useEffect } from 'react';
import { create } from 'zustand';
import { kv } from '@/lib/mmkv';
import { daysUntil, planById, planDurationMs, type PlanId } from '@/lib/plans';
import type { CardBrand } from '@/lib/payment';
import { api } from '@/services/api';

// New key: plans changed (trial + 3/6/12 months), so older saved data with the
// previous plan ids is ignored instead of misread.
const STORE_KEY = 'qareeb.subscriptions.v2';

/** The artisan's latest plan, plus the receipt of the payment that bought it. */
export interface SubscriptionRecord {
  planId: PlanId;
  activatedAt: number;
  expiresAt: number;
  amount: number; // minor units actually charged
  brand?: CardBrand;
  last4?: string;
  transactionId?: string;
  /** Set when the artisan cancels. Cancelling ends the plan at once; the
   *  amount paid is not refunded. */
  cancelledAt?: number;
  /** Firestore document id, when the purchase was recorded there. */
  docId?: string;
}

export type SubscriptionStatus = 'trial' | 'active' | 'expired' | 'cancelled' | 'none';

interface Persisted {
  byUser: Record<string, SubscriptionRecord>;
  /** The free trial is one per artisan, even after it ends. */
  trialUsed: Record<string, true>;
}

interface SubscriptionState extends Persisted {
  startTrial: (uid: string) => SubscriptionRecord | null;
  activate: (
    uid: string,
    input: { planId: PlanId; amount: number; brand?: CardBrand; last4?: string; transactionId?: string; activatedAt?: number },
  ) => SubscriptionRecord;
  cancel: (uid: string) => SubscriptionRecord | null;
}

const saved = kv.get<Persisted>(STORE_KEY);

export const useSubscriptionStore = create<SubscriptionState>((set, get) => {
  const save = (patch: Partial<Persisted>) => {
    const next = { byUser: get().byUser, trialUsed: get().trialUsed, ...patch };
    kv.set(STORE_KEY, next);
    set(next);
  };
  const record = (uid: string, rec: SubscriptionRecord) => {
    // Firebase mode also keeps a copy for the admin dashboard; the plan is
    // already active on the device, so a failed write doesn't undo it.
    api
      .recordSubscription({ artisanId: uid, ...rec })
      .then((docId) => {
        if (docId) save({ byUser: { ...get().byUser, [uid]: { ...get().byUser[uid], docId } } });
      })
      .catch(() => {});
  };

  return {
    byUser: saved?.byUser ?? {},
    trialUsed: saved?.trialUsed ?? {},

    startTrial: (uid) => {
      if (get().trialUsed[uid]) return null;
      const now = Date.now();
      const rec: SubscriptionRecord = { planId: 'trial', activatedAt: now, expiresAt: now + planDurationMs(planById('trial')!), amount: 0 };
      save({ byUser: { ...get().byUser, [uid]: rec }, trialUsed: { ...get().trialUsed, [uid]: true } });
      record(uid, rec);
      return rec;
    },

    activate: (uid, input) => {
      const plan = planById(input.planId)!;
      const activatedAt = input.activatedAt ?? Date.now();
      const rec: SubscriptionRecord = { ...input, activatedAt, expiresAt: activatedAt + planDurationMs(plan) };
      save({ byUser: { ...get().byUser, [uid]: rec } });
      record(uid, rec);
      return rec;
    },

    cancel: (uid) => {
      const current = get().byUser[uid];
      if (!current || current.planId === 'trial') return null;
      const rec = { ...current, cancelledAt: Date.now() };
      save({ byUser: { ...get().byUser, [uid]: rec } });
      if (current.docId) api.cancelSubscription(current.docId, rec.cancelledAt).catch(() => {});
      return rec;
    },
  };
});

export function subscriptionStatus(rec: SubscriptionRecord | undefined, now = Date.now()): SubscriptionStatus {
  if (!rec) return 'none';
  if (rec.cancelledAt) return 'cancelled';
  if (rec.expiresAt <= now) return 'expired';
  return rec.planId === 'trial' ? 'trial' : 'active';
}

/** The signed-in artisan's plan and whether it currently lets them work. */
export function useMySubscription(uid: string | undefined) {
  const rec = useSubscriptionStore((s) => (uid ? s.byUser[uid] : undefined));
  const trialUsed = useSubscriptionStore((s) => (uid ? !!s.trialUsed[uid] : false));
  const status = subscriptionStatus(rec);
  return {
    record: rec,
    status,
    /** Trial or paid plan that hasn't ended — needed to send offers. */
    isActive: status === 'trial' || status === 'active',
    isPaid: status === 'active',
    daysLeft: rec && (status === 'trial' || status === 'active') ? daysUntil(rec.expiresAt) : 0,
    trialUsed,
  };
}

/** Starts the one-time free trial the first time an artisan opens the app. */
export function useEnsureTrial(uid: string | undefined, isArtisan: boolean) {
  const startTrial = useSubscriptionStore((s) => s.startTrial);
  const hasHistory = useSubscriptionStore((s) => (uid ? !!s.byUser[uid] || !!s.trialUsed[uid] : true));
  useEffect(() => {
    if (uid && isArtisan && !hasHistory) startTrial(uid);
  }, [uid, isArtisan, hasHistory, startTrial]);
}
