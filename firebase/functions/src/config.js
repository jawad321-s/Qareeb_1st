// Dispatch policy for new requests. A request is offered to verified artisans
// of its category within INITIAL_RADIUS_KM; while nobody has sent an offer the
// radius grows by STEP_KM every STEP_MS, and after TIMEOUT_MS with no offers
// the request is cancelled and the customer is told.
export const INITIAL_RADIUS_KM = 2;
export const STEP_KM = 2;
export const STEP_MS = 5 * 60_000;
export const TIMEOUT_MS = 30 * 60_000;
export const MAX_RADIUS_KM = 12;

// Must match the Firestore database location (Firebase console →
// Firestore → the location shown at the top).
export const REGION = 'europe-west1';

/** Radius the search should have reached `elapsedMs` after dispatch began. */
export function targetRadiusKm(elapsedMs) {
  const steps = Math.max(0, Math.floor(elapsedMs / STEP_MS));
  return Math.min(INITIAL_RADIUS_KM + steps * STEP_KM, MAX_RADIUS_KM);
}
