import React from 'react';
import { View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/theme/ThemeProvider';
import { Text } from './Text';
import { Icon } from './Icon';
import { initials } from '@/lib/format';

interface AvatarProps {
  uri?: string;
  name?: string;
  size?: number;
  verified?: boolean;
}

export function Avatar({ uri, name, size = 48, verified }: AvatarProps) {
  const { gradient } = useTheme();
  return (
    <View style={{ width: size, height: size }}>
      {uri ? (
        <Image
          source={{ uri }}
          style={{ width: size, height: size, borderRadius: size / 2 }}
          contentFit="cover"
          transition={200}
        />
      ) : (
        <LinearGradient
          colors={[gradient[0], gradient[1]]}
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* The line has to be as tall as the bigger letter: with the body text's
              line height, iOS cut the top off (a "J" showed as just its hook). */}
          <Text
            variant="bodyMedium"
            tone="inverse"
            center
            numberOfLines={1}
            style={{
              fontSize: Math.round(size * 0.36),
              lineHeight: Math.round(size * 0.36 * 1.5),
              fontFamily: 'Inter_600SemiBold',
              letterSpacing: 0,
              includeFontPadding: false,
            }}
          >
            {name ? initials(name) : '?'}
          </Text>
        </LinearGradient>
      )}
      {verified && (
        <View
          style={{
            position: 'absolute',
            right: -2,
            bottom: -2,
            backgroundColor: '#3B82F6',
            borderRadius: 999,
            padding: 2,
            borderWidth: 2,
            borderColor: '#FFFFFF',
          }}
        >
          <Icon name="check" size={size * 0.22} color="#FFFFFF" strokeWidth={3} />
        </View>
      )}
    </View>
  );
}
