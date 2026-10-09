import React from 'react';
import { View } from 'react-native';
import { Card } from '../ui/Card';
import { Text } from '../ui/Text';
import { Icon } from '../ui/Icon';
import { Badge } from '../ui/Badge';
import { Rating } from '../ui/Rating';
import { categoryById } from '@/constants/categories';
import { useUser } from '@/hooks/queries';
import { formatDate, formatMoney } from '@/lib/format';
import { useTheme } from '@/theme/ThemeProvider';
import { useT } from '@/i18n';
import type { JobRecord } from '@/types';

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
          <Text variant="bodyMedium" style={{ color: record.kind === 'completed' ? '#059669' : colors.muted }}>
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
        {record.kind === 'completed' ? (
          record.rating !== undefined ? (
            <Rating value={record.rating} size={13} />
          ) : (
            <Badge label={t('hist.awaitingRating')} variant="warning" icon="clock" />
          )
        ) : (
          <Badge label={t(`hist.reason.${record.reason ?? 'declined'}` as any)} variant="danger" icon="x-circle" />
        )}
      </View>
    </Card>
  );
}
