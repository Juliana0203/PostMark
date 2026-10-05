import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CameraScreen } from '../screens/CameraScreen';
import { PassportView } from '../screens/PassportView';
import { PostcardViewerScreen } from '../screens/PostcardViewerScreen';
import { WorldMapView } from '../screens/WorldMapView';
import { deleteStamp, getAllStamps } from '../services/storageService';
import type { StampRecord } from '../types/stamp';

type Tab = 'camera' | 'passport' | 'map';

const TABS: { key: Tab; label: string; icon: 'camera' | 'book' | 'map' }[] = [
  { key: 'camera', label: 'Cámara', icon: 'camera' },
  { key: 'passport', label: 'Pasaporte', icon: 'book' },
  { key: 'map', label: 'Mapa', icon: 'map' },
];

export function MainNavigator() {
  const { bottom } = useSafeAreaInsets();
  const [tab, setTab] = useState<Tab>('camera');
  const [stamps, setStamps] = useState<StampRecord[]>([]);
  const [viewing, setViewing] = useState<StampRecord | null>(null);

  const reload = useCallback(() => {
    getAllStamps().then(setStamps).catch(() => undefined);
  }, []);

  // Se relee al cambiar de pestaña para reflejar lo recién coleccionado.
  useEffect(reload, [tab, reload]);

  const select = (next: Tab) => {
    if (next === tab) return;
    Haptics.selectionAsync().catch(() => undefined);
    setTab(next);
  };

  const remove = async (stamp: StampRecord) => {
    await deleteStamp(stamp.id).catch(() => undefined);
    reload();
  };

  const closeViewer = () => {
    setViewing(null);
    reload();
  };

  return (
    <View style={styles.root}>
      <StatusBar style={tab === 'camera' ? 'light' : 'dark'} />
      {/* Solo la pestaña activa está montada: la cámara y el mapa no consumen recursos en segundo plano. */}
      <Animated.View key={tab} entering={FadeIn.duration(220)} style={styles.flex}>
        {tab === 'camera' ? <CameraScreen /> : null}
        {tab === 'passport' ? (
          <PassportView stamps={stamps} onOpen={setViewing} onDelete={remove} onGoToCamera={() => select('camera')} />
        ) : null}
        {tab === 'map' ? <WorldMapView stamps={stamps} onOpen={setViewing} onGoToCamera={() => select('camera')} /> : null}
      </Animated.View>

      <View style={[styles.barWrap, { bottom: bottom + 12 }]} pointerEvents="box-none">
        <View style={styles.bar}>
          {TABS.map(({ key, label, icon }) => {
            const active = key === tab;
            return (
              <Pressable key={key} onPress={() => select(key)} style={[styles.item, active && styles.itemActive]} accessibilityRole="tab" accessibilityState={{ selected: active }}>
                <Ionicons name={active ? icon : (`${icon}-outline` as const)} size={20} color={active ? '#FDFBF7' : '#1F1F1F'} />
                {active ? <Text style={styles.label}>{label}</Text> : null}
              </Pressable>
            );
          })}
        </View>
      </View>

      <Modal visible={viewing !== null} animationType="fade" presentationStyle="fullScreen" onRequestClose={closeViewer}>
        {viewing ? <PostcardViewerScreen stamp={viewing} onClose={closeViewer} /> : null}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#141312' },
  flex: { flex: 1 },
  barWrap: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  bar: {
    flexDirection: 'row', gap: 6, padding: 6, borderRadius: 30, backgroundColor: 'rgba(253,251,247,0.94)',
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 6,
  },
  item: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 24 },
  itemActive: { backgroundColor: '#1F1F1F' },
  label: { color: '#FDFBF7', fontWeight: '600', fontSize: 13 },
});
