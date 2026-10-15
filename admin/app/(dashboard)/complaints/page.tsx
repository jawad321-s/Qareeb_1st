'use client';

import { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { Card, StatusPill, Button } from '@/components/ui/primitives';
import { COMPLAINTS } from '@/lib/mock-data';
import { timeAgo } from '@/lib/utils';
import { useT } from '@/lib/i18n';
import { getDb, isLive } from '@/lib/firebase';
import { useCollection, toComplaints } from '@/lib/live-data';

const REASON_AR: Record<string, string> = {
  'No-show': 'عدم الحضور',
  'Overcharged': 'مبالغة في السعر',
  'Poor quality': 'جودة ضعيفة',
  'Unprofessional': 'سلوك غير محترف',
  'Safety concern': 'مخاوف تتعلق بالسلامة',
};

export default function ComplaintsPage() {
  const { t, locale } = useT();
  // Live: reports sent from the app (Profile → Report a problem).
  const live = isLive();
  const docs = useCollection('complaints');
  const items: { id: string; reporter: string; target: string; reason: string; details?: string; status: string; createdAt: number }[] =
    live ? toComplaints(docs ?? []) : COMPLAINTS;
  const [open, setOpen] = useState<string | null>(null);

  const resolve = (id: string) => {
    const db = getDb();
    if (live && db) updateDoc(doc(db, 'complaints', id), { status: 'resolved', resolvedAt: Date.now() }).catch(() => {});
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t('comp.title')}</h1>
        <p className="text-sm text-muted">{t('comp.subtitle')}</p>
      </div>

      <div className="space-y-3">
        {items.length === 0 && <Card className="p-8 text-center text-sm text-muted">{t('comp.empty')}</Card>}
        {items.map((c) => (
          <Card key={c.id} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <p className="font-semibold">{locale === 'ar' ? (REASON_AR[c.reason] ?? c.reason) : c.reason}</p>
                <StatusPill status={c.status} />
              </div>
              <p className="mt-1 text-sm text-muted">
                {c.target ? `${c.reporter} ${t('comp.reported')} ${c.target}` : c.reporter} · {timeAgo(c.createdAt, locale)}
              </p>
              {open === c.id && c.details && <p className="mt-2 whitespace-pre-wrap text-sm">{c.details}</p>}
            </div>
            <div className="flex gap-2">
              {c.details ? (
                <Button variant="outline" size="sm" onClick={() => setOpen(open === c.id ? null : c.id)}>{t('comp.view')}</Button>
              ) : null}
              <Button size="sm" disabled={c.status === 'resolved'} onClick={() => resolve(c.id)}>
                {c.status === 'resolved' ? t('comp.resolved') : t('comp.resolve')}
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
