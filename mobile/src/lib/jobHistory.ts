import type { JobHistory, JobRecord, Offer, Review, ServiceRequest } from '@/types';
import { turnedDown } from './offerStatus';

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
 * A job that didn't go through for this artisan: their offer was turned down
 * or closed, or the job they took was cancelled (by either side). The request
 * may be unreadable by now (assigned to someone else, or cancelled), so the
 * offer's own copies (title, category, the cancel reason) are the fallback.
 */
export function rejectedRecord(o: Offer, r?: ServiceRequest): JobRecord {
  const cancelled = r?.status === 'CANCELLED' || o.requestStatus === 'CANCELLED' || o.closedReason === 'REQUEST_CANCELLED';
  let reason: JobRecord['reason'];
  let reasonChoice: string | undefined;
  let reasonNote: string | undefined;
  // A turned-down offer stays a rejection, whatever became of the request
  // after (as in the offers list, lib/offerStatus).
  const declined = turnedDown(o);
  if (o.closedReason === 'EXPIRED' || (!declined && r?.cancelReason === 'EXPIRED')) reason = 'expired';
  else if (o.closedReason === 'OTHER_ACCEPTED' || (r?.acceptedArtisanId && r.acceptedArtisanId !== o.artisanId)) reason = 'otherChosen';
  else if (cancelled && !declined) {
    reason = r?.cancelledBy && r.cancelledBy === o.artisanId ? 'cancelledByMe' : 'cancelled';
    reasonChoice = r?.cancelChoice ?? o.requestCancelChoice;
    reasonNote = r?.cancelNote ?? o.requestCancelNote;
  } else {
    reason = 'declined';
    reasonChoice = o.rejectChoice;
    reasonNote = o.rejectNote;
  }
  return {
    // A cancelled job is kept apart from an offer that wasn't taken.
    kind: reason === 'cancelled' || reason === 'cancelledByMe' ? 'cancelled' : 'rejected',
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
    reasonChoice: reasonChoice || undefined,
    reasonNote: reasonNote || undefined,
  };
}

/** The history lists, newest first: completed jobs, offers not taken, and cancelled jobs. */
export function historyLists(completed: JobRecord[], closed: JobRecord[]): JobHistory {
  const newest = (list: JobRecord[]) => list.sort((a, b) => b.date - a.date);
  return {
    completed: newest(completed),
    rejected: newest(closed.filter((r) => r.kind === 'rejected')),
    cancelled: newest(closed.filter((r) => r.kind === 'cancelled')),
  };
}
