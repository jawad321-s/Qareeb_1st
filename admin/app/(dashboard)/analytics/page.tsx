import { Card } from '@/components/ui/primitives';
import { RevenueChart, RequestsBarChart, CategoryPie } from '@/components/charts/charts';
import { REVENUE_SERIES, CATEGORY_SPLIT, REQUESTS_BY_STATUS } from '@/lib/mock-data';

export default function AnalyticsPage() {
  const total = REQUESTS_BY_STATUS.reduce((s, r) => s + r.value, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-sm text-muted">Revenue, demand and category insights.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="mb-4 font-semibold">Revenue trend</h2>
          <RevenueChart data={REVENUE_SERIES} />
        </Card>
        <Card className="p-5">
          <h2 className="mb-4 font-semibold">Requests volume</h2>
          <RequestsBarChart data={REVENUE_SERIES} />
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-5">
          <h2 className="font-semibold">Category share</h2>
          <CategoryPie data={CATEGORY_SPLIT} />
        </Card>
        <Card className="p-5 lg:col-span-2">
          <h2 className="mb-4 font-semibold">Request status breakdown</h2>
          <div className="space-y-4">
            {REQUESTS_BY_STATUS.map((r) => (
              <div key={r.status}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span>{r.status}</span>
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
