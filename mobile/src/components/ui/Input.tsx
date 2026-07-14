import React, { useState } from 'react';
import { Pressable, TextInput, View, type TextInputProps } from 'react-native';
import { Text } from './Text';
import { Icon, type IconName } from './Icon';
import { radius } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeProvider';

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
  ...rest
}: InputProps) {
  const { colors } = useTheme();
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
          alignItems: 'center',
          gap: 10,
          height: 54,
          paddingHorizontal: 14,
          borderRadius: radius.lg,
          borderWidth: 1.5,
          borderColor,
          backgroundColor: colors.surface,
        }}
      >
        {iconLeft && <Icon name={iconLeft} size={20} color={focused ? colors.tint : colors.muted} />}
        <TextInput
          style={[
            {
              flex: 1,
              color: colors.fg,
              fontSize: 15,
              fontFamily: 'Inter_400Regular',
              height: '100%',
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
          <Pressable onPress={() => setHidden((h) => !h)} hitSlop={8}>
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
