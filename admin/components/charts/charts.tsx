'use client';

import { useEffect, useState } from 'react';
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { useT } from '@/lib/i18n';

const AXIS = { stroke: 'rgb(148 163 184)', fontSize: 12 };
const GRID = 'rgb(148 163 184 / 0.15)';

/**
 * Tooltips follow the page's theme: a card-coloured box with the page's text
 * colour. (Recharts paints each row in the series colour by default, which is
 * what made the numbers unreadable on the old dark box.)
 */
const tooltipBox = {
  borderRadius: 12,
  border: '1px solid rgb(var(--border))',
  background: 'rgb(var(--surface))',
  color: 'rgb(var(--fg))',
  boxShadow: '0 8px 24px rgb(15 23 42 / 0.14)',
  fontSize: 13,
  padding: '8px 12px',
};
const tooltipItem = { color: 'rgb(var(--fg))', fontWeight: 600 };
const tooltipLabel = { color: 'rgb(var(--muted))', marginBottom: 2 };

/**
 * One colour per category, in a fixed order, picked so that neighbouring
 * slices stay apart for colour-blind readers too (checked with a palette
 * validator against the dashboard's light and dark cards). Dark mode uses
 * the same hues, stepped for the dark background.
 */
const SERIES = {
  light: ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300', '#6250d6', '#e34948'],
  dark: ['#3987e5', '#d95926', '#199e70', '#c98500', '#d55181', '#0ca30c', '#9085e9', '#e66767'],
};

/** Whether the dashboard is in dark mode (the <html> class the theme button toggles). */
function useIsDark() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const html = document.documentElement;
    const read = () => setDark(html.classList.contains('dark'));
    read();
    const watch = new MutationObserver(read);
    watch.observe(html, { attributes: true, attributeFilter: ['class'] });
    return () => watch.disconnect();
  }, []);
  return dark;
}

export function RevenueChart({ data, height = 280 }: { data: { month: string; revenue: number }[]; height?: number }) {
  const { t } = useT();
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ left: -10, right: 8, top: 8 }}>
        <defs>
          <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.4} />
            <stop offset="100%" stopColor="#3B82F6" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
        <XAxis dataKey="month" tickLine={false} axisLine={false} tick={AXIS} interval="preserveStartEnd" minTickGap={14} />
        <YAxis tickLine={false} axisLine={false} tick={AXIS} tickFormatter={(v) => `${v / 1000}k`} />
        <Tooltip
          contentStyle={tooltipBox}
          itemStyle={tooltipItem}
          labelStyle={tooltipLabel}
          formatter={(v: number) => [`${v.toLocaleString()} ₪`, t('ov.revenue')]}
        />
        <Area type="monotone" dataKey="revenue" stroke="#3B82F6" strokeWidth={2.5} fill="url(#rev)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function RequestsBarChart({ data }: { data: { month: string; requests: number }[] }) {
  const { t } = useT();
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ left: -10, right: 8, top: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
        <XAxis dataKey="month" tickLine={false} axisLine={false} tick={AXIS} interval="preserveStartEnd" minTickGap={14} />
        <YAxis tickLine={false} axisLine={false} tick={AXIS} />
        <Tooltip
          contentStyle={tooltipBox}
          itemStyle={tooltipItem}
          labelStyle={tooltipLabel}
          cursor={{ fill: 'rgb(148 163 184 / 0.1)' }}
          formatter={(v: number) => [v.toLocaleString(), t('nav.requests')]}
        />
        <Bar dataKey="requests" fill="#0EA5E9" radius={[6, 6, 0, 0]} maxBarSize={28} />
      </BarChart>
    </ResponsiveContainer>
  );
}

type Slice = { name: string; value: number; color: string; share: number };

/** Hovering a slice: the number first and large, the category under it. */
function SliceTooltip({ active, payload }: { active?: boolean; payload?: { payload: Slice }[] }) {
  const s = active ? payload?.[0]?.payload : undefined;
  if (!s) return null;
  return (
    <div style={tooltipBox}>
      <div className="flex items-center gap-2">
        <span className="h-[3px] w-3 rounded-full" style={{ background: s.color }} />
        <span className="tabular text-base font-bold leading-tight">{s.value.toLocaleString()}</span>
        <span className="tabular text-xs text-muted">({s.share}%)</span>
      </div>
      <p className="mt-0.5 text-xs text-muted">{s.name}</p>
    </div>
  );
}

/**
 * Requests per category: a donut with the total in its middle and, under it,
 * every category with its number and share, so nothing depends on hovering
 * or on telling colours apart.
 */
export function CategoryPie({ data }: { data: { name: string; value: number }[] }) {
  const { t } = useT();
  const palette = useIsDark() ? SERIES.dark : SERIES.light;

  // Largest first; past eight categories the rest fold into "Other".
  const sorted = [...data].filter((d) => d.value > 0).sort((a, b) => b.value - a.value);
  const rows = sorted.length > palette.length
    ? [...sorted.slice(0, palette.length - 1), { name: t('ov.other'), value: sorted.slice(palette.length - 1).reduce((n, d) => n + d.value, 0) }]
    : sorted;
  const total = rows.reduce((n, d) => n + d.value, 0);
  const slices: Slice[] = rows.map((d, i) => ({
    ...d,
    color: palette[i],
    share: total ? Math.round((d.value / total) * 100) : 0,
  }));

  return (
    <div>
      <div className="relative">
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={slices}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={92}
              paddingAngle={2}
              stroke="none"
              isAnimationActive={false}
            >
              {slices.map((s) => (
                <Cell key={s.name} fill={s.color} />
              ))}
            </Pie>
            <Tooltip content={<SliceTooltip />} wrapperStyle={{ zIndex: 10 }} />
          </PieChart>
        </ResponsiveContainer>
        {/* The total, in the hole of the donut. */}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="tabular text-2xl font-bold leading-none">{total.toLocaleString()}</span>
          <span className="mt-1 text-xs text-muted">{t('nav.requests')}</span>
        </div>
      </div>

      <ul className="mt-3 space-y-1.5">
        {slices.map((s) => (
          <li key={s.name} className="flex min-w-0 items-center gap-2.5 text-sm">
            <span className="h-2.5 w-2.5 shrink-0 rounded-[3px]" style={{ background: s.color }} />
            <span className="min-w-0 flex-1 truncate text-muted" title={s.name}>{s.name}</span>
            <span className="tabular shrink-0 font-semibold">{s.value.toLocaleString()}</span>
            <span className="tabular w-9 shrink-0 text-end text-xs text-muted">{s.share}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
