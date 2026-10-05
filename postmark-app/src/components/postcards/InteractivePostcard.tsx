import { forwardRef, useCallback, useImperativeHandle, useState } from 'react';
import { View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { playPaperRustle } from '../../services/soundService';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  cancelAnimation,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { useDeviceTilt } from '../../hooks/useDeviceTilt';
import { PostcardBack } from './PostcardBack';
import { PostcardFront, POSTCARD_ASPECT, type StampData } from './PostcardFront';
import { PostcardSheenOverlay } from './PostcardSheenOverlay';

export interface InteractivePostcardHandle {
  flip: () => void;
}

interface Props {
  stamp: StampData;
  width: number;
  /** Activa el giroscopio (pásalo en false cuando la postal no sea visible). */
  active?: boolean;
  tapToFlip?: boolean;
  onNoteCommit?: (note: string) => void;
}

const SPRING = { damping: 14, stiffness: 90 };
const medium = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined);

export const InteractivePostcard = forwardRef<InteractivePostcardHandle, Props>(function InteractivePostcard(
  { stamp, width, active = true, tapToFlip = true, onNoteCommit },
  ref,
) {
  const height = width / POSTCARD_ASPECT;
  const { tiltX, tiltY, glarePosition } = useDeviceTilt(active);
  const flipRotation = useSharedValue(0);
  const startRotation = useSharedValue(0);
  const restTarget = useSharedValue(0);
  const [backVisible, setBackVisible] = useState(false);
  const [inkKey, setInkKey] = useState(0);

  const onSettled = useCallback(() => {
    medium();
  }, []);

  const onCross = useCallback((isBack: boolean) => {
    playPaperRustle();
    setBackVisible(isBack);
    if (isBack) setInkKey((k) => k + 1);
  }, []);

  const animateTo = (target: number, velocity = 0) => {
    'worklet';
    restTarget.value = target;
    flipRotation.value = withSpring(target, { ...SPRING, velocity }, (finished) => {
      if (finished) scheduleOnRN(onSettled);
    });
  };

  // Cada vez que se cruza un múltiplo de 90° impar (el "ecuador") cambia la cara visible.
  useAnimatedReaction(
    () => Math.floor((flipRotation.value + 90) / 180),
    (bucket, previous) => {
      if (previous === null || bucket === previous) return;
      scheduleOnRN(onCross, Math.abs(bucket % 2) === 1);
    },
  );

  useImperativeHandle(ref, () => ({
    flip: () => {
      cancelAnimation(flipRotation);
      animateTo(restTarget.value + 180);
    },
  }));

  const pan = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .failOffsetY([-24, 24])
    .onStart(() => {
      cancelAnimation(flipRotation);
      startRotation.value = restTarget.value;
    })
    .onUpdate((e) => {
      // Resistencia: el giro sigue al dedo al 90 % y nunca pasa de media vuelta por gesto.
      const delta = Math.max(-180, Math.min(180, (-e.translationX / width) * 180 * 0.9));
      flipRotation.value = startRotation.value + delta;
    })
    .onEnd((e) => {
      const far = Math.abs(e.translationX) > width * 0.3;
      const fast = Math.abs(e.velocityX) > 800;
      let dir = 0;
      if (far) dir = e.translationX < 0 ? 1 : -1;
      else if (fast) dir = e.velocityX < 0 ? 1 : -1;
      animateTo(startRotation.value + dir * 180, (-e.velocityX / width) * 180);
    });

  const tap = Gesture.Tap()
    .enabled(tapToFlip)
    .maxDuration(250)
    .onEnd((_e, success) => {
      if (!success) return;
      cancelAnimation(flipRotation);
      animateTo(restTarget.value + 180);
    });

  const frontStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 1200 },
      { rotateX: `${tiltX.value}deg` },
      { rotateY: `${flipRotation.value + tiltY.value}deg` },
    ],
    backfaceVisibility: 'hidden',
  }));

  const backStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 1200 },
      { rotateX: `${-tiltX.value}deg` },
      { rotateY: `${flipRotation.value + 180 + tiltY.value}deg` },
    ],
    backfaceVisibility: 'hidden',
    position: 'absolute',
    top: 0,
    left: 0,
  }));

  return (
    <GestureDetector gesture={Gesture.Race(pan, tap)}>
      <View style={{ width, height }}>
        <Animated.View style={frontStyle} pointerEvents={backVisible ? 'none' : 'auto'}>
          <PostcardFront stamp={stamp} width={width} />
          <PostcardSheenOverlay width={width} glarePosition={glarePosition} />
        </Animated.View>
        <Animated.View style={backStyle} pointerEvents={backVisible ? 'auto' : 'none'}>
          <PostcardBack stamp={stamp} width={width} inkPlayKey={inkKey} onNoteCommit={onNoteCommit} />
          <PostcardSheenOverlay width={width} glarePosition={glarePosition} />
        </Animated.View>
      </View>
    </GestureDetector>
  );
});
