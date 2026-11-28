'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft, Eye, EyeOff, Pencil, Plus, Trash2 } from 'lucide-react';
import { Card, Badge, Button, Input } from '@/components/ui/primitives';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { formatDay, formatMoney, formatPrice } from '@/lib/utils';
import { useT, type TKey } from '@/lib/i18n';
import { isLive } from '@/lib/firebase';
import { useCollection } from '@/lib/live-data';
import {
  MAX_DAYS, MAX_PRICE_SHEKELS, NAME_MAX, PLANS, customState, deleteCustomPlan, newPlanId, saveCustomPlan, savePlanPrices,
  usePlanPrices, type CustomPlan, type CustomPlanDoc,
} from '@/lib/plans';
import { BODY_MAX, TITLE_MAX, sendBroadcast } from '@/lib/broadcasts';
import { waitForSession } from '@/lib/session';

// A one-time 7-day free trial, then prepaid 3-month, 6-month and yearly plans.
// The admin sets the prices here; the app shows them at once. New prices apply
// to new purchases — plans already bought keep what was paid.
// The admin can also add plans of any length and special offers that can be
// bought until a set date; the app lists them with the plans.

/** "129" / "129.5" ₪ → agorot, or null when it isn't a valid price. */
const toAgorot = (v: string): number | null => {
  const n = Number(v.trim().replace(',', '.'));
  if (!Number.isFinite(n) || n <= 0 || n > MAX_PRICE_SHEKELS) return null;
  return Math.round(n * 100);
};
const toShekels = (agorot: number) => String(agorot / 100);

/** yyyy-mm-dd (local) ↔ the last moment of that day. */
const dayValue = (ts: number) => {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const endOfDay = (v: string): number | null => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v);
  if (!m) return null;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 23, 59, 59, 999).getTime();
};

/** "3 أشهر" / "45 يوماً" / "1 month". `afterWord`: the form after "لمدة" (شهرين, not شهران). */
function lengthLabel(days: number, locale: 'ar' | 'en', afterWord = false): string {
  const months = days % 30 === 0 ? days / 30 : 0;
  if (locale === 'en') return months ? `${months} ${months === 1 ? 'month' : 'months'}` : `${days} ${days === 1 ? 'day' : 'days'}`;
  const n = months || days;
  const two = months ? (afterWord ? 'شهرين' : 'شهران') : afterWord ? 'يومين' : 'يومان';
  const [one, few, many] = months ? ['شهر واحد', 'أشهر', 'شهراً'] : ['يوم واحد', 'أيام', 'يوماً'];
  return n === 1 ? one : n === 2 ? two : n <= 10 ? `${n} ${few}` : `${n} ${many}`;
}

type Unit = 'days' | 'months';
interface Draft {
  id: string | null;
  kind: 'plan' | 'offer';
  nameAr: string;
  nameEn: string;
  price: string;
  length: string;
  unit: Unit;
  endDate: string;
  active: boolean;
  createdAt?: number;
}
type Field = 'nameAr' | 'nameEn' | 'price' | 'length' | 'endDate';

const newDraft = (): Draft => ({ id: null, kind: 'plan', nameAr: '', nameEn: '', price: '', length: '1', unit: 'months', endDate: '', active: true });
const draftOf = (p: CustomPlan): Draft => ({
  id: p.id,
  kind: p.kind,
  nameAr: p.nameAr,
  nameEn: p.nameEn === p.nameAr ? '' : p.nameEn,
  price: toShekels(p.price),
  length: String(p.durationDays % 30 === 0 ? p.durationDays / 30 : p.durationDays),
  unit: p.durationDays % 30 === 0 ? 'months' : 'days',
  endDate: p.endsAt ? dayValue(p.endsAt) : '',
  active: p.active,
  createdAt: p.createdAt,
});

/** The plan the form describes, or what is wrong with it. */
function check(d: Draft, now: number): { doc: CustomPlanDoc | null; errors: Partial<Record<Field, TKey>> } {
  const errors: Partial<Record<Field, TKey>> = {};
  const nameAr = d.nameAr.trim();
  const nameEn = d.nameEn.trim();
  if (!nameAr || nameAr.length > NAME_MAX) errors.nameAr = 'plan.err.name';
  if (nameEn.length > NAME_MAX) errors.nameEn = 'plan.err.name';
  const price = toAgorot(d.price);
  if (price === null) errors.price = 'price.invalid';
  const n = Number(d.length);
  const days = d.unit === 'months' ? n * 30 : n;
  if (!Number.isInteger(n) || days < 1 || days > MAX_DAYS) errors.length = 'plan.err.length';
  const endsAt = d.kind === 'offer' ? endOfDay(d.endDate) : null;
  if (d.kind === 'offer' && (endsAt === null || endsAt <= now)) errors.endDate = 'plan.err.endDate';
  if (Object.keys(errors).length) return { doc: null, errors };
  return {
    doc: {
      kind: d.kind,
      nameAr,
      nameEn: nameEn || nameAr,
      price: price!,
      durationDays: days,
      active: d.active,
      ...(d.kind === 'offer' ? { endsAt: endsAt! } : {}),
      createdAt: d.createdAt ?? now,
    },
    errors,
  };
}

const field = 'surface w-full rounded-lg border border-base px-3 py-2 text-sm outline-none focus:border-brand-500';

export default function SubscriptionsPage() {
  const { t, locale } = useT();
  const live = isLive();
  // Live: plans that are running now (not cancelled, not expired), per plan.
  const subs = useCollection('subscriptions');
  const { prices, custom, loaded } = usePlanPrices();
  // Demo mode: saved prices and added plans are kept on the page.
  const [demoPrices, setDemoPrices] = useState<Record<string, number>>({});
  const [demoCustom, setDemoCustom] = useState<CustomPlan[]>([]);
  const current = live ? prices : demoPrices;
  const added = live ? custom : demoCustom;
  const now = Date.now();
  const activeCount = (planId: string) =>
    (subs ?? []).filter((s) => s.planId === planId && s.status !== 'cancelled' && Number(s.expiresAt) > now).length;
  // Bought at least once (then it can only be hidden, so its name stays known).
  const everBought = (planId: string) => (subs ?? []).some((s) => s.planId === planId);
  const plans = PLANS.map((p) => ({
    ...p,
    price: p.price > 0 && current[p.id] ? current[p.id] : p.price,
    subscribers: live ? activeCount(p.id) : p.subscribers,
  }));
  const paid = plans.filter((p) => p.price > 0);
  // Prepaid plans spread over their length, so the figure stays monthly.
  const monthly = (price: number, days: number, count: number) => Math.round((price / (days / 30)) * count);
  const MRR =
    plans.reduce((s, p) => s + (p.months ? Math.round((p.price / p.months) * p.subscribers) : 0), 0) +
    added.reduce((s, p) => s + monthly(p.price, p.durationDays, activeCount(p.id)), 0);

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

  // Adding or editing a plan or offer.
  const [form, setForm] = useState<Draft | null>(null);
  const [showErrors, setShowErrors] = useState(false);
  const [saving, setSaving] = useState<{ id: string; doc: CustomPlanDoc; isNew: boolean } | null>(null);
  const [removing, setRemoving] = useState<CustomPlan | null>(null);

  const planName = (id: string) => {
    const p = PLANS.find((x) => x.id === id)!;
    return locale === 'ar' ? p.nameAr : p.name;
  };
  const nameOf = (p: { nameAr: string; nameEn: string }) => (locale === 'ar' ? p.nameAr : p.nameEn);
  const changes = paid
    .map((p) => ({ id: p.id, from: p.price, to: toAgorot(draft[p.id] ?? '') }))
    .filter((c) => c.to !== null && c.to !== c.from) as { id: string; from: number; to: number }[];
  const invalid = paid.some((p) => toAgorot(draft[p.id] ?? '') === null);

  const failed = (e: unknown) => {
    const denied = (e as { code?: string }).code === 'permission-denied';
    setResult({ ok: false, text: t(denied ? 'bc.rulesMissing' : 'price.saveFailed') });
  };

  const startEdit = () => {
    setDraft(Object.fromEntries(paid.map((p) => [p.id, toShekels(p.price)])));
    setResult(null);
    setForm(null);
    setEditing(true);
  };

  const review = () => {
    const lines = changes.map((c) => `${planName(c.id)}: ${formatPrice(c.to)}`).join(locale === 'ar' ? '، ' : ', ');
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
    } catch (e) {
      failed(e);
      setConfirming(false);
    } finally {
      setBusy(false);
    }
  };

  const openForm = (d: Draft) => {
    setResult(null);
    setEditing(false);
    setShowErrors(false);
    setForm(d);
  };

  const formCheck = form ? check(form, now) : null;
  const err = (f: Field) => (showErrors && formCheck?.errors[f] ? <p className="text-xs text-red-500">{t(formCheck.errors[f]!)}</p> : null);

  // The form is valid: show what will happen and offer to tell the artisans.
  const reviewForm = () => {
    if (!form || !formCheck?.doc) {
      setShowErrors(true);
      return;
    }
    const doc = formCheck.doc;
    const isNew = !form.id;
    const vars = (s: string) =>
      s
        .replace('{name}', nameOf(doc))
        .replace('{price}', formatPrice(doc.price))
        .replace('{length}', lengthLabel(doc.durationDays, locale, true))
        .replace('{date}', doc.endsAt ? formatDay(doc.endsAt, locale) : '');
    const offer = doc.kind === 'offer';
    setNotice({
      title: t(offer ? 'plan.noticeOfferTitle' : 'plan.noticePlanTitle'),
      body: vars(t(offer ? 'plan.noticeOfferBody' : 'plan.noticePlanBody')),
    });
    setNotify(isNew && doc.active);
    setSaving({ id: form.id ?? newPlanId(), doc, isNew });
  };

  const applyDemo = (id: string, doc: CustomPlanDoc | null) =>
    setDemoCustom((list) => {
      const rest = list.filter((p) => p.id !== id);
      return doc ? [...rest, { ...doc, id }].sort((a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0)) : rest;
    });

  const confirmSave = async () => {
    if (!saving) return;
    setBusy(true);
    try {
      await saveCustomPlan(saving.id, saving.doc, adminEmail);
      if (!live) applyDemo(saving.id, saving.doc);
      const tell = notify && saving.doc.active && notice.title.trim() && notice.body.trim();
      if (tell) {
        await sendBroadcast({ audience: 'artisans', title: notice.title, body: notice.body, route: '/(shared)/subscription', kind: 'prices' }, adminEmail);
      }
      setResult({ ok: true, text: t(tell ? 'plan.savedNotified' : 'plan.saved') });
      setForm(null);
    } catch (e) {
      failed(e);
    } finally {
      setSaving(null);
      setBusy(false);
    }
  };

  const toggleShown = async (p: CustomPlan) => {
    const doc: CustomPlanDoc = { ...p, active: !p.active };
    setResult(null);
    try {
      await saveCustomPlan(p.id, doc, adminEmail);
      if (!live) applyDemo(p.id, doc);
      setResult({ ok: true, text: t(doc.active ? 'plan.shownNow' : 'plan.hiddenNow') });
    } catch (e) {
      failed(e);
    }
  };

  const confirmRemove = async () => {
    if (!removing) return;
    setBusy(true);
    try {
      await deleteCustomPlan(removing.id, adminEmail);
      if (!live) applyDemo(removing.id, null);
      setResult({ ok: true, text: t('plan.deleted') });
      if (form?.id === removing.id) setForm(null);
    } catch (e) {
      failed(e);
    } finally {
      setRemoving(null);
      setBusy(false);
    }
  };

  const STATE_TONE = { shown: 'success', hidden: 'neutral', ended: 'danger' } as const;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('sub.title')}</h1>
          <p className="text-sm text-muted">{t('sub.subtitle')}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {!form && (
            <Button disabled={!loaded} onClick={() => openForm(newDraft())}>
              <Plus className="h-4 w-4" /> {t('plan.add')}
            </Button>
          )}
          {!editing && (
            <Button variant="outline" disabled={!loaded} onClick={startEdit}>
              <Pencil className="h-4 w-4" /> {t('price.edit')}
            </Button>
          )}
        </div>
      </div>

      {result && (
        <p role="status" className={`rounded-xl p-3 text-sm ${result.ok ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' : 'bg-red-500/10 text-red-700 dark:text-red-400'}`}>
          {result.text}
        </p>
      )}

      <Card className="p-5">
        <p className="text-sm text-muted">{t('sub.mrr')}</p>
        <p className="mt-1 text-3xl font-bold">{formatMoney(MRR)}</p>
      </Card>

      {form && (
        <Card className="space-y-4 p-5">
          <div>
            <h2 className="text-lg font-semibold">{t(form.id ? 'plan.editTitle' : 'plan.addTitle')}</h2>
            <p className="text-sm text-muted">{t('plan.formHint')}</p>
          </div>

          <div role="radiogroup" aria-label={t('plan.kind')} className="flex flex-wrap gap-2">
            {(['plan', 'offer'] as const).map((k) => (
              <button
                key={k}
                type="button"
                role="radio"
                aria-checked={form.kind === k}
                onClick={() => setForm({ ...form, kind: k })}
                className={`rounded-xl border px-4 py-2 text-start text-sm ${form.kind === k ? 'border-brand-500 bg-brand-500/10 font-semibold' : 'border-base hover:bg-slate-500/5'}`}
              >
                {t(k === 'plan' ? 'plan.kindPlan' : 'plan.kindOffer')}
                <span className="block text-xs font-normal text-muted">{t(k === 'plan' ? 'plan.kindPlanHint' : 'plan.kindOfferHint')}</span>
              </button>
            ))}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs text-muted" htmlFor="plan-name-ar">{t('plan.nameAr')}</label>
              <Input id="plan-name-ar" dir="rtl" maxLength={NAME_MAX} value={form.nameAr} onChange={(e) => setForm({ ...form, nameAr: e.target.value })} />
              {err('nameAr')}
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted" htmlFor="plan-name-en">{t('plan.nameEn')}</label>
              <Input id="plan-name-en" dir="ltr" maxLength={NAME_MAX} value={form.nameEn} onChange={(e) => setForm({ ...form, nameEn: e.target.value })} />
              {err('nameEn')}
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted" htmlFor="plan-price">{t('price.label')}</label>
              <div className="flex items-center gap-2">
                <Input id="plan-price" inputMode="decimal" dir="ltr" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
                <span className="text-sm text-muted">₪</span>
              </div>
              {err('price')}
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted" htmlFor="plan-length">{t('plan.length')}</label>
              <div className="flex items-center gap-2">
                <Input id="plan-length" inputMode="numeric" dir="ltr" value={form.length} onChange={(e) => setForm({ ...form, length: e.target.value })} />
                <select
                  aria-label={t('plan.unit')}
                  value={form.unit}
                  onChange={(e) => setForm({ ...form, unit: e.target.value as Unit })}
                  className={`${field} w-auto`}
                >
                  <option value="days">{t('plan.unitDays')}</option>
                  <option value="months">{t('plan.unitMonths')}</option>
                </select>
              </div>
              {err('length')}
            </div>
            {form.kind === 'offer' && (
              <div className="space-y-1">
                <label className="text-xs text-muted" htmlFor="plan-ends">{t('plan.endsAt')}</label>
                <input
                  id="plan-ends"
                  type="date"
                  min={dayValue(now)}
                  value={form.endDate}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                  className={field}
                />
                <p className="text-xs text-muted">{t('plan.endsAtHint')}</p>
                {err('endDate')}
              </div>
            )}
          </div>

          <label className="flex items-center gap-2 text-sm font-medium">
            <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="h-4 w-4" />
            {t('plan.active')}
          </label>

          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={reviewForm}>{t('price.review')}</Button>
            <Button variant="ghost" onClick={() => setForm(null)}>{t('price.cancel')}</Button>
            <span className="text-xs text-muted">{t('plan.appliesNew')}</span>
          </div>
        </Card>
      )}

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
                  {p.price === 0 ? t('sub.free') : formatPrice(p.price)}
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

      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold">{t('plan.addedTitle')}</h2>
          <p className="text-sm text-muted">{t('plan.addedHint')}</p>
        </div>
        {added.length === 0 ? (
          <Card className="p-5">
            <p className="text-sm text-muted">{t('plan.none')}</p>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {added.map((p) => {
              const state = customState(p, now);
              const count = activeCount(p.id);
              const bought = everBought(p.id);
              return (
                <Card key={p.id} className="space-y-3 p-5">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold">{nameOf(p)}</p>
                    <Badge tone="brand">{count} {t('sub.subs')}</Badge>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <Badge tone={p.kind === 'offer' ? 'warning' : 'info'}>{t(p.kind === 'offer' ? 'plan.kindOffer' : 'plan.kindPlan')}</Badge>
                    <Badge tone={STATE_TONE[state]}>{t(`plan.state.${state}` as TKey)}</Badge>
                  </div>
                  <p className="text-2xl font-bold">
                    {formatPrice(p.price)}
                    <span className="text-sm font-normal text-muted"> / {lengthLabel(p.durationDays, locale)}</span>
                  </p>
                  <div className="space-y-0.5 text-sm text-muted">
                    {p.kind === 'offer' && p.endsAt && (
                      <p>{t(state === 'ended' ? 'plan.endedOn' : 'plan.until')} {formatDay(p.endsAt, locale)}</p>
                    )}
                    <p>≈ {formatMoney(monthly(p.price, p.durationDays, count))} / {t('sub.month')}</p>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <Button size="sm" variant="outline" onClick={() => openForm(draftOf(p))}>
                      <Pencil className="h-3.5 w-3.5" /> {t('plan.edit')}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => toggleShown(p)}>
                      {p.active ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />} {t(p.active ? 'plan.hide' : 'plan.show')}
                    </Button>
                    <Button size="sm" variant="ghost" disabled={bought || (live && !subs)} onClick={() => setRemoving(p)}>
                      <Trash2 className="h-3.5 w-3.5" /> {t('plan.delete')}
                    </Button>
                  </div>
                  {bought && <p className="text-xs text-muted">{t('plan.boughtHint')}</p>}
                </Card>
              );
            })}
          </div>
        )}
      </section>

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
                  <span className="text-muted line-through">{formatPrice(c.from)}</span>
                  <ArrowLeft className="h-4 w-4 rotate-180 text-muted" />
                  <span className="font-semibold">{formatPrice(c.to)}</span>
                </span>
              </li>
            ))}
          </ul>
          <p className="text-muted">{t('price.confirmNote')}</p>
          <NotifyBox notify={notify} setNotify={setNotify} notice={notice} setNotice={setNotice} />
        </ConfirmDialog>
      )}

      {saving && (
        <ConfirmDialog
          title={t(saving.isNew ? (saving.doc.kind === 'offer' ? 'plan.confirmAddOffer' : 'plan.confirmAddPlan') : 'plan.confirmEdit')}
          confirmLabel={t('price.confirm')}
          cancelLabel={t('price.cancel')}
          busy={busy}
          onConfirm={confirmSave}
          onCancel={() => setSaving(null)}
        >
          <dl className="grid grid-cols-2 gap-2">
            <Row label={t('plan.kind')}>{t(saving.doc.kind === 'offer' ? 'plan.kindOffer' : 'plan.kindPlan')}</Row>
            <Row label={t('plan.nameAr')}>{saving.doc.nameAr}</Row>
            <Row label={t('plan.nameEn')}>{saving.doc.nameEn}</Row>
            <Row label={t('price.label')}>{formatPrice(saving.doc.price)}</Row>
            <Row label={t('plan.length')}>{lengthLabel(saving.doc.durationDays, locale)}</Row>
            {saving.doc.endsAt && <Row label={t('plan.endsAt')}>{formatDay(saving.doc.endsAt, locale)}</Row>}
            <Row label={t('plan.inApp')}>{t(saving.doc.active ? 'plan.state.shown' : 'plan.state.hidden')}</Row>
          </dl>
          <p className="text-muted">{t(saving.doc.active ? 'plan.confirmNote' : 'plan.confirmNoteHidden')}</p>
          {saving.doc.active && <NotifyBox notify={notify} setNotify={setNotify} notice={notice} setNotice={setNotice} />}
        </ConfirmDialog>
      )}

      {removing && (
        <ConfirmDialog
          title={t('plan.confirmDelete')}
          confirmLabel={t('plan.delete')}
          cancelLabel={t('price.cancel')}
          busy={busy}
          danger
          onConfirm={confirmRemove}
          onCancel={() => setRemoving(null)}
        >
          <p>
            <span className="font-semibold">{nameOf(removing)}</span> — {t('plan.deleteNote')}
          </p>
        </ConfirmDialog>
      )}
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-slate-500/5 px-3 py-2">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="font-medium">{children}</dd>
    </div>
  );
}

/** "Send a system notification to artisans", with its editable title and text. */
function NotifyBox({
  notify,
  setNotify,
  notice,
  setNotice,
}: {
  notify: boolean;
  setNotify: (v: boolean) => void;
  notice: { title: string; body: string };
  setNotice: React.Dispatch<React.SetStateAction<{ title: string; body: string }>>;
}) {
  const { t } = useT();
  return (
    <>
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
            className={`${field} font-medium`}
          />
          <textarea
            aria-label={t('bc.bodyLabel')}
            value={notice.body}
            maxLength={BODY_MAX}
            rows={3}
            onChange={(e) => setNotice((n) => ({ ...n, body: e.target.value }))}
            className={field}
          />
        </div>
      )}
    </>
  );
}
