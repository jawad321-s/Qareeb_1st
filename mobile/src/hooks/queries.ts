import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import { qk } from '@/lib/queryClient';
import type { AppUser, GeoLocation, Offer, RequestStatus, Review, ServiceRequest, ChatMessage } from '@/types';
import { distanceKm } from '@/lib/geo';

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

export type NearbyRequest = ServiceRequest & { distanceKm?: number };

/**
 * Open requests for an artisan, nearest first. Distances are measured from the
 * artisan's saved location; without one the list keeps its server order.
 */
export function useNearbyRequests(artisanId: string, origin?: GeoLocation | null) {
  return useQuery({
    queryKey: qk.nearbyRequests(artisanId),
    queryFn: () => api.getNearbyRequests(),
    select: (list): NearbyRequest[] =>
      origin
        ? list
            .map((r) => ({ ...r, distanceKm: r.location ? distanceKm(origin, r.location) : undefined }))
            // Requests without a location sort last.
            .sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity))
        : list,
  });
}

export function useOffers(requestId: string) {
  return useQuery({ queryKey: qk.offers(requestId), queryFn: () => api.getOffers(requestId), enabled: !!requestId });
}

export function useReviews(targetId: string) {
  return useQuery({ queryKey: qk.reviews(targetId), queryFn: () => api.getReviews(targetId), enabled: !!targetId });
}

export function useUser(uid: string | undefined) {
  return useQuery({ queryKey: qk.user(uid ?? ''), queryFn: () => api.getUser(uid!), enabled: !!uid });
}

/**
 * The completed job the signed-in user still has to rate, or null. Rating is
 * mandatory on both sides: each role layout redirects to the review while this
 * returns a request.
 */
export function usePendingReview(user: Pick<AppUser, 'uid' | 'role'> | null) {
  const role = user?.role === 'artisan' ? 'artisan' : 'customer';
  return useQuery({
    queryKey: qk.pendingReview(user?.uid ?? ''),
    queryFn: () => api.getPendingReview(user!.uid, role),
    enabled: !!user,
    // Re-check now and then: a job can be auto-completed while the app is open.
    refetchInterval: 2 * 60_000,
  });
}

export function useHasReviewed(requestId: string, uid: string | undefined) {
  return useQuery({
    queryKey: qk.hasReviewed(requestId, uid ?? ''),
    queryFn: () => api.hasReviewed(requestId, uid!),
    enabled: !!requestId && !!uid,
  });
}

export function useSubmitReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Omit<Review, 'id' | 'createdAt'>) => api.submitReview(input),
    onSuccess: async (review) => {
      // Drop the pending-review answer rather than just invalidating it: the
      // role layout re-reads it on mount, and a stale cached request would
      // bounce the user straight back into the review they just submitted.
      qc.removeQueries({ queryKey: qk.pendingReview(review.authorId) });
      await Promise.all([
        qc.invalidateQueries({ queryKey: qk.hasReviewed(review.requestId, review.authorId) }),
        qc.invalidateQueries({ queryKey: qk.reviews(review.targetId) }),
      ]);
    },
  });
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

/**
 * Cancel a request. Available to the customer who owns it and to the artisan
 * assigned to it, while its status still allows cancelling.
 */
export function useCancelRequest(requestId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.cancelRequest(requestId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.request(requestId) });
      qc.invalidateQueries({ queryKey: qk.offers(requestId) });
      // Both sides' lists show this request, so refresh them too.
      qc.invalidateQueries({ queryKey: ['requests'] });
      qc.invalidateQueries({ queryKey: ['nearbyRequests'] });
    },
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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.messages(requestId) });
      qc.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

/** The user's chat threads, most recent first. */
export function useConversations(user: Pick<AppUser, 'uid' | 'role'> | null) {
  const role = user?.role === 'artisan' ? 'artisan' : 'customer';
  return useQuery({
    queryKey: qk.conversations(user?.uid ?? ''),
    queryFn: () => api.getConversations(user!.uid, role),
    enabled: !!user,
    refetchInterval: 8000,
  });
}

/** Jobs assigned to the artisan that are still in progress. */
export function useArtisanJobs(artisanId: string) {
  return useQuery({ queryKey: qk.artisanJobs(artisanId), queryFn: () => api.getArtisanJobs(artisanId), enabled: !!artisanId });
}

/** The assigned artisan moves a job on (on the way → working → finished). */
export function useUpdateRequestStatus(requestId: string, userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (status: RequestStatus) => api.updateRequestStatus(requestId, status),
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: qk.request(requestId) }),
        qc.invalidateQueries({ queryKey: qk.artisanJobs(userId) }),
        qc.invalidateQueries({ queryKey: ['conversations'] }),
        qc.invalidateQueries({ queryKey: ['requests'] }),
        // Finishing a job opens the mandatory rating.
        qc.invalidateQueries({ queryKey: qk.pendingReview(userId) }),
      ]);
    },
  });
}
