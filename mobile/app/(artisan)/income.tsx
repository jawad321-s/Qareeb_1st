import React from 'react';
import { View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Screen } from '@/components/ui/Screen';
import { Header } from '@/components/ui/Header';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { BarChart } from '@/components/domain/BarChart';
import { formatMoney } from '@/lib/format';
import { useT } from '@/i18n';

const MONTHLY = [
  { label: 'Jan', value: 8200 },
  { label: 'Feb', value: 9600 },
  { label: 'Mar', value: 7400 },
  { label: 'Apr', value: 11200 },
  { label: 'May', value: 10400 },
  { label: 'Jun', value: 12400 },
];

const BREAKDOWN = [
  { icon: 'check-circle' as const, label: 'Completed jobs', value: '214', color: '#10B981' },
  { icon: 'x-circle' as const, label: 'Rejected jobs', value: '18', color: '#EF4444' },
  { icon: 'clock' as const, label: 'Avg. response', value: '6 min', color: '#F59E0B' },
  { icon: 'star' as const, label: 'Avg. rating', value: '4.8', color: '#6366F1' },
];

export default function Income() {
  const { t } = useT();
  return (
    <Screen scroll>
      <Header title={t('artisan.income')} />

      <Animated.View entering={FadeInDown.duration(400)}>
        <LinearGradient colors={['#10B981', '#06B6D4']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ borderRadius: 24, padding: 24, gap: 4 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text variant="caption" style={{ color: 'rgba(255,255,255,0.85)' }}>
              {t('artisan.totalMonth')}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 }}>
              <Icon name="trending-up" size={12} color="#FFF" />
              <Text variant="overline" tone="inverse">
                +19%
              </Text>
            </View>
          </View>
          <Text variant="display" tone="inverse">
            {formatMoney(1240000)}
          </Text>
        </LinearGradient>
      </Animated.View>

      <Card style={{ marginTop: 20, gap: 16 }}>
        <Text variant="h3">Last 6 months</Text>
        <BarChart data={MONTHLY} />
      </Card>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 20 }}>
        {BREAKDOWN.map((b) => (
          <Card key={b.label} style={{ width: '47%', gap: 8, paddingVertical: 16 }}>
            <View style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: b.color + '20', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name={b.icon} size={20} color={b.color} />
            </View>
            <Text variant="h3">{b.value}</Text>
            <Text variant="caption" tone="muted">
              {b.label}
            </Text>
          </Card>
        ))}
      </View>
    </Screen>
  );
}
