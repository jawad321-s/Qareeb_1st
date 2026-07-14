import { config } from '@/lib/config';
import { mockApi } from '@/mock/api';

/**
 * Single data-access facade for the whole app. Screens and hooks import `api`
 * and never touch Firebase or the mock layer directly. When `EXPO_PUBLIC_USE_MOCK`
 * is false, swap in the Firebase-backed implementation here — the surface is
 * identical, so no screen has to change.
 */
export const api = config.useMock ? mockApi : mockApi;

export type Api = typeof api;
