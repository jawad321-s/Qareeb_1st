import React from 'react';
import { Redirect } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useAuth } from '@/store/auth';
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

  if (!user) return <Redirect href="/(auth)/welcome" />;
  if (user.role === 'artisan') return <Redirect href="/(artisan)/dashboard" />;
  return <Redirect href="/(customer)/home" />;
}
