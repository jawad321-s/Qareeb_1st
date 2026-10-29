import { useCallback, useEffect } from 'react';
import { useFocusEffect } from 'expo-router';
import { config } from '@/lib/config';
import { ratingSummary, type RatingSummary } from '@/lib/rating';
import { useAuth } from '@/store/auth';
import { useReviews } from './queries';

/**
 * The signed-in user's rating, computed from the reviews they received.
 * users/{uid}.rating is only a cache for other screens (artisan lists, offer
 * cards) and nothing server-side keeps it current without Cloud Functions, so
 * this refreshes it whenever the computed value differs.
 */
export function useMyRating(): RatingSummary | undefined {
  const user = useAuth((s) => s.user);
  const updateUser = useAuth((s) => s.updateUser);
  const reviews = useReviews(config.useMock ? '' : (user?.uid ?? ''));
  const summary = reviews.data ? ratingSummary(reviews.data) : undefined;

  // Tabs stay mounted: pick up reviews that arrived while elsewhere.
  const { refetch } = reviews;
  useFocusEffect(
    useCallback(() => {
      if (!config.useMock) refetch();
    }, [refetch]),
  );

  useEffect(() => {
    if (!user || !summary) return;
    if (user.rating !== summary.average || user.ratingCount !== summary.count) {
      updateUser({ rating: summary.average, ratingCount: summary.count });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid, summary?.average, summary?.count]);

  // Demo mode keeps the sample figures.
  if (config.useMock) return user ? { average: user.rating, count: user.ratingCount } : undefined;
  return summary;
}
