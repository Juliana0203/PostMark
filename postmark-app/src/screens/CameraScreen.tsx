import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { CameraHeader } from '../components/CameraHeader';
import { CaptureButton } from '../components/CaptureButton';
import { StampPreviewModal, type PendingCapture } from '../components/StampPreviewModal';
import { getCurrentStampLocation, requestLocationPermission, reverseGeocode } from '../services/locationService';
import { playShutterClick, preloadSounds } from '../services/soundService';
import { getStamps } from '../services/storageService';
import type { StampItem } from '../types/stamp';

interface Props {
  /** Se llama tras coleccionar una estampilla (p. ej. para llevar al pasaporte). */
  onCollected?: (stamp: StampItem) => void;
}

export function CameraScreen({ onCollected }: Props) {
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [locationGranted, setLocationGranted] = useState(false);
  const [city, setCity] = useState<string | null>(null);
  const [country, setCountry] = useState<string | null>(null);
  const [count, setCount] = useState(0);
  const [capturing, setCapturing] = useState(false);
  const [pending, setPending] = useState<PendingCapture | null>(null);

  useEffect(() => {
    preloadSounds();
    requestLocationPermission().then(setLocationGranted).catch(() => setLocationGranted(false));
    getStamps().then((s) => setCount(s.length)).catch(() => undefined);
  }, []);

  // Indicador de ciudad en vivo
  useEffect(() => {
    if (!locationGranted) return;
    let cancelled = false;
    let subscription: Location.LocationSubscription | undefined;
    Location.watchPositionAsync(
      { accuracy: Location.Accuracy.Balanced, distanceInterval: 100, timeInterval: 15000 },
      async ({ coords }) => {
        const place = await reverseGeocode(coords.latitude, coords.longitude);
        if (cancelled) return;
        setCity(place.city);
        setCountry(place.country);
      },
    )
      .then((sub) => {
        if (cancelled) sub.remove();
        else subscription = sub;
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
      subscription?.remove();
    };
  }, [locationGranted]);

  const capture = useCallback(async () => {
    if (capturing || !cameraRef.current) return;
    setCapturing(true);
    playShutterClick();
    try {
      const photoPromise = cameraRef.current.takePictureAsync({ quality: 0.85 });
      const locationPromise = locationGranted ? getCurrentStampLocation() : Promise.reject(new Error('sin permiso'));
      const [photo, location] = await Promise.all([photoPromise, locationPromise.catch(() => null)]);
      if (!photo?.uri) throw new Error('Sin imagen');
      setPending({
        imageUri: photo.uri,
        timestamp: new Date().toISOString(),
        location: location ?? {
          latitude: 0, longitude: 0, altitude: null, placeName: null,
          city: 'Ubicación Desconocida', country: 'Ubicación Desconocida', isoCountryCode: null,
        },
      });
    } catch {
      Alert.alert('Error', 'No se pudo capturar la foto.');
    } finally {
      setCapturing(false);
    }
  }, [capturing, locationGranted]);

  if (!permission) return <View style={styles.center} />;
  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.message}>PostMark necesita tu cámara para crear estampillas.</Text>
        <Pressable style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionText}>Conceder acceso</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" />
      <CameraHeader city={city} country={country} stampCount={count} />
      <View style={styles.shutter}>
        <CaptureButton onPress={capture} disabled={capturing} />
      </View>
      <StampPreviewModal
        capture={pending}
        onDiscard={() => setPending(null)}
        onSaved={(item) => {
          setCount((c) => c + 1);
          setPending(null);
          onCollected?.(item);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1F1F1F' },
  shutter: { position: 'absolute', bottom: 130, left: 0, right: 0, alignItems: 'center' },
  center: { flex: 1, backgroundColor: '#FDFBF7', alignItems: 'center', justifyContent: 'center', padding: 32 },
  message: { fontFamily: 'Georgia', fontSize: 17, color: '#1F1F1F', textAlign: 'center', marginBottom: 20 },
  permissionButton: { backgroundColor: '#1F1F1F', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 28 },
  permissionText: { color: '#FDFBF7', fontWeight: '600' },
});

