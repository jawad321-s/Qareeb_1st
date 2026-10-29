/**
 * Web build: expo-notifications has no web implementation (SDK 58 throws on
 * the native-only calls), so push handling is a no-op in the browser.
 */
export function usePushNotifications(_uid: string | undefined, _ready: boolean) {}
