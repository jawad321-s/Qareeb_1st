import React, { useState } from 'react';
import { View, ScrollView, TextInput } from 'react-native';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Screen } from '@/components/ui/Screen';
import { Header } from '@/components/ui/Header';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { CardSkeleton } from '@/components/feedback/Skeleton';
import { useRequest, useSubmitOffer } from '@/hooks/queries';
import { categoryById } from '@/constants/categories';
import { formatMoney } from '@/lib/format';
import { useAuth } from '@/store/auth';
import { useTheme } from '@/theme/ThemeProvider';

export default function JobDetail() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const user = useAuth((s) => s.user)!;
  const { data: request, isLoading } = useRequest(id!);
  const submit = useSubmitOffer(id!);

  const [price, setPrice] = useState('');
  const [eta, setEta] = useState('30');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  if (isLoading || !request) {
    return (
      <Screen scroll>
        <Header showBack title="Job" />
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
      message: message.trim(),
      artisan: { uid: user.uid, fullName: user.fullName, photoUrl: user.photoUrl, rating: user.rating, ratingCount: user.ratingCount },
    });
    setSent(true);
    setTimeout(() => router.back(), 900);
  };

  const canSend = Number(price) > 0 && Number(eta) > 0 && message.trim().length >= 5 && !sent;

  return (
    <Screen scroll>
      <Header showBack title="Job details" />

      <Animated.View entering={FadeInDown.duration(400)}>
        <Card style={{ gap: 14 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: (cat?.colorHex ?? '#6366F1') + '22', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name={(cat?.icon as any) ?? 'tools'} size={22} color={cat?.colorHex ?? '#6366F1'} />
            </View>
            <View style={{ flex: 1 }}>
              <Text variant="h3">{request.title}</Text>
              <Text variant="caption" tone="muted">
                {cat?.name.en}
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
                Budget {formatMoney(request.budget.min)}–{formatMoney(request.budget.max)}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Icon name="map-pin" size={16} color="#94A3B8" />
              <Text variant="caption" tone="muted">
                {request.location.address} · 2.4 km
              </Text>
            </View>
          </View>
        </Card>
      </Animated.View>

      {/* Offer form */}
      <Text variant="h3" style={{ marginTop: 24, marginBottom: 14 }}>
        Send your quotation
      </Text>
      <View style={{ gap: 16 }}>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1, gap: 6 }}>
            <Text variant="caption" tone="muted">
              Price (SAR)
            </Text>
            <TextInput value={price} onChangeText={setPrice} keyboardType="number-pad" placeholder="120" placeholderTextColor={colors.muted} style={inputStyle(colors)} />
          </View>
          <View style={{ flex: 1, gap: 6 }}>
            <Text variant="caption" tone="muted">
              ETA (min)
            </Text>
            <TextInput value={eta} onChangeText={setEta} keyboardType="number-pad" placeholder="30" placeholderTextColor={colors.muted} style={inputStyle(colors)} />
          </View>
        </View>
        <View style={{ gap: 6 }}>
          <Text variant="caption" tone="muted">
            Message to customer
          </Text>
          <TextInput
            value={message}
            onChangeText={setMessage}
            placeholder="Introduce yourself and what's included…"
            placeholderTextColor={colors.muted}
            multiline
            style={{ ...inputStyle(colors), minHeight: 100, height: undefined, textAlignVertical: 'top', paddingTop: 12 }}
          />
        </View>
        <Button label={sent ? 'Offer sent ✓' : 'Submit offer'} iconRight={sent ? 'check-circle' : 'send'} onPress={send} loading={submit.isPending} disabled={!canSend} />
      </View>
    </Screen>
  );
}

const inputStyle = (colors: any) => ({
  height: 54,
  borderRadius: 16,
  borderWidth: 1.5,
  borderColor: colors.border,
  backgroundColor: colors.surface,
  paddingHorizontal: 14,
  color: colors.fg,
  fontSize: 16,
  fontFamily: 'Inter_500Medium',
});
