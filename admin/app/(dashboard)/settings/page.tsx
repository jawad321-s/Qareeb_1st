'use client';

import { Card, Button, Badge } from '@/components/ui/primitives';
import { useT } from '@/lib/i18n';

export default function SettingsPage() {
  const { t, locale } = useT();
  const isAr = locale === 'ar';
  const ROLES = [
    { role: 'Super admin', roleAr: 'مسؤول عام', members: 2, perms: 'Full access', permsAr: 'صلاحية كاملة' },
    { role: 'Operations', roleAr: 'العمليات', members: 5, perms: 'Requests, complaints, verifications', permsAr: 'الطلبات، الشكاوى، التوثيق' },
    { role: 'Support', roleAr: 'الدعم', members: 8, perms: 'Users, complaints (read)', permsAr: 'المستخدمون، الشكاوى (قراءة)' },
    { role: 'Finance', roleAr: 'المالية', members: 3, perms: 'Revenue, subscriptions, payouts', permsAr: 'الإيرادات، الاشتراكات، الدفعات' },
  ];

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t('set.title')}</h1>
        <p className="text-sm text-muted">{t('set.subtitle')}</p>
      </div>

      <Card className="p-6">
        <h2 className="mb-4 font-semibold">{t('set.platform')}</h2>
        <div className="space-y-4">
          {[
            { label: t('set.platformName'), value: 'Qareeb' },
            { label: t('set.supportEmail'), value: 'support@qareeb.app' },
            { label: t('set.currency'), value: 'ILS (₪)' },
            { label: t('set.commission'), value: '12%' },
          ].map((f) => (
            <div key={f.label} className="grid grid-cols-3 items-center gap-4">
              <label className="text-sm text-muted">{f.label}</label>
              <input defaultValue={f.value} className="col-span-2 h-10 rounded-xl border border-base bg-transparent px-3 text-sm outline-none focus:border-brand-500" />
            </div>
          ))}
        </div>
        <div className="mt-6 flex justify-end">
          <Button>{t('set.save')}</Button>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="mb-4 font-semibold">{t('set.roles')}</h2>
        <div className="space-y-3">
          {ROLES.map((r) => (
            <div key={r.role} className="flex items-center justify-between rounded-xl border border-base p-4">
              <div>
                <p className="font-medium">{isAr ? r.roleAr : r.role}</p>
                <p className="text-xs text-muted">{isAr ? r.permsAr : r.perms}</p>
              </div>
              <Badge tone="brand">{r.members} {t('set.members')}</Badge>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
