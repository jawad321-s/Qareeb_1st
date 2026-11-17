// Dispatch policy for new requests. A request is offered to verified artisans
// of its category within INITIAL_RADIUS_KM; while nobody has sent an offer the
// radius grows by STEP_KM every STEP_MS. TIMEOUT_MS after it went out, a
// request still PENDING (no offers, or none accepted) is cancelled and the
// customer is told.
export const INITIAL_RADIUS_KM = 2;
export const STEP_KM = 2;
export const STEP_MS = 2 * 60_000;
export const TIMEOUT_MS = 30 * 60_000;
export const MAX_RADIUS_KM = 12;
// Only admin-verified artisans receive requests (approved from the admin
// dashboard → Artisans). Keep in sync with EXPO_PUBLIC_REQUIRE_VERIFIED.
export const REQUIRE_VERIFIED = process.env.REQUIRE_VERIFIED !== 'false';

// Featured artisans ("حرفي مميز"): an artisan with at least FEATURED_MIN_JOBS
// completed jobs AND an average rating above FEATURED_MIN_RATING gets the
// badge and is reached FEATURED_BONUS_KM further out at every step of the
// search, i.e. one step (STEP_MS) before the others. The admin can change both
// numbers in the dashboard (settings/platform.featuredMinJobs / featuredMinRating).
export const FEATURED_MIN_JOBS = 10;
export const FEATURED_MIN_RATING = 4;
export const FEATURED_BONUS_KM = STEP_KM;

// Artisans' working hours (artisanProfiles.availability) are read in this zone.
export const TIME_ZONE = 'Asia/Hebron';

// Must match the Firestore database location (Firebase console →
// Firestore → the location shown at the top).
export const REGION = 'europe-west1';

/** Radius the search should have reached `elapsedMs` after dispatch began. */
export function targetRadiusKm(elapsedMs) {
  const steps = Math.max(0, Math.floor(elapsedMs / STEP_MS));
  return Math.min(INITIAL_RADIUS_KM + steps * STEP_KM, MAX_RADIUS_KM);
}
