import React from 'react';
import { View } from 'react-native';
import { Card } from '../ui/Card';
import { Icon } from '../ui/Icon';
import { Text } from '../ui/Text';
import { useTheme } from '@/theme/ThemeProvider';
import { useT } from '@/i18n';

const GOLD = '#D97706';
const GREEN = '#10B981';

/**
 * The artisan's own view of the "featured artisan" badge: earned (offers shown
 * first, requests reach them before others), or what is still missing — the
 * completed jobs and a rating above the minimum.
 */
export function FeaturedCard({
  featured,
  completed,
  threshold,
  rating,
  minRating,
}: {
  featured: boolean;
  completed: number;
  threshold: number;
  /** Average rating received (0 when none yet). */
  rating: number;
  minRating: number;
}) {
  const { colors } = useTheme();
  const { t } = useT();
  const progress = Math.min(1, completed / threshold);
  const jobsOk = completed >= threshold;
  const ratingOk = rating > minRating;
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
        <View style={{ gap: 10 }}>
          <View style={{ gap: 6 }}>
            <Condition ok={jobsOk} label={t('featured.progress').replace('{done}', String(completed)).replace('{total}', String(threshold))} />
            <View style={{ height: 8, borderRadius: 4, backgroundColor: colors.border, overflow: 'hidden' }}>
              <View style={{ width: `${progress * 100}%`, height: '100%', borderRadius: 4, backgroundColor: GOLD }} />
            </View>
          </View>
          <Condition
            ok={ratingOk}
            label={t('featured.rating').replace('{rating}', rating ? rating.toFixed(1) : '—').replace('{min}', String(minRating))}
          />
        </View>
      )}
    </Card>
  );
}

function Condition({ ok, label }: { ok: boolean; label: string }) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <Icon name={ok ? 'check-circle' : 'clock'} size={15} color={ok ? GREEN : colors.muted} />
      <Text variant="caption" tone={ok ? 'default' : 'muted'} style={{ flex: 1 }}>
        {label}
      </Text>
    </View>
  );
}
