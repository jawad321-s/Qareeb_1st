'use client';

import { Card } from '@/components/ui/primitives';
import { RevenueChart, RequestsBarChart, CategoryPie } from '@/components/charts/charts';
import { REVENUE_SERIES, CATEGORY_SPLIT, REQUESTS_BY_STATUS } from '@/lib/mock-data';
import { useT } from '@/lib/i18n';

const STATUS_KEY: Record<string, string> = { Pending: 'an.pending', Active: 'an.active', Completed: 'an.completed', Cancelled: 'an.cancelled' };

export default function AnalyticsPage() {
  const { t } = useT();
  const total = REQUESTS_BY_STATUS.reduce((s, r) => s + r.value, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t('an.title')}</h1>
        <p className="text-sm text-muted">{t('an.subtitle')}</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="mb-4 font-semibold">{t('an.revenueTrend')}</h2>
          <RevenueChart data={REVENUE_SERIES} />
        </Card>
        <Card className="p-5">
          <h2 className="mb-4 font-semibold">{t('an.requestsVolume')}</h2>
          <RequestsBarChart data={REVENUE_SERIES} />
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-5">
          <h2 className="font-semibold">{t('an.categoryShare')}</h2>
          <CategoryPie data={CATEGORY_SPLIT} />
        </Card>
        <Card className="p-5 lg:col-span-2">
          <h2 className="mb-4 font-semibold">{t('an.statusBreakdown')}</h2>
          <div className="space-y-4">
            {REQUESTS_BY_STATUS.map((r) => (
              <div key={r.status}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span>{t(STATUS_KEY[r.status] as any)}</span>
                  <span className="text-muted">{Math.round((r.value / total) * 100)}%</span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-slate-500/15">
                  <div className="h-full rounded-full" style={{ width: `${(r.value / total) * 100}%`, background: r.color }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
