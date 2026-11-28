import { useMemo } from 'react';
import type { Locale } from '@/types';
import { usePlanPrices } from '@/store/planPrices';

/** 'trial' | 'quarter' | 'half' | 'year', or the id of a plan or special offer
 *  the admin added in the dashboard. */
export type PlanId = string;

export interface Plan {
  id: PlanId;
  name: Record<Locale, string>;
  /** Length of the plan. Paid plans are prepaid for the whole period. */
  durationDays: number;
  /** Price for the whole period, in minor units (agorot). 0 = free. */
  price: number;
  /** Months in the period — used to show the per-month equivalent. */
  months: number;
  highlight: boolean;
  badge?: Record<Locale, string>;
  /** Added by the admin in the dashboard: a plan, or a special offer that can
   *  be bought until `endsAt`. */
  kind?: 'plan' | 'offer';
  endsAt?: number;
  /** Shown in the app (the admin can hide an added plan or offer). */
  active?: boolean;
  custom?: boolean;
}

/** A plan or special offer as the admin saves it in settings/plans.custom. */
export interface CustomPlanDoc {
  kind: 'plan' | 'offer';
  nameAr: string;
  nameEn: string;
  price: number;
  durationDays: number;
  active: boolean;
  endsAt?: number;
  createdAt?: number;
}

const DAY_MS = 24 * 3600_000;

/** What every plan unlocks — they differ only in length and price. */
export const PLAN_FEATURES: Record<Locale, string[]> = {
  en: ['Receive nearby requests', 'Send unlimited offers', 'Premium badge on your profile', 'Priority in matching'],
  ar: ['استقبال الطلبات القريبة', 'إرسال عروض بلا حدود', 'شارة مميّزة في ملفك', 'أولوية في المطابقة'],
};

/** Artisan subscription plans — shared by the plans screen, checkout and the
 *  admin figures. The free trial can be used once per artisan. The prices
 *  here are the defaults: the admin can change them in the dashboard. */
const BASE_PLANS: Plan[] = [
  { id: 'trial', name: { en: 'Free trial', ar: 'تجربة مجانية' }, durationDays: 7, price: 0, months: 0, highlight: false },
  { id: 'quarter', name: { en: '3 months', ar: '3 أشهر' }, durationDays: 90, price: 12900, months: 3, highlight: false },
  {
    id: 'half',
    name: { en: '6 months', ar: '6 أشهر' },
    durationDays: 180,
    price: 23900,
    months: 6,
    highlight: true,
    badge: { en: 'Most popular', ar: 'الأكثر شيوعاً' },
  },
  {
    id: 'year',
    name: { en: '1 year', ar: 'سنة' },
    durationDays: 365,
    price: 44900,
    months: 12,
    highlight: false,
    badge: { en: 'Best value', ar: 'أفضل قيمة' },
  },
];

const OFFER_BADGE: Record<Locale, string> = { en: 'Special offer', ar: 'عرض خاص' };

/** An added plan or offer in the app's plan shape. */
export function fromCustom(id: string, d: CustomPlanDoc): Plan {
  return {
    id,
    name: { ar: d.nameAr, en: d.nameEn || d.nameAr },
    durationDays: d.durationDays,
    price: d.price,
    // Per-month figure for plans of a month or more.
    months: d.durationDays >= 28 ? d.durationDays / 30 : 0,
    highlight: d.kind === 'offer',
    badge: d.kind === 'offer' ? OFFER_BADGE : undefined,
    kind: d.kind,
    endsAt: d.kind === 'offer' ? d.endsAt : undefined,
    active: d.active,
    custom: true,
  };
}

/** Can be bought now: built-in plans always; added ones while shown and, for
 *  an offer, until it ends. */
export const isAvailable = (p: Plan, now = Date.now()) =>
  !p.custom || (p.active !== false && (p.kind !== 'offer' || (p.endsAt ?? 0) > now));

/** Every plan with the admin's current prices (the free trial stays free),
 *  including added plans that are hidden or offers that ended — so a plan
 *  someone already bought can still be named. */
export const getAllPlans = (): Plan[] => {
  const { prices, custom } = usePlanPrices.getState();
  const base = BASE_PLANS.map((p) => (p.price > 0 && prices[p.id] ? { ...p, price: prices[p.id] } : p));
  const added = Object.entries(custom)
    .sort(([, x], [, y]) => (x.createdAt ?? 0) - (y.createdAt ?? 0))
    .map(([id, d]) => fromCustom(id, d));
  return [...base, ...added];
};

/** The plans an artisan can buy now: offers first, then the regular plans. */
export const getPlans = (): Plan[] => {
  const now = Date.now();
  const all = getAllPlans().filter((p) => isAvailable(p, now));
  return [...all.filter((p) => p.kind === 'offer'), ...all.filter((p) => p.kind !== 'offer')];
};

/** Same, re-rendering when the admin changes a price, a plan or an offer. */
export function usePlans(): Plan[] {
  const prices = usePlanPrices((s) => s.prices);
  const custom = usePlanPrices((s) => s.custom);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(getPlans, [prices, custom]);
}

/** Every plan (see getAllPlans), re-rendering on changes. */
export function useAllPlans(): Plan[] {
  const prices = usePlanPrices((s) => s.prices);
  const custom = usePlanPrices((s) => s.custom);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(getAllPlans, [prices, custom]);
}

export const planById = (id: string) => getAllPlans().find((p) => p.id === id);

/** The name of the plan a subscription bought: the plan as it is now, else
 *  the name kept on the subscription (a plan the admin removed later). */
export const planNameOf = (rec: { planId: string; planName?: Record<Locale, string> } | undefined, locale: Locale) =>
  rec ? planById(rec.planId)?.name[locale] ?? rec.planName?.[locale] ?? '' : '';

export const planDurationMs = (plan: Plan) => plan.durationDays * DAY_MS;

/** "3 أشهر" / "45 يوماً": the length of an added plan, for its card. */
export function durationLabel(plan: Plan, locale: Locale): string {
  const d = plan.durationDays;
  if (d % 30 === 0 && d >= 30) {
    const m = d / 30;
    if (locale === 'en') return `${m} ${m === 1 ? 'month' : 'months'}`;
    if (m === 1) return 'شهر واحد';
    if (m === 2) return 'شهران';
    if (m <= 10) return `${m} أشهر`;
    return `${m} شهراً`;
  }
  return daysLabel(d, locale);
}

/** Per-month equivalent of a paid plan, in minor units. */
export const perMonth = (plan: Plan) => (plan.months ? Math.round(plan.price / plan.months) : 0);

/** Whole days left until `ts` (rounded up, never negative). */
export const daysUntil = (ts: number, now = Date.now()) => Math.max(0, Math.ceil((ts - now) / DAY_MS));

/** "5 days" / "5 أيام" with the right Arabic plural form. */
export function daysLabel(n: number, locale: Locale): string {
  if (locale === 'en') return `${n} ${n === 1 ? 'day' : 'days'}`;
  if (n === 1) return 'يوم واحد';
  if (n === 2) return 'يومان';
  if (n >= 3 && n <= 10) return `${n} أيام`;
  return `${n} يوماً`;
}
