import type { Review } from '@/types';

export interface RatingSummary {
  /** Mean of the ratings received, one decimal (0 when there are none). */
  average: number;
  count: number;
}

/** Someone's rating, from the reviews they received. */
export function ratingSummary(reviews: Pick<Review, 'rating'>[]): RatingSummary {
  const ratings = reviews.map((r) => Number(r.rating)).filter((n) => n >= 1 && n <= 5);
  if (!ratings.length) return { average: 0, count: 0 };
  const mean = ratings.reduce((sum, n) => sum + n, 0) / ratings.length;
  return { average: Math.round(mean * 10) / 10, count: ratings.length };
}

/** "4.5", or "—" before the first rating ("…" while loading). */
export const ratingValue = (s?: RatingSummary) => (!s ? '…' : s.count ? s.average.toFixed(1) : '—');

/** The label with how many ratings make up the average: "التقييم (3)". */
export const ratingLabel = (label: string, s?: RatingSummary) => (s?.count ? `${label} (${s.count})` : label);
