import NetInfo, { type NetInfoState } from '@react-native-community/netinfo';
import { reverseGeocodeStrict } from './locationService';
import { getAllStamps, updateStamp } from './storageService';
import { hasRealCoordinates } from '../utils/coordinateFormatter';

type Listener = () => void;
const listeners = new Set<Listener>();
let running = false;

/** Avisa cuando la cola actualizó algún registro (para refrescar el álbum y el mapa). */
export function onGeocodingUpdated(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Cantidad de estampillas pendientes de geocodificar. */
export async function pendingGeocodingCount(): Promise<number> {
  return (await getAllStamps()).filter((s) => s.needsGeocoding).length;
}

/**
 * Resuelve ciudad/país de los registros guardados sin red. Se detiene en el primer fallo
 * (la red sigue caída) y se reintenta en la siguiente reconexión.
 */
export async function processGeocodingQueue(): Promise<number> {
  if (running) return 0;
  running = true;
  let updated = 0;
  try {
    const pending = (await getAllStamps()).filter((s) => s.needsGeocoding);
    for (const stamp of pending) {
      const { latitude, longitude } = stamp.location;
      if (!hasRealCoordinates(latitude, longitude)) {
        await updateStamp(stamp.id, { needsGeocoding: false });
        continue;
      }
      try {
        const place = await reverseGeocodeStrict(latitude, longitude);
        await updateStamp(stamp.id, { location: { ...stamp.location, ...place }, needsGeocoding: false });
        updated++;
      } catch {
        break;
      }
    }
  } catch {
    // Lectura fallida: se reintenta luego.
  } finally {
    running = false;
  }
  if (updated > 0) listeners.forEach((l) => l());
  return updated;
}

const isOnline = (s: NetInfoState) => s.isConnected === true && s.isInternetReachable !== false;

/** Escucha la conectividad y vacía la cola al recuperar la señal. Devuelve la función para cancelar. */
export function startOfflineGeocoding(): () => void {
  let wasOnline = false;
  const unsubscribe = NetInfo.addEventListener((state) => {
    const online = isOnline(state);
    if (online && !wasOnline) void processGeocodingQueue();
    wasOnline = online;
  });
  return unsubscribe;
}
