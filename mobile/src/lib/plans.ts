import type { Locale } from '@/types';

export type PlanId = 'trial' | 'quarter' | 'half' | 'year';

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
}

const DAY_MS = 24 * 3600_000;

/** What every plan unlocks — they differ only in length and price. */
export const PLAN_FEATURES: Record<Locale, string[]> = {
  en: ['Receive nearby requests', 'Send unlimited offers', 'Premium badge on your profile', 'Priority in matching'],
  ar: ['استقبال الطلبات القريبة', 'إرسال عروض بلا حدود', 'شارة مميّزة في ملفك', 'أولوية في المطابقة'],
};

/** Artisan subscription plans — shared by the plans screen, checkout and the
 *  admin figures. The free trial can be used once per artisan. */
export const PLANS: Plan[] = [
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

export const planById = (id: string) => PLANS.find((p) => p.id === id);

export const planDurationMs = (plan: Plan) => plan.durationDays * DAY_MS;

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
