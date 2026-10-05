export interface StampLocation {
  latitude: number;
  longitude: number;
  altitude?: number | null;
  placeName?: string | null;
  city: string;
  country: string;
  isoCountryCode?: string | null;
}

export interface StampItem {
  id: string;
  timestamp: string; // ISO String
  imageUri: string;
  location: StampLocation;
  isFavorite: boolean;
  /** Nota de viaje escrita en el dorso de la postal. */
  note?: string;
  /** Estilo del matasellos elegido para el dorso (por defecto 'classic'). */
  postmarkStyle?: 'classic' | 'customs' | 'airmail';
}

export type StampRecord = StampItem;
