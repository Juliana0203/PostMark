import * as FileSystem from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library/legacy';
import * as Sharing from 'expo-sharing';
import type { RefObject } from 'react';
import { captureRef } from 'react-native-view-shot';

export type SaveResult = 'saved' | 'denied' | 'error';

export interface CaptureSize {
  width: number;
  height: number;
}

/**
 * Captura la vista referenciada como PNG temporal y devuelve su URI local.
 * Con `size` (puntos lógicos) la salida mide `size × pixelRatio` px, sin depender de la pantalla;
 * sin `size` se usa la resolución nativa del dispositivo.
 */
export async function captureViewAsImage(
  viewRef: RefObject<unknown>,
  size?: CaptureSize,
  pixelRatio = 3,
): Promise<string> {
  if (!viewRef.current) throw new Error('La vista a exportar no está disponible.');
  return captureRef(viewRef as RefObject<never>, {
    format: 'png',
    quality: 1,
    result: 'tmpfile',
    ...(size ? { width: Math.round(size.width * pixelRatio), height: Math.round(size.height * pixelRatio) } : {}),
  });
}
/** Abre la hoja nativa de compartir. Devuelve false si el dispositivo no la soporta. */
export async function sharePostcardImage(imageUri: string): Promise<boolean> {
  if (!(await Sharing.isAvailableAsync())) return false;
  await Sharing.shareAsync(imageUri, { mimeType: 'image/png', dialogTitle: 'Compartir Postal', UTI: 'public.png' });
  return true;
}

/** Guarda en el carrete; solo pide permiso de escritura. */
export async function saveToPhotoLibrary(imageUri: string): Promise<SaveResult> {
  try {
    const permission = await MediaLibrary.requestPermissionsAsync(true);
    if (!permission.granted) return 'denied';
    await MediaLibrary.createAssetAsync(imageUri);
    return 'saved';
  } catch {
    return 'error';
  }
}

export const discardTempImage = (uri: string): Promise<void> =>
  FileSystem.deleteAsync(uri, { idempotent: true }).catch(() => undefined);

