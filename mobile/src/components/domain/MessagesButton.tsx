import React from 'react';
import { Pressable, View, type ViewStyle } from 'react-native';
import { router } from 'expo-router';
import { Icon } from '../ui/Icon';
import { Text } from '../ui/Text';
import { useUnreadChats } from '@/hooks/queries';
import { useAuth } from '@/store/auth';
import { useTheme } from '@/theme/ThemeProvider';

/** Opens the artisan's message history, with the number of chats waiting for a reply. */
export function MessagesButton({ style, iconSize = 19 }: { style: ViewStyle; iconSize?: number }) {
  const { colors } = useTheme();
  const user = useAuth((s) => s.user);
  const unread = useUnreadChats(user).data ?? 0;
  return (
    <Pressable
      onPress={() => router.push('/(shared)/conversations')}
      accessibilityRole="button"
      accessibilityLabel={unread ? `messages, ${unread} unread` : 'messages'}
      style={[{ backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border }, style]}
    >
      <Icon name="message" size={iconSize} color={colors.fg} />
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
            backgroundColor: '#DC2626',
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
