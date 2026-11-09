import React from 'react';
import { View } from 'react-native';
import { Card } from '../ui/Card';
import { Text } from '../ui/Text';
import { Icon } from '../ui/Icon';
import { Avatar } from '../ui/Avatar';
import { Rating } from '../ui/Rating';
import { StatusBadge } from './StatusBadge';
import { useUser } from '@/hooks/queries';
import type { ServiceRequest } from '@/types';
import { categoryById } from '@/constants/categories';
import { formatDistance, formatMoney, timeAgo } from '@/lib/format';
import { useT } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';

export function RequestCard({
  request,
  onPress,
  distanceKm,
  showCustomer,
}: {
  request: ServiceRequest;
  onPress?: () => void;
  /** Shown on the artisan side: how far the job is from the artisan. */
  distanceKm?: number;
  /** Artisan side: who posted the request, so they know who they'd work for. */
  showCustomer?: boolean;
}) {
  const cat = categoryById(request.categoryId);
  const { t } = useT();
  const { isDark, colors } = useTheme();
  const { data: customer } = useUser(showCustomer ? request.customerId : undefined);
  return (
    <Card onPress={onPress} style={{ gap: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
          <View
            style={{
              width: 42,
              height: 42,
              borderRadius: 13,
              backgroundColor: (cat?.colorHex ?? '#3B82F6') + (isDark ? '26' : '14'),
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon name={(cat?.icon as any) ?? 'tools'} size={20} color={cat?.colorHex ?? '#3B82F6'} />
          </View>
          <View style={{ flex: 1 }}>
            <Text variant="bodyMedium" numberOfLines={1}>
              {request.title}
            </Text>
            <Text variant="caption" tone="muted">
              {timeAgo(request.createdAt)}
            </Text>
          </View>
        </View>
        <StatusBadge status={request.status} />
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Icon name="wallet" size={14} color="#94A3B8" />
          <Text variant="caption" tone="muted">
            {formatMoney(request.budget.min)}–{formatMoney(request.budget.max)}
          </Text>
        </View>
        {distanceKm !== undefined && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Icon name="map-pin" size={14} color="#94A3B8" />
            <Text variant="caption" tone="muted">
              {formatDistance(distanceKm)}
            </Text>
          </View>
        )}
        {request.status === 'PENDING' && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Icon name="message" size={14} color="#94A3B8" />
            <Text variant="caption" tone="muted">
              {request.offerCount} {t('common.offers')}
            </Text>
          </View>
        )}
      </View>

      {customer && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.border }}>
          <Avatar uri={customer.photoUrl} name={customer.fullName} size={26} />
          <Text variant="caption" numberOfLines={1} style={{ flexShrink: 1, fontFamily: 'Inter_500Medium' }}>
            {customer.fullName}
          </Text>
          <Rating value={customer.rating} size={11} showValue />
        </View>
      )}
    </Card>
  );
}
