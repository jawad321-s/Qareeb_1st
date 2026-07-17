// Tracks the current pathname outside React, so non-component code (like the
// locale store, which restarts the app to flip RTL) can save where the user is
// and restore it after the reload. Updated from the root layout on every
// navigation.

let currentPathname = '/';

export function setCurrentPathname(path: string) {
  currentPathname = path;
}

export function getCurrentPathname() {
  return currentPathname;
}
