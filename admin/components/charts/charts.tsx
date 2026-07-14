'use client';

import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';

const AXIS = { stroke: 'rgb(148 163 184)', fontSize: 12 };
const GRID = 'rgb(148 163 184 / 0.15)';

const tooltipStyle = {
  borderRadius: 12,
  border: '1px solid rgb(148 163 184 / 0.2)',
  background: 'rgb(30 41 59)',
  color: '#fff',
  fontSize: 12,
};

export function RevenueChart({ data }: { data: { month: string; revenue: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ left: -10, right: 8, top: 8 }}>
        <defs>
          <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366F1" stopOpacity={0.4} />
            <stop offset="100%" stopColor="#6366F1" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
        <XAxis dataKey="month" tickLine={false} axisLine={false} tick={AXIS} />
        <YAxis tickLine={false} axisLine={false} tick={AXIS} tickFormatter={(v) => `${v / 1000}k`} />
        <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v.toLocaleString()} ₪`, 'Revenue']} />
        <Area type="monotone" dataKey="revenue" stroke="#6366F1" strokeWidth={2.5} fill="url(#rev)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function RequestsBarChart({ data }: { data: { month: string; requests: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ left: -10, right: 8, top: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
        <XAxis dataKey="month" tickLine={false} axisLine={false} tick={AXIS} />
        <YAxis tickLine={false} axisLine={false} tick={AXIS} />
        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgb(148 163 184 / 0.1)' }} />
        <Bar dataKey="requests" fill="#06B6D4" radius={[6, 6, 0, 0]} maxBarSize={28} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function CategoryPie({ data }: { data: { name: string; value: number }[] }) {
  const COLORS = ['#6366F1', '#06B6D4', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#8B5CF6', '#0EA5E9'];
  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={64} outerRadius={100} paddingAngle={2}>
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip contentStyle={tooltipStyle} />
      </PieChart>
    </ResponsiveContainer>
  );
}
