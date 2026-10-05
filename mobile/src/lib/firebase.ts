// Lazily-initialised Firebase clients. Everything is guarded so the app runs
// perfectly on mock data when no Firebase project is configured — the getters
// simply return null and callers fall back to the local mock path.
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import * as firebaseAuth from 'firebase/auth';
import type { Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';
import { config } from './config';

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;
let auth: Auth | null = null;

function ensureApp(): FirebaseApp | null {
  if (config.useMock) return null;
  if (app) return app;
  app = getApps().length ? getApps()[0] : initializeApp(config.firebase);
  return app;
}

export function getDb(): Firestore | null {
  if (config.useMock) return null;
  if (db) return db;
  const a = ensureApp();
  if (!a) return null;
  db = getFirestore(a);
  return db;
}

export function getBucket(): FirebaseStorage | null {
  if (config.useMock) return null;
  if (storage) return storage;
  const a = ensureApp();
  if (!a) return null;
  storage = getStorage(a);
  return storage;
}

export function getAuthClient(): Auth | null {
  if (config.useMock) return null;
  if (auth) return auth;
  const a = ensureApp();
  if (!a) return null;
  if (Platform.OS === 'web') {
    auth = firebaseAuth.getAuth(a);
  } else {
    // Persist the session across app restarts. `getReactNativePersistence`
    // only exists in the React Native build of firebase/auth, so it is
    // missing from the default type declarations.
    const { getReactNativePersistence } = firebaseAuth as unknown as {
      getReactNativePersistence: (s: typeof AsyncStorage) => firebaseAuth.Persistence;
    };
    try {
      auth = firebaseAuth.initializeAuth(a, { persistence: getReactNativePersistence(AsyncStorage) });
    } catch {
      // Already initialised (e.g. after a fast refresh).
      auth = firebaseAuth.getAuth(a);
    }
  }
  return auth;
}

export const isLive = () => !config.useMock;
