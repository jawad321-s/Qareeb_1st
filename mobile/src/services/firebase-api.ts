// Firestore-backed implementation of the app's data facade. Same surface as
// `mockApi`, so screens/hooks are agnostic. Selected in services/api.ts when a
// Firebase project is configured. Reads/writes the shared collections the admin
// dashboard also uses, giving live mobile ↔ admin integration.
import {
  addDoc, collection, doc, getDoc, getDocs, limit, orderBy, query,
  updateDoc, where, writeBatch,
} from 'firebase/firestore';
import type {
  AppUser, ArtisanProfile, ChatMessage, Offer, Review, Service, ServiceRequest,
} from '@/types';
import type { mockApi } from '@/mock/api';
import { getDb } from '@/lib/firebase';
import { useAuth } from '@/store/auth';
import { MOCK_CUSTOMER } from '@/mock/data';

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
    return snap.docs.map((d) => mapRequest(d.id, d.data()));
  },

  async getRequest(id: string): Promise<ServiceRequest | undefined> {
    const snap = await getDoc(doc(db(), 'requests', id));
    return snap.exists() ? mapRequest(snap.id, snap.data()) : undefined;
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

  async getMessages(requestId: string): Promise<ChatMessage[]> {
    const q = query(collection(db(), 'messages'), where('requestId', '==', requestId));
    const snap = await getDocs(q);
    return snap.docs
      .map((d) => withId<ChatMessage>(d.id, { ...d.data(), createdAt: ms(d.data().createdAt) }))
      .sort((a, b) => a.createdAt - b.createdAt);
  },

  async sendMessage(requestId, msg): Promise<ChatMessage> {
    const now = Date.now();
    const payload = { ...msg, requestId, read: false, createdAt: now };
    const refDoc = await addDoc(collection(db(), 'messages'), payload);
    const { requestId: _omit, ...rest } = payload as any;
    return { ...rest, id: refDoc.id } as ChatMessage;
  },
};
