import { Image, StyleSheet, Text, View } from 'react-native';
import type { StampItem } from '../../types/stamp';

export type StampData = Omit<StampItem, 'id'> & { id?: string };
export const POSTCARD_ASPECT = 1.5;

export function PostcardFront({ stamp, width }: { stamp: StampData; width: number }) {
  const frame = width * 0.035;
  const { location } = stamp;
  const title = location.placeName ?? location.city;
  return (
    <View style={[styles.card, { width, height: width / POSTCARD_ASPECT, padding: frame }]}>
      <View style={styles.photoWrap}>
        <Image source={{ uri: stamp.imageUri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        <View style={[styles.caption, { left: frame, bottom: frame * 0.8 }]}>
          <Text style={[styles.city, { fontSize: width * 0.06 }]} numberOfLines={1}>{title}</Text>
          <Text style={[styles.country, { fontSize: width * 0.032 }]} numberOfLines={1}>{location.country}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF', borderRadius: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.18, shadowRadius: 8, elevation: 5,
  },
  photoWrap: { flex: 1, overflow: 'hidden', backgroundColor: '#E8E4DA' },
  caption: { position: 'absolute' },
  city: {
    color: '#FFFFFF', fontFamily: 'Georgia', fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.6)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4,
  },
  country: {
    color: '#FFFFFF', fontFamily: 'Georgia', letterSpacing: 2, textTransform: 'uppercase',
    textShadowColor: 'rgba(0,0,0,0.6)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4,
  },
});
