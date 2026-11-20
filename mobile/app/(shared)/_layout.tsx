import { Redirect, Stack } from 'expo-router';
import { useAuth } from '@/store/auth';

export default function SharedLayout() {
  // Every screen here is for a signed-in account. After signing out from one
  // of them (deleting the account), the screens below it in this stack (edit
  // profile…) would re-render with no user and crash: this ancestor re-renders
  // first and leaves for the welcome screen instead. Before the saved session
  // is read (a notification opening a chat at launch) it just waits.
  const signedIn = useAuth((s) => !!s.user);
  const hydrated = useAuth((s) => s.hydrated);
  if (!signedIn) return hydrated ? <Redirect href="/(auth)/welcome" /> : null;
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        animationDuration: 280,
        gestureEnabled: true,
        gestureDirection: 'horizontal',
      }}
    >
      {/* Chat & permission slide up like a sheet for a native, focused feel. */}
      <Stack.Screen name="chat/[requestId]" options={{ animation: 'slide_from_bottom', animationDuration: 320 }} />
      <Stack.Screen name="location-permission" options={{ animation: 'slide_from_bottom', presentation: 'modal' }} />
      <Stack.Screen name="add-service" options={{ animation: 'slide_from_bottom' }} />
      {/* No swipe-back on checkout: a swipe mid-payment would abandon it. */}
      <Stack.Screen name="checkout" options={{ animation: 'slide_from_bottom', gestureEnabled: false }} />
      {/* Rating a finished job is mandatory — no swipe-to-dismiss. */}
      <Stack.Screen name="review/[id]" options={{ animation: 'slide_from_bottom', presentation: 'modal', gestureEnabled: false }} />
    </Stack>
  );
}
