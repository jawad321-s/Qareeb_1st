import type { ServiceRequest } from '@/types';

/** An artisan the customer has worked with, from the customer's own requests. */
export interface PastArtisan {
  artisanId: string;
  /** Requests this artisan took on for the customer (cancelled ones don't count). */
  jobs: number;
  /** The most recent of those requests. */
  lastRequestId: string;
  lastTitle: string;
  lastAt: number;
}

/** Every artisan whose offer the customer accepted, most recent first. */
export function pastArtisans(requests: ServiceRequest[]): PastArtisan[] {
  const byArtisan = new Map<string, PastArtisan>();
  for (const r of requests) {
    if (!r.acceptedArtisanId || r.status === 'CANCELLED') continue;
    const seen = byArtisan.get(r.acceptedArtisanId);
    const latest = { lastRequestId: r.id, lastTitle: r.title, lastAt: r.createdAt };
    if (!seen) byArtisan.set(r.acceptedArtisanId, { artisanId: r.acceptedArtisanId, jobs: 1, ...latest });
    else {
      seen.jobs += 1;
      if (r.createdAt > seen.lastAt) Object.assign(seen, latest);
    }
  }
  return [...byArtisan.values()].sort((a, b) => b.lastAt - a.lastAt);
}
