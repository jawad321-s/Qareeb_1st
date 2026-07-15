import '../global.css';
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
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
  const [splashDone, setSplashDone] = useState(false);

  useEffect(() => {
    hydrate();
    hydrateVerification();
  }, [hydrate, hydrateVerification]);

  useEffect(() => {
    // Hand the native splash over to our animated splash as soon as we're ready.
    if (hydrated && fontsLoaded) SplashScreen.hideAsync().catch(() => {});
  }, [hydrated, fontsLoaded]);

  if (!fontsLoaded) return null;

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
