'use client';

import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import type { ColumnDef } from '@tanstack/react-table';
import { ArrowLeft, Check, FileText, Loader2, Phone, ShieldCheck, X } from 'lucide-react';
import { DataTable } from '@/components/ui/data-table';
import { Button, FilterTabs, StatusPill } from '@/components/ui/primitives';
import { Initials, ServiceChips } from '@/components/ui/people';
import { type VerificationItem } from '@/lib/mock-data';
import { subscribeVerifications, decideVerification, loadVerificationPhotos, type VerificationPhoto } from '@/lib/verification.service';
import { artisanCategories, useCollection } from '@/lib/live-data';
import { useServiceName } from '@/lib/catalog';
import { formatPhone } from '@/lib/phone';
import { timeAgo } from '@/lib/utils';
import { useT, type TKey } from '@/lib/i18n';

type Filter = 'pending' | 'approved' | 'rejected' | 'all';
type Row = VerificationItem & { services: string[] };

/**
 * Artisans asking to be verified, as rows like the Users page: who, their
 * services (as on their profile now), when they asked, the documents and the
 * status. "Review" opens a side panel with the photos and approve / reject.
 */
export default function ArtisansPage() {
  const { t, locale } = useT();
  const [items, setItems] = useState<VerificationItem[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>('pending');
  // Current services per artisan (null on mock / while loading).
  const profiles = useCollection('artisanProfiles');
  const serviceName = useServiceName();

  // Live queue from Firestore (falls back to the mock list on mock mode).
  useEffect(() => subscribeVerifications(setItems), []);

  const decide = (item: VerificationItem, status: 'approved' | 'rejected') => {
    // Optimistic UI; persists to Firestore when live.
    setItems((prev) => prev.map((v) => (v.id === item.id ? { ...v, status } : v)));
    void decideVerification(item, status);
  };

  const rows: Row[] = useMemo(
    () => items.map((v) => ({ ...v, services: artisanCategories(v.artisanId, profiles, v) })),
    [items, profiles],
  );
  const counts: Record<Filter, number> = {
    pending: rows.filter((r) => r.status === 'pending').length,
    approved: rows.filter((r) => r.status === 'approved').length,
    rejected: rows.filter((r) => r.status === 'rejected').length,
    all: rows.length,
  };
  const shown = rows.filter((r) => filter === 'all' || r.status === filter);

  const columns = useMemo<ColumnDef<Row, any>[]>(
    () => [
      {
        // Name, phone and services, so the search box finds any of them.
        id: 'name',
        accessorFn: (r) => `${r.name} ${r.phone ?? ''} ${r.services.map(serviceName).join(' ')}`,
        header: t('col.user'),
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <Initials name={row.original.name} />
            <div>
              <p className="font-medium leading-tight">{row.original.name}</p>
              {row.original.phone && (
                <p className="text-xs text-muted">
                  <span dir="ltr">{formatPhone(row.original.phone)}</span>
                </p>
              )}
            </div>
          </div>
        ),
      },
      {
        id: 'services',
        header: t('col.services'),
        enableSorting: false,
        cell: ({ row }) => <ServiceChips ids={row.original.services} name={serviceName} max={2} />,
      },
      {
        accessorKey: 'submittedAt',
        header: t('ver.col.submitted'),
        cell: ({ getValue }) => <span className="text-muted">{timeAgo(getValue() as number, locale)}</span>,
      },
      {
        id: 'documents',
        header: t('ver.col.documents'),
        enableSorting: false,
        cell: ({ row }) =>
          row.original.hasDocuments === false ? (
            <span className="text-xs text-muted">{t('ver.none')}</span>
          ) : (
            <span className="inline-flex items-center gap-1 text-sm">
              <FileText className="h-4 w-4 text-muted" /> {row.original.files?.length ?? Object.keys(row.original.legacyUrls ?? {}).length}
            </span>
          ),
      },
      {
        accessorKey: 'status',
        header: t('col.status'),
        cell: ({ getValue }) => <StatusPill status={getValue() as string} />,
      },
      {
        id: 'review',
        header: () => null,
        enableSorting: false,
        cell: ({ row }) => (
          <Button size="sm" variant={row.original.status === 'pending' ? 'primary' : 'outline'} onClick={() => setSelected(row.original.id)}>
            {t('ver.review')}
          </Button>
        ),
      },
    ],
    [t, locale, serviceName],
  );

  const current = rows.find((r) => r.id === selected) ?? null;

  return (
    <div className="space-y-6">
      <Link
        href="/"
        className="inline-flex items-center gap-2 rounded-xl border border-base px-3 py-2 text-sm font-medium hover:bg-slate-500/10"
      >
        <ArrowLeft className="h-4 w-4 rtl:rotate-180" /> {t('nav.backHome')}
      </Link>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('ver.title')}</h1>
          <p className="text-sm text-muted">{counts.pending} {t('ver.subtitle')}</p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-xl bg-brand-500/10 px-3 py-2 text-sm font-medium text-brand-500">
          <ShieldCheck className="h-4 w-4" /> {counts.pending} {t('ver.pending')}
        </span>
      </div>

      <FilterTabs
        value={filter}
        onChange={setFilter}
        tabs={(['pending', 'approved', 'rejected', 'all'] as Filter[]).map((k) => ({ key: k, label: t(`ver.filter.${k}` as TKey), count: counts[k] }))}
      />
      <DataTable columns={columns} data={shown} searchPlaceholder={t('ver.search')} />

      {current && <VerificationPanel item={current} serviceName={serviceName} onClose={() => setSelected(null)} onDecide={decide} />}
    </div>
  );
}

/** One artisan's request: details, the ID / selfie / certificate photos, approve or reject. */
function VerificationPanel({
  item,
  serviceName,
  onClose,
  onDecide,
}: {
  item: Row;
  serviceName: (id: string) => string;
  onClose: () => void;
  onDecide: (item: VerificationItem, status: 'approved' | 'rejected') => void;
}) {
  const { t, locale } = useT();
  const [photos, setPhotos] = useState<VerificationPhoto[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [zoomed, setZoomed] = useState<VerificationPhoto | null>(null);

  useEffect(() => {
    let alive = true;
    setPhotos(null);
    setFailed(false);
    loadVerificationPhotos(item)
      .then((p) => alive && setPhotos(p))
      .catch((err) => {
        console.warn('[verification photos]', err);
        if (alive) setFailed(true);
      });
    return () => {
      alive = false;
    };
    // Reload only for another request (not when its status changes).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.id]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (zoomed) setZoomed(null);
      else onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [zoomed, onClose]);

  const label = (name: string) => {
    if (name === 'id') return t('ver.idPhoto');
    if (name === 'idFront') return t('ver.idFront');
    if (name === 'idBack') return t('ver.idBack');
    if (name === 'selfie') return t('ver.selfie');
    const n = name.match(/^certificate-(\d+)$/)?.[1];
    return n ? `${t('ver.certificate')} ${n}` : name;
  };

  return createPortal(
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={item.name}>
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <aside className="surface absolute inset-y-0 end-0 flex w-[34rem] max-w-full flex-col border-s border-base shadow-xl">
        <div className="flex items-start gap-3 border-b border-base p-5">
          <Initials name={item.name} size="h-12 w-12 text-sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-lg font-semibold">{item.name}</p>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              <StatusPill status={item.status} />
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label={t('ver.close')} className="rounded-lg p-1.5 hover:bg-slate-500/10">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto p-5">
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl bg-slate-500/5 p-3">
              <dt className="text-xs text-muted">{t('users.phone')}</dt>
              <dd className="mt-0.5 font-medium">
                {item.phone ? (
                  <a href={`tel:${item.phone}`} className="inline-flex items-center gap-1 text-brand-500 hover:underline">
                    <Phone className="h-3.5 w-3.5" /> <span dir="ltr">{formatPhone(item.phone)}</span>
                  </a>
                ) : (
                  '—'
                )}
              </dd>
            </div>
            <div className="rounded-xl bg-slate-500/5 p-3">
              <dt className="text-xs text-muted">{t('ver.col.submitted')}</dt>
              <dd className="mt-0.5 font-medium">{timeAgo(item.submittedAt, locale)}</dd>
            </div>
          </dl>
          <div className="space-y-2">
            <p className="text-xs text-muted">
              {t('users.services')} ({item.services.length})
            </p>
            {item.services.length ? <ServiceChips ids={item.services} name={serviceName} /> : <p className="text-sm text-muted">{t('users.noServices')}</p>}
          </div>

          <div className="space-y-2">
            <p className="text-xs text-muted">{t('ver.col.documents')}</p>
            {item.hasDocuments === false ? (
              <p className="rounded-xl border border-dashed border-base px-3 py-2 text-xs text-muted">{t('ver.noDocs')}</p>
            ) : failed ? (
              <p className="py-6 text-center text-sm text-muted">{t('ver.docsFailed')}</p>
            ) : !photos ? (
              <p className="flex items-center justify-center gap-2 py-6 text-sm text-muted">
                <Loader2 className="h-4 w-4 animate-spin" /> {t('ver.loadingDocs')}
              </p>
            ) : photos.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted">{t('ver.noPhotos')}</p>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {photos.map((p) => (
                  <figure key={p.name} className="space-y-1.5">
                    <button type="button" onClick={() => setZoomed(p)} className="block w-full cursor-zoom-in">
                      {/* eslint-disable-next-line @next/next/no-img-element -- data URLs from Firestore */}
                      <img src={p.url} alt={label(p.name)} className="h-40 w-full rounded-xl bg-slate-500/10 object-contain" />
                    </button>
                    <figcaption className="text-xs text-muted">{label(p.name)}</figcaption>
                  </figure>
                ))}
              </div>
            )}
          </div>
        </div>

        {item.status === 'pending' && (
          <div className="flex gap-2 border-t border-base p-4">
            <Button variant="outline" className="flex-1" onClick={() => onDecide(item, 'rejected')}>
              <X className="h-4 w-4" /> {t('ver.reject')}
            </Button>
            <Button className="flex-1" onClick={() => onDecide(item, 'approved')}>
              <Check className="h-4 w-4" /> {t('ver.approve')}
            </Button>
          </div>
        )}
      </aside>

      {zoomed && (
        <div className="fixed inset-0 z-[60] grid cursor-zoom-out place-items-center bg-black/85 p-4" onClick={() => setZoomed(null)}>
          {/* eslint-disable-next-line @next/next/no-img-element -- data URLs from Firestore */}
          <img src={zoomed.url} alt={label(zoomed.name)} className="max-h-[90vh] max-w-full rounded-xl object-contain" />
        </div>
      )}
    </div>,
    document.body,
  );
}
