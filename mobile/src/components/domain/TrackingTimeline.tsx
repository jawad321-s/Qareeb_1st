import React from 'react';
import { View } from 'react-native';
import { Text } from '../ui/Text';
import { Icon } from '../ui/Icon';
import { REQUEST_STEPS } from './StatusBadge';
import type { RequestStatus } from '@/types';
import { useTheme } from '@/theme/ThemeProvider';

const LABELS: Record<RequestStatus, { title: string; desc: string; icon: any }> = {
  PENDING: { title: 'Request posted', desc: 'Waiting for artisan offers', icon: 'clock' },
  ACCEPTED: { title: 'Offer accepted', desc: 'Artisan confirmed the job', icon: 'check-circle' },
  ON_THE_WAY: { title: 'On the way', desc: 'Artisan is heading to you', icon: 'navigation' },
  WORKING: { title: 'In progress', desc: 'Work is underway', icon: 'tools' },
  COMPLETED: { title: 'Completed', desc: 'Job finished — leave a review', icon: 'award' },
  CANCELLED: { title: 'Cancelled', desc: '', icon: 'x-circle' },
};

export function TrackingTimeline({ status }: { status: RequestStatus }) {
  const { colors } = useTheme();
  if (status === 'CANCELLED') return null;
  const currentIndex = REQUEST_STEPS.indexOf(status);

  return (
    <View style={{ gap: 0 }}>
      {REQUEST_STEPS.map((step, i) => {
        const done = i < currentIndex;
        const active = i === currentIndex;
        const meta = LABELS[step];
        const color = done || active ? colors.tint : colors.border;
        return (
          <View key={step} style={{ flexDirection: 'row', gap: 14 }}>
            <View style={{ alignItems: 'center' }}>
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: done ? colors.tint : active ? colors.tint + '22' : colors.surface2,
                  borderWidth: active ? 2 : 0,
                  borderColor: colors.tint,
                }}
              >
                <Icon name={done ? 'check' : meta.icon} size={16} color={done ? '#FFF' : active ? colors.tint : colors.muted} strokeWidth={done ? 3 : 2} />
              </View>
              {i < REQUEST_STEPS.length - 1 && (
                <View style={{ width: 2, flex: 1, minHeight: 28, backgroundColor: i < currentIndex ? colors.tint : colors.border }} />
              )}
            </View>
            <View style={{ flex: 1, paddingBottom: 20 }}>
              <Text variant="bodyMedium" tone={active ? 'primary' : done ? 'default' : 'muted'}>
                {meta.title}
              </Text>
              <Text variant="caption" tone="muted">
                {meta.desc}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}
