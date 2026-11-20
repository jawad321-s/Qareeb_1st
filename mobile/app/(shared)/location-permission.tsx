import React from 'react';
import { Linking, Platform, View } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { useLocation } from '@/hooks/useLocation';
import type { LocateProblem } from '@/lib/currentLocation';
import type { TranslationKey } from '@/i18n/translations';
import { useToast } from '@/components/feedback/Toast';
import { useAuth } from '@/store/auth';
import { api } from '@/services/api';
import { useT } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';

const web = Platform.OS === 'web';
const PROBLEM_TEXT: Record<LocateProblem, TranslationKey> = {
  denied: 'loc.denied',
  blocked: web ? 'loc.blockedWeb' : 'loc.blocked',
  servicesOff: 'loc.servicesOff',
  insecure: 'loc.insecure',
  unavailable: web ? 'loc.unavailableWeb' : 'loc.unavailable',
};

export default function LocationPermission() {
  const { request, loading } = useLocation();
  const toast = useToast();
  const updateUser = useAuth((s) => s.updateUser);
  const uid = useAuth((s) => s.user?.uid);
  const isArtisan = useAuth((s) => s.user?.role === 'artisan');
  const { gradient } = useTheme();
  const { t } = useT();

  // Customers find artisans near them; artisans find jobs near them.
  const BENEFITS = (
    isArtisan
      ? [
          { icon: 'briefcase', text: t('loc.a1') },
          { icon: 'map-pin', text: t('loc.a2') },
          { icon: 'clock', text: t('loc.a3') },
        ]
      : [
          { icon: 'map-pin', text: t('loc.b1') },
          { icon: 'clock', text: t('loc.b2') },
          { icon: 'navigation', text: t('loc.b3') },
        ]
  ) as { icon: 'briefcase' | 'map-pin' | 'clock' | 'navigation'; text: string }[];

  // Back to where it was opened from (or home, when opened directly in a browser).
  const close = () => (router.canGoBack() ? router.back() : router.replace('/'));

  const enable = async () => {
    const result = await request();
    if ('location' in result) {
      const geo = result.location;
      updateUser({ location: geo });
      // Firebase mode: save it on the user so distances work across devices.
      if (uid) api.updateUserLocation(uid, geo).catch(() => {});
      toast('success', t('loc.enabled'));
      close();
      return;
    }
    // Say what to do about it: allow it, switch location on, or try again.
    toast('error', t(PROBLEM_TEXT[result.problem]));
    // Refused for good on the phone: only Settings can allow it now.
    if (result.problem === 'blocked' && Platform.OS !== 'web') Linking.openSettings().catch(() => {});
  };

  return (
    <View style={{ flex: 1 }}>
      <StatusBar style="light" />
      <LinearGradient colors={gradient} style={{ flex: 1 }}>
        <SafeAreaView style={{ flex: 1, paddingHorizontal: 24, justifyContent: 'space-between' }}>
          <View style={{ flex: 1, justifyContent: 'center', gap: 28 }}>
            <Animated.View entering={FadeIn.duration(500)} style={{ alignItems: 'center', gap: 16 }}>
              <View style={{ width: 110, height: 110, borderRadius: 34, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="map-pin" size={54} color="#FFF" />
              </View>
              <Text variant="h1" tone="inverse" center>
                {t('loc.title')}
              </Text>
              <Text variant="body" center style={{ color: 'rgba(255,255,255,0.95)', maxWidth: 300 }}>
                {isArtisan ? t('loc.subtitleArtisan') : t('loc.subtitle')}
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
            <Button label={t('loc.enable')} variant="secondary" iconLeft="navigation" onPress={enable} loading={loading} />
            <Button label={t('loc.notNow')} variant="ghost" onPress={close} />
          </View>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}
