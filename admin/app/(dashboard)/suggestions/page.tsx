'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Layers, Lightbulb, Phone } from 'lucide-react';
import { Badge, Button, Card, FilterTabs, StatusPill } from '@/components/ui/primitives';
import { SUGGESTIONS, type Suggestion } from '@/lib/mock-data';
import { timeAgo } from '@/lib/utils';
import { formatPhone } from '@/lib/phone';
import { useT } from '@/lib/i18n';
import { isLive } from '@/lib/firebase';
import { useCollection, toSuggestions } from '@/lib/live-data';
import { suggestionKey, updateSuggestion } from '@/lib/feedback';

type Filter = Suggestion['status'] | 'all';

export default function SuggestionsPage() {
  const { t, locale } = useT();
  // Live: suggestions sent from the app (the service lists and Profile → Suggest a service).
  const live = isLive();
  const docs = useCollection('suggestions');
  const loaded = useMemo(() => (live ? toSuggestions(docs ?? []) : SUGGESTIONS), [live, docs]);
  const [changes, setChanges] = useState<Record<string, Suggestion['status']>>({});
  const items = useMemo(() => loaded.map((s) => (changes[s.id] ? { ...s, status: changes[s.id] } : s)), [loaded, changes]);
  const [filter, setFilter] = useState<Filter>('new');
  const [error, setError] = useState(false);

  // The same service asked for by several people counts once, with how many.
  const groups = useMemo(() => {
    const m = new Map<string, { name: string; count: number; open: number }>();
    for (const s of items) {
      const key = suggestionKey(s.name);
      const g = m.get(key) ?? { name: s.name, count: 0, open: 0 };
      g.count += 1;
      if (s.status === 'new' || s.status === 'reviewed') g.open += 1;
      m.set(key, g);
    }
    return m;
  }, [items]);
  const top = [...groups.values()].filter((g) => g.open > 0 && g.count > 1).sort((a, b) => b.count - a.count).slice(0, 8);

  const filters: Filter[] = ['new', 'reviewed', 'added', 'declined', 'all'];
  const count = (f: Filter) => (f === 'all' ? items.length : items.filter((s) => s.status === f).length);
  const shown = items.filter((s) => filter === 'all' || s.status === filter);

  const decide = async (s: Suggestion, status: Suggestion['status']) => {
    setChanges((prev) => ({ ...prev, [s.id]: status }));
    setError(false);
    try {
      await updateSuggestion(s.id, status);
    } catch {
      setChanges((prev) => ({ ...prev, [s.id]: s.status }));
      setError(true);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t('sug.title')}</h1>
        <p className="text-sm text-muted">{t('sug.subtitle')}</p>
      </div>

      {top.length > 0 && (
        <Card className="space-y-3 p-5">
          <p className="flex items-center gap-2 text-sm font-semibold">
            <Lightbulb className="h-4 w-4 text-amber-500" /> {t('sug.top')}
          </p>
          <div className="flex flex-wrap gap-2">
            {top.map((g) => (
              <span key={g.name} className="inline-flex items-center gap-2 rounded-full border border-base px-3 py-1 text-sm">
                {g.name}
                <span className="rounded-full bg-amber-500/15 px-1.5 text-xs font-semibold text-amber-800 dark:text-amber-300">×{g.count}</span>
              </span>
            ))}
          </div>
        </Card>
      )}

      <FilterTabs value={filter} onChange={setFilter} tabs={filters.map((k) => ({ key: k, label: t(`sug.filter.${k}`), count: count(k) }))} />

      {error && <p className="text-sm text-red-500">{t('sug.saveFailed')}</p>}

      <div className="grid gap-3 md:grid-cols-2">
        {shown.length === 0 && <Card className="p-8 text-center text-sm text-muted md:col-span-2">{t('sug.empty')}</Card>}
        {shown.map((s) => {
          const same = groups.get(suggestionKey(s.name))?.count ?? 1;
          return (
            <Card key={s.id} className="flex flex-col gap-3 p-5">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold">{s.name}</p>
                <StatusPill status={s.status} />
                {same > 1 && <Badge tone="warning">{t('sug.people').replace('{n}', String(same))}</Badge>}
                <span className="ms-auto text-xs text-muted">{timeAgo(s.createdAt, locale)}</span>
              </div>
              {s.details && <p className="whitespace-pre-wrap text-sm text-muted">{s.details}</p>}
              <div className="text-sm">
                <span className="font-medium">{s.author}</span>
                {s.authorRole && <span className="ms-1 text-xs text-muted">({t(`role.${s.authorRole}`)})</span>}
                {s.authorPhone && (
                  <a href={`tel:${s.authorPhone}`} className="ms-3 inline-flex items-center gap-1 text-xs text-brand-600 dark:text-brand-400 hover:underline">
                    <Phone className="h-3 w-3" /> <span dir="ltr">{formatPhone(s.authorPhone)}</span>
                  </a>
                )}
              </div>
              <div className="mt-auto flex flex-wrap gap-2 pt-1">
                {s.status === 'new' && (
                  <Button size="sm" variant="outline" onClick={() => decide(s, 'reviewed')}>{t('sug.markReviewed')}</Button>
                )}
                {(s.status === 'new' || s.status === 'reviewed') && (
                  <>
                    <Button size="sm" onClick={() => decide(s, 'added')}>{t('sug.markAdded')}</Button>
                    <Button size="sm" variant="ghost" onClick={() => decide(s, 'declined')}>{t('sug.decline')}</Button>
                  </>
                )}
                {(s.status === 'added' || s.status === 'declined') && (
                  <Button size="sm" variant="ghost" onClick={() => decide(s, 'new')}>{t('sug.reopen')}</Button>
                )}
                {s.status !== 'added' && s.status !== 'declined' && (
                  <Link href={`/categories?new=${encodeURIComponent(s.name)}`} className="inline-flex items-center gap-1.5 rounded-xl px-2 py-1.5 text-sm text-brand-600 dark:text-brand-400 hover:underline">
                    <Layers className="h-4 w-4" /> {t('sug.addCategory')}
                  </Link>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
