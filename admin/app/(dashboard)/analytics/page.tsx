'use client';

import { Card } from '@/components/ui/primitives';
import { RevenueChart, RequestsBarChart, CategoryPie } from '@/components/charts/charts';
import { REVENUE_SERIES, CATEGORY_SPLIT, REQUESTS_BY_STATUS } from '@/lib/mock-data';
import { useT } from '@/lib/i18n';
import { isLive } from '@/lib/firebase';
import { useCollection, monthlySeries, categorySplit, requestsByStatus } from '@/lib/live-data';

const STATUS_KEY: Record<string, string> = { Pending: 'an.pending', Active: 'an.active', Completed: 'an.completed', Cancelled: 'an.cancelled' };

export default function AnalyticsPage() {
  const { t, locale } = useT();
  const live = isLive();
  const requests = useCollection('requests');
  const subscriptions = useCollection('subscriptions');
  const series = live ? monthlySeries(subscriptions ?? [], requests ?? [], locale) : REVENUE_SERIES;
  const split = live ? categorySplit(requests ?? [], locale) : CATEGORY_SPLIT;
  const byStatus = live ? requestsByStatus(requests ?? []) : REQUESTS_BY_STATUS;
  const total = byStatus.reduce((s, r) => s + r.value, 0);
  const pct = (v: number) => (total ? Math.round((v / total) * 100) : 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t('an.title')}</h1>
        <p className="text-sm text-muted">{t('an.subtitle')}</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="mb-4 font-semibold">{t('an.revenueTrend')}</h2>
          <RevenueChart data={series} />
        </Card>
        <Card className="p-5">
          <h2 className="mb-4 font-semibold">{t('an.requestsVolume')}</h2>
          <RequestsBarChart data={series} />
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-5">
          <h2 className="font-semibold">{t('an.categoryShare')}</h2>
          {split.length ? <CategoryPie data={split} /> : <p className="py-16 text-center text-sm text-muted">{t('ov.noData')}</p>}
        </Card>
        <Card className="p-5 lg:col-span-2">
          <h2 className="mb-4 font-semibold">{t('an.statusBreakdown')}</h2>
          <div className="space-y-4">
            {byStatus.map((r) => (
              <div key={r.status}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span>{t(STATUS_KEY[r.status] as any)}</span>
                  <span className="text-muted">{r.value} · {pct(r.value)}%</span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-slate-500/15">
                  <div className="h-full rounded-full" style={{ width: `${pct(r.value)}%`, background: r.color }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
