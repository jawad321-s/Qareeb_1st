import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { Text } from '../ui/Text';
import { Icon, type IconName } from '../ui/Icon';
import { useTheme } from '@/theme/ThemeProvider';

type ToastType = 'success' | 'error' | 'info';
interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
}

const ICON: Record<ToastType, IconName> = { success: 'check-circle', error: 'x-circle', info: 'info' };
const COLOR: Record<ToastType, string> = { success: '#10B981', error: '#EF4444', info: '#6366F1' };

const ToastContext = createContext<(type: ToastType, message: string) => void>(() => {});

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const { isDark, colors } = useTheme();
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const show = useCallback((type: ToastType, message: string) => {
    const id = Math.random().toString(36).slice(2);
    Haptics.notificationAsync(
      type === 'success' ? Haptics.NotificationFeedbackType.Success : type === 'error' ? Haptics.NotificationFeedbackType.Error : Haptics.NotificationFeedbackType.Warning,
    ).catch(() => {});
    setToasts((t) => [...t, { id, type, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2800);
  }, []);

  return (
    <ToastContext.Provider value={show}>
      {children}
      <SafeAreaView edges={['top']} pointerEvents="box-none" style={{ position: 'absolute', top: 0, left: 0, right: 0, alignItems: 'center' }}>
        <View style={{ gap: 8, paddingTop: 8, width: '100%', alignItems: 'center' }} pointerEvents="box-none">
          {toasts.map((t) => (
            <Animated.View key={t.id} entering={FadeInUp.springify().damping(18)} exiting={FadeOutUp} style={{ borderRadius: 16, overflow: 'hidden', maxWidth: '92%' }}>
              <BlurView intensity={isDark ? 50 : 80} tint={isDark ? 'dark' : 'light'} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 12, borderWidth: 1, borderColor: colors.border }}>
                <Icon name={ICON[t.type]} size={20} color={COLOR[t.type]} />
                <Text variant="bodyMedium" numberOfLines={2} style={{ flexShrink: 1 }}>
                  {t.message}
                </Text>
              </BlurView>
            </Animated.View>
          ))}
        </View>
      </SafeAreaView>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
