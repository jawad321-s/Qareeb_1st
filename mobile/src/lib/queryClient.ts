import { AppState, Platform } from 'react-native';
import { focusManager, QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30,
      gcTime: 1000 * 60 * 60 * 24,
      retry: 1,
      // Coming back to the app (from the home screen or another app) refreshes
      // whatever is stale, so offers and statuses are current at once.
      refetchOnWindowFocus: true,
    },
    mutations: {
      retry: 0,
    },
  },
});

// React Native has no "window focus": tell React Query when the app returns to
// the foreground instead (it also pauses polling while the app is in the
// background).
if (Platform.OS !== 'web') {
  AppState.addEventListener('change', (status) => focusManager.setFocused(status === 'active'));
}

// Centralized query keys keep cache invalidation consistent and typo-free.
export const qk = {
  me: ['me'] as const,
  categories: ['categories'] as const,
  services: (categoryId?: string) => ['services', categoryId ?? 'all'] as const,
  service: (id: string) => ['service', id] as const,
  artisan: (id: string) => ['artisan', id] as const,
  requests: (customerId: string) => ['requests', customerId] as const,
  request: (id: string) => ['request', id] as const,
  nearbyRequests: (artisanId: string) => ['nearbyRequests', artisanId] as const,
  offers: (requestId: string) => ['offers', requestId] as const,
  artisanOffers: (artisanId: string) => ['artisanOffers', artisanId] as const,
  messages: (requestId: string) => ['messages', requestId] as const,
  reviews: (targetId: string) => ['reviews', targetId] as const,
  user: (uid: string) => ['user', uid] as const,
  pendingReview: (uid: string) => ['pendingReview', uid] as const,
  conversations: (uid: string) => ['conversations', uid] as const,
  artisanJobs: (uid: string) => ['artisanJobs', uid] as const,
  jobHistory: (uid: string) => ['jobHistory', uid] as const,
  hasReviewed: (requestId: string, uid: string) => ['hasReviewed', requestId, uid] as const,
  notifications: (uid: string) => ['notifications', uid] as const,
};
