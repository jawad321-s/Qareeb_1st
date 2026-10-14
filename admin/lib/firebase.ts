// Lazily-initialised Firebase client for the admin dashboard. Guarded so the
// dashboard runs on mock data when no project is configured.
'use client';

import { getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import { connectAuthEmulator, getAuth, type Auth } from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore, type Firestore } from 'firebase/firestore';
import { config } from './config';

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;

function ensureApp(): FirebaseApp {
  app ??= getApps().length ? getApps()[0] : initializeApp(config.firebase);
  return app;
}

export function getDb(): Firestore | null {
  if (config.useMock) return null;
  if (db) return db;
  db = getFirestore(ensureApp());
  if (config.emulatorHost) connectFirestoreEmulator(db, config.emulatorHost, 8080);
  return db;
}

export function getAdminAuth(): Auth | null {
  if (config.useMock) return null;
  if (auth) return auth;
  auth = getAuth(ensureApp());
  if (config.emulatorHost) connectAuthEmulator(auth, `http://${config.emulatorHost}:9099`, { disableWarnings: true });
  return auth;
}

export const isLive = () => !config.useMock;
