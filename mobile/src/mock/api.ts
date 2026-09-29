import type { AppUser, Offer, Review, Service, ServiceRequest, ChatMessage, ArtisanProfile } from '@/types';
import {
  MOCK_ARTISANS,
  MOCK_ARTISAN_PROFILE,
  MOCK_CUSTOMER,
  MOCK_MESSAGES,
  MOCK_OFFERS,
  MOCK_REQUESTS,
  MOCK_REVIEWS,
  MOCK_SERVICES,
} from './data';
import { canCancelRequest } from '@/lib/requestRules';
import { kv } from '@/lib/mmkv';

// In-memory mutable stores so the app behaves like a real backend during a session.
let requests = [...MOCK_REQUESTS];
let offers = [...MOCK_OFFERS];
let messages = [...MOCK_MESSAGES];
// Reviews the user submitted are kept on the device. Everything else here resets
// on reload, but ratings can't: the mandatory-review gate would otherwise ask
// for the same rating again after every app launch or language switch.
const SUBMITTED_REVIEWS_KEY = 'qareeb.mock.submittedReviews';
let reviews: Review[] = [...(kv.get<Review[]>(SUBMITTED_REVIEWS_KEY) ?? []), ...MOCK_REVIEWS];

const delay = (ms = 450) => new Promise((r) => setTimeout(r, ms));
const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v));
const uid = (p: string) => `${p}_${Math.random().toString(36).slice(2, 9)}`;

export const mockApi = {
  async getCurrentUser(): Promise<AppUser> {
    await delay(200);
    return clone(MOCK_CUSTOMER);
  },

  async getServices(categoryId?: string): Promise<Service[]> {
    await delay();
    return clone(categoryId ? MOCK_SERVICES.filter((s) => s.categoryId === categoryId) : MOCK_SERVICES);
  },

  async getService(id: string): Promise<Service | undefined> {
    await delay(250);
    return clone(MOCK_SERVICES.find((s) => s.id === id));
  },

  async getArtisan(id: string): Promise<{ user: AppUser; profile: ArtisanProfile } | undefined> {
    await delay(300);
    const user = MOCK_ARTISANS.find((a) => a.uid === id) ?? MOCK_ARTISANS[0];
    return clone({ user, profile: { ...MOCK_ARTISAN_PROFILE, uid: user.uid, rating: user.rating, ratingCount: user.ratingCount } });
  },

  async getRecommendedArtisans(): Promise<AppUser[]> {
    await delay();
    return clone([...MOCK_ARTISANS].sort((a, b) => b.rating - a.rating));
  },

  async getMyRequests(customerId: string): Promise<ServiceRequest[]> {
    await delay();
    return clone(requests.filter((r) => r.customerId === customerId).sort((a, b) => b.createdAt - a.createdAt));
  },

  async getRequest(id: string): Promise<ServiceRequest | undefined> {
    await delay(250);
    return clone(requests.find((r) => r.id === id));
  },

  async getNearbyRequests(): Promise<ServiceRequest[]> {
    await delay();
    return clone(requests.filter((r) => r.status === 'PENDING'));
  },

  async createRequest(input: Omit<ServiceRequest, 'id' | 'status' | 'offerCount' | 'createdAt' | 'updatedAt'>): Promise<ServiceRequest> {
    await delay(700);
    const req: ServiceRequest = {
      ...input,
      id: uid('req'),
      status: 'PENDING',
      offerCount: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    requests = [req, ...requests];
    return clone(req);
  },

  async getOffers(requestId: string): Promise<Offer[]> {
    await delay();
    return clone(offers.filter((o) => o.requestId === requestId).sort((a, b) => a.price - b.price));
  },

  async acceptOffer(offerId: string): Promise<void> {
    await delay(500);
    const offer = offers.find((o) => o.id === offerId);
    if (!offer) return;
    offers = offers.map((o) =>
      o.requestId === offer.requestId
        ? { ...o, status: o.id === offerId ? 'ACCEPTED' : 'REJECTED' }
        : o,
    );
    requests = requests.map((r) =>
      r.id === offer.requestId
        ? { ...r, status: 'ACCEPTED', acceptedOfferId: offerId, acceptedArtisanId: offer.artisanId, updatedAt: Date.now() }
        : r,
    );
  },

  // Either party can call off a request while it hasn't started yet. Any offers
  // still open on it are closed out at the same time.
  async cancelRequest(requestId: string): Promise<void> {
    await delay(400);
    const target = requests.find((r) => r.id === requestId);
    if (!target || !canCancelRequest(target.status)) return;
    requests = requests.map((r) =>
      r.id === requestId ? { ...r, status: 'CANCELLED', updatedAt: Date.now() } : r,
    );
    offers = offers.map((o) =>
      o.requestId === requestId && o.status === 'PENDING' ? { ...o, status: 'REJECTED' } : o,
    );
  },

  async rejectOffer(offerId: string): Promise<void> {
    await delay(300);
    offers = offers.map((o) => (o.id === offerId ? { ...o, status: 'REJECTED' } : o));
  },

  async submitOffer(input: Omit<Offer, 'id' | 'status' | 'createdAt'>): Promise<Offer> {
    await delay(600);
    const offer: Offer = { ...input, id: uid('off'), status: 'PENDING', createdAt: Date.now() };
    offers = [offer, ...offers];
    requests = requests.map((r) => (r.id === input.requestId ? { ...r, offerCount: r.offerCount + 1 } : r));
    return clone(offer);
  },

  async getReviews(targetId: string): Promise<Review[]> {
    await delay();
    return clone(reviews.filter((r) => r.targetId === targetId));
  },

  /** Public profile of any user — used to show who is being rated. */
  async getUser(uid: string): Promise<AppUser | undefined> {
    await delay(200);
    return clone([MOCK_CUSTOMER, ...MOCK_ARTISANS].find((u) => u.uid === uid));
  },

  /**
   * The first completed request this user took part in but hasn't rated yet.
   * Rating is mandatory: while one exists, the app sends the user to review it.
   */
  async getPendingReview(uid: string, role: 'customer' | 'artisan'): Promise<ServiceRequest | null> {
    await delay(200);
    const rated = new Set(reviews.filter((r) => r.authorId === uid).map((r) => r.requestId));
    const pending = requests
      .filter((r) => r.status === 'COMPLETED' && !rated.has(r.id))
      .filter((r) => (role === 'customer' ? r.customerId === uid : r.acceptedArtisanId === uid))
      .sort((a, b) => a.updatedAt - b.updatedAt)[0];
    return pending ? clone(pending) : null;
  },

  async hasReviewed(requestId: string, authorId: string): Promise<boolean> {
    await delay(150);
    return reviews.some((r) => r.requestId === requestId && r.authorId === authorId);
  },

  async submitReview(input: Omit<Review, 'id' | 'createdAt'>): Promise<Review> {
    await delay(500);
    // One review per person per request.
    const existing = reviews.find((r) => r.requestId === input.requestId && r.authorId === input.authorId);
    if (existing) return clone(existing);
    const review: Review = { ...input, id: uid('rev'), createdAt: Date.now() };
    reviews = [review, ...reviews];
    kv.set(SUBMITTED_REVIEWS_KEY, [review, ...(kv.get<Review[]>(SUBMITTED_REVIEWS_KEY) ?? [])]);
    return clone(review);
  },

  async getMessages(requestId: string): Promise<ChatMessage[]> {
    await delay(250);
    return clone(messages.filter(() => true).sort((a, b) => a.createdAt - b.createdAt));
  },

  async sendMessage(requestId: string, msg: Omit<ChatMessage, 'id' | 'read' | 'createdAt'>): Promise<ChatMessage> {
    await delay(150);
    const m: ChatMessage = { ...msg, id: uid('m'), read: false, createdAt: Date.now() };
    messages = [...messages, m];
    return clone(m);
  },
};
