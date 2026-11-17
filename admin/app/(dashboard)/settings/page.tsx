'use client';

import { useEffect, useState } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { Card, Button, Input } from '@/components/ui/primitives';
import { useT } from '@/lib/i18n';
import { getDb, isLive } from '@/lib/firebase';
import { waitForSession } from '@/lib/session';

// settings/platform: what the apps read, e.g. the support contacts shown on
// the Help screen.
interface Contacts {
  supportPhone: string;
  supportWhatsApp: string;
  supportEmail: string;
}
const EMPTY: Contacts = { supportPhone: '', supportWhatsApp: '', supportEmail: '' };

export default function SettingsPage() {
  const { t } = useT();
  const live = isLive();
  const [form, setForm] = useState<Contacts>(EMPTY);
  const [loaded, setLoaded] = useState(!live);
  const [state, setState] = useState<'idle' | 'saving' | 'saved' | 'failed'>('idle');
  const [adminEmail, setAdminEmail] = useState('');

  useEffect(() => {
    waitForSession().then((s) => setAdminEmail(s?.email ?? ''));
    const db = getDb();
    if (!live || !db) return;
    return onSnapshot(
      doc(db, 'settings', 'platform'),
      (snap) => {
        const v = snap.data() ?? {};
        setForm({ supportPhone: v.supportPhone ?? '', supportWhatsApp: v.supportWhatsApp ?? '', supportEmail: v.supportEmail ?? '' });
        setLoaded(true);
      },
      () => setLoaded(true),
    );
  }, [live]);

  const save = async () => {
    const db = getDb();
    setState('saving');
    try {
      if (live && db) {
        await setDoc(
          doc(db, 'settings', 'platform'),
          { supportPhone: form.supportPhone.trim(), supportWhatsApp: form.supportWhatsApp.trim(), supportEmail: form.supportEmail.trim(), updatedAt: Date.now() },
          { merge: true },
        );
      }
      setState('saved');
    } catch {
      setState('failed');
    }
  };

  const fields: { key: keyof Contacts; label: string; placeholder: string }[] = [
    { key: 'supportPhone', label: t('set.supportPhone'), placeholder: '+970 59 000 0000' },
    { key: 'supportWhatsApp', label: t('set.supportWhatsApp'), placeholder: '+970 59 000 0000' },
    { key: 'supportEmail', label: t('set.supportEmail'), placeholder: 'support@example.com' },
  ];

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t('set.title')}</h1>
        <p className="text-sm text-muted">{t('set.subtitle')}</p>
      </div>

      <Card className="p-6">
        <h2 className="font-semibold">{t('set.support')}</h2>
        <p className="mb-4 mt-1 text-xs text-muted">{t('set.supportHint')}</p>
        <div className="space-y-4">
          {fields.map((f) => (
            <div key={f.key} className="grid grid-cols-3 items-center gap-4">
              <label className="text-sm text-muted">{f.label}</label>
              <Input
                aria-label={f.label}
                placeholder={f.placeholder}
                value={form[f.key]}
                disabled={!loaded}
                onChange={(e) => {
                  setForm((v) => ({ ...v, [f.key]: e.target.value }));
                  setState('idle');
                }}
                className="col-span-2"
              />
            </div>
          ))}
        </div>
        <div className="mt-6 flex items-center justify-end gap-3">
          {state === 'saved' && <span className="text-sm text-emerald-600">{t('set.saved')}</span>}
          {state === 'failed' && <span className="text-sm text-red-500">{t('set.saveFailed')}</span>}
          <Button disabled={!loaded || state === 'saving'} onClick={save}>
            {t('set.save')}
          </Button>
        </div>
      </Card>

      <FeaturedSettings />
      <RequestLimitSettings />

      <Card className="p-6">
        <h2 className="mb-2 font-semibold">{t('set.admins')}</h2>
        {!!adminEmail && (
          <p className="text-sm">
            {t('set.signedInAs')} <span className="font-medium">{adminEmail}</span>
          </p>
        )}
        <p className="mt-2 text-xs text-muted">{t('set.addAdmin')}</p>
        <code className="mt-2 block rounded-lg border border-base px-3 py-2 text-xs" dir="ltr">
          cd firebase &amp;&amp; node scripts/create-admin.mjs email@example.com &apos;password&apos;
        </code>
      </Card>
    </div>
  );
}

/** Defaults for the "featured artisan" badge (Cloud Functions use the same). */
const FEATURED_MIN_JOBS = 10;
const FEATURED_MIN_RATING = 4;

/**
 * settings/platform.featuredMinJobs / featuredMinRating: an artisan becomes
 * featured with at least this many completed jobs AND a rating above this.
 * Cloud Functions recount every artisan within a minute of a change.
 */
function FeaturedSettings() {
  const { t } = useT();
  const live = isLive();
  const [jobs, setJobs] = useState(String(FEATURED_MIN_JOBS));
  const [rating, setRating] = useState(String(FEATURED_MIN_RATING));
  const [loaded, setLoaded] = useState(!live);
  const [state, setState] = useState<'idle' | 'saving' | 'saved' | 'failed'>('idle');

  useEffect(() => {
    const db = getDb();
    if (!live || !db) return;
    return onSnapshot(
      doc(db, 'settings', 'platform'),
      (snap) => {
        const n = snap.get('featuredMinJobs');
        const r = snap.get('featuredMinRating');
        setJobs(String(Number.isInteger(n) && n > 0 ? n : FEATURED_MIN_JOBS));
        setRating(String(typeof r === 'number' && r >= 0 && r < 5 ? r : FEATURED_MIN_RATING));
        setLoaded(true);
      },
      () => setLoaded(true),
    );
  }, [live]);

  const n = Number(jobs);
  const r = Number(rating.replace(',', '.'));
  const valid = Number.isInteger(n) && n >= 1 && n <= 1000 && Number.isFinite(r) && r >= 0 && r < 5;

  const save = async () => {
    if (!valid) return;
    const db = getDb();
    setState('saving');
    try {
      const rounded = Math.round(r * 10) / 10;
      if (live && db) await setDoc(doc(db, 'settings', 'platform'), { featuredMinJobs: n, featuredMinRating: rounded, updatedAt: Date.now() }, { merge: true });
      setState('saved');
    } catch {
      setState('failed');
    }
  };

  const field = (label: string, value: string, onChange: (v: string) => void, extra: Record<string, string | number>) => (
    <div className="grid grid-cols-3 items-center gap-4">
      <label className="text-sm text-muted">{label}</label>
      <Input
        aria-label={label}
        type="number"
        value={value}
        disabled={!loaded}
        onChange={(e) => {
          onChange(e.target.value);
          setState('idle');
        }}
        className="col-span-2"
        {...extra}
      />
    </div>
  );

  return (
    <Card className="p-6">
      <h2 className="font-semibold">{t('set.featured')}</h2>
      <p className="mb-4 mt-1 text-xs text-muted">{t('set.featuredHint')}</p>
      <div className="space-y-4">
        {field(t('set.featuredMinJobs'), jobs, setJobs, { min: 1, max: 1000, inputMode: 'numeric' })}
        {field(t('set.featuredMinRating'), rating, setRating, { min: 0, max: 4.9, step: 0.1, inputMode: 'decimal' })}
      </div>
      <div className="mt-6 flex items-center justify-end gap-3">
        {!valid && <span className="text-sm text-red-500">{t('set.featuredInvalid')}</span>}
        {state === 'saved' && <span className="text-sm text-emerald-600">{t('set.saved')}</span>}
        {state === 'failed' && <span className="text-sm text-red-500">{t('set.saveFailed')}</span>}
        <Button disabled={!loaded || !valid || state === 'saving'} onClick={save}>
          {t('set.save')}
        </Button>
      </div>
    </Card>
  );
}

/** Same default as the app and the server (MAX_OPEN_REQUESTS). */
const MAX_OPEN_REQUESTS = 10;

/**
 * How many open requests (waiting for offers or in progress) a customer may
 * have at once: each new request notifies every nearby artisan, so this stops
 * one person flooding them. The app says so before posting; the server
 * cancels anything over it.
 */
function RequestLimitSettings() {
  const { t } = useT();
  const live = isLive();
  const [max, setMax] = useState(String(MAX_OPEN_REQUESTS));
  const [loaded, setLoaded] = useState(!live);
  const [state, setState] = useState<'idle' | 'saving' | 'saved' | 'failed'>('idle');

  useEffect(() => {
    const db = getDb();
    if (!live || !db) return;
    return onSnapshot(
      doc(db, 'settings', 'platform'),
      (snap) => {
        const v = snap.get('maxOpenRequests');
        setMax(String(Number.isInteger(v) && v > 0 ? v : MAX_OPEN_REQUESTS));
        setLoaded(true);
      },
      () => setLoaded(true),
    );
  }, [live]);

  const n = Number(max);
  const valid = Number.isInteger(n) && n >= 1 && n <= 100;

  const save = async () => {
    if (!valid) return;
    const db = getDb();
    setState('saving');
    try {
      if (live && db) await setDoc(doc(db, 'settings', 'platform'), { maxOpenRequests: n, updatedAt: Date.now() }, { merge: true });
      setState('saved');
    } catch {
      setState('failed');
    }
  };

  return (
    <Card className="p-6">
      <h2 className="font-semibold">{t('set.requestLimit')}</h2>
      <p className="mb-4 mt-1 text-xs text-muted">{t('set.requestLimitHint')}</p>
      <div className="grid grid-cols-3 items-center gap-4">
        <label className="text-sm text-muted">{t('set.maxOpenRequests')}</label>
        <Input
          aria-label={t('set.maxOpenRequests')}
          type="number"
          value={max}
          disabled={!loaded}
          min={1}
          max={100}
          inputMode="numeric"
          onChange={(e) => {
            setMax(e.target.value);
            setState('idle');
          }}
          className="col-span-2"
        />
      </div>
      <div className="mt-6 flex items-center justify-end gap-3">
        {!valid && <span className="text-sm text-red-500">{t('set.requestLimitInvalid')}</span>}
        {state === 'saved' && <span className="text-sm text-emerald-600">{t('set.saved')}</span>}
        {state === 'failed' && <span className="text-sm text-red-500">{t('set.saveFailed')}</span>}
        <Button disabled={!loaded || !valid || state === 'saving'} onClick={save}>
          {t('set.save')}
        </Button>
      </div>
    </Card>
  );
}
