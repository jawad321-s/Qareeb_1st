import '../global.css';
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClientProvider } from '@tanstack/react-query';
import { Stack, usePathname } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import {
  Cairo_400Regular,
  Cairo_500Medium,
  Cairo_600SemiBold,
  Cairo_700Bold,
} from '@expo-google-fonts/cairo';
import { ThemeProvider, useTheme } from '@/theme/ThemeProvider';
import { ToastProvider } from '@/components/feedback/Toast';
import { AnimatedSplash } from '@/components/AnimatedSplash';
import { queryClient } from '@/lib/queryClient';
import { setCurrentPathname } from '@/lib/currentRoute';
import { storage } from '@/lib/mmkv';
import { LANG_RELOAD_KEY } from '@/i18n';
import { useAuth } from '@/store/auth';
import { useVerification } from '@/store/verification';

SplashScreen.preventAutoHideAsync().catch(() => {});

function RootNavigator() {
  const { colors } = useTheme();
  const hydrate = useAuth((s) => s.hydrate);
  const hydrated = useAuth((s) => s.hydrated);
  const hydrateVerification = useVerification((s) => s.hydrate);
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Cairo_400Regular,
    Cairo_500Medium,
    Cairo_600SemiBold,
    Cairo_700Bold,
  });
  // A language switch restarts the app; that boot should feel like a quick
  // refresh, not a cold start — so skip the animated splash for it (one-shot).
  const [splashDone, setSplashDone] = useState(() => {
    const langReload = storage.getString(LANG_RELOAD_KEY);
    if (langReload) storage.delete(LANG_RELOAD_KEY);
    return !!langReload;
  });
  const pathname = usePathname();

  // Keep the module-level "where am I" up to date, so the language switch can
  // save it before the RTL restart and return the user to the same screen.
  useEffect(() => {
    setCurrentPathname(pathname);
  }, [pathname]);

  useEffect(() => {
    hydrate();
    hydrateVerification();
  }, [hydrate, hydrateVerification]);

  useEffect(() => {
    // Hand the native splash over to our animated splash as soon as we're ready.
    if (hydrated && fontsLoaded) SplashScreen.hideAsync().catch(() => {});
  }, [hydrated, fontsLoaded]);

  // Never render null here: a null tree shows as a black window during the
  // fonts reload after a language switch. Paint the theme background instead.
  if (!fontsLoaded) return <View style={{ flex: 1, backgroundColor: colors.bg }} />;

  return (
    <View style={{ flex: 1 }}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bg },
          animation: 'slide_from_right',
          animationDuration: 260,
          gestureEnabled: true,
        }}
      >
        <Stack.Screen name="index" options={{ animation: 'fade' }} />
        <Stack.Screen name="(auth)" options={{ animation: 'fade' }} />
        <Stack.Screen name="(customer)" options={{ animation: 'fade' }} />
        <Stack.Screen name="(artisan)" options={{ animation: 'fade' }} />
        <Stack.Screen name="(shared)" options={{ presentation: 'card', animation: 'slide_from_right' }} />
      </Stack>
      {!splashDone && <AnimatedSplash onFinish={() => setSplashDone(true)} />}
    </View>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <ToastProvider>
              <RootNavigator />
            </ToastProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
