import { config } from '@/lib/config';
import { mockApi } from '@/mock/api';
import { firebaseApi } from '@/services/firebase-api';

/**
 * Single data-access facade for the whole app. Screens and hooks import `api`
 * and never touch Firebase or the mock layer directly. When a Firebase project
 * is configured (`config.useMock === false`), the Firestore-backed
 * implementation is used — the surface is identical, so no screen changes.
 */
export const api = config.useMock ? mockApi : firebaseApi;

export type Api = typeof api;
