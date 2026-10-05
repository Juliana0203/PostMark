import type { StampRecord } from '../types/stamp';

export interface StampCluster {
  /** Estable mientras los miembros no cambien. */
  key: string;
  latitude: number;
  longitude: number;
  stamps: StampRecord[];
}

/** Por debajo de este zoom (grados de latitud visibles) ya no se agrupa: se muestran los sellos sueltos. */
export const MIN_CLUSTER_DELTA = 0.002;
/** Fracción del ancho visible dentro de la cual dos sellos se agrupan (~ tamaño de un pin en pantalla). */
const CLUSTER_FRACTION = 0.1;

/** Agrupación voraz por cercanía en el plano lat/lon, proporcional al zoom actual. */
export function clusterStamps(stamps: StampRecord[], longitudeDelta: number): StampCluster[] {
  if (longitudeDelta <= MIN_CLUSTER_DELTA) {
    return stamps.map((s) => ({ key: s.id, latitude: s.location.latitude, longitude: s.location.longitude, stamps: [s] }));
  }
  const threshold = longitudeDelta * CLUSTER_FRACTION;
  const groups: { lat: number; lon: number; stamps: StampRecord[] }[] = [];
  for (const stamp of stamps) {
    const { latitude, longitude } = stamp.location;
    const group = groups.find((g) => Math.hypot(g.lat - latitude, g.lon - longitude) <= threshold);
    if (group) {
      group.stamps.push(stamp);
      const n = group.stamps.length;
      group.lat += (latitude - group.lat) / n;
      group.lon += (longitude - group.lon) / n;
    } else {
      groups.push({ lat: latitude, lon: longitude, stamps: [stamp] });
    }
  }
  return groups.map((g) => ({
    key: g.stamps.length === 1 ? g.stamps[0].id : `c:${g.stamps.map((s) => s.id).sort().join('|')}`,
    latitude: g.lat,
    longitude: g.lon,
    stamps: g.stamps,
  }));
}
