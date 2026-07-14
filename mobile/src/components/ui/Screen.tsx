import React from 'react';
import { ScrollView, View, type ViewStyle, RefreshControl } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '@/theme/ThemeProvider';

interface ScreenProps {
  children: React.ReactNode;
  scroll?: boolean;
  padded?: boolean;
  edges?: Edge[];
  refreshing?: boolean;
  onRefresh?: () => void;
  contentStyle?: ViewStyle;
  background?: string;
}

export function Screen({
  children,
  scroll = false,
  padded = true,
  edges = ['top'],
  refreshing,
  onRefresh,
  contentStyle,
  background,
}: ScreenProps) {
  const { colors, isDark } = useTheme();
  const pad: ViewStyle = padded ? { paddingHorizontal: 20 } : {};

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: background ?? colors.bg }} edges={edges}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      {scroll ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[{ paddingBottom: 32 }, pad, contentStyle]}
          refreshControl={
            onRefresh ? (
              <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={colors.tint} />
            ) : undefined
          }
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[{ flex: 1 }, pad, contentStyle]}>{children}</View>
      )}
    </SafeAreaView>
  );
}
