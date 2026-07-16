import React, { useState } from 'react';
import { View, TextInput } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Screen } from '@/components/ui/Screen';
import { Header } from '@/components/ui/Header';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Rating } from '@/components/ui/Rating';
import { Avatar } from '@/components/ui/Avatar';
import { useTheme } from '@/theme/ThemeProvider';
import { useFont, useT } from '@/i18n';
import { MOCK_ARTISANS } from '@/mock/data';

export default function ReviewScreen() {
  const { colors } = useTheme();
  const { t, isRTL } = useT();
  const font = useFont();
  useLocalSearchParams<{ id: string }>();
  const artisan = MOCK_ARTISANS[3];
  const TAGS = [
    t('review.tag.punctual'), t('review.tag.professional'), t('review.tag.fairPrice'),
    t('review.tag.cleanWork'), t('review.tag.friendly'), t('review.tag.rehire'),
  ];
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const toggle = (t: string) => setTags((p) => (p.includes(t) ? p.filter((x) => x !== t) : [...p, t]));

  const submit = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 700));
    setSaving(false);
    router.back();
  };

  return (
    <Screen scroll>
      <Header showBack title={t('review.title')} />
      <Animated.View entering={FadeInDown.duration(400)} style={{ alignItems: 'center', gap: 12, marginVertical: 20 }}>
        <Avatar uri={artisan.photoUrl} name={artisan.fullName} size={80} verified />
        <Text variant="h3">{artisan.fullName}</Text>
        <Text variant="caption" tone="muted">
          {t('review.how')}
        </Text>
        <Rating value={rating} editable size={40} onChange={setRating} />
      </Animated.View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
        {TAGS.map((t) => {
          const active = tags.includes(t);
          return (
            <Text
              key={t}
              variant="caption"
              onPress={() => toggle(t)}
              style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: 1.5, borderColor: active ? colors.tint : colors.border, color: active ? colors.tint : colors.fg, backgroundColor: active ? colors.tint + '12' : 'transparent', fontFamily: 'Inter_500Medium', overflow: 'hidden' }}
            >
              {t}
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
        style={{ minHeight: 120, borderRadius: 16, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.surface, padding: 14, color: colors.fg, fontSize: 15, fontFamily: font('Inter_400Regular'), textAlign: isRTL ? 'right' : 'left', textAlignVertical: 'top', marginBottom: 20 }}
      />

      <Button label={t('review.submit')} iconRight="send" onPress={submit} loading={saving} />
    </Screen>
  );
}
