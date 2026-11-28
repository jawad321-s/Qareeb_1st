import React from 'react';
import { View, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Text } from '@/components/ui/Text';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { FloatingBlobs } from '@/components/ui/FloatingBlobs';
import { useAuth } from '@/store/auth';
import { useTheme } from '@/theme/ThemeProvider';
import { useThemeStore } from '@/theme/ThemeProvider';
import { useT } from '@/i18n';
import { useArtisan, useJobHistory } from '@/hooks/queries';
import { useMyRating } from '@/hooks/useMyRating';
import { ratingValue } from '@/lib/rating';
import { useMySubscription } from '@/store/subscription';
import { planNameOf } from '@/lib/plans';
import { useTabBarSpace } from '@/components/ui/TabBar';
import { ProfileMenu, type ProfileMenuItem } from '@/components/domain/ProfileMenu';

export default function ArtisanProfile() {
  const tabBarSpace = useTabBarSpace(); // keeps the last item clear of the floating tab bar
  const { colors, isDark } = useTheme();
  const user = useAuth((s) => s.user);
  const signOut = useAuth((s) => s.signOut);
  const { mode, setMode } = useThemeStore();
  const { t, locale, setLocale } = useT();
  // Real figures: verification from the account, jobs from the work history
  // (same count as the dashboard and income screens).
  const history = useJobHistory(user?.uid ?? '');
  const featured = useArtisan(user?.uid ?? '').data?.profile.featured === true;
  const rating = useMyRating();
  // The premium badge reflects the plan the artisan actually paid for.
  const plan = useMySubscription(user?.uid);

  // See customer profile: guard against a null user during the sign-out redirect.
  if (!user) return null;

  // Grouped like the customer's account screen: who I am, my work, how the
  // app looks, and help.
  const sections: { title: string; items: ProfileMenuItem[] }[] = [
    {
      title: t('profile.account'),
      items: [
        { icon: 'user', label: t('profile.editProfile'), route: '/(shared)/edit-profile' },
        { icon: 'shield', label: t('ap.verification'), route: '/(shared)/verification' },
        { icon: 'award', label: t('ap.subscription'), route: '/(shared)/subscription' },
        { icon: 'bell', label: t('profile.notifications'), route: '/(shared)/notifications' },
      ],
    },
    {
      title: t('profile.work'),
      items: [
        { icon: 'sliders', label: t('ap.services'), route: '/(shared)/my-services' },
        { icon: 'calendar', label: t('ap.availability'), route: '/(shared)/availability' },
        { icon: 'image', label: t('ap.gallery'), route: '/(shared)/gallery' },
        { icon: 'message', label: t('ap.conversations'), route: '/(shared)/conversations' },
      ],
    },
    {
      title: t('profile.preferences'),
      items: [
        {
          icon: isDark ? 'moon' : 'sun',
          label: `${t('profile.theme')}: ${t(`settings.${mode}` as any)}`,
          // Tapped: the three choices open beside the row.
          choices: (['system', 'dark', 'light'] as const).map((k) => ({ key: k, label: t(`settings.${k}`), icon: k === 'system' ? 'monitor' : k === 'dark' ? 'moon' : 'sun', selected: mode === k })),
          onChoose: (k) => setMode(k as typeof mode),
        },
        {
          icon: 'globe',
          label: `${t('profile.language')}: ${locale === 'ar' ? 'العربية' : 'English'}`,
          choices: [
            { key: 'en', label: 'English', selected: locale === 'en' },
            { key: 'ar', label: 'العربية', selected: locale === 'ar' },
          ],
          onChoose: (k) => setLocale(k as typeof locale),
        },
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
        <LinearGradient colors={['#9A3412', '#C2410C']} style={{ paddingBottom: 28, overflow: 'hidden' }}>
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
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 }}>
                {featured && <Badge label={t('featured.badge')} variant="warning" icon="star-filled" onDark />}
                {plan.isPaid && plan.record && <Badge label={planNameOf(plan.record, locale) || t('ad.premium')} variant="info" icon="award" onDark />}
                <Badge label={user.verified ? t('ad.verified') : t('ap.pending')} variant={user.verified ? 'success' : 'warning'} icon="shield" onDark />
              </View>
              <View style={{ flexDirection: 'row', gap: 28, marginTop: 8 }}>
                <Stat value={history.data ? String(history.data.completed.length) : '…'} label={t('ad.jobs')} />
                <Stat value={ratingValue(rating)} label={t('profile.rating')} />
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

function Stat({ value, label }: { value: string; label: string }) {
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
