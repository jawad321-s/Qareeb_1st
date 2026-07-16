import React from 'react';
import { View, ScrollView, Pressable } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Text } from '@/components/ui/Text';
import { Avatar } from '@/components/ui/Avatar';
import { Icon, type IconName } from '@/components/ui/Icon';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { FloatingBlobs } from '@/components/ui/FloatingBlobs';
import { useAuth } from '@/store/auth';
import { useTheme } from '@/theme/ThemeProvider';
import { useThemeStore } from '@/theme/ThemeProvider';
import { useT } from '@/i18n';
import { MOCK_ARTISAN_PROFILE } from '@/mock/data';

export default function ArtisanProfile() {
  const { colors, isDark } = useTheme();
  const user = useAuth((s) => s.user)!;
  const signOut = useAuth((s) => s.signOut);
  const { mode, setMode } = useThemeStore();
  const { t, locale, toggle } = useT();
  const profile = MOCK_ARTISAN_PROFILE;

  const items: { icon: IconName; label: string; danger?: boolean; onPress?: () => void; route?: string }[] = [
    { icon: 'shield', label: t('ap.verification'), route: '/(shared)/verification' },
    { icon: 'image', label: t('ap.gallery'), route: '/(shared)/settings' },
    { icon: 'sliders', label: t('ap.servicesPricing'), route: '/(shared)/settings' },
    { icon: 'map-pin', label: t('ap.radius'), route: '/(shared)/settings' },
    { icon: 'calendar', label: t('ap.availability'), route: '/(shared)/settings' },
    { icon: 'award', label: t('ap.subscription'), route: '/(shared)/subscription' },
    { icon: 'globe', label: `${t('profile.language')}: ${locale === 'ar' ? 'العربية' : 'English'}`, onPress: toggle },
    { icon: isDark ? 'moon' : 'sun', label: `${t('profile.theme')}: ${mode}`, onPress: () => setMode(mode === 'dark' ? 'light' : mode === 'light' ? 'system' : 'dark') },
    { icon: 'log-out', label: t('profile.signOut'), danger: true, onPress: () => { signOut(); router.replace('/(auth)/welcome'); } },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar style="light" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 140 }}>
        <LinearGradient colors={['#C2410C', '#F97316']} style={{ paddingBottom: 28, overflow: 'hidden' }}>
          <FloatingBlobs
            blobs={[
              { size: 200, colors: ['#FDBA74', '#F97316'], top: -70, right: -40, range: 26 },
              { size: 150, colors: ['#FBA94C', '#EA7509'], bottom: -40, left: -30, delay: 1500, range: 20 },
            ]}
          />
          <SafeAreaView edges={['top']}>
            <View style={{ alignItems: 'center', gap: 10, paddingTop: 20, paddingHorizontal: 20 }}>
              <Avatar uri={user.photoUrl} name={user.fullName} size={92} verified={user.verified} />
              <Text variant="h2" tone="inverse">
                {user.fullName}
              </Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {profile.premium && <Badge label={t('ad.premium')} variant="warning" icon="award" />}
                <Badge label={profile.verificationStatus === 'approved' ? t('ad.verified') : t('ap.pending')} variant={profile.verificationStatus === 'approved' ? 'success' : 'warning'} icon="shield" />
              </View>
              <View style={{ flexDirection: 'row', gap: 28, marginTop: 8 }}>
                <Stat value={String(profile.completedJobs)} label={t('ad.jobs')} />
                <Stat value={user.rating.toFixed(1)} label={t('profile.rating')} />
                <Stat value={`${profile.serviceRadiusKm}km`} label={t('ad.radius')} />
              </View>
            </View>
          </SafeAreaView>
        </LinearGradient>

        <View style={{ paddingHorizontal: 20, marginTop: 20 }}>
          <Card padded={false}>
            {items.map((item, i) => (
              <Pressable
                key={item.label}
                onPress={item.onPress ?? (item.route ? () => router.push(item.route as any) : undefined)}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderTopWidth: i === 0 ? 0 : 1, borderTopColor: colors.border }}
              >
                <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: item.danger ? '#EF444418' : colors.surface2, alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name={item.icon} size={18} color={item.danger ? '#EF4444' : colors.tint} />
                </View>
                <Text variant="bodyMedium" style={{ flex: 1 }} tone={item.danger ? 'danger' : 'default'}>
                  {item.label}
                </Text>
                {!item.danger && <Icon name="chevron-right" size={18} color={colors.muted} />}
              </Pressable>
            ))}
          </Card>
        </View>
      </ScrollView>
    </View>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View style={{ alignItems: 'center' }}>
      <Text variant="h3" tone="inverse">
        {value}
      </Text>
      <Text variant="caption" style={{ color: 'rgba(255,255,255,0.8)' }}>
        {label}
      </Text>
    </View>
  );
}
