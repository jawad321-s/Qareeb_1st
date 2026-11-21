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

/** Full date ("12 أيلول 2026" / "September 12, 2026") in the active UI language. */
export function formatDate(ts: number): string {
  const { useLocaleStore } = require('@/i18n') as typeof import('@/i18n');
  const ar = useLocaleStore.getState().locale === 'ar';
  return new Date(ts).toLocaleDateString(ar ? 'ar' : 'en', { year: 'numeric', month: 'long', day: 'numeric' });
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

/**
 * An arrival time in minutes, in words: "45 دقيقة", "1 ساعة و15 دقيقة" /
 * "45 min", "1 h 15 min" (`short`: "1 س 15 د" / "1h 15m").
 */
export function formatEta(minutes: number, short = false): string {
  const { useLocaleStore } = require('@/i18n') as typeof import('@/i18n');
  const ar = useLocaleStore.getState().locale === 'ar';
  const total = Math.max(0, Math.round(minutes));
  const h = Math.floor(total / 60);
  const m = total % 60;
  // Short, for a narrow field: "1 س 15 د" / "1h 15m".
  if (short && h && m) return ar ? `${h} س ${m} د` : `${h}h ${m}m`;
  const hours = ar ? `${h} ساعة` : `${h} h`;
  const mins = ar ? `${m} دقيقة` : `${m} min`;
  if (!h) return mins;
  if (!m) return hours;
  return ar ? `${hours} و${mins}` : `${hours} ${mins}`;
}
