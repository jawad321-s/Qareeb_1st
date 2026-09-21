import type { RequestStatus } from '@/types';

/**
 * Statuses a request can still be cancelled from — by either side.
 *
 * Cancelling is allowed while the job hasn't actually started: it's still
 * collecting offers (PENDING), an offer was accepted (ACCEPTED), or the artisan
 * is travelling (ON_THE_WAY). Once work is underway (WORKING) or the job is
 * finished/already cancelled, it can no longer be called off from the app.
 */
export const CANCELLABLE_STATUSES: RequestStatus[] = ['PENDING', 'ACCEPTED', 'ON_THE_WAY'];

export function canCancelRequest(status: RequestStatus): boolean {
  return CANCELLABLE_STATUSES.includes(status);
}
