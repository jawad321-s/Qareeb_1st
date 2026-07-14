import React from 'react';
import { View } from 'react-native';
import { Text } from '../ui/Text';
import { Icon } from '../ui/Icon';
import { REQUEST_STEPS } from './StatusBadge';
import type { RequestStatus } from '@/types';
import { useTheme } from '@/theme/ThemeProvider';
import { useT } from '@/i18n';

const ICONS: Record<RequestStatus, any> = {
  PENDING: 'clock',
  ACCEPTED: 'check-circle',
  ON_THE_WAY: 'navigation',
  WORKING: 'tools',
  COMPLETED: 'award',
  CANCELLED: 'x-circle',
};

export function TrackingTimeline({ status }: { status: RequestStatus }) {
  const { colors } = useTheme();
  const { t } = useT();
  if (status === 'CANCELLED') return null;
  const currentIndex = REQUEST_STEPS.indexOf(status);

  return (
    <View style={{ gap: 0 }}>
      {REQUEST_STEPS.map((step, i) => {
        const done = i < currentIndex;
        const active = i === currentIndex;
        const stepIcon = ICONS[step];
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
                <Icon name={done ? 'check' : stepIcon} size={16} color={done ? '#FFF' : active ? colors.tint : colors.muted} strokeWidth={done ? 3 : 2} />
              </View>
              {i < REQUEST_STEPS.length - 1 && (
                <View style={{ width: 2, flex: 1, minHeight: 28, backgroundColor: i < currentIndex ? colors.tint : colors.border }} />
              )}
            </View>
            <View style={{ flex: 1, paddingBottom: 20 }}>
              <Text variant="bodyMedium" tone={active ? 'primary' : done ? 'default' : 'muted'}>
                {t(`track.${step}.title` as any)}
              </Text>
              <Text variant="caption" tone="muted">
                {t(`track.${step}.desc` as any)}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}
