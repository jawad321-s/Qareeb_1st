'use client';

import {
  ArrowDownRight, ArrowUpRight, Users, Wrench, ClipboardList, Wallet,
  ShieldCheck, MessageSquareWarning, CreditCard, Layers,
} from 'lucide-react';
import { Card, StatusPill } from '@/components/ui/primitives';
import { RevenueChart, CategoryPie } from '@/components/charts/charts';
import { KPIS, REVENUE_SERIES, CATEGORY_SPLIT, ACTIVITY, VERIFICATIONS } from '@/lib/mock-data';
import { formatMoney, formatNumber, timeAgo } from '@/lib/utils';
import { useT } from '@/lib/i18n';

const ACTIVITY_AR: Record<number, string> = {
  1: 'قدّم عمر خالد طلب توثيق جديد',
  2: 'تم حل شكوى: نزاع مبالغة #c_2',
  3: 'ترقية طارق منصور إلى باقة النخبة',
  4: 'تم إنشاء 320 طلباً جديداً اليوم',
  5: 'إضافة فئة "ستلايت" إلى الكتالوج',
};

export default function OverviewPage() {
  const { t, locale } = useT();
  const KPI_CARDS = [
    { label: t('ov.totalRevenue'), value: formatMoney(KPIS.revenue), delta: KPIS.revenueDelta, icon: Wallet, iconCls: 'bg-brand-500/10 text-brand-600 dark:text-brand-400' },
    { label: t('ov.totalUsers'), value: formatNumber(KPIS.users), delta: KPIS.usersDelta, icon: Users, iconCls: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
    { label: t('ov.activeArtisans'), value: formatNumber(KPIS.artisans), delta: KPIS.artisansDelta, icon: Wrench, iconCls: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400' },
    { label: t('ov.totalRequests'), value: formatNumber(KPIS.requests), delta: KPIS.requestsDelta, icon: ClipboardList, iconCls: 'bg-violet-500/10 text-violet-600 dark:text-violet-400' },
  ];
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t('ov.title')}</h1>
        <p className="text-sm text-muted">{t('ov.welcome')}</p>
      </div>

      {/* KPI grid — label row with soft-tinted icon, tabular value, delta pill */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {KPI_CARDS.map((k) => {
          const Icon = k.icon;
          const up = k.delta >= 0;
          return (
            <Card key={k.label} className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted">{k.label}</p>
                <div className={`grid h-9 w-9 place-items-center rounded-lg ${k.iconCls}`}>
                  <Icon className="h-[18px] w-[18px]" />
                </div>
              </div>
              <p className="tabular mt-3 text-3xl font-bold tracking-tight">{k.value}</p>
              <div className="mt-3 flex items-center gap-2">
                <span
                  className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold ${
                    up ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-red-500/10 text-red-600 dark:text-red-400'
                  }`}
                >
                  {up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                  {Math.abs(k.delta)}%
                </span>
                <span className="text-xs text-muted">{t('ov.vsLastMonth')}</span>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-semibold">{t('ov.revenue')}</h2>
              <p className="text-xs text-muted">{t('ov.monthlyGross')} (₪)</p>
            </div>
          </div>
          <RevenueChart data={REVENUE_SERIES} />
        </Card>
        <Card className="p-5">
          <h2 className="font-semibold">{t('ov.byCategory')}</h2>
          <p className="text-xs text-muted mb-2">{t('ov.distribution')}</p>
          <CategoryPie data={CATEGORY_SPLIT} />
        </Card>
      </div>

      {/* Activity + verification queue */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <h2 className="mb-2 font-semibold">{t('ov.recentActivity')}</h2>
          <div className="divide-y divide-[rgb(var(--border))]">
            {ACTIVITY.map((a) => {
              const meta: Record<string, { icon: any; cls: string }> = {
                verify: { icon: ShieldCheck, cls: 'bg-brand-500/10 text-brand-600 dark:text-brand-400' },
                complaint: { icon: MessageSquareWarning, cls: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' },
                subscription: { icon: CreditCard, cls: 'bg-violet-500/10 text-violet-600 dark:text-violet-400' },
                request: { icon: ClipboardList, cls: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400' },
                category: { icon: Layers, cls: 'bg-slate-500/10 text-slate-600 dark:text-slate-400' },
              };
              const m = meta[a.type] ?? meta.request;
              const AIcon = m.icon;
              return (
                <div key={a.id} className="flex items-center gap-3 py-3 first:pt-1 last:pb-1">
                  <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${m.cls}`}>
                    <AIcon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{locale === 'ar' ? ACTIVITY_AR[a.id] : a.text}</p>
                    <p className="text-xs text-muted">{timeAgo(a.time, locale)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
        <Card className="p-5">
          <h2 className="mb-4 font-semibold">{t('ov.pendingVerifications')}</h2>
          <div className="space-y-3">
            {VERIFICATIONS.slice(0, 4).map((v) => (
              <div key={v.id} className="flex items-center gap-3">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand-500 to-accent-500 text-xs font-bold text-white">
                  {v.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                </div>
                <div className="min-w-0 flex-1">
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
