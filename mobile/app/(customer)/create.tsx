import React, { useState } from 'react';
import { I18nManager, View, ScrollView, Pressable, TextInput } from 'react-native';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { Screen } from '@/components/ui/Screen';
import { Header } from '@/components/ui/Header';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Card } from '@/components/ui/Card';
import { CategoryTile } from '@/components/domain/CategoryTile';
import { useTabBarSpace } from '@/components/ui/TabBar';
import { CATEGORIES } from '@/constants/categories';
import { useCreateRequest } from '@/hooks/queries';
import { useAuth } from '@/store/auth';
import { useTheme } from '@/theme/ThemeProvider';
import { useFont, useT } from '@/i18n';
import { config } from '@/lib/config';
import { formatMoney } from '@/lib/format';
import { localizedTextAlign } from '@/i18n/rtl';

export default function CreateRequest() {
  const { colors } = useTheme();
  const user = useAuth((s) => s.user)!;
  const { t, locale, isRTL } = useT();
  const font = useFont();
  const tabBarSpace = useTabBarSpace();
  const create = useCreateRequest(user.uid);
  const STEPS = [t('create.step.service'), t('create.step.details'), t('create.step.budget'), t('create.step.review')];

  const [step, setStep] = useState(0);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [budgetMin, setBudgetMin] = useState('100');
  const [budgetMax, setBudgetMax] = useState('300');
  const [when, setWhen] = useState<'asap' | 'today' | 'tomorrow'>('asap');

  const category = CATEGORIES.find((c) => c.id === categoryId);

  const pickImage = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7, allowsMultipleSelection: true });
    if (!res.canceled) setImages((prev) => [...prev, ...res.assets.map((a) => a.uri)].slice(0, 4));
  };

  const canNext = () => {
    if (step === 0) return !!categoryId;
    if (step === 1) return title.trim().length >= 4 && description.trim().length >= 10;
    if (step === 2) return Number(budgetMax) >= Number(budgetMin) && Number(budgetMax) > 0;
    return true;
  };

  const submit = async () => {
    const preferredTime = when === 'asap' ? Date.now() + 3600_000 : when === 'today' ? Date.now() + 3600_000 * 5 : Date.now() + 3600_000 * 24;
    const req = await create.mutateAsync({
      customerId: user.uid,
      serviceId: `${categoryId}_repair`,
      categoryId: categoryId!,
      title: title.trim(),
      description: description.trim(),
      images,
      location: user.location!,
      preferredTime,
      budget: { min: Number(budgetMin) * 100, max: Number(budgetMax) * 100 },
    });
    router.replace(`/(shared)/request/${req.id}`);
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

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
        {step === 0 && (
          <Animated.View entering={FadeIn} style={{ gap: 16 }}>
            <Text variant="h3">{t('create.whatNeed')}</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between' }}>
              {CATEGORIES.map((c) => (
                <View key={c.id} style={{ opacity: categoryId && categoryId !== c.id ? 0.5 : 1 }}>
                  <CategoryTile category={c} locale={locale} size={80} onPress={() => setCategoryId(c.id)} />
                  {categoryId === c.id && (
                    <View style={{ position: 'absolute', top: -4, right: 8, backgroundColor: colors.tint, borderRadius: 999, padding: 3 }}>
                      <Icon name="check" size={12} color="#FFF" strokeWidth={3} />
                    </View>
                  )}
                </View>
              ))}
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
                placeholder={category?.name[locale]}
                placeholderTextColor={colors.muted}
                style={{ height: 54, borderRadius: 16, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.surface, paddingHorizontal: 14, color: colors.fg, fontSize: 15, fontFamily: font('Inter_400Regular'), textAlign: localizedTextAlign(isRTL) }}
              />
            </View>
            <View style={{ gap: 6 }}>
              <Text variant="caption" tone="muted">
                {t('create.describe')}
              </Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder={t('create.describePlaceholder')}
                placeholderTextColor={colors.muted}
                multiline
                style={{ minHeight: 120, borderRadius: 16, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.surface, padding: 14, color: colors.fg, fontSize: 15, fontFamily: font('Inter_400Regular'), textAlign: localizedTextAlign(isRTL), textAlignVertical: 'top' }}
              />
            </View>
            <View style={{ gap: 8 }}>
              <Text variant="caption" tone="muted">
                {t('create.photos')}
              </Text>
              <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
                {images.map((uri) => (
                  <View key={uri}>
                    <Image source={{ uri }} style={{ width: 76, height: 76, borderRadius: 14 }} />
                    <Pressable onPress={() => setImages((p) => p.filter((u) => u !== uri))} style={{ position: 'absolute', top: -6, right: -6, backgroundColor: '#EF4444', borderRadius: 999, padding: 3 }}>
                      <Icon name="x" size={12} color="#FFF" strokeWidth={3} />
                    </Pressable>
                  </View>
                ))}
                {images.length < 4 && (
                  <Pressable onPress={pickImage} style={{ width: 76, height: 76, borderRadius: 14, borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.border, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface }}>
                    <Icon name="camera" size={22} color={colors.muted} />
                  </Pressable>
                )}
              </View>
            </View>
          </Animated.View>
        )}

        {step === 2 && (
          <Animated.View entering={FadeInDown} style={{ gap: 20 }}>
            <Text variant="h3">{t('create.budgetRange')}</Text>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              {[
                { label: t('create.min'), v: budgetMin, set: setBudgetMin },
                { label: t('create.max'), v: budgetMax, set: setBudgetMax },
              ].map((b) => (
                <View key={b.label} style={{ flex: 1, gap: 6 }}>
                  <Text variant="caption" tone="muted">
                    {b.label} ({config.currency})
                  </Text>
                  <TextInput
                    value={b.v}
                    onChangeText={b.set}
                    keyboardType="number-pad"
                    style={{ height: 54, borderRadius: 16, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.surface, paddingHorizontal: 14, color: colors.fg, fontSize: 18, fontFamily: font('Inter_600SemiBold'), textAlign: localizedTextAlign(isRTL) }}
                  />
                </View>
              ))}
            </View>
            <Text variant="h3" style={{ marginTop: 8 }}>
              {t('create.when')}
            </Text>
            <View style={{ gap: 10 }}>
              {[
                { key: 'asap' as const, label: t('create.asap'), icon: 'zap' as const },
                { key: 'today' as const, label: t('create.today'), icon: 'clock' as const },
                { key: 'tomorrow' as const, label: t('create.tomorrow'), icon: 'calendar' as const },
              ].map((o) => {
                const active = when === o.key;
                return (
                  <Pressable
                    key={o.key}
                    onPress={() => setWhen(o.key)}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 16, borderWidth: 1.5, borderColor: active ? colors.tint : colors.border, backgroundColor: active ? colors.tint + '15' : colors.surface }}
                  >
                    <Icon name={o.icon} size={20} color={active ? colors.tint : colors.muted} />
                    <Text variant="bodyMedium" style={{ flex: 1 }}>
                      {o.label}
                    </Text>
                    {active && <Icon name="check-circle" size={20} color={colors.tint} />}
                  </Pressable>
                );
              })}
            </View>
          </Animated.View>
        )}

        {step === 3 && (
          <Animated.View entering={FadeInDown} style={{ gap: 14 }}>
            <Text variant="h3">{t('create.reviewTitle')}</Text>
            <Card style={{ gap: 14 }}>
              <Row label={t('create.step.service')} value={category?.name[locale] ?? '—'} />
              <Row label={t('create.titleLabel')} value={title} />
              <Row label={t('create.step.budget')} value={`${formatMoney(Number(budgetMin) * 100)} – ${formatMoney(Number(budgetMax) * 100)}`} />
              <Row label={t('create.when')} value={when === 'asap' ? t('create.asap') : when === 'today' ? t('create.today') : t('create.tomorrow')} />
              <Row label={t('home.setLocation')} value={user.location?.address ?? '—'} />
              <Row label={t('create.photos')} value={String(images.length)} />
            </Card>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 12, backgroundColor: colors.tint + '12' }}>
              <Icon name="info" size={18} color={colors.tint} />
              <Text variant="caption" tone="primary" style={{ flex: 1 }}>
                Nearby verified artisans will be notified instantly.
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
            <Button label={t('create.submit')} iconRight="send" loading={create.isPending} onPress={submit} />
          </View>
        )}
      </View>
    </Screen>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
      <Text variant="body" tone="muted">
        {label}
      </Text>
      <Text variant="bodyMedium" style={{ flex: 1, textAlign: I18nManager.isRTL ? 'left' : 'right' }} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}
