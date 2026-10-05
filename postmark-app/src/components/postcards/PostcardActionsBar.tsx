import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRef, useState, type RefObject } from 'react';
import { ActivityIndicator, Alert, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import {
  captureViewAsImage,
  type CaptureSize,
  discardTempImage,
  saveToPhotoLibrary,
  sharePostcardImage,
} from '../../services/shareService';

interface Props {
  /** Vista (lienzo de exportación) que se captura. */
  captureTarget: RefObject<unknown>;
  /** Tamaño lógico del lienzo; la imagen sale a 3×. */
  size?: CaptureSize;
  /** Se espera antes de capturar (p. ej. confirmar la nota en edición). */
  beforeCapture?: () => Promise<void>;
  onToast: (message: string) => void;
}

type Action = 'share' | 'save';

export function PostcardActionsBar({ captureTarget, size, beforeCapture, onToast }: Props) {
  const [busy, setBusy] = useState<Action | null>(null);
  const lock = useRef(false);

  const run = async (action: Action) => {
    if (lock.current) return;
    lock.current = true;
    setBusy(action);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
    let uri: string | null = null;
    try {
      await beforeCapture?.();
      uri = await captureViewAsImage(captureTarget, size);
      if (action === 'share') {
        if (!(await sharePostcardImage(uri))) onToast('Este dispositivo no permite compartir.');
      } else {
        const result = await saveToPhotoLibrary(uri);
        if (result === 'saved') onToast('Postal guardada en Fotos');
        else if (result === 'denied') {
          Alert.alert('Permiso necesario', 'PostMark necesita permiso para guardar en tu fototeca. Actívalo en Ajustes.', [
            { text: 'Ahora no', style: 'cancel' },
            { text: 'Abrir Ajustes', onPress: () => void Linking.openSettings() },
          ]);
        } else onToast('No se pudo guardar la imagen.');
      }
    } catch {
      onToast('No se pudo generar la imagen.');
    } finally {
      if (uri) void discardTempImage(uri);
      lock.current = false;
      setBusy(null);
    }
  };

  const button = (action: Action, icon: 'share-outline' | 'download-outline', label: string) => (
    <Pressable
      style={[styles.button, busy !== null && styles.disabled]}
      onPress={() => void run(action)}
      disabled={busy !== null}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      {busy === action ? <ActivityIndicator color="#F2EDE3" size="small" /> : <Ionicons name={icon} size={18} color="#F2EDE3" />}
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );

  return (
    <View style={styles.bar}>
      {button('share', 'share-outline', 'Compartir')}
      {button('save', 'download-outline', 'Guardar en Fotos')}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', gap: 10, justifyContent: 'center' },
  button: {
    flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 44,
    paddingHorizontal: 18, paddingVertical: 10, borderRadius: 22, backgroundColor: 'rgba(242,237,227,0.16)',
  },
  disabled: { opacity: 0.6 },
  label: { color: '#F2EDE3', fontWeight: '600', fontSize: 13 },
});

