import React from 'react';
import { Pressable, StyleSheet, TextInput, View, type TextStyle } from 'react-native';
import { Icon } from './Icon';
import { useTheme } from '@/theme/ThemeProvider';
import { useFont, useT } from '@/i18n';
import { radius, shadows } from '@/theme/tokens';
import { localizedTextAlign } from '@/i18n/rtl';

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
  const { isRTL } = useT();
  const Wrapper: any = onPress ? Pressable : View;

  // Arabic: text starts at the right edge, magnifier sits at the far left.
  const inputStyle: TextStyle = {
    flex: 1,
    color: colors.fg,
    fontSize: 15,
    fontFamily: font('Inter_400Regular'),
    textAlign: localizedTextAlign(isRTL),
    ...({ outlineStyle: 'none' } as any),
  };

  const SearchIcon = <Icon name="search" size={20} color={colors.muted} />;
  const FilterIcon = onFilter ? (
    <Pressable onPress={onFilter} hitSlop={8}>
      <Icon name="sliders" size={20} color={colors.tint} />
    </Pressable>
  ) : null;

  const Field = onPress ? (
    <View style={{ flex: 1 }} pointerEvents="none">
      <TextInput editable={false} placeholder={placeholder} placeholderTextColor={colors.muted} style={inputStyle} />
    </View>
  ) : (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={colors.muted}
      autoFocus={autoFocus}
      style={inputStyle}
    />
  );

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
      {/* RTL rows render first-child at the right — order children so the
          magnifier lands far-left and the filter far-right in Arabic. */}
      {isRTL ? (
        <>
          {FilterIcon}
          {Field}
          {SearchIcon}
        </>
      ) : (
        <>
          {SearchIcon}
          {Field}
          {FilterIcon}
        </>
      )}
    </Wrapper>
  );
}
