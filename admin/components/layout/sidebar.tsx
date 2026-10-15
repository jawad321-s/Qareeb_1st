'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Users, ShieldCheck, ClipboardList, BarChart3,
  Layers, MessageSquareWarning, CreditCard, Settings, Menu, X,
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

function Brand() {
  const { t } = useT();
  return (
    <div className="flex items-center gap-2.5">
      <div className="grid h-9 w-9 place-items-center rounded-xl bg-[#031746]">
        <img src="/brand/mark-white.png" alt="قريب" className="h-6 w-auto" />
      </div>
      <div>
        <p className="font-bold leading-none">{t('app.name')}</p>
        <p className="text-[11px] text-muted">{t('app.console')}</p>
      </div>
    </div>
  );
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { t } = useT();
  return (
    <nav className="flex-1 space-y-1 p-3">
      {NAV.map((item) => {
        const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
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
  );
}

export function Sidebar() {
  const { t } = useT();
  return (
    <aside className="hidden lg:flex w-64 shrink-0 flex-col border-e border-base surface">
      <div className="flex items-center px-6 h-16 border-b border-base">
        <Brand />
      </div>
      <NavLinks />
      <div className="m-3 rounded-xl bg-gradient-to-br from-brand-600 to-accent-500 p-4 text-white">
        <p className="text-sm font-semibold">{t('sidebar.help')}</p>
        <p className="mt-1 text-xs text-white/80">{t('sidebar.helpDesc')}</p>
      </div>
    </aside>
  );
}

/**
 * The same navigation for screens narrower than the sidebar's breakpoint
 * (lg): a menu button in the top bar that opens it as a drawer. The drawer is
 * portalled to <body>: the top bar's backdrop blur would otherwise become the
 * containing block of its `fixed` layers and clip them to the bar.
 */
export function MobileNav() {
  const { t } = useT();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t('nav.menu')}
        className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-base hover:bg-slate-500/10 lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>
      {open && createPortal(
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label={t('nav.menu')}>
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <aside className="surface absolute inset-y-0 start-0 flex w-72 max-w-[85vw] flex-col border-e border-base shadow-xl">
            <div className="flex h-16 items-center justify-between border-b border-base px-5">
              <Brand />
              <button type="button" onClick={() => setOpen(false)} aria-label={t('ver.close')} className="rounded-lg p-1.5 hover:bg-slate-500/10">
                <X className="h-5 w-5" />
              </button>
            </div>
            <NavLinks onNavigate={() => setOpen(false)} />
          </aside>
        </div>,
        document.body,
      )}
    </>
  );
}
