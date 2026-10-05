import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { interpolate, useAnimatedStyle } from 'react-native-reanimated';
import { useDeviceTilt, type DeviceTilt } from '../../hooks/useDeviceTilt';

interface Props {
  width: number;
  height: number;
  children: ReactNode;
  /** Intensidad del reflejo (0–1). */
  intensity?: number;
  /** Radio para recortar el brillo al contorno del contenido. */
  borderRadius?: number;
  /** Reutiliza una inclinación ya calculada en lugar de abrir otra suscripción al sensor. */
  tilt?: DeviceTilt;
  active?: boolean;
  style?: StyleProp<ViewStyle>;
}

const MAX_X = 6;
const MAX_Y = 8;

/** Envoltorio que superpone un foil dorado/tornasol que se desplaza y rota con la inclinación. */
export function HolographicShine({
  width,
  height,
  children,
  intensity = 1,
  borderRadius = 3,
  tilt,
  active = true,
  style,
}: Props) {
  const own = useDeviceTilt(active && !tilt);
  const { tiltX, tiltY } = tilt ?? own;
  const strength = typeof intensity === 'number' ? intensity : intensity ? 1 : 0;
  const span = Math.max(width, height);

  const foil = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(tiltY.value, [-MAX_Y, MAX_Y], [span * 0.6, -span * 0.6]) },
      { translateY: interpolate(tiltX.value, [-MAX_X, MAX_X], [span * 0.4, -span * 0.4]) },
      { rotate: `${interpolate(tiltY.value, [-MAX_Y, MAX_Y], [-25, 25]) + 35}deg` },
    ],
  }));

  return (
    <View style={[{ width, height }, style]}>
      {children}
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.clip, { borderRadius, opacity: 0.55 * intensity + 0.25 }]}>
        <Animated.View style={[styles.foil, { width: span * 2.4, height: span * 2.4, left: (width - span * 2.4) / 2, top: (height - span * 2.4) / 2 }, foil]}>
          <LinearGradient
            colors={['transparent', 'rgba(255, 215, 0, 0.25)', 'rgba(255, 255, 255, 0.45)', 'rgba(120, 200, 255, 0.2)', 'transparent']}
            locations={[0.3, 0.42, 0.5, 0.58, 0.7]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  clip: { overflow: 'hidden' },
  foil: { position: 'absolute' },
});

