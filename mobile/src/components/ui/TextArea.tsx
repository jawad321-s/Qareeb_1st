import React from 'react';
import { Platform, StyleSheet, TextInput, View, type StyleProp, type TextInputProps, type TextStyle, type ViewStyle } from 'react-native';
import { Text } from './Text';

type Props = TextInputProps & {
  /** Where the field sits (flex, margins); `style` is the field's own look. */
  containerStyle?: StyleProp<ViewStyle>;
};

/**
 * A multi-line text field whose placeholder starts on the reading side.
 *
 * On phones a multi-line field drew its placeholder on the left even in Arabic
 * ("رسالة..." in the chat, the review comment), while what is typed starts on
 * the right. So on phones the placeholder is drawn here, over the empty field,
 * where the text starts, in the field's own font and size, like any other
 * label of the app. (In a browser the field places it correctly itself.)
 */
export function TextArea({ containerStyle, style, placeholder, placeholderTextColor, value, ...rest }: Props) {
  if (Platform.OS === 'web') {
    return (
      <View style={containerStyle}>
        <TextInput multiline {...rest} value={value} placeholder={placeholder} placeholderTextColor={placeholderTextColor} style={style} />
      </View>
    );
  }
  const s = (StyleSheet.flatten(style) ?? {}) as TextStyle;
  const num = (...xs: unknown[]) => Number(xs.find((x) => typeof x === 'number') ?? 0);
  const top = num(s.paddingTop, s.paddingVertical, s.padding) + num(s.borderTopWidth, s.borderWidth);
  const side = num(s.paddingHorizontal, s.padding) + num(s.borderWidth);
  return (
    <View style={containerStyle}>
      <TextInput multiline accessibilityLabel={placeholder} {...rest} value={value} style={style} />
      {!value && !!placeholder && (
        <View pointerEvents="none" style={{ position: 'absolute', top, start: side, end: side }}>
          <Text numberOfLines={3} style={{ color: placeholderTextColor, fontSize: s.fontSize, fontFamily: s.fontFamily }}>
            {placeholder}
          </Text>
        </View>
      )}
    </View>
  );
}
