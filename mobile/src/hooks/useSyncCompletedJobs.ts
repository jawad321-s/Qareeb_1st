import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import { config } from '@/lib/config';
import { qk } from '@/lib/queryClient';
import { useArtisan } from './queries';

/**
 * Keeps artisanProfiles/{uid}.completedJobs, the job count customers see on the
 * artisan's public profile, equal to the jobs the artisan actually finished.
 * Nothing server-side counts them, so the artisan's own app refreshes the
 * stored figure whenever its job history shows a different number.
 */
export function useSyncCompletedJobs(uid: string, completed: number | undefined) {
  const qc = useQueryClient();
  const artisan = useArtisan(uid);
  const stored = artisan.data?.profile.completedJobs;

  useEffect(() => {
    // The demo keeps its sample figures.
    if (config.useMock || !uid || completed === undefined || !artisan.data || stored === completed) return;
    api
      .setCompletedJobs(uid, completed)
      .then(() => qc.invalidateQueries({ queryKey: qk.artisan(uid) }))
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid, completed, stored, !!artisan.data]);
}
