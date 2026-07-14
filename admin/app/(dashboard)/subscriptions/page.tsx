'use client';

import { Card, Badge } from '@/components/ui/primitives';
import { formatMoney } from '@/lib/utils';
import { useT } from '@/lib/i18n';

const PLANS = [
  { name: 'Starter', nameAr: 'المبتدئ', price: 0, subscribers: 812, tone: 'neutral' as const },
  { name: 'Pro', nameAr: 'المحترف', price: 4900, subscribers: 356, tone: 'brand' as const },
  { name: 'Elite', nameAr: 'النخبة', price: 9900, subscribers: 72, tone: 'warning' as const },
];

const MRR = PLANS.reduce((s, p) => s + p.price * p.subscribers, 0);

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

      <div className="grid gap-4 sm:grid-cols-3">
        {PLANS.map((p) => (
          <Card key={p.name} className="p-5">
            <div className="flex items-center justify-between">
              <p className="font-semibold">{locale === 'ar' ? p.nameAr : p.name}</p>
              <Badge tone={p.tone}>{p.subscribers} {t('sub.subs')}</Badge>
            </div>
            <p className="mt-3 text-2xl font-bold">
              {p.price === 0 ? '—' : formatMoney(p.price)}
              {p.price > 0 && <span className="text-sm font-normal text-muted"> / {t('sub.month')}</span>}
            </p>
            <p className="mt-1 text-sm text-muted">{formatMoney(p.price * p.subscribers)} / {t('sub.month')}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
