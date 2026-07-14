import { ArrowDownRight, ArrowUpRight, Users, Wrench, ClipboardList, Wallet } from 'lucide-react';
import { Card, StatusPill } from '@/components/ui/primitives';
import { RevenueChart, CategoryPie } from '@/components/charts/charts';
import { KPIS, REVENUE_SERIES, CATEGORY_SPLIT, ACTIVITY, VERIFICATIONS } from '@/lib/mock-data';
import { formatMoney, formatNumber, timeAgo } from '@/lib/utils';

const KPI_CARDS = [
  { label: 'Total revenue', value: formatMoney(KPIS.revenue), delta: KPIS.revenueDelta, icon: Wallet, tint: 'from-brand-600 to-brand-400' },
  { label: 'Total users', value: formatNumber(KPIS.users), delta: KPIS.usersDelta, icon: Users, tint: 'from-emerald-600 to-emerald-400' },
  { label: 'Active artisans', value: formatNumber(KPIS.artisans), delta: KPIS.artisansDelta, icon: Wrench, tint: 'from-cyan-600 to-cyan-400' },
  { label: 'Total requests', value: formatNumber(KPIS.requests), delta: KPIS.requestsDelta, icon: ClipboardList, tint: 'from-amber-600 to-amber-400' },
];

export default function OverviewPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Overview</h1>
        <p className="text-sm text-muted">Welcome back — here's what's happening on Qareeb today.</p>
      </div>

      {/* KPI grid */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {KPI_CARDS.map((k) => {
          const Icon = k.icon;
          const up = k.delta >= 0;
          return (
            <Card key={k.label} className="p-5">
              <div className="flex items-start justify-between">
                <div className={`grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br ${k.tint}`}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <span className={`inline-flex items-center gap-0.5 text-xs font-semibold ${up ? 'text-emerald-500' : 'text-red-500'}`}>
                  {up ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                  {Math.abs(k.delta)}%
                </span>
              </div>
              <p className="mt-4 text-2xl font-bold">{k.value}</p>
              <p className="text-sm text-muted">{k.label}</p>
            </Card>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-semibold">Revenue</h2>
              <p className="text-xs text-muted">Monthly gross revenue (₪)</p>
            </div>
          </div>
          <RevenueChart data={REVENUE_SERIES} />
        </Card>
        <Card className="p-5">
          <h2 className="font-semibold">Requests by category</h2>
          <p className="text-xs text-muted mb-2">Distribution across services</p>
          <CategoryPie data={CATEGORY_SPLIT} />
        </Card>
      </div>

      {/* Activity + verification queue */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <h2 className="mb-4 font-semibold">Recent activity</h2>
          <div className="space-y-4">
            {ACTIVITY.map((a) => (
              <div key={a.id} className="flex items-start gap-3">
                <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-500" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm">{a.text}</p>
                  <p className="text-xs text-muted">{timeAgo(a.time)}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
        <Card className="p-5">
          <h2 className="mb-4 font-semibold">Pending verifications</h2>
          <div className="space-y-3">
            {VERIFICATIONS.slice(0, 4).map((v) => (
              <div key={v.id} className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{v.name}</p>
                  <p className="text-xs text-muted">{v.category}</p>
                </div>
                <StatusPill status={v.status} />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
