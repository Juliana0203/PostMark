import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, type Region } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { clusterStamps, MIN_CLUSTER_DELTA, type StampCluster } from '../utils/clusterStamps';
import { hasRealCoordinates } from '../utils/coordinateFormatter';
import { formatPostalDate } from '../utils/dateFormatter';
import type { StampRecord } from '../types/stamp';

interface Props {
  stamps: StampRecord[];
  onOpen: (stamp: StampRecord) => void;
  onGoToCamera: () => void;
}

const PIN = 46;

function StampPin({ stamp, selected, onPress }: { stamp: StampRecord; selected: boolean; onPress: () => void }) {
  // Los marcadores se rasterizan: hay que dejar que la imagen cargue y luego congelar la vista.
  const [track, setTrack] = useState(true);
  useEffect(() => {
    setTrack(true);
    const t = setTimeout(() => setTrack(false), 600);
    return () => clearTimeout(t);
  }, [selected]);

  return (
    <Marker
      coordinate={{ latitude: stamp.location.latitude, longitude: stamp.location.longitude }}
      onPress={onPress}
      tracksViewChanges={track}
      anchor={{ x: 0.5, y: 0.5 }}
    >
      <View style={[styles.pin, selected && styles.pinSelected]}>
        <Image source={{ uri: stamp.imageUri }} style={styles.pinImage} onLoadEnd={() => setTrack(false)} />
      </View>
    </Marker>
  );
}

function ClusterPin({ cluster, onPress }: { cluster: StampCluster; onPress: () => void }) {
  const [track, setTrack] = useState(true);
  useEffect(() => {
    setTrack(true);
    const t = setTimeout(() => setTrack(false), 700);
    return () => clearTimeout(t);
  }, [cluster.key]);
  const top = cluster.stamps[0];
  const below = cluster.stamps[1];

  return (
    <Marker
      coordinate={{ latitude: cluster.latitude, longitude: cluster.longitude }}
      onPress={onPress}
      tracksViewChanges={track}
      anchor={{ x: 0.5, y: 0.5 }}
    >
      <View style={styles.clusterBox}>
        <View style={[styles.pin, styles.stackBack, { transform: [{ rotate: '-9deg' }] }]} />
        <View style={[styles.pin, styles.stackBack, { transform: [{ rotate: '8deg' }] }]}>
          {below ? <Image source={{ uri: below.imageUri }} style={styles.pinImage} /> : null}
        </View>
        <View style={styles.pin}>
          <Image source={{ uri: top.imageUri }} style={styles.pinImage} onLoadEnd={() => setTrack(false)} />
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{`x${cluster.stamps.length}`}</Text>
        </View>
      </View>
    </Marker>
  );
}

export function WorldMapView({ stamps, onOpen, onGoToCamera }: Props) {
  const { top, bottom } = useSafeAreaInsets();
  const mapRef = useRef<MapView>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [lonDelta, setLonDelta] = useState(0.2);
  const located = useMemo(
    () => stamps.filter((s) => hasRealCoordinates(s.location.latitude, s.location.longitude)),
    [stamps],
  );
  const selected = located.find((s) => s.id === selectedId) ?? null;

  // Centro: última ubicación registrada (la lista viene con la más reciente primero).
  const initialRegion = useMemo<Region | undefined>(() => {
    const last = located[0];
    return last
      ? { latitude: last.location.latitude, longitude: last.location.longitude, latitudeDelta: 0.2, longitudeDelta: 0.2 }
      : undefined;
  }, [located]);

  const clusters = useMemo(() => clusterStamps(located, lonDelta), [located, lonDelta]);

  // Acerca la cámara a los miembros del grupo hasta que se desplieguen.
  const expand = useCallback((cluster: StampCluster) => {
    setSelectedId(null);
    const coords = cluster.stamps.map((s) => ({ latitude: s.location.latitude, longitude: s.location.longitude }));
    const lats = coords.map((c) => c.latitude);
    const lons = coords.map((c) => c.longitude);
    const span = Math.max(Math.max(...lats) - Math.min(...lats), Math.max(...lons) - Math.min(...lons));
    if (span < MIN_CLUSTER_DELTA / 4) {
      mapRef.current?.animateToRegion(
        { latitude: cluster.latitude, longitude: cluster.longitude, latitudeDelta: MIN_CLUSTER_DELTA / 2, longitudeDelta: MIN_CLUSTER_DELTA / 2 },
        450,
      );
    } else {
      mapRef.current?.fitToCoordinates(coords, { edgePadding: { top: 160, right: 90, bottom: 260, left: 90 }, animated: true });
    }
  }, []);

  const fitAll = useCallback(() => {
    if (located.length < 2) return;
    mapRef.current?.fitToCoordinates(
      located.map((s) => ({ latitude: s.location.latitude, longitude: s.location.longitude })),
      { edgePadding: { top: 120, right: 60, bottom: 220, left: 60 }, animated: true },
    );
  }, [located]);

  useEffect(() => {
    fitAll();
  }, [fitAll]);

  return (
    <View style={styles.root}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        initialRegion={initialRegion}
        onMapReady={fitAll}
        onPress={() => setSelectedId(null)}
        onRegionChangeComplete={(r) => setLonDelta(r.longitudeDelta)}
        showsUserLocation
        showsCompass={false}
      >
        {clusters.map((cluster) =>
          cluster.stamps.length === 1 ? (
            <StampPin
              key={cluster.key}
              stamp={cluster.stamps[0]}
              selected={cluster.stamps[0].id === selectedId}
              onPress={() => setSelectedId(cluster.stamps[0].id)}
            />
          ) : (
            <ClusterPin key={cluster.key} cluster={cluster} onPress={() => expand(cluster)} />
          ),
        )}
      </MapView>

      {located.length === 0 ? (
        <View style={[styles.banner, { top: top + 12 }]}>
          <Text style={styles.bannerText}>
            {stamps.length === 0 ? 'Aún no tienes recuerdos en el mapa.' : 'Tus sellos no tienen ubicación registrada.'}
          </Text>
          <Pressable onPress={onGoToCamera} hitSlop={8}>
            <Text style={styles.bannerLink}>Tomar una foto</Text>
          </Pressable>
        </View>
      ) : null}

      {selected ? (
        <View style={[styles.sheet, { bottom: bottom + 100 }]}>
          <Image source={{ uri: selected.imageUri }} style={styles.sheetImage} />
          <View style={styles.sheetInfo}>
            <Text style={styles.sheetCity} numberOfLines={1}>{selected.location.placeName ?? selected.location.city}</Text>
            <Text style={styles.sheetMeta} numberOfLines={1}>{`${selected.location.city}, ${selected.location.country}`}</Text>
            <Text style={styles.sheetMeta}>{formatPostalDate(selected.timestamp)}</Text>
          </View>
          <Pressable style={styles.open} onPress={() => onOpen(selected)} accessibilityLabel="Abrir postal">
            <Ionicons name="albums-outline" size={16} color="#FDFBF7" />
            <Text style={styles.openText}>Abrir</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#E8E4DA' },
  pin: {
    width: PIN, height: PIN, padding: 3, backgroundColor: '#FAF7F2', borderRadius: 4,
    borderWidth: 1, borderColor: '#B9B0A0',
  },
  pinSelected: { borderColor: '#8B1E2D', borderWidth: 2 },
  clusterBox: { width: PIN + 14, height: PIN + 14, alignItems: 'center', justifyContent: 'center' },
  stackBack: { position: 'absolute' },
  badge: {
    position: 'absolute', top: 0, right: 0, minWidth: 26, height: 20, borderRadius: 10, paddingHorizontal: 5,
    backgroundColor: '#8B1E2D', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#FDFBF7',
  },
  badgeText: { color: '#FDFBF7', fontSize: 11, fontWeight: '700' },
  pinImage: { flex: 1, borderRadius: 2 },
  banner: {
    position: 'absolute', alignSelf: 'center', backgroundColor: 'rgba(253,251,247,0.95)', borderRadius: 16,
    paddingHorizontal: 16, paddingVertical: 10, alignItems: 'center', gap: 4,
  },
  bannerText: { fontFamily: 'Georgia', color: '#2B2724' },
  bannerLink: { color: '#8B1E2D', fontWeight: '600' },
  sheet: {
    position: 'absolute', left: 16, right: 16, flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#FDFBF7', borderRadius: 16, padding: 12,
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 6,
  },
  sheetImage: { width: 56, height: 56, borderRadius: 4 },
  sheetInfo: { flex: 1 },
  sheetCity: { fontFamily: 'Georgia', fontSize: 17, fontWeight: '600', color: '#2B2724' },
  sheetMeta: { fontSize: 12, color: '#6B6459', marginTop: 1 },
  open: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#1F1F1F', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 10 },
  openText: { color: '#FDFBF7', fontWeight: '600' },
});
