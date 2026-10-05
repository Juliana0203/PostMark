import { useMemo } from 'react';
import { View } from 'react-native';
import Svg, { Circle, G, Line, Mask, Path, Rect, Text as SvgText, TextPath, Defs } from 'react-native-svg';
import { formatPostalDate } from '../../utils/dateFormatter';
import { hashString, seededRandom } from '../../utils/seededRandom';

interface Props {
  cityName: string;
  countryName?: string;
  date: string | Date;
  coordinatesText: string;
  color?: string;
  /** Diámetro del círculo; el componente completo mide `size * 1.9` de ancho. */
  size?: number;
  /** Semilla para rotación y desgaste deterministas (p. ej. el id de la estampilla). */
  seed?: string;
}

export const POSTMARK_ASPECT = 1.9;

function wavePath(x0: number, x1: number, y: number, amp: number, wavelength: number, phase: number): string {
  const step = wavelength / 8;
  let d = '';
  for (let x = x0, i = 0; x <= x1; x += step, i++) {
    const py = y + amp * Math.sin(((x - x0) / wavelength) * Math.PI * 2 + phase);
    d += `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${py.toFixed(1)}`;
  }
  return d;
}

function fit(text: string, max: number): string {
  const t = text.toUpperCase();
  return t.length > max ? `${t.slice(0, max - 1)}…` : t;
}

export function VintagePostmark({
  cityName,
  countryName,
  date,
  coordinatesText,
  color = '#262422',
  size = 120,
  seed,
}: Props) {
  const dateText = formatPostalDate(date);
  const key = seed ?? `${cityName}|${dateText}`;

  const { rotation, specks, scratches, uid } = useMemo(() => {
    const rnd = seededRandom(hashString(key));
    const R = size / 2;
    const rot = -12 + rnd() * 24;
    const sp = Array.from({ length: 45 }, () => ({
      x: rnd() * size * POSTMARK_ASPECT,
      y: rnd() * size,
      r: 0.4 + rnd() * R * 0.05,
    }));
    const sc = Array.from({ length: 4 }, () => ({
      x1: rnd() * size * POSTMARK_ASPECT,
      y1: rnd() * size,
      x2: rnd() * size * POSTMARK_ASPECT,
      y2: rnd() * size,
    }));
    return { rotation: rot, specks: sp, scratches: sc, uid: `pm${hashString(key).toString(36)}` };
  }, [key, size]);

  const W = size * POSTMARK_ASPECT;
  const R = size / 2;
  const cx = W - R;
  const cy = R;
  const label = fit(countryName ? `${cityName} • ${countryName}` : cityName, 24);
  const labelSize = (R * 0.13 * Math.min(1, 18 / label.length)) || R * 0.1;
  const topR = R * 0.7;
  const bottomR = R * 0.83;
  const topId = `${uid}t`;
  const bottomId = `${uid}b`;
  const maskId = `${uid}m`;
  const coords = fit(coordinatesText, 18);

  return (
    <View pointerEvents="none" style={{ width: W, height: size, opacity: 0.86, transform: [{ rotate: `${rotation.toFixed(1)}deg` }] }}>
      <Svg width={W} height={size} viewBox={`0 0 ${W} ${size}`}>
        <Defs>
          <Path id={topId} d={`M${cx - topR} ${cy}A${topR} ${topR} 0 0 1 ${cx + topR} ${cy}`} />
          <Path id={bottomId} d={`M${cx - bottomR} ${cy}A${bottomR} ${bottomR} 0 0 0 ${cx + bottomR} ${cy}`} />
          <Mask id={maskId} x="0" y="0" width={W} height={size}>
            <Rect x="0" y="0" width={W} height={size} fill="#fff" />
            {specks.map((s, i) => (
              <Circle key={`s${i}`} cx={s.x} cy={s.y} r={s.r} fill="#000" />
            ))}
            {scratches.map((s, i) => (
              <Line key={`l${i}`} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} stroke="#000" strokeWidth={0.6} />
            ))}
          </Mask>
        </Defs>
        <G mask={`url(#${maskId})`}>
          <Circle cx={cx} cy={cy} r={R * 0.97} fill="none" stroke={color} strokeWidth={R * 0.035} strokeDasharray={`${R * 0.9} ${R * 0.05} ${R * 0.4} ${R * 0.04}`} />
          <Circle cx={cx + R * 0.012} cy={cy - R * 0.01} r={R * 0.64} fill="none" stroke={color} strokeWidth={R * 0.025} strokeDasharray={`${R * 0.25} ${R * 0.03}`} />
          <SvgText fill={color} fontSize={labelSize} fontWeight="bold" fontFamily="Courier" letterSpacing={labelSize * 0.1}>
            <TextPath href={`#${topId}`} startOffset="50%" textAnchor="middle">
              {label}
            </TextPath>
          </SvgText>
          <SvgText fill={color} fontSize={R * 0.11} fontFamily="Courier" letterSpacing={R * 0.02}>
            <TextPath href={`#${bottomId}`} startOffset="50%" textAnchor="middle">
              {coords}
            </TextPath>
          </SvgText>
          <Line x1={cx - R * 0.5} y1={cy - R * 0.2} x2={cx + R * 0.5} y2={cy - R * 0.2} stroke={color} strokeWidth={R * 0.03} />
          <SvgText x={cx} y={cy + R * 0.07} fill={color} fontSize={R * 0.17} fontWeight="bold" fontFamily="Courier" textAnchor="middle">
            {dateText}
          </SvgText>
          <Line x1={cx - R * 0.5} y1={cy + R * 0.2} x2={cx + R * 0.5} y2={cy + R * 0.2} stroke={color} strokeWidth={R * 0.03} />
          {[-0.36, 0, 0.36].map((off, i) => (
            <Path
              key={i}
              d={wavePath(2, cx - R * 0.97, cy + R * off, R * 0.08, R * 0.42, i)}
              fill="none"
              stroke={color}
              strokeWidth={R * 0.04}
              strokeLinecap="round"
              opacity={0.9 - i * 0.1}
            />
          ))}
        </G>
      </Svg>
    </View>
  );
}
