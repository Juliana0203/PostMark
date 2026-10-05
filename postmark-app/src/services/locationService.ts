import * as Location from 'expo-location';
import type { StampLocation } from '../types/stamp';

export const UNKNOWN_LOCATION = 'Ubicación Desconocida';

export async function requestLocationPermission(): Promise<boolean> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  return status === Location.PermissionStatus.GRANTED;
}

export type PlaceInfo = Pick<StampLocation, 'placeName' | 'city' | 'country' | 'isoCountryCode'>;

/** Geocodificación inversa que lanza si no hay red o servicio; la usa la cola offline. */
export async function reverseGeocodeStrict(latitude: number, longitude: number): Promise<PlaceInfo> {
  const [place] = await Location.reverseGeocodeAsync({ latitude, longitude });
  if (!place) throw new Error('Sin resultados');
  const placeName = place.name && place.name !== place.street ? place.name : null;
  return {
    placeName: placeName ?? place.street ?? null,
    city: place.city ?? place.subregion ?? place.region ?? UNKNOWN_LOCATION,
    country: place.country ?? UNKNOWN_LOCATION,
    isoCountryCode: place.isoCountryCode ?? null,
  };
}

const OFFLINE_PLACE: PlaceInfo = { placeName: null, city: UNKNOWN_LOCATION, country: UNKNOWN_LOCATION, isoCountryCode: null };

/** Nunca lanza: sin red devuelve "Ubicación Desconocida" y `needsGeocoding: true`. */
export async function reverseGeocode(latitude: number, longitude: number): Promise<PlaceInfo & { needsGeocoding: boolean }> {
  try {
    return { ...(await reverseGeocodeStrict(latitude, longitude)), needsGeocoding: false };
  } catch (error) {
    // "Sin resultados" no se arregla reintentando; cualquier otro fallo (red, servicio) sí.
    const noResults = error instanceof Error && error.message === 'Sin resultados';
    return { ...OFFLINE_PLACE, needsGeocoding: !noResults };
  }
}

export type CurrentStampLocation = StampLocation & { needsGeocoding: boolean };

/** Posición GPS actual + geocodificación inversa. Nunca lanza por fallos de geocodificación. */
export async function getCurrentStampLocation(): Promise<CurrentStampLocation> {
  const { coords } = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
  const place = await reverseGeocode(coords.latitude, coords.longitude);
  return {
    latitude: coords.latitude,
    longitude: coords.longitude,
    altitude: coords.altitude,
    ...place,
  };
}