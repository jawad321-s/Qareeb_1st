import React, { useMemo, useRef } from 'react';
import { View } from 'react-native';
import { RecaptchaVerifier, type ApplicationVerifier } from 'firebase/auth';
import { resetAuth } from '@/services/passwordReset.service';

const CONTAINER = 'reset-recaptcha';

/**
 * On the web, Firebase's own invisible RecaptchaVerifier does the check (the
 * native build shows it in a WebView instead, see PhoneVerifier.tsx).
 *
 * Firebase resets the check after every send, but its clear() leaves an
 * invisible check drawn in its element, and drawing a new one there fails
 * ("reCAPTCHA has already been rendered in this element"): every send after
 * the first (try again, resend, send via 972) failed. So each check gets an
 * element of its own, removed when Firebase resets it.
 */
export function usePhoneVerifier(): { verifier: ApplicationVerifier; modal: React.ReactElement } {
  const current = useRef<{ check: RecaptchaVerifier; box: HTMLElement } | null>(null);
  const verifier = useMemo(
    () =>
      ({
        type: 'recaptcha',
        verify: () => {
          if (!current.current) {
            const box = document.createElement('div');
            (document.getElementById(CONTAINER) ?? document.body).appendChild(box);
            current.current = { check: new RecaptchaVerifier(resetAuth(), box, { size: 'invisible' }), box };
          }
          return current.current.check.verify();
        },
        // Firebase calls this after each send; the next send starts a fresh check.
        _reset: () => {
          const used = current.current;
          current.current = null;
          if (!used) return;
          try {
            used.check.clear();
          } catch {
            // Already cleared.
          }
          used.box.remove();
        },
      }) as ApplicationVerifier,
    [],
  );
  return { verifier, modal: <View nativeID={CONTAINER} /> };
}
