'use client';

import { useEffect, useMemo, useState } from 'react';
import { deleteDoc, doc } from 'firebase/firestore';
import { Megaphone, Send, Trash2 } from 'lucide-react';
import { Badge, Button, Card, FilterTabs, StatusPill } from '@/components/ui/primitives';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useT, type TKey } from '@/lib/i18n';
import { getDb, isLive } from '@/lib/firebase';
import { toMillis, useCollection } from '@/lib/live-data';
import { BODY_MAX, TITLE_MAX, sendBroadcast, type Audience } from '@/lib/broadcasts';
import { waitForSession } from '@/lib/session';
import { timeAgo } from '@/lib/utils';
import { USERS } from '@/lib/mock-data';

interface Sent {
  id: string;
  audience: Audience;
  title: string;
  body: string;
  status: string;
  recipients?: number;
  kind?: string;
  createdAt: number;
  createdBy?: string;
}

const TEMPLATES: { key: string; title: string; body: string }[] = [
  { key: 'update', title: 'تحديث جديد لتطبيق قريب', body: 'نزّلنا تحديثاً جديداً فيه تحسينات وميزات جديدة. حدّث التطبيق من المتجر لتستفيد منها.' },
  { key: 'maintenance', title: 'صيانة مجدولة', body: 'سيتوقف التطبيق للصيانة لمدة قصيرة يوم … من الساعة … إلى الساعة …. نعتذر عن الإزعاج.' },
  { key: 'offer', title: 'عرض خاص من قريب', body: 'اكتب تفاصيل العرض هنا.' },
];

/**
 * System notifications: a message from the Qareeb team to everyone, to
 * customers or to artisans. It reaches the app's notifications and the
 * phone as a push (Cloud Function onBroadcastCreated).
 */
export default function BroadcastsPage() {
  const { t, locale } = useT();
  const live = isLive();
  const users = useCollection('users');
  const stored = useCollection('broadcasts');
  const [demoSent, setDemoSent] = useState<Sent[]>([]);
  const [audience, setAudience] = useState<Audience>('all');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);
  const [adminEmail, setAdminEmail] = useState<string>();
  useEffect(() => {
    waitForSession().then((s) => setAdminEmail(s?.email));
  }, []);

  // Who would receive it: active customer and artisan accounts.
  const counts = useMemo(() => {
    const list = (live ? users ?? [] : USERS).map((u) => ({ role: u.role as string, status: u.status as string | undefined }));
    const active = list.filter((u) => u.status !== 'suspended');
    const customers = active.filter((u) => u.role === 'customer').length;
    const artisans = active.filter((u) => u.role === 'artisan').length;
    return { all: customers + artisans, customers, artisans } as Record<Audience, number>;
  }, [live, users]);

  const history: Sent[] = live
    ? (stored ?? [])
        .map((b) => ({ id: b.id, audience: b.audience, title: b.title, body: b.body, status: b.status, recipients: b.recipients, kind: b.kind, createdAt: toMillis(b.createdAt), createdBy: b.createdBy }))
        .sort((a, b) => b.createdAt - a.createdAt)
    : demoSent;

  const valid = title.trim().length >= 2 && body.trim().length >= 2;

  const send = async () => {
    setBusy(true);
    setResult(null);
    try {
      await sendBroadcast({ audience, title, body }, adminEmail);
      if (!live) {
        setDemoSent((s) => [{ id: String(Date.now()), audience, title: title.trim(), body: body.trim(), status: 'sent', recipients: counts[audience], createdAt: Date.now(), createdBy: adminEmail }, ...s]);
      }
      setResult({ ok: true, text: t('bc.sent') });
      setTitle('');
      setBody('');
    } catch (e) {
      // Refused by Firestore: the rules that allow broadcasts aren't deployed yet.
      const denied = (e as { code?: string }).code === 'permission-denied';
      setResult({ ok: false, text: t(denied ? 'bc.rulesMissing' : 'bc.failed') });
    } finally {
      setBusy(false);
      setConfirming(false);
    }
  };

  const remove = async (id: string) => {
    if (!live) return setDemoSent((s) => s.filter((x) => x.id !== id));
    const db = getDb();
    if (db) await deleteDoc(doc(db, 'broadcasts', id)).catch(() => setResult({ ok: false, text: t('bc.failed') }));
  };

  const audienceLabel = (a: Audience) => t(`bc.aud.${a}` as TKey);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t('bc.title')}</h1>
        <p className="text-sm text-muted">{t('bc.subtitle')}</p>
      </div>

      <Card className="grid gap-6 p-5 lg:grid-cols-[1fr_18rem]">
        <div className="space-y-4">
          <div>
            <p className="mb-2 text-sm font-medium">{t('bc.audience')}</p>
            <FilterTabs
              value={audience}
              onChange={setAudience}
              tabs={(['all', 'customers', 'artisans'] as Audience[]).map((a) => ({ key: a, label: audienceLabel(a), count: counts[a] }))}
            />
          </div>
          <div>
            <p className="mb-2 text-xs text-muted">{t('bc.templates')}</p>
            <div className="flex flex-wrap gap-2">
              {TEMPLATES.map((tpl) => (
                <button
                  key={tpl.key}
                  type="button"
                  onClick={() => {
                    setTitle(tpl.title);
                    setBody(tpl.body);
                  }}
                  className="rounded-full border border-base px-3 py-1 text-xs hover:bg-slate-500/10"
                >
                  {t(`bc.tpl.${tpl.key}` as TKey)}
                </button>
              ))}
            </div>
          </div>
          <label className="block space-y-1">
            <span className="text-sm font-medium">{t('bc.titleLabel')}</span>
            <input
              value={title}
              maxLength={TITLE_MAX}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('bc.titlePlaceholder')}
              className="surface w-full rounded-xl border border-base px-3 py-2 text-sm outline-none focus:border-brand-500"
            />
          </label>
          <label className="block space-y-1">
            <span className="flex justify-between text-sm font-medium">
              {t('bc.bodyLabel')}
              <span className="text-xs font-normal text-muted">{body.length}/{BODY_MAX}</span>
            </span>
            <textarea
              value={body}
              maxLength={BODY_MAX}
              rows={4}
              onChange={(e) => setBody(e.target.value)}
              placeholder={t('bc.bodyPlaceholder')}
              className="surface w-full rounded-xl border border-base px-3 py-2 text-sm outline-none focus:border-brand-500"
            />
          </label>
          {result && (
            <p role="status" className={`rounded-xl p-3 text-sm ${result.ok ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' : 'bg-red-500/10 text-red-600'}`}>
              {result.text}
            </p>
          )}
          <Button disabled={!valid || busy} onClick={() => setConfirming(true)}>
            <Send className="h-4 w-4 rtl:-scale-x-100" /> {t('bc.send')}
          </Button>
        </div>

        {/* How it shows on the phone */}
        <div>
          <p className="mb-2 text-xs text-muted">{t('bc.preview')}</p>
          <div className="rounded-3xl border border-base bg-slate-500/5 p-3">
            <div className="flex gap-3 rounded-2xl bg-[rgb(var(--surface))] p-3 shadow-sm">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-violet-500/15">
                <Megaphone className="h-4 w-4 text-violet-600 rtl:-scale-x-100" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold">{title.trim() || t('bc.titlePlaceholder')}</p>
                <p className="mt-0.5 whitespace-pre-wrap break-words text-xs text-muted">{body.trim() || t('bc.bodyPlaceholder')}</p>
                <p className="mt-1 text-[10px] text-muted">{t('bc.now')}</p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <div className="space-y-3">
        <h2 className="font-semibold">{t('bc.history')}</h2>
        {history.length === 0 && <Card className="p-8 text-center text-sm text-muted">{t('bc.empty')}</Card>}
        {history.map((b) => (
          <Card key={b.id} className="space-y-2 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-semibold">{b.title}</p>
              <StatusPill status={b.status} />
              <Badge tone="brand">{audienceLabel(b.audience)}</Badge>
              {b.kind === 'prices' && <Badge tone="warning">{t('bc.kindPrices')}</Badge>}
              <span className="ms-auto text-xs text-muted">{timeAgo(b.createdAt, locale)}</span>
            </div>
            <p className="whitespace-pre-wrap text-sm text-muted">{b.body}</p>
            <div className="flex items-center justify-between text-xs text-muted">
              <span>
                {b.status === 'sent' ? t('bc.reached').replace('{n}', String(b.recipients ?? 0)) : b.status === 'failed' ? t('bc.failedNote') : t('bc.sendingNote')}
                {b.createdBy ? ` · ${b.createdBy}` : ''}
              </span>
              <button type="button" onClick={() => remove(b.id)} className="inline-flex items-center gap-1 rounded-lg px-2 py-1 hover:bg-slate-500/10" aria-label={t('bc.remove')}>
                <Trash2 className="h-3.5 w-3.5" /> {t('bc.remove')}
              </button>
            </div>
          </Card>
        ))}
      </div>

      {confirming && (
        <ConfirmDialog
          title={t('bc.confirmTitle')}
          confirmLabel={t('bc.confirm')}
          cancelLabel={t('price.cancel')}
          busy={busy}
          onConfirm={send}
          onCancel={() => setConfirming(false)}
        >
          <p>{t('bc.confirmBody').replace('{n}', String(counts[audience])).replace('{aud}', audienceLabel(audience))}</p>
          <div className="rounded-xl bg-slate-500/5 p-3">
            <p className="font-semibold">{title.trim()}</p>
            <p className="mt-1 whitespace-pre-wrap text-muted">{body.trim()}</p>
          </div>
          <p className="text-xs text-muted">{t('bc.confirmNote')}</p>
        </ConfirmDialog>
      )}
    </div>
  );
}
