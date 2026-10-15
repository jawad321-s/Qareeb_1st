// The artisan's income is what customers paid for finished work: the price of
// the accepted offer on every COMPLETED job. Pending, in-progress, cancelled
// and turned-down jobs never count.
import type { JobRecord } from '@/types';

const monthKey = (ms: number) => {
  const d = new Date(ms);
  return d.getFullYear() * 12 + d.getMonth();
};

const MONTHS = {
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  ar: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'],
};

export interface IncomeSummary {
  /** Sum of every completed job's price (minor units). */
  total: number;
  /** Completed this calendar month / last month (minor units). */
  thisMonth: number;
  lastMonth: number;
  /** % change of this month over last month; undefined when last month had no income. */
  change?: number;
  /** Average price of a completed job whose price is known (minor units). */
  average: number;
  /** Income per month for the last `months` months, oldest first. */
  monthly: { label: string; value: number }[];
}

export function incomeSummary(completed: JobRecord[], locale: 'en' | 'ar', months = 6, now = Date.now()): IncomeSummary {
  const current = monthKey(now);
  const monthly = Array.from({ length: months }, (_, i) => {
    const k = current - (months - 1) + i;
    return { key: k, label: MONTHS[locale][((k % 12) + 12) % 12], value: 0 };
  });
  const byKey = new Map(monthly.map((m) => [m.key, m]));

  let total = 0;
  let priced = 0;
  for (const job of completed) {
    if (job.kind !== 'completed') continue;
    const price = Number(job.price) || 0;
    total += price;
    if (price > 0) priced += 1;
    const row = byKey.get(monthKey(job.date));
    if (row) row.value += price;
  }

  const thisMonth = byKey.get(current)?.value ?? 0;
  const lastMonth = byKey.get(current - 1)?.value ?? 0;
  return {
    total,
    thisMonth,
    lastMonth,
    change: lastMonth > 0 ? Math.round(((thisMonth - lastMonth) / lastMonth) * 100) : undefined,
    average: priced ? Math.round(total / priced) : 0,
    monthly: monthly.map(({ label, value }) => ({ label, value })),
  };
}
