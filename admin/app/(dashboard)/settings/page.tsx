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
