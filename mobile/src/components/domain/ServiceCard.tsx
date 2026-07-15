import React from 'react';
import { View } from 'react-native';
import { Card } from '../ui/Card';
import { Text } from '../ui/Text';
import { Icon } from '../ui/Icon';
import { Badge } from '../ui/Badge';
import type { Service } from '@/types';
import { categoryById } from '@/constants/categories';
import { formatMoney } from '@/lib/format';
import { useT } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';

interface Props {
  service: Service;
  locale?: 'ar' | 'en';
  onPress?: () => void;
}

export function ServiceCard({ service, locale = 'en', onPress }: Props) {
  const cat = categoryById(service.categoryId);
  const color = cat?.colorHex ?? '#3B82F6';
  const { t } = useT();
  const { colors, isDark } = useTheme();

  return (
    <Card onPress={onPress} style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
      <View
        style={{
          width: 50,
          height: 50,
          borderRadius: 15,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: color + (isDark ? '26' : '14'),
        }}
      >
        <Icon name={service.icon as any} size={23} color={color} />
      </View>
      <View style={{ flex: 1, gap: 3 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text variant="bodyMedium" numberOfLines={1} style={{ flex: 1 }}>
            {service.name[locale]}
          </Text>
          {service.popular && <Badge label={t('common.popular')} variant="primary" icon="trending-up" />}
        </View>
        <Text variant="caption" tone="muted" numberOfLines={1}>
          {service.description[locale]}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
          <Text variant="caption" tone="muted">
            {t('common.from')}
          </Text>
          <Text variant="bodyMedium" tone="primary" style={{ fontFamily: 'Inter_600SemiBold', fontVariant: ['tabular-nums'] }}>
            {formatMoney(service.basePriceFrom)}
          </Text>
        </View>
      </View>
      <Icon name="chevron-right" size={18} color={colors.tabInactive} />
    </Card>
  );
}
