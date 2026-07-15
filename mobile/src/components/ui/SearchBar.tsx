import React from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Icon } from './Icon';
import { useTheme } from '@/theme/ThemeProvider';
import { useFont } from '@/i18n';
import { radius, shadows } from '@/theme/tokens';

interface Props {
  value?: string;
  onChangeText?: (t: string) => void;
  placeholder?: string;
  onPress?: () => void; // when set, acts as a button (navigates to search)
  onFilter?: () => void;
  autoFocus?: boolean;
}

export function SearchBar({ value, onChangeText, placeholder = 'Search services…', onPress, onFilter, autoFocus }: Props) {
  const { colors } = useTheme();
  const font = useFont();
  const Wrapper: any = onPress ? Pressable : View;

  return (
    <Wrapper
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        height: 50,
        paddingHorizontal: 18,
        borderRadius: radius.full,
        backgroundColor: colors.surface,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: colors.border,
        ...shadows.sm,
      }}
    >
      <Icon name="search" size={20} color={colors.muted} />
      {onPress ? (
        <View style={{ flex: 1 }}>
          <TextInput editable={false} pointerEvents="none" placeholder={placeholder} placeholderTextColor={colors.muted} style={{ color: colors.fg, fontSize: 15, fontFamily: font('Inter_400Regular') }} />
        </View>
      ) : (
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.muted}
          autoFocus={autoFocus}
          style={{ flex: 1, color: colors.fg, fontSize: 15, fontFamily: font('Inter_400Regular') }}
        />
      )}
      {onFilter && (
        <Pressable onPress={onFilter} hitSlop={8}>
          <Icon name="sliders" size={20} color={colors.tint} />
        </Pressable>
      )}
    </Wrapper>
  );
}
