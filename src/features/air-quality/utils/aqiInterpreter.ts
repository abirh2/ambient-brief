import { AirQualityCategory } from '../types';

export interface AqiInterpretation {
  category: AirQualityCategory;
  severity: 'low' | 'moderate' | 'high' | 'severe' | 'extreme' | 'unknown';
  label: string;
  guidance: string;
  description: string;
  colorClass: string;
  textClass: string;
  bgClass: string;
}

export function interpretAqi(aqi: number | null | undefined): AqiInterpretation {
  if (aqi === null || aqi === undefined || aqi < 0) {
    return {
      category: 'Unknown',
      severity: 'unknown',
      label: 'Unknown',
      guidance: 'Air quality data is currently unavailable for this location.',
      description: 'Unable to determine the current air quality index.',
      colorClass: 'text-slate-400 bg-slate-500/10 border-slate-500/20',
      textClass: 'text-slate-400',
      bgClass: 'bg-slate-500/10',
    };
  }

  if (aqi <= 50) {
    return {
      category: 'Good',
      severity: 'low',
      label: 'Good',
      guidance: 'Air quality is satisfactory, and air pollution poses little or no risk.',
      description: 'Ideal air quality for outdoor activities and opening windows.',
      colorClass: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      textClass: 'text-emerald-400',
      bgClass: 'bg-emerald-500/10',
    };
  }

  if (aqi <= 100) {
    return {
      category: 'Moderate',
      severity: 'moderate',
      label: 'Moderate',
      guidance: 'Air quality is acceptable. Unusually sensitive individuals should consider limiting prolonged outdoor exertion.',
      description: 'Acceptable air quality for most people, with light sensitivity precautions.',
      colorClass: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
      textClass: 'text-amber-400',
      bgClass: 'bg-amber-500/10',
    };
  }

  if (aqi <= 150) {
    return {
      category: 'Unhealthy for sensitive groups',
      severity: 'high',
      label: 'Unhealthy for Sensitive Groups',
      guidance: 'Members of sensitive groups may experience health effects. The general public is less likely to be affected.',
      description: 'Sensitive groups should reduce heavy or prolonged outdoor exertion.',
      colorClass: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
      textClass: 'text-orange-400',
      bgClass: 'bg-orange-500/10',
    };
  }

  if (aqi <= 200) {
    return {
      category: 'Unhealthy',
      severity: 'severe',
      label: 'Unhealthy',
      guidance: 'Everyone may begin to experience health effects; members of sensitive groups may experience more serious health effects.',
      description: 'Limit prolonged outdoor activities. Consider keeping windows closed.',
      colorClass: 'text-red-400 bg-red-500/10 border-red-500/20',
      textClass: 'text-red-400',
      bgClass: 'bg-red-500/10',
    };
  }

  if (aqi <= 300) {
    return {
      category: 'Very unhealthy',
      severity: 'extreme',
      label: 'Very Unhealthy',
      guidance: 'Health alert: The risk of health effects is significantly increased for everyone.',
      description: 'Avoid outdoor activities. Keep windows closed and run air filters if possible.',
      colorClass: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
      textClass: 'text-purple-400',
      bgClass: 'bg-purple-500/10',
    };
  }

  return {
    category: 'Hazardous',
    severity: 'extreme',
    label: 'Hazardous',
    guidance: 'Health warning of emergency conditions: everyone is more likely to be affected.',
    description: 'Stay indoors with closed doors and windows. Avoid physical exertion completely.',
    colorClass: 'text-rose-500 bg-rose-500/10 border-rose-500/20 animate-pulse',
    textClass: 'text-rose-400',
    bgClass: 'bg-rose-500/10',
  };
}
