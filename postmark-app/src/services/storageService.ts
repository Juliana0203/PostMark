import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import type { StampItem, StampRecord } from '../types/stamp';

const STORAGE_KEY = '@postmark_stamps';
export const UNKNOWN_COUNTRY = 'Ubicación Desconocida';

function newId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

// Las escrituras (leer-modificar-guardar) se encadenan para no pisarse entre sí.
let queue: Promise<unknown> = Promise.resolve();
function serialized<T>(task: () => Promise<T>): Promise<T> {
  const run = queue.then(task, task);
  queue = run.catch(() => undefined);
  return run;
}

async function readAll(): Promise<StampRecord[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as StampRecord[]) : [];
  } catch {
    return [];
  }
}

const writeAll = (stamps: StampRecord[]) => AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(stamps));

/** Más recientes primero. */
export const getAllStamps = (): Promise<StampRecord[]> => readAll();
export const getStamps = getAllStamps;

export async function getStampsByCountry(): Promise<Record<string, StampRecord[]>> {
  const groups: Record<string, StampRecord[]> = {};
  for (const stamp of await readAll()) {
    const country = stamp.location.country?.trim() || UNKNOWN_COUNTRY;
    (groups[country] ??= []).push(stamp);
  }
  return groups;
}

export function saveStamp(stamp: Omit<StampItem, 'id'>): Promise<StampItem> {
  return serialized(async () => {
    const id = newId();
    const dir = `${FileSystem.documentDirectory}stamps/`;
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
    const ext = stamp.imageUri.split('?')[0].split('.').pop() || 'jpg';
    const destination = `${dir}${id}.${ext}`;
    await FileSystem.copyAsync({ from: stamp.imageUri, to: destination });

    const item: StampItem = { ...stamp, id, imageUri: destination };
    try {
      await writeAll([item, ...(await readAll())]);
    } catch (error) {
      await FileSystem.deleteAsync(destination, { idempotent: true });
      throw error;
    }
    return item;
  });
}

export function updateStamp(id: string, patch: Partial<Pick<StampRecord, 'note' | 'isFavorite'>>): Promise<void> {
  return serialized(async () => {
    const stamps = await readAll();
    await writeAll(stamps.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  });
}

export const updateStampNote = (id: string, note: string): Promise<void> => updateStamp(id, { note });

export function deleteStamp(id: string): Promise<void> {
  return serialized(async () => {
    const stamps = await readAll();
    const target = stamps.find((s) => s.id === id);
    await writeAll(stamps.filter((s) => s.id !== id));
    if (target) await FileSystem.deleteAsync(target.imageUri, { idempotent: true }).catch(() => undefined);
  });
}
