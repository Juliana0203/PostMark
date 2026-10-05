import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { StampCard } from '../stamps/StampCard';
import { AnimatedInkStamp } from '../stamps/AnimatedInkStamp';
import { Caveat_500Medium } from '@expo-google-fonts/caveat';
import { Marcellus_400Regular } from '@expo-google-fonts/marcellus';
import { useFonts } from 'expo-font';
import { AirMailBorder, VintagePostmarkVariant } from '../stamps/VintagePostmarkVariants';
import { postalCoordinates } from '../../utils/coordinateFormatter';
import { POSTCARD_ASPECT, type StampData } from './PostcardFront';

const INK = '#3A3633';
const NOTE_INK = '#1A365D';

interface Props {
  stamp: StampData;
  width: number;
  /** Si se define, el matasellos se estampa con animación cada vez que cambia (0 = oculto). */
  inkPlayKey?: number;
  /** Se llama al terminar de editar la nota (blur o al desmontar con cambios). */
  onNoteCommit?: (note: string) => void;
  /** false para la exportación: la nota se muestra sin cursor ni teclado. */
  editable?: boolean;
}

export function PostcardBack({ stamp, width, inkPlayKey, onNoteCommit, editable = true }: Props) {
  const [fontsLoaded] = useFonts({ Caveat_500Medium, Marcellus_400Regular });
  const [note, setNote] = useState(stamp.note ?? '');
  const latest = useRef({ note, saved: stamp.note ?? '', onNoteCommit });
  latest.current.note = note;
  latest.current.onNoteCommit = onNoteCommit;
  const commit = () => {
    const c = latest.current;
    if (c.note !== c.saved) {
      c.saved = c.note;
      c.onNoteCommit?.(c.note);
    }
  };
  useEffect(() => commit, []);
  const height = width / POSTCARD_ASPECT;
  const pad = width * 0.04;
  const stampW = width * 0.2;
  const postmarkSize = width * 0.2;
  const { location } = stamp;
  const seed = stamp.id ?? stamp.timestamp;
  const variant = stamp.postmarkStyle ?? 'classic';

  return (
    <View style={[styles.card, { width, height, padding: pad }]}>
      <View style={styles.left}>
        <Text style={[styles.heading, fontsLoaded ? styles.headingFont : null, { fontSize: width * 0.03 }]}>NOTA DE VIAJE</Text>
        <TextInput
          style={[styles.note, fontsLoaded ? styles.noteFont : null, { fontSize: width * 0.052, lineHeight: width * 0.062 }]}
          multiline
          editable={editable}
          value={note}
          onChangeText={setNote}
          onBlur={commit}
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
            <VintagePostmarkVariant variant={variant} {...props} />
          ) : (
            <AnimatedInkStamp {...props} variant={variant} playKey={inkPlayKey} />
          );
        })()}
      </View>
      {variant === 'airmail' ? <AirMailBorder width={width} height={height} /> : null}
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
  headingFont: { fontFamily: 'Marcellus_400Regular' },
  noteFont: { fontFamily: 'Caveat_500Medium' },
  note: { flex: 1, color: NOTE_INK, fontFamily: 'Georgia', textAlignVertical: 'top', padding: 0 },
  divider: { position: 'absolute', left: '50%', width: 1, backgroundColor: '#B9B0A0' },
  right: { flex: 1, paddingLeft: 10, justifyContent: 'space-between' },
  addressBlock: { gap: 4 },
  line: { borderBottomWidth: 1, borderBottomColor: '#8A8174', borderStyle: 'dotted', justifyContent: 'flex-end' },
  coords: { color: '#6B6459', fontFamily: 'Courier', letterSpacing: 1 },
});



