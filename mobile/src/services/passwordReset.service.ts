// SMS codes: proving a phone number at sign-up, and resetting a forgotten
// password. The number is proved with Firebase Phone Auth on a separate
// Firebase app instance, so the app's own sign-in state is never touched. For
// a reset, a Cloud Function (resetPasswordWithPhone) then sets the new password
// on the account whose login belongs to that number and role.
import { getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import {
  connectAuthEmulator,
  initializeAuth,
  inMemoryPersistence,
  PhoneAuthProvider,
  signInWithCredential,
  signOut,
  type ApplicationVerifier,
  type Auth,
} from 'firebase/auth';
import { connectFunctionsEmulator, getFunctions, httpsCallable, type Functions } from 'firebase/functions';
import { config } from '@/lib/config';
import { withCountryCode } from '@/lib/phone';
import type { UserRole } from '@/types';

const APP_NAME = 'password-reset';
// Must match the Cloud Functions region (firebase/functions/src/config.js).
const REGION = 'europe-west1';

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let functions: Functions | null = null;

function resetApp(): FirebaseApp {
  app ??= getApps().find((a) => a.name === APP_NAME) ?? initializeApp(config.firebase, APP_NAME);
  return app;
}

/** The Auth instance used only to verify the phone number (kept in memory). */
export function resetAuth(): Auth {
  if (auth) return auth;
  auth = initializeAuth(resetApp(), { persistence: inMemoryPersistence });
  auth.languageCode = 'ar';
  if (config.firebaseEmulatorHost) {
    connectAuthEmulator(auth, `http://${config.firebaseEmulatorHost}:9099`, { disableWarnings: true });
    // The emulator sends no SMS and needs no real reCAPTCHA.
    auth.settings.appVerificationDisabledForTesting = true;
  }
  return auth;
}

function resetFunctions(): Functions {
  if (functions) return functions;
  functions = getFunctions(resetApp(), REGION);
  if (config.firebaseEmulatorHost) connectFunctionsEmulator(functions, config.firebaseEmulatorHost, 5001);
  return functions;
}

/**
 * Texts a verification code to the number; returns the id that pairs with it.
 * `via` picks the country code the SMS is sent to (+970 or +972: the same line,
 * and the account is found by the number without its code either way).
 */
export function sendResetCode(phone: string, verifier: ApplicationVerifier, via: '970' | '972' = '970'): Promise<string> {
  return new PhoneAuthProvider(resetAuth()).verifyPhoneNumber(withCountryCode(phone, via), verifier);
}

/** Checks the code, then sets the new password on the account for this number and role. */
export async function confirmReset(verificationId: string, code: string, role: UserRole, newPassword: string): Promise<void> {
  const a = resetAuth();
  await signInWithCredential(a, PhoneAuthProvider.credential(verificationId, code));
  try {
    await httpsCallable(resetFunctions(), 'resetPasswordWithPhone')({ role, newPassword });
  } finally {
    await signOut(a).catch(() => {});
  }
}

/**
 * Checks the code sent at sign-up. Only proof of the number is needed (the
 * account itself signs in with phone + password), so the temporary phone
 * sign-in is deleted right after.
 */
export async function confirmPhoneCode(verificationId: string, code: string): Promise<void> {
  const a = resetAuth();
  const { user } = await signInWithCredential(a, PhoneAuthProvider.credential(verificationId, code));
  await user.delete().catch(() => signOut(a).catch(() => {}));
}

/** The message key for a failed step (Firebase Auth or Functions error code). */
export function resetErrorKey(err: unknown):
  | 'reset.err.phone'
  | 'reset.err.tooMany'
  | 'reset.err.code'
  | 'reset.err.expired'
  | 'reset.err.noAccount'
  | 'reset.err.robot'
  | 'reset.err.disabled'
  | 'reset.err.generic' {
  const code = (err as { code?: string })?.code ?? (err as Error)?.message ?? '';
  if (code.includes('invalid-phone-number')) return 'reset.err.phone';
  if (code.includes('too-many-requests') || code.includes('quota-exceeded')) return 'reset.err.tooMany';
  if (code.includes('invalid-verification-code') || code.includes('missing-verification-code')) return 'reset.err.code';
  if (code.includes('code-expired') || code.includes('session-expired')) return 'reset.err.expired';
  if (code.includes('functions/not-found')) return 'reset.err.noAccount';
  if (code.includes('captcha') || code.includes('recaptcha')) return 'reset.err.robot';
  if (code.includes('operation-not-allowed')) return 'reset.err.disabled';
  return 'reset.err.generic';
}
