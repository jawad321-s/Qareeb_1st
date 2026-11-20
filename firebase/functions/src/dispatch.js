// Request dispatch: offer a PENDING request to the nearest verified artisans
// of its category, widen the circle while nobody responds, and cancel it when
// the response window runs out. Pure Firestore logic so it can be tested
// against the emulator without the Functions runtime.
import { FieldValue } from 'firebase-admin/firestore';
import { FEATURED_BONUS_KM, INITIAL_RADIUS_KM, MAX_OPEN_REQUESTS, OPEN_STATUSES, REQUIRE_VERIFIED, TIMEOUT_MS, targetRadiusKm } from './config.js';
import { distanceKm, normalizePhone } from './geo.js';
import { isWithinAvailability } from './availability.js';
import { notifyUsers } from './notify.js';

/**
 * Verified, active artisans of `categoryId` within `radiusKm` of `origin` who
 * are available (the dashboard switch is on) and inside their working days and
 * hours at `now`, excluding `excludeIds` and the customer's own artisan account
 * (same phone). Featured artisans are reached FEATURED_BONUS_KM further, so
 * each widening of the search gets to them one step before the others.
 * Returns [{ uid, distanceKm, featured }], featured first, then nearest first.
 */
export async function findArtisans(db, { categoryId, origin, radiusKm, excludeIds = [], customerPhone, requireVerified = REQUIRE_VERIFIED, now = Date.now() }) {
  const profiles = await db.collection('artisanProfiles').where('categoryIds', 'array-contains', categoryId).get();
  const open = profiles.docs.filter(
    (d) => d.get('available') !== false && isWithinAvailability(d.get('availability'), now) && !excludeIds.includes(d.id),
  );
  const featured = new Set(open.filter((d) => d.get('featured') === true).map((d) => d.id));
  const ids = open.map((d) => d.id);
  if (ids.length === 0) return [];
  const users = await db.getAll(...ids.map((id) => db.collection('users').doc(id)));
  const ownPhone = normalizePhone(customerPhone);
  return users
    .filter((u) => u.exists)
    .map((u) => ({ uid: u.id, ...u.data() }))
    .filter((u) => u.role === 'artisan' && (!requireVerified || u.verified === true) && !['suspended', 'deleted'].includes(u.status) && u.location)
    .filter((u) => !ownPhone || normalizePhone(u.phone) !== ownPhone)
    .map((u) => ({ uid: u.uid, distanceKm: distanceKm(origin, u.location), featured: featured.has(u.uid) }))
    .filter((u) => u.distanceKm <= radiusKm + (u.featured ? FEATURED_BONUS_KM : 0))
    .sort((a, b) => Number(b.featured) - Number(a.featured) || a.distanceKm - b.distanceKm);
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

/** The open-request limit (dashboard setting, else MAX_OPEN_REQUESTS). */
export async function maxOpenRequests(db) {
  const v = (await db.collection('settings').doc('platform').get()).get('maxOpenRequests');
  return Number.isInteger(v) && v > 0 ? v : MAX_OPEN_REQUESTS;
}

/** First wave, run when the request is created. */
export async function startDispatch(db, requestId, request, now = Date.now()) {
  if (request.status !== 'PENDING' || request.dispatch) return;
  const ref = db.collection('requests').doc(requestId);
  // The app stops a customer at the limit; this catches the rest (two posts at
  // once, an old app) before a single artisan is notified.
  const open = await db.collection('requests').where('customerId', '==', request.customerId).where('status', 'in', OPEN_STATUSES).count().get();
  if (open.data().count > (await maxOpenRequests(db))) {
    await ref.update({ status: 'CANCELLED', cancelReason: 'TOO_MANY_OPEN', cancelledAt: now, updatedAt: now });
    return;
  }
  const found = request.location
    ? await findArtisans(db, {
        categoryId: request.categoryId,
        origin: request.location,
        radiusKm: INITIAL_RADIUS_KM,
        customerPhone: await customerPhoneOf(db, request.customerId),
        now,
      })
    : [];
  await ref.update({
    dispatch: { radiusKm: INITIAL_RADIUS_KM, startedAt: now, expiresAt: now + TIMEOUT_MS },
    notifiedArtisanIds: found.map((f) => f.uid),
  });
  await notifyNewJob(db, requestId, request, found);
}

/**
 * Runs every minute: widen the search for dispatched requests nobody has
 * answered yet, and close every request still PENDING 30 minutes after it
 * went out — with no offers (NO_OFFERS), or with offers the customer did not
 * accept in time (EXPIRED, its open offers closed). The customer (and the
 * artisans who offered) are told by the status-change trigger.
 */
export async function runDispatchTick(db, now = Date.now()) {
  const pending = await db.collection('requests').where('status', '==', 'PENDING').get();
  const result = { expanded: 0, cancelled: 0 };
  for (const doc of pending.docs) {
    const r = doc.data();
    // Requests made before dispatch existed count from their creation.
    const startedAt = r.dispatch?.startedAt ?? toMillis(r.createdAt);
    const elapsed = now - startedAt;

    if (startedAt && elapsed >= TIMEOUT_MS) {
      const reason = await db.runTransaction(async (tx) => {
        const fresh = await tx.get(doc.ref);
        if (fresh.get('status') !== 'PENDING') return null;
        const why = (fresh.get('offerCount') ?? 0) > 0 ? 'EXPIRED' : 'NO_OFFERS';
        tx.update(doc.ref, { status: 'CANCELLED', cancelReason: why, cancelledAt: now, updatedAt: now });
        return why;
      });
      if (reason) {
        result.cancelled++;
        if (reason === 'EXPIRED') await closeOpenOffers(db, doc.id);
      }
      continue;
    }

    // Widen only dispatched requests that have no offer yet.
    if (!r.dispatch || (r.offerCount ?? 0) > 0) continue;
    const radiusKm = targetRadiusKm(elapsed);
    if (radiusKm <= r.dispatch.radiusKm || !r.location) continue;
    const already = r.notifiedArtisanIds ?? [];
    const found = await findArtisans(db, {
      categoryId: r.categoryId,
      origin: r.location,
      radiusKm,
      excludeIds: already,
      customerPhone: await customerPhoneOf(db, r.customerId),
      now,
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

/**
 * Offers an artisan the requests still open in `categoryIds` that they can
 * take now: within the radius each request's search has reached, inside its
 * 30-minute window, and passing every check of findArtisans (verified,
 * available, working hours, not the customer's own account). Used when an
 * artisan adds a service. Returns the request ids offered.
 */
export async function offerOpenRequests(db, artisanUid, categoryIds, now = Date.now()) {
  const offered = [];
  for (const categoryId of categoryIds) {
    const open = await db.collection('requests').where('status', '==', 'PENDING').where('categoryId', '==', categoryId).get();
    for (const doc of open.docs) {
      const r = doc.data();
      if (!r.dispatch || !r.location || now - r.dispatch.startedAt >= TIMEOUT_MS) continue;
      if ((r.notifiedArtisanIds ?? []).includes(artisanUid)) continue;
      const reachable = await findArtisans(db, {
        categoryId,
        origin: r.location,
        radiusKm: r.dispatch.radiusKm,
        customerPhone: await customerPhoneOf(db, r.customerId),
        now,
      });
      const me = reachable.find((a) => a.uid === artisanUid);
      if (!me) continue;
      await doc.ref.update({ notifiedArtisanIds: FieldValue.arrayUnion(artisanUid) });
      await notifyNewJob(db, doc.id, r, [me]);
      offered.push(doc.id);
    }
  }
  return offered;
}

/** Offers still waiting on a request that expired are closed with it. */
async function closeOpenOffers(db, requestId) {
  const open = await db.collection('offers').where('requestId', '==', requestId).where('status', '==', 'PENDING').get();
  if (open.empty) return;
  const batch = db.batch();
  open.docs.forEach((d) => batch.update(d.ref, { status: 'REJECTED', closedReason: 'EXPIRED' }));
  await batch.commit();
}

/** A Firestore timestamp or a number of milliseconds, as milliseconds (0 if neither). */
function toMillis(v) {
  if (typeof v === 'number') return v;
  return typeof v?.toMillis === 'function' ? v.toMillis() : 0;
}
