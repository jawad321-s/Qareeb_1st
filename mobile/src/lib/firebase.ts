// Lazily-initialised Firebase clients. Everything is guarded so the app runs
// perfectly on mock data when no Firebase project is configured — the getters
// simply return null and callers fall back to the local mock path.
import { getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';
import { config } from './config';

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;

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

export const isLive = () => !config.useMock;
