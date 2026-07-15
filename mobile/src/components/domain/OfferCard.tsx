import React from 'react';
import { View } from 'react-native';
import { Card } from '../ui/Card';
import { Text } from '../ui/Text';
import { Avatar } from '../ui/Avatar';
import { Rating } from '../ui/Rating';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Icon } from '../ui/Icon';
import type { Offer } from '@/types';
import { formatMoney, timeAgo } from '@/lib/format';
import { useT } from '@/i18n';

interface Props {
  offer: Offer;
  best?: boolean;
  onAccept?: () => void;
  onReject?: () => void;
  onPressArtisan?: () => void;
  loading?: boolean;
}

export function OfferCard({ offer, best, onAccept, onReject, onPressArtisan, loading }: Props) {
  const a = offer.artisan;
  const { t } = useT();
  const decided = offer.status !== 'PENDING';

  return (
    <Card style={{ gap: 14, borderColor: best ? '#3B82F6' : undefined, borderWidth: best ? 1.5 : 1 }}>
      {best && (
        <Badge label={t('offer.best')} variant="primary" icon="award" style={{ position: 'absolute', top: -10, left: 16 }} />
      )}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Avatar uri={a?.photoUrl} name={a?.fullName} size={48} />
        <View style={{ flex: 1, gap: 2 }}>
          <Text variant="bodyMedium" numberOfLines={1} onPress={onPressArtisan}>
            {a?.fullName ?? 'Artisan'}
          </Text>
          <Rating value={a?.rating ?? 0} count={a?.ratingCount} size={12} showValue />
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text variant="h3" tone="primary">
            {formatMoney(offer.price)}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
            <Icon name="clock" size={12} color="#94A3B8" />
            <Text variant="caption" tone="muted">
              ~{offer.etaMinutes} {t('offer.min')}
            </Text>
          </View>
        </View>
      </View>

      {!!offer.message && (
        <Text variant="body" tone="muted" style={{ lineHeight: 20 }}>
          “{offer.message}”
        </Text>
      )}

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text variant="caption" tone="muted">
          {timeAgo(offer.createdAt)}
        </Text>
        {decided ? (
          <Badge
            label={offer.status === 'ACCEPTED' ? t('offer.accepted') : t('offer.rejected')}
            variant={offer.status === 'ACCEPTED' ? 'success' : 'danger'}
          />
        ) : (
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <View style={{ width: 96 }}>
              <Button label={t('offer.reject')} variant="outline" size="sm" onPress={onReject} />
            </View>
            <View style={{ width: 110 }}>
              <Button label={t('offer.accept')} size="sm" onPress={onAccept} loading={loading} />
            </View>
          </View>
        )}
      </View>
    </Card>
  );
}
