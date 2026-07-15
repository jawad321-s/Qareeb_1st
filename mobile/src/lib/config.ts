// Central runtime configuration, read from Expo public env vars.
const firebase = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? '',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? '',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? '',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? '',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? '',
};

// Live (Firestore) whenever a Firebase project is configured; otherwise the app
// runs fully on local mock data. Set EXPO_PUBLIC_USE_MOCK=true to force mock.
const hasFirebase = !!firebase.projectId && !!firebase.apiKey;

export const config = {
  useMock: process.env.EXPO_PUBLIC_USE_MOCK === 'true' || !hasFirebase,
  firebase,
  googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? '',
  currency: '₪', // Israeli new shekel (ILS)
  currencyCode: 'ILS',
  currencyMinorPerMajor: 100,
  defaultLocale: 'ar' as const,
} as const;
