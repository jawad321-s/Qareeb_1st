// ─────────────────────────────────────────────────────────────────────────────
// Qareeb — shared domain types
// Mirrors the Firestore schema in docs/DATABASE_SCHEMA.md
// ─────────────────────────────────────────────────────────────────────────────

export type Locale = 'ar' | 'en';
export type UserRole = 'customer' | 'artisan' | 'admin';
export type UserStatus = 'active' | 'suspended' | 'pending';

export interface GeoLocation {
  latitude: number;
  longitude: number;
  geohash: string;
  address: string;
}

export interface AppUser {
  uid: string;
  role: UserRole;
  fullName: string;
  email: string;
  phone: string;
  photoUrl?: string;
  location?: GeoLocation;
  locale: Locale;
  status: UserStatus;
  verified: boolean;
  rating: number;
  ratingCount: number;
  createdAt: number;
  updatedAt: number;
}

export type VerificationStatus =
  | 'unsubmitted'
  | 'pending'
  | 'approved'
  | 'rejected';

export interface Availability {
  days: number[]; // 0 (Sun) – 6 (Sat)
  from: string; // "08:00"
  to: string; // "20:00"
}

export interface ArtisanProfile {
  uid: string;
  bio: string;
  serviceIds: string[];
  categoryIds: string[];
  serviceRadiusKm: number;
  basePrices: Record<string, number>;
  availability: Availability;
  gallery: string[];
  certificates: { name: string; url: string; verified: boolean }[];
  verificationStatus: VerificationStatus;
  premium: boolean;
  completedJobs: number;
  rating: number;
  ratingCount: number;
}

export interface LocalizedText {
  ar: string;
  en: string;
}

export interface Category {
  id: string;
  slug: string;
  name: LocalizedText;
  icon: string; // icon key (see constants/icons)
  colorHex: string;
  order: number;
  active: boolean;
}

export interface Service {
  id: string;
  categoryId: string;
  name: LocalizedText;
  description: LocalizedText;
  icon: string;
  basePriceFrom: number; // minor units
  active: boolean;
  popular: boolean;
}

export type RequestStatus =
  | 'PENDING'
  | 'ACCEPTED'
  | 'ON_THE_WAY'
  | 'WORKING'
  | 'COMPLETED'
  | 'CANCELLED';

export interface ServiceRequest {
  id: string;
  customerId: string;
  serviceId: string;
  categoryId: string;
  title: string;
  description: string;
  images: string[];
  location: GeoLocation;
  preferredTime: number;
  budget: { min: number; max: number };
  status: RequestStatus;
  acceptedOfferId?: string;
  acceptedArtisanId?: string;
  offerCount: number;
  createdAt: number;
  updatedAt: number;
}

export type OfferStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN';

export interface Offer {
  id: string;
  requestId: string;
  artisanId: string;
  customerId: string;
  price: number; // minor units
  etaMinutes: number;
  message: string;
  status: OfferStatus;
  createdAt: number;
  // Denormalized artisan snapshot for fast rendering in the offers list.
  artisan?: Pick<AppUser, 'uid' | 'fullName' | 'photoUrl' | 'rating' | 'ratingCount'>;
}

export type MessageType = 'text' | 'image' | 'voice';

export interface ChatMessage {
  id: string;
  senderId: string;
  type: MessageType;
  text?: string;
  mediaUrl?: string;
  durationMs?: number;
  read: boolean;
  createdAt: number;
}

export interface Review {
  id: string;
  requestId: string;
  authorId: string;
  targetId: string;
  role: 'customer' | 'artisan';
  rating: number; // 1–5
  comment: string;
  createdAt: number;
}

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  data?: Record<string, string>;
  read: boolean;
  createdAt: number;
}
