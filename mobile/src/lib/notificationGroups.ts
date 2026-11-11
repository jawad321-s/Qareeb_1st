export type DayGroup = 'today' | 'yesterday' | 'week' | 'older';

const DAY_MS = 24 * 3600_000;

/** Which heading a notification goes under, by the phone's local calendar. */
export function dayGroup(ts: number, now = Date.now()): DayGroup {
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const today = startOfToday.getTime();
  if (ts >= today) return 'today';
  if (ts >= today - DAY_MS) return 'yesterday';
  if (ts >= today - 6 * DAY_MS) return 'week';
  return 'older';
}

/** Items (newest first) split under day headings, empty headings left out. */
export function groupByDay<T extends { ts: number }>(items: T[], now = Date.now()): { group: DayGroup; items: T[] }[] {
  const order: DayGroup[] = ['today', 'yesterday', 'week', 'older'];
  const by = new Map<DayGroup, T[]>();
  for (const item of items) {
    const g = dayGroup(item.ts, now);
    by.set(g, [...(by.get(g) ?? []), item]);
  }
  return order.filter((g) => by.has(g)).map((group) => ({ group, items: by.get(group)! }));
}
