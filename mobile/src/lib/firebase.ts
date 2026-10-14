// Lazily-initialised Firebase clients. Everything is guarded so the app runs
// perfectly on mock data when no Firebase project is configured — the getters
// simply return null and callers fall back to the local mock path.
import { Platform } from 'react-native';
import { getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import * as FirebaseAuth from 'firebase/auth';
import { connectAuthEmulator, getAuth, initializeAuth, type Auth } from 'firebase/auth';
import { connectFirestoreEmulator, initializeFirestore, type Firestore } from 'firebase/firestore';
import { connectStorageEmulator, getStorage, type FirebaseStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { config } from './config';

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;
let auth: Auth | null = null;

const emulator = config.firebaseEmulatorHost;

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
  // Optional fields (an offer's note, a photo) are often undefined; Firestore
  // rejects a write containing undefined unless told to skip those fields.
  db = initializeFirestore(a, { ignoreUndefinedProperties: true });
  if (emulator) connectFirestoreEmulator(db, emulator, 8080);
  return db;
}

export function getBucket(): FirebaseStorage | null {
  if (config.useMock) return null;
  if (storage) return storage;
  const a = ensureApp();
  if (!a) return null;
  storage = getStorage(a);
  if (emulator) connectStorageEmulator(storage, emulator, 9199);
  return storage;
}

/**
 * Firebase Auth. On iOS/Android the sign-in is kept in AsyncStorage so it
 * survives app restarts; `getReactNativePersistence` only exists in the React
 * Native build of firebase/auth, so it is looked up rather than imported.
 */
export function getFirebaseAuth(): Auth | null {
  if (config.useMock) return null;
  if (auth) return auth;
  const a = ensureApp();
  if (!a) return null;
  const rnPersistence = (FirebaseAuth as any).getReactNativePersistence;
  auth =
    Platform.OS !== 'web' && rnPersistence
      ? initializeAuth(a, { persistence: rnPersistence(AsyncStorage) })
      : getAuth(a);
  if (emulator) connectAuthEmulator(auth, `http://${emulator}:9099`, { disableWarnings: true });
  return auth;
}

export const isLive = () => !config.useMock;
