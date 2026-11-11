'use client';

import { useState } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { Card, Button, Badge, Input } from '@/components/ui/primitives';
import { useT } from '@/lib/i18n';
import { getDb, isLive } from '@/lib/firebase';
import { CATEGORY_NAMES, useCollection } from '@/lib/live-data';

// The catalog the apps ship with (icons, colours, order). The admin can rename
// a category or hide it; that lives in categories/{id} and the apps follow it.
const BUILT_IN = [
  { id: 'plumbing', color: '#2563EB' },
  { id: 'electrical', color: '#0EA5E9' },
  { id: 'carpentry', color: '#6366F1' },
  { id: 'ac', color: '#06B6D4' },
  { id: 'painting', color: '#8B5CF6' },
  { id: 'cleaning', color: '#14B8A6' },
  { id: 'repair', color: '#7C3AED' },
  { id: 'appliance', color: '#0284C7' },
  { id: 'gardening', color: '#0D9488' },
  { id: 'satellite', color: '#475569' },
  { id: 'moving', color: '#4338CA' },
];

interface Row {
  id: string;
  color: string;
  ar: string;
  en: string;
  active: boolean;
  artisans?: number;
  requests?: number;
}

export default function CategoriesPage() {
  const { t, locale } = useT();
  const live = isLive();
  const stored = useCollection('categories');
  const profiles = useCollection('artisanProfiles');
  const requests = useCollection('requests');
  // Demo mode keeps edits in memory.
  const [demo, setDemo] = useState<Record<string, Partial<Row>>>({});
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState({ ar: '', en: '' });
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const rows: Row[] = BUILT_IN.map((b) => {
    const s = stored?.find((d) => d.id === b.id);
    const o = demo[b.id] ?? {};
    return {
      ...b,
      ar: o.ar ?? s?.name?.ar ?? CATEGORY_NAMES[b.id].ar,
      en: o.en ?? s?.name?.en ?? CATEGORY_NAMES[b.id].en,
      active: o.active ?? s?.active !== false,
      artisans: profiles?.filter((p) => (p.categoryIds ?? []).includes(b.id)).length,
      requests: requests?.filter((r) => r.categoryId === b.id).length,
    };
  });

  const save = async (row: Row, patch: Partial<Pick<Row, 'ar' | 'en' | 'active'>>) => {
    const next = { ...row, ...patch };
    setError(null);
    if (!live) {
      setDemo((d) => ({ ...d, [row.id]: { ar: next.ar, en: next.en, active: next.active } }));
      return true;
    }
    const db = getDb();
    if (!db) return false;
    setSaving(row.id);
    try {
      await setDoc(
        doc(db, 'categories', row.id),
        { name: { ar: next.ar, en: next.en }, active: next.active, updatedAt: Date.now() },
        { merge: true },
      );
      return true;
    } catch {
      setError(t('cat.saveFailed'));
      return false;
    } finally {
      setSaving(null);
    }
  };

  const startEdit = (row: Row) => {
    setEditing(row.id);
    setDraft({ ar: row.ar, en: row.en });
  };

  const saveNames = async (row: Row) => {
    if (!draft.ar.trim() || !draft.en.trim()) return;
    if (await save(row, { ar: draft.ar.trim(), en: draft.en.trim() })) setEditing(null);
  };

  const shown = rows.filter((r) => r.active).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t('cat.title')}</h1>
        <p className="text-sm text-muted">
          {shown}/{rows.length} {t('cat.subtitle')}
        </p>
        <p className="mt-1 text-xs text-muted">{t('cat.hint')}</p>
      </div>

      {error && <p className="text-sm font-medium text-red-500">{error}</p>}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {rows.map((c) => (
          <Card key={c.id} className="p-5">
            <div className="flex items-start justify-between">
              <div className="h-11 w-11 rounded-xl" style={{ background: `linear-gradient(135deg, ${c.color}, ${c.color}99)` }} />
              <Badge tone={c.active ? 'success' : 'neutral'}>{c.active ? t('cat.active') : t('cat.hidden')}</Badge>
            </div>

            {editing === c.id ? (
              <div className="mt-4 space-y-2">
                <Input aria-label={t('cat.nameAr')} placeholder={t('cat.nameAr')} value={draft.ar} onChange={(e) => setDraft((d) => ({ ...d, ar: e.target.value }))} />
                <Input aria-label={t('cat.nameEn')} placeholder={t('cat.nameEn')} value={draft.en} onChange={(e) => setDraft((d) => ({ ...d, en: e.target.value }))} />
                <div className="flex gap-2">
                  <Button size="sm" disabled={saving === c.id || !draft.ar.trim() || !draft.en.trim()} onClick={() => saveNames(c)}>
                    {t('cat.save')}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>
                    {t('cat.cancel')}
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <p className="mt-4 font-semibold">{locale === 'ar' ? c.ar : c.en}</p>
                <p className="text-xs text-muted">{locale === 'ar' ? c.en : c.ar}</p>
                <p className="mt-2 text-sm text-muted">
                  {c.artisans ?? '…'} {t('cat.artisans')} · {c.requests ?? '…'} {t('cat.requests')}
                </p>
                <div className="mt-4 flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => startEdit(c)}>
                    {t('cat.edit')}
                  </Button>
                  <Button size="sm" variant={c.active ? 'ghost' : 'primary'} disabled={saving === c.id} onClick={() => save(c, { active: !c.active })}>
                    {c.active ? t('cat.hide') : t('cat.show')}
                  </Button>
                </div>
              </>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
