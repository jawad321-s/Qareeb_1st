import { config } from './config';

/** Format a minor-unit integer amount into a currency string. */
export function formatMoney(minor: number, currency = config.currency): string {
  const major = minor / config.currencyMinorPerMajor;
  return `${major.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })} ${currency}`;
}

/** Compact relative time ("2h ago" / "منذ ٢ س"), localized to the active UI language. */
export function timeAgo(ts: number): string {
  // Read the locale lazily to avoid a circular import at module load.
  const { useLocaleStore } = require('@/i18n') as typeof import('@/i18n');
  const ar = useLocaleStore.getState().locale === 'ar';
  const diff = Date.now() - ts;
  const s = Math.floor(diff / 1000);
  if (s < 60) return ar ? 'الآن' : 'just now';
  const m = Math.floor(s / 60);
  if (m < 60) return ar ? `منذ ${m} د` : `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return ar ? `منذ ${h} س` : `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return ar ? `منذ ${d} يوم` : `${d}d ago`;
  return new Date(ts).toLocaleDateString(ar ? 'ar' : 'en');
}

export function formatDistance(km: number): string {
  const { useLocaleStore } = require('@/i18n') as typeof import('@/i18n');
  const ar = useLocaleStore.getState().locale === 'ar';
  if (km < 1) return `${Math.round(km * 1000)} ${ar ? 'م' : 'm'}`;
  return `${km.toFixed(1)} ${ar ? 'كم' : 'km'}`;
}

export function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');
}
