'use client';

import { cn } from '@/lib/utils';

/** A person's initials in a gradient circle (users, verifications). */
export function Initials({ name, size = 'h-9 w-9 text-xs' }: { name: string; size?: string }) {
  return (
    <div className={cn('grid shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand-700 to-brand-600 font-bold text-white', size)}>
      {name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
    </div>
  );
}

/** An artisan's services as small chips; `max` shows the first few and "+N". */
export function ServiceChips({ ids, name, max }: { ids?: string[]; name: (id: string) => string; max?: number }) {
  if (!ids) return <span className="text-muted">—</span>;
  if (ids.length === 0) return <span className="text-xs text-muted">0</span>;
  const shown = max ? ids.slice(0, max) : ids;
  return (
    <div className="flex flex-wrap gap-1">
      {shown.map((id) => (
        <span key={id} className="rounded-full bg-brand-500/10 px-2 py-0.5 text-xs font-medium text-brand-600 dark:text-brand-400">
          {name(id)}
        </span>
      ))}
      {max && ids.length > max && <span className="rounded-full bg-slate-500/10 px-2 py-0.5 text-xs text-muted">+{ids.length - max}</span>}
    </div>
  );
}
