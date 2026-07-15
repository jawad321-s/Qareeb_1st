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

export const MOCK_ARTISANS: AppUser[] = [
  { uid: 'art_1', role: 'artisan', fullName: 'عمر خالد', email: 'omar@example.com', phone: '+970590000010', photoUrl: 'https://i.pravatar.cc/300?img=12', locale: 'ar', status: 'active', verified: true, rating: 4.8, ratingCount: 214, location: { latitude: 31.9075, longitude: 35.1997, geohash: 'sv9hv', address: 'رام الله' }, createdAt: mins(99999), updatedAt: now },
  { uid: 'art_2', role: 'artisan', fullName: 'يوسف ناصر', email: 'yousef@example.com', phone: '+970590000011', photoUrl: 'https://i.pravatar.cc/300?img=33', locale: 'ar', status: 'active', verified: true, rating: 4.6, ratingCount: 88, location: { latitude: 31.9106, longitude: 35.2160, geohash: 'sv9hv', address: 'البيرة' }, createdAt: mins(99999), updatedAt: now },
  { uid: 'art_3', role: 'artisan', fullName: 'حسان علي', email: 'hassan@example.com', phone: '+970590000012', photoUrl: 'https://i.pravatar.cc/300?img=15', locale: 'ar', status: 'active', verified: false, rating: 4.4, ratingCount: 41, location: { latitude: 31.8996, longitude: 35.2042, geohash: 'sv9hv', address: 'رام الله' }, createdAt: mins(99999), updatedAt: now },
  { uid: 'art_4', role: 'artisan', fullName: 'طارق منصور', email: 'tariq@example.com', phone: '+970590000013', photoUrl: 'https://i.pravatar.cc/300?img=8', locale: 'ar', status: 'active', verified: true, rating: 4.9, ratingCount: 302, location: { latitude: 31.9152, longitude: 35.2071, geohash: 'sv9hv', address: 'رام الله' }, createdAt: mins(99999), updatedAt: now },
];

export const MOCK_ARTISAN_PROFILE: ArtisanProfile = {
  uid: 'art_1',
  bio: 'سبّاك معتمد بخبرة 12 عاماً. عمل سريع ونظيف ومضمون.',
  serviceIds: ['plumbing_leak', 'plumbing_install'],
  categoryIds: ['plumbing', 'maintenance'],
  serviceRadiusKm: 15,
  basePrices: { plumbing_leak: 12000, plumbing_install: 25000 },
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
export const MOCK_SERVICES: Service[] = CATEGORIES.flatMap((cat) => [
  {
    id: `${cat.id}_repair`,
    categoryId: cat.id,
    name: { ar: `إصلاح ${cat.name.ar}`, en: `${cat.name.en} Repair` },
    description: { ar: 'خدمة إصلاح احترافية سريعة', en: 'Fast professional repair service' },
    icon: cat.icon,
    basePriceFrom: 8000 + cat.order * 1000,
    active: true,
    popular: cat.order <= 6,
  },
  {
    id: `${cat.id}_install`,
    categoryId: cat.id,
    name: { ar: `تركيب ${cat.name.ar}`, en: `${cat.name.en} Installation` },
    description: { ar: 'تركيب وتجهيز بضمان', en: 'Installation & setup with warranty' },
    icon: cat.icon,
    basePriceFrom: 15000 + cat.order * 1200,
    active: true,
    popular: cat.order <= 3,
  },
]);

// ── Requests ─────────────────────────────────────────────────────────────────
export const MOCK_REQUESTS: ServiceRequest[] = [
  {
    id: 'req_1',
    customerId: 'cust_1',
    serviceId: 'plumbing_repair',
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
    serviceId: 'ac_repair',
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
    serviceId: 'cleaning_repair',
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
];

// ── Reviews ──────────────────────────────────────────────────────────────────
export const MOCK_REVIEWS: Review[] = [
  { id: 'rev_1', requestId: 'req_3', authorId: 'cust_1', targetId: 'art_1', role: 'customer', rating: 5, comment: 'محترف جداً وملتزم بالوقت. أنصح فيه بشدة!', createdAt: mins(60 * 24 * 4) },
  { id: 'rev_2', requestId: 'req_x', authorId: 'cust_2', targetId: 'art_1', role: 'customer', rating: 5, comment: 'صلّح المشكلة بسرعة وترك المكان نظيفاً تماماً.', createdAt: mins(60 * 24 * 12) },
  { id: 'rev_3', requestId: 'req_y', authorId: 'cust_3', targetId: 'art_1', role: 'customer', rating: 4, comment: 'شغل ممتاز، تأخر قليلاً لكن النتيجة رائعة.', createdAt: mins(60 * 24 * 20) },
];

// ── Chat ─────────────────────────────────────────────────────────────────────
export const MOCK_MESSAGES: ChatMessage[] = [
  { id: 'm1', senderId: 'art_4', type: 'text', text: 'مرحباً! قبلت طلب المكيّف، بوصل خلال 25 دقيقة تقريباً.', read: true, createdAt: mins(115) },
  { id: 'm2', senderId: 'cust_1', type: 'text', text: 'ممتاز، شكراً! المكيّف في الصالون.', read: true, createdAt: mins(112) },
  { id: 'm3', senderId: 'art_4', type: 'text', text: 'تمام. رجاءً أبقي المكيّف مطفأ لحين وصولي.', read: true, createdAt: mins(110) },
];
