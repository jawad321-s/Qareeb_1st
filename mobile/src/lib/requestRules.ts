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

/** A job with an assigned artisan that hasn't finished yet. */
export const ACTIVE_STATUSES: RequestStatus[] = ['ACCEPTED', 'ON_THE_WAY', 'WORKING'];

export function isActiveJob(status: RequestStatus): boolean {
  return ACTIVE_STATUSES.includes(status);
}

/**
 * If the artisan never marks an active job as finished, it is completed
 * automatically this long after its last status change. Completing it opens
 * the mandatory rating for both sides.
 */
export const AUTO_COMPLETE_HOURS = 48;
export const AUTO_COMPLETE_AFTER_MS = AUTO_COMPLETE_HOURS * 3600_000;

export function isOverdue(r: { status: RequestStatus; updatedAt: number }, now = Date.now()): boolean {
  return isActiveJob(r.status) && now - r.updatedAt >= AUTO_COMPLETE_AFTER_MS;
}

/** The status the assigned artisan moves a job to next. */
export const NEXT_STATUS: Partial<Record<RequestStatus, RequestStatus>> = {
  ACCEPTED: 'ON_THE_WAY',
  ON_THE_WAY: 'WORKING',
  WORKING: 'COMPLETED',
};

/** Chat is open while the job is active; afterwards the thread is read-only. */
export function isChatOpen(status: RequestStatus): boolean {
  return isActiveJob(status);
}
