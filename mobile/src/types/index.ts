// ─────────────────────────────────────────────────────────────────────────────
// Qareeb — shared domain types
// Mirrors the Firestore schema in docs/DATABASE_SCHEMA.md
// ─────────────────────────────────────────────────────────────────────────────

export type Locale = 'ar' | 'en';
export type UserRole = 'customer' | 'artisan' | 'admin';
export type UserStatus = 'active' | 'suspended' | 'pending' | 'deleted';

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
  /** The account identity with the role: a number holds one customer and one artisan account. */
  phone: string;
  photoUrl?: string;
  location?: GeoLocation;
  locale: Locale;
  status: UserStatus;
  /** Why the team suspended the account (dashboard), when they said. */
  suspendReason?: string | null;
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
  /** The dashboard switch: false stops new requests. Missing means available. */
  available?: boolean;
  gallery: string[];
  certificates: { name: string; url: string; verified: boolean }[];
  verificationStatus: VerificationStatus;
  premium: boolean;
  /** Jobs completed, counted by Cloud Functions from the requests. */
  completedJobs: number;
  /** "Featured artisan": set by Cloud Functions once completedJobs reaches the threshold. */
  featured?: boolean;
  rating: number;
  ratingCount: number;
}

export interface LocalizedText {
  ar: string;
  en: string;
}

/** settings/platform: how users reach support (set in the admin dashboard). */
export interface SupportContacts {
  supportPhone?: string;
  supportWhatsApp?: string;
  supportEmail?: string;
  /** Completed jobs that make an artisan featured (default FEATURED_MIN_JOBS). */
  featuredMinJobs?: number;
  /** The rating a featured artisan must be above (default FEATURED_MIN_RATING). */
  featuredMinRating?: number;
  /** Open requests a customer may have at once (dashboard setting). */
  maxOpenRequests?: number;
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
  status: RequestStatus;
  acceptedOfferId?: string;
  acceptedArtisanId?: string;
  /** Copied from the customer when the request is made (lists, and before their public profile exists). */
  customerName?: string;
  /** Set by Cloud Functions: current search radius and response deadline. */
  dispatch?: { radiusKm: number; startedAt: number; expiresAt: number };
  notifiedArtisanIds?: string[];
  /** Artisans this request is never sent to: posted again after one of them cancelled the job. */
  excludedArtisanIds?: string[];
  /** Set when the 30-minute window ran out: NO_OFFERS (none came) or EXPIRED (none accepted). */
  cancelReason?: 'NO_OFFERS' | 'EXPIRED' | 'TOO_MANY_OPEN';
  /** Why the customer or the artisan cancelled (lib/reasons), and their own words. */
  cancelChoice?: string;
  cancelNote?: string;
  cancelledBy?: string | null;
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
  /** Why a turned-down offer was closed (OTHER_ACCEPTED, REJECTED_BY_CUSTOMER, REQUEST_CANCELLED, EXPIRED). */
  closedReason?: 'OTHER_ACCEPTED' | 'REJECTED_BY_CUSTOMER' | 'REQUEST_CANCELLED' | 'EXPIRED';
  /** The customer's reason for declining it (lib/reasons) and their words. */
  rejectChoice?: string;
  rejectNote?: string;
  /**
   * Copied from the request when the customer cancels it, so an artisan who
   * offered (and can no longer read the cancelled request) still sees why.
   */
  requestCancelChoice?: string;
  requestCancelNote?: string;
  categoryId?: string;
  /**
   * The job's status as the artisan last knew it: read from the request when
   * it is still readable, and copied onto the offer when the customer cancels
   * (a cancelled request is no longer readable to artisans who weren't hired).
   */
  requestStatus?: RequestStatus;
  // Denormalized artisan snapshot for fast rendering in the offers list.
  artisan?: Pick<AppUser, 'uid' | 'fullName' | 'photoUrl' | 'rating' | 'ratingCount'>;
  /** Read live for the customer: the artisan is featured now (not when they offered). */
  artisanFeatured?: boolean;
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
  /** Stored encrypted and couldn't be opened on this device. */
  locked?: boolean;
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
  /** Rejected only: why the offer or the job didn't go through. */
  reason?: 'otherChosen' | 'cancelled' | 'cancelledByMe' | 'declined' | 'expired';
  /** The reason given for that (lib/reasons) and the person's own words. */
  reasonChoice?: string;
  reasonNote?: string;
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
