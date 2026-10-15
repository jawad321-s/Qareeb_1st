// How an offer shows in the artisan's offers list. Once the customer hires the
// artisan, the job's own status is what matters (on the way, in progress,
// completed, or cancelled after acceptance); before that it's the offer's.
import type { Offer, OfferStatus, RequestStatus } from '@/types';

export type OfferState = { kind: 'request'; status: RequestStatus } | { kind: 'offer'; status: OfferStatus };

export type OfferTab = 'active' | 'completed' | 'cancelled' | 'all';

export function offerState(o: Offer): OfferState {
  if (o.requestStatus === 'CANCELLED') return { kind: 'request', status: 'CANCELLED' };
  if (o.status === 'ACCEPTED' && o.requestStatus && o.requestStatus !== 'PENDING') {
    return { kind: 'request', status: o.requestStatus };
  }
  return { kind: 'offer', status: o.status };
}

/** Whether the offer belongs on a tab. Rejected and withdrawn offers are listed under "all" only. */
export function inOfferTab(o: Offer, tab: OfferTab): boolean {
  if (tab === 'all') return true;
  const s = offerState(o);
  if (s.kind === 'request') {
    if (s.status === 'COMPLETED') return tab === 'completed';
    if (s.status === 'CANCELLED') return tab === 'cancelled';
    return tab === 'active';
  }
  return tab === 'active' && (s.status === 'PENDING' || s.status === 'ACCEPTED');
}
