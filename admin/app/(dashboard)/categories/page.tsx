'use client';

import { useEffect, useState } from 'react';
import { deleteDoc, doc, setDoc } from 'firebase/firestore';
import { Plus } from 'lucide-react';
import { Card, Button, Badge, Input } from '@/components/ui/primitives';
import { useT } from '@/lib/i18n';
import { getDb, isLive } from '@/lib/firebase';
import { CATEGORY_NAMES, useCollection } from '@/lib/live-data';
import { BUILT_IN, ICON_KEYS, ICONS, PALETTE, newCategoryId, sameName } from '@/lib/catalog';
import { cn } from '@/lib/utils';

// The services the apps offer. Built-in ones can be renamed or hidden; the
// admin can also add new ones (name, icon, colour). Everything is stored in
// categories/{id} and the apps follow it live.

interface Row {
  id: string;
  custom: boolean;
  color: string;
  icon: string;
  order: number;
  ar: string;
  en: string;
  active: boolean;
  artisans?: number;
  requests?: number;
}

interface Draft {
  ar: string;
  en: string;
  icon: string;
  color: string;
}

export default function CategoriesPage() {
  const { t } = useT();
  const live = isLive();
  const stored = useCollection('categories');
  const profiles = useCollection('artisanProfiles');
  const requests = useCollection('requests');
  // Demo mode keeps edits (and added services) in memory.
  const [demo, setDemo] = useState<Record<string, Partial<Row> | null>>({});
  const [editing, setEditing] = useState<string | null>(null);
  const [adding, setAdding] = useState<Draft | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // "Add it in Categories" from a suggestion opens the form with its name.
  useEffect(() => {
    const name = new URLSearchParams(window.location.search).get('new');
    if (name) setAdding({ ar: name.slice(0, 40), en: '', icon: 'tools', color: PALETTE[0] });
  }, []);

  const usage = (id: string) => ({
    artisans: profiles?.filter((p) => (p.categoryIds ?? []).includes(id)).length,
    requests: requests?.filter((r) => r.categoryId === id).length,
  });

  const builtIn: Row[] = BUILT_IN.map((b) => {
    const s = stored?.find((d) => d.id === b.id);
    const o = demo[b.id] ?? {};
    return {
      id: b.id,
      custom: false,
      color: b.color,
      icon: b.icon,
      order: b.order,
      ar: o.ar ?? s?.name?.ar ?? CATEGORY_NAMES[b.id].ar,
      en: o.en ?? s?.name?.en ?? CATEGORY_NAMES[b.id].en,
      active: o.active ?? s?.active !== false,
      ...usage(b.id),
    };
  });
  const added: Row[] = [
    ...(stored ?? [])
      .filter((d) => d.custom === true && d.name?.ar)
      .map((d) => ({
        id: d.id,
        custom: true,
        color: d.colorHex ?? PALETTE[0],
        icon: ICONS[d.icon] ? d.icon : 'tools',
        order: Number(d.order) || 100,
        ar: d.name.ar,
        en: d.name.en || d.name.ar,
        active: d.active !== false,
      })),
    // Demo-only additions.
    ...Object.entries(demo)
      .filter(([id, v]) => v && v.custom && !stored?.some((d) => d.id === id))
      .map(([, v]) => v as Row),
  ]
    .filter((r) => demo[r.id] !== null)
    .map((r) => ({ ...r, ...(demo[r.id] ?? {}), ...usage(r.id) }));
  const rows = [...builtIn, ...added].sort((a, b) => a.order - b.order);

  /** Saves a change to one service (or creates it). Returns whether it worked. */
  const write = async (id: string, data: Record<string, unknown>, demoPatch: Partial<Row>) => {
    setError(null);
    if (!live) {
      setDemo((d) => ({ ...d, [id]: { ...(d[id] ?? {}), ...demoPatch } }));
      return true;
    }
    const db = getDb();
    if (!db) return false;
    setSaving(id);
    try {
      await setDoc(doc(db, 'categories', id), { ...data, updatedAt: Date.now() }, { merge: true });
      return true;
    } catch {
      setError(t('cat.saveFailed'));
      return false;
    } finally {
      setSaving(null);
    }
  };

  const duplicate = (name: string, exceptId?: string) => rows.some((r) => r.id !== exceptId && (sameName(r.ar, name) || sameName(r.en, name)));

  const create = async (d: Draft) => {
    const ar = d.ar.trim();
    const en = d.en.trim() || ar;
    if (duplicate(ar) || (d.en.trim() && duplicate(en))) return setError(t('cat.duplicate'));
    const id = newCategoryId();
    const order = Math.max(...rows.map((r) => r.order)) + 1;
    const ok = await write(
      id,
      { custom: true, name: { ar, en }, icon: d.icon, colorHex: d.color, order, active: true, createdAt: Date.now() },
      { id, custom: true, ar, en, icon: d.icon, color: d.color, order, active: true },
    );
    if (ok) setAdding(null);
  };

  const saveEdit = async (row: Row, d: Draft) => {
    const ar = d.ar.trim();
    const en = d.en.trim() || ar;
    if (duplicate(ar, row.id)) return setError(t('cat.duplicate'));
    const data = row.custom ? { name: { ar, en }, icon: d.icon, colorHex: d.color } : { name: { ar, en } };
    const ok = await write(row.id, data, row.custom ? { ar, en, icon: d.icon, color: d.color } : { ar, en });
    if (ok) setEditing(null);
  };

  const remove = async (row: Row) => {
    setError(null);
    if (!live) return setDemo((d) => ({ ...d, [row.id]: null }));
    const db = getDb();
    if (!db) return;
    setSaving(row.id);
    try {
      await deleteDoc(doc(db, 'categories', row.id));
    } catch {
      setError(t('cat.saveFailed'));
    } finally {
      setSaving(null);
    }
  };

  const shown = rows.filter((r) => r.active).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('cat.title')}</h1>
          <p className="text-sm text-muted">
            {shown}/{rows.length} {t('cat.subtitle')}
          </p>
          <p className="mt-1 text-xs text-muted">{t('cat.hint')}</p>
        </div>
        {!adding && (
          <Button onClick={() => setAdding({ ar: '', en: '', icon: 'tools', color: PALETTE[0] })}>
            <Plus className="h-4 w-4" /> {t('cat.add')}
          </Button>
        )}
      </div>

      {error && <p className="text-sm font-medium text-red-500">{error}</p>}

      {adding && (
        <Card className="p-5">
          <h2 className="mb-1 font-semibold">{t('cat.addTitle')}</h2>
          <p className="mb-4 text-xs text-muted">{t('cat.addHint')}</p>
          <CategoryForm initial={adding} visual saving={saving !== null} onSave={create} onCancel={() => setAdding(null)} submitLabel={t('cat.addSubmit')} />
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {rows.map((c) => (
          <Card key={c.id} className="p-5">
            {editing === c.id ? (
              <CategoryForm
                initial={{ ar: c.ar, en: c.en, icon: c.icon, color: c.color }}
                visual={c.custom}
                compact
                saving={saving === c.id}
                onSave={(d) => saveEdit(c, d)}
                onCancel={() => setEditing(null)}
                submitLabel={t('cat.save')}
              />
            ) : (
              <>
                <div className="flex items-start justify-between gap-2">
                  <ServiceIcon icon={c.icon} color={c.color} />
                  <div className="flex flex-wrap justify-end gap-1">
                    {c.custom && <Badge tone="brand">{t('cat.added')}</Badge>}
                    <Badge tone={c.active ? 'success' : 'neutral'}>{c.active ? t('cat.active') : t('cat.hidden')}</Badge>
                  </div>
                </div>
                <p className="mt-4 font-semibold">{c.ar}</p>
                <p className="text-xs text-muted">{c.en}</p>
                <p className="mt-2 text-sm text-muted">
                  {c.artisans ?? '…'} {t('cat.artisans')} · {c.requests ?? '…'} {t('cat.requests')}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => setEditing(c.id)}>
                    {t('cat.edit')}
                  </Button>
                  <Button size="sm" variant={c.active ? 'ghost' : 'primary'} disabled={saving === c.id} onClick={() => write(c.id, { active: !c.active }, { active: !c.active })}>
                    {c.active ? t('cat.hide') : t('cat.show')}
                  </Button>
                  {/* An added service nobody used yet can go; otherwise hide it. */}
                  {c.custom && !c.artisans && !c.requests && (
                    <Button size="sm" variant="ghost" className="text-red-600" disabled={saving === c.id} onClick={() => remove(c)}>
                      {t('cat.delete')}
                    </Button>
                  )}
                </div>
              </>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}

function ServiceIcon({ icon, color, size = 'h-11 w-11' }: { icon: string; color: string; size?: string }) {
  const Icon = ICONS[icon] ?? ICONS.tools;
  return (
    <div className={cn('grid shrink-0 place-items-center rounded-xl', size)} style={{ background: `${color}1f` }}>
      <Icon className="h-5 w-5" style={{ color }} />
    </div>
  );
}

/** Name in both languages and, for added services, the icon and colour — with a preview. */
function CategoryForm({
  initial,
  visual,
  compact,
  saving,
  submitLabel,
  onSave,
  onCancel,
}: {
  initial: Draft;
  visual: boolean;
  compact?: boolean;
  saving: boolean;
  submitLabel: string;
  onSave: (d: Draft) => void;
  onCancel: () => void;
}) {
  const { t } = useT();
  const [d, setD] = useState<Draft>(initial);
  const valid = d.ar.trim().length >= 2;
  return (
    <div className={cn('gap-5', compact ? 'flex flex-col' : 'grid lg:grid-cols-[1fr_16rem]')}>
      <div className="space-y-3">
        <Input aria-label={t('cat.nameAr')} placeholder={t('cat.nameAr')} value={d.ar} maxLength={40} onChange={(e) => setD({ ...d, ar: e.target.value })} />
        <Input aria-label={t('cat.nameEn')} placeholder={t('cat.nameEnOptional')} value={d.en} maxLength={40} dir="ltr" onChange={(e) => setD({ ...d, en: e.target.value })} />
        {visual && (
          <>
            <div>
              <p className="mb-2 text-xs text-muted">{t('cat.icon')}</p>
              <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label={t('cat.icon')}>
                {ICON_KEYS.map((key) => {
                  const Icon = ICONS[key];
                  const on = d.icon === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      role="radio"
                      aria-checked={on}
                      aria-label={key}
                      onClick={() => setD({ ...d, icon: key })}
                      className={cn('grid h-9 w-9 place-items-center rounded-lg border transition-colors', on ? 'border-brand-600 bg-brand-600/10' : 'border-base hover:bg-slate-500/10')}
                    >
                      <Icon className="h-4 w-4" style={{ color: on ? d.color : undefined }} />
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <p className="mb-2 text-xs text-muted">{t('cat.color')}</p>
              <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label={t('cat.color')}>
                {PALETTE.map((color) => (
                  <button
                    key={color}
                    type="button"
                    role="radio"
                    aria-checked={d.color === color}
                    aria-label={color}
                    onClick={() => setD({ ...d, color })}
                    className={cn('h-7 w-7 rounded-full border-2', d.color === color ? 'border-[rgb(var(--fg))]' : 'border-transparent')}
                    style={{ background: color }}
                  />
                ))}
              </div>
            </div>
          </>
        )}
        <div className="flex gap-2 pt-1">
          <Button size="sm" disabled={saving || !valid} onClick={() => onSave(d)}>
            {submitLabel}
          </Button>
          <Button size="sm" variant="ghost" onClick={onCancel}>
            {t('cat.cancel')}
          </Button>
        </div>
      </div>
      {visual && !compact && (
        <div className="rounded-2xl border border-base p-4">
          <p className="mb-3 text-xs text-muted">{t('cat.preview')}</p>
          <div className="flex items-center gap-3 rounded-2xl border border-base p-3">
            <ServiceIcon icon={d.icon} color={d.color} />
            <div className="min-w-0">
              <p className="truncate font-semibold">{d.ar.trim() || t('cat.nameAr')}</p>
              <p className="truncate text-xs text-muted">{d.en.trim() || d.ar.trim() || t('cat.nameEn')}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
