import { Stack } from 'expo-router';

export default function SharedLayout() {
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
      <Stack.Screen name="review/[id]" options={{ animation: 'slide_from_bottom', presentation: 'modal' }} />
    </Stack>
  );
}
