import React, { useRef, useState } from 'react';
import { Pressable, TextInput, type TextInputInstance } from 'react-native';
import { Text } from './Text';
import { useTheme } from '@/theme/ThemeProvider';
import { useFont } from '@/i18n';
import { config } from '@/lib/config';

/**
 * An amount in shekels: "00 ₪" until something is typed, then "120 ₪",
 * starting on the reading side (the right in Arabic, the left in English).
 * The number box is as wide as the number, so where it sits comes from the
 * layout's direction and not from a phone's own idea of how to align digits.
 */
export function MoneyField({ value, onChangeText, autoFocus }: { value: string; onChangeText: (v: string) => void; autoFocus?: boolean }) {
  const { colors } = useTheme();
  const font = useFont();
  const ref = useRef<TextInputInstance>(null);
  const [focused, setFocused] = useState(false);
  const digits = Math.max(value.length, 2);
  return (
    <Pressable
      onPress={() => ref.current?.focus()}
      style={{
        height: 54,
        borderRadius: 16,
        borderWidth: 1.5,
        borderColor: focused ? colors.tint : colors.border,
        backgroundColor: colors.surface,
        paddingHorizontal: 14,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
      }}
    >
      <TextInput
        ref={ref}
        value={value}
        onChangeText={(v) => onChangeText(v.replace(/[^0-9]/g, '').slice(0, 6))}
        keyboardType="number-pad"
        placeholder="00"
        placeholderTextColor={colors.muted}
        autoFocus={autoFocus}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        maxLength={6}
        style={{
          width: (digits + 1) * 11,
          height: '100%',
          padding: 0,
          textAlign: 'center',
          color: colors.fg,
          fontSize: 18,
          fontFamily: font('Inter_600SemiBold'),
          ...({ outlineStyle: 'none' } as object),
        }}
      />
      <Text variant="bodyMedium" style={{ fontSize: 18, color: value ? colors.fg : colors.muted }}>
        {config.currency}
      </Text>
    </Pressable>
  );
}
