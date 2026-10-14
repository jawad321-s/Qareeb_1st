// Mirror of firebase/functions/src/config.js — the dispatch policy. When the
// Cloud Functions run they own dispatch; without them (Spark plan) the app
// applies the same policy itself so artisans only see matching nearby work.
import { distanceKm } from './geo';
import type { AppUser, ServiceRequest } from '@/types';

export const INITIAL_RADIUS_KM = 2;
export const STEP_KM = 2;
export const STEP_MS = 5 * 60_000;
export const TIMEOUT_MS = 30 * 60_000;
export const MAX_RADIUS_KM = 12;
/**
 * Only admin-verified artisans receive requests (approve them from the admin
 * dashboard → Artisans). EXPO_PUBLIC_REQUIRE_VERIFIED=false turns this off.
 */
export const REQUIRE_VERIFIED = process.env.EXPO_PUBLIC_REQUIRE_VERIFIED !== 'false';

export function targetRadiusKm(elapsedMs: number): number {
  const steps = Math.max(0, Math.floor(elapsedMs / STEP_MS));
  return Math.min(INITIAL_RADIUS_KM + steps * STEP_KM, MAX_RADIUS_KM);
}

/** A request with no offers whose response window has run out. */
export function isExpiredWithoutOffers(r: ServiceRequest, now = Date.now()): boolean {
  return r.status === 'PENDING' && (r.offerCount ?? 0) === 0 && now - r.createdAt >= TIMEOUT_MS;
}

/**
 * Whether an artisan should see a PENDING request. Dispatched requests (Cloud
 * Functions) go to the artisans recorded on them; otherwise the same rules
 * are applied here: verified artisan, same category, within the radius the
 * search has reached, and not past the response window.
 */
export function isVisibleToArtisan(r: ServiceRequest, me: AppUser, categoryIds: string[], now = Date.now()): boolean {
  if (r.dispatch) return (r.notifiedArtisanIds ?? []).includes(me.uid);
  if ((REQUIRE_VERIFIED && !me.verified) || !categoryIds.includes(r.categoryId)) return false;
  if (isExpiredWithoutOffers(r, now)) return false;
  if (!me.location || !r.location) return false;
  return distanceKm(me.location, r.location) <= targetRadiusKm(now - r.createdAt);
}
