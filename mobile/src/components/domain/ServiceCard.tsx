import React from 'react';
import { View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Card } from '../ui/Card';
import { Text } from '../ui/Text';
import { Icon } from '../ui/Icon';
import { Badge } from '../ui/Badge';
import type { Service } from '@/types';
import { categoryById } from '@/constants/categories';
import { formatMoney } from '@/lib/format';
import { useT } from '@/i18n';

interface Props {
  service: Service;
  locale?: 'ar' | 'en';
  onPress?: () => void;
}

export function ServiceCard({ service, locale = 'en', onPress }: Props) {
  const cat = categoryById(service.categoryId);
  const color = cat?.colorHex ?? '#3B82F6';
  const { t } = useT();

  return (
    <Card onPress={onPress} style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
      <LinearGradient
        colors={[color, color + 'CC']}
        style={{ width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }}
      >
        <Icon name={service.icon as any} size={24} color="#FFFFFF" />
      </LinearGradient>
      <View style={{ flex: 1, gap: 4 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text variant="bodyMedium" numberOfLines={1} style={{ flex: 1 }}>
            {service.name[locale]}
          </Text>
          {service.popular && <Badge label={t('common.popular')} variant="primary" icon="trending-up" />}
        </View>
        <Text variant="caption" tone="muted" numberOfLines={1}>
          {service.description[locale]}
        </Text>
        <Text variant="caption" tone="primary" style={{ fontFamily: 'Inter_600SemiBold' }}>
          {t('common.from')} {formatMoney(service.basePriceFrom)}
        </Text>
      </View>
      <Icon name="chevron-right" size={20} color="#94A3B8" />
    </Card>
  );
}
