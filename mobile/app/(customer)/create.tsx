import React, { useEffect, useState } from 'react';
import { Alert, Linking, Platform, View, ScrollView, Pressable, TextInput } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { Screen, keyboardScrollProps } from '@/components/ui/Screen';
import { Header } from '@/components/ui/Header';
import { Text } from '@/components/ui/Text';
import { TextArea } from '@/components/ui/TextArea';
import { Button } from '@/components/ui/Button';
import { Icon, type IconName } from '@/components/ui/Icon';
import { usePhotoViewer } from '@/components/ui/PhotoViewer';
import { Card } from '@/components/ui/Card';
import { useTabBarSpace } from '@/components/ui/TabBar';
import { useToast } from '@/components/feedback/Toast';
import { categoryById, useCategories } from '@/constants/categories';
import { useCreateRequest, useMyRequests, useSupportContacts } from '@/hooks/queries';
import { MAX_OPEN_REQUESTS, OPEN_STATUSES, OpenRequestLimitError } from '@/lib/requestRules';
import { useAuth } from '@/store/auth';
import { useTheme } from '@/theme/ThemeProvider';
import { useFont, useT } from '@/i18n';
import { isLayoutRTL, localizedTextAlign } from '@/i18n/rtl';
import { config } from '@/lib/config';
import { currentLocation } from '@/lib/currentLocation';
import { distanceKm } from '@/lib/geo';
import { MIN_MOVE_KM } from '@/hooks/useRefreshLocation';

// Service picker: one row per service, in catalog order.

// Shortest title and description a request may have; the fields say so while
// they are shorter, so a disabled Continue button is never a mystery.
const TITLE_MIN = 4;
const DESC_MIN = 10;

/** Photos a request can carry. */
const MAX_REQUEST_PHOTOS = 4;

export default function CreateRequest() {
  const { colors, isDark } = useTheme();
  const user = useAuth((s) => s.user)!;
  const { t, locale, isRTL } = useT();
  const font = useFont();
  const tabBarSpace = useTabBarSpace();
  const create = useCreateRequest(user.uid);
  const updateUser = useAuth((s) => s.updateUser);
  const [locating, setLocating] = useState(false);
  const toast = useToast();
  const STEPS = [t('create.step.service'), t('create.step.details'), t('create.step.review')];
  // At most a few open requests at once (each one notifies every nearby
  // artisan): said up front, before the customer fills in a new one.
  const maxOpen = useSupportContacts().data?.maxOpenRequests ?? MAX_OPEN_REQUESTS;
  const openCount = (useMyRequests(user.uid).data ?? []).filter((r) => OPEN_STATUSES.includes(r.status)).length;
  const atLimit = openCount >= maxOpen;
  const limitText = t('create.tooMany').replace('{n}', String(maxOpen));

  const [step, setStep] = useState(0);
  // A category tapped on the home screen arrives as ?category=… and is preselected.
  const params = useLocalSearchParams<{ category?: string }>();
  const [categoryId, setCategoryId] = useState<string | null>(params.category ?? null);
  useEffect(() => {
    if (params.category) {
      setCategoryId(params.category);
      setStep(0);
    }
  }, [params.category]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<string[]>([]);

  const category = categoryId ? categoryById(categoryId) : undefined;
  // The services to pick from: the shown ones, in catalog order.
  const services = useCategories();

  // Photos of the problem: from the gallery (several at once) or taken now
  // with the camera (one shot at a time, as many as fit). They wait here, to
  // look at full screen or remove, until the request is posted.
  const viewer = usePhotoViewer();
  const room = MAX_REQUEST_PHOTOS - images.length;
  const addImages = (uris: string[]) => setImages((prev) => [...prev, ...uris].slice(0, MAX_REQUEST_PHOTOS));

  /** Permission refused: say why, with a way to the phone's settings. */
  const askForSettings = (message: string) => {
    if (Platform.OS === 'web') return toast('info', message);
    Alert.alert(message, undefined, [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('chat.openSettings'), onPress: () => Linking.openSettings().catch(() => {}) },
    ]);
  };

  const pickImage = async () => {
    if (room <= 0) return;
    try {
      const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 1, allowsMultipleSelection: true, selectionLimit: room, orderedSelection: true });
      if (!res.canceled) addImages(res.assets.map((a) => a.uri));
    } catch {
      askForSettings(t('chat.photosDenied'));
    }
  };

  const takeImage = async () => {
    if (room <= 0) return;
    // The first time, the phone asks whether Qareeb may use the camera.
    const perm = await ImagePicker.requestCameraPermissionsAsync().catch(() => null);
    if (!perm?.granted) return askForSettings(t('chat.cameraDenied'));
    try {
      const res = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 1 });
      if (!res.canceled) addImages(res.assets.map((a) => a.uri));
    } catch {
      askForSettings(t('chat.cameraDenied'));
    }
  };

  const canNext = () => {
    if (step === 0) return !!categoryId;
    if (step === 1) return title.trim().length >= TITLE_MIN && description.trim().length >= DESC_MIN;
    return true;
  };

  const submit = async () => {
    // Artisans are matched by distance, so a request needs the customer's
    // location. New accounts have none until they grant it.
    // The request goes out from where the customer is now, when the phone can
    // tell (a saved location may be from another day and another place).
    let location = user.location;
    if (!config.useMock) {
      setLocating(true);
      const here = await currentLocation().catch(() => null);
      setLocating(false);
      if (here) {
        location = here;
        if (!user.location || distanceKm(user.location, here) >= MIN_MOVE_KM) updateUser({ location: here });
      }
    }
    if (!location) {
      router.push('/(shared)/location-permission');
      return;
    }
    try {
      const req = await create.mutateAsync({
        customerId: user.uid,
        serviceId: categoryId!,
        categoryId: categoryId!,
        title: title.trim(),
        description: description.trim(),
        images,
        location,
        // No budget and no time: artisans send their price, and the job is as soon as possible.
        preferredTime: Date.now(),
      });
      router.replace(`/(shared)/request/${req.id}`);
    } catch (err) {
      if (err instanceof OpenRequestLimitError) toast('error', t('create.tooMany').replace('{n}', String(err.max)));
      else toast('error', t('create.failed'));
    }
  };

  return (
    <Screen padded={false}>
      <View style={{ paddingHorizontal: 20 }}>
        <Header title={t('create.title')} showBack={step === 0} />
        {/* Progress bar */}
        <View style={{ flexDirection: 'row', gap: 6, marginBottom: 20 }}>
          {STEPS.map((s, i) => (
            <View key={s} style={{ flex: 1, gap: 6 }}>
              <View style={{ height: 4, borderRadius: 2, backgroundColor: i <= step ? colors.tint : colors.border }} />
              <Text variant="overline" tone={i <= step ? 'primary' : 'muted'}>
                {s}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <ScrollView {...keyboardScrollProps} style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
        {atLimit && (
          <Card style={{ flexDirection: 'row', gap: 10, alignItems: 'center', marginBottom: 16, backgroundColor: '#F59E0B14', borderColor: '#F59E0B55' }}>
            <Icon name="alert-circle" size={18} color="#F59E0B" />
            <Text variant="caption" style={{ flex: 1 }}>
              {limitText}
            </Text>
          </Card>
        )}
        {step === 0 && (
          <Animated.View entering={FadeIn} style={{ gap: 16 }}>
            <Text variant="h3">{t('create.whatNeed')}</Text>
            <View style={{ gap: 10 }}>
              {services.map((c) => {
                const active = categoryId === c.id;
                return (
                  <Pressable
                    key={c.id}
                    onPress={() => setCategoryId(c.id)}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 12,
                      padding: 12,
                      borderRadius: 16,
                      borderWidth: 1.5,
                      borderColor: active ? colors.tint : colors.border,
                      backgroundColor: active ? colors.tint + '15' : colors.surface,
                    }}
                  >
                    <View style={{ width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: c.colorHex + (isDark ? '24' : '14') }}>
                      <Icon name={c.icon as any} size={22} color={c.colorHex} />
                    </View>
                    <Text variant="bodyMedium" style={{ flex: 1 }}>
                      {c.name[locale]}
                    </Text>
                    {active && <Icon name="check-circle" size={20} color={colors.tint} />}
                  </Pressable>
                );
              })}
            </View>
          </Animated.View>
        )}

        {step === 1 && (
          <Animated.View entering={FadeInDown} style={{ gap: 18 }}>
            <View style={{ gap: 6 }}>
              <Text variant="caption" tone="muted">
                {t('create.titleLabel')}
              </Text>
              <TextInput
                value={title}
                onChangeText={setTitle}
                style={{ height: 54, borderRadius: 16, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.surface, paddingHorizontal: 14, color: colors.fg, fontSize: 15, fontFamily: font('Inter_400Regular'), textAlign: localizedTextAlign(isRTL) }}
              />
              <MinLengthHint value={title} min={TITLE_MIN} />
            </View>
            <View style={{ gap: 6 }}>
              <Text variant="caption" tone="muted">
                {t('create.describe')}
              </Text>
              <TextArea
                value={description}
                onChangeText={setDescription}
                placeholder={t('create.describePlaceholder')}
                placeholderTextColor={colors.muted}
                style={{ minHeight: 120, borderRadius: 16, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.surface, padding: 14, color: colors.fg, fontSize: 15, fontFamily: font('Inter_400Regular'), textAlign: localizedTextAlign(isRTL), textAlignVertical: 'top' }}
              />
              <MinLengthHint value={description} min={DESC_MIN} />
            </View>
            <View style={{ gap: 8 }}>
              <Text variant="caption" tone="muted">
                {t('create.photos')} · {images.length}/{MAX_REQUEST_PHOTOS}
              </Text>
              {/* Two ways to add: take a photo now, or pick from the gallery. */}
              {room > 0 && (
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <PhotoSource icon="camera" label={t('create.takePhoto')} onPress={takeImage} />
                  <PhotoSource icon="image" label={t('create.fromGallery')} onPress={pickImage} />
                </View>
              )}
              {images.length > 0 && (
                <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap', paddingTop: 6 }}>
                  {images.map((uri, i) => (
                    <View key={`${i}:${uri}`}>
                      {/* Tap to look at it full screen before posting. */}
                      <Pressable onPress={() => viewer.open(images, i)} accessibilityRole="imagebutton" accessibilityLabel={t('a11y.openPhoto')}>
                        <Image source={{ uri }} style={{ width: 76, height: 76, borderRadius: 14 }} contentFit="cover" />
                      </Pressable>
                      <Pressable onPress={() => setImages((p) => p.filter((_, j) => j !== i))} hitSlop={14} accessibilityRole="button" accessibilityLabel={t('a11y.removePhoto')} style={{ position: 'absolute', top: -6, right: -6, backgroundColor: '#EF4444', borderRadius: 999, padding: 3 }}>
                        <Icon name="x" size={12} color="#FFF" strokeWidth={3} />
                      </Pressable>
                    </View>
                  ))}
                </View>
              )}
              {viewer.element}
            </View>
          </Animated.View>
        )}

        {step === 2 && (
          <Animated.View entering={FadeInDown} style={{ gap: 14 }}>
            <Text variant="h3">{t('create.reviewTitle')}</Text>
            <Card style={{ gap: 14 }}>
              <Row label={t('create.step.service')} value={category?.name[locale] ?? '—'} />
              <Row label={t('create.titleLabel')} value={title} />
              <Row label={t('home.setLocation')} value={user.location?.address ?? '—'} />
              <Row label={t('create.photos')} value={String(images.length)} />
            </Card>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 12, backgroundColor: colors.tint + '12' }}>
              <Icon name="info" size={18} color={colors.tint} />
              <Text variant="caption" tone="primary" style={{ flex: 1 }}>
                {t('create.notifyNote')}
              </Text>
            </View>
          </Animated.View>
        )}
      </ScrollView>

      <View style={{ flexDirection: 'row', gap: 12, paddingHorizontal: 20, paddingBottom: tabBarSpace + 12, paddingTop: 8 }}>
        {step > 0 && (
          <View style={{ width: 120 }}>
            <Button label={t('common.back')} variant="secondary" onPress={() => setStep((s) => s - 1)} />
          </View>
        )}
        {step < STEPS.length - 1 ? (
          <View style={{ flex: 1 }}>
            <Button label={t('common.continue')} iconRight="arrow-right" disabled={!canNext()} onPress={() => setStep((s) => s + 1)} />
          </View>
        ) : (
          <View style={{ flex: 1 }}>
            <Button
              label={user.location ? t('create.submit') : t('home.setLocation')}
              iconRight={user.location ? 'send' : 'map-pin'}
              loading={create.isPending || locating}
              disabled={atLimit}
              onPress={submit}
            />
          </View>
        )}
      </View>
    </Screen>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  const { isRTL } = useT();
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
      <Text variant="body" tone="muted">
        {label}
      </Text>
      <Text variant="bodyMedium" style={{ flex: 1, textAlign: isLayoutRTL(isRTL) ? 'left' : 'right' }} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

/** "At least N characters (n/N)" under a field while it is too short. */
function MinLengthHint({ value, min }: { value: string; min: number }) {
  const { t } = useT();
  const n = value.trim().length;
  if (n >= min) return null;
  return (
    <Text variant="caption" style={{ color: '#D97706' }}>
      {t('create.minChars').split('{min}').join(String(min)).replace('{n}', String(n))}
    </Text>
  );
}

/** "Take photo" / "From gallery": an icon over its label. */
function PhotoSource({ icon, label, onPress }: { icon: IconName; label: string; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={{ flex: 1, height: 76, borderRadius: 14, borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.border, alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: colors.surface }}
    >
      <Icon name={icon} size={22} color={colors.tint} />
      <Text variant="caption" style={{ color: colors.fg, fontFamily: 'Inter_500Medium' }}>
        {label}
      </Text>
    </Pressable>
  );
}
