import React from 'react';
import { Redirect } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useAuth } from '@/store/auth';
import { storage } from '@/lib/mmkv';
import { RESTORE_ROUTE_KEY } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';

// Tab paths exist in both role groups (e.g. /profile, /requests), and expo-router
// resolves a group-less path to whichever group registers first — which can dump
// an artisan into the customer app after the language-switch restart. Pin the
// saved path to the signed-in role's group explicitly.
const ARTISAN_PATHS = ['dashboard', 'requests', 'offers', 'income', 'profile', 'job'];
const CUSTOMER_PATHS = ['home', 'search', 'create', 'requests', 'profile'];

function resolveForRole(path: string, role?: 'customer' | 'artisan' | string) {
  const seg = path.split('/')[1] ?? '';
  if (role === 'artisan' && ARTISAN_PATHS.includes(seg)) return `/(artisan)${path}`;
  if (role === 'customer' && CUSTOMER_PATHS.includes(seg)) return `/(customer)${path}`;
  return path;
}

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
      return <Redirect href={resolveForRole(restore, user?.role) as any} />;
    }
  }

  if (!user) return <Redirect href="/(auth)/welcome" />;
  if (user.role === 'artisan') return <Redirect href="/(artisan)/dashboard" />;
  return <Redirect href="/(customer)/home" />;
}
