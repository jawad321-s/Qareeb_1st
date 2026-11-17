// Featured artisans: the badge and the head start in dispatch need enough
// completed jobs AND a good rating. Both are counted here from the requests
// and the reviews themselves (artisans cannot write them), never from a
// figure the app reports.
import { AggregateField } from 'firebase-admin/firestore';
import { FEATURED_MIN_JOBS, FEATURED_MIN_RATING } from './config.js';
import { notifyUsers } from './notify.js';

/** What the badge needs: the dashboard settings, else the defaults. */
export async function featuredCriteria(db) {
  const snap = await db.collection('settings').doc('platform').get();
  const jobs = Number(snap.get('featuredMinJobs'));
  const rating = Number(snap.get('featuredMinRating'));
  return {
    minJobs: Number.isInteger(jobs) && jobs > 0 ? jobs : FEATURED_MIN_JOBS,
    minRating: Number.isFinite(rating) && rating >= 0 && rating < 5 ? rating : FEATURED_MIN_RATING,
  };
}

/** Kept for callers that only need the number of jobs. */
export const featuredThreshold = async (db) => (await featuredCriteria(db)).minJobs;

/** An artisan's average rating from the reviews written about them (0 when none). */
async function ratingOf(db, artisanId) {
  const agg = await db
    .collection('reviews')
    .where('targetId', '==', artisanId)
    .aggregate({ average: AggregateField.average('rating'), count: AggregateField.count() })
    .get();
  const { average, count } = agg.data();
  return { rating: count ? Math.round(Number(average) * 10) / 10 : 0, ratingCount: count };
}

/**
 * Recounts an artisan's completed jobs and rating and updates `completedJobs`
 * and `featured` on their profile when they changed. Featured: at least
 * `minJobs` completed jobs and a rating above `minRating`. Returns the
 * figures and whether the artisan has just become featured.
 */
export async function refreshArtisanStats(db, artisanId, criteria) {
  if (!artisanId) return null;
  const { minJobs, minRating } = criteria ?? (await featuredCriteria(db));
  const ref = db.collection('artisanProfiles').doc(artisanId);
  const snap = await ref.get();
  if (!snap.exists) return null; // not an artisan
  const [jobs, { rating, ratingCount }] = await Promise.all([
    db.collection('requests').where('acceptedArtisanId', '==', artisanId).where('status', '==', 'COMPLETED').count().get(),
    ratingOf(db, artisanId),
  ]);
  const completedJobs = jobs.data().count;
  const featured = completedJobs >= minJobs && ratingCount > 0 && rating > minRating;
  const changes = {};
  if (snap.get('completedJobs') !== completedJobs) changes.completedJobs = completedJobs;
  const was = snap.get('featured') === true;
  if (was !== featured) {
    changes.featured = featured;
    changes.featuredSince = featured ? Date.now() : null;
  }
  if (Object.keys(changes).length) await ref.update(changes);
  return { completedJobs, rating, featured, became: featured && !was };
}

/**
 * After a completed job or a new review: recount, and congratulate an
 * artisan who just earned the badge.
 */
export async function onJobCompleted(db, artisanId) {
  const criteria = await featuredCriteria(db);
  const stats = await refreshArtisanStats(db, artisanId, criteria);
  if (stats?.became) {
    await notifyUsers(db, [artisanId], 'becameFeatured', { jobs: criteria.minJobs, rating: criteria.minRating }, { route: '/(artisan)/dashboard' });
  }
  return stats;
}
export const onArtisanRated = onJobCompleted;

/**
 * Recounts every artisan once per set of criteria: the first time this runs
 * after the deploy and again whenever the admin changes a number. Cheap
 * otherwise: two reads.
 */
export async function backfillFeatured(db) {
  const criteria = await featuredCriteria(db);
  const metaRef = db.collection('meta').doc('featured');
  const meta = await metaRef.get();
  if (meta.exists && meta.get('threshold') === criteria.minJobs && meta.get('minRating') === criteria.minRating) return 0;
  const artisans = await db.collection('artisanProfiles').get();
  for (const d of artisans.docs) await refreshArtisanStats(db, d.id, criteria);
  await metaRef.set({ threshold: criteria.minJobs, minRating: criteria.minRating, doneAt: Date.now() });
  return artisans.size;
}
