'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { LifeBuoy, Loader2, Phone, Send, ShieldOff, Trash2 } from 'lucide-react';
import { Badge, Button, Card, FilterTabs, StatusPill } from '@/components/ui/primitives';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Initials } from '@/components/ui/people';
import { isLive } from '@/lib/firebase';
import { useCollection } from '@/lib/live-data';
import { formatPhone } from '@/lib/phone';
import { cn, timeAgo } from '@/lib/utils';
import { useT, type TKey } from '@/lib/i18n';
import {
  SUPPORT_TEXT_MAX,
  deleteThreads,
  markThreadRead,
  replyToThread,
  subscribeSupportMessages,
  subscribeSupportThreads,
  type SupportMessage,
  type SupportThread,
} from '@/lib/support.service';
import { manageUser, UserActionFailed } from '@/lib/users.service';

type Filter = 'waiting' | 'all';

/**
 * Users' chats with the Qareeb team (the app's "Chat with Qareeb", also open
 * to suspended accounts). Waiting = the user wrote last. Opening a thread marks
 * it read; a reply reaches the user as a notification. A suspended account can
 * be reactivated from the conversation.
 */
export default function SupportPage() {
  const { t, locale } = useT();
  const [threads, setThreads] = useState<SupportThread[] | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>('waiting');
  // Deleting every conversation (asked first): the count it was asked for, and progress.
  const [clearing, setClearing] = useState<{ busy: boolean } | null>(null);
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);
  useEffect(() => subscribeSupportThreads(setThreads), []);
  // The account as it is now (status, reason), not as the thread last saw it.
  const users = useCollection('users');
  const userOf = (uid: string) => users?.find((u) => u.id === uid);

  const all = threads ?? [];
  const waiting = all.filter((x) => x.lastFrom === 'user');
  const shown = filter === 'waiting' ? waiting : all;
  const current = all.find((x) => x.uid === selected) ?? null;

  // Open the first thread on arrival, so the page never starts empty.
  useEffect(() => {
    if (!selected && shown.length) setSelected(shown[0].uid);
  }, [selected, shown]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">{t('sup.title')}</h1>
        {all.length > 0 && (
          <Button variant="outline" size="sm" onClick={() => setClearing({ busy: false })}>
            <Trash2 className="h-4 w-4 text-red-500" /> {t('sup.deleteAll')}
          </Button>
        )}
      </div>
      {notice && (
        <p role="status" className={cn('rounded-xl p-3 text-sm', notice.ok ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' : 'bg-red-500/10 text-red-600')}>
          {notice.text}
        </p>
      )}
      <FilterTabs
        value={filter}
        onChange={setFilter}
        tabs={(['waiting', 'all'] as Filter[]).map((k) => ({ key: k, label: t(`sup.filter.${k}` as TKey), count: k === 'waiting' ? waiting.length : all.length }))}
      />

      <Card className="grid min-h-[34rem] overflow-hidden p-0 md:grid-cols-[20rem_1fr]">
        {/* Threads */}
        <div className="max-h-[40rem] overflow-y-auto border-b border-base md:border-b-0 md:border-e">
          {threads === null ? (
            <p className="flex items-center justify-center gap-2 p-8 text-sm text-muted">
              <Loader2 className="h-4 w-4 animate-spin" /> {t('sup.loading')}
            </p>
          ) : shown.length === 0 ? (
            <p className="p-8 text-center text-sm text-muted">{filter === 'waiting' ? t('sup.noneWaiting') : t('sup.empty')}</p>
          ) : (
            shown.map((x) => {
              const u = userOf(x.uid);
              const name = (u?.fullName as string) || x.name;
              return (
                <button
                  key={x.uid}
                  type="button"
                  onClick={() => setSelected(x.uid)}
                  className={cn(
                    'flex w-full items-start gap-3 border-b border-base px-4 py-3 text-start transition-colors hover:bg-slate-500/5',
                    selected === x.uid && 'bg-brand-500/10',
                  )}
                >
                  <Initials name={name} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className={cn('truncate text-sm', x.unreadForAdmin ? 'font-bold' : 'font-medium')}>{name}</p>
                      {u?.status === 'suspended' && <ShieldOff className="h-3.5 w-3.5 shrink-0 text-red-500" aria-label={t('status.suspended')} />}
                      <span className="ms-auto shrink-0 text-[11px] text-muted">{timeAgo(x.lastAt, locale)}</span>
                    </div>
                    <p className={cn('mt-0.5 truncate text-xs', x.unreadForAdmin ? 'text-[rgb(var(--fg))]' : 'text-muted')}>
                      {x.lastFrom === 'admin' ? `${t('sup.you')}: ` : ''}
                      {x.lastMessage}
                    </p>
                  </div>
                  {x.unreadForAdmin && <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-red-500" aria-label={t('sup.unread')} />}
                </button>
              );
            })
          )}
        </div>

        {/* Conversation */}
        {current ? (
          <Conversation key={current.uid} thread={current} user={userOf(current.uid)} onDeleted={() => setSelected(null)} />
        ) : (
          <div className="grid place-items-center p-10 text-center text-sm text-muted">
            <div className="space-y-2">
              <LifeBuoy className="mx-auto h-8 w-8 opacity-60" />
              <p>{t('sup.pick')}</p>
            </div>
          </div>
        )}
      </Card>

      {clearing && (
        <ConfirmDialog
          title={t('sup.deleteAllTitle')}
          confirmLabel={t('sup.deleteAllConfirm')}
          cancelLabel={t('price.cancel')}
          danger
          busy={clearing.busy}
          onConfirm={async () => {
            setClearing({ busy: true });
            try {
              const n = all.length;
              await deleteThreads(all.map((x) => x.uid));
              setSelected(null);
              setNotice({ ok: true, text: t('sup.deletedAll').replace('{n}', String(n)) });
            } catch (e) {
              console.warn('[support delete]', e);
              setNotice({ ok: false, text: t('sup.deleteFailed') });
            } finally {
              setClearing(null);
            }
          }}
          onCancel={() => setClearing(null)}
        >
          <p>{t('sup.deleteAllBody').replace('{n}', String(all.length))}</p>
        </ConfirmDialog>
      )}
    </div>
  );
}

function Conversation({ thread, user, onDeleted }: { thread: SupportThread; user?: Record<string, any>; onDeleted: () => void }) {
  const { t, locale } = useT();
  const [messages, setMessages] = useState<SupportMessage[] | null>(null);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [reactivating, setReactivating] = useState(false);
  const [deleting, setDeleting] = useState<{ busy: boolean } | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => subscribeSupportMessages(thread.uid, setMessages), [thread.uid]);
  useEffect(() => {
    if (thread.unreadForAdmin) void markThreadRead(thread.uid);
  }, [thread.uid, thread.unreadForAdmin]);
  // Braces: newer browsers return a promise from scrollIntoView, and an effect
  // must not return anything but a cleanup function.
  useEffect(() => {
    end.current?.scrollIntoView({ block: 'end' });
  }, [messages?.length]);

  const name = (user?.fullName as string) || thread.name;
  const phone = (user?.phone as string) || thread.phone;
  const status = (user?.status as string) || (isLive() ? undefined : 'active');
  const suspended = status === 'suspended';

  const send = async () => {
    if (!text.trim() || sending) return;
    setSending(true);
    setError(null);
    try {
      await replyToThread(thread.uid, text);
      setText('');
    } catch (e) {
      console.warn('[support reply]', e);
      setError(t('sup.sendFailed'));
    } finally {
      setSending(false);
    }
  };

  const reactivate = async () => {
    setReactivating(true);
    try {
      await manageUser('reactivate', thread.uid);
      setNotice(t('users.done.reactivate'));
      setConfirming(false);
    } catch (e) {
      setError(t(`users.err.${e instanceof UserActionFailed ? e.reason : 'generic'}` as TKey));
      setConfirming(false);
    } finally {
      setReactivating(false);
    }
  };

  return (
    <div className="flex min-h-0 flex-col">
      <div className="flex flex-wrap items-center gap-3 border-b border-base p-4">
        <Initials name={name} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <p className="font-semibold">{name}</p>
            <Badge tone="brand">{t(`role.${thread.role}` as TKey)}</Badge>
            {status && <StatusPill status={status} />}
          </div>
          {phone && (
            <a href={`tel:${phone}`} className="mt-0.5 inline-flex items-center gap-1 text-xs text-brand-500 hover:underline">
              <Phone className="h-3 w-3" /> <span dir="ltr">{formatPhone(phone)}</span>
            </a>
          )}
        </div>
        {suspended && (
          <Button size="sm" variant="outline" onClick={() => setConfirming(true)}>
            {t('users.reactivate')}
          </Button>
        )}
        <Button size="sm" variant="ghost" title={t('sup.delete')} onClick={() => setDeleting({ busy: false })}>
          <Trash2 className="h-4 w-4 text-red-500" />
        </Button>
      </div>
      {suspended && user?.suspendReason && (
        <p className="border-b border-base bg-red-500/5 px-4 py-2 text-xs text-red-600">
          {t('sup.suspendedFor')}: {String(user.suspendReason)}
        </p>
      )}

      <div className="max-h-[28rem] min-h-[18rem] flex-1 space-y-2.5 overflow-y-auto p-4">
        {messages === null ? (
          <p className="flex items-center justify-center gap-2 py-8 text-sm text-muted">
            <Loader2 className="h-4 w-4 animate-spin" /> {t('sup.loading')}
          </p>
        ) : (
          messages.map((m) => {
            const team = m.from === 'admin';
            return (
              <div key={m.id} className={cn('flex', team ? 'justify-end' : 'justify-start')}>
                <div
                  className={cn(
                    'max-w-[75%] rounded-2xl px-3.5 py-2 text-sm',
                    team ? 'rounded-ee-md bg-brand-600 text-white' : 'rounded-es-md border border-base bg-slate-500/5',
                  )}
                >
                  {team && <p className="mb-0.5 text-[10px] font-semibold opacity-80">{t('sup.team')}</p>}
                  <p className="whitespace-pre-wrap break-words">{m.text}</p>
                  <p className={cn('mt-1 text-[10px]', team ? 'text-white/70' : 'text-muted')}>{timeAgo(m.createdAt, locale)}</p>
                </div>
              </div>
            );
          })
        )}
        <div ref={end} />
      </div>

      {(error || notice) && (
        <p role="status" className={cn('mx-4 mb-2 rounded-xl p-2.5 text-sm', error ? 'bg-red-500/10 text-red-600' : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400')}>
          {error ?? notice}
        </p>
      )}
      <div className="flex items-end gap-2 border-t border-base p-3">
        <textarea
          value={text}
          maxLength={SUPPORT_TEXT_MAX}
          rows={2}
          aria-label={t('sup.reply')}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            // Enter sends; Shift+Enter starts a new line.
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              void send();
            }
          }}
          className="surface min-h-[2.75rem] flex-1 resize-none rounded-xl border border-base px-3 py-2 text-sm outline-none focus:border-brand-500"
        />
        <Button disabled={!text.trim() || sending} onClick={send}>
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4 rtl:-scale-x-100" />} {t('sup.send')}
        </Button>
      </div>

      {deleting && (
        <ConfirmDialog
          title={t('sup.deleteTitle').replace('{name}', name)}
          confirmLabel={t('sup.delete')}
          cancelLabel={t('price.cancel')}
          danger
          busy={deleting.busy}
          onConfirm={async () => {
            setDeleting({ busy: true });
            try {
              await deleteThreads([thread.uid]);
              onDeleted();
            } catch (e) {
              console.warn('[support delete]', e);
              setError(t('sup.deleteFailed'));
              setDeleting(null);
            }
          }}
          onCancel={() => setDeleting(null)}
        >
          <p>{t('sup.deleteBody')}</p>
        </ConfirmDialog>
      )}
      {confirming && (
        <ConfirmDialog
          title={t('sup.reactivateTitle').replace('{name}', name)}
          confirmLabel={t('users.reactivate')}
          cancelLabel={t('price.cancel')}
          busy={reactivating}
          onConfirm={reactivate}
          onCancel={() => setConfirming(false)}
        >
          <p>{t('users.reactivateHint')}</p>
        </ConfirmDialog>
      )}
    </div>
  );
}
