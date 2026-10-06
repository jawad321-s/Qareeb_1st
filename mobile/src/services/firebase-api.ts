// Firestore-backed implementation of the app's data facade. Same surface as
// `mockApi`, so screens/hooks are agnostic. Selected in services/api.ts when a
// Firebase project is configured. Reads/writes the shared collections the admin
// dashboard also uses, giving live mobile ↔ admin integration.
import {
  addDoc, collection, doc, getDoc, getDocs, limit, orderBy, query,
  setDoc, updateDoc, where, writeBatch,
} from 'firebase/firestore';
import type {
  AppUser, ArtisanProfile, ChatMessage, Conversation, Offer, Review, Service, ServiceRequest,
} from '@/types';
import type { mockApi } from '@/mock/api';
import { getDb } from '@/lib/firebase';
import { useAuth } from '@/store/auth';
import { MOCK_CUSTOMER } from '@/mock/data';
import { ACTIVE_STATUSES, NEXT_STATUS, canCancelRequest, isOverdue } from '@/lib/requestRules';

function db() {
  const d = getDb();
  if (!d) throw new Error('Firestore not initialised');
  return d;
}

// Firestore stores timestamps as Timestamp; the app uses epoch millis.
const ms = (v: any): number =>
  v && typeof v.toMillis === 'function' ? v.toMillis() : typeof v === 'number' ? v : Date.now();

const withId = <T>(id: string, data: any): T => ({ id, ...data }) as T;

async function collectData<T>(col: string): Promise<T[]> {
  const snap = await getDocs(collection(db(), col));
  return snap.docs.map((d) => withId<T>(d.id, d.data()));
}

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
      if (!isOverdue(r, now)) return r;
      const patch = { status: 'COMPLETED' as const, completedAt: now, updatedAt: now, autoCompleted: true };
      await updateDoc(doc(db(), 'requests', r.id), patch).catch(() => {});
      return { ...r, ...patch };
    }),
  );
}

// Chat threads live under their request: requests/{id}/messages (see rules).
const messagesOf = (requestId: string) => collection(db(), 'requests', requestId, 'messages');

export const firebaseApi: typeof mockApi = {
  async getCurrentUser(): Promise<AppUser> {
    // Identity comes from the app session (Firebase Auth wiring is a later slice).
    return useAuth.getState().user ?? MOCK_CUSTOMER;
  },

  async getServices(categoryId?: string): Promise<Service[]> {
    const all = await collectData<Service>('services');
    return categoryId ? all.filter((s) => s.categoryId === categoryId) : all;
  },

  async getService(id: string): Promise<Service | undefined> {
    const snap = await getDoc(doc(db(), 'services', id));
    return snap.exists() ? withId<Service>(snap.id, snap.data()) : undefined;
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
    return snap.docs.map((d) => withId<AppUser>(d.id, d.data()));
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
    const q = query(collection(db(), 'requests'), where('status', '==', 'PENDING'), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => mapRequest(d.id, d.data()));
  },

  async createRequest(input): Promise<ServiceRequest> {
    const now = Date.now();
    const payload = { ...input, status: 'PENDING' as const, offerCount: 0, createdAt: now, updatedAt: now };
    // Denormalise the customer name so the admin table can render it directly.
    const customerName = useAuth.getState().user?.fullName ?? '';
    const refDoc = await addDoc(collection(db(), 'requests'), { ...payload, customerName });
    return { ...payload, id: refDoc.id };
  },

  async getOffers(requestId: string): Promise<Offer[]> {
    const q = query(collection(db(), 'offers'), where('requestId', '==', requestId), orderBy('price', 'asc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => withId<Offer>(d.id, { ...d.data(), createdAt: ms(d.data().createdAt) }));
  },

  async acceptOffer(offerId: string): Promise<void> {
    const offSnap = await getDoc(doc(db(), 'offers', offerId));
    if (!offSnap.exists()) return;
    const offer = offSnap.data() as Offer;
    const batch = writeBatch(db());
    // Accept this offer, reject the siblings.
    const siblings = await getDocs(query(collection(db(), 'offers'), where('requestId', '==', offer.requestId)));
    siblings.forEach((s) => batch.update(s.ref, { status: s.id === offerId ? 'ACCEPTED' : 'REJECTED' }));
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
  async cancelRequest(requestId: string): Promise<void> {
    const reqSnap = await getDoc(doc(db(), 'requests', requestId));
    if (!reqSnap.exists()) return;
    const current = reqSnap.data() as ServiceRequest;
    if (!canCancelRequest(current.status)) return;

    const batch = writeBatch(db());
    batch.update(reqSnap.ref, { status: 'CANCELLED', updatedAt: Date.now() });
    const open = await getDocs(
      query(collection(db(), 'offers'), where('requestId', '==', requestId), where('status', '==', 'PENDING')),
    );
    open.forEach((o) => batch.update(o.ref, { status: 'REJECTED' }));
    await batch.commit();
  },

  async rejectOffer(offerId: string): Promise<void> {
    await updateDoc(doc(db(), 'offers', offerId), { status: 'REJECTED' });
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

  async getReviews(targetId: string): Promise<Review[]> {
    const q = query(collection(db(), 'reviews'), where('targetId', '==', targetId));
    const snap = await getDocs(q);
    return snap.docs.map((d) => withId<Review>(d.id, { ...d.data(), createdAt: ms(d.data().createdAt) }));
  },

  async getUser(uid: string): Promise<AppUser | undefined> {
    // Users may only read their own doc (see firestore.rules), so reading the
    // other party can be denied — callers fall back to a generic label.
    const snap = await getDoc(doc(db(), 'users', uid)).catch(() => null);
    if (!snap) return undefined;
    if (!snap.exists()) return undefined;
    const v = snap.data();
    return { ...(v as AppUser), uid: snap.id, createdAt: ms(v.createdAt), updatedAt: ms(v.updatedAt) };
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

  async getMessages(requestId: string): Promise<ChatMessage[]> {
    const snap = await getDocs(messagesOf(requestId));
    return snap.docs
      .map((d) => withId<ChatMessage>(d.id, { ...d.data(), requestId, createdAt: ms(d.data().createdAt) }))
      .sort((a, b) => a.createdAt - b.createdAt);
  },

  async sendMessage(requestId, msg): Promise<ChatMessage> {
    const now = Date.now();
    const payload = { ...msg, read: false, createdAt: now };
    const refDoc = await addDoc(messagesOf(requestId), payload);
    return { ...payload, requestId, id: refDoc.id } as ChatMessage;
  },

  async getConversations(userId, role): Promise<Conversation[]> {
    const party = role === 'customer' ? 'customerId' : 'acceptedArtisanId';
    const snap = await getDocs(query(collection(db(), 'requests'), where(party, '==', userId)));
    const withArtisan = await settleOverdue(snap.docs.map((d) => mapRequest(d.id, d.data())).filter((r) => r.acceptedArtisanId));
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
    return convos.sort(
      (a, b) => (b.lastMessage?.createdAt ?? b.request.updatedAt) - (a.lastMessage?.createdAt ?? a.request.updatedAt),
    );
  },

  async getArtisanJobs(artisanId): Promise<ServiceRequest[]> {
    const snap = await getDocs(
      query(collection(db(), 'requests'), where('acceptedArtisanId', '==', artisanId), where('status', 'in', ACTIVE_STATUSES)),
    );
    const settled = await settleOverdue(snap.docs.map((d) => mapRequest(d.id, d.data())));
    return settled.filter((r) => ACTIVE_STATUSES.includes(r.status)).sort((a, b) => b.updatedAt - a.updatedAt);
  },

  async updateRequestStatus(requestId, status): Promise<void> {
    const ref = doc(db(), 'requests', requestId);
    const snap = await getDoc(ref);
    if (!snap.exists() || NEXT_STATUS[snap.data().status as ServiceRequest['status']] !== status) return;
    const now = Date.now();
    await updateDoc(ref, { status, updatedAt: now, ...(status === 'COMPLETED' ? { completedAt: now } : {}) });
  },
};
