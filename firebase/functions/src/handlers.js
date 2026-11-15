// Who hears about a cancelled request or a turned-down offer, and what they
// are told. Called by the Firestore triggers in index.js; plain functions so
// the tests can run them directly.
import { notifyUsers } from './notify.js';

const nameOf = async (db, uid) => (uid ? (await db.collection('users').doc(uid).get()).get('fullName') ?? '' : '');

/** A request just became CANCELLED (`after` is the request document). */
export async function notifyRequestCancelled(db, id, after) {
  const customerRoute = { route: `/(shared)/request/${id}`, requestId: id };
  const artisanRoute = { route: `/(artisan)/job/${id}`, requestId: id };
  if (after.cancelReason === 'NO_OFFERS') {
    return notifyUsers(db, [after.customerId], 'noOffers', { title: after.title }, customerRoute);
  }
  if (after.cancelReason === 'EXPIRED') {
    // Offers came in but none was accepted within the window.
    await notifyUsers(db, [after.customerId], 'requestExpired', { title: after.title }, customerRoute);
    const offers = await db.collection('offers').where('requestId', '==', id).get();
    return notifyUsers(db, offers.docs.map((d) => d.get('artisanId')), 'offerExpired', { title: after.title }, artisanRoute);
  }
  const reason = { choice: after.cancelChoice ?? '', note: after.cancelNote ?? '' };
  if (!after.acceptedArtisanId) {
    // Cancelled by the customer before accepting: tell the artisans who offered.
    const offers = await db.collection('offers').where('requestId', '==', id).get();
    return notifyUsers(db, offers.docs.map((d) => d.get('artisanId')), 'requestCancelledPending', { title: after.title, ...reason }, artisanRoute);
  }
  // Tell the party who did not cancel, with the reason given.
  const byCustomer = after.cancelledBy !== after.acceptedArtisanId;
  const other = byCustomer ? after.acceptedArtisanId : after.customerId;
  const byName = await nameOf(db, byCustomer ? after.customerId : after.acceptedArtisanId);
  return notifyUsers(db, [other], 'cancelledByOther', { byName, title: after.title, ...reason }, byCustomer ? artisanRoute : customerRoute);
}

/**
 * An offer turned down: the artisan hears whether the customer declined it
 * (with the reason given) or accepted another offer. Offers closed because
 * the whole request was cancelled or expired are covered above.
 */
export async function notifyOfferClosed(db, offerId, before, after) {
  if (before?.status !== 'PENDING' || after?.status !== 'REJECTED') return;
  if (['EXPIRED', 'REQUEST_CANCELLED'].includes(after.closedReason) || after.requestStatus === 'CANCELLED') return;
  const req = (await db.collection('requests').doc(after.requestId).get()).data() ?? {};
  const title = req.title ?? after.requestTitle ?? '';
  const route = { route: `/(artisan)/job/${after.requestId}`, requestId: after.requestId };
  const otherChosen = after.closedReason === 'OTHER_ACCEPTED' || (!!req.acceptedOfferId && req.acceptedOfferId !== offerId);
  if (otherChosen) return notifyUsers(db, [after.artisanId], 'offerNotChosen', { title }, route);
  return notifyUsers(db, [after.artisanId], 'offerRejected', { title, choice: after.rejectChoice ?? '', note: after.rejectNote ?? '' }, route);
}
