import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatMoney(minor: number, currency = '₪') {
  return `${(minor / 100).toLocaleString(undefined, { maximumFractionDigits: 0 })} ${currency}`;
}

/** A price as the app shows it: "129 ₪", "59.5 ₪" (agorot kept, not rounded away). */
export function formatPrice(minor: number, currency = '₪') {
  return `${(minor / 100).toLocaleString(undefined, { maximumFractionDigits: 2 })} ${currency}`;
}

export function formatNumber(n: number) {
  return n.toLocaleString();
}

export function timeAgo(ts: number, locale: 'ar' | 'en' = 'ar') {
  const s = Math.floor((Date.now() - ts) / 1000);
  const ar = locale === 'ar';
  if (s < 60) return ar ? 'الآن' : 'just now';
  const m = Math.floor(s / 60);
  if (m < 60) return ar ? `منذ ${m} د` : `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return ar ? `منذ ${h} س` : `${h}h ago`;
  const d = Math.floor(h / 24);
  return ar ? `منذ ${d} يوم` : `${d}d ago`;
}

/** "12 Dec 2026" / "12 كانون الأول 2026" (Levantine month names, Western digits like the rest of the dashboard). */
export function formatDay(ts: number, locale: 'ar' | 'en' = 'ar') {
  return new Date(ts).toLocaleDateString(locale === 'ar' ? 'ar-PS-u-nu-latn' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}
