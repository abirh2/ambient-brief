/**
 * Ambient Brief - Core Domain Types
 */

export type TemperatureUnit = 'fahrenheit' | 'celsius';
export type TimeFormat = '12h' | '24h';
export type BackgroundMotion = 'living' | 'subtle' | 'static';
export type ContentDensity = 'comfortable' | 'compact';

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

export type TimeOfDayVariant = 'morning' | 'day' | 'sunset' | 'night';
export type WeatherEffectVariant = 'clear' | 'cloudy' | 'rain' | 'snow' | 'storm' | 'fog';

export type NewsCategory =
  | 'Top'
  | 'U.S.'
  | 'World'
  | 'Business'
  | 'Technology'
  | 'Science'
  | 'Sports'
  | 'Entertainment';

export interface IslamicSettings {
  enabled: boolean;
  showNextPrayer: boolean;
  showHijriDate: boolean;
  showFullSchedule: boolean;
  calculationMethod: string;
  asrMethod: string;
}

export interface AppSettings {
  version: 1;
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
  glassIntensity: number; // 0.1 to 1.0
  contentDensity: ContentDensity;
  reducedMotion: boolean;
  currencyEnabled: boolean;
  currencyPair: string;
  islamic: IslamicSettings;
  showDevWidthIndicator?: boolean;
  alphaVantageApiKey?: string;
  guardianApiKey?: string;
  isDemoMode?: boolean;
}

export interface WeatherData {
  temperature: number;
  feelsLike: number;
  high: number;
  low: number;
  condition: string;
  iconName: string;
  humidity: number;
  windSpeedMph: number;
  aqi: number;
  uvIndex: number;
  summaryNote?: string;
  hourly: HourlyForecast[];
  alert?: WeatherAlert;
  sunrise?: string;
  sunset?: string;
  isDay?: boolean;
  timezone?: string;
}

export type AlertSeverity = 'advisory' | 'watch' | 'warning' | 'emergency';

export interface WeatherAlert {
  id: string;
  event: string;
  headline: string;
  description: string;
  instruction?: string;
  severity: "minor" | "moderate" | "severe" | "extreme" | "unknown";
  certainty: string;
  urgency: string;
  status: string;
  messageType: string;
  areaDescription: string;
  effective?: string;
  onset?: string;
  expires?: string;
  ends?: string;
  senderName?: string;
  source: "National Weather Service";
}

export interface HourlyForecast {
  time: string;
  temp: number;
  pop: number; // Probability of precipitation 0-100
  iconName: string;
  isoTime?: string;
}

export interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  category: string;
  source: string;
  publishedAt: string;
  imageUrl?: string;
  publisherDomain?: string;
  url?: string;
  rankingScore?: number;
  rankingReason?: string;
}

export interface MarketTicker {
  symbol: string;
  name: string;
  category: 'index' | 'stock' | 'crypto' | 'commodity';
  price: number;
  changePercent: number;
  sparklineData: Array<{ time: string; value: number }>;
}

export type InstrumentType = 'etf-proxy' | 'company';
export type DataStatus = 'end-of-day' | 'delayed' | 'stale';

export interface MarketInstrument {
  symbol: string;
  displayName: string;
  instrumentType: InstrumentType;
  proxyFor?: string;
  latestPrice: number;
  previousClose?: number;
  change?: number;
  changePercent?: number;
  priceDate: string;
  fetchedAt: string;
  dataStatus: DataStatus;
  source: 'Alpha Vantage';
  sparklineData?: Array<{ time: string; value: number }>;
  name?: string;
  category?: 'index' | 'stock' | 'crypto' | 'commodity';
  price?: number;
}

export interface ProviderUsage {
  provider: 'alpha-vantage';
  date: string;
  requestsAttempted: number;
  requestsSucceeded: number;
}

export interface CurrencyRate {
  pair: string;
  rate: number;
  change24h: number;
}

export interface IslamicDaylightInfo {
  hijriDate: string;
  fajr: string;
  sunrise: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
  nextPrayer: string;
  timeRemainingNextPrayer: string;
}

// Discriminated Unions for UI Visual States

export type WeatherStateStatus =
  | 'loaded'
  | 'loading'
  | 'permission_denied'
  | 'location_unavailable'
  | 'cached';

export type WeatherState =
  | { status: 'loaded'; data: WeatherData }
  | { status: 'loading' }
  | { status: 'permission_denied'; message?: string }
  | { status: 'location_unavailable'; message?: string }
  | { status: 'cached'; data: WeatherData; lastUpdatedText: string };

export type NewsStateStatus = 'loaded' | 'loading' | 'empty' | 'error' | 'cached';

export type NewsState =
  | { status: 'loaded'; featured: NewsArticle; secondary: NewsArticle[] }
  | { status: 'loading' }
  | { status: 'empty'; categoryName?: string }
  | { status: 'error'; errorMessage?: string }
  | { status: 'cached'; featured: NewsArticle; secondary: NewsArticle[]; lastUpdatedText: string };

export type MarketStateStatus = 'loaded' | 'loading' | 'delayed' | 'unavailable' | 'setup' | 'rate_limited' | 'quota_exhausted';

export type MarketState =
  | { status: 'loaded'; indices: MarketInstrument[]; stocks: MarketInstrument[]; sessionStatus?: string; usage?: ProviderUsage }
  | { status: 'loading' }
  | { status: 'delayed'; indices: MarketInstrument[]; stocks: MarketInstrument[]; lastUpdatedText: string; note: string; sessionStatus?: string; usage?: ProviderUsage }
  | { status: 'rate_limited'; message: string; usage?: ProviderUsage }
  | { status: 'quota_exhausted'; message: string; usage?: ProviderUsage }
  | { status: 'unavailable'; lastUpdatedText?: string; message?: string }
  | { status: 'setup'; message?: string };

export interface CurrencyPair {
  base: string;
  quote: string;
}

export interface ExchangeRate {
  base: string;
  quote: string;
  rate: number;
  date: string;
  fetchedAt: string;
}

export type PrayerName =
  | "fajr"
  | "sunrise"
  | "dhuhr"
  | "asr"
  | "maghrib"
  | "isha";

export interface PrayerTime {
  name: PrayerName;
  time: string;
  timestamp: Date;
}

export interface DailyPrayerSchedule {
  gregorianDate: string;
  hijriDate: {
    day: number;
    monthName: string;
    year: number;
    formatted: string;
  };
  timezone: string;
  prayers: PrayerTime[];
  calculationMethod: string;
  asrMethod: "standard" | "hanafi";
}


