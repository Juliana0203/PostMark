import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { ClipPath, Defs, G, Line, Mask, Path, Polygon, Rect, Circle, Text as SvgText } from 'react-native-svg';
import { formatPostalDate } from '../../utils/dateFormatter';
import { hashString, seededRandom } from '../../utils/seededRandom';
import { VintagePostmark } from './VintagePostmark';

export type PostmarkStyle = 'classic' | 'customs' | 'airmail';

export const POSTMARK_STYLES: { id: PostmarkStyle; label: string }[] = [
  { id: 'classic', label: 'Clásico' },
  { id: 'customs', label: 'Aduana' },
  { id: 'airmail', label: 'Par Avion' },
];

const NAVY = '#1B2A5C';
const BURGUNDY = '#7A1F2B';

interface MarkProps {
  cityName: string;
  countryName?: string;
  date: string | Date;
  coordinatesText: string;
  size?: number;
  seed?: string;
}

interface Props extends MarkProps {
  variant: PostmarkStyle;
}

/** Código IATA ficticio: iniciales si hay varias palabras, si no las primeras 3 letras. */
export function fakeIataCode(city: string): string {
  const clean = city
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z ]/g, '')
    .trim()
    .toUpperCase();
  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length === 0) return 'XXX';
  if (words.length >= 3) return words.slice(0, 3).map((w) => w[0]).join('');
  const letters = words.join('');
  return letters.padEnd(3, 'X').slice(0, 3);
}

function fit(text: string, max: number): string {
  const t = text.toUpperCase();
  return t.length > max ? `${t.slice(0, max - 1)}…` : t;
}

/** Puntos de desgaste deterministas para simular tinta de sello manual. */
function useWear(key: string, w: number, h: number) {
  return useMemo(() => {
    const rnd = seededRandom(hashString(`wear${key}`));
    const specks = Array.from({ length: 60 }, () => ({
      x: rnd() * w,
      y: rnd() * h,
      r: 0.4 + rnd() * Math.min(w, h) * 0.025,
      o: 0.4 + rnd() * 0.6,
    }));
    const scratches = Array.from({ length: 4 }, () => ({ x1: rnd() * w, y1: rnd() * h, x2: rnd() * w, y2: rnd() * h }));
    return {
      specks,
      scratches,
      rotation: -8 + rnd() * 16,
      // La tinta nunca se asienta pareja: cada tercio del sello tiene su propia opacidad.
      inkA: 0.6 + rnd() * 0.3,
      inkB: 0.5 + rnd() * 0.35,
      uid: `pv${hashString(key).toString(36)}`,
    };
  }, [key, w, h]);
}

function WearMask({ id, w, h, wear }: { id: string; w: number; h: number; wear: ReturnType<typeof useWear> }) {
  return (
    <Mask id={id} x="0" y="0" width={w} height={h}>
      <Rect x="0" y="0" width={w} height={h} fill="#fff" />
      {wear.specks.map((s, i) => (
        <Circle key={`s${i}`} cx={s.x} cy={s.y} r={s.r} fill="#000" opacity={s.o} />
      ))}
      {wear.scratches.map((s, i) => (
        <Line key={`l${i}`} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} stroke="#000" strokeWidth={0.6} />
      ))}
    </Mask>
  );
}

/** Franjas diagonales alternas azul marino / burdeos dentro del rectángulo dado. */
function Stripes({ x, y, w, h, band }: { x: number; y: number; w: number; h: number; band: number }) {
  const count = Math.ceil((w + h) / band) + 1;
  return (
    <>
      {Array.from({ length: count }, (_, i) => {
        const x0 = x + i * band - h;
        return (
          <Polygon
            key={i}
            points={`${x0},${y + h} ${x0 + band},${y + h} ${x0 + band + h},${y} ${x0 + h},${y}`}
            fill={i % 2 === 0 ? NAVY : BURGUNDY}
          />
        );
      })}
    </>
  );
}

function CustomsPostmark({ cityName, countryName, date, size = 120, seed }: MarkProps) {
  const color = '#2B2622';
  const dateText = formatPostalDate(date);
  const key = seed ?? `${cityName}|${dateText}`;
  const W = size * 1.5;
  const H = size;
  const wear = useWear(`c${key}`, W, H);
  const maskId = `${wear.uid}m`;
  const cut = H * 0.22;
  const oct = (inset: number) =>
    [
      [inset + cut, inset],
      [W - inset - cut, inset],
      [W - inset, inset + cut],
      [W - inset, H - inset - cut],
      [W - inset - cut, H - inset],
      [inset + cut, H - inset],
      [inset, H - inset - cut],
      [inset, inset + cut],
    ]
      .map((p) => p.join(','))
      .join(' ');
  const code = fakeIataCode(cityName);

  return (
    <View pointerEvents="none" style={{ width: W, height: H, transform: [{ rotate: `${wear.rotation.toFixed(1)}deg` }] }}>
      <Svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <Defs>
          <WearMask id={maskId} w={W} h={H} wear={wear} />
        </Defs>
        <G mask={`url(#${maskId})`}>
          <G opacity={wear.inkA}>
            <Polygon points={oct(H * 0.02)} fill="none" stroke={color} strokeWidth={H * 0.04} strokeLinejoin="round" />
            <Polygon points={oct(H * 0.09)} fill="none" stroke={color} strokeWidth={H * 0.018} strokeLinejoin="round" />
            <SvgText x={W / 2} y={H * 0.27} fill={color} fontSize={H * 0.1} fontWeight="bold" textAnchor="middle" letterSpacing={H * 0.012}>
              {'ADUANA · CUSTOMS'}
            </SvgText>
          </G>
          <G opacity={wear.inkB}>
            <Line x1={W * 0.16} y1={H * 0.31} x2={W * 0.84} y2={H * 0.31} stroke={color} strokeWidth={H * 0.02} />
            <SvgText x={W / 2} y={H * 0.63} fill={color} fontSize={H * 0.3} fontWeight="900" textAnchor="middle" letterSpacing={H * 0.03}>
              {code}
            </SvgText>
            <Line x1={W * 0.16} y1={H * 0.69} x2={W * 0.84} y2={H * 0.69} stroke={color} strokeWidth={H * 0.02} />
            <SvgText x={W / 2} y={H * 0.8} fill={color} fontSize={H * 0.1} fontWeight="bold" textAnchor="middle">
              {dateText}
            </SvgText>
            <SvgText x={W / 2} y={H * 0.9} fill={color} fontSize={H * 0.075} textAnchor="middle" letterSpacing={H * 0.008}>
              {fit(countryName ? `${cityName} · ${countryName}` : cityName, 26)}
            </SvgText>
          </G>
        </G>
      </Svg>
    </View>
  );
}

function AirMailPostmark({ cityName, date, size = 120, seed }: MarkProps) {
  const dateText = formatPostalDate(date);
  const key = seed ?? `${cityName}|${dateText}`;
  const W = size * 1.5;
  const H = size * 0.8;
  const wear = useWear(`a${key}`, W, H);
  const maskId = `${wear.uid}m`;
  const clipId = `${wear.uid}c`;
  const t = H * 0.14;
  const r = H * 0.1;
  const outer = `M${r} 0H${W - r}Q${W} 0 ${W} ${r}V${H - r}Q${W} ${H} ${W - r} ${H}H${r}Q0 ${H} 0 ${H - r}V${r}Q0 0 ${r} 0Z`;
  const inner = `M${r} ${t}H${W - r}V${H - t}H${r}Z`;
  return (
    <View pointerEvents="none" style={{ width: W, height: H, transform: [{ rotate: `${wear.rotation.toFixed(1)}deg` }] }}>
      <Svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <Defs>
          <WearMask id={maskId} w={W} h={H} wear={wear} />
          <ClipPath id={clipId}>
            <Path d={`${outer} ${inner}`} clipRule="evenodd" />
          </ClipPath>
        </Defs>
        <G mask={`url(#${maskId})`}>
          <G opacity={wear.inkA} clipPath={`url(#${clipId})`}>
            <Stripes x={0} y={0} w={W} h={H} band={H * 0.13} />
          </G>
          <G opacity={wear.inkB}>
            <SvgText x={W / 2} y={H * 0.5} fill={NAVY} fontSize={H * 0.2} fontWeight="900" textAnchor="middle" letterSpacing={H * 0.02}>
              {'PAR AVION'}
            </SvgText>
            <SvgText x={W / 2} y={H * 0.65} fill={BURGUNDY} fontSize={H * 0.11} fontWeight="bold" textAnchor="middle" letterSpacing={H * 0.03}>
              {'AIR MAIL'}
            </SvgText>
            <SvgText x={W / 2} y={H * 0.8} fill={NAVY} fontSize={H * 0.085} textAnchor="middle">
              {fit(`${cityName} · ${dateText}`, 28)}
            </SvgText>
          </G>
        </G>
      </Svg>
    </View>
  );
}

/** Matasellos en el estilo elegido. */
export function VintagePostmarkVariant({ variant, ...props }: Props) {
  if (variant === 'customs') return <CustomsPostmark {...props} />;
  if (variant === 'airmail') return <AirMailPostmark {...props} />;
  return <VintagePostmark {...props} />;
}

/** Franjas Par Avion en los bordes superior e inferior de la postal. */
export function AirMailBorder({ width, height }: { width: number; height: number }) {
  const band = Math.max(6, height * 0.045);
  const thick = Math.max(5, height * 0.035);
  const uid = 'airborder';
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <Defs>
          <ClipPath id={uid}>
            <Rect x={0} y={0} width={width} height={thick} />
            <Rect x={0} y={height - thick} width={width} height={thick} />
          </ClipPath>
        </Defs>
        <G opacity={0.85} clipPath={`url(#${uid})`}>
          <Stripes x={0} y={0} w={width} h={thick} band={band} />
          <Stripes x={0} y={height - thick} w={width} h={thick} band={band} />
        </G>
      </Svg>
    </View>
  );
}

interface PickerProps {
  value: PostmarkStyle;
  onChange: (style: PostmarkStyle) => void;
}

/** Selector de estilo de matasellos. */
export function PostmarkStylePicker({ value, onChange }: PickerProps) {
  return (
    <View style={styles.row}>
      {POSTMARK_STYLES.map((s) => {
        const active = s.id === value;
        return (
          <Pressable
            key={s.id}
            onPress={() => onChange(s.id)}
            style={[styles.chip, active ? styles.chipActive : null]}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
          >
            <Text style={[styles.chipText, active ? styles.chipTextActive : null]}>{s.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8, justifyContent: 'center' },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 16, borderWidth: 1, borderColor: '#8A8174', backgroundColor: 'rgba(246,241,231,0.9)' },
  chipActive: { backgroundColor: '#1A365D', borderColor: '#1A365D' },
  chipText: { color: '#3A3633', fontSize: 13 },
  chipTextActive: { color: '#F6F1E7' },
});
