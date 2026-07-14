import React from 'react';
import { View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Text } from './Text';
import { Icon } from './Icon';
import { initials } from '@/lib/format';
import { gradients } from '@/theme/tokens';

interface AvatarProps {
  uri?: string;
  name?: string;
  size?: number;
  verified?: boolean;
}

export function Avatar({ uri, name, size = 48, verified }: AvatarProps) {
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
          colors={gradients.brandSoft}
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text variant="bodyMedium" tone="inverse" style={{ fontSize: size * 0.36 }}>
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
