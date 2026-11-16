'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft, Pencil } from 'lucide-react';
import { Card, Badge, Button, Input } from '@/components/ui/primitives';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { formatMoney } from '@/lib/utils';
import { useT } from '@/lib/i18n';
import { isLive } from '@/lib/firebase';
import { useCollection } from '@/lib/live-data';
import { MAX_PRICE_SHEKELS, PLANS, savePlanPrices, usePlanPrices } from '@/lib/plans';
import { BODY_MAX, TITLE_MAX, sendBroadcast } from '@/lib/broadcasts';
import { waitForSession } from '@/lib/session';

// A one-time 7-day free trial, then prepaid 3-month, 6-month and yearly plans.
// The admin sets the prices here; the app shows them at once. New prices apply
// to new purchases — plans already bought keep what was paid.

/** "129" / "129.5" ₪ → agorot, or null when it isn't a valid price. */
const toAgorot = (v: string): number | null => {
  const n = Number(v.trim().replace(',', '.'));
  if (!Number.isFinite(n) || n <= 0 || n > MAX_PRICE_SHEKELS) return null;
  return Math.round(n * 100);
};
const toShekels = (agorot: number) => String(agorot / 100);

export default function SubscriptionsPage() {
  const { t, locale } = useT();
  const live = isLive();
  // Live: plans that are running now (not cancelled, not expired), per plan.
  const subs = useCollection('subscriptions');
  const { prices, loaded } = usePlanPrices();
  // Demo mode: saved prices are kept on the page.
  const [demoPrices, setDemoPrices] = useState<Record<string, number>>({});
  const current = live ? prices : demoPrices;
  const now = Date.now();
  const activeCount = (planId: string) =>
    (subs ?? []).filter((s) => s.planId === planId && s.status !== 'cancelled' && Number(s.expiresAt) > now).length;
  const plans = PLANS.map((p) => ({
    ...p,
    price: p.price > 0 && current[p.id] ? current[p.id] : p.price,
    subscribers: live ? activeCount(p.id) : p.subscribers,
  }));
  const paid = plans.filter((p) => p.price > 0);
  // Prepaid plans spread over their length, so the figure stays monthly.
  const MRR = plans.reduce((s, p) => s + (p.months ? Math.round((p.price / p.months) * p.subscribers) : 0), 0);

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [confirming, setConfirming] = useState(false);
  const [notify, setNotify] = useState(true);
  const [notice, setNotice] = useState({ title: '', body: '' });
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);
  const [adminEmail, setAdminEmail] = useState<string>();
  useEffect(() => {
    waitForSession().then((s) => setAdminEmail(s?.email));
  }, []);

  const planName = (id: string) => {
    const p = PLANS.find((x) => x.id === id)!;
    return locale === 'ar' ? p.nameAr : p.name;
  };
  const changes = paid
    .map((p) => ({ id: p.id, from: p.price, to: toAgorot(draft[p.id] ?? '') }))
    .filter((c) => c.to !== null && c.to !== c.from) as { id: string; from: number; to: number }[];
  const invalid = paid.some((p) => toAgorot(draft[p.id] ?? '') === null);

  const startEdit = () => {
    setDraft(Object.fromEntries(paid.map((p) => [p.id, toShekels(p.price)])));
    setResult(null);
    setEditing(true);
  };

  const review = () => {
    const lines = changes.map((c) => `${planName(c.id)}: ${formatMoney(c.to)}`).join(locale === 'ar' ? '، ' : ', ');
    setNotice({ title: t('price.noticeTitle'), body: t('price.noticeBody').replace('{list}', lines) });
    setNotify(true);
    setConfirming(true);
  };

  const confirm = async () => {
    setBusy(true);
    try {
      const next = { ...Object.fromEntries(paid.map((p) => [p.id, p.price])), ...Object.fromEntries(changes.map((c) => [c.id, c.to])) };
      await savePlanPrices(next, adminEmail);
      if (!live) setDemoPrices(next);
      if (notify && notice.title.trim() && notice.body.trim()) {
        await sendBroadcast({ audience: 'artisans', title: notice.title, body: notice.body, route: '/(shared)/subscription', kind: 'prices' }, adminEmail);
      }
      setResult({ ok: true, text: t(notify ? 'price.savedNotified' : 'price.saved') });
      setEditing(false);
      setConfirming(false);
    } catch {
      setResult({ ok: false, text: t('price.saveFailed') });
      setConfirming(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('sub.title')}</h1>
          <p className="text-sm text-muted">{t('sub.subtitle')}</p>
        </div>
        {!editing && (
          <Button disabled={!loaded} onClick={startEdit}>
            <Pencil className="h-4 w-4" /> {t('price.edit')}
          </Button>
        )}
      </div>

      {result && (
        <p role="status" className={`rounded-xl p-3 text-sm ${result.ok ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' : 'bg-red-500/10 text-red-600'}`}>
          {result.text}
        </p>
      )}

      <Card className="p-5">
        <p className="text-sm text-muted">{t('sub.mrr')}</p>
        <p className="mt-1 text-3xl font-bold">{formatMoney(MRR)}</p>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {plans.map((p) => (
          <Card key={p.id} className="p-5">
            <div className="flex items-center justify-between">
              <p className="font-semibold">{locale === 'ar' ? p.nameAr : p.name}</p>
              <Badge tone={p.tone}>{p.subscribers} {t('sub.subs')}</Badge>
            </div>
            {editing && p.price > 0 ? (
              <div className="mt-3 space-y-1">
                <label className="text-xs text-muted" htmlFor={`price-${p.id}`}>{t('price.label')}</label>
                <div className="flex items-center gap-2">
                  <Input
                    id={`price-${p.id}`}
                    aria-label={`${t('price.label')} — ${locale === 'ar' ? p.nameAr : p.name}`}
                    inputMode="decimal"
                    dir="ltr"
                    value={draft[p.id] ?? ''}
                    onChange={(e) => setDraft((d) => ({ ...d, [p.id]: e.target.value }))}
                  />
                  <span className="text-sm text-muted">₪</span>
                </div>
                {toAgorot(draft[p.id] ?? '') === null && <p className="text-xs text-red-500">{t('price.invalid')}</p>}
              </div>
            ) : (
              <>
                <p className="mt-3 text-2xl font-bold">
                  {p.price === 0 ? t('sub.free') : formatMoney(p.price)}
                  {p.months > 0 && <span className="text-sm font-normal text-muted"> / {p.months === 12 ? t('sub.year') : `${p.months} ${t('sub.months')}`}</span>}
                </p>
                <p className="mt-1 text-sm text-muted">
                  {p.months ? `≈ ${formatMoney(Math.round((p.price / p.months) * p.subscribers))} / ${t('sub.month')}` : t('sub.trialNote')}
                </p>
              </>
            )}
          </Card>
        ))}
      </div>

      {editing && (
        <div className="flex flex-wrap items-center gap-2">
          <Button disabled={invalid || changes.length === 0} onClick={review}>
            {t('price.review')}
          </Button>
          <Button variant="ghost" onClick={() => setEditing(false)}>
            {t('price.cancel')}
          </Button>
          <span className="text-xs text-muted">{changes.length === 0 ? t('price.noChange') : t('price.appliesNew')}</span>
        </div>
      )}

      {confirming && (
        <ConfirmDialog
          title={t('price.confirmTitle')}
          confirmLabel={t('price.confirm')}
          cancelLabel={t('price.cancel')}
          busy={busy}
          onConfirm={confirm}
          onCancel={() => setConfirming(false)}
        >
          <ul className="space-y-2">
            {changes.map((c) => (
              <li key={c.id} className="flex items-center justify-between rounded-xl bg-slate-500/5 px-3 py-2">
                <span className="font-medium">{planName(c.id)}</span>
                <span className="flex items-center gap-2" dir="ltr">
                  <span className="text-muted line-through">{formatMoney(c.from)}</span>
                  <ArrowLeft className="h-4 w-4 rotate-180 text-muted" />
                  <span className="font-semibold">{formatMoney(c.to)}</span>
                </span>
              </li>
            ))}
          </ul>
          <p className="text-muted">{t('price.confirmNote')}</p>
          <label className="flex items-center gap-2 font-medium">
            <input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} className="h-4 w-4" />
            {t('price.notify')}
          </label>
          {notify && (
            <div className="space-y-2 rounded-xl border border-base p-3">
              <input
                aria-label={t('bc.titleLabel')}
                value={notice.title}
                maxLength={TITLE_MAX}
                onChange={(e) => setNotice((n) => ({ ...n, title: e.target.value }))}
                className="surface w-full rounded-lg border border-base px-3 py-2 text-sm font-medium outline-none focus:border-brand-500"
              />
              <textarea
                aria-label={t('bc.bodyLabel')}
                value={notice.body}
                maxLength={BODY_MAX}
                rows={3}
                onChange={(e) => setNotice((n) => ({ ...n, body: e.target.value }))}
                className="surface w-full rounded-lg border border-base px-3 py-2 text-sm outline-none focus:border-brand-500"
              />
            </div>
          )}
        </ConfirmDialog>
      )}
    </div>
  );
}
