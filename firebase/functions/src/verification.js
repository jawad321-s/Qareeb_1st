// An artisan's verification decided in the dashboard (Verification requests,
// or verify / unverify on the Users page): they are told at once by
// notification, with the reason when it was refused, instead of finding out
// the next time they open the app.
import { notifyUsers } from './notify.js';

/** verificationRequests/{id} changed: approved or rejected → tell the artisan. */
export async function notifyVerificationDecision(db, artisanId, before, after) {
  if (!after || before?.status === after.status) return null;
  if (after.status === 'approved') {
    await notifyUsers(db, [artisanId], 'verificationApproved', {}, { route: '/(artisan)/dashboard' });
    return 'approved';
  }
  if (after.status === 'rejected') {
    const reason = typeof after.rejectReason === 'string' ? after.rejectReason.trim().slice(0, 300) : '';
    await notifyUsers(db, [artisanId], 'verificationRejected', { reason }, { route: '/(shared)/verification' });
    return 'rejected';
  }
  return null;
}
