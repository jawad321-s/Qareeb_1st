// Featured artisans: the badge and the head start in dispatch come from the
// number of jobs an artisan completed, counted here from the requests
// themselves (artisans cannot write it), never from a figure the app reports.
import { FEATURED_MIN_JOBS } from './config.js';
import { notifyUsers } from './notify.js';

/** Completed jobs needed for the badge: the dashboard setting, else the default. */
export async function featuredThreshold(db) {
  const snap = await db.collection('settings').doc('platform').get();
  const n = Number(snap.get('featuredMinJobs'));
  return Number.isInteger(n) && n > 0 ? n : FEATURED_MIN_JOBS;
}

/**
 * Recounts an artisan's completed jobs and updates `completedJobs` and
 * `featured` on their profile when they changed. Returns the figures and
 * whether the artisan has just become featured.
 */
export async function refreshArtisanStats(db, artisanId, threshold) {
  if (!artisanId) return null;
  const min = threshold ?? (await featuredThreshold(db));
  const agg = await db
    .collection('requests')
    .where('acceptedArtisanId', '==', artisanId)
    .where('status', '==', 'COMPLETED')
    .count()
    .get();
  const completedJobs = agg.data().count;
  const featured = completedJobs >= min;
  const ref = db.collection('artisanProfiles').doc(artisanId);
  const snap = await ref.get();
  if (!snap.exists) return { completedJobs, featured, became: false };
  const changes = {};
  if (snap.get('completedJobs') !== completedJobs) changes.completedJobs = completedJobs;
  const was = snap.get('featured') === true;
  if (was !== featured) {
    changes.featured = featured;
    changes.featuredSince = featured ? Date.now() : null;
  }
  if (Object.keys(changes).length) await ref.update(changes);
  return { completedJobs, featured, became: featured && !was };
}

/** After a job is completed: recount, and congratulate an artisan who just earned the badge. */
export async function onJobCompleted(db, artisanId) {
  const min = await featuredThreshold(db);
  const stats = await refreshArtisanStats(db, artisanId, min);
  if (stats?.became) {
    await notifyUsers(db, [artisanId], 'becameFeatured', { jobs: min }, { route: '/(artisan)/dashboard' });
  }
  return stats;
}

/**
 * Recounts every artisan once per threshold: the first time this runs after
 * the deploy (artisans who already have the jobs get the badge) and again
 * whenever the admin changes the number. Cheap otherwise: two reads.
 */
export async function backfillFeatured(db) {
  const min = await featuredThreshold(db);
  const metaRef = db.collection('meta').doc('featured');
  const meta = await metaRef.get();
  if (meta.exists && meta.get('threshold') === min) return 0;
  const artisans = await db.collection('artisanProfiles').get();
  for (const d of artisans.docs) await refreshArtisanStats(db, d.id, min);
  await metaRef.set({ threshold: min, doneAt: Date.now() });
  return artisans.size;
}
