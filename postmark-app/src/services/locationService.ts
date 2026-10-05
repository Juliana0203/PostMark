import * as Location from 'expo-location';
import type { StampLocation } from '../types/stamp';

export const UNKNOWN_LOCATION = 'Ubicación Desconocida';

export async function requestLocationPermission(): Promise<boolean> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  return status === Location.PermissionStatus.GRANTED;
}

export async function reverseGeocode(
  latitude: number,
  longitude: number,
): Promise<Pick<StampLocation, 'placeName' | 'city' | 'country' | 'isoCountryCode'>> {
  try {
    const [place] = await Location.reverseGeocodeAsync({ latitude, longitude });
    if (!place) throw new Error('Sin resultados');
    const placeName = place.name && place.name !== place.street ? place.name : null;
    return {
      placeName: placeName ?? place.street ?? null,
      city: place.city ?? place.subregion ?? place.region ?? UNKNOWN_LOCATION,
      country: place.country ?? UNKNOWN_LOCATION,
      isoCountryCode: place.isoCountryCode ?? null,
    };
  } catch {
    // Sin red o geocodificador no disponible: se conservan las coordenadas.
    return { placeName: null, city: UNKNOWN_LOCATION, country: UNKNOWN_LOCATION, isoCountryCode: null };
  }
}

/** Posición GPS actual + geocodificación inversa. Nunca lanza por fallos de geocodificación. */
export async function getCurrentStampLocation(): Promise<StampLocation> {
  const { coords } = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
  const place = await reverseGeocode(coords.latitude, coords.longitude);
  return {
    latitude: coords.latitude,
    longitude: coords.longitude,
    altitude: coords.altitude,
    ...place,
  };
}
