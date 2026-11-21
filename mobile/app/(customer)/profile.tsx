import React from 'react';
import { View, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Text } from '@/components/ui/Text';
import { Avatar } from '@/components/ui/Avatar';
import { FloatingBlobs } from '@/components/ui/FloatingBlobs';
import { displayPhone } from '@/lib/phone';
import { useMyRequests } from '@/hooks/queries';
import { useMyRating } from '@/hooks/useMyRating';
import { ratingValue } from '@/lib/rating';
import { useAuth } from '@/store/auth';
import { useThemeStore } from '@/theme/ThemeProvider';
import { useTheme } from '@/theme/ThemeProvider';
import { useT } from '@/i18n';
import { useTabBarSpace } from '@/components/ui/TabBar';
import { ProfileMenu, type ProfileMenuItem } from '@/components/domain/ProfileMenu';

export default function Profile() {
  const tabBarSpace = useTabBarSpace(); // keeps the last item clear of the floating tab bar
  const { colors, isDark, gradient, gradientSoft } = useTheme();
  const user = useAuth((s) => s.user);
  const signOut = useAuth((s) => s.signOut);
  const { mode, setMode } = useThemeStore();
  const { t, locale, toggle } = useT();
  // Every request this customer has posted, whatever its status.
  const requests = useMyRequests(user?.uid ?? '');
  const rating = useMyRating();

  // Signing out clears `user`; the layout redirects to welcome, but guard here
  // too so this screen never dereferences a null user during that transition.
  if (!user) return null;

  const sections: { title: string; items: ProfileMenuItem[] }[] = [
    {
      title: t('profile.account'),
      items: [
        { icon: 'user', label: t('profile.editProfile'), route: '/(shared)/edit-profile' },
        { icon: 'briefcase', label: t('profile.pastArtisans'), route: '/(shared)/past-artisans' },
        { icon: 'bell', label: t('profile.notifications'), route: '/(shared)/notifications' },
      ],
    },
    {
      title: t('profile.preferences'),
      items: [
        { icon: isDark ? 'moon' : 'sun', label: `${t('profile.theme')}: ${t(`settings.${mode}` as any)}`, onPress: () => setMode(mode === 'dark' ? 'light' : mode === 'light' ? 'system' : 'dark') },
        { icon: 'globe', label: `${t('profile.language')}: ${locale === 'ar' ? 'العربية' : 'English'}`, onPress: toggle },
        { icon: 'settings', label: t('profile.settings'), route: '/(shared)/settings' },
      ],
    },
    {
      title: t('profile.support'),
      items: [
        { icon: 'help-circle', label: t('profile.help'), route: '/(shared)/help' },
        { icon: 'lightbulb', label: t('profile.suggest'), route: '/(shared)/suggest' },
        { icon: 'flag', label: t('profile.report'), route: '/(shared)/report' },
        { icon: 'log-out', label: t('profile.signOut'), danger: true, onPress: signOut },
      ],
    },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar style="light" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: tabBarSpace + 24 }}>
        <LinearGradient colors={gradient} style={{ paddingBottom: 28, overflow: 'hidden' }}>
          <FloatingBlobs
            blobs={[
              { size: 200, colors: [gradientSoft[1], gradientSoft[0]], top: -70, right: -40, range: 26 },
              { size: 150, colors: [gradientSoft[0], gradientSoft[1]], bottom: -40, left: -30, delay: 1500, range: 20 },
            ]}
          />
          <SafeAreaView edges={['top']}>
            <View style={{ alignItems: 'center', gap: 12, paddingTop: 20, paddingHorizontal: 20 }}>
              <Avatar uri={user.photoUrl} name={user.fullName} size={92} verified={user.verified} />
              <Text variant="h2" tone="inverse">
                {user.fullName}
              </Text>
              <Text variant="caption" style={{ color: 'rgba(255,255,255,0.95)' }}>
                {displayPhone(user.phone)}
              </Text>
              <View style={{ flexDirection: 'row', gap: 24, marginTop: 8 }}>
                <Stat label={t('profile.orders')} value={requests.data ? String(requests.data.length) : '…'} />
                <Stat label={t('profile.rating')} value={ratingValue(rating)} />
              </View>
            </View>
          </SafeAreaView>
        </LinearGradient>

        <View style={{ paddingHorizontal: 20, marginTop: 20, gap: 22 }}>
          <ProfileMenu sections={sections} />
          <Text variant="caption" tone="muted" center style={{ marginTop: 8 }}>
            Qareeb v1.0.0
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ alignItems: 'center' }}>
      <Text variant="h3" tone="inverse">
        {value}
      </Text>
      <Text variant="caption" style={{ color: 'rgba(255,255,255,0.95)' }}>
        {label}
      </Text>
    </View>
  );
}
