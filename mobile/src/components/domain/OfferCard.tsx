import React from 'react';
import { View } from 'react-native';
import { Card } from '../ui/Card';
import { Text } from '../ui/Text';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Icon } from '../ui/Icon';
import { PersonRow } from './PersonRow';
import type { Offer } from '@/types';
import { formatMoney, timeAgo } from '@/lib/format';
import { useT } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';

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
  const { colors } = useTheme();
  const decided = offer.status !== 'PENDING';

  return (
    <Card style={{ gap: 14, borderColor: best ? colors.tint : undefined, borderWidth: best ? 1.5 : 1 }}>
      {best && (
        <View style={{ flexDirection: 'row' }}>
          <Badge label={t('offer.best')} variant="primary" icon="award" />
        </View>
      )}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <PersonRow name={a?.fullName ?? 'Artisan'} photoUrl={a?.photoUrl} rating={a?.rating} ratingCount={a?.ratingCount} onPress={onPressArtisan} />
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
