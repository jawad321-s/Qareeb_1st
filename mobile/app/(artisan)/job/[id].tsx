import React, { useState } from 'react';
import { View, ScrollView, TextInput } from 'react-native';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Screen } from '@/components/ui/Screen';
import { useTabBarSpace } from '@/components/ui/TabBar';
import { Header } from '@/components/ui/Header';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { CardSkeleton } from '@/components/feedback/Skeleton';
import { useRequest, useSubmitOffer, useCancelRequest, useUpdateRequestStatus } from '@/hooks/queries';
import { StatusBadge } from '@/components/domain/StatusBadge';
import { TrackingTimeline } from '@/components/domain/TrackingTimeline';
import { useToast } from '@/components/feedback/Toast';
import { categoryById } from '@/constants/categories';
import { config } from '@/lib/config';
import { formatDistance, formatMoney } from '@/lib/format';
import { distanceKm } from '@/lib/geo';
import { AUTO_COMPLETE_HOURS, NEXT_STATUS, canCancelRequest, isActiveJob } from '@/lib/requestRules';
import { confirmAction } from '@/lib/confirm';
import { useAuth } from '@/store/auth';
import { useMySubscription } from '@/store/subscription';
import { useTheme } from '@/theme/ThemeProvider';
import { useFont, useT } from '@/i18n';
import { localizedTextAlign } from '@/i18n/rtl';

export default function JobDetail() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const user = useAuth((s) => s.user)!;
  const toast = useToast();
  const { t, locale, isRTL } = useT();
  const font = useFont();
  const { data: request, isLoading } = useRequest(id!);
  const submit = useSubmitOffer(id!);
  const cancel = useCancelRequest(id!);
  const progress = useUpdateRequestStatus(id!, user.uid);
  // This screen lives inside the artisan tab navigator, so the floating tab bar
  // overlays it — the submit button must clear the bar.
  const tabBarSpace = useTabBarSpace();
  // Sending offers needs a live plan (the free trial or a paid one).
  const subscription = useMySubscription(user.uid);

  const [price, setPrice] = useState('');
  const [eta, setEta] = useState('30');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  if (isLoading || !request) {
    return (
      <Screen scroll>
        <Header showBack title={t('job.title')} />
        <CardSkeleton />
      </Screen>
    );
  }

  const cat = categoryById(request.categoryId);

  const send = async () => {
    await submit.mutateAsync({
      requestId: request.id,
      artisanId: user.uid,
      customerId: request.customerId,
      price: Number(price) * 100,
      etaMinutes: Number(eta),
      // Optional — a quotation may be price + ETA only.
      message: message.trim() || undefined,
      // Kept on the offer for the artisan's history (see JobRecord).
      requestTitle: request.title,
      categoryId: request.categoryId,
      artisan: { uid: user.uid, fullName: user.fullName, photoUrl: user.photoUrl, rating: user.rating, ratingCount: user.ratingCount },
    });
    setSent(true);
    toast('success', t('job.sent'));
    setTimeout(() => router.back(), 900);
  };

  const canSend = Number(price) > 0 && Number(eta) > 0 && !sent;

  // The assigned artisan can also call the job off before work starts.
  const isAssigned = request.acceptedArtisanId === user.uid;
  const showCancel = isAssigned && canCancelRequest(request.status);

  // The assigned artisan moves the job on: on the way → working → finished.
  const next = isAssigned ? NEXT_STATUS[request.status] : undefined;
  const advance = async () => {
    if (!next) return;
    if (next === 'COMPLETED') {
      const ok = await confirmAction({
        title: t('job.finishTitle'),
        message: t('job.finishBody'),
        confirmLabel: t('job.finishYes'),
        cancelLabel: t('common.cancel'),
      });
      if (!ok) return;
    }
    await progress.mutateAsync(next);
    // Finishing opens the mandatory rating (the artisan layout redirects).
    if (next === 'COMPLETED') toast('success', t('job.finished'));
  };

  const onCancel = async () => {
    const ok = await confirmAction({
      title: t('req.cancelConfirmTitle'),
      message: t('req.cancelConfirmBody'),
      confirmLabel: t('req.cancelConfirmYes'),
      cancelLabel: t('req.cancelKeep'),
      destructive: true,
    });
    if (!ok) return;
    await cancel.mutateAsync();
    toast('info', t('req.cancelled'));
    router.back();
  };

  return (
    <Screen scroll contentStyle={{ paddingBottom: tabBarSpace + 12 }}>
      <Header showBack title={t('job.title')} />

      <Animated.View entering={FadeInDown.duration(400)}>
        <Card style={{ gap: 14 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: (cat?.colorHex ?? '#3B82F6') + '22', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name={(cat?.icon as any) ?? 'tools'} size={22} color={cat?.colorHex ?? '#3B82F6'} />
            </View>
            <View style={{ flex: 1 }}>
              <Text variant="h3">{request.title}</Text>
              <Text variant="caption" tone="muted">
                {cat?.name[locale]}
              </Text>
            </View>
          </View>
          <Text variant="body" tone="muted" style={{ lineHeight: 21 }}>
            {request.description}
          </Text>
          {request.images.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {request.images.map((uri) => (
                <Image key={uri} source={{ uri }} style={{ width: 110, height: 110, borderRadius: 14 }} />
              ))}
            </ScrollView>
          )}
          <View style={{ flexDirection: 'row', gap: 20, flexWrap: 'wrap' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Icon name="wallet" size={16} color="#94A3B8" />
              <Text variant="caption" tone="muted">
                {t('job.budget')} {formatMoney(request.budget.min)}–{formatMoney(request.budget.max)}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Icon name="map-pin" size={16} color="#94A3B8" />
              <Text variant="caption" tone="muted">
                {request.location.address}
                {user.location ? ` · ${formatDistance(distanceKm(user.location, request.location))}` : ''}
              </Text>
            </View>
          </View>
        </Card>
      </Animated.View>

      {request.status === 'PENDING' ? (
        <>
        {/* Offer form — locked once the trial or plan has ended */}
        {subscription.isActive ? (
          <>
            <Text variant="h3" style={{ marginTop: 24, marginBottom: 14 }}>
              {t('job.sendQuote')}
            </Text>
            <View style={{ gap: 16 }}>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1, gap: 6 }}>
                  <Text variant="caption" tone="muted">
                    {t('job.price')} ({config.currency})
                  </Text>
                  <TextInput value={price} onChangeText={setPrice} keyboardType="number-pad" placeholder="120" placeholderTextColor={colors.muted} style={inputStyle(colors, font, isRTL)} />
                </View>
                <View style={{ flex: 1, gap: 6 }}>
                  <Text variant="caption" tone="muted">
                    {t('job.eta')}
                  </Text>
                  <TextInput value={eta} onChangeText={setEta} keyboardType="number-pad" placeholder="30" placeholderTextColor={colors.muted} style={inputStyle(colors, font, isRTL)} />
                </View>
              </View>
              <View style={{ gap: 6 }}>
                <Text variant="caption" tone="muted">
                  {t('job.messageToCustomer')} · {t('vrf.optional')}
                </Text>
                <TextInput
                  value={message}
                  onChangeText={setMessage}
                  placeholder={t('job.messagePlaceholder')}
                  placeholderTextColor={colors.muted}
                  multiline
                  style={{ ...inputStyle(colors, font, isRTL), minHeight: 100, height: undefined, textAlignVertical: 'top', paddingTop: 12 }}
                />
              </View>
              <Button label={sent ? t('job.sent') : t('job.submit')} iconRight={sent ? 'check-circle' : 'send'} onPress={send} loading={submit.isPending} disabled={!canSend} />
            </View>
          </>
        ) : (
          <Card style={{ marginTop: 24, gap: 12, alignItems: 'center' }}>
            <Icon name="lock" size={28} color={colors.tint} />
            <Text variant="h3" center>
              {t('sub.needPlanTitle')}
            </Text>
            <Text variant="caption" tone="muted" center>
              {t('sub.needPlanBody')}
            </Text>
            <Button label={t('sub.viewPlans')} iconRight="arrow-right" onPress={() => router.push('/(shared)/subscription')} />
          </Card>
        )}
        </>
      ) : isAssigned ? (
        /* The artisan's own job: progress, chat, and the finish step. */
        <Card style={{ marginTop: 24, gap: 14 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text variant="h3">{t('job.progress')}</Text>
            <StatusBadge status={request.status} />
          </View>
          <TrackingTimeline status={request.status} />
          {next && (
            <Button
              label={t(`job.next.${next}` as any)}
              iconLeft={next === 'COMPLETED' ? 'check-circle' : next === 'WORKING' ? 'tools' : 'navigation'}
              loading={progress.isPending}
              onPress={advance}
            />
          )}
          <Button label={t('job.chat')} iconLeft="message" variant="outline" onPress={() => router.push(`/(shared)/chat/${request.id}`)} />
          {isActiveJob(request.status) && (
            <Text variant="caption" tone="muted" center>
              {t('job.autoNote').replace('{h}', String(AUTO_COMPLETE_HOURS))}
            </Text>
          )}
          {request.autoCompleted && (
            <Text variant="caption" tone="muted" center>
              {t('req.autoCompleted').replace('{h}', String(AUTO_COMPLETE_HOURS))}
            </Text>
          )}
        </Card>
      ) : (
        <Card style={{ marginTop: 24, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Icon name="lock" size={20} color={colors.muted} />
          <Text variant="body" tone="muted" style={{ flex: 1 }}>
            {request.acceptedArtisanId ? t('job.takenByOther') : t('job.closed')}
          </Text>
        </Card>
      )}

      {/* Assigned artisan may call the job off until work starts */}
      {showCancel && (
        <View style={{ marginTop: 20 }}>
          <Button
            label={t('req.cancel')}
            iconLeft="x-circle"
            variant="danger"
            loading={cancel.isPending}
            onPress={onCancel}
          />
        </View>
      )}
    </Screen>
  );
}

const inputStyle = (colors: any, font: (f: string) => string, isRTL: boolean) => ({
  height: 54,
  borderRadius: 16,
  borderWidth: 1.5,
  borderColor: colors.border,
  backgroundColor: colors.surface,
  paddingHorizontal: 14,
  color: colors.fg,
  fontSize: 16,
  fontFamily: font('Inter_500Medium'),
  textAlign: localizedTextAlign(isRTL),
});
