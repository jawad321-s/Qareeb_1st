'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { getAdminAuth } from '@/lib/firebase';
import { getSession, signOut } from '@/lib/session';

/**
 * Client-side gate for the dashboard: unauthenticated visitors are bounced to
 * /login before any admin content renders. With Firebase configured, the
 * Firebase sign-in must still be there too — every live read depends on it.
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!getSession()) {
      router.replace('/login');
      return;
    }
    const auth = getAdminAuth();
    if (!auth) {
      setReady(true);
      return;
    }
    return onAuthStateChanged(auth, (user) => {
      if (user) setReady(true);
      else {
        signOut();
        router.replace('/login');
      }
    });
  }, [router]);

  if (!ready) return null;
  return <>{children}</>;
}
