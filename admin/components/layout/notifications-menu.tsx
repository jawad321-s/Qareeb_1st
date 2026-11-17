'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@heroui/react';
import { Bell, LifeBuoy, Lightbulb, Megaphone, MessageSquareWarning, ShieldCheck, type LucideIcon } from 'lucide-react';
import { useT, type TKey } from '@/lib/i18n';
import { isLive } from '@/lib/firebase';
import { toMillis, useCollection, toComplaints, toSuggestions } from '@/lib/live-data';
import { subscribeVerifications } from '@/lib/verification.service';
import { complaintReason } from '@/lib/feedback';
import { COMPLAINTS, SUGGESTIONS, type VerificationItem } from '@/lib/mock-data';
import { timeAgo, cn } from '@/lib/utils';

type Kind = 'verify' | 'complaint' | 'support' | 'suggestion' | 'broadcast';
interface Item {
  id: string;
  kind: Kind;
  text: string;
  time: number;
  href: string;
}

const KIND: Record<Kind, { icon: LucideIcon; color: string; href: string; label: TKey }> = {
  verify: { icon: ShieldCheck, color: 'text-emerald-600 bg-emerald-500/10', href: '/artisans', label: 'notif.kind.verify' },
  complaint: { icon: MessageSquareWarning, color: 'text-red-600 bg-red-500/10', href: '/complaints', label: 'notif.kind.complaint' },
  support: { icon: LifeBuoy, color: 'text-sky-600 bg-sky-500/10', href: '/support', label: 'notif.kind.support' },
  suggestion: { icon: Lightbulb, color: 'text-amber-600 bg-amber-500/10', href: '/suggestions', label: 'notif.kind.suggestion' },
  broadcast: { icon: Megaphone, color: 'text-violet-600 bg-violet-500/10', href: '/broadcasts', label: 'notif.kind.broadcast' },
};

const SEEN_KEY = 'qareeb.admin.notifSeen';
const readSeen = () => {
  try {
    return Number(localStorage.getItem(SEEN_KEY)) || 0;
  } catch {
    return 0;
  }
};

/**
 * The bell in the top bar: what is waiting for the team — artisans asking to
 * be verified, open complaints, unread support chats, new service suggestions and system
 * notifications that couldn't be sent. The red count is what arrived since
 * the bell was last opened; each line opens its page.
 */
export function NotificationsMenu() {
  const { t, locale } = useT();
  const router = useRouter();
  const live = isLive();
  const [verifications, setVerifications] = useState<VerificationItem[]>([]);
  useEffect(() => subscribeVerifications(setVerifications), []);
  const complaints = useCollection('complaints');
  const suggestions = useCollection('suggestions');
  const broadcasts = useCollection('broadcasts');
  const support = useCollection('supportThreads');
  const [open, setOpen] = useState(false);
  const [seen, setSeen] = useState(0);
  // What was new when the menu opened keeps its dot until it closes.
  const [seenBefore, setSeenBefore] = useState(0);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => setSeen(readSeen()), []);

  const items = useMemo<Item[]>(() => {
    const list: Item[] = [];
    for (const v of verifications.filter((x) => x.status === 'pending')) {
      list.push({ id: `v_${v.id}`, kind: 'verify', text: t('notif.verify').replace('{name}', v.name), time: v.submittedAt, href: KIND.verify.href });
    }
    const c = live ? toComplaints(complaints ?? []) : COMPLAINTS;
    for (const x of c.filter((x) => x.status === 'open' || x.status === 'reviewing')) {
      const about = x.target ? t('notif.complaintAbout').replace('{name}', x.target) : t('notif.complaintGeneral');
      list.push({ id: `c_${x.id}`, kind: 'complaint', text: `${about}: ${complaintReason(x, locale)}`, time: x.createdAt, href: KIND.complaint.href });
    }
    for (const x of (support ?? []).filter((x) => x.unreadForAdmin === true)) {
      const text = t('notif.support').replace('{name}', x.name ?? '').replace('{text}', String(x.lastMessage ?? '').slice(0, 60));
      list.push({ id: `h_${x.id}`, kind: 'support', text, time: Number(x.lastAt) || 0, href: KIND.support.href });
    }
    const s = live ? toSuggestions(suggestions ?? []) : SUGGESTIONS;
    for (const x of s.filter((x) => x.status === 'new')) {
      list.push({ id: `s_${x.id}`, kind: 'suggestion', text: t('notif.suggestion').replace('{name}', x.name), time: x.createdAt, href: KIND.suggestion.href });
    }
    for (const b of (broadcasts ?? []).filter((b) => b.status === 'failed')) {
      list.push({ id: `b_${b.id}`, kind: 'broadcast', text: t('notif.broadcastFailed').replace('{title}', b.title ?? ''), time: toMillis(b.createdAt), href: KIND.broadcast.href });
    }
    return list.sort((a, b) => b.time - a.time);
  }, [verifications, complaints, support, suggestions, broadcasts, live, t, locale]);

  const fresh = items.filter((i) => i.time > seen).length;
  const counts = (Object.keys(KIND) as Kind[]).map((k) => ({ kind: k, n: items.filter((i) => i.kind === k).length })).filter((c) => c.n > 0);

  const toggle = () => {
    if (!open) {
      setSeenBefore(seen);
      const now = Date.now();
      setSeen(now);
      try {
        localStorage.setItem(SEEN_KEY, String(now));
      } catch {}
    }
    setOpen(!open);
  };

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => box.current && !box.current.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const go = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  return (
    <div className="relative" ref={box}>
      <Button variant="outline" isIconOnly aria-label={fresh ? `${t('notif.title')} (${fresh})` : t('notif.title')} aria-expanded={open} onPress={toggle}>
        <Bell className="h-[18px] w-[18px]" />
      </Button>
      {fresh > 0 && (
        <span className="pointer-events-none absolute -end-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
          {fresh > 9 ? '9+' : fresh}
        </span>
      )}
      {open && (
        <div role="dialog" aria-label={t('notif.title')} className="surface absolute end-0 top-full z-30 mt-2 w-[22rem] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-base shadow-xl">
          <div className="border-b border-base p-4">
            <p className="font-semibold">{t('notif.title')}</p>
            {counts.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {counts.map((c) => (
                  <button key={c.kind} type="button" onClick={() => go(KIND[c.kind].href)} className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium', KIND[c.kind].color)}>
                    {t(KIND[c.kind].label)} · {c.n}
                  </button>
                ))}
              </div>
            )}
          </div>
          {items.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted">{t('notif.empty')}</p>
          ) : (
            <ul className="max-h-96 overflow-y-auto">
              {items.slice(0, 12).map((i) => {
                const Icon = KIND[i.kind].icon;
                return (
                  <li key={i.id}>
                    <button type="button" onClick={() => go(i.href)} className="flex w-full items-start gap-3 px-4 py-3 text-start hover:bg-slate-500/5">
                      <span className={cn('grid h-8 w-8 shrink-0 place-items-center rounded-lg', KIND[i.kind].color)}>
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm leading-snug">{i.text}</span>
                        <span className="mt-0.5 block text-xs text-muted">{timeAgo(i.time, locale)}</span>
                      </span>
                      {i.time > seenBefore && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-red-500" aria-label={t('notif.new')} />}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
