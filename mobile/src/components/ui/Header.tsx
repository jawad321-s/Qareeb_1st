import React from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { Text } from './Text';
import { Icon, type IconName } from './Icon';
import { useTheme } from '@/theme/ThemeProvider';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  rightIcon?: IconName;
  onRightPress?: () => void;
  onBack?: () => void;
  transparent?: boolean;
}

export function Header({ title, subtitle, showBack, rightIcon, onRightPress, onBack, transparent }: HeaderProps) {
  const { colors } = useTheme();

  // Safe back: some screens are reached via router.replace (e.g. the new
  // request detail after submitting), so there's no history to pop. Fall back
  // to the root, which redirects to the right home — never throws GO_BACK.
  const goBack = () => {
    if (onBack) return onBack();
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 8,
        marginBottom: 8,
        backgroundColor: transparent ? 'transparent' : undefined,
      }}
    >
      {showBack && (
        <Pressable
          onPress={goBack}
          hitSlop={8}
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colors.surface2,
          }}
        >
          <Icon name="arrow-left" size={20} color={colors.fg} />
        </Pressable>
      )}
      <View style={{ flex: 1 }}>
        {title && <Text variant="h2">{title}</Text>}
        {subtitle && (
          <Text variant="caption" tone="muted">
            {subtitle}
          </Text>
        )}
      </View>
      {rightIcon && (
        <Pressable
          onPress={onRightPress}
          hitSlop={8}
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colors.surface2,
          }}
        >
          <Icon name={rightIcon} size={20} color={colors.fg} />
        </Pressable>
      )}
    </View>
  );
}
