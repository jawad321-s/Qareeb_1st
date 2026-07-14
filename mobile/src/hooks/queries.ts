import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import { qk } from '@/lib/queryClient';
import type { Offer, ServiceRequest, ChatMessage } from '@/types';

export function useServices(categoryId?: string) {
  return useQuery({ queryKey: qk.services(categoryId), queryFn: () => api.getServices(categoryId) });
}

export function useService(id: string) {
  return useQuery({ queryKey: qk.service(id), queryFn: () => api.getService(id), enabled: !!id });
}

export function useArtisan(id: string) {
  return useQuery({ queryKey: qk.artisan(id), queryFn: () => api.getArtisan(id), enabled: !!id });
}

export function useRecommendedArtisans() {
  return useQuery({ queryKey: ['recommendedArtisans'], queryFn: () => api.getRecommendedArtisans() });
}

export function useMyRequests(customerId: string) {
  return useQuery({
    queryKey: qk.requests(customerId),
    queryFn: () => api.getMyRequests(customerId),
    enabled: !!customerId,
  });
}

export function useRequest(id: string) {
  return useQuery({ queryKey: qk.request(id), queryFn: () => api.getRequest(id), enabled: !!id });
}

export function useNearbyRequests(artisanId: string) {
  return useQuery({ queryKey: qk.nearbyRequests(artisanId), queryFn: () => api.getNearbyRequests() });
}

export function useOffers(requestId: string) {
  return useQuery({ queryKey: qk.offers(requestId), queryFn: () => api.getOffers(requestId), enabled: !!requestId });
}

export function useReviews(targetId: string) {
  return useQuery({ queryKey: qk.reviews(targetId), queryFn: () => api.getReviews(targetId), enabled: !!targetId });
}

export function useMessages(requestId: string) {
  return useQuery({
    queryKey: qk.messages(requestId),
    queryFn: () => api.getMessages(requestId),
    enabled: !!requestId,
    refetchInterval: 4000,
  });
}

export function useCreateRequest(customerId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Parameters<typeof api.createRequest>[0]) => api.createRequest(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.requests(customerId) }),
  });
}

export function useAcceptOffer(requestId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (offerId: string) => api.acceptOffer(offerId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.offers(requestId) });
      qc.invalidateQueries({ queryKey: qk.request(requestId) });
    },
  });
}

export function useRejectOffer(requestId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (offerId: string) => api.rejectOffer(offerId),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.offers(requestId) }),
  });
}

export function useSubmitOffer(requestId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Omit<Offer, 'id' | 'status' | 'createdAt'>) => api.submitOffer(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.offers(requestId) }),
  });
}

export function useSendMessage(requestId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (msg: Omit<ChatMessage, 'id' | 'read' | 'createdAt'>) => api.sendMessage(requestId, msg),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.messages(requestId) }),
  });
}
