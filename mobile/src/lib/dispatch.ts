// Mirror of firebase/functions/src/config.js — the dispatch policy. When the
// Cloud Functions run they own dispatch; without them (Spark plan) the app
// applies the same policy itself so artisans only see matching nearby work.
import { distanceKm } from './geo';
import { isWithinAvailability } from './availability';
import type { AppUser, Availability, ServiceRequest } from '@/types';

export const INITIAL_RADIUS_KM = 2;
export const STEP_KM = 2;
export const STEP_MS = 2 * 60_000;
export const TIMEOUT_MS = 30 * 60_000;
export const MAX_RADIUS_KM = 12;
/**
 * Featured artisans ("حرفي مميز", FEATURED_MIN_JOBS completed jobs or the
 * number set in the dashboard) are reached FEATURED_BONUS_KM further out,
 * i.e. one step before the others, and their offers are listed first.
 */
export const FEATURED_MIN_JOBS = 10;
export const FEATURED_BONUS_KM = STEP_KM;
/**
 * Only admin-verified artisans receive requests (approve them from the admin
 * dashboard → Artisans). EXPO_PUBLIC_REQUIRE_VERIFIED=false turns this off.
 */
export const REQUIRE_VERIFIED = process.env.EXPO_PUBLIC_REQUIRE_VERIFIED !== 'false';

export function targetRadiusKm(elapsedMs: number): number {
  const steps = Math.max(0, Math.floor(elapsedMs / STEP_MS));
  return Math.min(INITIAL_RADIUS_KM + steps * STEP_KM, MAX_RADIUS_KM);
}

/**
 * A request still PENDING whose 30-minute window has run out — with no offers,
 * or with offers the customer didn't accept. The Cloud Functions cancel it;
 * until they do, nobody should act on it.
 */
export function isExpired(r: ServiceRequest, now = Date.now()): boolean {
  return r.status === 'PENDING' && now - (r.dispatch?.startedAt ?? r.createdAt) >= TIMEOUT_MS;
}

/**
 * Whether an artisan should see a PENDING request. Nothing reaches them
 * outside their working days and hours. Dispatched requests (Cloud Functions)
 * go to the artisans recorded on them; otherwise the same rules are applied
 * here: verified artisan, same category, within the radius the search has
 * reached, and not past the response window.
 */
export function isVisibleToArtisan(
  r: ServiceRequest,
  me: AppUser,
  categoryIds: string[],
  now = Date.now(),
  availability?: Availability,
  featured = false,
): boolean {
  if (!isWithinAvailability(availability, new Date(now))) return false;
  if (isExpired(r, now)) return false;
  if (r.dispatch) return (r.notifiedArtisanIds ?? []).includes(me.uid);
  if ((REQUIRE_VERIFIED && !me.verified) || !categoryIds.includes(r.categoryId)) return false;
  if (!me.location || !r.location) return false;
  return distanceKm(me.location, r.location) <= targetRadiusKm(now - r.createdAt) + (featured ? FEATURED_BONUS_KM : 0);
}

/** Offers as the customer sees them: featured artisans first, then the newest. */
export function sortOffers<T extends { createdAt: number; artisanFeatured?: boolean }>(offers: T[]): T[] {
  return [...offers].sort((a, b) => Number(!!b.artisanFeatured) - Number(!!a.artisanFeatured) || b.createdAt - a.createdAt);
}
