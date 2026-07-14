import React from 'react';
import { Badge } from '../ui/Badge';
import type { RequestStatus } from '@/types';

const MAP: Record<RequestStatus, { label: string; variant: React.ComponentProps<typeof Badge>['variant']; icon: React.ComponentProps<typeof Badge>['icon'] }> = {
  PENDING: { label: 'Pending', variant: 'warning', icon: 'clock' },
  ACCEPTED: { label: 'Accepted', variant: 'info', icon: 'check-circle' },
  ON_THE_WAY: { label: 'On the way', variant: 'info', icon: 'navigation' },
  WORKING: { label: 'In progress', variant: 'primary', icon: 'tools' },
  COMPLETED: { label: 'Completed', variant: 'success', icon: 'check-circle' },
  CANCELLED: { label: 'Cancelled', variant: 'danger', icon: 'x-circle' },
};

export function StatusBadge({ status }: { status: RequestStatus }) {
  const cfg = MAP[status];
  return <Badge label={cfg.label} variant={cfg.variant} icon={cfg.icon} />;
}

export const REQUEST_STEPS: RequestStatus[] = ['PENDING', 'ACCEPTED', 'ON_THE_WAY', 'WORKING', 'COMPLETED'];
