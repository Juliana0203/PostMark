import { useMemo } from 'react';
import { Alert, Pressable, SectionList, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StampCard, STAMP_ASPECT } from '../components/stamps/StampCard';
import { StickerDropView } from '../components/stamps/StickerDropView';
import { UNKNOWN_COUNTRY } from '../services/storageService';
import type { StampRecord } from '../types/stamp';
import { formatPostalDate } from '../utils/dateFormatter';

interface Props {
  stamps: StampRecord[];
  onOpen: (stamp: StampRecord) => void;
  onDelete: (stamp: StampRecord) => void;
  onGoToCamera: () => void;
  /** Estampilla recién coleccionada: cae sobre su celda con animación. */
  highlightId?: string | null;
}

interface Section {
  title: string;
  count: number;
  data: StampRecord[][];
}

const COLUMNS = 2;
const PAD = 20;
const GAP = 18;

function buildSections(stamps: StampRecord[]): Section[] {
  const groups = new Map<string, StampRecord[]>();
  for (const s of stamps) {
    const country = s.location.country?.trim() || UNKNOWN_COUNTRY;
    groups.set(country, [...(groups.get(country) ?? []), s]);
  }
  return [...groups.entries()]
    .sort(([a], [b]) => (a === UNKNOWN_COUNTRY ? 1 : b === UNKNOWN_COUNTRY ? -1 : a.localeCompare(b, 'es')))
    .map(([title, items]) => {
      const rows: StampRecord[][] = [];
      for (let i = 0; i < items.length; i += COLUMNS) rows.push(items.slice(i, i + COLUMNS));
      return { title, count: items.length, data: rows };
    });
}

export function PassportView({ stamps, onOpen, onDelete, onGoToCamera, highlightId }: Props) {
  const { width } = useWindowDimensions();
  const { top, bottom } = useSafeAreaInsets();
  const sections = useMemo(() => buildSections(stamps), [stamps]);
  const cellWidth = (width - PAD * 2 - GAP * (COLUMNS - 1)) / COLUMNS;
  const stampWidth = cellWidth * 0.86;

  const confirmDelete = (stamp: StampRecord) =>
    Alert.alert('Eliminar estampilla', `¿Quitar el sello de ${stamp.location.city} de tu pasaporte?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => onDelete(stamp) },
    ]);

  if (stamps.length === 0) {
    return (
      <View style={[styles.root, styles.empty, { paddingTop: top }]}>
        <Ionicons name="book-outline" size={56} color="#8A8174" />
        <Text style={styles.emptyTitle}>Tu pasaporte está vacío</Text>
        <Text style={styles.emptyBody}>Sal a explorar y toma tu primera foto para coleccionar tu primer sello.</Text>
        <Pressable style={styles.cta} onPress={onGoToCamera}>
          <Ionicons name="camera" size={18} color="#FDFBF7" />
          <Text style={styles.ctaText}>Tomar primera foto</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <SectionList
        sections={sections}
        keyExtractor={(row) => row[0].id}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={{ paddingTop: top + 16, paddingBottom: bottom + 120, paddingHorizontal: PAD }}
        ListHeaderComponent={
          <View style={styles.title}>
            <Text style={styles.titleText}>Pasaporte</Text>
            <Text style={styles.titleSub}>{`${stamps.length} ${stamps.length === 1 ? 'sello' : 'sellos'}`}</Text>
          </View>
        }
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{section.title.toUpperCase()}</Text>
            <Text style={styles.sectionCount}>{String(section.count)}</Text>
          </View>
        )}
        renderItem={({ item: row }) => (
          <View style={styles.row}>
            {row.map((stamp) => (
              <Animated.View key={stamp.id} entering={FadeInDown.duration(260)} style={{ width: cellWidth, alignItems: 'center' }}>
                <Pressable
                  onPress={() => onOpen(stamp)}
                  onLongPress={() => confirmDelete(stamp)}
                  style={({ pressed }) => ({ transform: [{ scale: pressed ? 0.96 : 1 }] })}
                  accessibilityLabel={`Abrir postal de ${stamp.location.city}`}
                >
                  <View style={{ height: stampWidth * STAMP_ASPECT, width: stampWidth, transform: [{ rotate: `${(stamp.id.charCodeAt(0) % 5) - 2}deg` }] }}>
                    <StickerDropView play={stamp.id === highlightId}>
                      <StampCard imageUri={stamp.imageUri} country={stamp.location.country} width={stampWidth} seed={stamp.id} />
                    </StickerDropView>
                  </View>
                </Pressable>
                <Text style={styles.city} numberOfLines={1}>{stamp.location.city}</Text>
                <Text style={styles.date}>{formatPostalDate(stamp.timestamp)}</Text>
              </Animated.View>
            ))}
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F4EEDD' },
  title: { marginBottom: 8 },
  titleText: { fontFamily: 'Georgia', fontSize: 34, fontWeight: '700', color: '#2B2724' },
  titleSub: { fontFamily: 'Georgia', fontSize: 14, color: '#8A8174', marginTop: 2 },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between',
    borderBottomWidth: 1, borderBottomColor: '#B9B0A0', paddingBottom: 6, marginTop: 24, marginBottom: 16,
  },
  sectionTitle: { fontFamily: 'Georgia', fontSize: 15, letterSpacing: 3, color: '#2B2724', fontWeight: '600' },
  sectionCount: { fontFamily: 'Georgia', fontSize: 14, color: '#8A8174' },
  row: { flexDirection: 'row', gap: GAP, marginBottom: 22 },
  city: { marginTop: 10, fontFamily: 'Georgia', fontSize: 14, color: '#2B2724', fontWeight: '600', maxWidth: '90%' },
  date: { marginTop: 2, fontSize: 11, letterSpacing: 1, color: '#8A8174' },
  empty: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, gap: 12 },
  emptyTitle: { fontFamily: 'Georgia', fontSize: 24, color: '#2B2724', fontWeight: '600' },
  emptyBody: { fontFamily: 'Georgia', fontSize: 15, color: '#6B6459', textAlign: 'center', lineHeight: 22 },
  cta: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#1F1F1F', paddingHorizontal: 22, paddingVertical: 14, borderRadius: 28, marginTop: 12 },
  ctaText: { color: '#FDFBF7', fontWeight: '600' },
});
