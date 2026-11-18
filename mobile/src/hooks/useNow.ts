import { useSyncExternalStore } from 'react';

// One shared timer for every "x minutes ago" on screen: it only runs while a
// component uses it, and each tick re-renders those components so the text
// moves on ("now" → "1m ago") without any new data arriving.
const TICK_MS = 20_000;
let now = Date.now();
let timer: ReturnType<typeof setInterval> | null = null;
const listeners = new Set<() => void>();

function subscribe(cb: () => void) {
  listeners.add(cb);
  if (!timer) {
    now = Date.now();
    timer = setInterval(() => {
      now = Date.now();
      listeners.forEach((l) => l());
    }, TICK_MS);
  }
  return () => {
    listeners.delete(cb);
    if (listeners.size === 0 && timer) {
      clearInterval(timer);
      timer = null;
    }
  };
}

/** Call in any component that shows `timeAgo(...)`: re-renders it every 20 seconds. */
export function useNow(): number {
  return useSyncExternalStore(subscribe, () => now, () => now);
}
