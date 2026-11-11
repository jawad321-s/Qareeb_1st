import React from 'react';
import { Pressable, View, type ViewStyle } from 'react-native';
import { router } from 'expo-router';
import { Icon } from '../ui/Icon';
import { Text } from '../ui/Text';
import { useNotificationFeed } from '@/hooks/useNotificationFeed';
import { useTheme } from '@/theme/ThemeProvider';

/** The bell that opens the notifications, with the number still unread. */
export function NotificationBell({ style, iconSize = 19 }: { style: ViewStyle; iconSize?: number }) {
  const { colors } = useTheme();
  const { unread } = useNotificationFeed();
  return (
    <Pressable
      onPress={() => router.push('/(shared)/notifications')}
      accessibilityRole="button"
      accessibilityLabel={unread ? `notifications, ${unread} unread` : 'notifications'}
      style={[{ backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border }, style]}
    >
      <Icon name="bell" size={iconSize} color={colors.fg} />
      {unread > 0 && (
        <View
          style={{
            position: 'absolute',
            top: -5,
            right: -5,
            minWidth: 20,
            height: 20,
            paddingHorizontal: 5,
            borderRadius: 10,
            backgroundColor: '#EF4444',
            borderWidth: 2,
            borderColor: colors.bg,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text variant="overline" style={{ color: '#FFFFFF', fontSize: 10, lineHeight: 13 }}>
            {unread > 9 ? '9+' : String(unread)}
          </Text>
        </View>
      )}
    </Pressable>
  );
}
