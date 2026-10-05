import { DeviceMotion } from 'expo-sensors';
import { useEffect } from 'react';
import { AppState } from 'react-native';
import { useDerivedValue, useSharedValue, withSpring, type DerivedValue, type SharedValue } from 'react-native-reanimated';

const MAX_X = 6;
const MAX_Y = 8;
const SPRING = { damping: 20, stiffness: 180, mass: 0.6 };
const RAD = 180 / Math.PI;

const clamp = (v: number, lim: number) => Math.max(-lim, Math.min(lim, v));

export interface DeviceTilt {
  /** Grados para rotateX (≈ -6…+6). */
  tiltX: SharedValue<number>;
  /** Grados para rotateY (≈ -8…+8). */
  tiltY: SharedValue<number>;
  /** 0…100: posición del brillo, opuesta a la inclinación. */
  glarePosition: DerivedValue<number>;
}

/**
 * Inclinación suavizada del dispositivo. El sensor solo está suscrito mientras
 * `active` sea true y la app esté en primer plano.
 */
export function useDeviceTilt(active: boolean): DeviceTilt {
  const tiltX = useSharedValue(0);
  const tiltY = useSharedValue(0);
  const glarePosition = useDerivedValue(() => Math.max(0, Math.min(100, 50 - (tiltY.value / MAX_Y) * 50)));

  useEffect(() => {
    let subscription: { remove: () => void } | null = null;
    let cancelled = false;

    const stop = () => {
      subscription?.remove();
      subscription = null;
      tiltX.value = withSpring(0, SPRING);
      tiltY.value = withSpring(0, SPRING);
    };

    const start = async () => {
      if (subscription || cancelled) return;
      try {
        if (!(await DeviceMotion.isAvailableAsync()) || cancelled || subscription) return;
      } catch {
        return;
      }
      DeviceMotion.setUpdateInterval(16);
      // Referencia relativa: la postura inicial del teléfono es la posición neutra.
      let base: { beta: number; gamma: number } | null = null;
      let fx = 0;
      let fy = 0;
      subscription = DeviceMotion.addListener(({ rotation }) => {
        if (!rotation) return;
        if (!base) base = { beta: rotation.beta, gamma: rotation.gamma };
        // La referencia deriva muy despacio para que el reposo vuelva al centro.
        base.beta += (rotation.beta - base.beta) * 0.002;
        base.gamma += (rotation.gamma - base.gamma) * 0.002;
        const targetX = clamp((rotation.beta - base.beta) * RAD * 0.35, MAX_X);
        const targetY = clamp((rotation.gamma - base.gamma) * RAD * 0.45, MAX_Y);
        // Filtro de paso bajo + resorte para eliminar el ruido del sensor.
        fx += (targetX - fx) * 0.25;
        fy += (targetY - fy) * 0.25;
        tiltX.value = withSpring(fx, SPRING);
        tiltY.value = withSpring(fy, SPRING);
      });
    };

    const sync = (state: string) => {
      if (active && state === 'active') void start();
      else stop();
    };

    sync(AppState.currentState);
    const appSub = AppState.addEventListener('change', sync);
    return () => {
      cancelled = true;
      appSub.remove();
      subscription?.remove();
      subscription = null;
    };
  }, [active, tiltX, tiltY]);

  return { tiltX, tiltY, glarePosition };
}
