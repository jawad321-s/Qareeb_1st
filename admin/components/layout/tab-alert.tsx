'use client';

import { useEffect } from 'react';
import { useCollection } from '@/lib/live-data';

/**
 * Support messages nobody has opened show as "(2)" in the browser tab's title,
 * so the team notices them from another tab or window too.
 */
export function TabAlert() {
  const threads = useCollection('supportThreads');
  const waiting = (threads ?? []).filter((x) => x.unreadForAdmin === true).length;

  useEffect(() => {
    const apply = () => {
      const base = document.title.replace(/^\(\d+\) /, '');
      const next = waiting > 0 ? `(${waiting}) ${base}` : base;
      if (document.title !== next) document.title = next;
    };
    apply();
    // The page title is reset on every navigation: keep the count on it.
    const id = setInterval(apply, 1500);
    return () => {
      clearInterval(id);
      document.title = document.title.replace(/^\(\d+\) /, '');
    };
  }, [waiting]);

  return null;
}
