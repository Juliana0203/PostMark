import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Keyboard, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EXPORT_HEIGHT, EXPORT_WIDTH, ExportPostcardCanvas } from '../components/postcards/ExportPostcardCanvas';
import { InteractivePostcard, type InteractivePostcardHandle } from '../components/postcards/InteractivePostcard';
import { PostcardActionsBar } from '../components/postcards/PostcardActionsBar';
import type { StampData } from '../components/postcards/PostcardFront';
import { updateStampNote } from '../services/storageService';

interface Props {
  stamp: StampData;
  onClose: () => void;
}

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export function PostcardViewerScreen({ stamp, onClose }: Props) {
  const { width } = useWindowDimensions();
  const { bottom } = useSafeAreaInsets();
  const postcard = useRef<InteractivePostcardHandle>(null);
  const exportRef = useRef<View>(null);
  const [note, setNote] = useState(stamp.note ?? '');
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  const onNoteCommit = useCallback(
    (value: string) => {
      setNote(value);
      if (stamp.id) void updateStampNote(stamp.id, value).catch(() => undefined);
    },
    [stamp.id],
  );

  // Cierra el teclado (confirma la nota) y deja que el lienzo se vuelva a pintar con ella.
  const beforeCapture = useCallback(async () => {
    Keyboard.dismiss();
    await sleep(350);
  }, []);

  return (
    <GestureHandlerRootView style={styles.root}>
      <Pressable style={styles.close} onPress={onClose} hitSlop={12} accessibilityLabel="Cerrar visor">
        <Ionicons name="close" size={22} color="#F2EDE3" />
      </Pressable>

      <View style={styles.stage}>
        <InteractivePostcard
          ref={postcard}
          stamp={{ ...stamp, note }}
          width={width * 0.92}
          tapToFlip={false}
          onNoteCommit={onNoteCommit}
        />
      </View>

      <Pressable style={styles.flip} onPress={() => postcard.current?.flip()} accessibilityLabel="Voltear postal">
        <Ionicons name="sync-outline" size={26} color="#F2EDE3" />
      </Pressable>

      <View style={[styles.actions, { bottom: bottom + 64 }]}>
        <PostcardActionsBar
          captureTarget={exportRef}
          size={{ width: EXPORT_WIDTH, height: EXPORT_HEIGHT }} beforeCapture={beforeCapture} onToast={setToast} />
      </View>

      <View style={[styles.pill, { bottom: bottom + 20 }]}>
        <Text style={styles.pillText}>Inclina tu teléfono para explorar el brillo • Desliza para voltear</Text>
      </View>

      {toast ? (
        <Animated.View entering={FadeInDown} exiting={FadeOutDown} style={[styles.toast, { bottom: bottom + 120 }]}>
          <Text style={styles.toastText}>{toast}</Text>
        </Animated.View>
      ) : null}

      {/* Fuera de pantalla: lienzo apaisado frente + dorso para la captura. */}
      <View pointerEvents="none" style={styles.offscreen}>
        <ExportPostcardCanvas ref={exportRef} key={note} stamp={{ ...stamp, note }} />
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#141312' },
  stage: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  close: {
    position: 'absolute', top: 16, left: 16, width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(242,237,227,0.12)', zIndex: 2,
  },
  flip: {
    position: 'absolute', right: 20, bottom: 190, width: 54, height: 54, borderRadius: 27,
    alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(242,237,227,0.14)',
  },
  actions: { position: 'absolute', left: 0, right: 0 },
  pill: {
    position: 'absolute', alignSelf: 'center', paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 16, backgroundColor: 'rgba(242,237,227,0.1)', maxWidth: '92%',
  },
  pillText: { color: '#CFC8BA', fontSize: 11, textAlign: 'center' },
  toast: {
    position: 'absolute', alignSelf: 'center', backgroundColor: 'rgba(242,237,227,0.95)',
    paddingHorizontal: 18, paddingVertical: 10, borderRadius: 20,
  },
  toastText: { color: '#1F1F1F', fontWeight: '600', fontSize: 13 },
  offscreen: { position: 'absolute', left: -5000, top: 0 },
});


