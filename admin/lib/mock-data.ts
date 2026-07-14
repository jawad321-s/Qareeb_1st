// Mock data powering the admin dashboard (mirrors the Firestore schema).
// Swap these getters for Firestore Admin SDK queries when wiring the backend.

export type UserRole = 'customer' | 'artisan' | 'admin';
export type UserStatus = 'active' | 'suspended' | 'pending';

export interface AdminUser {
  uid: string;
  fullName: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  verified: boolean;
  rating: number;
  jobs: number;
  city: string;
  joinedAt: number;
}

export interface VerificationItem {
  id: string;
  artisanId: string;
  name: string;
  category: string;
  submittedAt: number;
  status: 'pending' | 'approved' | 'rejected';
}

export interface AdminRequest {
  id: string;
  title: string;
  customer: string;
  category: string;
  status: 'PENDING' | 'ACCEPTED' | 'ON_THE_WAY' | 'WORKING' | 'COMPLETED' | 'CANCELLED';
  budgetMax: number;
  offers: number;
  createdAt: number;
}

export interface Complaint {
  id: string;
  reporter: string;
  target: string;
  reason: string;
  status: 'open' | 'reviewing' | 'resolved';
  createdAt: number;
}

const day = 864e5;
const rnd = (a: number, b: number) => Math.floor(a + Math.random() * (b - a));

const FIRST = ['Omar', 'Layla', 'Yousef', 'Hassan', 'Tariq', 'Sara', 'Khalid', 'Noura', 'Faisal', 'Huda', 'Ahmed', 'Reem'];
const LAST = ['Al-Harbi', 'Khalid', 'Nasser', 'Ali', 'Mansour', 'Al-Otaibi', 'Zahrani', 'Qahtani'];
const CITIES = ['Riyadh', 'Jeddah', 'Dammam', 'Mecca', 'Medina', 'Khobar'];
const CATS = ['Plumbing', 'Electrical', 'AC', 'Cleaning', 'Carpentry', 'Painting', 'Moving', 'Gardening'];
const name = () => `${FIRST[rnd(0, FIRST.length)]} ${LAST[rnd(0, LAST.length)]}`;

export const USERS: AdminUser[] = Array.from({ length: 48 }).map((_, i) => {
  const role: UserRole = i % 3 === 0 ? 'artisan' : 'customer';
  const n = name();
  return {
    uid: `u_${i + 1}`,
    fullName: n,
    email: `${n.split(' ')[0].toLowerCase()}${i}@qareeb.app`,
    role,
    status: (['active', 'active', 'active', 'suspended', 'pending'] as UserStatus[])[rnd(0, 5)],
    verified: role === 'artisan' ? Math.random() > 0.35 : true,
    rating: Number((3.8 + Math.random() * 1.2).toFixed(1)),
    jobs: role === 'artisan' ? rnd(5, 320) : rnd(1, 40),
    city: CITIES[rnd(0, CITIES.length)],
    joinedAt: Date.now() - rnd(1, 400) * day,
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
  title: `${CATS[rnd(0, CATS.length)]} service needed`,
  customer: name(),
  category: CATS[rnd(0, CATS.length)],
  status: (['PENDING', 'ACCEPTED', 'ON_THE_WAY', 'WORKING', 'COMPLETED', 'CANCELLED'] as AdminRequest['status'][])[rnd(0, 6)],
  budgetMax: rnd(100, 800) * 100,
  offers: rnd(0, 8),
  createdAt: Date.now() - rnd(0, 30) * day,
}));

export const COMPLAINTS: Complaint[] = Array.from({ length: 6 }).map((_, i) => ({
  id: `c_${i + 1}`,
  reporter: name(),
  target: name(),
  reason: ['No-show', 'Overcharged', 'Poor quality', 'Unprofessional', 'Safety concern'][rnd(0, 5)],
  status: (['open', 'reviewing', 'resolved'] as Complaint['status'][])[rnd(0, 3)],
  createdAt: Date.now() - rnd(1, 15) * day,
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
  { status: 'Active', value: 58, color: '#6366F1' },
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
  { id: 3, text: 'Tariq Mansour upgraded to Elite plan', time: Date.now() - 3 * 36e5, type: 'subscription' },
  { id: 4, text: '320 new requests created today', time: Date.now() - 5 * 36e5, type: 'request' },
  { id: 5, text: 'Category "Satellite" added to catalog', time: Date.now() - 26 * 36e5, type: 'category' },
];
