import React, { useState } from 'react';
import { Pressable, TextInput, View, type TextInputProps } from 'react-native';
import { Text } from './Text';
import { Icon, type IconName } from './Icon';
import { radius } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeProvider';
import { useFont, useT } from '@/i18n';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  iconLeft?: IconName;
  secure?: boolean;
}

export function Input({
  label,
  error,
  iconLeft,
  secure,
  style,
  onFocus,
  onBlur,
  multiline,
  ...rest
}: InputProps) {
  const { colors } = useTheme();
  const font = useFont();
  const { isRTL } = useT();
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(!!secure);

  const borderColor = error ? '#EF4444' : focused ? colors.tint : colors.border;

  return (
    <View style={{ gap: 6 }}>
      {label && (
        <Text variant="caption" tone="muted" style={{ marginLeft: 4 }}>
          {label}
        </Text>
      )}
      <View
        style={{
          flexDirection: 'row',
          alignItems: multiline ? 'flex-start' : 'center',
          gap: 10,
          height: multiline ? undefined : 54,
          minHeight: multiline ? 96 : undefined,
          paddingHorizontal: 14,
          paddingVertical: multiline ? 12 : 0,
          borderRadius: radius.lg,
          borderWidth: 1.5,
          borderColor,
          backgroundColor: colors.surface,
        }}
      >
        {iconLeft && <Icon name={iconLeft} size={20} color={focused ? colors.tint : colors.muted} />}
        <TextInput
          multiline={multiline}
          textAlignVertical={multiline ? 'top' : 'center'}
          style={[
            {
              flex: 1,
              color: colors.fg,
              fontSize: 15,
              fontFamily: font('Inter_400Regular'),
              height: multiline ? undefined : '100%',
              textAlign: isRTL ? 'right' : 'left',
              ...({ outlineStyle: 'none' } as any),
            },
            style,
          ]}
          placeholderTextColor={colors.muted}
          secureTextEntry={hidden}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          {...rest}
        />
        {secure && (
          <Pressable onPress={() => setHidden((h) => !h)} hitSlop={12}>
            <Icon name={hidden ? 'eye' : 'eye-off'} size={20} color={colors.muted} />
          </Pressable>
        )}
      </View>
      {error && (
        <Text variant="caption" tone="danger" style={{ marginLeft: 4 }}>
          {error}
        </Text>
      )}
    </View>
  );
}
