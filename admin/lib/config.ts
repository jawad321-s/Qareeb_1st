// Central runtime config for the admin dashboard, read from public env vars.
const firebase = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? '',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? '',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? '',
};

// Live (shared Firestore) whenever a Firebase project is configured; otherwise
// the dashboard runs on local mock data. Set NEXT_PUBLIC_USE_MOCK=true to force.
const hasFirebase = !!firebase.projectId && !!firebase.apiKey;

export const config = {
  useMock: process.env.NEXT_PUBLIC_USE_MOCK === 'true' || !hasFirebase,
  firebase,
} as const;
