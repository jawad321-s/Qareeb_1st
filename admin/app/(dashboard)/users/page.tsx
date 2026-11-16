'use client';

import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import type { ColumnDef } from '@tanstack/react-table';
import { CheckCircle2, KeyRound, Phone, ShieldCheck, ShieldOff, Star, Trash2, UserCheck, UserX, X } from 'lucide-react';
import { DataTable } from '@/components/ui/data-table';
import { Badge, Button, FilterTabs, StatusPill } from '@/components/ui/primitives';
import { USERS, type AdminUser } from '@/lib/mock-data';
import { timeAgo } from '@/lib/utils';
import { formatPhone } from '@/lib/phone';
import { useT, type TKey } from '@/lib/i18n';
import { isLive } from '@/lib/firebase';
import { useCollection, toAdminUsers } from '@/lib/live-data';
import { manageUser, PASSWORD_MIN, UserActionFailed, type UserAction } from '@/lib/users.service';

type Filter = 'all' | 'customer' | 'artisan' | 'suspended';

export default function UsersPage() {
  const { t, locale } = useT();
  const live = isLive();
  // Live: every customer and artisan account in Firestore, newest first.
  const users = useCollection('users');
  const requests = useCollection('requests');
  const profiles = useCollection('artisanProfiles');
  const complaints = useCollection('complaints');
  const loaded = useMemo(
    () => (live ? toAdminUsers(users ?? [], requests ?? [], profiles ?? []) : USERS),
    [live, users, requests, profiles],
  );
  // Demo mode has no backend: decisions are kept on the page.
  const [demo, setDemo] = useState<Record<string, Partial<AdminUser> | null>>({});
  const rows = useMemo(
    () => loaded.filter((u) => demo[u.uid] !== null).map((u) => ({ ...u, ...demo[u.uid] })),
    [loaded, demo],
  );
  const [filter, setFilter] = useState<Filter>('all');
  const [selected, setSelected] = useState<string | null>(null);

  const shown = rows.filter((u) => (filter === 'all' ? true : filter === 'suspended' ? u.status === 'suspended' : u.role === filter));
  const counts: Record<Filter, number> = {
    all: rows.length,
    customer: rows.filter((u) => u.role === 'customer').length,
    artisan: rows.filter((u) => u.role === 'artisan').length,
    suspended: rows.filter((u) => u.status === 'suspended').length,
  };
  // Complaints about each person (any status), shown in their panel.
  const against = useMemo(() => {
    const m = new Map<string, number>();
    for (const c of complaints ?? []) if (c.targetId) m.set(c.targetId, (m.get(c.targetId) ?? 0) + 1);
    return m;
  }, [complaints]);

  const columns = useMemo<ColumnDef<AdminUser, any>[]>(
    () => [
      {
        // Name and phone (both spellings), so the search box finds either.
        id: 'fullName',
        accessorFn: (u) => `${u.fullName} ${u.phone} ${u.phone.replace(/^\+97[02]/, '0')}`,
        header: t('col.user'),
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <Initials name={row.original.fullName} />
            <div>
              <p className="flex items-center gap-1.5 font-medium leading-tight">
                {row.original.fullName}
                {row.original.featured && <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" aria-label={t('users.featured')} />}
              </p>
              <p className="text-xs text-muted">
                <span dir="ltr">{formatPhone(row.original.phone)}</span>
              </p>
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'role',
        header: t('col.role'),
        cell: ({ getValue }) => <Badge tone={getValue() === 'artisan' ? 'brand' : 'neutral'}>{t(`role.${getValue()}` as TKey)}</Badge>,
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
      {
        id: 'manage',
        header: () => null,
        enableSorting: false,
        cell: ({ row }) => (
          <Button size="sm" variant="outline" onClick={() => setSelected(row.original.uid)}>
            {t('users.manage')}
          </Button>
        ),
      },
    ],
    [t, locale],
  );

  const current = rows.find((u) => u.uid === selected) ?? null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t('users.title')}</h1>
        <p className="text-sm text-muted">{rows.length} {t('users.subtitle')}</p>
      </div>
      <FilterTabs
        value={filter}
        onChange={setFilter}
        tabs={(['all', 'customer', 'artisan', 'suspended'] as Filter[]).map((k) => ({ key: k, label: t(`users.filter.${k}`), count: counts[k] }))}
      />
      <DataTable columns={columns} data={shown} searchPlaceholder={t('users.search')} />
      {current && (
        <UserPanel
          user={current}
          complaints={against.get(current.uid) ?? 0}
          onClose={() => setSelected(null)}
          onDemoChange={(patch) => setDemo((d) => ({ ...d, [current.uid]: patch === null ? null : { ...d[current.uid], ...patch } }))}
        />
      )}
    </div>
  );
}

function Initials({ name, size = 'h-9 w-9 text-xs' }: { name: string; size?: string }) {
  return (
    <div className={`grid shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand-400 to-accent-400 font-bold text-white ${size}`}>
      {name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
    </div>
  );
}

/**
 * Everything the team can do to one account, in a side panel: suspend or
 * reactivate it, verify an artisan (or take it back), set a new password,
 * delete it. Each action runs on the server (Cloud Function adminManageUser).
 */
function UserPanel({
  user,
  complaints,
  onClose,
  onDemoChange,
}: {
  user: AdminUser;
  complaints: number;
  onClose: () => void;
  onDemoChange: (patch: Partial<AdminUser> | null) => void;
}) {
  const { t, locale } = useT();
  const [busy, setBusy] = useState<UserAction | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [reason, setReason] = useState('');
  const [password, setPassword] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const suspended = user.status === 'suspended';
  const artisan = user.role === 'artisan';

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const run = async (action: UserAction, extra: { reason?: string; password?: string } = {}) => {
    setBusy(action);
    setMessage(null);
    try {
      await manageUser(action, user.uid, extra);
      if (!isLive()) {
        const patch: Record<UserAction, Partial<AdminUser> | null> = {
          suspend: { status: 'suspended', suspendReason: extra.reason },
          reactivate: { status: 'active', suspendReason: undefined },
          verify: { verified: true },
          unverify: { verified: false },
          setPassword: {},
          delete: null,
        };
        onDemoChange(patch[action]);
      }
      if (action === 'delete') return onClose();
      if (action === 'setPassword') setPassword('');
      if (action === 'suspend') setReason('');
      setMessage({ ok: true, text: t(`users.done.${action}` as TKey) });
    } catch (e) {
      const why = e instanceof UserActionFailed ? e.reason : 'generic';
      setMessage({ ok: false, text: t(`users.err.${why}` as TKey) });
    } finally {
      setBusy(null);
      setConfirmDelete(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={user.fullName}>
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <aside className="surface absolute inset-y-0 end-0 flex w-[28rem] max-w-full flex-col border-s border-base shadow-xl">
        <div className="flex items-start gap-3 border-b border-base p-5">
          <Initials name={user.fullName} size="h-12 w-12 text-sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-lg font-semibold">{user.fullName}</p>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              <Badge tone={artisan ? 'brand' : 'neutral'}>{t(`role.${user.role}` as TKey)}</Badge>
              <StatusPill status={user.status} />
              {user.verified && <Badge tone="success">{t('users.verifiedBadge')}</Badge>}
              {user.featured && <Badge tone="warning">{t('users.featured')}</Badge>}
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label={t('ver.close')} className="rounded-lg p-1.5 hover:bg-slate-500/10">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto p-5">
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <Info label={t('users.phone')}>
              <a href={`tel:${user.phone}`} className="inline-flex items-center gap-1 text-brand-500 hover:underline">
                <Phone className="h-3.5 w-3.5" /> <span dir="ltr">{formatPhone(user.phone)}</span>
              </a>
            </Info>
            <Info label={t('col.joined')}>{timeAgo(user.joinedAt, locale)}</Info>
            <Info label={t('col.city')}>{user.city}</Info>
            <Info label={t('col.rating')}>{user.rating}</Info>
            <Info label={t('users.completedJobs')}>{user.jobs}</Info>
            <Info label={t('users.complaints')}>
              <span className={complaints ? 'font-semibold text-red-500' : ''}>{complaints}</span>
            </Info>
          </dl>
          {suspended && user.suspendReason && (
            <p className="rounded-xl bg-red-500/10 p-3 text-sm">
              {t('users.suspendedFor')} {user.suspendReason}
            </p>
          )}

          {message && (
            <p role="status" className={`rounded-xl p-3 text-sm ${message.ok ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' : 'bg-red-500/10 text-red-600'}`}>
              {message.text}
            </p>
          )}

          <Section title={t('users.sec.account')} hint={t(suspended ? 'users.reactivateHint' : 'users.suspendHint')}>
            {suspended ? (
              <Button disabled={!!busy} onClick={() => run('reactivate')}>
                <UserCheck className="h-4 w-4" /> {t('users.reactivate')}
              </Button>
            ) : (
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder={t('users.suspendReason')}
                  aria-label={t('users.suspendReason')}
                  maxLength={300}
                  className="surface flex-1 rounded-xl border border-base px-3 py-2 text-sm outline-none focus:border-brand-500"
                />
                <Button variant="danger" disabled={!!busy} onClick={() => run('suspend', { reason: reason.trim() })}>
                  <UserX className="h-4 w-4" /> {t('users.suspend')}
                </Button>
              </div>
            )}
          </Section>

          {artisan && (
            <Section title={t('users.sec.verification')} hint={t(user.verified ? 'users.unverifyHint' : 'users.verifyHint')}>
              {user.verified ? (
                <Button variant="outline" disabled={!!busy} onClick={() => run('unverify')}>
                  <ShieldOff className="h-4 w-4" /> {t('users.unverify')}
                </Button>
              ) : (
                <Button disabled={!!busy} onClick={() => run('verify')}>
                  <ShieldCheck className="h-4 w-4" /> {t('users.verify')}
                </Button>
              )}
            </Section>
          )}

          <Section title={t('users.sec.password')} hint={t('users.passwordHint')}>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('users.newPassword')}
                aria-label={t('users.newPassword')}
                autoComplete="off"
                dir="ltr"
                className="surface flex-1 rounded-xl border border-base px-3 py-2 text-sm outline-none focus:border-brand-500"
              />
              <Button variant="outline" disabled={!!busy || password.length < PASSWORD_MIN} onClick={() => run('setPassword', { password })}>
                <KeyRound className="h-4 w-4" /> {t('users.setPassword')}
              </Button>
            </div>
          </Section>

          <Section title={t('users.sec.delete')} hint={t('users.deleteHint')} danger>
            {confirmDelete ? (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-red-600">{t('users.deleteSure')}</span>
                <Button variant="danger" disabled={!!busy} onClick={() => run('delete')}>
                  {t('users.deleteYes')}
                </Button>
                <Button variant="ghost" onClick={() => setConfirmDelete(false)}>
                  {t('users.cancel')}
                </Button>
              </div>
            ) : (
              <Button variant="danger" disabled={!!busy} onClick={() => setConfirmDelete(true)}>
                <Trash2 className="h-4 w-4" /> {t('users.delete')}
              </Button>
            )}
          </Section>
        </div>
      </aside>
    </div>,
    document.body,
  );
}

function Info({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-slate-500/5 p-3">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="mt-0.5 font-medium">{children}</dd>
    </div>
  );
}

function Section({ title, hint, danger, children }: { title: string; hint: string; danger?: boolean; children: React.ReactNode }) {
  return (
    <section className={`space-y-2 rounded-2xl border p-4 ${danger ? 'border-red-500/40' : 'border-base'}`}>
      <h3 className={`font-semibold ${danger ? 'text-red-600' : ''}`}>{title}</h3>
      <p className="text-xs text-muted">{hint}</p>
      {children}
    </section>
  );
}
