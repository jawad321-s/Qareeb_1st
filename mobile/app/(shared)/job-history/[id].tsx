import React from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Screen } from '@/components/ui/Screen';
import { Header } from '@/components/ui/Header';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Icon, type IconName } from '@/components/ui/Icon';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Rating } from '@/components/ui/Rating';
import { Button } from '@/components/ui/Button';
import { CardSkeleton } from '@/components/feedback/Skeleton';
import { EmptyState } from '@/components/feedback/EmptyState';
import { StatusBadge } from '@/components/domain/StatusBadge';
import { categoryById } from '@/constants/categories';
import { useJobHistory, useUser } from '@/hooks/queries';
import { formatDate, formatMoney } from '@/lib/format';
import { AUTO_COMPLETE_HOURS } from '@/lib/requestRules';
import { useAuth } from '@/store/auth';
import { useTheme } from '@/theme/ThemeProvider';
import { useT } from '@/i18n';

/** Full record of one history entry: the job, the customer, the artisan's offer and how it ended. */
export default function JobRecordScreen() {
  const { colors, isDark } = useTheme();
  const { t, locale } = useT();
  const { id, kind } = useLocalSearchParams<{ id: string; kind?: string }>();
  const uid = useAuth((s) => s.user?.uid ?? '');
  const { data, isLoading } = useJobHistory(uid);
  const record = (kind === 'rejected' ? data?.rejected : data?.completed)?.find((r) => r.requestId === id);
  const { data: customer } = useUser(record?.customerId);

  if (isLoading || !record) {
    return (
      <Screen scroll>
        <Header showBack title={t('hist.detailTitle')} />
        {isLoading ? <CardSkeleton /> : <EmptyState icon="info" title={t('hist.notFound')} />}
      </Screen>
    );
  }

  const cat = record.categoryId ? categoryById(record.categoryId) : undefined;
  const color = cat?.colorHex ?? colors.tint;
  const done = record.kind === 'completed';

  return (
    <Screen scroll>
      <Header showBack title={t('hist.detailTitle')} />

      <Animated.View entering={FadeInDown.duration(400)} style={{ gap: 16 }}>
        {/* The job */}
        <Card style={{ gap: 14 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ width: 46, height: 46, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: color + (isDark ? '26' : '14') }}>
              <Icon name={(cat?.icon as any) ?? 'tools'} size={22} color={color} />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text variant="h3">{record.title || cat?.name[locale] || t('hist.untitled')}</Text>
              {cat && (
                <Text variant="caption" tone="muted">
                  {cat.name[locale]}
                </Text>
              )}
            </View>
          </View>
          {done ? <StatusBadge status="COMPLETED" /> : <Badge label={t('ostatus.REJECTED')} variant="danger" icon="x-circle" />}
          {!!record.description && (
            <Text variant="body" tone="muted" style={{ lineHeight: 21 }}>
              {record.description}
            </Text>
          )}
          {!!record.address && <Detail icon="map-pin" label={record.address} />}
        </Card>

        {/* The customer */}
        <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Avatar uri={customer?.photoUrl} name={customer?.fullName} size={46} verified={customer?.verified} />
          <View style={{ flex: 1, gap: 2 }}>
            <Text variant="caption" tone="muted">
              {t('hist.customer')}
            </Text>
            <Text variant="bodyMedium">{customer?.fullName ?? '…'}</Text>
          </View>
        </Card>

        {/* The artisan's offer */}
        <Card style={{ gap: 12 }}>
          <Text variant="h3">{t('hist.myOffer')}</Text>
          <Row label={t(done ? 'hist.completedOn' : 'hist.offeredOn')} value={formatDate(record.date)} />
          {record.price !== undefined && <Row label={t('hist.price')} value={formatMoney(record.price)} strong />}
          {record.etaMinutes !== undefined && <Row label={t('hist.eta')} value={`~${record.etaMinutes} ${t('offer.min')}`} />}
          {!!record.message && (
            <View style={{ gap: 4 }}>
              <Text variant="caption" tone="muted">
                {t('hist.note')}
              </Text>
              <Text variant="body">{record.message}</Text>
            </View>
          )}
        </Card>

        {/* How it ended */}
        <Card style={{ gap: 12 }}>
          <Text variant="h3">{done ? t('hist.customerRating') : t('hist.result')}</Text>
          {done ? (
            record.rating !== undefined ? (
              <>
                <Rating value={record.rating} size={20} showValue />
                {!!record.comment && (
                  <Text variant="body" tone="muted">
                    “{record.comment}”
                  </Text>
                )}
              </>
            ) : (
              <Badge label={t('hist.awaitingRating')} variant="warning" icon="clock" />
            )
          ) : (
            <Detail icon="x-circle" color="#DC2626" label={t(`hist.reason.${record.reason ?? 'declined'}` as any)} />
          )}
          {record.autoCompleted && (
            <Text variant="caption" tone="muted">
              {t('req.autoCompleted').replace('{h}', String(AUTO_COMPLETE_HOURS))}
            </Text>
          )}
        </Card>

        {done && (
          <Button label={t('hist.openChat')} iconLeft="message" variant="outline" onPress={() => router.push(`/(shared)/chat/${record.requestId}`)} />
        )}
      </Animated.View>
    </Screen>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
      <Text variant="caption" tone="muted">
        {label}
      </Text>
      <Text variant={strong ? 'bodyMedium' : 'body'}>{value}</Text>
    </View>
  );
}

function Detail({ icon, label, color }: { icon: IconName; label: string; color?: string }) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <Icon name={icon} size={16} color={color ?? colors.muted} />
      <Text variant="body" style={{ flex: 1, color: color ?? colors.muted }}>
        {label}
      </Text>
    </View>
  );
}
