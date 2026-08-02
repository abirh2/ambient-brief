import type { AppLocation } from '../features/location/model';
import type { NewsCategory } from '../features/news/model';
import type { TemperatureUnit } from '../features/weather/model';

export type TimeFormat = '12h' | '24h';
export type BackgroundMotion = 'living' | 'subtle' | 'static';
export type ContentDensity = 'comfortable' | 'compact';

export interface IslamicSettings {
  enabled: boolean;
  showNextPrayer: boolean;
  showHijriDate: boolean;
  showFullSchedule: boolean;
  calculationMethod: string;
  asrMethod: string;
}

export interface AppSettings {
  version: 2;
  useCurrentLocation: boolean;
  savedLocation: string;
  activeLocation?: AppLocation;
  temperatureUnit: TemperatureUnit;
  timeFormat: TimeFormat;
  newsCategories: NewsCategory[];
  showMarkets: boolean;
  marketSymbols: string[];
  showSparklines: boolean;
  backgroundMotion: BackgroundMotion;
  glassIntensity: number;
  contentDensity: ContentDensity;
  reducedMotion: boolean;
  currencyEnabled: boolean;
  currencyPair: string;
  islamic: IslamicSettings;
  showDevWidthIndicator?: boolean;
  alphaVantageApiKey?: string;
  isDemoMode: boolean;
}
