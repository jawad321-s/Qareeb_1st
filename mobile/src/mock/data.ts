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
  fullName: 'Layla Al-Harbi',
  email: 'layla@example.com',
  phone: '+966500000001',
  photoUrl: undefined,
  location: { latitude: 24.7136, longitude: 46.6753, geohash: 'sv8wr', address: 'Al Olaya, Riyadh' },
  locale: 'ar',
  status: 'active',
  verified: true,
  rating: 4.9,
  ratingCount: 12,
  createdAt: mins(60 * 24 * 90),
  updatedAt: now,
};

export const MOCK_ARTISANS: AppUser[] = [
  { uid: 'art_1', role: 'artisan', fullName: 'Omar Khalid', email: 'omar@example.com', phone: '+966500000010', photoUrl: 'https://i.pravatar.cc/300?img=12', locale: 'ar', status: 'active', verified: true, rating: 4.8, ratingCount: 214, location: { latitude: 24.71, longitude: 46.67, geohash: 'sv8wr', address: 'Riyadh' }, createdAt: mins(99999), updatedAt: now },
  { uid: 'art_2', role: 'artisan', fullName: 'Yousef Nasser', email: 'yousef@example.com', phone: '+966500000011', photoUrl: 'https://i.pravatar.cc/300?img=33', locale: 'ar', status: 'active', verified: true, rating: 4.6, ratingCount: 88, location: { latitude: 24.72, longitude: 46.68, geohash: 'sv8wr', address: 'Riyadh' }, createdAt: mins(99999), updatedAt: now },
  { uid: 'art_3', role: 'artisan', fullName: 'Hassan Ali', email: 'hassan@example.com', phone: '+966500000012', photoUrl: 'https://i.pravatar.cc/300?img=15', locale: 'ar', status: 'active', verified: false, rating: 4.4, ratingCount: 41, location: { latitude: 24.70, longitude: 46.66, geohash: 'sv8wr', address: 'Riyadh' }, createdAt: mins(99999), updatedAt: now },
  { uid: 'art_4', role: 'artisan', fullName: 'Tariq Mansour', email: 'tariq@example.com', phone: '+966500000013', photoUrl: 'https://i.pravatar.cc/300?img=8', locale: 'ar', status: 'active', verified: true, rating: 4.9, ratingCount: 302, location: { latitude: 24.73, longitude: 46.69, geohash: 'sv8wr', address: 'Riyadh' }, createdAt: mins(99999), updatedAt: now },
];

export const MOCK_ARTISAN_PROFILE: ArtisanProfile = {
  uid: 'art_1',
  bio: 'Licensed master plumber with 12 years of experience. Fast, clean, and guaranteed work.',
  serviceIds: ['plumbing_leak', 'plumbing_install'],
  categoryIds: ['plumbing', 'maintenance'],
  serviceRadiusKm: 15,
  basePrices: { plumbing_leak: 12000, plumbing_install: 25000 },
  availability: { days: [0, 1, 2, 3, 4], from: '08:00', to: '20:00' },
  gallery: [
    'https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=600',
    'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600',
  ],
  certificates: [{ name: 'Master Plumber License', url: '', verified: true }],
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
    title: 'Kitchen sink leaking',
    description: 'Water leaking under the kitchen sink, getting worse since yesterday.',
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
    title: 'AC not cooling',
    description: 'Living room split unit runs but blows warm air.',
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
    title: 'Deep clean 3BR apartment',
    description: 'Move-out deep cleaning, kitchen + 2 bathrooms.',
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
  { id: 'off_1', requestId: 'req_1', artisanId: 'art_1', customerId: 'cust_1', price: 12000, etaMinutes: 40, message: 'Can be there within the hour, fixed price includes parts.', status: 'PENDING', createdAt: mins(30), artisan: artisanSnap(MOCK_ARTISANS[0]) },
  { id: 'off_2', requestId: 'req_1', artisanId: 'art_4', customerId: 'cust_1', price: 15000, etaMinutes: 25, message: 'Premium service, 6-month warranty on the repair.', status: 'PENDING', createdAt: mins(22), artisan: artisanSnap(MOCK_ARTISANS[3]) },
  { id: 'off_3', requestId: 'req_1', artisanId: 'art_3', customerId: 'cust_1', price: 9000, etaMinutes: 90, message: 'Best price in the area, available this evening.', status: 'PENDING', createdAt: mins(12), artisan: artisanSnap(MOCK_ARTISANS[2]) },
];

// ── Reviews ──────────────────────────────────────────────────────────────────
export const MOCK_REVIEWS: Review[] = [
  { id: 'rev_1', requestId: 'req_3', authorId: 'cust_1', targetId: 'art_1', role: 'customer', rating: 5, comment: 'Extremely professional and punctual. Highly recommend!', createdAt: mins(60 * 24 * 4) },
  { id: 'rev_2', requestId: 'req_x', authorId: 'cust_2', targetId: 'art_1', role: 'customer', rating: 5, comment: 'Fixed the issue quickly and left everything spotless.', createdAt: mins(60 * 24 * 12) },
  { id: 'rev_3', requestId: 'req_y', authorId: 'cust_3', targetId: 'art_1', role: 'customer', rating: 4, comment: 'Good work, arrived a little late but did a great job.', createdAt: mins(60 * 24 * 20) },
];

// ── Chat ─────────────────────────────────────────────────────────────────────
export const MOCK_MESSAGES: ChatMessage[] = [
  { id: 'm1', senderId: 'art_4', type: 'text', text: 'Hi! I accepted your AC request. On my way in ~25 min.', read: true, createdAt: mins(115) },
  { id: 'm2', senderId: 'cust_1', type: 'text', text: 'Perfect, thank you! The unit is in the living room.', read: true, createdAt: mins(112) },
  { id: 'm3', senderId: 'art_4', type: 'text', text: 'Got it. Please keep the AC off until I arrive.', read: true, createdAt: mins(110) },
];
