'use client';

import { useMemo } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/ui/data-table';
import { StatusPill } from '@/components/ui/primitives';
import { REQUESTS, type AdminRequest } from '@/lib/mock-data';
import { formatMoney, timeAgo } from '@/lib/utils';
import { useT } from '@/lib/i18n';

export default function RequestsPage() {
  const { t } = useT();
  const columns = useMemo<ColumnDef<AdminRequest, any>[]>(
    () => [
      { accessorKey: 'id', header: t('rcol.id'), cell: ({ getValue }) => <span className="font-mono text-xs text-muted">{getValue() as string}</span> },
      { accessorKey: 'title', header: t('rcol.request'), cell: ({ row }) => <span className="font-medium">{row.original.title}</span> },
      { accessorKey: 'customer', header: t('rcol.customer') },
      { accessorKey: 'category', header: t('rcol.category') },
      { accessorKey: 'offers', header: t('rcol.offers') },
      { accessorKey: 'budgetMax', header: t('rcol.budget'), cell: ({ getValue }) => formatMoney(getValue() as number) },
      { accessorKey: 'status', header: t('col.status'), cell: ({ getValue }) => <StatusPill status={getValue() as string} /> },
      { accessorKey: 'createdAt', header: t('rcol.created'), cell: ({ getValue }) => <span className="text-muted">{timeAgo(getValue() as number)}</span> },
    ],
    [t],
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t('req.title')}</h1>
        <p className="text-sm text-muted">{t('req.subtitle')}</p>
      </div>
      <DataTable columns={columns} data={REQUESTS} searchPlaceholder={t('req.search')} />
    </div>
  );
}
