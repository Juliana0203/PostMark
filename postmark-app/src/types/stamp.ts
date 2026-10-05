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
}
