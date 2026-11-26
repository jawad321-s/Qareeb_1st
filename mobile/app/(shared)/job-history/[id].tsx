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
import { Button } from '@/components/ui/Button';
import { ReportLink } from '@/components/domain/ReportLink';
import { CardSkeleton } from '@/components/feedback/Skeleton';
import { EmptyState } from '@/components/feedback/EmptyState';
import { StatusBadge } from '@/components/domain/StatusBadge';
import { categoryById } from '@/constants/categories';
import { useJobHistory, useUser } from '@/hooks/queries';
import { formatDate, formatMoney, formatEta } from '@/lib/format';
import { AUTO_COMPLETE_HOURS } from '@/lib/requestRules';
import { useAuth } from '@/store/auth';
import { useTheme } from '@/theme/ThemeProvider';
import { useT } from '@/i18n';
import { reasonText } from '@/lib/reasons';
import { successText } from '@/theme/tokens';

/** Full record of one history entry: the job, the customer, the artisan's offer and how it ended. */
export default function JobRecordScreen() {
  const { colors, isDark } = useTheme();
  const { t, locale } = useT();
  const { id, kind } = useLocalSearchParams<{ id: string; kind?: string }>();
  const uid = useAuth((s) => s.user?.uid ?? '');
  const { data, isLoading } = useJobHistory(uid);
  const list = kind === 'rejected' || kind === 'cancelled' ? data?.[kind] : data?.completed;
  const record = list?.find((r) => r.requestId === id);
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
  // Cancelled (by either side) or expired, rather than an offer turned down.
  const cancelled = record.reason === 'cancelled' || record.reason === 'cancelledByMe' || record.reason === 'expired';
  const why = reasonText(t, record.reasonChoice, record.reasonNote);

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
          {done ? <StatusBadge status="COMPLETED" /> : cancelled ? <StatusBadge status="CANCELLED" /> : <Badge label={t('ostatus.REJECTED')} variant="danger" icon="x-circle" />}
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
          {record.etaMinutes !== undefined && <Row label={t('hist.eta')} value={`~${formatEta(record.etaMinutes)}`} />}
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
          <Text variant="h3">{t('hist.result')}</Text>
          {/* Not how the customer rated the job: the artisan only sees their overall rating. */}
          {done ? (
            <Detail icon="check-circle" color={successText(isDark)} label={t('hist.done')} />
          ) : (
            <>
              <Detail icon="x-circle" color="#DC2626" label={t(`hist.reason.${record.reason ?? 'declined'}` as any)} />
              {/* The reason chosen (and the person's own words), when one was given. */}
              {!!why && (
                <Text variant="body" tone="muted">
                  {t('req.reason')} {why}
                </Text>
              )}
            </>
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
        {/* A job the artisan did, or one called off, can still lead to a complaint. */}
        {(done || record.reason === 'cancelled' || record.reason === 'cancelledByMe') && (
          <ReportLink targetId={record.customerId} targetRole="customer" requestId={record.requestId} />
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
