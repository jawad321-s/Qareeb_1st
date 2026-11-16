'use client';

// UI primitives, now backed by HeroUI v3. The exported API is unchanged so
// every page keeps working exactly as before — only the rendering layer moved
// to HeroUI components (React Aria accessibility + Tailwind v4 styling).
import {
  Button as HeroButton,
  Card as HeroCard,
  Chip as HeroChip,
  Input as HeroInput,
} from '@heroui/react';
import { cn } from '@/lib/utils';
import { useT, type TKey } from '@/lib/i18n';

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return <HeroCard className={cn('card-shadow', className)}>{children}</HeroCard>;
}

type BadgeTone = 'neutral' | 'brand' | 'success' | 'warning' | 'danger' | 'info';
const TONE_TO_COLOR: Record<BadgeTone, 'default' | 'accent' | 'success' | 'warning' | 'danger'> = {
  neutral: 'default',
  brand: 'accent',
  success: 'success',
  warning: 'warning',
  danger: 'danger',
  info: 'accent',
};

export function Badge({ tone = 'neutral', children }: { tone?: BadgeTone; children: React.ReactNode }) {
  return (
    <HeroChip color={TONE_TO_COLOR[tone]} variant="soft" size="sm">
      <HeroChip.Label>{children}</HeroChip.Label>
    </HeroChip>
  );
}

interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'ghost' | 'outline' | 'danger';
  size?: 'sm' | 'md';
  className?: string;
  disabled?: boolean;
  title?: string;
  type?: 'button' | 'submit';
  onClick?: () => void;
}

export function Button({ children, variant = 'primary', size = 'md', className, disabled, title, type, onClick }: ButtonProps) {
  return (
    <HeroButton
      variant={variant}
      size={size}
      isDisabled={disabled}
      className={className}
      aria-label={title}
      type={type}
      onPress={onClick ? () => onClick() : undefined}
    >
      {children}
    </HeroButton>
  );
}

/** HeroUI text input with the app's sizing defaults; standard <input> props. */
export function Input({ className, ...props }: React.ComponentProps<typeof HeroInput>) {
  return <HeroInput fullWidth className={className} {...props} />;
}

export function StatusPill({ status }: { status: string }) {
  const { t } = useT();
  const map: Record<string, BadgeTone> = {
    PENDING: 'warning', ACCEPTED: 'info', ON_THE_WAY: 'info', WORKING: 'brand',
    COMPLETED: 'success', CANCELLED: 'danger',
    active: 'success', suspended: 'danger', pending: 'warning',
    open: 'warning', reviewing: 'info', resolved: 'success', dismissed: 'neutral',
    new: 'warning', reviewed: 'info', added: 'success', declined: 'neutral',
    approved: 'success', rejected: 'danger',
  };
  return <Badge tone={map[status] ?? 'neutral'}>{t(`status.${status}` as TKey)}</Badge>;
}

/** A row of filter tabs with counts (complaints, suggestions). */
export function FilterTabs<K extends string>({
  tabs,
  value,
  onChange,
}: {
  tabs: { key: K; label: string; count?: number }[];
  value: K;
  onChange: (key: K) => void;
}) {
  return (
    <div role="tablist" className="flex flex-wrap gap-2">
      {tabs.map((tab) => {
        const active = tab.key === value;
        return (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.key)}
            className={cn(
              'inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors',
              active ? 'border-brand-600 bg-brand-600 text-white' : 'border-base text-muted hover:bg-slate-500/10',
            )}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className={cn('rounded-full px-1.5 text-xs', active ? 'bg-white/20' : 'bg-slate-500/10')}>{tab.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
