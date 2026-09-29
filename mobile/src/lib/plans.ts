import type { Locale } from '@/types';

export type PlanId = 'free' | 'pro' | 'elite';

export interface Plan {
  id: PlanId;
  name: Record<Locale, string>;
  /** Monthly price in minor units (agorot). */
  price: number;
  highlight: boolean;
  features: Record<Locale, string[]>;
}

/** Artisan subscription plans — shared by the plans screen and checkout. */
export const PLANS: Plan[] = [
  {
    id: 'free',
    name: { en: 'Starter', ar: 'المبتدئ' },
    price: 0,
    highlight: false,
    features: {
      en: ['Receive nearby requests', 'Up to 10 offers / month', 'Standard support'],
      ar: ['استقبال الطلبات القريبة', 'حتى 10 عروض شهرياً', 'دعم قياسي'],
    },
  },
  {
    id: 'pro',
    name: { en: 'Pro', ar: 'المحترف' },
    price: 4900,
    highlight: true,
    features: {
      en: ['Unlimited offers', 'Priority matching', 'Premium badge', 'Analytics dashboard', 'Faster payouts'],
      ar: ['عروض غير محدودة', 'أولوية في المطابقة', 'شارة مميّزة', 'لوحة تحليلات', 'دفعات أسرع'],
    },
  },
  {
    id: 'elite',
    name: { en: 'Elite', ar: 'النخبة' },
    price: 9900,
    highlight: false,
    features: {
      en: ['Everything in Pro', 'Top of search results', 'Dedicated account manager', 'Featured on homepage'],
      ar: ['كل مزايا المحترف', 'الظهور أعلى نتائج البحث', 'مدير حساب مخصّص', 'ظهور في الصفحة الرئيسية'],
    },
  },
];

export const planById = (id: string) => PLANS.find((p) => p.id === id);
