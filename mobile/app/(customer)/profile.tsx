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
import { Rating } from '@/components/ui/Rating';
import { FloatingBlobs } from '@/components/ui/FloatingBlobs';
import { useAuth } from '@/store/auth';
import { useThemeStore } from '@/theme/ThemeProvider';
import { useTheme } from '@/theme/ThemeProvider';
import { useT } from '@/i18n';

interface Item {
  icon: IconName;
  label: string;
  route?: string;
  danger?: boolean;
  onPress?: () => void;
}

export default function Profile() {
  const { colors, isDark, gradient, gradientSoft } = useTheme();
  const user = useAuth((s) => s.user)!;
  const signOut = useAuth((s) => s.signOut);
  const { mode, setMode } = useThemeStore();
  const { t, locale, toggle } = useT();

  const sections: { title: string; items: Item[] }[] = [
    {
      title: t('profile.account'),
      items: [
        { icon: 'user', label: t('profile.editProfile'), route: '/(shared)/edit-profile' },
        { icon: 'wallet', label: t('profile.wallet'), route: '/(shared)/wallet' },
        { icon: 'heart', label: t('profile.favorites'), route: '/(shared)/favorites' },
        { icon: 'bell', label: t('profile.notifications'), route: '/(shared)/notifications' },
      ],
    },
    {
      title: t('profile.preferences'),
      items: [
        { icon: isDark ? 'moon' : 'sun', label: `${t('profile.theme')}: ${mode}`, onPress: () => setMode(mode === 'dark' ? 'light' : mode === 'light' ? 'system' : 'dark') },
        { icon: 'globe', label: `${t('profile.language')}: ${locale === 'ar' ? 'العربية' : 'English'}`, onPress: toggle },
        { icon: 'settings', label: t('profile.settings'), route: '/(shared)/settings' },
      ],
    },
    {
      title: t('profile.support'),
      items: [
        { icon: 'help-circle', label: t('profile.help'), route: '/(shared)/help' },
        { icon: 'flag', label: t('profile.report'), route: '/(shared)/report' },
        { icon: 'log-out', label: t('profile.signOut'), danger: true, onPress: () => { signOut(); router.replace('/(auth)/welcome'); } },
      ],
    },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar style="light" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 140 }}>
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
              <Text variant="caption" style={{ color: 'rgba(255,255,255,0.85)' }}>
                {user.email}
              </Text>
              <View style={{ flexDirection: 'row', gap: 24, marginTop: 8 }}>
                <Stat label={t('profile.orders')} value="18" />
                <Stat label={t('profile.rating')} value={user.rating.toFixed(1)} />
                <Stat label={t('profile.reviews')} value={String(user.ratingCount)} />
              </View>
            </View>
          </SafeAreaView>
        </LinearGradient>

        <View style={{ paddingHorizontal: 20, marginTop: 20, gap: 22 }}>
          {sections.map((section) => (
            <View key={section.title} style={{ gap: 10 }}>
              <Text variant="overline" tone="muted" style={{ marginLeft: 4 }}>
                {section.title.toUpperCase()}
              </Text>
              <Card padded={false}>
                {section.items.map((item, i) => (
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
          ))}
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
      <Text variant="caption" style={{ color: 'rgba(255,255,255,0.8)' }}>
        {label}
      </Text>
    </View>
  );
}
