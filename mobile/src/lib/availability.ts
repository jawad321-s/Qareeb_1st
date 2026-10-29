// The artisan's working days and hours (artisanProfiles/{uid}.availability):
// requests reach them only inside this window. Same logic as
// firebase/functions/src/availability.js, which uses Palestine's time zone;
// here the phone's own clock is used (the artisan's local time).
import type { Availability } from '@/types';

const toMinutes = (hhmm = '') => {
  const [h, m] = hhmm.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
};

/**
 * Whether `when` falls in the working window. `to` is exclusive (08:00–20:00
 * ends at 20:00); a window like 20:00–02:00 runs past midnight and its early
 * hours belong to the day it started. No schedule saved means always.
 */
export function isWithinAvailability(av: Availability | undefined, when: Date = new Date()): boolean {
  if (!av?.days?.length || !av.from || !av.to) return true;
  const day = when.getDay();
  const minutes = when.getHours() * 60 + when.getMinutes();
  const from = toMinutes(av.from);
  const to = toMinutes(av.to);
  if (from === to) return av.days.includes(day);
  if (from < to) return av.days.includes(day) && minutes >= from && minutes < to;
  return (av.days.includes(day) && minutes >= from) || (av.days.includes((day + 6) % 7) && minutes < to);
}
