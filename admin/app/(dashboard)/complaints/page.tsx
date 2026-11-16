'use client';

import { useMemo, useState } from 'react';
import { ArrowLeftRight, ClipboardList, Phone, Search } from 'lucide-react';
import { Badge, Button, Card, FilterTabs, StatusPill } from '@/components/ui/primitives';
import { COMPLAINTS, type Complaint } from '@/lib/mock-data';
import { timeAgo } from '@/lib/utils';
import { formatPhone } from '@/lib/phone';
import { useT } from '@/lib/i18n';
import { isLive } from '@/lib/firebase';
import { useCollection, toComplaints } from '@/lib/live-data';
import { complaintKind, complaintReason, updateComplaint } from '@/lib/feedback';

type Filter = 'open' | 'resolved' | 'dismissed' | 'all';
const isOpen = (c: Complaint) => c.status === 'open' || c.status === 'reviewing';

export default function ComplaintsPage() {
  const { t, locale } = useT();
  // Live: complaints sent from the app — about an artisan or a customer
  // (from a request or a profile) or a general problem (Profile → Report).
  const live = isLive();
  const docs = useCollection('complaints');
  const users = useCollection('users');
  const loaded = useMemo(() => (live ? toComplaints(docs ?? [], users ?? []) : COMPLAINTS), [live, docs, users]);
  // Decisions show at once (and are all there is on demo mode).
  const [changes, setChanges] = useState<Record<string, Partial<Complaint>>>({});
  const items = useMemo(() => loaded.map((c) => ({ ...c, ...changes[c.id] })), [loaded, changes]);
  const [filter, setFilter] = useState<Filter>('open');
  const [query, setQuery] = useState('');
  const [error, setError] = useState(false);

  // How many complaints each person has against them, to spot repeat cases.
  const againstCount = useMemo(() => {
    const m = new Map<string, number>();
    for (const c of items) if (c.targetId) m.set(c.targetId, (m.get(c.targetId) ?? 0) + 1);
    return m;
  }, [items]);

  const counts: Record<Filter, number> = {
    open: items.filter(isOpen).length,
    resolved: items.filter((c) => c.status === 'resolved').length,
    dismissed: items.filter((c) => c.status === 'dismissed').length,
    all: items.length,
  };

  const q = query.trim().toLowerCase();
  const shown = items.filter((c) => {
    if (filter === 'open' && !isOpen(c)) return false;
    if (filter !== 'open' && filter !== 'all' && c.status !== filter) return false;
    if (!q) return true;
    return [c.reporter, c.target, c.reporterPhone, c.targetPhone, c.requestTitle, c.details, complaintReason(c, locale)]
      .some((v) => v && v.toLowerCase().includes(q));
  });

  const decide = async (c: Complaint, status: Complaint['status'], adminNote?: string) => {
    const patch = { status, ...(adminNote !== undefined ? { adminNote } : {}) };
    setChanges((prev) => ({ ...prev, [c.id]: { ...prev[c.id], ...patch } }));
    setError(false);
    try {
      await updateComplaint(c.id, patch);
    } catch {
      setChanges((prev) => ({ ...prev, [c.id]: { status: c.status, adminNote: c.adminNote } }));
      setError(true);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t('comp.title')}</h1>
        <p className="text-sm text-muted">{t('comp.subtitle')}</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <FilterTabs
          value={filter}
          onChange={setFilter}
          tabs={(['open', 'resolved', 'dismissed', 'all'] as Filter[]).map((k) => ({ key: k, label: t(`comp.filter.${k}`), count: counts[k] }))}
        />
        <label className="relative block sm:w-72">
          <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('comp.search')}
            className="surface w-full rounded-xl border border-base py-2 pe-3 ps-9 text-sm outline-none focus:border-brand-500"
          />
        </label>
      </div>

      {error && <p className="text-sm text-red-500">{t('comp.saveFailed')}</p>}

      <div className="space-y-3">
        {shown.length === 0 && <Card className="p-8 text-center text-sm text-muted">{t('comp.empty')}</Card>}
        {shown.map((c) => (
          <ComplaintCard key={c.id} c={c} repeat={c.targetId ? againstCount.get(c.targetId) ?? 0 : 0} onDecide={decide} />
        ))}
      </div>
    </div>
  );
}

function ComplaintCard({
  c,
  repeat,
  onDecide,
}: {
  c: Complaint;
  repeat: number;
  onDecide: (c: Complaint, status: Complaint['status'], adminNote?: string) => void;
}) {
  const { t, locale } = useT();
  const [note, setNote] = useState(c.adminNote ?? '');
  const kind = complaintKind(c);
  const open = c.status === 'open' || c.status === 'reviewing';

  return (
    <Card className="space-y-4 p-5">
      <div className="flex flex-wrap items-center gap-2">
        <p className="font-semibold">{complaintReason(c, locale)}</p>
        <StatusPill status={c.status} />
        <Badge tone={kind === 'general' ? 'neutral' : kind === 'artisan' ? 'brand' : 'info'}>{t(`comp.kind.${kind}`)}</Badge>
        {repeat > 1 && <Badge tone="danger">{t('comp.count').replace('{n}', String(repeat))}</Badge>}
        <span className="ms-auto text-xs text-muted">{timeAgo(c.createdAt, locale)}</span>
      </div>

      <div className="grid gap-3 text-sm sm:grid-cols-[1fr_auto_1fr] sm:items-center">
        <Party label={t('comp.from')} name={c.reporter} role={c.reporterRole} phone={c.reporterPhone} />
        {kind !== 'general' && (
          <>
            <ArrowLeftRight className="hidden h-4 w-4 text-muted sm:block rtl:rotate-180" />
            <Party label={t('comp.against')} name={c.target} role={c.targetRole} phone={c.targetPhone} />
          </>
        )}
      </div>

      {c.requestTitle && (
        <p className="flex items-center gap-2 text-sm text-muted">
          <ClipboardList className="h-4 w-4" /> {t('comp.request')}: <span className="font-medium">{c.requestTitle}</span>
        </p>
      )}
      {c.details && <p className="whitespace-pre-wrap rounded-xl bg-slate-500/5 p-3 text-sm">{c.details}</p>}

      {open ? (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={t('comp.note')}
            aria-label={t('comp.note')}
            maxLength={500}
            className="surface flex-1 rounded-xl border border-base px-3 py-2 text-sm outline-none focus:border-brand-500"
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={() => onDecide(c, 'resolved', note.trim())}>{t('comp.resolve')}</Button>
            <Button size="sm" variant="outline" onClick={() => onDecide(c, 'dismissed', note.trim())}>{t('comp.dismiss')}</Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted">{c.adminNote ? `${t('comp.noteLabel')} ${c.adminNote}` : ''}</p>
          <Button size="sm" variant="ghost" onClick={() => onDecide(c, 'open')}>{t('comp.reopen')}</Button>
        </div>
      )}
    </Card>
  );
}

function Party({ label, name, role, phone }: { label: string; name: string; role?: string; phone?: string }) {
  const { t } = useT();
  return (
    <div className="min-w-0">
      <p className="text-xs text-muted">{label}</p>
      <p className="truncate font-medium">
        {name || '—'}
        {role && <span className="ms-1 text-xs font-normal text-muted">({t(`role.${role}` as any)})</span>}
      </p>
      {phone && (
        <a href={`tel:${phone}`} className="inline-flex items-center gap-1 text-xs text-brand-500 hover:underline">
          <Phone className="h-3 w-3" /> <span dir="ltr">{formatPhone(phone)}</span>
        </a>
      )}
    </div>
  );
}
