'use client';

import { Card, Badge } from '@/components/ui/primitives';
import { formatMoney } from '@/lib/utils';
import { useT } from '@/lib/i18n';

// Same plans as the mobile app (mobile/src/lib/plans.ts): a one-time 7-day
// free trial, then prepaid 3-month, 6-month and yearly plans.
const PLANS = [
  { name: '7-day free trial', nameAr: 'تجربة مجانية 7 أيام', price: 0, months: 0, subscribers: 214, tone: 'neutral' as const },
  { name: '3 months', nameAr: '3 أشهر', price: 12900, months: 3, subscribers: 168, tone: 'brand' as const },
  { name: '6 months', nameAr: '6 أشهر', price: 23900, months: 6, subscribers: 241, tone: 'brand' as const },
  { name: '1 year', nameAr: 'سنة', price: 44900, months: 12, subscribers: 97, tone: 'warning' as const },
];

// Prepaid plans spread over their length, so the figure stays monthly.
const MRR = PLANS.reduce((s, p) => s + (p.months ? Math.round((p.price / p.months) * p.subscribers) : 0), 0);

export default function SubscriptionsPage() {
  const { t, locale } = useT();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t('sub.title')}</h1>
        <p className="text-sm text-muted">{t('sub.subtitle')}</p>
      </div>

      <Card className="p-5">
        <p className="text-sm text-muted">{t('sub.mrr')}</p>
        <p className="mt-1 text-3xl font-bold">{formatMoney(MRR)}</p>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {PLANS.map((p) => (
          <Card key={p.name} className="p-5">
            <div className="flex items-center justify-between">
              <p className="font-semibold">{locale === 'ar' ? p.nameAr : p.name}</p>
              <Badge tone={p.tone}>{p.subscribers} {t('sub.subs')}</Badge>
            </div>
            <p className="mt-3 text-2xl font-bold">
              {p.price === 0 ? t('sub.free') : formatMoney(p.price)}
              {p.months > 0 && <span className="text-sm font-normal text-muted"> / {p.months === 12 ? t('sub.year') : `${p.months} ${t('sub.months')}`}</span>}
            </p>
            <p className="mt-1 text-sm text-muted">
              {p.months ? `≈ ${formatMoney(Math.round((p.price / p.months) * p.subscribers))} / ${t('sub.month')}` : t('sub.trialNote')}
            </p>
          </Card>
        ))}
      </div>
    </div>
  );
}
