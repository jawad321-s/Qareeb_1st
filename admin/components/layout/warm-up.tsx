'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCollection } from '@/lib/live-data';
import { NAV_HREFS } from './sidebar';

/**
 * Right after sign-in, gets ready what the pages need, so moving between them
 * is instant instead of waiting on the first visit to each:
 *  - every page's code (on a phone the menu is hidden, so links never
 *    prefetched themselves);
 *  - the collections most pages read, kept live for the whole session
 *    (the others are opened by the sidebar and the bell already).
 */
export function WarmUp() {
  const router = useRouter();
  useEffect(() => {
    NAV_HREFS.forEach((href) => router.prefetch(href));
  }, [router]);
  useCollection('users');
  useCollection('requests');
  useCollection('artisanProfiles');
  useCollection('subscriptions');
  return null;
}
