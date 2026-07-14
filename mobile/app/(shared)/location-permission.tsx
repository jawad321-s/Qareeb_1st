import React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { useLocation } from '@/hooks/useLocation';
import { useToast } from '@/components/feedback/Toast';
import { useAuth } from '@/store/auth';

const BENEFITS = [
  { icon: 'map-pin', text: 'Match with the closest available artisans' },
  { icon: 'clock', text: 'Get accurate arrival-time estimates' },
  { icon: 'navigation', text: 'Track your artisan on the way in real time' },
] as const;

export default function LocationPermission() {
  const { request, loading } = useLocation();
  const toast = useToast();
  const updateUser = useAuth((s) => s.updateUser);

  const enable = async () => {
    const geo = await request();
    if (geo) {
      updateUser({ location: geo });
      toast('success', 'Location enabled');
      router.back();
    } else {
      toast('error', 'Location permission denied');
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <StatusBar style="light" />
      <LinearGradient colors={['#312E81', '#4F46E5', '#06B6D4']} style={{ flex: 1 }}>
        <SafeAreaView style={{ flex: 1, paddingHorizontal: 24, justifyContent: 'space-between' }}>
          <View style={{ flex: 1, justifyContent: 'center', gap: 28 }}>
            <Animated.View entering={FadeIn.duration(500)} style={{ alignItems: 'center', gap: 16 }}>
              <View style={{ width: 110, height: 110, borderRadius: 34, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="map-pin" size={54} color="#FFF" />
              </View>
              <Text variant="h1" tone="inverse" center>
                Enable location
              </Text>
              <Text variant="body" center style={{ color: 'rgba(255,255,255,0.85)', maxWidth: 300 }}>
                Qareeb uses your location to connect you with the best nearby artisans.
              </Text>
            </Animated.View>

            <View style={{ gap: 14 }}>
              {BENEFITS.map((b, i) => (
                <Animated.View key={b.text} entering={FadeInDown.delay(200 + i * 100).duration(450)} style={{ flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 16, padding: 14 }}>
                  <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name={b.icon} size={20} color="#FFF" />
                  </View>
                  <Text variant="bodyMedium" tone="inverse" style={{ flex: 1 }}>
                    {b.text}
                  </Text>
                </Animated.View>
              ))}
            </View>
          </View>

          <View style={{ gap: 10, paddingBottom: 16 }}>
            <Button label="Enable location" variant="secondary" iconLeft="navigation" onPress={enable} loading={loading} />
            <Button label="Not now" variant="ghost" onPress={() => router.back()} />
          </View>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}
