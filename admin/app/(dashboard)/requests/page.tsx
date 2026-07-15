'use client';

import { useEffect, useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/ui/data-table';
import { StatusPill } from '@/components/ui/primitives';
import { type AdminRequest } from '@/lib/mock-data';
import { subscribeRequests } from '@/lib/requests.service';
import { formatMoney, timeAgo } from '@/lib/utils';
import { useT } from '@/lib/i18n';

export default function RequestsPage() {
  const { t, locale } = useT();
  const [data, setData] = useState<AdminRequest[]>([]);

  // Live requests feed from Firestore (falls back to mock on mock mode).
  useEffect(() => subscribeRequests(setData), []);

  const columns = useMemo<ColumnDef<AdminRequest, any>[]>(
    () => [
      { accessorKey: 'id', header: t('rcol.id'), cell: ({ getValue }) => <span className="font-mono text-xs text-muted">{getValue() as string}</span> },
      { accessorKey: 'title', header: t('rcol.request'), cell: ({ row }) => <span className="font-medium">{row.original.title}</span> },
      { accessorKey: 'customer', header: t('rcol.customer') },
      { accessorKey: 'category', header: t('rcol.category') },
      { accessorKey: 'offers', header: t('rcol.offers') },
      { accessorKey: 'budgetMax', header: t('rcol.budget'), cell: ({ getValue }) => formatMoney(getValue() as number) },
      { accessorKey: 'status', header: t('col.status'), cell: ({ getValue }) => <StatusPill status={getValue() as string} /> },
      { accessorKey: 'createdAt', header: t('rcol.created'), cell: ({ getValue }) => <span className="text-muted">{timeAgo(getValue() as number, locale)}</span> },
    ],
    [t, locale],
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t('req.title')}</h1>
        <p className="text-sm text-muted">{t('req.subtitle')}</p>
      </div>
      <DataTable columns={columns} data={data} searchPlaceholder={t('req.search')} />
    </div>
  );
}
