// Mock data powering the admin dashboard (mirrors the Firestore schema).
// Swap these getters for Firestore Admin SDK queries when wiring the backend.

export type UserRole = 'customer' | 'artisan' | 'admin';
export type UserStatus = 'active' | 'suspended' | 'pending';

export interface AdminUser {
  uid: string;
  fullName: string;
  /** The account identity with the role: a number holds one customer and one artisan account. */
  phone: string;
  role: UserRole;
  status: UserStatus;
  verified: boolean;
  rating: number;
  jobs: number;
  city: string;
  joinedAt: number;
  /** Artisans: the featured badge (completed jobs counted by Cloud Functions). */
  featured?: boolean;
  suspendReason?: string;
  /** Artisans: the services (category ids) on their profile now. */
  services?: string[];
}

export interface VerificationItem {
  id: string;
  artisanId: string;
  name: string;
  category: string;
  submittedAt: number;
  status: 'pending' | 'approved' | 'rejected';
  phone?: string;
  /** Every category the artisan listed (`category` is the first). */
  categoryIds?: string[];
  /** False until the artisan sends their ID / certificates. */
  hasDocuments?: boolean;
  /** Names of the photos under verificationRequests/{id}/files, in order. */
  files?: string[];
  /** Photos from the older Storage-based flow, by name. */
  legacyUrls?: Record<string, string>;
  /** Why it was rejected (shown to the artisan). */
  rejectReason?: string;
}

export interface AdminRequest {
  id: string;
  title: string;
  customer: string;
  category: string;
  status: 'PENDING' | 'ACCEPTED' | 'ON_THE_WAY' | 'WORKING' | 'COMPLETED' | 'CANCELLED';
  offers: number;
  createdAt: number;
}

export type PartyRole = 'customer' | 'artisan';

/** A complaint about a person (target set) or a general problem report. */
export interface Complaint {
  id: string;
  reporter: string;
  reporterId?: string;
  reporterRole?: PartyRole;
  reporterPhone?: string;
  /** Empty for a general problem report. */
  target: string;
  targetId?: string;
  targetRole?: PartyRole;
  targetPhone?: string;
  requestTitle?: string;
  /** A reason code (lib/feedback.ts), or free text on reports sent by older app versions. */
  reason: string;
  details?: string;
  adminNote?: string;
  status: 'open' | 'reviewing' | 'resolved' | 'dismissed';
  createdAt: number;
}

/** A service a customer or artisan asked the app to offer. */
export interface Suggestion {
  id: string;
  name: string;
  details?: string;
  author: string;
  authorRole?: PartyRole;
  authorPhone?: string;
  status: 'new' | 'reviewed' | 'added' | 'declined';
  createdAt: number;
}

const day = 864e5;
const rnd = (a: number, b: number) => Math.floor(a + Math.random() * (b - a));

const FIRST = ['عمر', 'ليلى', 'يوسف', 'حسان', 'طارق', 'سارة', 'خالد', 'نورا', 'فيصل', 'هدى', 'أحمد', 'ريم'];
const LAST = ['خالد', 'ناصر', 'علي', 'منصور', 'عودة', 'حمدان', 'زهران', 'قاسم'];
const CITIES = ['رام الله', 'نابلس', 'الخليل', 'بيت لحم', 'جنين', 'طولكرم'];
const CATS = ['سباكة', 'كهرباء', 'تكييف', 'تنظيف', 'نجارة', 'دهان', 'نقل عفش', 'بستنة'];
const name = () => `${FIRST[rnd(0, FIRST.length)]} ${LAST[rnd(0, LAST.length)]}`;

const DEMO_SERVICES = ['plumbing', 'electrical', 'carpentry', 'ac', 'painting', 'cleaning', 'repair', 'appliance'];

export const USERS: AdminUser[] = Array.from({ length: 48 }).map((_, i) => {
  const role: UserRole = i % 3 === 0 ? 'artisan' : 'customer';
  const n = name();
  return {
    uid: `u_${i + 1}`,
    fullName: n,
    phone: `+97059${String(1000000 + i * 7919).slice(-7)}`,
    role,
    status: (['active', 'active', 'active', 'suspended', 'pending'] as UserStatus[])[rnd(0, 5)],
    verified: role === 'artisan' ? Math.random() > 0.35 : true,
    rating: Number((3.8 + Math.random() * 1.2).toFixed(1)),
    jobs: role === 'artisan' ? rnd(5, 320) : rnd(1, 40),
    city: CITIES[rnd(0, CITIES.length)],
    joinedAt: Date.now() - rnd(1, 400) * day,
    services: role === 'artisan' ? DEMO_SERVICES.filter((_, k) => (i + k) % 4 === 0) : undefined,
  };
});

export const VERIFICATIONS: VerificationItem[] = Array.from({ length: 8 }).map((_, i) => ({
  id: `v_${i + 1}`,
  artisanId: `u_${rnd(1, 48)}`,
  name: name(),
  category: CATS[rnd(0, CATS.length)],
  submittedAt: Date.now() - rnd(1, 20) * day,
  status: 'pending',
}));

export const REQUESTS: AdminRequest[] = Array.from({ length: 40 }).map((_, i) => ({
  id: `r_${i + 1}`,
  title: `طلب خدمة ${CATS[rnd(0, CATS.length)]}`,
  customer: name(),
  category: CATS[rnd(0, CATS.length)],
  status: (['PENDING', 'ACCEPTED', 'ON_THE_WAY', 'WORKING', 'COMPLETED', 'CANCELLED'] as AdminRequest['status'][])[rnd(0, 6)],
  offers: rnd(0, 8),
  createdAt: Date.now() - rnd(0, 30) * day,
}));

const phone = () => `+97059${rnd(1000000, 9999999)}`;

export const COMPLAINTS: Complaint[] = Array.from({ length: 7 }).map((_, i) => {
  const aboutArtisan = i % 3 !== 1;
  const general = i === 5;
  const target = name();
  return {
    id: `c_${i + 1}`,
    reporter: name(),
    reporterRole: aboutArtisan ? 'customer' : 'artisan',
    reporterPhone: phone(),
    target: general ? '' : target,
    targetId: general ? undefined : `u_${(i % 2) + 1}`,
    targetRole: general ? undefined : aboutArtisan ? 'artisan' : 'customer',
    targetPhone: general ? undefined : phone(),
    requestTitle: general ? undefined : ['تصليح تسريب بالمطبخ', 'تمديد كهرباء للصالون', 'دهان غرفة نوم'][i % 3],
    reason: general ? 'app_issue' : aboutArtisan ? ['no_show', 'overcharged', 'poor_quality'][i % 3] : 'refused_pay',
    details: 'تفاصيل الشكوى كما كتبها المستخدم في التطبيق.',
    status: (['open', 'open', 'resolved', 'open', 'dismissed', 'open', 'resolved'] as Complaint['status'][])[i],
    createdAt: Date.now() - rnd(1, 15) * day,
  };
});

export const SUGGESTIONS: Suggestion[] = [
  ['تنظيف خزانات المياه', 'customer', 'new'],
  ['تنظيف الخزانات', 'customer', 'new'],
  ['تركيب كاميرات مراقبة', 'artisan', 'new'],
  ['صيانة طاقة شمسية', 'customer', 'reviewed'],
  ['تنظيف خزانات مياه', 'artisan', 'new'],
  ['صيانة أبواب ألمنيوم', 'customer', 'added'],
  ['تصليح غسالات', 'customer', 'declined'],
].map(([n, role, status], i) => ({
  id: `s_${i + 1}`,
  name: n,
  details: i % 2 ? '' : 'بحتاج حدا يعمل هالشغلة وما لقيتها بالتطبيق.',
  author: name(),
  authorRole: role as Suggestion['authorRole'],
  authorPhone: phone(),
  status: status as Suggestion['status'],
  createdAt: Date.now() - rnd(1, 20) * day,
}));

// ── Aggregates for charts ────────────────────────────────────────────────────
export const REVENUE_SERIES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((m, i) => ({
  month: m,
  revenue: rnd(40, 120) * 1000 + i * 4000,
  requests: rnd(200, 600),
}));

export const CATEGORY_SPLIT = CATS.map((c) => ({ name: c, value: rnd(40, 260) }));

export const REQUESTS_BY_STATUS = [
  { status: 'Pending', value: 32, color: '#F59E0B' },
  { status: 'Active', value: 58, color: '#3B82F6' },
  { status: 'Completed', value: 214, color: '#10B981' },
  { status: 'Cancelled', value: 12, color: '#EF4444' },
];

export const KPIS = {
  revenue: 1284000_00,
  users: 4820,
  artisans: 1240,
  requests: 8630,
  revenueDelta: 18.4,
  usersDelta: 9.2,
  artisansDelta: 12.1,
  requestsDelta: -3.4,
};

export const ACTIVITY = [
  { id: 1, text: 'New artisan verification submitted by Omar Khalid', time: Date.now() - 12 * 6e4, type: 'verify' },
  { id: 2, text: 'Complaint resolved: overcharge dispute #c_2', time: Date.now() - 55 * 6e4, type: 'complaint' },
  { id: 3, text: 'Tariq Mansour subscribed to the 1-year plan', time: Date.now() - 3 * 36e5, type: 'subscription' },
  { id: 4, text: '320 new requests created today', time: Date.now() - 5 * 36e5, type: 'request' },
  { id: 5, text: 'Category "Satellite" added to catalog', time: Date.now() - 26 * 36e5, type: 'category' },
];
