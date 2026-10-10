import type {
  AppUser,
  ArtisanProfile,
  Offer,
  Review,
  Service,
  ServiceRequest,
  ChatMessage,
} from '@/types';
import { CATEGORIES } from '@/constants/categories';
import { SERVICES } from '@/constants/services';

const now = Date.now();
const mins = (m: number) => now - m * 60_000;

// ── Users ────────────────────────────────────────────────────────────────────
export const MOCK_CUSTOMER: AppUser = {
  uid: 'cust_1',
  role: 'customer',
  fullName: 'ليلى خالد',
  email: 'layla@example.com',
  phone: '+970590000001',
  photoUrl: undefined,
  location: { latitude: 31.9038, longitude: 35.2034, geohash: 'sv9hv', address: 'الماصيون، رام الله' },
  locale: 'ar',
  status: 'active',
  verified: true,
  rating: 4.9,
  ratingCount: 12,
  createdAt: mins(60 * 24 * 90),
  updatedAt: now,
};

// Customers from the demo artisan's past jobs (work history, conversations).
const pastCustomer = (uid: string, fullName: string, address: string, latitude: number, longitude: number): AppUser => ({
  uid, role: 'customer', fullName, email: `${uid}@example.com`, phone: '+97059000000' + uid.slice(-1),
  location: { latitude, longitude, geohash: 'sv9hv', address },
  locale: 'ar', status: 'active', verified: true, rating: 4.7, ratingCount: 6, createdAt: mins(99999), updatedAt: now,
});

export const MOCK_PAST_CUSTOMERS: AppUser[] = [
  pastCustomer('cust_2', 'أحمد سليم', 'البيرة', 31.9106, 35.2160),
  pastCustomer('cust_3', 'رنا عودة', 'الطيرة، رام الله', 31.9000, 35.1900),
  pastCustomer('cust_4', 'محمود حمدان', 'المصايف، رام الله', 31.9120, 35.1950),
];

export const MOCK_ARTISANS: AppUser[] = [
  { uid: 'art_1', role: 'artisan', fullName: 'عمر خالد', email: 'omar@example.com', phone: '+970590000010', photoUrl: 'https://i.pravatar.cc/300?img=12', locale: 'ar', status: 'active', verified: true, rating: 4.8, ratingCount: 214, location: { latitude: 31.9075, longitude: 35.1997, geohash: 'sv9hv', address: 'رام الله' }, createdAt: mins(99999), updatedAt: now },
  { uid: 'art_2', role: 'artisan', fullName: 'يوسف ناصر', email: 'yousef@example.com', phone: '+970590000011', photoUrl: 'https://i.pravatar.cc/300?img=33', locale: 'ar', status: 'active', verified: true, rating: 4.6, ratingCount: 88, location: { latitude: 31.9106, longitude: 35.2160, geohash: 'sv9hv', address: 'البيرة' }, createdAt: mins(99999), updatedAt: now },
  { uid: 'art_3', role: 'artisan', fullName: 'حسان علي', email: 'hassan@example.com', phone: '+970590000012', photoUrl: 'https://i.pravatar.cc/300?img=15', locale: 'ar', status: 'active', verified: false, rating: 4.4, ratingCount: 41, location: { latitude: 31.8996, longitude: 35.2042, geohash: 'sv9hv', address: 'رام الله' }, createdAt: mins(99999), updatedAt: now },
  { uid: 'art_4', role: 'artisan', fullName: 'طارق منصور', email: 'tariq@example.com', phone: '+970590000013', photoUrl: 'https://i.pravatar.cc/300?img=8', locale: 'ar', status: 'active', verified: true, rating: 4.9, ratingCount: 302, location: { latitude: 31.9152, longitude: 35.2071, geohash: 'sv9hv', address: 'رام الله' }, createdAt: mins(99999), updatedAt: now },
];

export const MOCK_ARTISAN_PROFILE: ArtisanProfile = {
  uid: 'art_1',
  bio: 'سبّاك معتمد بخبرة 12 عاماً. عمل سريع ونظيف ومضمون.',
  serviceIds: ['plumbing'],
  categoryIds: ['plumbing'],
  availability: { days: [0, 1, 2, 3, 4], from: '08:00', to: '20:00' },
  gallery: [
    'https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=600',
    'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600',
  ],
  certificates: [{ name: 'رخصة سباكة معتمدة', url: '', verified: true }],
  verificationStatus: 'approved',
  premium: true,
  completedJobs: 214,
  rating: 4.8,
  ratingCount: 214,
};

// ── Services (2 per category = 24) ───────────────────────────────────────────
// One general service per category — see constants/services.
export const MOCK_SERVICES: Service[] = SERVICES;

// ── Requests ─────────────────────────────────────────────────────────────────
function pastJob(
  id: string,
  customerId: string,
  title: string,
  description: string,
  outcome: Pick<ServiceRequest, 'status' | 'acceptedOfferId' | 'acceptedArtisanId'>,
  createdMinsAgo: number,
  closedMinsAgo: number,
): ServiceRequest {
  const customer = MOCK_PAST_CUSTOMERS.find((c) => c.uid === customerId)!;
  return {
    id, customerId, serviceId: 'plumbing', categoryId: 'plumbing', title, description, images: [],
    location: customer.location!, preferredTime: mins(createdMinsAgo - 120), budget: { min: 8000, max: 40000 },
    offerCount: 3, createdAt: mins(createdMinsAgo), updatedAt: mins(closedMinsAgo),
    ...(outcome.status === 'COMPLETED' ? { completedAt: mins(closedMinsAgo) } : {}),
    ...outcome,
  };
}

export const MOCK_REQUESTS: ServiceRequest[] = [
  {
    id: 'req_1',
    customerId: 'cust_1',
    serviceId: 'plumbing',
    categoryId: 'plumbing',
    title: 'تسريب في مغسلة المطبخ',
    description: 'يوجد تسريب ماء تحت مغسلة المطبخ ويزداد منذ الأمس.',
    images: ['https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=600'],
    location: MOCK_CUSTOMER.location!,
    preferredTime: now + 3600_000 * 3,
    budget: { min: 8000, max: 20000 },
    status: 'PENDING',
    offerCount: 3,
    createdAt: mins(45),
    updatedAt: mins(10),
  },
  {
    id: 'req_2',
    customerId: 'cust_1',
    serviceId: 'ac',
    categoryId: 'ac',
    title: 'المكيّف لا يبرّد',
    description: 'مكيّف الصالون يعمل لكن الهواء غير بارد.',
    images: [],
    location: MOCK_CUSTOMER.location!,
    preferredTime: now + 3600_000 * 24,
    budget: { min: 15000, max: 40000 },
    status: 'ACCEPTED',
    acceptedOfferId: 'off_10',
    acceptedArtisanId: 'art_4',
    offerCount: 5,
    createdAt: mins(60 * 26),
    updatedAt: mins(120),
  },
  {
    id: 'req_3',
    customerId: 'cust_1',
    serviceId: 'cleaning',
    categoryId: 'cleaning',
    title: 'تنظيف شامل لشقة 3 غرف',
    description: 'تنظيف عميق قبل الإخلاء، مطبخ + حمّامان.',
    images: [],
    location: MOCK_CUSTOMER.location!,
    preferredTime: now - 3600_000 * 48,
    budget: { min: 25000, max: 45000 },
    status: 'COMPLETED',
    acceptedArtisanId: 'art_2',
    offerCount: 4,
    createdAt: mins(60 * 24 * 5),
    updatedAt: mins(60 * 24 * 4),
  },
  {
    // Active job between the demo accounts (Layla ↔ Omar): Omar can mark it on
    // the way → working → finished, and both can chat about it.
    id: 'req_5',
    customerId: 'cust_1',
    serviceId: 'plumbing',
    categoryId: 'plumbing',
    title: 'تركيب سخان ماء',
    description: 'سخان كهربائي جديد بحاجة لتركيب في الحمّام مع توصيل المواسير.',
    images: [],
    location: MOCK_CUSTOMER.location!,
    preferredTime: now + 3600_000 * 5,
    budget: { min: 15000, max: 30000 },
    status: 'ACCEPTED',
    acceptedOfferId: 'off_5',
    acceptedArtisanId: 'art_1',
    offerCount: 3,
    createdAt: mins(60 * 6),
    updatedAt: mins(40),
  },
  {
    // Finished job between the two demo accounts (Layla ↔ Omar) that neither
    // side has rated yet — signing in as either one opens the mandatory review.
    id: 'req_4',
    customerId: 'cust_1',
    serviceId: 'plumbing',
    categoryId: 'plumbing',
    title: 'تبديل خلاط الحمّام',
    description: 'الخلاط القديم يسرّب ماء ونحتاج تركيب خلاط جديد.',
    images: [],
    location: MOCK_CUSTOMER.location!,
    preferredTime: now - 3600_000 * 30,
    budget: { min: 10000, max: 25000 },
    status: 'COMPLETED',
    acceptedOfferId: 'off_4',
    acceptedArtisanId: 'art_1',
    offerCount: 2,
    completedAt: mins(60 * 26),
    createdAt: mins(60 * 24 * 2),
    updatedAt: mins(60 * 26),
  },
  // ── Omar's (art_1) past work: three finished jobs and three offers that
  // didn't go through. Shown in his income history. ──────────────────────────
  pastJob('req_w', 'cust_4', 'تمديد مواسير مطبخ جديد', 'نقل المغسلة للجهة الثانية من المطبخ وتمديد مواسير جديدة لها.', { status: 'COMPLETED', acceptedOfferId: 'off_w', acceptedArtisanId: 'art_1' }, 60 * 24 * 5, 60 * 24 * 4),
  pastJob('req_x', 'cust_2', 'تسليك مجاري الحمّام', 'المياه بتنزل ببطء في البانيو والمغسلة.', { status: 'COMPLETED', acceptedOfferId: 'off_x', acceptedArtisanId: 'art_1' }, 60 * 24 * 13, 60 * 24 * 12),
  pastJob('req_y', 'cust_3', 'إصلاح خزان ماء على السطح', 'العوّامة خربانة والخزان بفيض.', { status: 'COMPLETED', acceptedOfferId: 'off_y', acceptedArtisanId: 'art_1' }, 60 * 24 * 21, 60 * 24 * 20),
  pastJob('req_r1', 'cust_2', 'تركيب مغسلة جديدة', 'مغسلة حمّام جديدة مع الخلاط.', { status: 'COMPLETED', acceptedArtisanId: 'art_3' }, 60 * 24 * 9, 60 * 24 * 8),
  pastJob('req_r2', 'cust_3', 'فحص تسريب في الجدار', 'في رطوبة بالجدار جنب الحمّام.', { status: 'CANCELLED' }, 60 * 24 * 16, 60 * 24 * 15),
  pastJob('req_r3', 'cust_4', 'تبديل سيفون المرحاض', 'السيفون ما بوقف تعبئة.', { status: 'COMPLETED', acceptedArtisanId: 'art_2' }, 60 * 24 * 30, 60 * 24 * 29),
];


// ── Offers ───────────────────────────────────────────────────────────────────
const artisanSnap = (a: AppUser) => ({
  uid: a.uid,
  fullName: a.fullName,
  photoUrl: a.photoUrl,
  rating: a.rating,
  ratingCount: a.ratingCount,
});

export const MOCK_OFFERS: Offer[] = [
  { id: 'off_1', requestId: 'req_1', artisanId: 'art_1', customerId: 'cust_1', price: 12000, etaMinutes: 40, message: 'أقدر أوصل خلال ساعة، السعر نهائي شامل القطع.', status: 'PENDING', createdAt: mins(30), artisan: artisanSnap(MOCK_ARTISANS[0]) },
  { id: 'off_2', requestId: 'req_1', artisanId: 'art_4', customerId: 'cust_1', price: 15000, etaMinutes: 25, message: 'خدمة مميّزة مع ضمان 6 أشهر على الإصلاح.', status: 'PENDING', createdAt: mins(22), artisan: artisanSnap(MOCK_ARTISANS[3]) },
  { id: 'off_3', requestId: 'req_1', artisanId: 'art_3', customerId: 'cust_1', price: 9000, etaMinutes: 90, message: 'أفضل سعر بالمنطقة، متاح مساء اليوم.', status: 'PENDING', createdAt: mins(12), artisan: artisanSnap(MOCK_ARTISANS[2]) },
  // Omar's accepted offers (his current and finished jobs)…
  { id: 'off_5', requestId: 'req_5', artisanId: 'art_1', customerId: 'cust_1', price: 22000, etaMinutes: 45, message: 'التركيب مع توصيل المواسير وفحص الضغط.', status: 'ACCEPTED', createdAt: mins(60 * 5), artisan: artisanSnap(MOCK_ARTISANS[0]) },
  { id: 'off_4', requestId: 'req_4', artisanId: 'art_1', customerId: 'cust_1', price: 18000, etaMinutes: 30, message: 'السعر شامل الخلاط الجديد والتركيب.', status: 'ACCEPTED', createdAt: mins(60 * 47), artisan: artisanSnap(MOCK_ARTISANS[0]) },
  { id: 'off_w', requestId: 'req_w', artisanId: 'art_1', customerId: 'cust_4', price: 35000, etaMinutes: 60, message: 'المواسير والقطع عليّ، الشغل بخلص بنفس اليوم.', status: 'ACCEPTED', createdAt: mins(60 * 24 * 5 - 30), artisan: artisanSnap(MOCK_ARTISANS[0]) },
  { id: 'off_x', requestId: 'req_x', artisanId: 'art_1', customerId: 'cust_2', price: 15000, etaMinutes: 40, status: 'ACCEPTED', createdAt: mins(60 * 24 * 13 - 20), artisan: artisanSnap(MOCK_ARTISANS[0]) },
  { id: 'off_y', requestId: 'req_y', artisanId: 'art_1', customerId: 'cust_3', price: 26000, etaMinutes: 90, message: 'بجيب عوّامة جديدة معي.', status: 'ACCEPTED', createdAt: mins(60 * 24 * 21 - 45), artisan: artisanSnap(MOCK_ARTISANS[0]) },
  // …and the ones that were turned down.
  { id: 'off_r1', requestId: 'req_r1', artisanId: 'art_1', customerId: 'cust_2', price: 20000, etaMinutes: 45, message: 'بقدر أركّبها اليوم مساءً.', status: 'REJECTED', createdAt: mins(60 * 24 * 9 - 30), requestTitle: 'تركيب مغسلة جديدة', categoryId: 'plumbing', artisan: artisanSnap(MOCK_ARTISANS[0]) },
  { id: 'off_r2', requestId: 'req_r2', artisanId: 'art_1', customerId: 'cust_3', price: 12000, etaMinutes: 30, status: 'REJECTED', createdAt: mins(60 * 24 * 16 - 40), requestTitle: 'فحص تسريب في الجدار', categoryId: 'plumbing', artisan: artisanSnap(MOCK_ARTISANS[0]) },
  { id: 'off_r3', requestId: 'req_r3', artisanId: 'art_1', customerId: 'cust_4', price: 9000, etaMinutes: 60, message: 'معي سيفون أصلي بضمان سنة.', status: 'REJECTED', createdAt: mins(60 * 24 * 30 - 25), requestTitle: 'تبديل سيفون المرحاض', categoryId: 'plumbing', artisan: artisanSnap(MOCK_ARTISANS[0]) },
];

// ── Reviews ──────────────────────────────────────────────────────────────────
export const MOCK_REVIEWS: Review[] = [
  { id: 'rev_1', requestId: 'req_w', authorId: 'cust_4', targetId: 'art_1', role: 'customer', rating: 5, comment: 'محترف جداً وملتزم بالوقت. أنصح فيه بشدة!', createdAt: mins(60 * 24 * 4) },
  { id: 'rev_2', requestId: 'req_x', authorId: 'cust_2', targetId: 'art_1', role: 'customer', rating: 5, comment: 'صلّح المشكلة بسرعة وترك المكان نظيفاً تماماً.', createdAt: mins(60 * 24 * 12) },
  { id: 'rev_3', requestId: 'req_y', authorId: 'cust_3', targetId: 'art_1', role: 'customer', rating: 4, comment: 'شغل ممتاز، تأخر قليلاً لكن النتيجة رائعة.', createdAt: mins(60 * 24 * 20) },
  // Layla already rated the cleaning job (req_3), so it doesn't reopen the review.
  { id: 'rev_4', requestId: 'req_3', authorId: 'cust_1', targetId: 'art_2', role: 'customer', rating: 5, comment: 'تنظيف ممتاز ودقيق.', createdAt: mins(60 * 24 * 4) },
  // Omar rated the customers of his past jobs, so they don't reopen his review.
  { id: 'rev_5', requestId: 'req_w', authorId: 'art_1', targetId: 'cust_4', role: 'artisan', rating: 5, comment: 'زبون محترم وواضح.', createdAt: mins(60 * 24 * 4) },
  { id: 'rev_6', requestId: 'req_x', authorId: 'art_1', targetId: 'cust_2', role: 'artisan', rating: 5, comment: '', createdAt: mins(60 * 24 * 12) },
  { id: 'rev_7', requestId: 'req_y', authorId: 'art_1', targetId: 'cust_3', role: 'artisan', rating: 4, comment: '', createdAt: mins(60 * 24 * 20) },
];

// ── Chat ─────────────────────────────────────────────────────────────────────
export const MOCK_MESSAGES: ChatMessage[] = [
  { id: 'm1', requestId: 'req_2', senderId: 'art_4', type: 'text', text: 'مرحباً! قبلت طلب المكيّف، بوصل خلال 25 دقيقة تقريباً.', read: true, createdAt: mins(115) },
  { id: 'm2', requestId: 'req_2', senderId: 'cust_1', type: 'text', text: 'ممتاز، شكراً! المكيّف في الصالون.', read: true, createdAt: mins(112) },
  { id: 'm3', requestId: 'req_2', senderId: 'art_4', type: 'text', text: 'تمام. رجاءً أبقي المكيّف مطفأ لحين وصولي.', read: true, createdAt: mins(110) },
  { id: 'm4', requestId: 'req_5', senderId: 'art_1', type: 'text', text: 'أهلاً، السخان موجود عندك ولا أجيبه معي؟', read: true, createdAt: mins(38) },
  { id: 'm5', requestId: 'req_5', senderId: 'cust_1', type: 'text', text: 'موجود، اشتريته امبارح.', read: false, createdAt: mins(35) },
  { id: 'm6', requestId: 'req_4', senderId: 'art_1', type: 'text', text: 'تم تركيب الخلاط وفحصه، ما في أي تسريب.', read: true, createdAt: mins(60 * 26 + 5) },
  { id: 'm7', requestId: 'req_4', senderId: 'cust_1', type: 'text', text: 'شكراً كثير، شغل نظيف!', read: true, createdAt: mins(60 * 26) },
  { id: 'm8', requestId: 'req_w', senderId: 'cust_4', type: 'text', text: 'المواسير شغالة تمام، يعطيك العافية.', read: true, createdAt: mins(60 * 24 * 4) },
  { id: 'm9', requestId: 'req_x', senderId: 'art_1', type: 'text', text: 'خلصت التسليك، جرّب المي هلأ.', read: true, createdAt: mins(60 * 24 * 12) },
  { id: 'm10', requestId: 'req_y', senderId: 'cust_3', type: 'text', text: 'الخزان صار تمام، شكراً.', read: true, createdAt: mins(60 * 24 * 20) },
];
