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

// In-memory mutable stores so the app behaves like a real backend during a session.
let requests = [...MOCK_REQUESTS];
let offers = [...MOCK_OFFERS];
let messages = [...MOCK_MESSAGES];

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
    return clone(MOCK_REVIEWS.filter((r) => r.targetId === targetId));
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
