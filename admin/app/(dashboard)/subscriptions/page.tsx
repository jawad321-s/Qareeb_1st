'use client';

import { Card, Badge } from '@/components/ui/primitives';
import { formatMoney } from '@/lib/utils';
import { useT } from '@/lib/i18n';
import { isLive } from '@/lib/firebase';
import { useCollection } from '@/lib/live-data';

// Same plans as the mobile app (mobile/src/lib/plans.ts): a one-time 7-day
// free trial, then prepaid 3-month, 6-month and yearly plans.
// `subscribers` is the demo figure (mock mode); live counts come from the
// subscriptions collection.
const PLANS = [
  { id: 'trial', name: '7-day free trial', nameAr: 'تجربة مجانية 7 أيام', price: 0, months: 0, subscribers: 214, tone: 'neutral' as const },
  { id: 'quarter', name: '3 months', nameAr: '3 أشهر', price: 12900, months: 3, subscribers: 168, tone: 'brand' as const },
  { id: 'half', name: '6 months', nameAr: '6 أشهر', price: 23900, months: 6, subscribers: 241, tone: 'brand' as const },
  { id: 'year', name: '1 year', nameAr: 'سنة', price: 44900, months: 12, subscribers: 97, tone: 'warning' as const },
];

export default function SubscriptionsPage() {
  const { t, locale } = useT();
  // Live: plans that are running now (not cancelled, not expired), per plan.
  const subs = useCollection('subscriptions');
  const now = Date.now();
  const activeCount = (planId: string) =>
    (subs ?? []).filter((s) => s.planId === planId && s.status !== 'cancelled' && Number(s.expiresAt) > now).length;
  const plans = isLive() ? PLANS.map((p) => ({ ...p, subscribers: activeCount(p.id) })) : PLANS;
  // Prepaid plans spread over their length, so the figure stays monthly.
  const MRR = plans.reduce((s, p) => s + (p.months ? Math.round((p.price / p.months) * p.subscribers) : 0), 0);

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
        {plans.map((p) => (
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
