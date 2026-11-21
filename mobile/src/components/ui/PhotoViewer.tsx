import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, Modal, Pressable, ScrollView, StatusBar, View, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from './Icon';
import { Text } from './Text';
import { useT } from '@/i18n';

/**
 * Photos full screen: swipe between them, pinch (or double-tap) to zoom in
 * and drag around a zoomed photo. Used for a request's photos, an artisan's
 * gallery and photos sent in a chat.
 *
 *   const viewer = usePhotoViewer();
 *   <Pressable onPress={() => viewer.open(photos, i)}>…</Pressable>
 *   {viewer.element}
 */
export function usePhotoViewer() {
  const [shown, setShown] = useState<{ photos: string[]; index: number } | null>(null);
  const open = useCallback((photos: string[], index = 0) => {
    if (photos.length) setShown({ photos, index: Math.min(Math.max(index, 0), photos.length - 1) });
  }, []);
  const close = useCallback(() => setShown(null), []);
  const element = <PhotoViewer photos={shown?.photos ?? []} index={shown?.index ?? null} onClose={close} />;
  return { open, close, element };
}

/**
 * A row of photo thumbnails; tapping one opens them all full screen, at that
 * photo, to swipe through and zoom into.
 */
export function PhotoStrip({ photos, width = 110, height = width, radius = 14 }: { photos: string[]; width?: number; height?: number; radius?: number }) {
  const viewer = usePhotoViewer();
  const { t } = useT();
  if (!photos.length) return null;
  return (
    <>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        {photos.map((uri, i) => (
          <Pressable key={uri} onPress={() => viewer.open(photos, i)} accessibilityRole="imagebutton" accessibilityLabel={t('a11y.openPhoto')}>
            <Image source={{ uri }} style={{ width, height, borderRadius: radius }} contentFit="cover" />
          </Pressable>
        ))}
      </ScrollView>
      {viewer.element}
    </>
  );
}

const MAX_ZOOM = 5;
const DOUBLE_TAP_ZOOM = 2.5;

export function PhotoViewer({ photos, index, onClose }: { photos: string[]; index: number | null; onClose: () => void }) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { t } = useT();
  const [current, setCurrent] = useState(index ?? 0);
  const [zoomed, setZoomed] = useState(false);
  const list = useRef<FlatList<string>>(null);

  useEffect(() => {
    if (index !== null) {
      setCurrent(index);
      setZoomed(false);
    }
  }, [index]);

  return (
    <Modal visible={index !== null} animationType="fade" onRequestClose={onClose} statusBarTranslucent supportedOrientations={['portrait', 'landscape']}>
      <StatusBar barStyle="light-content" />
      {/* Its own gesture root (Android draws a modal outside the app's), and
          left-to-right so the pager pages the same way on every phone. */}
      <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#000', direction: 'ltr' }}>
        {index !== null && (
          <FlatList
            ref={list}
            data={photos}
            keyExtractor={(uri, i) => `${i}:${uri}`}
            horizontal
            pagingEnabled
            // A zoomed photo is dragged around instead of paging.
            scrollEnabled={!zoomed && photos.length > 1}
            showsHorizontalScrollIndicator={false}
            initialScrollIndex={index}
            getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
            onMomentumScrollEnd={(e) => setCurrent(Math.round(e.nativeEvent.contentOffset.x / width))}
            renderItem={({ item, index: i }) => (
              <ZoomablePhoto uri={item} width={width} height={height} active={i === current} onZoomed={setZoomed} />
            )}
          />
        )}
        <View
          pointerEvents="box-none"
          style={{ position: 'absolute', top: insets.top + 8, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 }}
        >
          <Pressable
            onPress={onClose}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel={t('common.close')}
            style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center' }}
          >
            <Icon name="x" size={22} color="#FFFFFF" />
          </Pressable>
          {photos.length > 1 && (
            <Text variant="bodyMedium" style={{ color: '#FFFFFF', writingDirection: 'ltr' }}>
              {`${current + 1} / ${photos.length}`}
            </Text>
          )}
          <View style={{ width: 42 }} />
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}

function ZoomablePhoto({ uri, width, height, active, onZoomed }: { uri: string; width: number; height: number; active: boolean; onZoomed: (z: boolean) => void }) {
  const [zoomed, setZoomed] = useState(false);
  const scale = useSharedValue(1);
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  // Where the gesture started from.
  const startScale = useSharedValue(1);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);
  const focalX = useSharedValue(0);
  const focalY = useSharedValue(0);
  // The photo's size on screen at 1×, once loaded (it is fitted, not cropped).
  const shownW = useSharedValue(width);
  const shownH = useSharedValue(height);

  const report = useCallback(
    (z: boolean) => {
      setZoomed(z);
      onZoomed(z);
    },
    [onZoomed],
  );

  // Paging away resets the photo left behind.
  useEffect(() => {
    if (!active && zoomed) {
      scale.value = 1;
      tx.value = 0;
      ty.value = 0;
      setZoomed(false);
    }
  }, [active, zoomed, scale, tx, ty]);

  const gesture = useMemo(() => {
    /** Keeps the zoomed photo covering the screen where it can (no dragging it off). */
    const settle = () => {
      'worklet';
      if (scale.value <= 1.01) {
        scale.value = withTiming(1);
        tx.value = withTiming(0);
        ty.value = withTiming(0);
        startScale.value = 1;
        startX.value = 0;
        startY.value = 0;
        scheduleOnRN(report, false);
        return;
      }
      const s = Math.min(scale.value, MAX_ZOOM);
      const bx = Math.max(0, (shownW.value * s - width) / 2);
      const by = Math.max(0, (shownH.value * s - height) / 2);
      const x = Math.min(Math.max(tx.value, -bx), bx);
      const y = Math.min(Math.max(ty.value, -by), by);
      scale.value = withTiming(s);
      tx.value = withTiming(x);
      ty.value = withTiming(y);
      startScale.value = s;
      startX.value = x;
      startY.value = y;
      scheduleOnRN(report, true);
    };

    const pinch = Gesture.Pinch()
      .onStart((e) => {
        startScale.value = scale.value;
        startX.value = tx.value;
        startY.value = ty.value;
        focalX.value = e.focalX - width / 2;
        focalY.value = e.focalY - height / 2;
      })
      .onUpdate((e) => {
        const s = Math.min(Math.max(startScale.value * e.scale, 0.8), MAX_ZOOM * 1.2);
        const k = s / startScale.value;
        // The point under the fingers stays under them.
        scale.value = s;
        tx.value = focalX.value - (focalX.value - startX.value) * k;
        ty.value = focalY.value - (focalY.value - startY.value) * k;
      })
      .onEnd(() => settle());

    // Dragging moves a zoomed photo; at 1× the finger pages to the next one
    // instead (the pan steps aside at once).
    const pan = Gesture.Pan()
      .manualActivation(true)
      .maxPointers(1)
      .onTouchesMove((_e, state) => {
        if (scale.value > 1.01) state.activate();
        else state.fail();
      })
      .onStart(() => {
        startX.value = tx.value;
        startY.value = ty.value;
      })
      .onUpdate((e) => {
        tx.value = startX.value + e.translationX;
        ty.value = startY.value + e.translationY;
      })
      .onEnd(() => settle());

    const doubleTap = Gesture.Tap()
      .numberOfTaps(2)
      .onEnd((e) => {
        if (scale.value > 1.01) {
          scale.value = 1;
          settle();
          return;
        }
        // Zoom in on the tapped point.
        scale.value = DOUBLE_TAP_ZOOM;
        tx.value = -(e.x - width / 2) * (DOUBLE_TAP_ZOOM - 1);
        ty.value = -(e.y - height / 2) * (DOUBLE_TAP_ZOOM - 1);
        settle();
      });

    return Gesture.Simultaneous(pinch, pan, doubleTap);
  }, [width, height, report, scale, tx, ty, startScale, startX, startY, focalX, focalY, shownW, shownH]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.value }, { translateY: ty.value }, { scale: scale.value }],
  }));

  return (
    <GestureDetector gesture={gesture}>
      <View style={{ width, height, overflow: 'hidden' }} collapsable={false}>
        {/* The photo itself takes no touches: the gestures above get them all
            (in a browser, dragging the bare image would start a file drag). */}
        <Animated.View pointerEvents="none" style={[{ width, height }, style]}>
          <Image
            source={{ uri }}
            style={{ width, height }}
            contentFit="contain"
            transition={150}
            onLoad={(e) => {
              const { width: w, height: h } = e.source;
              if (!w || !h) return;
              const fit = Math.min(width / w, height / h);
              shownW.value = w * fit;
              shownH.value = h * fit;
            }}
          />
        </Animated.View>
      </View>
    </GestureDetector>
  );
}
