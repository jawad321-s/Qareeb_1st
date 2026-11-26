// How an offer shows in the artisan's offers list. Once the customer hires the
// artisan, the job's own status is what matters (on the way, in progress,
// completed, or cancelled after acceptance); before that it's the offer's.
import type { Offer, OfferStatus, RequestStatus } from '@/types';

export type OfferState = { kind: 'request'; status: RequestStatus } | { kind: 'offer'; status: OfferStatus };

export type OfferTab = 'active' | 'completed' | 'rejected' | 'cancelled' | 'all';

/** Turned down: declined, another offer chosen, or none chosen in time. */
export function turnedDown(o: Offer): boolean {
  return o.status === 'REJECTED' && !!o.closedReason && o.closedReason !== 'REQUEST_CANCELLED';
}

export function offerState(o: Offer): OfferState {
  // What happened to a turned-down offer is the rejection, whatever became of
  // the request after (taken by someone else and later cancelled, expired).
  if (turnedDown(o)) return { kind: 'offer', status: 'REJECTED' };
  if (o.requestStatus === 'CANCELLED') return { kind: 'request', status: 'CANCELLED' };
  if (o.status === 'ACCEPTED' && o.requestStatus && o.requestStatus !== 'PENDING') {
    return { kind: 'request', status: o.requestStatus };
  }
  return { kind: 'offer', status: o.status };
}

/**
 * Which tab an offer belongs on: "rejected" holds offers that weren't taken,
 * "cancelled" the requests called off (before or after hiring) and offers the
 * artisan took back.
 */
export function inOfferTab(o: Offer, tab: OfferTab): boolean {
  if (tab === 'all') return true;
  const s = offerState(o);
  if (s.kind === 'request') {
    if (s.status === 'COMPLETED') return tab === 'completed';
    if (s.status === 'CANCELLED') return tab === 'cancelled';
    return tab === 'active';
  }
  if (s.status === 'REJECTED') return tab === 'rejected';
  if (s.status === 'WITHDRAWN') return tab === 'cancelled';
  return tab === 'active';
}
