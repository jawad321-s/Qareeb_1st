// ─────────────────────────────────────────────────────────────────────────────
// Qareeb — Firestore seed script
//
// Usage:
//   1. Download a service-account key from the Firebase console and save it as
//      firebase/seed/service-account.json  (git-ignored), OR set
//      GOOGLE_APPLICATION_CREDENTIALS to its path.
//   2. npm install  (inside firebase/)
//   3. npm run seed
//      Optional: SEED_ADMIN_PASSWORD=… npm run seed — otherwise a random admin
//      password is generated and printed once.
//
// Seeds categories, services, a demo customer, demo artisans + profiles, a few
// requests, offers and reviews so the apps and admin dashboard have live data.
// It also creates their Firebase Auth sign-ins (phone number + password; see
// "Accounts" below) and an admin account for the dashboard.
//
// Against the local emulators instead: set FIRESTORE_EMULATOR_HOST,
// FIREBASE_AUTH_EMULATOR_HOST and GCLOUD_PROJECT, then run the same command.
// ─────────────────────────────────────────────────────────────────────────────
import { readFileSync, existsSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import admin from 'firebase-admin';

const __dirname = dirname(fileURLToPath(import.meta.url));
const keyPath = join(__dirname, 'service-account.json');

if (existsSync(keyPath)) {
  admin.initializeApp({ credential: admin.credential.cert(JSON.parse(readFileSync(keyPath, 'utf8'))) });
} else if (process.env.FIRESTORE_EMULATOR_HOST) {
  admin.initializeApp({ projectId: process.env.GCLOUD_PROJECT ?? 'demo-qareeb' });
} else {
  // Falls back to GOOGLE_APPLICATION_CREDENTIALS / ADC.
  admin.initializeApp();
}

// ── Accounts ─────────────────────────────────────────────────────────────────
// The apps sign in with a phone number + password. Firebase's password sign-in
// needs an email-shaped id, so the apps derive an internal one from the number
// and the account type (a number holds a separate customer and artisan
// account). Nobody sees or types it. Must match mobile/src/lib/phone.ts.
const authIdFor = (phone, role) => `${phone.replace(/\D/g, '')}.${role}@qareeb.app`;

// Demo customer/artisan accounts (the app's "Demo" buttons use this password).
const DEMO_PASSWORD = 'qareeb123';
const ADMIN_PHONE = '+970590000000';
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || randomBytes(9).toString('base64url');

async function ensureSignIn(uid, phone, role, password) {
  const email = authIdFor(phone, role);
  try {
    await admin.auth().getUser(uid);
    await admin.auth().updateUser(uid, { email, password });
  } catch (e) {
    if (e.code !== 'auth/user-not-found') throw e;
    await admin.auth().createUser({ uid, email, password });
  }
}

// Locations carry both a GeoPoint (for geo queries) and plain numbers (the app).
const place = (latitude, longitude, address) => ({
  geopoint: new admin.firestore.GeoPoint(latitude, longitude), latitude, longitude, geohash: 'sv9hv', address,
});

const db = admin.firestore();
const now = admin.firestore.Timestamp.now();
const ts = (msAgo = 0) => admin.firestore.Timestamp.fromMillis(Date.now() - msAgo);

const CATEGORIES = [
  { id: 'plumbing', slug: 'plumbing', name: { ar: 'سباكة', en: 'Plumbing' }, icon: 'droplet', colorHex: '#2563EB', order: 1 },
  { id: 'electrical', slug: 'electrical', name: { ar: 'كهرباء', en: 'Electrical' }, icon: 'zap', colorHex: '#0EA5E9', order: 2 },
  { id: 'carpentry', slug: 'carpentry', name: { ar: 'نجارة', en: 'Carpentry' }, icon: 'hammer', colorHex: '#6366F1', order: 3 },
  { id: 'ac', slug: 'air-conditioning', name: { ar: 'تكييف', en: 'Air Conditioning' }, icon: 'wind', colorHex: '#06B6D4', order: 4 },
  { id: 'painting', slug: 'painting', name: { ar: 'دهان', en: 'Painting' }, icon: 'paintbrush', colorHex: '#8B5CF6', order: 5 },
  { id: 'cleaning', slug: 'cleaning', name: { ar: 'تنظيف', en: 'Cleaning' }, icon: 'sparkles', colorHex: '#14B8A6', order: 6 },
  { id: 'repair', slug: 'home-repair', name: { ar: 'إصلاح منزلي', en: 'Home Repair' }, icon: 'tools', colorHex: '#7C3AED', order: 7 },
  { id: 'appliance', slug: 'appliance-repair', name: { ar: 'إصلاح أجهزة', en: 'Appliance Repair' }, icon: 'plug', colorHex: '#0284C7', order: 8 },
  { id: 'gardening', slug: 'gardening', name: { ar: 'بستنة', en: 'Gardening' }, icon: 'leaf', colorHex: '#0D9488', order: 9 },
  { id: 'satellite', slug: 'satellite', name: { ar: 'ستلايت', en: 'Satellite' }, icon: 'satellite', colorHex: '#475569', order: 10 },
  { id: 'moving', slug: 'moving', name: { ar: 'نقل عفش', en: 'Moving' }, icon: 'truck', colorHex: '#4338CA', order: 11 },
];

async function seedCategoriesAndServices() {
  const batch = db.batch();
  // Remove what earlier seeds left behind: the split repair/installation
  // services and categories that no longer exist (e.g. "maintenance").
  const keep = new Set(CATEGORIES.map((c) => c.id));
  const [oldServices, oldCategories] = await Promise.all([db.collection('services').get(), db.collection('categories').get()]);
  for (const d of oldServices.docs) if (!keep.has(d.id)) batch.delete(d.ref);
  for (const d of oldCategories.docs) if (!keep.has(d.id)) batch.delete(d.ref);
  for (const c of CATEGORIES) {
    batch.set(db.collection('categories').doc(c.id), { ...c, active: true });
    // One general service per category, with the category's id.
    batch.set(db.collection('services').doc(c.id), {
      id: c.id,
      categoryId: c.id,
      name: { ar: c.name.ar, en: c.name.en },
      description: { ar: `كل أعمال ${c.name.ar}`, en: `All ${c.name.en.toLowerCase()} work` },
      icon: c.icon,
      basePriceFrom: 8000 + c.order * 1000,
      active: true,
      popular: c.order <= 6,
    });
  }
  await batch.commit();
  console.log(`✓ Seeded ${CATEGORIES.length} categories and ${CATEGORIES.length} services`);
}

async function seedUsers() {
  const customer = {
    // Phone numbers are the account identity: unique and stored normalized (+970…).
    uid: 'seed_customer', role: 'customer', fullName: 'ليلى خالد',
    phone: '+970590000001', locale: 'ar', status: 'active', verified: true, rating: 4.9, ratingCount: 12,
    location: place(31.9038, 35.2034, 'الماصيون، رام الله'),
    createdAt: ts(90 * 864e5), updatedAt: now,
  };
  await db.collection('users').doc(customer.uid).set(customer);
  await ensureSignIn(customer.uid, customer.phone, 'customer', DEMO_PASSWORD);

  const artisans = [
    { uid: 'seed_art_1', fullName: 'عمر خالد', phone: '+970590000010', rating: 4.8, ratingCount: 214, cats: ['plumbing', 'repair'], verified: true, premium: true },
    { uid: 'seed_art_2', fullName: 'يوسف ناصر', phone: '+970590000011', rating: 4.6, ratingCount: 88, cats: ['cleaning'], verified: true, premium: false },
    { uid: 'seed_art_3', fullName: 'حسان علي', phone: '+970590000012', rating: 4.4, ratingCount: 41, cats: ['electrical'], verified: false, premium: false },
    { uid: 'seed_art_4', fullName: 'طارق منصور', phone: '+970590000013', rating: 4.9, ratingCount: 302, cats: ['ac', 'appliance'], verified: true, premium: true },
  ];
  for (const a of artisans) {
    await db.collection('users').doc(a.uid).set({
      uid: a.uid, role: 'artisan', fullName: a.fullName, phone: a.phone,
      locale: 'ar', status: 'active', verified: a.verified, rating: a.rating, ratingCount: a.ratingCount,
      location: place(31.9075, 35.1997, 'رام الله'),
      createdAt: ts(120 * 864e5), updatedAt: now,
    });
    await ensureSignIn(a.uid, a.phone, 'artisan', DEMO_PASSWORD);
    await db.collection('artisanProfiles').doc(a.uid).set({
      uid: a.uid, bio: 'Experienced, reliable and highly rated professional.',
      serviceIds: a.cats, categoryIds: a.cats,
      availability: { days: [0, 1, 2, 3, 4], from: '08:00', to: '20:00' },
      gallery: [], certificates: [], verificationStatus: a.verified ? 'approved' : 'pending',
      premium: a.premium, completedJobs: a.ratingCount, rating: a.rating, ratingCount: a.ratingCount,
    });
  }
  console.log(`✓ Seeded 1 customer and ${artisans.length} artisans (demo password: ${DEMO_PASSWORD})`);

  // The dashboard's admin account. Its role is in its users doc (what the
  // rules check) and as a custom claim.
  const adminUser = {
    uid: 'seed_admin', role: 'admin', fullName: 'إدارة قريب', phone: ADMIN_PHONE, locale: 'ar',
    status: 'active', verified: true, rating: 0, ratingCount: 0, createdAt: now, updatedAt: now,
  };
  await db.collection('users').doc(adminUser.uid).set(adminUser);
  await ensureSignIn(adminUser.uid, ADMIN_PHONE, 'admin', ADMIN_PASSWORD);
  await admin.auth().setCustomUserClaims(adminUser.uid, { role: 'admin' });
  console.log(`✓ Admin account — phone ${ADMIN_PHONE}, password ${process.env.SEED_ADMIN_PASSWORD ? '(SEED_ADMIN_PASSWORD)' : ADMIN_PASSWORD}`);
}

async function seedRequestsAndOffers() {
  const req = {
    id: 'seed_req_1', customerId: 'seed_customer', serviceId: 'plumbing', categoryId: 'plumbing',
    title: 'تسريب في مغسلة المطبخ', description: 'يوجد تسريب ماء تحت مغسلة المطبخ ويزداد منذ الأمس.',
    images: [], location: place(31.9038, 35.2034, 'الماصيون، رام الله'),
    preferredTime: ts(-3 * 36e5), budget: { min: 8000, max: 20000 }, status: 'PENDING', offerCount: 2,
    createdAt: ts(45 * 6e4), updatedAt: ts(10 * 6e4),
  };
  await db.collection('requests').doc(req.id).set(req);

  const offers = [
    { id: 'seed_off_1', artisanId: 'seed_art_1', price: 12000, etaMinutes: 40, message: 'أقدر أوصل خلال ساعة، السعر نهائي شامل القطع.',
      artisan: { uid: 'seed_art_1', fullName: 'عمر خالد', rating: 4.8, ratingCount: 214 } },
    { id: 'seed_off_2', artisanId: 'seed_art_4', price: 15000, etaMinutes: 25, message: 'خدمة مميّزة مع ضمان 6 أشهر على الإصلاح.',
      artisan: { uid: 'seed_art_4', fullName: 'طارق منصور', rating: 4.9, ratingCount: 302 } },
  ];
  for (const o of offers) {
    await db.collection('offers').doc(o.id).set({
      ...o, requestId: req.id, customerId: 'seed_customer', status: 'PENDING', createdAt: ts(20 * 6e4),
      requestTitle: req.title, categoryId: req.categoryId,
    });
  }

  await db.collection('reviews').doc('seed_rev_1').set({
    id: 'seed_rev_1', requestId: 'seed_req_old', authorId: 'seed_customer', targetId: 'seed_art_1',
    role: 'customer', rating: 5, comment: 'محترف جداً وملتزم بالوقت!', createdAt: ts(4 * 864e5),
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
