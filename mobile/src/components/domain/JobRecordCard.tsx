import React from 'react';
import { View } from 'react-native';
import { Card } from '../ui/Card';
import { Text } from '../ui/Text';
import { Icon } from '../ui/Icon';
import { Badge } from '../ui/Badge';
import { categoryById } from '@/constants/categories';
import { useUser } from '@/hooks/queries';
import { formatDate, formatMoney } from '@/lib/format';
import { useTheme } from '@/theme/ThemeProvider';
import { useT } from '@/i18n';
import type { JobRecord } from '@/types';
import { successText } from '@/theme/tokens';

/** One row of the artisan's work history: a finished job or a turned-down offer. */
export function JobRecordCard({ record, onPress }: { record: JobRecord; onPress?: () => void }) {
  const { colors, isDark } = useTheme();
  const { t, locale } = useT();
  const { data: customer } = useUser(record.customerId);
  const cat = record.categoryId ? categoryById(record.categoryId) : undefined;
  const color = cat?.colorHex ?? colors.tint;

  return (
    <Card onPress={onPress} style={{ gap: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{ width: 44, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: color + (isDark ? '26' : '14') }}>
          <Icon name={(cat?.icon as any) ?? 'tools'} size={20} color={color} />
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text variant="bodyMedium" numberOfLines={1}>
            {record.title || cat?.name[locale] || t('hist.untitled')}
          </Text>
          <Text variant="caption" tone="muted" numberOfLines={1}>
            {customer?.fullName ?? cat?.name[locale] ?? ''}
          </Text>
        </View>
        {record.price !== undefined && (
          <Text variant="bodyMedium" style={{ color: record.kind === 'completed' ? successText(isDark) : colors.muted }}>
            {formatMoney(record.price)}
          </Text>
        )}
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
          <Icon name="calendar" size={14} color={colors.muted} />
          <Text variant="caption" tone="muted">
            {formatDate(record.date)}
          </Text>
        </View>
        {/* The artisan doesn't see how each customer rated them, only their overall rating. */}
        {record.kind === 'completed' ? (
          <Badge label={t('hist.done')} variant="success" icon="check-circle" />
        ) : (
          <Badge
            label={t(`hist.reason.${record.reason ?? 'declined'}` as any)}
            variant={record.kind === 'cancelled' ? 'neutral' : 'danger'}
            icon={record.kind === 'cancelled' ? 'slash' : 'x-circle'}
          />
        )}
      </View>
    </Card>
  );
}
