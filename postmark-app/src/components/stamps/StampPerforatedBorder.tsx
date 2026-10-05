import { useId, type ReactNode } from 'react';
import Svg, { ClipPath, Defs, G, Image as SvgImage, Path } from 'react-native-svg';

export interface PhotoRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Props {
  width: number;
  height: number;
  toothRadius?: number;
  toothSpacing?: number;
  fillColor?: string;
  imageUri?: string;
  /** Zona de la foto dentro del sello; por defecto ocupa todo. */
  photoRect?: PhotoRect;
  /** Elementos SVG dibujados encima (filetes, textos). */
  children?: ReactNode;
}

/** Contorno rectangular con muescas semicirculares simétricas, centradas en cada celda. */
export function buildPerforatedPath(w: number, h: number, toothRadius: number, toothSpacing: number): string {
  const nx = Math.max(1, Math.round(w / toothSpacing));
  const ny = Math.max(1, Math.round(h / toothSpacing));
  const cw = w / nx;
  const ch = h / ny;
  const r = Math.min(toothRadius, cw * 0.45, ch * 0.45);
  const f = (n: number) => n.toFixed(2);
  const arc = (x: number, y: number) => `A${f(r)} ${f(r)} 0 0 0 ${f(x)} ${f(y)}`;

  let d = 'M0 0';
  for (let i = 0; i < nx; i++) {
    const cx = (i + 0.5) * cw;
    d += `L${f(cx - r)} 0${arc(cx + r, 0)}`;
  }
  d += `L${f(w)} 0`;
  for (let j = 0; j < ny; j++) {
    const cy = (j + 0.5) * ch;
    d += `L${f(w)} ${f(cy - r)}${arc(w, cy + r)}`;
  }
  d += `L${f(w)} ${f(h)}`;
  for (let i = nx - 1; i >= 0; i--) {
    const cx = (i + 0.5) * cw;
    d += `L${f(cx + r)} ${f(h)}${arc(cx - r, h)}`;
  }
  d += `L0 ${f(h)}`;
  for (let j = ny - 1; j >= 0; j--) {
    const cy = (j + 0.5) * ch;
    d += `L0 ${f(cy + r)}${arc(0, cy - r)}`;
  }
  return `${d}Z`;
}

export function StampPerforatedBorder({
  width,
  height,
  toothRadius = 4.5,
  toothSpacing = 12,
  fillColor = '#FAF7F2',
  imageUri,
  photoRect,
  children,
}: Props) {
  const clipId = `perf${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const d = buildPerforatedPath(width, height, toothRadius, toothSpacing);
  const photo = photoRect ?? { x: 0, y: 0, width, height };

  return (
    <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <Defs>
        <ClipPath id={clipId}>
          <Path d={d} />
        </ClipPath>
      </Defs>
      <Path d={d} fill={fillColor} />
      {imageUri ? (
        <G clipPath={`url(#${clipId})`}>
          <SvgImage
            x={photo.x}
            y={photo.y}
            width={photo.width}
            height={photo.height}
            href={{ uri: imageUri }}
            preserveAspectRatio="xMidYMid slice"
          />
        </G>
      ) : null}
      {children}
    </Svg>
  );
}
