import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import type { StampItem } from '../types/stamp';

const STORAGE_KEY = '@postmark_stamps';

function newId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export async function getStamps(): Promise<StampItem[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as StampItem[]) : [];
  } catch {
    return [];
  }
}

export async function saveStamp(stamp: Omit<StampItem, 'id'>): Promise<StampItem> {
  const id = newId();
  const dir = `${FileSystem.documentDirectory}stamps/`;
  await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
  const ext = stamp.imageUri.split('?')[0].split('.').pop() || 'jpg';
  const destination = `${dir}${id}.${ext}`;
  await FileSystem.copyAsync({ from: stamp.imageUri, to: destination });

  const item: StampItem = { ...stamp, id, imageUri: destination };
  try {
    const stamps = await getStamps();
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([item, ...stamps]));
  } catch (error) {
    await FileSystem.deleteAsync(destination, { idempotent: true });
    throw error;
  }
  return item;
}
