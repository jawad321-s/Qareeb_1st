// Qareeb Cloud Functions — request dispatch and notifications.
//  • onRequestCreated   → first wave to artisans within 2 km
//  • dispatchTick       → every minute: widen the radius / cancel on timeout
//  • onRequestUpdated   → status changes (accepted, on the way, …, cancelled)
//  • onOfferCreated     → tell the customer about a new offer
//  • onOfferUpdated     → tell the artisan their offer was declined / not chosen
//  • onArtisanProfileUpdated → a service added: offer its open requests
//  • onMessageCreated   → tell the other party about a chat message
//  • resetPasswordWithPhone → set a new password after an SMS code (callable)
//  • a completed job or a new review recounts the artisan's jobs and rating
//    (featured badge: 10 jobs and a rating above 4)
//  • adminManageUser    → the dashboard's user management (callable, admins only)
//  • deleteMyAccount    → a user deletes their own account from the app (callable)
//  • onBroadcastCreated → a system notification from the dashboard to everyone,
//                         customers or artisans
//  • onSupportMessageCreated → the team answered in the support chat: tell the user
import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { logger, setGlobalOptions } from 'firebase-functions/v2';
import { onDocumentCreated, onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { onCall } from 'firebase-functions/v2/https';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { REGION } from './config.js';
import { offerOpenRequests, runDispatchTick, startDispatch } from './dispatch.js';
import { notifyUsers } from './notify.js';
import { notifyOfferClosed, notifyRequestCancelled } from './handlers.js';
import { backfillFeatured, onArtisanRated, onJobCompleted } from './featured.js';
import { manageUser, migrateSuspendedLogins } from './adminUsers.js';
import { deliverBroadcast } from './broadcast.js';
import { removePlainChats } from './chatCleanup.js';
import { deleteOwnAccount } from './accountDeletion.js';
import { resetPasswordWithPhone as resetPassword } from './passwordReset.js';

initializeApp();
const db = getFirestore();
setGlobalOptions({ region: REGION, maxInstances: 10 });

const nameOf = async (uid) => (uid ? (await db.collection('users').doc(uid).get()).get('fullName') ?? '' : '');

export const onRequestCreated = onDocumentCreated('requests/{requestId}', async (event) => {
  const request = event.data?.data();
  if (request) await startDispatch(db, event.params.requestId, request);
});

export const dispatchTick = onSchedule({ schedule: 'every 1 minutes', timeZone: 'Asia/Jerusalem' }, async () => {
  // Once after a deploy (and when the admin changes the number): give the
  // badge to artisans who already have the jobs. Never holds up dispatch.
  await backfillFeatured(db).catch((e) => logger.error('Featured backfill failed', e));
  // Once: chats saved before they were encrypted are deleted.
  await removePlainChats(db, () => getStorage().bucket()).catch((e) => logger.error('Chat cleanup failed', e));
  // Once: accounts suspended before the support chat can sign in to reach it.
  await migrateSuspendedLogins(db, getAuth()).catch((e) => logger.error('Suspended-login migration failed', e));
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
      await notifyUsers(db, [after.acceptedArtisanId], 'completed', { title: after.title }, artisanRoute);
      // Counts towards the featured badge.
      return onJobCompleted(db, after.acceptedArtisanId);
    case 'CANCELLED':
      return notifyRequestCancelled(db, id, after);
  }
});

export const onOfferCreated = onDocumentCreated('offers/{offerId}', async (event) => {
  const offer = event.data?.data();
  if (!offer) return;
  const artisanName = offer.artisan?.fullName || (await nameOf(offer.artisanId));
  await notifyUsers(db, [offer.customerId], 'newOffer', { artisanName, price: offer.price }, { route: `/(shared)/request/${offer.requestId}`, requestId: offer.requestId });
});

/**
 * An offer turned down: the artisan hears whether the customer declined it
 * (with the reason given) or accepted another offer. Offers closed because the
 * whole request was cancelled or expired are told by onRequestUpdated.
 */
export const onOfferUpdated = onDocumentUpdated('offers/{offerId}', (event) =>
  notifyOfferClosed(db, event.params.offerId, event.data.before.data(), event.data.after.data()),
);

/** An artisan added a service: offer them the requests still open in it. */
export const onArtisanProfileUpdated = onDocumentUpdated('artisanProfiles/{uid}', async (event) => {
  const before = event.data.before.data() ?? {};
  const after = event.data.after.data() ?? {};
  const added = (after.categoryIds ?? []).filter((c) => !(before.categoryIds ?? []).includes(c));
  if (added.length) await offerOpenRequests(db, event.params.uid, added);
});

export const onMessageCreated = onDocumentCreated('requests/{requestId}/messages/{messageId}', async (event) => {
  const msg = event.data?.data();
  if (!msg) return;
  const id = event.params.requestId;
  const req = (await db.collection('requests').doc(id).get()).data();
  if (!req) return;
  const recipient = msg.senderId === req.customerId ? req.acceptedArtisanId : req.customerId;
  await notifyUsers(db, [recipient], 'newMessage', { senderName: await nameOf(msg.senderId), image: msg.type === 'image' }, { route: `/(shared)/chat/${id}`, requestId: id });
});

export const resetPasswordWithPhone = onCall((request) =>
  resetPassword(
    getAuth(),
    request.auth && {
      uid: request.auth.uid,
      phone: request.auth.token.phone_number,
      provider: request.auth.token.firebase?.sign_in_provider,
    },
    request.data,
  ),
);

/** Suspend / reactivate / verify / unverify — from the admin dashboard. */
export const adminManageUser = onCall((request) =>
  manageUser(
    db,
    getAuth(),
    request.auth && { uid: request.auth.uid, role: request.auth.token.role, email: request.auth.token.email },
    request.data,
  ),
);

/** A system notification written in the dashboard goes out to its audience. */
export const onBroadcastCreated = onDocumentCreated({ document: 'broadcasts/{id}', timeoutSeconds: 540, memory: '512MiB' }, (event) =>
  deliverBroadcast(db, event.params.id),
);

/** A new review can make an artisan featured (or no longer). */
export const onReviewCreated = onDocumentCreated('reviews/{id}', async (event) => {
  const review = event.data?.data();
  if (review?.targetId) await onArtisanRated(db, review.targetId);
});

/** "Delete my account" in the app (after the user re-entered their password). */
export const deleteMyAccount = onCall((request) =>
  deleteOwnAccount(
    db,
    getAuth(),
    () => getStorage().bucket(),
    request.auth && { uid: request.auth.uid, authTime: request.auth.token.auth_time, suspended: request.auth.token.suspended === true },
  ),
);

/** The Qareeb team answered in the support chat (dashboard → Support). */
export const onSupportMessageCreated = onDocumentCreated('supportThreads/{uid}/messages/{id}', async (event) => {
  const msg = event.data?.data();
  if (msg?.from !== 'admin') return;
  await notifyUsers(db, [event.params.uid], 'supportReply', { text: msg.text }, { route: '/(shared)/support' });
});
