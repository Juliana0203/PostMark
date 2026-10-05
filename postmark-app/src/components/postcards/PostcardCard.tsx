import { useRef, useState } from 'react';
import { Animated, Pressable } from 'react-native';
import { PostcardBack } from './PostcardBack';
import { PostcardFront, POSTCARD_ASPECT, type StampData } from './PostcardFront';

interface Props {
  stamp: StampData;
  width: number;
}

export function PostcardCard({ stamp, width }: Props) {
  const flip = useRef(new Animated.Value(0)).current;
  const [flipped, setFlipped] = useState(false);
  const height = width / POSTCARD_ASPECT;

  const toggle = () => {
    const next = !flipped;
    setFlipped(next);
    Animated.spring(flip, { toValue: next ? 1 : 0, useNativeDriver: true, friction: 8, tension: 40 }).start();
  };

  const face = (outputRange: string[]) => ({
    position: 'absolute' as const,
    backfaceVisibility: 'hidden' as const,
    transform: [{ perspective: 1000 }, { rotateY: flip.interpolate({ inputRange: [0, 1], outputRange }) }],
  });

  return (
    <Pressable onPress={toggle} accessibilityRole="button" accessibilityLabel="Voltear postal" style={{ width, height }}>
      <Animated.View style={face(['0deg', '180deg'])}>
        <PostcardFront stamp={stamp} width={width} />
      </Animated.View>
      <Animated.View style={face(['180deg', '360deg'])}>
        <PostcardBack stamp={stamp} width={width} />
      </Animated.View>
    </Pressable>
  );
}
