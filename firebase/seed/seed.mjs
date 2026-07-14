// ─────────────────────────────────────────────────────────────────────────────
// Qareeb — Firestore seed script
//
// Usage:
//   1. Download a service-account key from the Firebase console and save it as
//      firebase/seed/service-account.json  (git-ignored), OR set
//      GOOGLE_APPLICATION_CREDENTIALS to its path.
//   2. npm install  (inside firebase/)
//   3. npm run seed
//
// Seeds categories, services, a demo customer, demo artisans + profiles, a few
// requests, offers and reviews so the apps and admin dashboard have live data.
// ─────────────────────────────────────────────────────────────────────────────
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import admin from 'firebase-admin';

const __dirname = dirname(fileURLToPath(import.meta.url));
const keyPath = join(__dirname, 'service-account.json');

if (existsSync(keyPath)) {
  admin.initializeApp({ credential: admin.credential.cert(JSON.parse(readFileSync(keyPath, 'utf8'))) });
} else {
  // Falls back to GOOGLE_APPLICATION_CREDENTIALS / ADC.
  admin.initializeApp();
}

const db = admin.firestore();
const now = admin.firestore.Timestamp.now();
const ts = (msAgo = 0) => admin.firestore.Timestamp.fromMillis(Date.now() - msAgo);

const CATEGORIES = [
  { id: 'plumbing', slug: 'plumbing', name: { ar: 'سباكة', en: 'Plumbing' }, icon: 'droplet', colorHex: '#3B82F6', order: 1 },
  { id: 'electrical', slug: 'electrical', name: { ar: 'كهرباء', en: 'Electrical' }, icon: 'zap', colorHex: '#F59E0B', order: 2 },
  { id: 'carpentry', slug: 'carpentry', name: { ar: 'نجارة', en: 'Carpentry' }, icon: 'hammer', colorHex: '#B45309', order: 3 },
  { id: 'ac', slug: 'air-conditioning', name: { ar: 'تكييف', en: 'Air Conditioning' }, icon: 'wind', colorHex: '#06B6D4', order: 4 },
  { id: 'painting', slug: 'painting', name: { ar: 'دهان', en: 'Painting' }, icon: 'paintbrush', colorHex: '#EC4899', order: 5 },
  { id: 'cleaning', slug: 'cleaning', name: { ar: 'تنظيف', en: 'Cleaning' }, icon: 'sparkles', colorHex: '#10B981', order: 6 },
  { id: 'maintenance', slug: 'maintenance', name: { ar: 'صيانة', en: 'Maintenance' }, icon: 'wrench', colorHex: '#6366F1', order: 7 },
  { id: 'repair', slug: 'home-repair', name: { ar: 'إصلاح منزلي', en: 'Home Repair' }, icon: 'tools', colorHex: '#8B5CF6', order: 8 },
  { id: 'appliance', slug: 'appliance-repair', name: { ar: 'إصلاح أجهزة', en: 'Appliance Repair' }, icon: 'plug', colorHex: '#0EA5E9', order: 9 },
  { id: 'gardening', slug: 'gardening', name: { ar: 'بستنة', en: 'Gardening' }, icon: 'leaf', colorHex: '#22C55E', order: 10 },
  { id: 'satellite', slug: 'satellite', name: { ar: 'ستلايت', en: 'Satellite' }, icon: 'satellite', colorHex: '#64748B', order: 11 },
  { id: 'moving', slug: 'moving', name: { ar: 'نقل عفش', en: 'Moving' }, icon: 'truck', colorHex: '#EF4444', order: 12 },
];

async function seedCategoriesAndServices() {
  const batch = db.batch();
  for (const c of CATEGORIES) {
    batch.set(db.collection('categories').doc(c.id), { ...c, active: true });
    for (const kind of ['repair', 'install']) {
      const id = `${c.id}_${kind}`;
      batch.set(db.collection('services').doc(id), {
        id,
        categoryId: c.id,
        name: { ar: `${kind === 'repair' ? 'إصلاح' : 'تركيب'} ${c.name.ar}`, en: `${c.name.en} ${kind === 'repair' ? 'Repair' : 'Installation'}` },
        description: { ar: 'خدمة احترافية بضمان', en: 'Professional service with warranty' },
        icon: c.icon,
        basePriceFrom: (kind === 'repair' ? 8000 : 15000) + c.order * 1000,
        active: true,
        popular: c.order <= 6,
      });
    }
  }
  await batch.commit();
  console.log(`✓ Seeded ${CATEGORIES.length} categories and ${CATEGORIES.length * 2} services`);
}

async function seedUsers() {
  const customer = {
    uid: 'seed_customer', role: 'customer', fullName: 'Layla Al-Harbi', email: 'layla@qareeb.app',
    phone: '+966500000001', locale: 'ar', status: 'active', verified: true, rating: 4.9, ratingCount: 12,
    location: { geopoint: new admin.firestore.GeoPoint(24.7136, 46.6753), geohash: 'sv8wr', address: 'Al Olaya, Riyadh' },
    createdAt: ts(90 * 864e5), updatedAt: now,
  };
  await db.collection('users').doc(customer.uid).set(customer);

  const artisans = [
    { uid: 'seed_art_1', fullName: 'Omar Khalid', rating: 4.8, ratingCount: 214, cats: ['plumbing', 'maintenance'], verified: true, premium: true },
    { uid: 'seed_art_2', fullName: 'Yousef Nasser', rating: 4.6, ratingCount: 88, cats: ['cleaning'], verified: true, premium: false },
    { uid: 'seed_art_3', fullName: 'Hassan Ali', rating: 4.4, ratingCount: 41, cats: ['electrical'], verified: false, premium: false },
    { uid: 'seed_art_4', fullName: 'Tariq Mansour', rating: 4.9, ratingCount: 302, cats: ['ac', 'appliance'], verified: true, premium: true },
  ];
  for (const a of artisans) {
    await db.collection('users').doc(a.uid).set({
      uid: a.uid, role: 'artisan', fullName: a.fullName, email: `${a.uid}@qareeb.app`, phone: '+9665000000',
      locale: 'ar', status: 'active', verified: a.verified, rating: a.rating, ratingCount: a.ratingCount,
      location: { geopoint: new admin.firestore.GeoPoint(24.71, 46.67), geohash: 'sv8wr', address: 'Riyadh' },
      createdAt: ts(120 * 864e5), updatedAt: now,
    });
    await db.collection('artisanProfiles').doc(a.uid).set({
      uid: a.uid, bio: 'Experienced, reliable and highly rated professional.',
      serviceIds: a.cats.map((c) => `${c}_repair`), categoryIds: a.cats, serviceRadiusKm: 15,
      basePrices: {}, availability: { days: [0, 1, 2, 3, 4], from: '08:00', to: '20:00' },
      gallery: [], certificates: [], verificationStatus: a.verified ? 'approved' : 'pending',
      premium: a.premium, completedJobs: a.ratingCount, rating: a.rating, ratingCount: a.ratingCount,
    });
  }
  console.log(`✓ Seeded 1 customer and ${artisans.length} artisans`);
}

async function seedRequestsAndOffers() {
  const req = {
    id: 'seed_req_1', customerId: 'seed_customer', serviceId: 'plumbing_repair', categoryId: 'plumbing',
    title: 'Kitchen sink leaking', description: 'Water leaking under the kitchen sink since yesterday.',
    images: [], location: { geopoint: new admin.firestore.GeoPoint(24.7136, 46.6753), geohash: 'sv8wr', address: 'Al Olaya, Riyadh' },
    preferredTime: ts(-3 * 36e5), budget: { min: 8000, max: 20000 }, status: 'PENDING', offerCount: 2,
    createdAt: ts(45 * 6e4), updatedAt: ts(10 * 6e4),
  };
  await db.collection('requests').doc(req.id).set(req);

  const offers = [
    { id: 'seed_off_1', artisanId: 'seed_art_1', price: 12000, etaMinutes: 40, message: 'Can be there within the hour.' },
    { id: 'seed_off_2', artisanId: 'seed_art_4', price: 15000, etaMinutes: 25, message: '6-month warranty on the repair.' },
  ];
  for (const o of offers) {
    await db.collection('offers').doc(o.id).set({
      ...o, requestId: req.id, customerId: 'seed_customer', status: 'PENDING', createdAt: ts(20 * 6e4),
    });
  }

  await db.collection('reviews').doc('seed_rev_1').set({
    id: 'seed_rev_1', requestId: 'seed_req_old', authorId: 'seed_customer', targetId: 'seed_art_1',
    role: 'customer', rating: 5, comment: 'Extremely professional and punctual!', createdAt: ts(4 * 864e5),
  });
  console.log('✓ Seeded 1 request, 2 offers, 1 review');
}

async function main() {
  await seedCategoriesAndServices();
  await seedUsers();
  await seedRequestsAndOffers();
  console.log('\n🎉 Seed complete.');
  process.exit(0);
}

main().catch((e) => {
  console.error('Seed failed:', e);
  process.exit(1);
});
