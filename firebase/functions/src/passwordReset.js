// Password reset by SMS code. The app proves the phone number with Firebase
// Phone Auth (a throwaway phone sign-in) and calls resetPasswordWithPhone;
// this sets the new password on the account whose login belongs to that
// number and role (see the app's services/auth.service.ts), then removes the
// throwaway phone sign-in.
import { HttpsError } from 'firebase-functions/v2/https';
import { normalizePhone } from './geo.js';

const LOGIN_DOMAIN = 'phone.qareeb.app';
export const loginEmail = (phone, role) => `${role}-${normalizePhone(phone)}@${LOGIN_DOMAIN}`;

/**
 * `caller` is the verified phone sign-in ({ uid, phone, provider }); `data`
 * is what the app sent ({ role, newPassword }).
 */
export async function resetPasswordWithPhone(auth, caller, data) {
  if (!caller?.phone) throw new HttpsError('unauthenticated', 'Verify the phone number first.');
  try {
    const { role, newPassword } = data ?? {};
    if (role !== 'customer' && role !== 'artisan') throw new HttpsError('invalid-argument', 'Unknown account type.');
    if (typeof newPassword !== 'string' || newPassword.length < 6) throw new HttpsError('invalid-argument', 'The password is too short.');
    const account = await auth.getUserByEmail(loginEmail(caller.phone, role)).catch(() => null);
    if (!account) throw new HttpsError('not-found', 'No account of this type for this number.');
    await auth.updateUser(account.uid, { password: newPassword });
    return { ok: true };
  } finally {
    // The phone sign-in only proved the number: it is not an account.
    if (caller.provider === 'phone') await auth.deleteUser(caller.uid).catch(() => {});
  }
}
