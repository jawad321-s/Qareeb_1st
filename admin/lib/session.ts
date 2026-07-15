// Lightweight client session for the admin console. Demo-grade by design:
// swap `signIn` for Firebase Auth (custom claims: role=admin) in production —
// the guard and call sites stay unchanged.
'use client';

const KEY = 'qareeb.admin.session';

export interface AdminSession {
  email: string;
  signedInAt: number;
}

export function getSession(): AdminSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as AdminSession) : null;
  } catch {
    return null;
  }
}

export function signIn(email: string): AdminSession {
  const session: AdminSession = { email, signedInAt: Date.now() };
  localStorage.setItem(KEY, JSON.stringify(session));
  return session;
}

export function signOut() {
  localStorage.removeItem(KEY);
}
