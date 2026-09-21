import { Alert, Platform } from 'react-native';

interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  destructive?: boolean;
}

/**
 * Cross-platform confirmation prompt.
 *
 * `Alert.alert` is a no-op on react-native-web, so the web build would silently
 * skip the confirmation. Fall back to the browser dialog there and keep the
 * native alert on iOS/Android.
 */
export function confirmAction({
  title,
  message,
  confirmLabel,
  cancelLabel,
  destructive,
}: ConfirmOptions): Promise<boolean> {
  if (Platform.OS === 'web') {
    const ok = typeof window !== 'undefined' && window.confirm(`${title}\n\n${message}`);
    return Promise.resolve(!!ok);
  }
  return new Promise((resolve) => {
    Alert.alert(title, message, [
      { text: cancelLabel, style: 'cancel', onPress: () => resolve(false) },
      {
        text: confirmLabel,
        style: destructive ? 'destructive' : 'default',
        onPress: () => resolve(true),
      },
    ]);
  });
}
