import React, { useMemo, useRef } from 'react';
import { View } from 'react-native';
import { RecaptchaVerifier, type ApplicationVerifier } from 'firebase/auth';
import { resetAuth } from '@/services/passwordReset.service';

const CONTAINER = 'reset-recaptcha';

/**
 * On the web, Firebase's own invisible RecaptchaVerifier does the check (the
 * native build shows it in a WebView instead, see PhoneVerifier.tsx).
 */
export function usePhoneVerifier(): { verifier: ApplicationVerifier; modal: React.ReactElement } {
  const current = useRef<RecaptchaVerifier | null>(null);
  const verifier = useMemo(
    () =>
      ({
        type: 'recaptcha',
        verify: () => {
          current.current ??= new RecaptchaVerifier(resetAuth(), CONTAINER, { size: 'invisible' });
          return current.current.verify();
        },
        // Firebase calls this after each send; the next send starts a fresh check.
        _reset: () => {
          current.current?.clear();
          current.current = null;
        },
      }) as ApplicationVerifier,
    [],
  );
  return { verifier, modal: <View nativeID={CONTAINER} /> };
}
