import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Props {
  city: string | null;
  country: string | null;
  stampCount: number;
}

export function CameraHeader({ city, country, stampCount }: Props) {
  const { top } = useSafeAreaInsets();
  const label = city ? [city, country].filter(Boolean).join(' · ') : 'Localizando…';
  return (
    <View style={[styles.bar, { paddingTop: top + 8 }]}>
      <View style={styles.location}>
        <Ionicons name="compass-outline" size={18} color="#FDFBF7" />
        <Text style={styles.locationText} numberOfLines={1}>{label}</Text>
      </View>
      <View style={styles.counter}>
        <Ionicons name="mail-outline" size={16} color="#1F1F1F" />
        <Text style={styles.counterText}>{stampCount}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute', top: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 12, backgroundColor: 'rgba(31,31,31,0.45)',
  },
  location: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1 },
  locationText: { color: '#FDFBF7', fontSize: 15, fontFamily: 'Georgia', flexShrink: 1 },
  counter: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#FDFBF7', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4, marginLeft: 12,
  },
  counterText: { color: '#1F1F1F', fontWeight: '600' },
});

