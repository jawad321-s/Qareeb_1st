import React from 'react';
import { View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Text } from '../ui/Text';
import { Icon, type IconName } from '../ui/Icon';
import { Button } from '../ui/Button';
import { gradients } from '@/theme/tokens';

interface EmptyStateProps {
  icon?: IconName;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon = 'search',
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 }}>
      <LinearGradient
        colors={gradients.brandSoft}
        style={{
          width: 88,
          height: 88,
          borderRadius: 28,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 4,
        }}
      >
        <Icon name={icon} size={38} color="#FFFFFF" />
      </LinearGradient>
      <Text variant="h3" center>
        {title}
      </Text>
      {description && (
        <Text variant="body" tone="muted" center style={{ maxWidth: 280 }}>
          {description}
        </Text>
      )}
      {actionLabel && onAction && (
        <View style={{ marginTop: 8, width: 220 }}>
          <Button label={actionLabel} onPress={onAction} />
        </View>
      )}
    </View>
  );
}
