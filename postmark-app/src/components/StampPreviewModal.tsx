import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { ActivityIndicator, Image, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { saveStamp } from '../services/storageService';
import type { StampItem, StampLocation } from '../types/stamp';
import { formatCoordinates, formatPostalDate } from '../utils/dateFormatter';

export interface PendingCapture {
  imageUri: string;
  timestamp: string;
  location: StampLocation;
}

interface Props {
  capture: PendingCapture | null;
  onDiscard: () => void;
  onSaved: (item: StampItem) => void;
}

export function StampPreviewModal({ capture, onDiscard, onSaved }: Props) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <Modal visible={capture !== null} animationType="slide" presentationStyle="pageSheet" onRequestClose={onDiscard}>
      <View style={styles.container}>
        {capture && loc && (
          <>
            <View style={styles.stamp}>
              <Image source={{ uri: capture.imageUri }} style={styles.photo} resizeMode="cover" />
              <View style={styles.label}>
                <Text style={styles.destination} numberOfLines={1}>{destination}</Text>
                <Text style={styles.sub}>{[loc.city, loc.country].filter((v) => v && v !== destination).join(', ')}</Text>
                <Text style={styles.meta}>{formatPostalDate(capture.timestamp)}</Text>
                <Text style={styles.meta}>{formatCoordinates(loc.latitude, loc.longitude)}</Text>
              </View>
            </View>
            {error && <Text style={styles.error}>{error}</Text>}
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
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FDFBF7', alignItems: 'center', justifyContent: 'center', padding: 24 },
  stamp: {
    width: '82%', backgroundColor: '#FFFFFF', padding: 12, borderRadius: 4,
    shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 6,
  },
  photo: { width: '100%', aspectRatio: 3 / 4, backgroundColor: '#E8E4DA' },
  label: { paddingTop: 12, alignItems: 'center', gap: 2 },
  destination: { fontFamily: 'Georgia', fontSize: 20, fontWeight: '600', color: '#1F1F1F' },
  sub: { fontFamily: 'Georgia', fontSize: 14, color: '#1F1F1F' },
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
