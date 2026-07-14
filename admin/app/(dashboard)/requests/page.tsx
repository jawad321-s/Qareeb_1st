'use client';

import { useMemo } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/ui/data-table';
import { StatusPill } from '@/components/ui/primitives';
import { REQUESTS, type AdminRequest } from '@/lib/mock-data';
import { formatMoney, timeAgo } from '@/lib/utils';

export default function RequestsPage() {
  const columns = useMemo<ColumnDef<AdminRequest, any>[]>(
    () => [
      { accessorKey: 'id', header: 'ID', cell: ({ getValue }) => <span className="font-mono text-xs text-muted">{getValue() as string}</span> },
      { accessorKey: 'title', header: 'Request', cell: ({ row }) => <span className="font-medium">{row.original.title}</span> },
      { accessorKey: 'customer', header: 'Customer' },
      { accessorKey: 'category', header: 'Category' },
      { accessorKey: 'offers', header: 'Offers' },
      { accessorKey: 'budgetMax', header: 'Budget', cell: ({ getValue }) => formatMoney(getValue() as number) },
      { accessorKey: 'status', header: 'Status', cell: ({ getValue }) => <StatusPill status={getValue() as string} /> },
      { accessorKey: 'createdAt', header: 'Created', cell: ({ getValue }) => <span className="text-muted">{timeAgo(getValue() as number)}</span> },
    ],
    [],
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Requests</h1>
        <p className="text-sm text-muted">All service requests across the platform.</p>
      </div>
      <DataTable columns={columns} data={REQUESTS} searchPlaceholder="Search requests…" />
    </div>
  );
}
