// Qareeb Cloud Functions — request dispatch and notifications.
//  • onRequestCreated   → first wave to artisans within 2 km
//  • dispatchTick       → every minute: widen the radius / cancel on timeout
//  • onRequestUpdated   → status changes (accepted, on the way, …, cancelled)
//  • onOfferCreated     → tell the customer about a new offer
//  • onMessageCreated   → tell the other party about a chat message
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { setGlobalOptions } from 'firebase-functions/v2';
import { onDocumentCreated, onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { REGION } from './config.js';
import { runDispatchTick, startDispatch } from './dispatch.js';
import { notifyUsers } from './notify.js';

initializeApp();
const db = getFirestore();
setGlobalOptions({ region: REGION, maxInstances: 10 });

const nameOf = async (uid) => (uid ? (await db.collection('users').doc(uid).get()).get('fullName') ?? '' : '');

export const onRequestCreated = onDocumentCreated('requests/{requestId}', async (event) => {
  const request = event.data?.data();
  if (request) await startDispatch(db, event.params.requestId, request);
});

export const dispatchTick = onSchedule({ schedule: 'every 1 minutes', timeZone: 'Asia/Jerusalem' }, async () => {
  await runDispatchTick(db);
});

export const onRequestUpdated = onDocumentUpdated('requests/{requestId}', async (event) => {
  const before = event.data.before.data();
  const after = event.data.after.data();
  if (before.status === after.status) return;
  const id = event.params.requestId;
  const customerRoute = { route: `/(shared)/request/${id}`, requestId: id };
  const artisanRoute = { route: `/(artisan)/job/${id}`, requestId: id };

  switch (after.status) {
    case 'ACCEPTED':
      return notifyUsers(db, [after.acceptedArtisanId], 'offerAccepted', { customerName: await nameOf(after.customerId), title: after.title }, artisanRoute);
    case 'ON_THE_WAY':
      return notifyUsers(db, [after.customerId], 'onTheWay', { artisanName: await nameOf(after.acceptedArtisanId) }, customerRoute);
    case 'WORKING':
      return notifyUsers(db, [after.customerId], 'working', { artisanName: await nameOf(after.acceptedArtisanId) }, customerRoute);
    case 'COMPLETED':
      // Both sides are asked to rate each other.
      await notifyUsers(db, [after.customerId], 'completed', { title: after.title }, customerRoute);
      return notifyUsers(db, [after.acceptedArtisanId], 'completed', { title: after.title }, artisanRoute);
    case 'CANCELLED': {
      if (after.cancelReason === 'NO_OFFERS') {
        return notifyUsers(db, [after.customerId], 'noOffers', { title: after.title }, customerRoute);
      }
      // Tell the party who did not cancel (if an artisan was assigned).
      if (!after.acceptedArtisanId) return;
      const byCustomer = after.cancelledBy !== after.acceptedArtisanId;
      const other = byCustomer ? after.acceptedArtisanId : after.customerId;
      const byName = await nameOf(byCustomer ? after.customerId : after.acceptedArtisanId);
      return notifyUsers(db, [other], 'cancelledByOther', { byName, title: after.title }, byCustomer ? artisanRoute : customerRoute);
    }
  }
});

export const onOfferCreated = onDocumentCreated('offers/{offerId}', async (event) => {
  const offer = event.data?.data();
  if (!offer) return;
  const artisanName = offer.artisan?.fullName || (await nameOf(offer.artisanId));
  await notifyUsers(db, [offer.customerId], 'newOffer', { artisanName, price: offer.price }, { route: `/(shared)/request/${offer.requestId}`, requestId: offer.requestId });
});

export const onMessageCreated = onDocumentCreated('requests/{requestId}/messages/{messageId}', async (event) => {
  const msg = event.data?.data();
  if (!msg) return;
  const id = event.params.requestId;
  const req = (await db.collection('requests').doc(id).get()).data();
  if (!req) return;
  const recipient = msg.senderId === req.customerId ? req.acceptedArtisanId : req.customerId;
  await notifyUsers(db, [recipient], 'newMessage', { senderName: await nameOf(msg.senderId), text: msg.text }, { route: `/(shared)/chat/${id}`, requestId: id });
});
