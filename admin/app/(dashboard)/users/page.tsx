'use client';

import { useMemo } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { CheckCircle2, Star } from 'lucide-react';
import { DataTable } from '@/components/ui/data-table';
import { Badge, StatusPill } from '@/components/ui/primitives';
import { USERS, type AdminUser } from '@/lib/mock-data';
import { timeAgo } from '@/lib/utils';
import { useT } from '@/lib/i18n';

export default function UsersPage() {
  const { t, locale } = useT();
  const columns = useMemo<ColumnDef<AdminUser, any>[]>(
    () => [
      {
        accessorKey: 'fullName',
        header: t('col.user'),
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-brand-400 to-accent-400 text-xs font-bold text-white">
              {row.original.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2)}
            </div>
            <div>
              <p className="font-medium leading-tight">{row.original.fullName}</p>
              <p className="text-xs text-muted">{row.original.email}</p>
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'role',
        header: t('col.role'),
        cell: ({ getValue }) => <Badge tone={getValue() === 'artisan' ? 'brand' : 'neutral'}>{t(`role.${getValue()}` as any)}</Badge>,
      },
      { accessorKey: 'city', header: t('col.city') },
      {
        accessorKey: 'rating',
        header: t('col.rating'),
        cell: ({ getValue }) => (
          <span className="inline-flex items-center gap-1">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> {getValue() as number}
          </span>
        ),
      },
      { accessorKey: 'jobs', header: t('col.jobs') },
      {
        accessorKey: 'verified',
        header: t('col.verified'),
        cell: ({ getValue }) => (getValue() ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <span className="text-muted">—</span>),
      },
      {
        accessorKey: 'status',
        header: t('col.status'),
        cell: ({ getValue }) => <StatusPill status={getValue() as string} />,
      },
      {
        accessorKey: 'joinedAt',
        header: t('col.joined'),
        cell: ({ getValue }) => <span className="text-muted">{timeAgo(getValue() as number, locale)}</span>,
      },
    ],
    [t, locale],
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t('users.title')}</h1>
        <p className="text-sm text-muted">{USERS.length} {t('users.subtitle')}</p>
      </div>
      <DataTable columns={columns} data={USERS} searchPlaceholder={t('users.search')} />
    </div>
  );
}
