import { z } from 'zod';

export const IslamicSettingsSchema = z.object({
  enabled: z.boolean(),
  showNextPrayer: z.boolean(),
  showHijriDate: z.boolean(),
  showFullSchedule: z.boolean(),
  calculationMethod: z.string(),
  asrMethod: z.string(),
});

export const AppLocationSchema = z.object({
  id: z.string(),
  name: z.string(),
  admin1: z.string().optional(),
  country: z.string().default(''),
  countryCode: z.string().default(''),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  timezone: z.string().default('UTC'),
  source: z.enum(['device', 'search', 'saved']),
});

export const NewsCategorySchema = z.enum([
  'Top',
  'U.S.',
  'World',
  'Business',
  'Technology',
  'Science',
  'Sports',
  'Entertainment',
]);

export const AppSettingsSchema = z.object({
  version: z.literal(2).default(2),
  useCurrentLocation: z.boolean(),
  savedLocation: z.string(),
  activeLocation: AppLocationSchema.optional(),
  temperatureUnit: z.enum(['fahrenheit', 'celsius']),
  timeFormat: z.enum(['12h', '24h']),
  newsCategories: z.array(NewsCategorySchema).max(3),
  showMarkets: z.boolean(),
  marketSymbols: z.array(z.string()).max(9),
  showSparklines: z.boolean(),
  backgroundMotion: z.enum(['living', 'subtle', 'static']),
  glassIntensity: z.number().min(0.1).max(1.0),
  contentDensity: z.enum(['comfortable', 'compact']),
  reducedMotion: z.boolean(),
  currencyEnabled: z.boolean(),
  currencyPair: z.string(),
  islamic: IslamicSettingsSchema,
  showDevWidthIndicator: z.boolean().optional(),
  alphaVantageApiKey: z.string().optional(),
  isDemoMode: z.boolean().default(false),
});

export const HourlyForecastSchema = z.object({
  time: z.string(),
  temp: z.number(),
  pop: z.number().min(0).max(100),
  iconName: z.string(),
});

export const WeatherDataSchema = z.object({
  temperature: z.number(),
  feelsLike: z.number(),
  high: z.number(),
  low: z.number(),
  condition: z.string(),
  iconName: z.string(),
  humidity: z.number(),
  windSpeedMph: z.number(),
  aqi: z.number(),
  uvIndex: z.number(),
  summaryNote: z.string().optional(),
  hourly: z.array(HourlyForecastSchema),
  sunrise: z.string().optional(),
  sunset: z.string().optional(),
  isDay: z.boolean().optional(),
  timezone: z.string().optional(),
});

export const NewsArticleSchema = z.object({
  id: z.string(),
  title: z.string(),
  summary: z.string(),
  category: z.string(),
  source: z.string(),
  publishedAt: z.string(),
  imageUrl: z.string().optional(),
});

export const MarketTickerSchema = z.object({
  symbol: z.string(),
  name: z.string(),
  category: z.enum(['index', 'stock', 'crypto', 'commodity']),
  price: z.number(),
  changePercent: z.number(),
  sparklineData: z.array(z.object({ time: z.string(), value: z.number() })),
});

export const CurrencyRateSchema = z.object({
  pair: z.string(),
  rate: z.number(),
  change24h: z.number(),
});
