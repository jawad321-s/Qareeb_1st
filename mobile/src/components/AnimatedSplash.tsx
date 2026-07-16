import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Image } from 'expo-image';
import { Text } from './ui/Text';
import { FloatingBlobs } from './ui/FloatingBlobs';

const { width, height } = Dimensions.get('window');

/**
 * Branded animated splash shown while the app boots. The logo springs in, a
 * halo pulses, the wordmark rises, then the whole overlay fades out.
 */
export function AnimatedSplash({ onFinish }: { onFinish: () => void }) {
  const logoScale = useSharedValue(0.4);
  const logoOpacity = useSharedValue(0);
  const haloScale = useSharedValue(0.6);
  const haloOpacity = useSharedValue(0);
  const wordY = useSharedValue(20);
  const wordOpacity = useSharedValue(0);
  const overlay = useSharedValue(1);

  useEffect(() => {
    // Logo springs in
    logoOpacity.value = withTiming(1, { duration: 350 });
    logoScale.value = withSpring(1, { damping: 11, stiffness: 140 });
    // Halo pulse
    haloOpacity.value = withDelay(200, withTiming(1, { duration: 400 }));
    haloScale.value = withDelay(
      200,
      withSequence(
        withTiming(1.15, { duration: 700, easing: Easing.out(Easing.ease) }),
        withTiming(1.0, { duration: 500 }),
      ),
    );
    // Wordmark rises
    wordOpacity.value = withDelay(450, withTiming(1, { duration: 500 }));
    wordY.value = withDelay(450, withSpring(0, { damping: 14 }));
    // Fade the whole splash away, then unmount
    overlay.value = withDelay(
      1900,
      withTiming(0, { duration: 500, easing: Easing.in(Easing.ease) }, (finished) => {
        if (finished) runOnJS(onFinish)();
      }),
    );
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));
  const haloStyle = useAnimatedStyle(() => ({
    opacity: haloOpacity.value * 0.5,
    transform: [{ scale: haloScale.value }],
  }));
  const wordStyle = useAnimatedStyle(() => ({
    opacity: wordOpacity.value,
    transform: [{ translateY: wordY.value }],
  }));
  const overlayStyle = useAnimatedStyle(() => ({ opacity: overlay.value }));

  return (
    <Animated.View style={[StyleSheet.absoluteFill, { zIndex: 100 }, overlayStyle]}>
      <LinearGradient colors={['#1E3A8A', '#2563EB', '#0EA5E9']} style={StyleSheet.absoluteFill}>
        <FloatingBlobs
          blobs={[
            { size: 280, colors: ['#60A5FA', '#2563EB'], top: height * 0.1, right: -60, range: 30 },
            { size: 220, colors: ['#38BDF8', '#0EA5E9'], bottom: height * 0.12, left: -60, delay: 1200, range: 24 },
          ]}
        />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 22 }}>
          <View style={{ width: 140, height: 140, alignItems: 'center', justifyContent: 'center' }}>
            {/* Pulsing halo */}
            <Animated.View
              style={[
                { position: 'absolute', width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(255,255,255,0.25)' },
                haloStyle,
              ]}
            />
            {/* Logo tile */}
            <Animated.View
              style={[
                {
                  width: 104,
                  height: 104,
                  borderRadius: 30,
                  backgroundColor: 'rgba(255,255,255,0.18)',
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.35)',
                  alignItems: 'center',
                  justifyContent: 'center',
                },
                logoStyle,
              ]}
            >
              <Image source={require('../../assets/brand/mark-white.png')} style={{ width: 62, height: 66 }} contentFit="contain" />
            </Animated.View>
          </View>
          <Animated.View style={wordStyle}>
            <Text variant="display" tone="inverse" center style={{ letterSpacing: 1 }}>
              Qareeb
            </Text>
            <Text variant="caption" center style={{ color: 'rgba(255,255,255,0.8)', marginTop: 2 }}>
              قريب
            </Text>
          </Animated.View>
        </View>
      </LinearGradient>
    </Animated.View>
  );
}
