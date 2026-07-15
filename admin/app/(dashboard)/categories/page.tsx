'use client';

import { Plus } from 'lucide-react';
import { Card, Button, Badge } from '@/components/ui/primitives';
import { useT } from '@/lib/i18n';

const CATEGORIES = [
  { id: 'plumbing', name: 'Plumbing', nameAr: 'سباكة', color: '#2563EB', services: 2, active: true },
  { id: 'electrical', name: 'Electrical', nameAr: 'كهرباء', color: '#0EA5E9', services: 2, active: true },
  { id: 'carpentry', name: 'Carpentry', nameAr: 'نجارة', color: '#6366F1', services: 2, active: true },
  { id: 'ac', name: 'Air Conditioning', nameAr: 'تكييف', color: '#06B6D4', services: 2, active: true },
  { id: 'painting', name: 'Painting', nameAr: 'دهان', color: '#8B5CF6', services: 2, active: true },
  { id: 'cleaning', name: 'Cleaning', nameAr: 'تنظيف', color: '#14B8A6', services: 2, active: true },
  { id: 'maintenance', name: 'Maintenance', nameAr: 'صيانة', color: '#3B82F6', services: 2, active: true },
  { id: 'repair', name: 'Home Repair', nameAr: 'إصلاح منزلي', color: '#7C3AED', services: 2, active: true },
  { id: 'appliance', name: 'Appliance Repair', nameAr: 'إصلاح أجهزة', color: '#0284C7', services: 2, active: true },
  { id: 'gardening', name: 'Gardening', nameAr: 'بستنة', color: '#0D9488', services: 2, active: true },
  { id: 'satellite', name: 'Satellite', nameAr: 'ستلايت', color: '#475569', services: 2, active: false },
  { id: 'moving', name: 'Moving', nameAr: 'نقل عفش', color: '#4338CA', services: 2, active: true },
];

export default function CategoriesPage() {
  const { t, locale } = useT();
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('cat.title')}</h1>
          <p className="text-sm text-muted">{CATEGORIES.length} {t('cat.subtitle')}</p>
        </div>
        <Button>
          <Plus className="h-4 w-4" /> {t('cat.new')}
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {CATEGORIES.map((c) => (
          <Card key={c.id} className="p-5">
            <div className="flex items-start justify-between">
              <div className="h-11 w-11 rounded-xl" style={{ background: `linear-gradient(135deg, ${c.color}, ${c.color}99)` }} />
              <Badge tone={c.active ? 'success' : 'neutral'}>{c.active ? t('cat.active') : t('cat.hidden')}</Badge>
            </div>
            <p className="mt-4 font-semibold">{locale === 'ar' ? c.nameAr : c.name}</p>
            <p className="text-sm text-muted">{c.services} {t('cat.services')}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
