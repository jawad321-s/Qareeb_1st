import type { Service } from '@/types';
import { CATEGORIES } from './categories';

/**
 * The service catalog: one general service per category (e.g. "Plumbing"),
 * whose id is the category id. Built from CATEGORIES so the app is its own
 * source of truth — older data in Firestore (split repair/installation
 * services, the removed "Maintenance" category) can't leak into the app.
 */
export const SERVICES: Service[] = CATEGORIES.map((cat) => ({
  id: cat.id,
  categoryId: cat.id,
  name: { ar: cat.name.ar, en: cat.name.en },
  description: { ar: `كل أعمال ${cat.name.ar}`, en: `All ${cat.name.en.toLowerCase()} work` },
  icon: cat.icon,
  basePriceFrom: 8000 + cat.order * 1000,
  active: true,
  popular: cat.order <= 6,
}));

/** Maps an old split service id ("plumbing_repair", "plumbing_install") to
 *  today's general one ("plumbing"); current ids pass through unchanged. */
export const toServiceId = (id: string) => id.replace(/_(repair|install)$/, '');
