'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { waitForSession } from '@/lib/session';

/**
 * Client-side gate for the dashboard: unauthenticated visitors are bounced to
 * /login before any admin content renders.
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    waitForSession().then((session) => {
      if (!active) return;
      if (!session) router.replace('/login');
      else setReady(true);
    });
    return () => {
      active = false;
    };
  }, [router]);

  if (!ready) return null;
  return <>{children}</>;
}
