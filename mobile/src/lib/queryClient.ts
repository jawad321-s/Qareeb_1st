import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30,
      gcTime: 1000 * 60 * 60 * 24,
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});

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
  notifications: (uid: string) => ['notifications', uid] as const,
};
