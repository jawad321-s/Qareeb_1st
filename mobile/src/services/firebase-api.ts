// Firestore-backed implementation of the app's data facade. Same surface as
// `mockApi`, so screens/hooks are agnostic. Selected in services/api.ts when a
// Firebase project is configured. Reads/writes the shared collections the admin
// dashboard also uses, giving live mobile ↔ admin integration.
import {
  addDoc, collection, doc, getCountFromServer, getDoc, getDocs, limit, orderBy, query,
  deleteField, setDoc, updateDoc, where, writeBatch,
} from 'firebase/firestore';
import type {
  AppUser, ArtisanProfile, ChatMessage, Conversation, JobHistory, Offer, Review, Service, ServiceRequest, SupportContacts,
} from '@/types';
import type { mockApi } from '@/mock/api';
import { getDb } from '@/lib/firebase';
import { useAuth } from '@/store/auth';
import { isExpired, isVisibleToArtisan, sortOffers } from '@/lib/dispatch';
import { decryptChat, encryptChat, newChatKey } from '@/lib/chatCrypto';
import type { Reason } from '@/lib/reasons';
import { MOCK_CUSTOMER } from '@/mock/data';
import { accountExists } from '@/services/auth.service';
import { servicesOf, toServiceId } from '@/constants/services';
import { allCategories } from '@/constants/categories';
import { ACTIVE_STATUSES, MAX_OPEN_REQUESTS, NEXT_STATUS, OPEN_STATUSES, OpenRequestLimitError, RequestClosedError, canCancelRequest, isOverdue } from '@/lib/requestRules';
import { completedRecord, rejectedRecord } from '@/lib/jobHistory';
import { uploadRequestPhoto } from '@/services/media.service';

function db() {
  const d = getDb();
  if (!d) throw new Error('Firestore not initialised');
  return d;
}

// Firestore stores timestamps as Timestamp; the app uses epoch millis.
const ms = (v: any): number =>
  v && typeof v.toMillis === 'function' ? v.toMillis() : typeof v === 'number' ? v : Date.now();

const withId = <T>(id: string, data: any): T => ({ id, ...data }) as T;

function mapRequest(id: string, v: any): ServiceRequest {
  return { ...v, id, createdAt: ms(v.createdAt), updatedAt: ms(v.updatedAt), preferredTime: ms(v.preferredTime) };
}

/**
 * Completes active jobs the artisan never finished (see AUTO_COMPLETE_HOURS).
 * Whichever party reads the request first performs the write — the rules let
 * the customer and the assigned artisan update it. A scheduled Cloud Function
 * could take this over without changing the app.
 */
async function settleOverdue(list: ServiceRequest[]): Promise<ServiceRequest[]> {
  const now = Date.now();
  return Promise.all(
    list.map(async (r) => {
      // No Cloud Functions: close requests nobody answered in time (the
      // customer's read performs the write; the rules reject anyone else).
      if (!r.dispatch && isExpired(r, now)) {
        const cancelReason = (r.offerCount ?? 0) > 0 ? ('EXPIRED' as const) : ('NO_OFFERS' as const);
        const cancel = { status: 'CANCELLED' as const, cancelReason, updatedAt: now };
        await updateDoc(doc(db(), 'requests', r.id), cancel).catch(() => {});
        return { ...r, ...cancel };
      }
      if (!isOverdue(r, now)) return r;
      const patch = { status: 'COMPLETED' as const, completedAt: now, updatedAt: now, autoCompleted: true };
      await updateDoc(doc(db(), 'requests', r.id), patch).catch(() => {});
      return { ...r, ...patch };
    }),
  );
}

// Chat threads live under their request: requests/{id}/messages (see rules),
// encrypted with the conversation's key (lib/chatCrypto).
const messagesOf = (requestId: string) => collection(db(), 'requests', requestId, 'messages');
/**
 * Chats the signed-in user deleted for themselves: requestId → when. Read once
 * per account and kept up to date by hideConversation.
 */
let hiddenCache: { uid: string; map: Promise<Record<string, number>> } | null = null;
function hiddenChats(): Promise<Record<string, number>> {
  const uid = useAuth.getState().user?.uid;
  if (!uid) return Promise.resolve({});
  if (hiddenCache?.uid !== uid) {
    const map = getDocs(collection(db(), 'users', uid, 'hiddenChats'))
      .then((snap) => Object.fromEntries(snap.docs.map((d) => [d.id, Number(d.data().hiddenAt) || 0])))
      .catch(() => ({}) as Record<string, number>);
    hiddenCache = { uid, map };
  }
  return hiddenCache.map;
}

const chatKeyRef = (requestId: string) => doc(db(), 'requests', requestId, 'private', 'chatKey');
const chatKeys = new Map<string, string>();

/**
 * The conversation's key. Made by whoever sends the first message; when both
 * sides do so at once the rules refuse the second write, which then reads
 * the key the other one saved.
 */
async function chatKey(requestId: string, create: boolean): Promise<string | null> {
  const cached = chatKeys.get(requestId);
  if (cached) return cached;
  const read = async () => {
    const snap = await getDoc(chatKeyRef(requestId)).catch(() => null);
    const key = snap?.exists() ? (snap.data().key as string) : null;
    if (key) chatKeys.set(requestId, key);
    return key;
  };
  const existing = await read();
  if (existing || !create) return existing;
  const key = newChatKey();
  try {
    await setDoc(chatKeyRef(requestId), { key, createdAt: Date.now() });
    chatKeys.set(requestId, key);
    return key;
  } catch (err) {
    const theirs = await read();
    if (theirs) return theirs;
    throw err;
  }
}

/**
 * The open requests sent to an artisan. The rules let an artisan read only the
 * requests sent to them; the rules before that let them read the open ones.
 * Asking for both (open AND sent to me) passes either set of rules, so the
 * list works while the app and the published rules are not the same version.
 * If that query fails (a missing index), each half is tried on its own.
 */
async function requestsSentTo(uid: string) {
  const requests = collection(db(), 'requests');
  const attempts = [
    () => getDocs(query(requests, where('status', '==', 'PENDING'), where('notifiedArtisanIds', 'array-contains', uid))),
    () => getDocs(query(requests, where('notifiedArtisanIds', 'array-contains', uid))),
    () => getDocs(query(requests, where('status', '==', 'PENDING'))),
  ];
  let failure: unknown;
  for (const run of attempts) {
    try {
      return await run();
    } catch (err) {
      failure = err;
    }
  }
  throw failure;
}

export const firebaseApi: typeof mockApi = {
  async getCurrentUser(): Promise<AppUser> {
    // Identity comes from the app session (Firebase Auth wiring is a later slice).
    return useAuth.getState().user ?? MOCK_CUSTOMER;
  },

  // The catalog comes from the app (constants/services), not Firestore: a
  // database seeded before services were merged still holds the old split
  // repair/installation services and the removed "Maintenance" category.
  // Only the admin's renames and hidden flags (categories/{id}) apply.
  async getServices(categoryId?: string): Promise<Service[]> {
    const shown = servicesOf(allCategories().filter((c) => c.active));
    return categoryId ? shown.filter((s) => s.categoryId === categoryId) : shown;
  },

  async getService(id: string): Promise<Service | undefined> {
    return servicesOf(allCategories()).find((s) => s.id === toServiceId(id));
  },

  async getArtisan(id: string): Promise<{ user: AppUser; profile: ArtisanProfile } | undefined> {
    const [uSnap, pSnap] = await Promise.all([
      getDoc(doc(db(), 'users', id)),
      getDoc(doc(db(), 'artisanProfiles', id)),
    ]);
    if (!uSnap.exists()) return undefined;
    const user = withId<AppUser>(uSnap.id, uSnap.data());
    const profile = pSnap.exists()
      ? withId<ArtisanProfile>(pSnap.id, pSnap.data())
      : ({ uid: id, rating: user.rating, ratingCount: user.ratingCount } as ArtisanProfile);
    return { user, profile };
  },

  async getRecommendedArtisans(): Promise<AppUser[]> {
    const q = query(collection(db(), 'users'), where('role', '==', 'artisan'), orderBy('rating', 'desc'), limit(20));
    const snap = await getDocs(q);
    // Deleted accounts are kept in the records, not offered to anyone.
    return snap.docs.filter((d) => d.get('status') !== 'deleted').map((d) => withId<AppUser>(d.id, d.data()));
  },

  async getMyRequests(customerId: string): Promise<ServiceRequest[]> {
    const q = query(collection(db(), 'requests'), where('customerId', '==', customerId), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return settleOverdue(snap.docs.map((d) => mapRequest(d.id, d.data())));
  },

  async getRequest(id: string): Promise<ServiceRequest | undefined> {
    const snap = await getDoc(doc(db(), 'requests', id));
    if (!snap.exists()) return undefined;
    const [req] = await settleOverdue([mapRequest(snap.id, snap.data())]);
    return req;
  },

  async getNearbyRequests(): Promise<ServiceRequest[]> {
    // Only requests meant for this artisan: dispatched to them by Cloud
    // Functions, or — when the functions aren't running — matching the same
    // policy locally (category, verified, radius growing over time).
    const me = useAuth.getState().user;
    if (!me) return [];
    const [snap, profile, self] = await Promise.all([
      requestsSentTo(me.uid),
      getDoc(doc(db(), 'artisanProfiles', me.uid)),
      getDoc(doc(db(), 'users', me.uid)),
    ]);
    // Switched to unavailable on the dashboard: no new requests.
    if (profile.exists() && profile.data().available === false) return [];
    const categoryIds: string[] = profile.exists() ? (profile.data().categoryIds ?? []) : [];
    const availability = profile.exists() ? profile.data().availability : undefined;
    const featured = profile.exists() && profile.data().featured === true;
    // Pick up an admin approval made since sign-in.
    const verified = self.exists() ? self.data().verified === true : me.verified;
    if (verified !== me.verified) useAuth.getState().updateUser({ verified });
    const now = Date.now();
    return snap.docs
      .map((d) => mapRequest(d.id, d.data()))
      .filter((r) => r.status === 'PENDING' && isVisibleToArtisan(r, { ...me, verified }, categoryIds, now, availability, featured))
      .sort((a, b) => b.createdAt - a.createdAt);
  },

  async createRequest(input): Promise<ServiceRequest> {
    const now = Date.now();
    // Each request notifies every nearby artisan, so a customer has at most a
    // few open at once (the server cancels any request over the limit too).
    const [settings, open] = await Promise.all([
      firebaseApi.getSupportContacts().catch(() => ({}) as SupportContacts),
      getCountFromServer(query(collection(db(), 'requests'), where('customerId', '==', input.customerId), where('status', 'in', OPEN_STATUSES))),
    ]);
    const max = settings.maxOpenRequests ?? MAX_OPEN_REQUESTS;
    if (open.data().count >= max) throw new OpenRequestLimitError(max);
    // The picked photos exist only on this phone: upload them first, so the
    // request stores links the artisans (and the admin) can open. A request
    // posted again keeps the photos it already has online.
    const refDoc = doc(collection(db(), 'requests'));
    const images = await Promise.all((input.images ?? []).map((uri) => (/^https?:\/\//.test(uri) ? uri : uploadRequestPhoto(refDoc.id, uri))));
    const payload = { ...input, images, status: 'PENDING' as const, offerCount: 0, createdAt: now, updatedAt: now };
    // Denormalise the customer name so the admin table can render it directly.
    const customerName = useAuth.getState().user?.fullName ?? '';
    await setDoc(refDoc, { ...payload, customerName });
    return { ...payload, id: refDoc.id };
  },

  async getOffers(requestId: string): Promise<Offer[]> {
    // The rules only let a user read offers they are a party to, so the query
    // must be scoped to the caller: the customer sees all offers on their
    // request, an artisan only their own.
    const me = useAuth.getState().user;
    if (!me) return [];
    const party = me.role === 'artisan' ? 'artisanId' : 'customerId';
    const q = query(collection(db(), 'offers'), where('requestId', '==', requestId), where(party, '==', me.uid));
    const snap = await getDocs(q);
    const offers = snap.docs
      .map((d) => withId<Offer>(d.id, { ...d.data(), createdAt: ms(d.data().createdAt) }))
      // An offer taken back (by the artisan, or when an admin suspends them) is gone for the customer.
      .filter((o) => me.role === 'artisan' || o.status !== 'WITHDRAWN');
    // The customer sees which artisans are featured now; their offers come first.
    if (me.role !== 'artisan' && offers.length) {
      const ids = [...new Set(offers.map((o) => o.artisanId))];
      const profiles = await Promise.all(ids.map((id) => getDoc(doc(db(), 'artisanProfiles', id)).catch(() => null)));
      const featured = new Set(profiles.filter((p) => p?.exists() && p.data().featured === true).map((p) => p!.id));
      offers.forEach((o) => (o.artisanFeatured = featured.has(o.artisanId)));
    }
    return sortOffers(offers);
  },

  async acceptOffer(offerId: string): Promise<void> {
    const offSnap = await getDoc(doc(db(), 'offers', offerId));
    if (!offSnap.exists()) return;
    const offer = offSnap.data() as Offer;
    // Taken only while the request still waits for offers (not once it was
    // cancelled or expired, e.g. with the page left open); the rules agree.
    const reqSnap = await getDoc(doc(db(), 'requests', offer.requestId));
    if (!reqSnap.exists() || reqSnap.data().status !== 'PENDING' || offer.status !== 'PENDING') throw new RequestClosedError();
    const batch = writeBatch(db());
    // Accept this offer, reject the siblings.
    const siblings = await getDocs(
      query(collection(db(), 'offers'), where('requestId', '==', offer.requestId), where('customerId', '==', offer.customerId)),
    );
    // closedReason tells the other artisans another offer was chosen.
    siblings.forEach((s) => batch.update(s.ref, s.id === offerId ? { status: 'ACCEPTED' } : { status: 'REJECTED', closedReason: 'OTHER_ACCEPTED' }));
    batch.update(doc(db(), 'requests', offer.requestId), {
      status: 'ACCEPTED',
      acceptedOfferId: offerId,
      acceptedArtisanId: offer.artisanId,
      updatedAt: Date.now(),
    });
    await batch.commit();
  },

  // Either party can call off a request while it hasn't started yet. Any offers
  // still open on it are closed out in the same batch.
  async cancelRequest(requestId: string, reason?: Reason): Promise<void> {
    const reqSnap = await getDoc(doc(db(), 'requests', requestId));
    if (!reqSnap.exists()) return;
    const current = reqSnap.data() as ServiceRequest;
    if (!canCancelRequest(current.status)) return;

    const batch = writeBatch(db());
    // cancelledBy lets Cloud Functions notify the other party.
    batch.update(reqSnap.ref, {
      status: 'CANCELLED',
      cancelledBy: useAuth.getState().user?.uid ?? null,
      cancelChoice: reason?.choice ?? null,
      cancelNote: reason?.note ?? null,
      updatedAt: Date.now(),
    });
    // Only the customer can read/close the other offers; once an artisan is
    // assigned (the only time they can cancel) none are still pending anyway.
    if (useAuth.getState().user?.uid === current.customerId) {
      // The hired artisan's offer stays "accepted"; record that the job was cancelled.
      if (current.acceptedOfferId)
        batch.update(doc(db(), 'offers', current.acceptedOfferId), { requestStatus: 'CANCELLED', requestCancelChoice: reason?.choice ?? null, requestCancelNote: reason?.note ?? null });
      const open = await getDocs(
        query(
          collection(db(), 'offers'),
          where('requestId', '==', requestId),
          where('customerId', '==', current.customerId),
          where('status', '==', 'PENDING'),
        ),
      );
      open.forEach((o) =>
        batch.update(o.ref, {
          status: 'REJECTED',
          requestStatus: 'CANCELLED',
          closedReason: 'REQUEST_CANCELLED',
          requestCancelChoice: reason?.choice ?? null,
          requestCancelNote: reason?.note ?? null,
        }),
      );
    }
    await batch.commit();
  },

  async rejectOffer(offerId: string, reason?: Reason): Promise<void> {
    await updateDoc(doc(db(), 'offers', offerId), {
      status: 'REJECTED',
      closedReason: 'REJECTED_BY_CUSTOMER',
      rejectChoice: reason?.choice ?? null,
      rejectNote: reason?.note ?? null,
    });
  },

  async submitOffer(input): Promise<Offer> {
    const now = Date.now();
    const payload = { ...input, status: 'PENDING' as const, createdAt: now };
    const refDoc = await addDoc(collection(db(), 'offers'), payload);
    // Bump the request's offer count.
    const reqSnap = await getDoc(doc(db(), 'requests', input.requestId));
    if (reqSnap.exists()) {
      await updateDoc(reqSnap.ref, { offerCount: (reqSnap.data().offerCount ?? 0) + 1, updatedAt: now });
    }
    return { ...payload, id: refDoc.id };
  },

  async updateOfferPrice(offerId, price): Promise<void> {
    // Rules: only the offer's artisan, only the price, and only while the work
    // is in progress (request WORKING, offer accepted).
    await updateDoc(doc(db(), 'offers', offerId), { price, priceUpdatedAt: Date.now() });
  },

  async getReviews(targetId: string): Promise<Review[]> {
    const q = query(collection(db(), 'reviews'), where('targetId', '==', targetId));
    const snap = await getDocs(q);
    return snap.docs.map((d) => withId<Review>(d.id, { ...d.data(), createdAt: ms(d.data().createdAt) }));
  },

  async getUser(uid: string): Promise<AppUser | undefined> {
    // Your own doc and artisans' docs are readable. A customer's doc (phone,
    // home location) is private to them, so others get their public profile:
    // name, photo, rating and join date. A refused read means "try the next";
    // any other failure (e.g. offline) is thrown so the query retries.
    const read = (path: string) =>
      getDoc(doc(db(), path)).catch((err) => {
        if ((err as { code?: string })?.code === 'permission-denied') return null;
        throw err;
      });
    const snap = await read(`users/${uid}`);
    if (snap?.exists()) {
      const v = snap.data();
      return { ...(v as AppUser), uid: snap.id, createdAt: ms(v.createdAt), updatedAt: ms(v.updatedAt) };
    }
    const pub = await read(`publicProfiles/${uid}`);
    if (!pub?.exists()) return undefined;
    const v = pub.data();
    return {
      uid,
      role: v.role,
      fullName: v.fullName ?? '',
      photoUrl: v.photoUrl,
      phone: '',
      locale: 'ar',
      status: 'active',
      verified: false,
      rating: v.rating ?? 0,
      ratingCount: v.ratingCount ?? 0,
      createdAt: ms(v.createdAt),
      updatedAt: ms(v.updatedAt),
    } as AppUser;
  },

  async getPendingReview(uid: string, role: 'customer' | 'artisan'): Promise<ServiceRequest | null> {
    const party = role === 'customer' ? 'customerId' : 'acceptedArtisanId';
    // Settle overdue jobs first so an auto-completed one asks for its rating.
    const active = await getDocs(query(collection(db(), 'requests'), where(party, '==', uid), where('status', 'in', ACTIVE_STATUSES)));
    await settleOverdue(active.docs.map((d) => mapRequest(d.id, d.data())));
    const [reqSnap, revSnap] = await Promise.all([
      getDocs(query(collection(db(), 'requests'), where(party, '==', uid), where('status', '==', 'COMPLETED'))),
      getDocs(query(collection(db(), 'reviews'), where('authorId', '==', uid))),
    ]);
    const rated = new Set(revSnap.docs.map((d) => d.data().requestId as string));
    const pending = reqSnap.docs
      .map((d) => mapRequest(d.id, d.data()))
      .filter((r) => !rated.has(r.id))
      .sort((a, b) => a.updatedAt - b.updatedAt)[0];
    return pending ?? null;
  },

  async hasReviewed(requestId: string, authorId: string): Promise<boolean> {
    // Query by fields (not the deterministic id) so reviews seeded from the
    // admin side with other ids still count — same check getPendingReview uses.
    const q = query(
      collection(db(), 'reviews'),
      where('requestId', '==', requestId),
      where('authorId', '==', authorId),
      limit(1),
    );
    return !(await getDocs(q)).empty;
  },

  async submitReview(input): Promise<Review> {
    // Deterministic id = one review per person per request. The rules only
    // allow `create`, so a second write for the same pair is rejected.
    const id = `${input.requestId}_${input.authorId}`;
    const payload = { ...input, createdAt: Date.now() };
    await setDoc(doc(db(), 'reviews', id), payload);
    return { ...payload, id };
  },

  async recordSubscription(record): Promise<string | undefined> {
    // Rules: an artisan may create subscriptions for themselves only. Marked
    // `simulated` because checkout runs the payment simulator, not a gateway.
    const id = `${record.artisanId}_${record.activatedAt}`;
    const { docId: _local, cancelledAt: _c, ...data } = record as typeof record & { docId?: string; cancelledAt?: number };
    await setDoc(doc(db(), 'subscriptions', id), { ...data, status: 'active', simulated: true });
    return id;
  },

  async cancelSubscription(docId, cancelledAt): Promise<void> {
    // Cancelling ends the plan immediately; the amount paid is not refunded.
    await updateDoc(doc(db(), 'subscriptions', docId), { status: 'cancelled', cancelledAt });
  },

  async updateUserLocation(uid, location): Promise<void> {
    await updateDoc(doc(db(), 'users', uid), { location, updatedAt: Date.now() });
  },

  async updateArtisanServices(uid, serviceIds, categoryIds): Promise<void> {
    await updateDoc(doc(db(), 'artisanProfiles', uid), { serviceIds, categoryIds, updatedAt: Date.now() });
  },

  async getSupportContacts(): Promise<SupportContacts> {
    const snap = await getDoc(doc(db(), 'settings', 'platform'));
    const v = snap.data() ?? {};
    return {
      supportPhone: v.supportPhone || undefined,
      supportWhatsApp: v.supportWhatsApp || undefined,
      supportEmail: v.supportEmail || undefined,
      featuredMinJobs: Number.isInteger(v.featuredMinJobs) && v.featuredMinJobs > 0 ? v.featuredMinJobs : undefined,
      featuredMinRating: Number.isFinite(v.featuredMinRating) && v.featuredMinRating >= 0 && v.featuredMinRating < 5 ? v.featuredMinRating : undefined,
      maxOpenRequests: Number.isInteger(v.maxOpenRequests) && v.maxOpenRequests > 0 ? v.maxOpenRequests : undefined,
      smsSignUp: v.smsSignUp !== false,
    };
  },

  async setAvailable(uid, available): Promise<void> {
    await updateDoc(doc(db(), 'artisanProfiles', uid), { available, updatedAt: Date.now() });
  },

  async setBio(uid, bio): Promise<void> {
    await updateDoc(doc(db(), 'artisanProfiles', uid), { bio, updatedAt: Date.now() });
  },

  async getMessages(requestId: string): Promise<ChatMessage[]> {
    const snap = await getDocs(messagesOf(requestId));
    if (snap.empty) return [];
    const key = await chatKey(requestId, false);
    // A chat this user deleted shows only what came after.
    const since = (await hiddenChats())[requestId] ?? 0;
    return snap.docs
      .map((d) => {
        const { cipher, text: _t, mediaUrl: _m, ...rest } = d.data();
        // Deleted for everyone: its content is gone, only that it existed shows.
        if (rest.deleted === true) {
          return withId<ChatMessage>(d.id, { ...rest, deleted: true, locked: false, requestId, createdAt: ms(rest.createdAt) } as ChatMessage);
        }
        const opened = typeof cipher === 'string' && key ? decryptChat(cipher, key) : null;
        return withId<ChatMessage>(d.id, {
          ...rest,
          ...(opened ?? {}),
          locked: !opened,
          requestId,
          createdAt: ms(rest.createdAt),
        } as ChatMessage);
      })
      .filter((m) => m.createdAt > since)
      .sort((a, b) => a.createdAt - b.createdAt);
  },

  /**
   * Deletes a chat for this user only: it leaves their list and its messages
   * are no longer shown to them. The other side keeps theirs; a new message
   * brings the chat back with just that.
   */
  async hideConversation(uid: string, requestId: string): Promise<void> {
    const at = Date.now();
    await setDoc(doc(db(), 'users', uid, 'hiddenChats', requestId), { hiddenAt: at });
    const cache = await hiddenChats();
    cache[requestId] = at;
  },

  /**
   * The user opened the chat: the other side's messages are marked read, so
   * the home screen and the list stop showing them as new.
   */
  async markChatRead(requestId: string, uid: string): Promise<void> {
    const snap = await getDocs(query(messagesOf(requestId), where('read', '==', false)));
    const theirs = snap.docs.filter((d) => d.get('senderId') !== uid);
    for (let i = 0; i < theirs.length; i += 450) {
      const batch = writeBatch(db());
      theirs.slice(i, i + 450).forEach((d) => batch.update(d.ref, { read: true }));
      await batch.commit();
    }
  },

  // Only who sent it, its kind and when are stored in the clear; the text and
  // the photo link are encrypted.
  async sendMessage(requestId, msg): Promise<ChatMessage> {
    const now = Date.now();
    const key = await chatKey(requestId, true);
    const { text, mediaUrl, mediaUrls, replyTo, ...meta } = msg;
    // Several photos travel in one message; the first is also `mediaUrl`.
    const cipher = encryptChat({ text, mediaUrl: mediaUrls?.[0] ?? mediaUrl, ...(mediaUrls?.length ? { mediaUrls } : {}) }, key!);
    const refDoc = await addDoc(messagesOf(requestId), {
      ...meta,
      // Which message this answers: an id, nothing of its content.
      ...(replyTo ? { replyTo } : {}),
      cipher,
      v: 1,
      read: false,
      createdAt: now,
    });
    return { ...msg, read: false, createdAt: now, requestId, id: refDoc.id } as ChatMessage;
  },

  /**
   * "Delete for everyone": its sender empties a message while the chat is
   * open. The encrypted content is removed for good; the thread shows "This
   * message was deleted" in its place, on both sides.
   */
  async deleteMessageForAll(requestId, messageId): Promise<void> {
    await updateDoc(doc(db(), 'requests', requestId, 'messages', messageId), {
      deleted: true,
      deletedAt: Date.now(),
      cipher: deleteField(),
    });
  },

  /**
   * A job on which this customer hired that artisan (or this artisan was
   * hired by that customer), or null. Complaints are only offered once an
   * offer was accepted: not about an artisan who merely sent an offer, nor
   * about a customer whose request an artisan only looked at.
   */
  async getSharedJobId(uid, role, otherId): Promise<string | null> {
    const [mine, theirs] = role === 'customer' ? ['customerId', 'acceptedArtisanId'] : ['acceptedArtisanId', 'customerId'];
    const snap = await getDocs(query(collection(db(), 'requests'), where(mine, '==', uid), where(theirs, '==', otherId), limit(1)));
    return snap.empty ? null : snap.docs[0].id;
  },

  async getConversations(userId, role): Promise<Conversation[]> {
    const party = role === 'customer' ? 'customerId' : 'acceptedArtisanId';
    const snap = await getDocs(query(collection(db(), 'requests'), where(party, '==', userId)));
    const withArtisan = await settleOverdue(snap.docs.map((d) => mapRequest(d.id, d.data())).filter((r) => r.acceptedArtisanId));
    const hidden = await hiddenChats();
    const convos = await Promise.all(
      withArtisan.map(async (r) => {
        const thread = await firebaseApi.getMessages(r.id).catch(() => [] as ChatMessage[]);
        return {
          request: r,
          otherUserId: role === 'customer' ? r.acceptedArtisanId! : r.customerId,
          lastMessage: thread[thread.length - 1],
        };
      }),
    );
    // A chat the user deleted stays out of the list until a new message comes.
    return convos.filter((c) => !hidden[c.request.id] || c.lastMessage).sort(
      (a, b) => (b.lastMessage?.createdAt ?? b.request.updatedAt) - (a.lastMessage?.createdAt ?? a.request.updatedAt),
    );
  },

  async getArtisanJobs(artisanId): Promise<ServiceRequest[]> {
    const snap = await getDocs(
      query(collection(db(), 'requests'), where('acceptedArtisanId', '==', artisanId), where('status', 'in', ACTIVE_STATUSES)),
    );
    const settled = await settleOverdue(snap.docs.map((d) => mapRequest(d.id, d.data())));
    // Newest first, like every list of requests and offers.
    return settled.filter((r) => ACTIVE_STATUSES.includes(r.status)).sort((a, b) => b.createdAt - a.createdAt);
  },

  async updateRequestStatus(requestId, status): Promise<void> {
    const ref = doc(db(), 'requests', requestId);
    const snap = await getDoc(ref);
    if (!snap.exists() || NEXT_STATUS[snap.data().status as ServiceRequest['status']] !== status) return;
    const now = Date.now();
    await updateDoc(ref, { status, updatedAt: now, ...(status === 'COMPLETED' ? { completedAt: now } : {}) });
  },

  async getArtisanOffers(artisanId): Promise<Offer[]> {
    const snap = await getDocs(query(collection(db(), 'offers'), where('artisanId', '==', artisanId)));
    const list = await Promise.all(
      snap.docs.map(async (d) => {
        const o = withId<Offer>(d.id, { ...d.data(), createdAt: ms(d.data().createdAt) });
        // The job's current status (and the title, for offers sent before it
        // was copied onto them). A customer can cancel after accepting, which
        // leaves the offer itself "accepted".
        try {
          const r = await getDoc(doc(db(), 'requests', o.requestId));
          if (!r.exists()) return o;
          const [req] = await settleOverdue([mapRequest(r.id, r.data())]);
          return { ...o, requestTitle: o.requestTitle ?? req.title, categoryId: o.categoryId ?? req.categoryId, requestStatus: req.status };
        } catch (err) {
          // Artisans read only open requests and the ones they were hired for:
          // a still-pending offer whose request is unreadable was cancelled.
          if ((err as { code?: string })?.code === 'permission-denied' && o.status === 'PENDING') {
            return { ...o, requestStatus: 'CANCELLED' as const };
          }
          return o;
        }
      }),
    );
    return list.sort((a, b) => b.createdAt - a.createdAt);
  },

  async getJobHistory(artisanId): Promise<JobHistory> {
    const [doneSnap, offerSnap] = await Promise.all([
      getDocs(query(collection(db(), 'requests'), where('acceptedArtisanId', '==', artisanId), where('status', '==', 'COMPLETED'))),
      getDocs(query(collection(db(), 'offers'), where('artisanId', '==', artisanId))),
    ]);
    const myOffers = offerSnap.docs.map((d) => withId<Offer>(d.id, { ...d.data(), createdAt: ms(d.data().createdAt) }));
    const completed = await Promise.all(
      doneSnap.docs.map(async (d) => {
        const r = mapRequest(d.id, d.data());
        // The customer's review has a deterministic id (see submitReview).
        const rev = await getDoc(doc(db(), 'reviews', `${r.id}_${r.customerId}`)).catch(() => null);
        const review = rev?.exists() ? withId<Review>(rev.id, rev.data()) : undefined;
        return completedRecord(r, myOffers.find((o) => o.id === r.acceptedOfferId), review);
      }),
    );
    // A turned-down offer's request is often no longer readable to this artisan
    // (assigned elsewhere or cancelled); the record then uses the offer's copy.
    // Accepted offers are read too: a job taken and then cancelled (by either
    // side) belongs with the ones that didn't go through.
    const rejected = (
      await Promise.all(
        myOffers
          .filter((o) => o.status === 'REJECTED' || o.status === 'ACCEPTED')
          .map(async (o) => {
            const snap = await getDoc(doc(db(), 'requests', o.requestId)).catch(() => null);
            const r = snap?.exists() ? mapRequest(snap.id, snap.data()) : undefined;
            if (o.status === 'ACCEPTED' && r?.status !== 'CANCELLED' && o.requestStatus !== 'CANCELLED') return null;
            return rejectedRecord(o, r);
          }),
      )
    ).filter((x): x is NonNullable<typeof x> => !!x);
    return {
      completed: completed.sort((a, b) => b.date - a.date),
      rejected: rejected.sort((a, b) => b.date - a.date),
    };
  },

  async isPhoneRegistered(phone, role): Promise<boolean> {
    // Asked before any SMS is sent (the checkAccount function: signed-out
    // visitors can't look numbers up in the database). If it can't tell,
    // Firebase Auth still refuses a second account of the same type later
    // (auth/email-already-in-use → auth.errPhoneInUse).
    return (await accountExists(phone, role)) === true;
  },
};
