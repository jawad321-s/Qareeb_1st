import React from 'react';
import { View, Pressable } from 'react-native';
import { Text } from './Text';
import { useTheme } from '@/theme/ThemeProvider';

interface Props<K extends string> {
  options: { key: K; label: string }[];
  value: K;
  onChange: (key: K) => void;
}

/** Pill-style tab switcher (current / completed / … filters on list screens). */
export function Segmented<K extends string>({ options, value, onChange }: Props<K>) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: 'row', backgroundColor: colors.surface2, borderRadius: 14, padding: 4 }}>
      {options.map(({ key, label }) => {
        const active = value === key;
        return (
          <Pressable
            key={key}
            onPress={() => onChange(key)}
            style={{ flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: active ? colors.surface : 'transparent', alignItems: 'center', ...(active ? { shadowColor: '#0F172A', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2 } : {}) }}
          >
            <Text variant="caption" tone={active ? 'default' : 'muted'} numberOfLines={1} style={{ fontFamily: active ? 'Inter_600SemiBold' : 'Inter_400Regular' }}>
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
