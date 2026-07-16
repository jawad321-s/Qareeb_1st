import React from 'react';
import { Pressable, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Screen } from '@/components/ui/Screen';
import { Header } from '@/components/ui/Header';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import { formatMoney, timeAgo } from '@/lib/format';
import { useTheme } from '@/theme/ThemeProvider';
import { useT } from '@/i18n';
import type { WalletTransaction } from '@/types';

const TXNS: Record<'en' | 'ar', WalletTransaction[]> = {
  en: [
    { id: 't1', type: 'debit', amount: 12000, reason: 'Plumbing — Omar Khalid', requestId: 'req_1', createdAt: Date.now() - 3 * 24 * 3600_000 },
    { id: 't2', type: 'credit', amount: 5000, reason: 'Referral bonus', createdAt: Date.now() - 6 * 24 * 3600_000 },
    { id: 't3', type: 'debit', amount: 32000, reason: 'Deep clean — Yousef Nasser', requestId: 'req_3', createdAt: Date.now() - 10 * 24 * 3600_000 },
  ],
  ar: [
    { id: 't1', type: 'debit', amount: 12000, reason: 'سباكة — عمر خالد', requestId: 'req_1', createdAt: Date.now() - 3 * 24 * 3600_000 },
    { id: 't2', type: 'credit', amount: 5000, reason: 'مكافأة إحالة', createdAt: Date.now() - 6 * 24 * 3600_000 },
    { id: 't3', type: 'debit', amount: 32000, reason: 'تنظيف عميق — يوسف ناصر', requestId: 'req_3', createdAt: Date.now() - 10 * 24 * 3600_000 },
  ],
};

export default function Wallet() {
  const { colors, gradient } = useTheme();
  const { t, locale } = useT();
  const txns = TXNS[locale];
  return (
    <Screen scroll>
      <Header showBack title={t('wallet.title')} />
      <Animated.View entering={FadeInDown.duration(400)}>
        <LinearGradient colors={gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ borderRadius: 24, padding: 24, gap: 6 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text variant="caption" style={{ color: 'rgba(255,255,255,0.85)' }}>
              {t('wallet.balance')}
            </Text>
            <Icon name="wallet" size={22} color="#FFF" />
          </View>
          <AnimatedNumber value={43000} format={(n) => formatMoney(n)} variant="display" tone="inverse" />
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
            <View style={{ flex: 1 }}>
              <Button label={t('wallet.topUp')} variant="secondary" size="sm" iconLeft="plus" onPress={() => {}} />
            </View>
            <Pressable
              onPress={() => {}}
              style={{
                flex: 1,
                height: 40,
                borderRadius: 16,
                backgroundColor: 'rgba(255,255,255,0.18)',
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.35)',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              <Icon name="arrow-right" size={16} color="#FFFFFF" />
              <Text variant="caption" tone="inverse" style={{ fontFamily: 'Inter_600SemiBold' }}>
                {t('wallet.withdraw')}
              </Text>
            </Pressable>
          </View>
        </LinearGradient>
      </Animated.View>

      <Text variant="h3" style={{ marginTop: 24, marginBottom: 12 }}>
        {t('wallet.transactions')}
      </Text>
      <View style={{ gap: 10 }}>
        {txns.map((tx) => (
          <Card key={tx.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: (tx.type === 'credit' ? '#10B981' : '#EF4444') + '18', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name={tx.type === 'credit' ? 'trending-up' : 'wallet'} size={20} color={tx.type === 'credit' ? '#10B981' : '#EF4444'} />
            </View>
            <View style={{ flex: 1 }}>
              <Text variant="bodyMedium" numberOfLines={1}>
                {tx.reason}
              </Text>
              <Text variant="caption" tone="muted">
                {timeAgo(tx.createdAt)}
              </Text>
            </View>
            <Text variant="bodyMedium" tone={tx.type === 'credit' ? 'success' : 'default'}>
              {tx.type === 'credit' ? '+' : '-'}
              {formatMoney(tx.amount)}
            </Text>
          </Card>
        ))}
      </View>
    </Screen>
  );
}
