import React from 'react';
import { View } from 'react-native';
import { Card } from '../ui/Card';
import { Text } from '../ui/Text';
import { Avatar } from '../ui/Avatar';
import { Rating } from '../ui/Rating';
import { Badge } from '../ui/Badge';
import { Icon } from '../ui/Icon';
import type { AppUser } from '@/types';

interface Props {
  artisan: AppUser;
  subtitle?: string;
  distanceKm?: number;
  onPress?: () => void;
  compact?: boolean;
}

export function ArtisanCard({ artisan, subtitle, distanceKm, onPress, compact }: Props) {
  if (compact) {
    return (
      <Card onPress={onPress} style={{ width: 160, gap: 10 }}>
        <View style={{ alignItems: 'center', gap: 8 }}>
          <Avatar uri={artisan.photoUrl} name={artisan.fullName} size={64} verified={artisan.verified} />
          <Text variant="bodyMedium" center numberOfLines={1}>
            {artisan.fullName}
          </Text>
          <Rating value={artisan.rating} count={artisan.ratingCount} size={13} showValue />
        </View>
      </Card>
    );
  }

  return (
    <Card onPress={onPress}>
      {/* Plain inner row — see ServiceCard for why the row isn't on the Card. */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <Avatar uri={artisan.photoUrl} name={artisan.fullName} size={56} verified={artisan.verified} />
        <View style={{ flex: 1, gap: 4 }}>
          <Text variant="bodyMedium" numberOfLines={1}>
            {artisan.fullName}
          </Text>
          {subtitle && (
            <Text variant="caption" tone="muted" numberOfLines={1}>
              {subtitle}
            </Text>
          )}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Rating value={artisan.rating} count={artisan.ratingCount} size={13} showValue />
            {distanceKm !== undefined && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                <Icon name="map-pin" size={12} color="#94A3B8" />
                <Text variant="caption" tone="muted">
                  {distanceKm.toFixed(1)} km
                </Text>
              </View>
            )}
          </View>
        </View>
        <Icon name="chevron-right" size={20} color="#94A3B8" />
      </View>
    </Card>
  );
}
