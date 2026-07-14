import React from 'react';
import { Badge } from '../ui/Badge';
import type { RequestStatus } from '@/types';
import { useT } from '@/i18n';

const MAP: Record<RequestStatus, { variant: React.ComponentProps<typeof Badge>['variant']; icon: React.ComponentProps<typeof Badge>['icon'] }> = {
  PENDING: { variant: 'warning', icon: 'clock' },
  ACCEPTED: { variant: 'info', icon: 'check-circle' },
  ON_THE_WAY: { variant: 'info', icon: 'navigation' },
  WORKING: { variant: 'primary', icon: 'tools' },
  COMPLETED: { variant: 'success', icon: 'check-circle' },
  CANCELLED: { variant: 'danger', icon: 'x-circle' },
};

export function StatusBadge({ status }: { status: RequestStatus }) {
  const { t } = useT();
  const cfg = MAP[status];
  return <Badge label={t(`status.${status}` as any)} variant={cfg.variant} icon={cfg.icon} />;
}

export const REQUEST_STEPS: RequestStatus[] = ['PENDING', 'ACCEPTED', 'ON_THE_WAY', 'WORKING', 'COMPLETED'];
