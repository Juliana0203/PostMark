import { useRef } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';

interface Props {
  onPress: () => void;
  disabled?: boolean;
}

export function CaptureButton({ onPress, disabled }: Props) {
  const scale = useRef(new Animated.Value(1)).current;
  const animate = (to: number) =>
    Animated.spring(scale, { toValue: to, useNativeDriver: true, speed: 40, bounciness: 6 }).start();

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => animate(0.88)}
      onPressOut={() => animate(1)}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel="Capturar foto"
    >
      <Animated.View style={[styles.outer, { transform: [{ scale }], opacity: disabled ? 0.5 : 1 }]}>
        <View style={styles.inner} />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  outer: {
    width: 82, height: 82, borderRadius: 41, borderWidth: 3, borderColor: '#FDFBF7',
    alignItems: 'center', justifyContent: 'center',
  },
  inner: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#FDFBF7' },
});
