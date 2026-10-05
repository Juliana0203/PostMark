import { useEffect } from 'react';
import Animated, {
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { playStampThud } from '../../services/soundService';
import { VintagePostmarkVariant, type PostmarkStyle } from './VintagePostmarkVariants';

type PostmarkProps = Omit<Parameters<typeof VintagePostmarkVariant>[0], 'variant'>;

interface Props extends PostmarkProps {
  /** 0 = aún oculto; cada incremento reproduce de nuevo el estampado. */
  playKey: number;
  variant?: PostmarkStyle;
}

const SPRING = { damping: 10, mass: 0.8, stiffness: 200 };

export function AnimatedInkStamp({ playKey, variant = 'classic', ...postmark }: Props) {
  const scale = useSharedValue(1.6);
  const opacity = useSharedValue(0);
  const extraRotation = useSharedValue(10);
  const landed = useSharedValue(true);

  useEffect(() => {
    if (playKey === 0) return;
    scale.value = 1.6;
    opacity.value = 0;
    extraRotation.value = 10;
    landed.value = false;
    scale.value = withSpring(1, SPRING);
    opacity.value = withSpring(1, { damping: 20, stiffness: 300 });
    extraRotation.value = withSpring(0, SPRING);
  }, [playKey, scale, opacity, extraRotation, landed]);

  // Golpe háptico en el primer frame en que la escala alcanza 1.0.
  useAnimatedReaction(
    () => scale.value <= 1 && !landed.value,
    (touched) => {
      if (touched) {
        landed.value = true;
        scheduleOnRN(playStampThud);
      }
    },
  );

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }, { rotate: `${extraRotation.value}deg` }],
  }));

  return (
    <Animated.View pointerEvents="none" style={style}>
      <VintagePostmarkVariant variant={variant} {...postmark} />
    </Animated.View>
  );
}
