import { WeatherCodeMapping } from '../types/weather';

export function mapWeatherCode(code: number, isDay: boolean = true): WeatherCodeMapping {
  switch (code) {
    case 0:
      return {
        condition: 'clear',
        label: 'Clear Sky',
        iconName: isDay ? 'Sun' : 'Moon',
        effectVariant: 'clear',
        description: 'Clear sky with unlimited visibility',
      };
    case 1:
      return {
        condition: 'mostly-clear',
        label: 'Mainly Clear',
        iconName: isDay ? 'Sun' : 'Moon',
        effectVariant: 'clear',
        description: 'Mostly clear conditions',
      };
    case 2:
      return {
        condition: 'partly-cloudy',
        label: 'Partly Cloudy',
        iconName: isDay ? 'SunCloud' : 'Cloud',
        effectVariant: 'cloudy',
        description: 'Partly cloudy skies',
      };
    case 3:
      return {
        condition: 'cloudy',
        label: 'Overcast',
        iconName: 'Cloud',
        effectVariant: 'cloudy',
        description: 'Overcast skies',
      };
    case 45:
      return {
        condition: 'fog',
        label: 'Foggy',
        iconName: 'CloudFog',
        effectVariant: 'fog',
        description: 'Foggy conditions reducing visibility',
      };
    case 48:
      return {
        condition: 'fog',
        label: 'Depositing Rime Fog',
        iconName: 'CloudFog',
        effectVariant: 'fog',
        description: 'Freezing fog depositing ice rime',
      };
    case 51:
      return {
        condition: 'drizzle',
        label: 'Light Drizzle',
        iconName: 'CloudDrizzle',
        effectVariant: 'rain',
        description: 'Light drizzle',
      };
    case 53:
      return {
        condition: 'drizzle',
        label: 'Moderate Drizzle',
        iconName: 'CloudDrizzle',
        effectVariant: 'rain',
        description: 'Moderate drizzle',
      };
    case 55:
      return {
        condition: 'drizzle',
        label: 'Dense Drizzle',
        iconName: 'CloudDrizzle',
        effectVariant: 'rain',
        description: 'Dense drizzle',
      };
    case 56:
    case 57:
      return {
        condition: 'freezing-rain',
        label: 'Freezing Drizzle',
        iconName: 'CloudDrizzle',
        effectVariant: 'rain',
        description: 'Freezing drizzle creates slippery surfaces',
      };
    case 61:
      return {
        condition: 'rain',
        label: 'Slight Rain',
        iconName: 'CloudRain',
        effectVariant: 'rain',
        description: 'Light continuous rain',
      };
    case 63:
      return {
        condition: 'rain',
        label: 'Moderate Rain',
        iconName: 'CloudRain',
        effectVariant: 'rain',
        description: 'Moderate rain',
      };
    case 65:
      return {
        condition: 'heavy-rain',
        label: 'Heavy Rain',
        iconName: 'CloudRain',
        effectVariant: 'rain',
        description: 'Heavy rainfall expected',
      };
    case 66:
    case 67:
      return {
        condition: 'freezing-rain',
        label: 'Freezing Rain',
        iconName: 'CloudRain',
        effectVariant: 'rain',
        description: 'Freezing rain causing icy conditions',
      };
    case 71:
      return {
        condition: 'snow',
        label: 'Slight Snow',
        iconName: 'CloudSnow',
        effectVariant: 'snow',
        description: 'Slight snow fall',
      };
    case 73:
      return {
        condition: 'snow',
        label: 'Moderate Snow',
        iconName: 'CloudSnow',
        effectVariant: 'snow',
        description: 'Moderate snow fall',
      };
    case 75:
      return {
        condition: 'snow',
        label: 'Heavy Snow',
        iconName: 'CloudSnow',
        effectVariant: 'snow',
        description: 'Heavy snowfall expected',
      };
    case 77:
      return {
        condition: 'snow',
        label: 'Snow Grains',
        iconName: 'CloudSnow',
        effectVariant: 'snow',
        description: 'Snow grains falling',
      };
    case 80:
    case 81:
      return {
        condition: 'rain',
        label: 'Rain Showers',
        iconName: 'CloudRain',
        effectVariant: 'rain',
        description: 'Passing rain showers',
      };
    case 82:
      return {
        condition: 'heavy-rain',
        label: 'Violent Rain Showers',
        iconName: 'CloudRain',
        effectVariant: 'rain',
        description: 'Heavy rain showers',
      };
    case 85:
    case 86:
      return {
        condition: 'snow-showers',
        label: 'Snow Showers',
        iconName: 'CloudSnow',
        effectVariant: 'snow',
        description: 'Passing snow showers',
      };
    case 95:
      return {
        condition: 'thunderstorm',
        label: 'Thunderstorm',
        iconName: 'CloudLightning',
        effectVariant: 'storm',
        description: 'Thunderstorm activity',
      };
    case 96:
    case 99:
      return {
        condition: 'thunderstorm-hail',
        label: 'Thunderstorm with Hail',
        iconName: 'CloudLightning',
        effectVariant: 'storm',
        description: 'Thunderstorm with hail',
      };
    default:
      return {
        condition: 'unknown',
        label: 'Variable',
        iconName: isDay ? 'SunCloud' : 'Cloud',
        effectVariant: 'clear',
        description: 'Variable weather conditions',
      };
  }
}
