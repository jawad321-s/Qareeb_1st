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
  completedAt?: number;
  /** Completed by the system because the artisan didn't finish it in time. */
  autoCompleted?: boolean;
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
  /** Optional note to the customer — a quotation may be price + ETA only. */
  message?: string;
  status: OfferStatus;
  createdAt: number;
  // Denormalized request summary, so the artisan's history can name the job
  // even after the request stops being readable to them (taken or cancelled).
  requestTitle?: string;
  categoryId?: string;
  // Denormalized artisan snapshot for fast rendering in the offers list.
  artisan?: Pick<AppUser, 'uid' | 'fullName' | 'photoUrl' | 'rating' | 'ratingCount'>;
}

export type MessageType = 'text' | 'image' | 'voice';

export interface ChatMessage {
  id: string;
  requestId?: string;
  senderId: string;
  type: MessageType;
  text?: string;
  mediaUrl?: string;
  durationMs?: number;
  read: boolean;
  createdAt: number;
}

/** One chat thread — every request with an assigned artisan has one. */
export interface Conversation {
  request: ServiceRequest;
  /** The other party: the artisan for a customer, the customer for an artisan. */
  otherUserId: string;
  lastMessage?: ChatMessage;
}

/** One entry in the artisan's work history (income → completed / rejected). */
export interface JobRecord {
  kind: 'completed' | 'rejected';
  requestId: string;
  title: string;
  categoryId?: string;
  description?: string;
  address?: string;
  customerId: string;
  /** Completed: when the job finished. Rejected: when the offer was sent. */
  date: number;
  /** The artisan's offer, when it is known. */
  price?: number;
  etaMinutes?: number;
  message?: string;
  /** Rejected only: why the offer didn't go through. */
  reason?: 'otherChosen' | 'cancelled' | 'declined';
  /** Completed only: the customer's rating of the job, once given. */
  rating?: number;
  comment?: string;
  autoCompleted?: boolean;
}

export interface JobHistory {
  completed: JobRecord[];
  rejected: JobRecord[];
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
