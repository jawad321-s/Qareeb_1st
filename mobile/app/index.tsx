import React from 'react';
import { Redirect } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useAuth } from '@/store/auth';
import { storage } from '@/lib/mmkv';
import { RESTORE_ROUTE_KEY } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';

/** Entry point — routes to the correct experience once the session is hydrated. */
export default function Index() {
  const { user, hydrated } = useAuth();
  const { colors } = useTheme();

  if (!hydrated) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator color={colors.tint} size="large" />
      </View>
    );
  }

  // Changing the language restarts the app (the native RTL flip requires it).
  // If a screen was saved right before that restart, return the user straight
  // to it instead of the default home. One-shot: consumed on read.
  const restore = storage.getString(RESTORE_ROUTE_KEY);
  if (restore) {
    storage.delete(RESTORE_ROUTE_KEY);
    if (user || restore.startsWith('/welcome') || restore.startsWith('/login') || restore.startsWith('/register')) {
      return <Redirect href={restore as any} />;
    }
  }

  if (!user) return <Redirect href="/(auth)/welcome" />;
  if (user.role === 'artisan') return <Redirect href="/(artisan)/dashboard" />;
  return <Redirect href="/(customer)/home" />;
}
