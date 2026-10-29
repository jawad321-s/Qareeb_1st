// The artisan's working days and hours (artisanProfiles/{uid}.availability):
// requests reach them only inside this window, read in Palestine's time zone.
// Same logic as mobile/src/lib/availability.ts.
import { TIME_ZONE } from './config.js';

const DAYS = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

const toMinutes = (hhmm = '') => {
  const [h, m] = String(hhmm).split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
};

/** Day of the week (0 = Sunday) and minutes since midnight at `ms` in `timeZone`. */
export function localClock(ms, timeZone = TIME_ZONE) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', { timeZone, weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
      .formatToParts(new Date(ms))
      .map((p) => [p.type, p.value]),
  );
  return { day: DAYS[parts.weekday], minutes: Number(parts.hour) * 60 + Number(parts.minute) };
}

/**
 * Whether `ms` falls in the working window. `to` is exclusive; a window like
 * 20:00–02:00 runs past midnight and its early hours belong to the day it
 * started. No schedule saved means always.
 */
export function isWithinAvailability(av, ms = Date.now(), timeZone = TIME_ZONE) {
  if (!av?.days?.length || !av.from || !av.to) return true;
  const { day, minutes } = localClock(ms, timeZone);
  const from = toMinutes(av.from);
  const to = toMinutes(av.to);
  if (from === to) return av.days.includes(day);
  if (from < to) return av.days.includes(day) && minutes >= from && minutes < to;
  return (av.days.includes(day) && minutes >= from) || (av.days.includes((day + 6) % 7) && minutes < to);
}
