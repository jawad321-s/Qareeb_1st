import { useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { router } from 'expo-router';
import { config } from '@/lib/config';
import { getAuthClient, getDb } from '@/lib/firebase';
import { useAuth } from '@/store/auth';
import { useToast } from '@/components/feedback/Toast';
import { useT } from '@/i18n';

/** The account the user is deleting themselves: its removal is not a closure. */
let leaving: string | null = null;
export function markAccountLeaving(uid: string | null) {
  leaving = uid;
}

/**
 * Follows the account's status live (dashboard → Users):
 * - suspended: the app moves to the "account suspended" screen, where only the
 *   chat with the Qareeb team is open;
 * - reactivated: back to the app;
 * - gone: signed out.
 * The sign-in token is refreshed first so it carries the server's change.
 */
export function useAccountGuard(uid: string | undefined) {
  const toast = useToast();
  const { t } = useT();
  useEffect(() => {
    const db = getDb();
    if (config.useMock || !db || !uid) return;
    return onSnapshot(
      doc(db, 'users', uid),
      async (snap) => {
        // A cached "missing" (offline, nothing stored yet) says nothing about the account.
        if (snap.metadata.fromCache) return;
        const current = useAuth.getState().user;
        if (current?.uid !== uid || leaving === uid) return;
        // Gone, or deleted (kept in the records only, e.g. removed in the console).
        if (!snap.exists() || snap.data().status === 'deleted') {
          useAuth.getState().signOut();
          toast('error', t('auth.accountClosed'));
          return;
        }
        const suspended = snap.data().status === 'suspended';
        if (suspended === (current.status === 'suspended')) return;
        await getAuthClient()?.currentUser?.getIdToken(true).catch(() => {});
        useAuth.getState().patchLocal({ status: suspended ? 'suspended' : 'active', suspendReason: snap.data().suspendReason ?? null });
        router.replace(suspended ? '/suspended' : '/');
      },
      () => {},
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid]);
}
