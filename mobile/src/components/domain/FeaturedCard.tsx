import React from 'react';
import { View } from 'react-native';
import { Card } from '../ui/Card';
import { Icon } from '../ui/Icon';
import { Text } from '../ui/Text';
import { useTheme } from '@/theme/ThemeProvider';
import { useT } from '@/i18n';

const GOLD = '#D97706';

/**
 * The artisan's own view of the "featured artisan" badge: earned (offers shown
 * first, requests reach them before others), or how many completed jobs are
 * still missing.
 */
export function FeaturedCard({ featured, completed, threshold }: { featured: boolean; completed: number; threshold: number }) {
  const { colors } = useTheme();
  const { t } = useT();
  const progress = Math.min(1, completed / threshold);
  return (
    <Card style={{ gap: 12, borderColor: GOLD + '55', backgroundColor: featured ? GOLD + '12' : undefined }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{ width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: GOLD + '22' }}>
          <Icon name={featured ? 'star-filled' : 'star'} size={22} color={GOLD} />
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text variant="bodyMedium">{featured ? t('featured.youAre') : t('featured.goal')}</Text>
          <Text variant="caption" tone="muted">
            {t('featured.perks')}
          </Text>
        </View>
      </View>
      {!featured && (
        <View style={{ gap: 6 }}>
          <View style={{ height: 8, borderRadius: 4, backgroundColor: colors.border, overflow: 'hidden' }}>
            <View style={{ width: `${progress * 100}%`, height: '100%', borderRadius: 4, backgroundColor: GOLD }} />
          </View>
          <Text variant="caption" tone="muted">
            {t('featured.progress').replace('{done}', String(completed)).replace('{total}', String(threshold))}
          </Text>
        </View>
      )}
    </Card>
  );
}
