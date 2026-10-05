import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { saveStamp } from '../services/storageService';
import type { StampItem, StampLocation } from '../types/stamp';
import { postalCoordinates } from '../utils/coordinateFormatter';
import { formatPostalDate } from '../utils/dateFormatter';
import { PostcardCard } from './postcards/PostcardCard';
import { PostcardViewerScreen } from '../screens/PostcardViewerScreen';
import { HolographicShine } from './stamps/HolographicShine';
import { StampCard, STAMP_ASPECT } from './stamps/StampCard';
import { VintagePostmark } from './stamps/VintagePostmark';

type ViewMode = 'stamp' | 'postcard';

export interface PendingCapture {
  imageUri: string;
  timestamp: string;
  location: StampLocation;
  needsGeocoding?: boolean;
}

interface Props {
  capture: PendingCapture | null;
  onDiscard: () => void;
  onSaved: (item: StampItem) => void;
}

export function StampPreviewModal({ capture, onDiscard, onSaved }: Props) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<ViewMode>('stamp');
  const [viewerOpen, setViewerOpen] = useState(false);
  useEffect(() => {
    if (!capture) setViewerOpen(false);
  }, [capture]);
  const { width: screenWidth } = useWindowDimensions();

  const collect = async () => {
    if (!capture || saving) return;
    setSaving(true);
    setError(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => undefined);
    try {
      const item = await saveStamp({ ...capture, isFavorite: false });
      onSaved(item);
    } catch {
      setError('No se pudo guardar la estampilla. Inténtalo de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  const loc = capture?.location;
  const destination = loc ? loc.placeName ?? loc.city : '';
  const stampWidth = screenWidth * 0.56;
  const postmarkSize = stampWidth * 0.6;
  const seed = capture?.timestamp;
  const coordinates = loc ? postalCoordinates(loc.latitude, loc.longitude) : '';

  return (
    <Modal visible={capture !== null} animationType="slide" presentationStyle="pageSheet" onRequestClose={onDiscard}>
      {viewerOpen && capture ? (
        <PostcardViewerScreen stamp={{ ...capture, isFavorite: false }} onClose={() => setViewerOpen(false)} />
      ) : (
      <View style={styles.container}>
        {capture && loc && (
          <>
            <View style={styles.toggle}>
              {(['stamp', 'postcard'] as const).map((m) => (
                <Pressable key={m} onPress={() => setMode(m)} style={[styles.toggleItem, mode === m && styles.toggleActive]}>
                  <Text style={[styles.toggleText, mode === m && styles.toggleTextActive]}>
                    {m === 'stamp' ? 'Estampilla' : 'Postal'}
                  </Text>
                </Pressable>
              ))}
            </View>
            <View style={styles.stage}>
              {mode === 'stamp' ? (
                <View style={{ width: stampWidth, height: stampWidth * STAMP_ASPECT }}>
                  <HolographicShine width={stampWidth} height={stampWidth * STAMP_ASPECT} active={capture !== null && mode === 'stamp'}>
                    <StampCard imageUri={capture.imageUri} country={loc.country} width={stampWidth} seed={seed} />
                  </HolographicShine>
                  <View pointerEvents="none" style={{ position: 'absolute', right: -postmarkSize * 0.3, bottom: -postmarkSize * 0.3 }}>
                    <VintagePostmark
                      cityName={loc.city}
                      countryName={loc.country}
                      date={capture.timestamp}
                      coordinatesText={coordinates}
                      size={postmarkSize}
                      seed={seed}
                    />
                  </View>
                </View>
              ) : (
                <>
                  <PostcardCard stamp={{ ...capture, isFavorite: false }} width={screenWidth * 0.9} />
                  <Pressable style={styles.viewerButton} onPress={() => setViewerOpen(true)}>
                    <Ionicons name="expand-outline" size={16} color="#1F1F1F" />
                    <Text style={styles.viewerText}>Abrir visor interactivo</Text>
                  </Pressable>
                </>
              )}
            </View>
            <View style={styles.label}>
              <Text style={styles.destination} numberOfLines={1}>{destination}</Text>
              <Text style={styles.meta}>{formatPostalDate(capture.timestamp)} · {coordinates}</Text>
            </View>
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <View style={styles.actions}>
              <Pressable style={[styles.button, styles.secondary]} onPress={onDiscard} disabled={saving}>
                <Ionicons name="close" size={18} color="#1F1F1F" />
                <Text style={styles.secondaryText}>Descartar</Text>
              </Pressable>
              <Pressable style={[styles.button, styles.primary]} onPress={collect} disabled={saving}>
                {saving ? <ActivityIndicator color="#FDFBF7" /> : <Ionicons name="bookmark" size={18} color="#FDFBF7" />}
                <Text style={styles.primaryText}>Coleccionar</Text>
              </Pressable>
            </View>
          </>
        )}
      </View>
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FDFBF7', alignItems: 'center', justifyContent: 'center', padding: 24 },
  toggle: { flexDirection: 'row', borderWidth: 1, borderColor: '#1F1F1F', borderRadius: 20, overflow: 'hidden', marginBottom: 24 },
  toggleItem: { paddingHorizontal: 20, paddingVertical: 8 },
  toggleActive: { backgroundColor: '#1F1F1F' },
  toggleText: { color: '#1F1F1F', fontWeight: '600' },
  toggleTextActive: { color: '#FDFBF7' },
  stage: { minHeight: 300, alignItems: 'center', justifyContent: 'center' },
  viewerButton: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 14, padding: 8 },
  viewerText: { color: '#1F1F1F', fontWeight: '600', fontSize: 13 },
  label: { marginTop: 20, alignItems: 'center', gap: 2 },  destination: { fontFamily: 'Georgia', fontSize: 20, fontWeight: '600', color: '#1F1F1F' },
  meta: { fontSize: 12, letterSpacing: 1.2, color: '#5A5A5A' },
  error: { color: '#8B1E2D', marginTop: 16, textAlign: 'center' },
  actions: { flexDirection: 'row', gap: 12, marginTop: 32 },
  button: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingHorizontal: 22, paddingVertical: 14, borderRadius: 28, minWidth: 140,
  },
  secondary: { borderWidth: 1, borderColor: '#1F1F1F' },
  secondaryText: { color: '#1F1F1F', fontWeight: '600' },
  primary: { backgroundColor: '#1F1F1F' },
  primaryText: { color: '#FDFBF7', fontWeight: '600' },
});




