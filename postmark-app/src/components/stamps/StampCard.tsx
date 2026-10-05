import { StyleSheet, View } from 'react-native';
import { Rect, Text as SvgText } from 'react-native-svg';
import { hashString } from '../../utils/seededRandom';
import { StampPerforatedBorder } from './StampPerforatedBorder';

interface Props {
  imageUri: string;
  country: string;
  width: number;
  /** Mantiene estable la denominación ficticia. */
  seed?: string;
}

const DENOMINATIONS = ['$ 500', '€ 1.20', '£ 0.80', '¥ 90', '$ 1.50'];
const INK = '#3A3633';
export const STAMP_ASPECT = 1.32;

export function StampCard({ imageUri, country, width, seed }: Props) {
  const height = width * STAMP_ASPECT;
  const margin = width * 0.1;
  const toothRadius = width * 0.026;
  const photo = { x: margin, y: margin, width: width - margin * 2, height: width * 1.0 };
  const label = `POSTMARK • ${country.toUpperCase()}`;
  const value = DENOMINATIONS[hashString(seed ?? country) % DENOMINATIONS.length];
  const fontSize = Math.min(width * 0.055, (width * 0.56) / (label.length * 0.62));
  const baseline = photo.y + photo.height + (height - photo.y - photo.height) * 0.6;

  return (
    <View style={[styles.shadow, { width, height }]}>
      <StampPerforatedBorder
        width={width}
        height={height}
        toothRadius={toothRadius}
        toothSpacing={toothRadius * 2.67}
        imageUri={imageUri}
        photoRect={photo}
      >
        <Rect
          x={margin * 0.55}
          y={margin * 0.55}
          width={width - margin * 1.1}
          height={height - margin * 1.1}
          fill="none"
          stroke={INK}
          strokeWidth={1}
          opacity={0.55}
        />
        <SvgText x={margin} y={baseline} fill={INK} fontSize={fontSize} fontFamily="Georgia" fontWeight="bold">
          {label}
        </SvgText>
        <SvgText x={width - margin} y={baseline} fill={INK} fontSize={fontSize * 1.25} fontFamily="Georgia" fontWeight="bold" textAnchor="end">
          {value}
        </SvgText>
      </StampPerforatedBorder>
    </View>
  );
}

const styles = StyleSheet.create({
  shadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
});
