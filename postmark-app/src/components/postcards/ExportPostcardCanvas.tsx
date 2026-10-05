import { forwardRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { PostcardBack } from './PostcardBack';
import type { StampData } from './PostcardFront';
import { StampCard } from '../stamps/StampCard';

export const EXPORT_WIDTH = 700;
export const EXPORT_HEIGHT = 340;
const PAD = 20;
const STAMP_W = 190;
const BACK_W = EXPORT_WIDTH - PAD * 2 - STAMP_W - 24;

interface Props {
  stamp: StampData;
}

/** Lienzo apaisado frente + dorso, pensado para capturarse con view-shot. */
export const ExportPostcardCanvas = forwardRef<View, Props>(function ExportPostcardCanvas({ stamp }, ref) {
  const { location } = stamp;
  return (
    <View ref={ref} collapsable={false} style={styles.canvas}>
      <View style={styles.left}>
        <StampCard imageUri={stamp.imageUri} country={location.country} width={STAMP_W} seed={stamp.id ?? stamp.timestamp} />
        <Text style={styles.city} numberOfLines={1}>{location.placeName ?? location.city}</Text>
        <Text style={styles.brand}>POSTMARK</Text>
      </View>
      <PostcardBack stamp={stamp} width={BACK_W} editable={false} />
    </View>
  );
});

const styles = StyleSheet.create({
  canvas: {
    width: EXPORT_WIDTH, height: EXPORT_HEIGHT, padding: PAD, backgroundColor: '#FAF7EE',
    flexDirection: 'row', alignItems: 'center', gap: 24,
    borderWidth: 1, borderColor: '#D9D1BF',
  },
  left: { width: STAMP_W, alignItems: 'center' },
  city: { marginTop: 10, fontFamily: 'Georgia', fontSize: 15, fontWeight: '600', color: '#2B2724', maxWidth: STAMP_W },
  brand: { marginTop: 2, fontSize: 9, letterSpacing: 3, color: '#8A8174' },
});
