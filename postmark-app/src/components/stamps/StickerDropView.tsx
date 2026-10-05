import { useEffect, type ReactNode } from 'react';
import Animated, {
  interpolate,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { playStampThud } from '../../services/soundService';

interface Props {
  children: ReactNode;
  /** Al pasar a true (o al montar con true) reproduce la caída. */
  play: boolean;
  /** Distancia inicial sobre la celda. */
  height?: number;
  onLanded?: () => void;
}

const SPRING = { damping: 28, stiffness: 240, mass: 0.9 };
const FLOAT_SCALE = 1.15;

/** La estampilla flota agrandada con sombra y desciende a su celda; el impacto suena y vibra. */
export function StickerDropView({ children, play, height = 90, onLanded }: Props) {
  const progress = useSharedValue(play ? 0 : 1);
  const landed = useSharedValue(!play);

  useEffect(() => {
    if (!play) return;
    landed.value = false;
    progress.value = 0;
    progress.value = withSpring(1, SPRING);
  }, [play, progress, landed]);

  const impact = () => {
    playStampThud();
    onLanded?.();
  };

  // Con amortiguamiento alto no hay rebote: el contacto es cuando el progreso llega al final.
  useAnimatedReaction(
    () => progress.value >= 0.985 && !landed.value,
    (hit) => {
      if (hit) {
        landed.value = true;
        scheduleOnRN(impact);
      }
    },
  );

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(progress.value, [0, 1], [-height, 0]) },
      { scale: interpolate(progress.value, [0, 1], [FLOAT_SCALE, 1]) },
    ],
    shadowColor: '#000',
    shadowOpacity: interpolate(progress.value, [0, 1], [0.4, 0.1]),
    shadowRadius: interpolate(progress.value, [0, 1], [18, 3]),
    shadowOffset: { width: 0, height: interpolate(progress.value, [0, 1], [16, 2]) },
    zIndex: progress.value < 1 ? 10 : 0,
  }));

  return <Animated.View style={style}>{children}</Animated.View>;
}
