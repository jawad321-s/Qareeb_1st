// Lazily-initialised Firebase client for the admin dashboard. Guarded so the
// dashboard runs on mock data when no project is configured.
'use client';

import { getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { config } from './config';

let app: FirebaseApp | null = null;
let db: Firestore | null = null;

export function getDb(): Firestore | null {
  if (config.useMock) return null;
  if (db) return db;
  app = getApps().length ? getApps()[0] : initializeApp(config.firebase);
  db = getFirestore(app);
  return db;
}

export const isLive = () => !config.useMock;
