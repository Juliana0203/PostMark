import { Ionicons } from '@expo/vector-icons';
import { useRef } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { InteractivePostcard, type InteractivePostcardHandle } from '../components/postcards/InteractivePostcard';
import type { StampData } from '../components/postcards/PostcardFront';
import { updateStampNote } from '../services/storageService';

interface Props {
  stamp: StampData;
  onClose: () => void;
}

export function PostcardViewerScreen({ stamp, onClose }: Props) {
  const { width } = useWindowDimensions();
  const { bottom } = useSafeAreaInsets();
  const postcard = useRef<InteractivePostcardHandle>(null);

  return (
    <GestureHandlerRootView style={styles.root}>
      <Pressable style={styles.close} onPress={onClose} hitSlop={12} accessibilityLabel="Cerrar visor">
        <Ionicons name="close" size={22} color="#F2EDE3" />
      </Pressable>

      <View style={styles.stage}>
        <InteractivePostcard
          ref={postcard}
          stamp={stamp}
          width={width * 0.92}
          tapToFlip={false}
          onNoteCommit={stamp.id ? (note) => void updateStampNote(stamp.id as string, note).catch(() => undefined) : undefined}
        />
      </View>

      <Pressable style={styles.flip} onPress={() => postcard.current?.flip()} accessibilityLabel="Voltear postal">
        <Ionicons name="sync-outline" size={26} color="#F2EDE3" />
      </Pressable>

      <View style={[styles.pill, { bottom: bottom + 20 }]}>
        <Text style={styles.pillText}>Inclina tu teléfono para explorar el brillo • Desliza para voltear</Text>
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
    position: 'absolute', right: 20, bottom: 96, width: 54, height: 54, borderRadius: 27,
    alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(242,237,227,0.14)',
  },
  pill: {
    position: 'absolute', alignSelf: 'center', paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 16, backgroundColor: 'rgba(242,237,227,0.1)', maxWidth: '92%',
  },
  pillText: { color: '#CFC8BA', fontSize: 11, textAlign: 'center' },
});


