'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Users, ShieldCheck, ClipboardList, BarChart3,
  Layers, MessageSquareWarning, CreditCard, Settings, Wrench,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useT, type TKey } from '@/lib/i18n';

const NAV: { href: string; label: TKey; icon: any }[] = [
  { href: '/', label: 'nav.overview', icon: LayoutDashboard },
  { href: '/users', label: 'nav.users', icon: Users },
  { href: '/artisans', label: 'nav.verifications', icon: ShieldCheck },
  { href: '/requests', label: 'nav.requests', icon: ClipboardList },
  { href: '/analytics', label: 'nav.analytics', icon: BarChart3 },
  { href: '/categories', label: 'nav.categories', icon: Layers },
  { href: '/complaints', label: 'nav.complaints', icon: MessageSquareWarning },
  { href: '/subscriptions', label: 'nav.subscriptions', icon: CreditCard },
  { href: '/settings', label: 'nav.settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { t } = useT();
  return (
    <aside className="hidden lg:flex w-64 shrink-0 flex-col border-e border-base surface">
      <div className="flex items-center gap-2.5 px-6 h-16 border-b border-base">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-brand-600 to-accent-500">
          <Wrench className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="font-bold leading-none">{t('app.name')}</p>
          <p className="text-[11px] text-muted">{t('app.console')}</p>
        </div>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {NAV.map((item) => {
          const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                active ? 'bg-brand-600 text-white shadow-sm' : 'text-muted hover:bg-slate-500/10',
              )}
            >
              <Icon className="h-[18px] w-[18px]" />
              {t(item.label)}
            </Link>
          );
        })}
      </nav>
      <div className="m-3 rounded-xl bg-gradient-to-br from-brand-600 to-accent-500 p-4 text-white">
        <p className="text-sm font-semibold">{t('sidebar.help')}</p>
        <p className="mt-1 text-xs text-white/80">{t('sidebar.helpDesc')}</p>
      </div>
    </aside>
  );
}
