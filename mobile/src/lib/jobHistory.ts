import type { JobRecord, Offer, Review, ServiceRequest } from '@/types';

/** A finished job, with the artisan's offer and the customer's rating if known. */
export function completedRecord(r: ServiceRequest, offer?: Offer, review?: Review): JobRecord {
  return {
    kind: 'completed',
    requestId: r.id,
    title: r.title,
    categoryId: r.categoryId,
    description: r.description,
    address: r.location?.address,
    customerId: r.customerId,
    date: r.completedAt ?? r.updatedAt,
    price: offer?.price,
    etaMinutes: offer?.etaMinutes,
    message: offer?.message,
    rating: review?.rating,
    comment: review?.comment || undefined,
    autoCompleted: r.autoCompleted,
  };
}

/**
 * An offer the customer turned down. The request may be unreadable by now
 * (assigned to someone else, or cancelled), so the offer's own copy of the
 * title and category is the fallback.
 */
export function rejectedRecord(o: Offer, r?: ServiceRequest): JobRecord {
  const reason: JobRecord['reason'] =
    r?.status === 'CANCELLED' ? 'cancelled' : r?.acceptedArtisanId && r.acceptedArtisanId !== o.artisanId ? 'otherChosen' : 'declined';
  return {
    kind: 'rejected',
    requestId: o.requestId,
    title: r?.title ?? o.requestTitle ?? '',
    categoryId: r?.categoryId ?? o.categoryId,
    description: r?.description,
    address: r?.location?.address,
    customerId: o.customerId,
    date: o.createdAt,
    price: o.price,
    etaMinutes: o.etaMinutes,
    message: o.message,
    reason,
  };
}
