import { Linking, Platform } from 'react-native';

/**
 * Opens driving directions to a place in the phone's maps app: Apple Maps on
 * iPhone, Google Maps (navigation) on Android, Google Maps in a browser. If
 * the app link can't open, the Google Maps web link does (it opens the Google
 * Maps app when installed).
 */
export async function openDirections({ latitude, longitude }: { latitude: number; longitude: number }): Promise<void> {
  const web = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=driving`;
  const app = Platform.select({
    ios: `http://maps.apple.com/?daddr=${latitude},${longitude}&dirflg=d`,
    android: `google.navigation:q=${latitude},${longitude}&mode=d`,
    default: web,
  });
  try {
    await Linking.openURL(app);
  } catch {
    await Linking.openURL(web).catch(() => {});
  }
}
