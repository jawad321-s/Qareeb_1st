'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Users, ShieldCheck, ClipboardList, BarChart3,
  Layers, MessageSquareWarning, Lightbulb, LifeBuoy, Megaphone, CreditCard, Settings, Menu, X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useT, type TKey } from '@/lib/i18n';
import { isLive } from '@/lib/firebase';
import { useCollection } from '@/lib/live-data';
import { COMPLAINTS, SUGGESTIONS } from '@/lib/mock-data';

const NAV: { href: string; label: TKey; icon: any }[] = [
  { href: '/', label: 'nav.overview', icon: LayoutDashboard },
  { href: '/users', label: 'nav.users', icon: Users },
  { href: '/artisans', label: 'nav.verifications', icon: ShieldCheck },
  { href: '/requests', label: 'nav.requests', icon: ClipboardList },
  { href: '/analytics', label: 'nav.analytics', icon: BarChart3 },
  { href: '/categories', label: 'nav.categories', icon: Layers },
  { href: '/complaints', label: 'nav.complaints', icon: MessageSquareWarning },
  { href: '/support', label: 'nav.support', icon: LifeBuoy },
  { href: '/suggestions', label: 'nav.suggestions', icon: Lightbulb },
  { href: '/subscriptions', label: 'nav.subscriptions', icon: CreditCard },
  { href: '/broadcasts', label: 'nav.broadcasts', icon: Megaphone },
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

/** What waits for the team: open complaints, unread support chats and new suggestions, shown on their links. */
function useWaitingCounts(): Record<string, number> {
  const live = isLive();
  const complaints = useCollection('complaints');
  const suggestions = useCollection('suggestions');
  const support = useCollection('supportThreads');
  const c = (live ? complaints ?? [] : COMPLAINTS).map((x) => x.status ?? 'open');
  const s = (live ? suggestions ?? [] : SUGGESTIONS).map((x) => x.status ?? 'new');
  return {
    '/complaints': c.filter((st) => st === 'open' || st === 'reviewing').length,
    '/suggestions': s.filter((st) => st === 'new').length,
    '/support': (support ?? []).filter((x) => x.unreadForAdmin === true).length,
  };
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { t } = useT();
  const waiting = useWaitingCounts();
  return (
    <nav className="flex-1 space-y-1 overflow-y-auto p-3">
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
            {!!waiting[item.href] && (
              <span
                className={cn(
                  'ms-auto min-w-5 rounded-full px-1.5 text-center text-xs font-semibold',
                  active ? 'bg-white/25 text-white' : 'bg-red-500 text-white',
                )}
              >
                {waiting[item.href]}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

export function Sidebar() {
  return (
    <aside className="hidden h-full w-64 shrink-0 flex-col border-e border-base surface lg:flex">
      <div className="flex h-16 shrink-0 items-center border-b border-base px-6">
        <Brand />
      </div>
      <NavLinks />
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
