export type AlertSeverity = 'advisory' | 'watch' | 'warning' | 'emergency';

export interface WeatherAlert {
  id: string;
  event: string;
  headline: string;
  description: string;
  instruction?: string;
  severity: 'minor' | 'moderate' | 'severe' | 'extreme' | 'unknown';
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
  source: 'National Weather Service';
}
