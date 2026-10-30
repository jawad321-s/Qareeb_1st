// Central runtime configuration, read from Expo public env vars.

// The team's Firebase project (qareeb-b9a54), so a fresh clone runs on the
// shared backend without an env file. A web config is not a secret: every
// build ships it and the Firestore rules guard the data. Values set in
// mobile/.env still win (another project, the emulators).
const TEAM_PROJECT = {
  apiKey: 'AIzaSyAj6c-ZdgYYgxs-i7o-9WdqlnytRupwywA',
  authDomain: 'qareeb-b9a54.firebaseapp.com',
  projectId: 'qareeb-b9a54',
  storageBucket: 'qareeb-b9a54.firebasestorage.app',
  messagingSenderId: '274723476834',
  appId: '1:274723476834:web:5e8557cedb3f3fed47083b',
};

const firebase = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || TEAM_PROJECT.apiKey,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || TEAM_PROJECT.authDomain,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || TEAM_PROJECT.projectId,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || TEAM_PROJECT.storageBucket,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || TEAM_PROJECT.messagingSenderId,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || TEAM_PROJECT.appId,
};

// Live (Firestore) whenever a Firebase project is configured, which is the
// default above. Set EXPO_PUBLIC_USE_MOCK=true to run on local mock data.
const hasFirebase = !!firebase.projectId && !!firebase.apiKey;

export const config = {
  useMock: process.env.EXPO_PUBLIC_USE_MOCK === 'true' || !hasFirebase,
  firebase,
  // Host running `firebase emulators:start` (e.g. your computer's LAN IP).
  // When set, Auth / Firestore / Storage talk to the local emulators instead
  // of the real project — for testing without touching live data.
  firebaseEmulatorHost: process.env.EXPO_PUBLIC_FIREBASE_EMULATOR_HOST ?? '',
  googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? '',
  currency: '₪', // Israeli new shekel (ILS)
  currencyCode: 'ILS',
  currencyMinorPerMajor: 100,
  defaultLocale: 'ar' as const,
} as const;
