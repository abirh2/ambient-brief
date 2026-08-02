import type { AppLocation, AppSettings } from '../types';

export const DEFAULT_LOCATION: AppLocation = {
  id: 'upper-darby-pa-us',
  name: 'Upper Darby',
  admin1: 'Pennsylvania',
  country: 'United States',
  countryCode: 'US',
  latitude: 39.9601,
  longitude: -75.2638,
  timezone: 'America/New_York',
  source: 'saved',
};

export const DEFAULT_SETTINGS: AppSettings = {
  version: 2,
  useCurrentLocation: true,
  savedLocation: 'Upper Darby, PA',
  activeLocation: DEFAULT_LOCATION,
  temperatureUnit: 'fahrenheit',
  timeFormat: '12h',
  newsCategories: ['Top', 'U.S.', 'Technology'],
  showMarkets: true,
  marketSymbols: ['SPY', 'DIA', 'QQQ', 'AAPL', 'MSFT', 'NVDA', 'AMZN', 'GOOGL', 'META'],
  showSparklines: true,
  backgroundMotion: 'subtle',
  glassIntensity: 0.65,
  contentDensity: 'comfortable',
  reducedMotion: false,
  currencyEnabled: true,
  currencyPair: 'USD/BDT',
  islamic: {
    enabled: false,
    showNextPrayer: true,
    showHijriDate: true,
    showFullSchedule: false,
    calculationMethod: 'ISNA',
    asrMethod: 'Hanafi',
  },
  showDevWidthIndicator: true,
  alphaVantageApiKey: '',
  isDemoMode: false,
};
