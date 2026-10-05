import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet } from 'react-native';
import Animated, { interpolate, useAnimatedStyle, type SharedValue } from 'react-native-reanimated';

interface Props {
  width: number;
  glarePosition: SharedValue<number>;
  borderRadius?: number;
}

/** Banda de luz tenue que cruza la superficie en sentido opuesto a la inclinación. */
export function PostcardSheenOverlay({ width, glarePosition, borderRadius = 4 }: Props) {
  const band = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(glarePosition.value, [0, 100], [-1.7 * width, -0.3 * width]) }],
  }));

  return (
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.clip, { borderRadius }]}>
      <Animated.View style={[styles.band, { width: width * 3 }, band]}>
        <LinearGradient
          colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.18)', 'rgba(255,255,255,0)']}
          locations={[0.42, 0.5, 0.58]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0.25 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  clip: { overflow: 'hidden' },
  band: { position: 'absolute', top: 0, bottom: 0, left: 0 },
});
