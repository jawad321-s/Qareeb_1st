import React, { useState } from 'react';
import { View, TextInput } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Screen } from '@/components/ui/Screen';
import { useTabBarSpace } from '@/components/ui/TabBar';
import { Header } from '@/components/ui/Header';
import { Text } from '@/components/ui/Text';
import { PhotoStrip } from '@/components/ui/PhotoViewer';
import { TextArea } from '@/components/ui/TextArea';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { CardSkeleton } from '@/components/feedback/Skeleton';
import {
  useRequest,
  useSubmitOffer,
  useCancelRequest,
  useUpdateRequestStatus,
  useOffers,
  useUpdateOfferPrice,
  useSendMessage,
  useUser,
  useHasReviewed,
} from '@/hooks/queries';
import { ReasonSheet } from '@/components/feedback/ReasonSheet';
import { reasonText, type Reason } from '@/lib/reasons';
import { PersonRow } from '@/components/domain/PersonRow';
import { ReportLink } from '@/components/domain/ReportLink';
import { StatusBadge } from '@/components/domain/StatusBadge';
import { TrackingTimeline } from '@/components/domain/TrackingTimeline';
import { openDirections } from '@/lib/directions';
import { useToast } from '@/components/feedback/Toast';
import { categoryById } from '@/constants/categories';
import { config } from '@/lib/config';
import { formatDistance, formatMoney } from '@/lib/format';
import { distanceKm } from '@/lib/geo';
import { AUTO_COMPLETE_HOURS, NEXT_STATUS, canCancelRequest, isActiveJob } from '@/lib/requestRules';
import { confirmAction } from '@/lib/confirm';
import { useAuth } from '@/store/auth';
import { useMySubscription } from '@/store/subscription';
import { shownPhotos } from '@/services/media.service';
import { useTheme } from '@/theme/ThemeProvider';
import { useFont, useT } from '@/i18n';
import { localizedTextAlign } from '@/i18n/rtl';
import type { Offer } from '@/types';

/**
 * This screen sits in the artisan's tab navigator, which keeps it mounted and
 * only swaps `id` when another job is opened. Keyed by the id, the details
 * start fresh for every job: nothing typed for one job (price, message) or
 * its "offer sent" state carries over to the next.
 */
export default function JobDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <JobDetail key={id} />;
}

function JobDetail() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const user = useAuth((s) => s.user)!;
  const toast = useToast();
  const { t, locale, isRTL } = useT();
  const font = useFont();
  const { data: request, isLoading } = useRequest(id!);
  const { data: rated } = useHasReviewed(id!, user.uid);
  const [askingReason, setAskingReason] = useState(false);
  const { data: customer } = useUser(request?.customerId);
  const submit = useSubmitOffer(id!);
  const cancel = useCancelRequest(id!);
  const progress = useUpdateRequestStatus(id!, user.uid);
  // The artisan's own offer on this job (the query is scoped to them).
  const myOffers = useOffers(id!);
  const myOffer = myOffers.data?.find((o) => o.artisanId === user.uid && (o.status === 'PENDING' || o.status === 'ACCEPTED'));
  const updatePrice = useUpdateOfferPrice(id!, user.uid);
  const sendMessage = useSendMessage(id!);
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

  // The price can change only while the work is in progress (WORKING), once
  // the artisan has seen the job; the customer is told in the chat as well.
  const savePrice = async (minor: number): Promise<boolean> => {
    if (!myOffer) return false;
    try {
      await updatePrice.mutateAsync({ offerId: myOffer.id, price: minor });
    } catch (err) {
      console.warn('[price]', err);
      toast('error', t('job.priceFailed'));
      return false;
    }
    if (isActiveJob(request.status)) {
      sendMessage.mutate({ senderId: user.uid, type: 'text', text: t('job.priceChangedMsg').replace('{price}', formatMoney(minor)) });
    }
    toast('success', t('job.priceUpdated'));
    return true;
  };

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

  // Cancelling asks why; the customer is told. The page stays open so the
  // artisan can still rate the customer.
  const onCancel = () => setAskingReason(true);
  const onCancelReason = async (reason: Reason) => {
    try {
      await cancel.mutateAsync(reason);
      setAskingReason(false);
      toast('info', t('req.cancelled'));
    } catch {
      toast('error', t('req.actionFailed'));
    }
  };

  // Why the artisan's own offer was closed, when it was.
  const closedOffer = myOffers.data?.find((o) => o.artisanId === user.uid && o.status === 'REJECTED');
  const offerOutcome = !closedOffer
    ? ''
    : closedOffer.closedReason === 'OTHER_ACCEPTED' || (!closedOffer.closedReason && request.acceptedArtisanId && request.acceptedArtisanId !== user.uid)
      ? t('aOffers.notChosen')
      : closedOffer.closedReason === 'EXPIRED'
        ? t('aOffers.expired')
        : closedOffer.closedReason === 'REQUEST_CANCELLED' || closedOffer.requestStatus === 'CANCELLED'
          ? [t('req.cancelledByCustomer'), reasonText(t, request.cancelChoice, request.cancelNote)].filter(Boolean).join(' · ')
          : [t('aOffers.declined'), reasonText(t, closedOffer.rejectChoice, closedOffer.rejectNote)].filter(Boolean).join(' · ');

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
          {/* Tap a photo to see it full screen and zoom in. */}
          <PhotoStrip photos={shownPhotos(request.images)} width={110} />
          <View style={{ flexDirection: 'row', gap: 20, flexWrap: 'wrap' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Icon name="map-pin" size={16} color="#94A3B8" />
              <Text variant="caption" tone="muted">
                {request.location?.address ?? '—'}
                {user.location && request.location ? ` · ${formatDistance(distanceKm(user.location, request.location))}` : ''}
              </Text>
            </View>
          </View>
          {/* Directions to the customer in the phone's maps app. */}
          {request.location && (
            <Button
              label={t('job.directions')}
              variant="outline"
              size="sm"
              iconLeft="navigation"
              onPress={() => openDirections(request.location!)}
            />
          )}
        </Card>
      </Animated.View>

      {/* Who asked: their profile shows how other artisans rated them. */}
      {(customer || !!request.customerName) && (
        <Card style={{ marginTop: 16, gap: 10 }}>
          <Text variant="caption" tone="muted">
            {t('job.customer')}
          </Text>
          <PersonRow
            name={customer?.fullName || request.customerName}
            photoUrl={customer?.photoUrl}
            rating={customer?.rating}
            ratingCount={customer?.ratingCount}
            onPress={() => router.push(`/(shared)/customer/${request.customerId}`)}
          />
        </Card>
      )}

      {request.status === 'PENDING' && myOffer ? (
        /* Already quoted: show the offer (no second offer). Its price is fixed until the work starts. */
        <Card style={{ marginTop: 24, gap: 14 }}>
          <Text variant="h3">{t('job.yourOffer')}</Text>
          <PriceRow offer={myOffer} editable={false} saving={updatePrice.isPending} onSave={savePrice} />
          <Text variant="caption" tone="muted">
            {t('job.waitingCustomer')}
          </Text>
        </Card>
      ) : request.status === 'PENDING' ? (
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
                <TextArea
                  value={message}
                  onChangeText={setMessage}
                  placeholder={t('job.messagePlaceholder')}
                  placeholderTextColor={colors.muted}
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
          {myOffer && (
            <PriceRow offer={myOffer} editable={request.status === 'WORKING'} saving={updatePrice.isPending} onSave={savePrice} />
          )}
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

      {/* Why the job was cancelled, and the (optional) rating of the customer. */}
      {request.status === 'CANCELLED' && isAssigned && (
        <Card style={{ marginTop: 20, gap: 10 }}>
          <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
            <Icon name="x-circle" size={18} color="#EF4444" />
            <Text variant="bodyMedium" style={{ flex: 1 }}>
              {t(request.cancelledBy === user.uid ? 'req.cancelledByYou' : 'req.cancelledByCustomer')}
            </Text>
          </View>
          {!!reasonText(t, request.cancelChoice, request.cancelNote) && (
            <Text variant="caption" tone="muted">
              {t('req.reason')} {reasonText(t, request.cancelChoice, request.cancelNote)}
            </Text>
          )}
          {rated ? (
            <Button label={t('review.done')} iconLeft="check-circle" variant="secondary" disabled />
          ) : (
            <Button label={t('job.rateCustomer')} iconLeft="star" variant="outline" onPress={() => router.push(`/(shared)/review/${request.id}`)} />
          )}
        </Card>
      )}
      {!isAssigned && !!offerOutcome && (
        <Card style={{ marginTop: 20, flexDirection: 'row', gap: 10, alignItems: 'center', backgroundColor: '#EF444412' }}>
          <Icon name="info" size={18} color="#EF4444" />
          <Text variant="caption" style={{ flex: 1 }}>
            {offerOutcome}
          </Text>
        </Card>
      )}

      <ReasonSheet
        visible={askingReason}
        context="artisanCancel"
        title={t('req.cancelConfirmTitle')}
        confirmLabel={t('req.cancelConfirmYes')}
        loading={cancel.isPending}
        onClose={() => setAskingReason(false)}
        onSubmit={onCancelReason}
      />

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

      {/* The artisan hired for the job can complain about its customer. */}
      {isAssigned && <ReportLink targetId={request.customerId} targetRole="customer" requestId={request.id} />}
    </Screen>
  );
}

/** The offer's price, with an inline editor while the work is in progress. */
function PriceRow({
  offer,
  editable,
  saving,
  onSave,
}: {
  offer: Offer;
  editable: boolean;
  saving: boolean;
  onSave: (minor: number) => Promise<boolean>;
}) {
  const { colors } = useTheme();
  const { t, isRTL } = useT();
  const font = useFont();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState('');
  const minor = Math.round(Number(value) * 100);
  const valid = Number(value) > 0 && minor !== offer.price;

  if (editing) {
    return (
      <View style={{ gap: 10 }}>
        <Text variant="caption" tone="muted">
          {t('job.price')} ({config.currency})
        </Text>
        <TextInput value={value} onChangeText={setValue} keyboardType="number-pad" autoFocus style={inputStyle(colors, font, isRTL)} />
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Button label={t('common.cancel')} variant="outline" onPress={() => setEditing(false)} style={{ flex: 1 }} />
          <Button
            label={t('job.savePrice')}
            iconLeft="check"
            loading={saving}
            disabled={!valid}
            onPress={async () => {
              if (await onSave(minor)) setEditing(false);
            }}
            style={{ flex: 1 }}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <Icon name="wallet" size={20} color={colors.tint} />
      <View style={{ flex: 1 }}>
        <Text variant="caption" tone="muted">
          {t('job.price')}
        </Text>
        <Text variant="h3">{formatMoney(offer.price)}</Text>
      </View>
      {editable && (
        <Button
          label={t('job.editPrice')}
          iconLeft="edit"
          variant="outline"
          size="sm"
          fullWidth={false}
          onPress={() => {
            setValue(String(offer.price / 100));
            setEditing(true);
          }}
        />
      )}
    </View>
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
