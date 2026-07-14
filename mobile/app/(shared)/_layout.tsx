import { Stack } from 'expo-router';

export default function SharedLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="chat/[requestId]" options={{ animation: 'slide_from_bottom' }} />
    </Stack>
  );
}
