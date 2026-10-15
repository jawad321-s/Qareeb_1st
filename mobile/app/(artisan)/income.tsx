import React, { useCallback } from 'react';
import { View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Screen } from '@/components/ui/Screen';
import { useTabBarSpace } from '@/components/ui/TabBar';
import { Header } from '@/components/ui/Header';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { BarChart } from '@/components/domain/BarChart';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import { formatMoney } from '@/lib/format';
import { incomeSummary } from '@/lib/income';
import { useJobHistory } from '@/hooks/queries';
import { useAuth } from '@/store/auth';
import { useT } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';

export default function Income() {
  const { colors } = useTheme();
  const { t, locale } = useT();
  const tabBarSpace = useTabBarSpace();
  const user = useAuth((s) => s.user)!;
  const history = useJobHistory(user.uid);
  // Tabs stay mounted, so pick up jobs finished since the screen was last shown.
  const { refetch } = history;
  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch]),
  );
  // Income = the prices of completed jobs only (see lib/income).
  const income = incomeSummary(history.data?.completed ?? [], locale);
  const loading = !history.data;
  const count = (n?: number) => (n === undefined ? '…' : String(n));
  // The job counts open the work history on the matching tab.
  const BREAKDOWN = [
    { icon: 'check-circle' as const, label: t('inc.completedJobs'), value: count(history.data?.completed.length), color: '#10B981', tab: 'completed' },
    { icon: 'x-circle' as const, label: t('inc.rejectedJobs'), value: count(history.data?.rejected.length), color: '#EF4444', tab: 'rejected' },
    { icon: 'wallet' as const, label: t('inc.avgJob'), value: loading ? '…' : formatMoney(income.average), color: '#F59E0B' },
    { icon: 'star' as const, label: t('inc.avgRating'), value: user.rating.toFixed(1), color: colors.tint },
  ];
  return (
    // Bottom padding must clear the floating tab bar (Screen's default doesn't).
    <Screen scroll contentStyle={{ paddingBottom: tabBarSpace + 12 }}>
      <Header title={t('artisan.income')} />

      <Animated.View entering={FadeInDown.duration(400)}>
        <LinearGradient colors={['#059669', '#34D399']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ borderRadius: 24, padding: 24, gap: 4 }}>
          <Text variant="caption" style={{ color: 'rgba(255,255,255,0.85)' }}>
            {t('inc.total')}
          </Text>
          <AnimatedNumber value={income.total} format={(n) => formatMoney(Math.round(n))} variant="display" tone="inverse" />
          <Text variant="caption" style={{ color: 'rgba(255,255,255,0.85)' }}>
            {t('inc.basis')}
          </Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.25)' }}>
            <Text variant="bodyMedium" tone="inverse">
              {t('artisan.thisMonth')}: {formatMoney(income.thisMonth)}
            </Text>
            {/* Change vs last month, once there is a last month to compare with. */}
            {income.change !== undefined && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 }}>
                <Icon name={income.change >= 0 ? 'trending-up' : 'trending-down'} size={12} color="#FFF" />
                <Text variant="overline" tone="inverse">
                  {income.change >= 0 ? '+' : ''}
                  {income.change}%
                </Text>
              </View>
            )}
          </View>
        </LinearGradient>
      </Animated.View>

      <Card style={{ marginTop: 20, gap: 16 }}>
        <Text variant="h3">{t('inc.last6')}</Text>
        <BarChart data={income.monthly} />
      </Card>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 20 }}>
        {BREAKDOWN.map((b) => (
          // Width sits on a wrapper: a pressable Card nests its surface inside a
          // Pressable, so a percentage width on the Card itself collapses.
          <View key={b.label} style={{ width: '47%' }}>
            <Card
              onPress={b.tab ? () => router.push({ pathname: '/(shared)/job-history', params: { tab: b.tab } }) : undefined}
              style={{ gap: 8, paddingVertical: 16 }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: b.color + '20', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name={b.icon} size={20} color={b.color} />
                </View>
                {b.tab && <Icon name="chevron-right" size={18} color={colors.muted} />}
              </View>
              <Text variant="h3">{b.value}</Text>
              <Text variant="caption" tone="muted">
                {b.label}
              </Text>
            </Card>
          </View>
        ))}
      </View>
    </Screen>
  );
}
