import React from 'react';
import { View, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { useAuth } from '@/store/auth';
import { gradients } from '@/theme/tokens';

const { height } = Dimensions.get('window');

const FEATURES = [
  { icon: 'map-pin', title: 'Nearby & fast', desc: 'Matched with verified artisans around you' },
  { icon: 'shield', title: 'Verified pros', desc: 'ID-checked, rated and reviewed' },
  { icon: 'wallet', title: 'Fair offers', desc: 'Compare quotes, pick what fits you' },
] as const;

export default function Welcome() {
  const signInAs = useAuth((s) => s.signInAs);

  return (
    <View style={{ flex: 1 }}>
      <StatusBar style="light" />
      <LinearGradient colors={['#312E81', '#4F46E5', '#06B6D4']} style={{ flex: 1 }}>
        <SafeAreaView style={{ flex: 1, paddingHorizontal: 24, justifyContent: 'space-between' }}>
          <View style={{ flex: 1, justifyContent: 'center', gap: 28, paddingTop: height * 0.06 }}>
            <Animated.View entering={FadeIn.duration(600)} style={{ alignItems: 'center', gap: 16 }}>
              <View
                style={{
                  width: 96,
                  height: 96,
                  borderRadius: 28,
                  backgroundColor: 'rgba(255,255,255,0.15)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon name="tools" size={48} color="#FFFFFF" />
              </View>
              <Text variant="display" tone="inverse" center>
                Qareeb
              </Text>
              <Text variant="body" center style={{ color: 'rgba(255,255,255,0.85)', maxWidth: 300 }}>
                Home services from trusted artisans, right around the corner.
              </Text>
            </Animated.View>

            <View style={{ gap: 14, marginTop: 12 }}>
              {FEATURES.map((f, i) => (
                <Animated.View
                  key={f.title}
                  entering={FadeInDown.delay(200 + i * 120).duration(500)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 14,
                    backgroundColor: 'rgba(255,255,255,0.12)',
                    borderRadius: 18,
                    padding: 14,
                  }}
                >
                  <View
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      backgroundColor: 'rgba(255,255,255,0.18)',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Icon name={f.icon} size={22} color="#FFFFFF" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text variant="bodyMedium" tone="inverse">
                      {f.title}
                    </Text>
                    <Text variant="caption" style={{ color: 'rgba(255,255,255,0.8)' }}>
                      {f.desc}
                    </Text>
                  </View>
                </Animated.View>
              ))}
            </View>
          </View>

          <Animated.View entering={FadeInDown.delay(700).duration(500)} style={{ gap: 12, paddingBottom: 12 }}>
            <Button label="Get started" variant="secondary" iconRight="arrow-right" onPress={() => router.push('/(auth)/register')} />
            <Button label="I already have an account" variant="ghost" onPress={() => router.push('/(auth)/login')} />
            <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 16, marginTop: 4 }}>
              <Text variant="caption" style={{ color: 'rgba(255,255,255,0.8)' }} onPress={() => signInAs('customer')}>
                Demo: Customer
              </Text>
              <Text variant="caption" style={{ color: 'rgba(255,255,255,0.8)' }} onPress={() => signInAs('artisan')}>
                Demo: Artisan
              </Text>
            </View>
          </Animated.View>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}
