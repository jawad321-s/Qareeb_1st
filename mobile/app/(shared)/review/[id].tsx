import React, { useEffect, useState } from 'react';
import { BackHandler, View, TextInput } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Screen } from '@/components/ui/Screen';
import { Header } from '@/components/ui/Header';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { Rating } from '@/components/ui/Rating';
import { Avatar } from '@/components/ui/Avatar';
import { CardSkeleton } from '@/components/feedback/Skeleton';
import { useToast } from '@/components/feedback/Toast';
import { useHasReviewed, useRequest, useSubmitReview, useUser } from '@/hooks/queries';
import { useAuth } from '@/store/auth';
import { useTheme } from '@/theme/ThemeProvider';
import { useFont, useT } from '@/i18n';
import { localizedTextAlign } from '@/i18n/rtl';
import type { TranslationKey } from '@/i18n/translations';

// What each side can praise: customers rate the artisan's work, artisans rate
// how the customer was to work with.
const ARTISAN_TAGS: TranslationKey[] = [
  'review.tag.punctual', 'review.tag.professional', 'review.tag.fairPrice',
  'review.tag.cleanWork', 'review.tag.friendly', 'review.tag.rehire',
];
const CUSTOMER_TAGS: TranslationKey[] = [
  'review.ctag.respectful', 'review.ctag.clearRequest', 'review.ctag.paidOnTime',
  'review.ctag.cooperative', 'review.ctag.onSite', 'review.ctag.recommend',
];

/**
 * Rate the other party of a completed job. Rating is mandatory for both the
 * customer and the artisan: the role layouts send the user here while a
 * finished job is still unrated, and this screen has no way out except
 * submitting — no back button, no swipe-to-dismiss, and Android's back button
 * is swallowed.
 */
export default function ReviewScreen() {
  const { colors } = useTheme();
  const { t, isRTL } = useT();
  const font = useFont();
  const toast = useToast();
  const { id } = useLocalSearchParams<{ id: string }>();
  const user = useAuth((s) => s.user);
  const { data: request, isLoading } = useRequest(id!);
  const { data: alreadyRated } = useHasReviewed(id!, user?.uid);
  const submitReview = useSubmitReview();

  const isArtisan = user?.role === 'artisan';
  const targetId = isArtisan ? request?.customerId : request?.acceptedArtisanId;
  const { data: target } = useUser(targetId);

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [tags, setTags] = useState<TranslationKey[]>([]);

  const home = isArtisan ? '/(artisan)/dashboard' : '/(customer)/home';

  // Android hardware back would otherwise skip the mandatory review.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => sub.remove();
  }, []);

  // Already rated (e.g. reopened from an old notification) — nothing to do here.
  useEffect(() => {
    if (alreadyRated) router.replace(home);
  }, [alreadyRated, home]);

  if (!user) return null;

  if (isLoading || !request || !targetId) {
    return (
      <Screen scroll>
        <Header title={t('review.title')} />
        <CardSkeleton />
      </Screen>
    );
  }

  const TAGS = isArtisan ? CUSTOMER_TAGS : ARTISAN_TAGS;
  const toggle = (k: TranslationKey) => setTags((p) => (p.includes(k) ? p.filter((x) => x !== k) : [...p, k]));
  const fallbackName = t(isArtisan ? 'review.theCustomer' : 'review.theArtisan');

  const submit = async () => {
    const note = comment.trim();
    const praise = tags.map((k) => t(k)).join(' · ');
    try {
      await submitReview.mutateAsync({
        requestId: request.id,
        authorId: user.uid,
        targetId,
        role: user.role === 'artisan' ? 'artisan' : 'customer',
        rating,
        comment: [praise, note].filter(Boolean).join('\n'),
      });
    } catch {
      toast('error', t('review.failed'));
      return;
    }
    toast('success', t('review.thanks'));
    // Back to the app; the layout re-checks and opens the next unrated job, if any.
    router.replace(home);
  };

  return (
    <Screen scroll>
      <Header title={t('review.title')} />

      {/* Why the user can't leave: the job is done and rating is required. */}
      <Card style={{ flexDirection: 'row', gap: 12, alignItems: 'center', backgroundColor: colors.tint + '12', borderColor: colors.tint + '33' }}>
        <Icon name="check-circle" size={22} color={colors.tint} />
        <View style={{ flex: 1, gap: 2 }}>
          <Text variant="bodyMedium">{t('review.requiredTitle')}</Text>
          <Text variant="caption" tone="muted">
            {request.title} · {t('review.requiredBody')}
          </Text>
        </View>
      </Card>

      <Animated.View entering={FadeInDown.duration(400)} style={{ alignItems: 'center', gap: 12, marginVertical: 20 }}>
        <Avatar uri={target?.photoUrl} name={target?.fullName ?? fallbackName} size={80} verified={target?.verified} />
        <Text variant="h3">{target?.fullName ?? fallbackName}</Text>
        <Text variant="caption" tone="muted">
          {t(isArtisan ? 'review.howCustomer' : 'review.how')}
        </Text>
        <Rating value={rating} editable size={40} onChange={setRating} />
        {rating === 0 && (
          <Text variant="caption" tone="muted">
            {t('review.pickStars')}
          </Text>
        )}
      </Animated.View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
        {TAGS.map((k) => {
          const active = tags.includes(k);
          return (
            <Text
              key={k}
              variant="caption"
              onPress={() => toggle(k)}
              style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: 1.5, borderColor: active ? colors.tint : colors.border, color: active ? colors.tint : colors.fg, backgroundColor: active ? colors.tint + '12' : 'transparent', fontFamily: 'Inter_500Medium', overflow: 'hidden' }}
            >
              {t(k)}
            </Text>
          );
        })}
      </View>

      <TextInput
        value={comment}
        onChangeText={setComment}
        placeholder={t('review.commentPlaceholder')}
        placeholderTextColor={colors.muted}
        multiline
        style={{ minHeight: 120, borderRadius: 16, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.surface, padding: 14, color: colors.fg, fontSize: 15, fontFamily: font('Inter_400Regular'), textAlign: localizedTextAlign(isRTL), textAlignVertical: 'top', marginBottom: 20 }}
      />

      {/* Stars are the required part; tags and the comment stay optional. */}
      <Button label={t('review.submit')} iconRight="send" onPress={submit} loading={submitReview.isPending} disabled={rating === 0} />
    </Screen>
  );
}
