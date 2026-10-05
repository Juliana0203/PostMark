const MONTHS = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];

/** `2026-10-05T…` → `05 OCT 2026` */
export function formatPostalDate(iso: string): string {
  const d = new Date(iso);
  const day = String(d.getDate()).padStart(2, '0');
  return `${day} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

/** Coordenadas compactas, p. ej. `4°35'N 74°04'W` */
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
