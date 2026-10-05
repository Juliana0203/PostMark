export function formatCoordinates(latitude: number, longitude: number): string {
  const part = (value: number, pos: string, neg: string) => {
    const abs = Math.abs(value);
    let deg = Math.floor(abs);
    let min = Math.round((abs - deg) * 60);
    if (min === 60) {
      deg += 1;
      min = 0;
    }
    return `${deg}°${String(min).padStart(2, '0')}'${value >= 0 ? pos : neg}`;
  };
  return `${part(latitude, 'N', 'S')} ${part(longitude, 'E', 'W')}`;
}

/** Sin permiso de ubicación la Fase 1 guarda 0,0: no se deben mostrar como coordenadas reales. */
export function hasRealCoordinates(latitude: number, longitude: number): boolean {
  return !(latitude === 0 && longitude === 0);
}

/** Texto para el matasellos: coordenadas compactas o un guion si no hay ubicación. */
export function postalCoordinates(latitude: number, longitude: number): string {
  return hasRealCoordinates(latitude, longitude) ? formatCoordinates(latitude, longitude) : 'SIN UBICACIÓN';
}
