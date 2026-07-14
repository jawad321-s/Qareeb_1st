'use client';

import { Card, StatusPill, Button } from '@/components/ui/primitives';
import { COMPLAINTS } from '@/lib/mock-data';
import { timeAgo } from '@/lib/utils';
import { useT } from '@/lib/i18n';

const REASON_AR: Record<string, string> = {
  'No-show': 'عدم الحضور',
  'Overcharged': 'مبالغة في السعر',
  'Poor quality': 'جودة ضعيفة',
  'Unprofessional': 'سلوك غير محترف',
  'Safety concern': 'مخاوف تتعلق بالسلامة',
};

export default function ComplaintsPage() {
  const { t, locale } = useT();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t('comp.title')}</h1>
        <p className="text-sm text-muted">{t('comp.subtitle')}</p>
      </div>

      <div className="space-y-3">
        {COMPLAINTS.map((c) => (
          <Card key={c.id} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <p className="font-semibold">{locale === 'ar' ? (REASON_AR[c.reason] ?? c.reason) : c.reason}</p>
                <StatusPill status={c.status} />
              </div>
              <p className="mt-1 text-sm text-muted">
                {c.reporter} {t('comp.reported')} {c.target} · {timeAgo(c.createdAt)}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">{t('comp.view')}</Button>
              <Button size="sm" disabled={c.status === 'resolved'}>
                {c.status === 'resolved' ? t('comp.resolved') : t('comp.resolve')}
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
