import { WeatherData, NewsArticle, WeatherAlert, IslamicDaylightInfo } from '../lib/types';

export const MOCK_WEATHER_ALERTS: Record<string, WeatherAlert> = {
  warning: {
    id: 'alert-severe-thunderstorm-warning',
    event: 'Severe Thunderstorm Warning',
    headline: 'Severe Thunderstorm Warning issued July 29 at 2:00 PM EDT expiring July 29 at 4:45 PM EDT by NWS',
    description: 'The National Weather Service in Mount Holly has issued a Severe Thunderstorm Warning for Southeastern Pennsylvania, including Delaware County and Philadelphia Metro. At 2:10 PM, severe thunderstorms producing damaging wind gusts up to 60 mph and quarter-sized hail were detected along a line extending from King of Prussia to Upper Darby, moving east at 35 mph. Torrential rainfall will cause rapid runoff and localized street flooding in poor drainage areas.',
    instruction: 'For your protection move to an interior room on the lowest floor of a sturdy building immediately.\nTorrential rainfall is occurring with these storms; do not drive your vehicle through flooded roadways.\nDisconnect sensitive electronic equipment and stay away from windows during high wind gusts.',
    severity: 'severe',
    certainty: 'Observed',
    urgency: 'Immediate',
    status: 'Actual',
    messageType: 'Alert',
    areaDescription: 'Delaware County & Surrounding Philadelphia Metro Area',
    effective: '2026-07-29T14:00:00-04:00',
    onset: '2026-07-29T14:00:00-04:00',
    expires: '2026-07-29T16:45:00-04:00',
    ends: '2026-07-29T16:45:00-04:00',
    senderName: 'National Weather Service',
    source: 'National Weather Service',
  },
  watch: {
    id: 'alert-severe-thunderstorm-watch',
    event: 'Severe Thunderstorm Watch',
    headline: 'Severe Thunderstorm Watch issued July 29 at 1:15 PM EDT expiring July 29 at 8:00 PM EDT by NWS',
    description: 'A Severe Thunderstorm Watch remains in effect until 8:00 PM EDT for the Delaware Valley and surrounding regions. Atmosphere remains unstable with high humidity and upper-level wind shear favoring scattered severe squall lines capable of producing isolated tornadoes, large hail, and wind gusts exceeding 65 mph.',
    instruction: 'Keep a battery-powered weather radio or mobile device charged and alerted.\nReview your emergency safety plan and identify interior shelter spaces.\nSecure loose outdoor items or furniture before thunderstorms approach.',
    severity: 'moderate',
    certainty: 'Possible',
    urgency: 'Future',
    status: 'Actual',
    messageType: 'Alert',
    areaDescription: 'Eastern Pennsylvania, Northern Delaware, and Southern New Jersey',
    effective: '2026-07-29T13:15:00-04:00',
    onset: '2026-07-29T13:15:00-04:00',
    expires: '2026-07-29T20:00:00-04:00',
    ends: '2026-07-29T20:00:00-04:00',
    senderName: 'National Weather Service',
    source: 'National Weather Service',
  },
  advisory: {
    id: 'alert-flood-advisory',
    event: 'Urban and Small Stream Flood Advisory',
    headline: 'Urban and Small Stream Flood Advisory issued July 29 at 2:30 PM EDT expiring July 29 at 6:00 PM EDT by NWS',
    description: 'NWS automated rain gauges indicate heavy rainfall due to slow-moving thunderstorms over Delaware County. Rainfall rates up to 1.5 inches per hour will cause minor ponding on roadways, underpasses, and urban intersections.',
    instruction: 'Allow extra braking distance and turn on headlights when driving in heavy rain.\nAvoid walking or riding bikes through standing water of unknown depth.',
    severity: 'minor',
    certainty: 'Likely',
    urgency: 'Expected',
    status: 'Actual',
    messageType: 'Alert',
    areaDescription: 'Delaware County and Philadelphia Urban Corridors',
    effective: '2026-07-29T14:30:00-04:00',
    onset: '2026-07-29T14:30:00-04:00',
    expires: '2026-07-29T18:00:00-04:00',
    ends: '2026-07-29T18:00:00-04:00',
    senderName: 'National Weather Service',
    source: 'National Weather Service',
  },
  emergency: {
    id: 'alert-flash-flood-emergency',
    event: 'Flash Flood Emergency',
    headline: 'Flash Flood Emergency issued July 29 at 2:15 PM EDT expiring July 29 at 5:30 PM EDT by NWS',
    description: 'THIS IS A FLASH FLOOD EMERGENCY FOR Delaware County and surrounding low-lying basins. Rapidly rising floodwaters are submerging roads and inundating structures. Seek higher ground immediately!',
    instruction: 'Move to higher ground IMMEDIATELY! This is an extremely dangerous and life-threatening situation.\nDo not travel unless fleeing an area subject to flooding or under an evacuation order.\nNever drive or walk into floodwaters.',
    severity: 'extreme',
    certainty: 'Observed',
    urgency: 'Immediate',
    status: 'Actual',
    messageType: 'Alert',
    areaDescription: 'Delaware River Basin & Low-Lying Coastal Outflows',
    effective: '2026-07-29T14:15:00-04:00',
    onset: '2026-07-29T14:15:00-04:00',
    expires: '2026-07-29T17:30:00-04:00',
    ends: '2026-07-29T17:30:00-04:00',
    senderName: 'National Weather Service',
    source: 'National Weather Service',
  },
};

export interface ContextBarData {
  aqi: number;
  aqiLabel: string;
  uvIndex: number;
  uvLabel: string;
  sunsetTime: string;
  timeToSunset: string;
  currencyPair: string;
  currencyRate: number;
  lastRefreshed: string;
}

export const AMBIENT_WEATHER_MOCK: WeatherData & { insightNote: string } = {
  temperature: 84,
  feelsLike: 88,
  high: 87,
  low: 72,
  condition: 'Partly Cloudy',
  iconName: 'SunCloud',
  humidity: 58,
  windSpeed: 9,
  windSpeedUnit: 'mph',
  uvIndex: 5,
  insightNote: 'Rain becomes possible around 5 PM',
  hourly: [
    { time: '3 PM', temp: 84, pop: 0, iconName: 'SunCloud' },
    { time: '4 PM', temp: 83, pop: 10, iconName: 'SunCloud' },
    { time: '5 PM', temp: 81, pop: 35, iconName: 'CloudRain' },
    { time: '6 PM', temp: 79, pop: 45, iconName: 'CloudRain' },
    { time: '7 PM', temp: 77, pop: 15, iconName: 'Cloud' },
    { time: '8 PM', temp: 76, pop: 5, iconName: 'Cloud' },
    { time: '9 PM', temp: 74, pop: 0, iconName: 'SunCloud' },
    { time: '10 PM', temp: 73, pop: 0, iconName: 'Moon' },
  ],
};

export const FEATURED_NEWS_STORY: NewsArticle = {
  id: 'featured-1',
  title: 'Federal Reserve signals cautious approach as markets await next rate decision',
  description: 'Officials emphasized that future decisions will depend on inflation and labor-market data.',
  categories: ['Top', 'Business'],
  publisher: 'Example Newsroom',
  publisherDomain: 'example.com',
  publishedAt: '2026-08-02T16:30:00.000Z',
  url: 'https://example.com/demo/federal-reserve',
  imageUrl: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=800&q=80',
};

export const SECONDARY_NEWS_STORIES: NewsArticle[] = [
  {
    id: 'news-sec-1',
    title: 'Major technology companies announce new investments in U.S. data centers',
    description: 'Multi-billion dollar infrastructure initiatives aim to scale AI compute across rural power hubs.',
    categories: ['Technology'],
    publisher: 'Example Newsroom',
    publisherDomain: 'example.com',
    publishedAt: '2026-08-02T16:15:00.000Z',
    url: 'https://example.com/demo/data-centers',
  },
  {
    id: 'news-sec-2',
    title: 'Severe storms disrupt travel across parts of the Northeast',
    description: 'Flight delays and regional highway slowdowns reported following swift summer squall lines.',
    categories: ['U.S.'],
    publisher: 'Example Newsroom',
    publisherDomain: 'example.com',
    publishedAt: '2026-08-02T16:00:00.000Z',
    url: 'https://example.com/demo/storms',
  },
  {
    id: 'news-sec-3',
    title: 'Global markets rise as investors review new earnings reports',
    description: 'Stronger corporate margins boost key indices across European and Asian trading sessions.',
    categories: ['Business'],
    publisher: 'Example Newsroom',
    publisherDomain: 'example.com',
    publishedAt: '2026-08-02T15:00:00.000Z',
    url: 'https://example.com/demo/global-markets',
  },
];

export const NEWS_CATEGORIES = ['Top', 'U.S.', 'World', 'Business', 'Technology'];

export const CONTEXT_BAR_MOCK: ContextBarData = {
  aqi: 42,
  aqiLabel: 'Good',
  uvIndex: 5,
  uvLabel: 'Moderate',
  sunsetTime: '8:07 PM',
  timeToSunset: '5h 54m',
  currencyPair: 'USD/BDT',
  currencyRate: 122.15,
  lastRefreshed: '2:12 PM',
};

export const ISLAMIC_DAYLIGHT_MOCK: IslamicDaylightInfo = {
  hijriDate: '14 Safar 1448',
  fajr: '4:31 AM',
  sunrise: '5:56 AM',
  dhuhr: '1:08 PM',
  asr: '5:18 PM',
  maghrib: '8:17 PM',
  isha: '9:42 PM',
  nextPrayer: 'Asr',
  timeRemainingNextPrayer: '1h 24m',
};
