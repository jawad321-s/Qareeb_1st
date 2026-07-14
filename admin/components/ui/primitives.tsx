import { cn } from '@/lib/utils';

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn('surface rounded-2xl border border-base shadow-sm', className)}>{children}</div>
  );
}

type BadgeTone = 'neutral' | 'brand' | 'success' | 'warning' | 'danger' | 'info';
const TONES: Record<BadgeTone, string> = {
  neutral: 'bg-slate-500/15 text-slate-500',
  brand: 'bg-brand-500/15 text-brand-500',
  success: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
  warning: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
  danger: 'bg-red-500/15 text-red-600 dark:text-red-400',
  info: 'bg-blue-500/15 text-blue-600 dark:text-blue-400',
};

export function Badge({ tone = 'neutral', children }: { tone?: BadgeTone; children: React.ReactNode }) {
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold', TONES[tone])}>
      {children}
    </span>
  );
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'ghost' | 'outline' | 'danger'; size?: 'sm' | 'md' }) {
  const variants = {
    primary: 'bg-brand-600 text-white hover:bg-brand-700',
    ghost: 'hover:bg-slate-500/10 text-muted',
    outline: 'border border-base hover:bg-slate-500/5',
    danger: 'bg-red-600 text-white hover:bg-red-700',
  };
  const sizes = { sm: 'h-8 px-3 text-xs', md: 'h-10 px-4 text-sm' };
  return (
    <button className={cn('inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-colors', variants[variant], sizes[size], className)} {...props}>
      {children}
    </button>
  );
}

export function StatusPill({ status }: { status: string }) {
  const map: Record<string, BadgeTone> = {
    PENDING: 'warning', ACCEPTED: 'info', ON_THE_WAY: 'info', WORKING: 'brand',
    COMPLETED: 'success', CANCELLED: 'danger',
    active: 'success', suspended: 'danger', pending: 'warning',
    open: 'warning', reviewing: 'info', resolved: 'success',
    approved: 'success', rejected: 'danger',
  };
  return <Badge tone={map[status] ?? 'neutral'}>{status.replace(/_/g, ' ').toLowerCase()}</Badge>;
}
