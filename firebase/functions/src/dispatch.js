// Request dispatch: offer a PENDING request to the nearest verified artisans
// of its category, widen the circle while nobody responds, and cancel it when
// the response window runs out. Pure Firestore logic so it can be tested
// against the emulator without the Functions runtime.
import { FieldValue } from 'firebase-admin/firestore';
import { INITIAL_RADIUS_KM, REQUIRE_VERIFIED, TIMEOUT_MS, targetRadiusKm } from './config.js';
import { distanceKm, normalizePhone } from './geo.js';
import { notifyUsers } from './notify.js';

/**
 * Verified, active artisans of `categoryId` within `radiusKm` of `origin`,
 * excluding `excludeIds` and the customer's own artisan account (same phone).
 * Returns [{ uid, distanceKm }] nearest first.
 */
export async function findArtisans(db, { categoryId, origin, radiusKm, excludeIds = [], customerPhone, requireVerified = REQUIRE_VERIFIED }) {
  const profiles = await db.collection('artisanProfiles').where('categoryIds', 'array-contains', categoryId).get();
  const ids = profiles.docs.map((d) => d.id).filter((id) => !excludeIds.includes(id));
  if (ids.length === 0) return [];
  const users = await db.getAll(...ids.map((id) => db.collection('users').doc(id)));
  const ownPhone = normalizePhone(customerPhone);
  return users
    .filter((u) => u.exists)
    .map((u) => ({ uid: u.id, ...u.data() }))
    .filter((u) => u.role === 'artisan' && (!requireVerified || u.verified === true) && u.status !== 'suspended' && u.location)
    .filter((u) => !ownPhone || normalizePhone(u.phone) !== ownPhone)
    .map((u) => ({ uid: u.uid, distanceKm: distanceKm(origin, u.location) }))
    .filter((u) => u.distanceKm <= radiusKm)
    .sort((a, b) => a.distanceKm - b.distanceKm);
}

async function customerPhoneOf(db, customerId) {
  const snap = await db.collection('users').doc(customerId).get();
  return snap.get('phone');
}

async function notifyNewJob(db, requestId, request, found) {
  const byUid = Object.fromEntries(found.map((f) => [f.uid, f.distanceKm]));
  await notifyUsers(
    db,
    found.map((f) => f.uid),
    'newJob',
    (uid) => ({ title: request.title, distanceKm: byUid[uid] }),
    { route: `/(artisan)/job/${requestId}`, requestId },
  );
}

/** First wave, run when the request is created. */
export async function startDispatch(db, requestId, request, now = Date.now()) {
  if (request.status !== 'PENDING' || request.dispatch) return;
  const ref = db.collection('requests').doc(requestId);
  const found = request.location
    ? await findArtisans(db, {
        categoryId: request.categoryId,
        origin: request.location,
        radiusKm: INITIAL_RADIUS_KM,
        customerPhone: await customerPhoneOf(db, request.customerId),
      })
    : [];
  await ref.update({
    dispatch: { radiusKm: INITIAL_RADIUS_KM, startedAt: now, expiresAt: now + TIMEOUT_MS },
    notifiedArtisanIds: found.map((f) => f.uid),
  });
  await notifyNewJob(db, requestId, request, found);
}

/**
 * Periodic pass over PENDING requests: widen the radius of requests nobody has
 * answered yet and cancel the ones whose window ran out with no offers.
 * Once a request has an offer, it is left alone for the customer to decide.
 */
export async function runDispatchTick(db, now = Date.now()) {
  const pending = await db.collection('requests').where('status', '==', 'PENDING').get();
  const result = { expanded: 0, cancelled: 0 };
  for (const doc of pending.docs) {
    const r = doc.data();
    if (!r.dispatch || (r.offerCount ?? 0) > 0) continue;
    const elapsed = now - r.dispatch.startedAt;

    if (elapsed >= TIMEOUT_MS) {
      const cancelled = await db.runTransaction(async (tx) => {
        const fresh = await tx.get(doc.ref);
        if (fresh.get('status') !== 'PENDING' || (fresh.get('offerCount') ?? 0) > 0) return false;
        tx.update(doc.ref, { status: 'CANCELLED', cancelReason: 'NO_OFFERS', cancelledAt: now, updatedAt: now });
        return true;
      });
      if (cancelled) result.cancelled++;
      continue; // the customer is notified by the status-change trigger
    }

    const radiusKm = targetRadiusKm(elapsed);
    if (radiusKm <= r.dispatch.radiusKm || !r.location) continue;
    const already = r.notifiedArtisanIds ?? [];
    const found = await findArtisans(db, {
      categoryId: r.categoryId,
      origin: r.location,
      radiusKm,
      excludeIds: already,
      customerPhone: await customerPhoneOf(db, r.customerId),
    });
    await doc.ref.update({
      'dispatch.radiusKm': radiusKm,
      ...(found.length ? { notifiedArtisanIds: FieldValue.arrayUnion(...found.map((f) => f.uid)) } : {}),
    });
    await notifyNewJob(db, doc.id, r, found);
    result.expanded++;
  }
  return result;
}
