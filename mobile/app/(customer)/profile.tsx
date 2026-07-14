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
import { useAuth } from '@/store/auth';
import { useThemeStore } from '@/theme/ThemeProvider';
import { useTheme } from '@/theme/ThemeProvider';

interface Item {
  icon: IconName;
  label: string;
  route?: string;
  danger?: boolean;
  onPress?: () => void;
}

export default function Profile() {
  const { colors, isDark } = useTheme();
  const user = useAuth((s) => s.user)!;
  const signOut = useAuth((s) => s.signOut);
  const { mode, setMode } = useThemeStore();

  const sections: { title: string; items: Item[] }[] = [
    {
      title: 'Account',
      items: [
        { icon: 'user', label: 'Edit profile', route: '/(shared)/edit-profile' },
        { icon: 'wallet', label: 'Wallet & payments', route: '/(shared)/wallet' },
        { icon: 'heart', label: 'Favorites', route: '/(shared)/favorites' },
        { icon: 'bell', label: 'Notifications', route: '/(shared)/notifications' },
      ],
    },
    {
      title: 'Preferences',
      items: [
        { icon: isDark ? 'moon' : 'sun', label: `Theme: ${mode}`, onPress: () => setMode(mode === 'dark' ? 'light' : mode === 'light' ? 'system' : 'dark') },
        { icon: 'globe', label: 'Language', route: '/(shared)/settings' },
        { icon: 'settings', label: 'Settings', route: '/(shared)/settings' },
      ],
    },
    {
      title: 'Support',
      items: [
        { icon: 'help-circle', label: 'Help center', route: '/(shared)/settings' },
        { icon: 'flag', label: 'Report a problem', route: '/(shared)/settings' },
        { icon: 'log-out', label: 'Sign out', danger: true, onPress: () => { signOut(); router.replace('/(auth)/welcome'); } },
      ],
    },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar style="light" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 140 }}>
        <LinearGradient colors={['#4F46E5', '#06B6D4']} style={{ paddingBottom: 28 }}>
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
                <Stat label="Orders" value="18" />
                <Stat label="Rating" value={user.rating.toFixed(1)} />
                <Stat label="Reviews" value={String(user.ratingCount)} />
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
