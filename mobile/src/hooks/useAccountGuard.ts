import { useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { config } from '@/lib/config';
import { getDb } from '@/lib/firebase';
import { useAuth } from '@/store/auth';
import { useToast } from '@/components/feedback/Toast';
import { useT } from '@/i18n';

/**
 * Signs the user out as soon as an admin suspends or deletes their account
 * (dashboard → Users). The server also disables the login, but a session
 * already open would otherwise run until its token expires.
 */
export function useAccountGuard(uid: string | undefined) {
  const toast = useToast();
  const { t } = useT();
  useEffect(() => {
    const db = getDb();
    if (config.useMock || !db || !uid) return;
    return onSnapshot(
      doc(db, 'users', uid),
      (snap) => {
        // A cached "missing" (offline, nothing stored yet) says nothing about the account.
        if (snap.metadata.fromCache) return;
        if (snap.exists() && snap.data().status !== 'suspended') return;
        if (useAuth.getState().user?.uid !== uid) return;
        useAuth.getState().signOut();
        toast('error', t('auth.accountClosed'));
      },
      () => {},
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid]);
}
