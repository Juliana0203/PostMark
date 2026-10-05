import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { StampCard } from '../stamps/StampCard';
import { AnimatedInkStamp } from '../stamps/AnimatedInkStamp';
import { VintagePostmark } from '../stamps/VintagePostmark';
import { postalCoordinates } from '../../utils/coordinateFormatter';
import { POSTCARD_ASPECT, type StampData } from './PostcardFront';

const INK = '#3A3633';

interface Props {
  stamp: StampData;
  width: number;
  /** Si se define, el matasellos se estampa con animación cada vez que cambia (0 = oculto). */
  inkPlayKey?: number;
}

export function PostcardBack({ stamp, width, inkPlayKey }: Props) {
  const [note, setNote] = useState('');
  const height = width / POSTCARD_ASPECT;
  const pad = width * 0.04;
  const stampW = width * 0.2;
  const postmarkSize = width * 0.2;
  const { location } = stamp;
  const seed = stamp.id ?? stamp.timestamp;

  return (
    <View style={[styles.card, { width, height, padding: pad }]}>
      <View style={styles.left}>
        <Text style={[styles.heading, { fontSize: width * 0.028 }]}>NOTA DE VIAJE</Text>
        <TextInput
          style={[styles.note, { fontSize: width * 0.04 }]}
          multiline
          value={note}
          onChangeText={setNote}
          placeholder="Querido(a)…"
          placeholderTextColor="#A39B8E"
          maxLength={280}
        />
      </View>
      <View style={[styles.divider, { top: pad, bottom: pad }]} />
      <View style={styles.right}>
        <View style={{ alignSelf: 'flex-end', transform: [{ rotate: '1.5deg' }] }}>
          <StampCard imageUri={stamp.imageUri} country={location.country} width={stampW} seed={seed} />
        </View>
        <View style={styles.addressBlock}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={[styles.line, { height: width * 0.07 }]}>
              {i === 2 ? (
                <Text style={[styles.coords, { fontSize: width * 0.026 }]} numberOfLines={1}>
                  {postalCoordinates(location.latitude, location.longitude)}
                </Text>
              ) : null}
            </View>
          ))}
        </View>
      </View>
      <View pointerEvents="none" style={{ position: 'absolute', right: pad + width * 0.06, top: pad + width * 0.12 }}>
        {(() => {
          const props = {
            cityName: location.city,
            countryName: location.country,
            date: stamp.timestamp,
            coordinatesText: postalCoordinates(location.latitude, location.longitude),
            size: postmarkSize,
            seed,
          };
          return inkPlayKey === undefined ? (
            <VintagePostmark {...props} />
          ) : (
            <AnimatedInkStamp {...props} playKey={inkPlayKey} />
          );
        })()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#F6F1E7', borderRadius: 4, flexDirection: 'row',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.18, shadowRadius: 8, elevation: 5,
  },
  left: { flex: 1, paddingRight: 10 },
  heading: { color: '#8A8174', letterSpacing: 2, marginBottom: 4 },
  note: { flex: 1, color: INK, fontFamily: 'Georgia', textAlignVertical: 'top', padding: 0 },
  divider: { position: 'absolute', left: '50%', width: 1, backgroundColor: '#B9B0A0' },
  right: { flex: 1, paddingLeft: 10, justifyContent: 'space-between' },
  addressBlock: { gap: 4 },
  line: { borderBottomWidth: 1, borderBottomColor: '#8A8174', borderStyle: 'dotted', justifyContent: 'flex-end' },
  coords: { color: '#6B6459', fontFamily: 'Courier', letterSpacing: 1 },
});

