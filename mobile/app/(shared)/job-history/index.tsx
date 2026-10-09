import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Screen } from '@/components/ui/Screen';
import { Header } from '@/components/ui/Header';
import { Text } from '@/components/ui/Text';
import { CardSkeleton } from '@/components/feedback/Skeleton';
import { EmptyState } from '@/components/feedback/EmptyState';
import { JobRecordCard } from '@/components/domain/JobRecordCard';
import { useJobHistory } from '@/hooks/queries';
import { useAuth } from '@/store/auth';
import { useTheme } from '@/theme/ThemeProvider';
import { useT } from '@/i18n';
import type { JobRecord } from '@/types';

type Tab = JobRecord['kind'];

/**
 * The artisan's work history, opened from the income cards: finished jobs and
 * the offers customers turned down, newest first. Each opens its full record.
 */
export default function JobHistoryScreen() {
  const { colors } = useTheme();
  const { t } = useT();
  const params = useLocalSearchParams<{ tab?: string }>();
  const uid = useAuth((s) => s.user?.uid ?? '');
  const { data, isLoading } = useJobHistory(uid);
  const [tab, setTab] = useState<Tab>(params.tab === 'rejected' ? 'rejected' : 'completed');
  const list = data?.[tab] ?? [];

  return (
    <Screen scroll>
      <Header showBack title={t('hist.title')} />

      {/* Segmented control */}
      <View style={{ flexDirection: 'row', backgroundColor: colors.surface2, borderRadius: 14, padding: 4, marginBottom: 16 }}>
        {(['completed', 'rejected'] as Tab[]).map((key) => {
          const active = tab === key;
          const count = data?.[key].length;
          return (
            <Pressable
              key={key}
              role="tab"
              aria-selected={active}
              onPress={() => setTab(key)}
              style={{ flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: active ? colors.surface : 'transparent', alignItems: 'center', ...(active ? { shadowColor: '#0F172A', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2 } : {}) }}
            >
              <Text variant="caption" tone={active ? 'default' : 'muted'} style={{ fontFamily: active ? 'Inter_600SemiBold' : 'Inter_400Regular' }}>
                {t(`hist.${key}` as const)}
                {count !== undefined ? ` (${count})` : ''}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {isLoading ? (
        <View style={{ gap: 12 }}>{[0, 1, 2].map((i) => <CardSkeleton key={i} />)}</View>
      ) : list.length === 0 ? (
        <View style={{ marginTop: 40 }}>
          <EmptyState
            icon={tab === 'completed' ? 'check-circle' : 'x-circle'}
            title={t(tab === 'completed' ? 'hist.emptyCompleted' : 'hist.emptyRejected')}
            description={t(tab === 'completed' ? 'hist.emptyCompletedDesc' : 'hist.emptyRejectedDesc')}
          />
        </View>
      ) : (
        <View style={{ gap: 12 }}>
          {list.map((r) => (
            <Animated.View key={`${r.kind}_${r.requestId}`} entering={FadeIn.duration(300)}>
              <JobRecordCard
                record={r}
                onPress={() => router.push({ pathname: '/(shared)/job-history/[id]', params: { id: r.requestId, kind: r.kind } })}
              />
            </Animated.View>
          ))}
        </View>
      )}
    </Screen>
  );
}
