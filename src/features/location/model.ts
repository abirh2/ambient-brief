export interface AppLocation {
  id: string;
  name: string;
  admin1?: string;
  country: string;
  countryCode: string;
  latitude: number;
  longitude: number;
  timezone: string;
  source: 'device' | 'search' | 'saved';
}
