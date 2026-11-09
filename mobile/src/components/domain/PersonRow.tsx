import React from 'react';
import { Pressable, View } from 'react-native';
import { Avatar } from '@/components/ui/Avatar';
import { Icon } from '@/components/ui/Icon';
import { Rating } from '@/components/ui/Rating';
import { Text } from '@/components/ui/Text';
import { useTheme } from '@/theme/ThemeProvider';

interface Props {
  name?: string;
  photoUrl?: string;
  rating?: number;
  ratingCount?: number;
  verified?: boolean;
  size?: number;
  /** Opens the person's profile; the whole row is the tap target. */
  onPress?: () => void;
}

/** A person's photo, name and rating. With `onPress`, a chevron marks it as a link. */
export function PersonRow({ name, photoUrl, rating, ratingCount, verified, size = 48, onPress }: Props) {
  const { colors } = useTheme();
  return (
    <Pressable onPress={onPress} disabled={!onPress} hitSlop={6} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <Avatar uri={photoUrl} name={name} size={size} verified={verified} />
      <View style={{ flex: 1, gap: 2 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Text variant="bodyMedium" numberOfLines={1} style={{ flexShrink: 1 }}>
            {name ?? '…'}
          </Text>
          {onPress && <Icon name="chevron-right" size={16} color={colors.muted} />}
        </View>
        <Rating value={rating ?? 0} count={ratingCount} size={12} showValue />
      </View>
    </Pressable>
  );
}
