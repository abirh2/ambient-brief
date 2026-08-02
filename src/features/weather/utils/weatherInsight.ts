import { CurrentWeatherNormalized, HourlyWeatherNormalized } from '../types/weather';
import { TemperatureUnit } from '../../../lib/types';

export function generateWeatherInsight(
  current: CurrentWeatherNormalized,
  hourly: HourlyWeatherNormalized[],
  unit: TemperatureUnit = 'fahrenheit'
): string {
  if (!hourly || hourly.length === 0) {
    return `${current.conditionLabel} conditions expected.`;
  }

  // 1. Rain / Storm Precipitation Priority
  const rainItem = hourly.find(
    (h) =>
      h.precipitationProbability >= 40 ||
      ['rain', 'heavy-rain', 'freezing-rain', 'thunderstorm', 'thunderstorm-hail'].includes(
        h.condition
      )
  );

  if (rainItem) {
    if (['thunderstorm', 'thunderstorm-hail'].includes(rainItem.condition)) {
      return `Thunderstorms likely around ${rainItem.time}.`;
    }
    return `Rain becomes possible around ${rainItem.time}.`;
  }

  // 2. Significant Temperature Delta Priority
  const temps = hourly.map((h) => h.temperature);
  const minTemp = Math.min(...temps);
  const maxTemp = Math.max(...temps);

  const dropThreshold = unit === 'celsius' ? 4 : 7;

  if (current.temperature - minTemp >= dropThreshold) {
    const dropAmount = Math.round(current.temperature - minTemp);
    return `Temperatures fall about ${dropAmount}° by tonight.`;
  }

  if (maxTemp - current.temperature >= dropThreshold) {
    const riseAmount = Math.round(maxTemp - current.temperature);
    return `Temperatures rise about ${riseAmount}° by afternoon.`;
  }

  // 3. High Wind / Wind Gusts Priority
  const speedThreshold = unit === 'celsius' ? 35 : 22;
  const gustSpeed = current.windGust ?? current.windSpeed;
  const windUnit = unit === 'celsius' ? 'km/h' : 'mph';

  if (gustSpeed >= speedThreshold) {
    return `Wind gusts may reach ${Math.round(gustSpeed)} ${windUnit} today.`;
  }

  // 4. High UV Index Priority
  const uvPeakItem = [...hourly]
    .filter((h) => (h.uvIndex ?? 0) >= 6)
    .sort((a, b) => (b.uvIndex ?? 0) - (a.uvIndex ?? 0))[0];

  if (uvPeakItem) {
    return `High UV expected around ${uvPeakItem.time}.`;
  }

  // 5. Stable / Clear Condition Fallback
  if (current.condition === 'clear' || current.condition === 'mostly-clear') {
    return 'Clear conditions continue through the evening.';
  }

  if (current.condition === 'partly-cloudy' || current.condition === 'cloudy') {
    return 'Partly cloudy skies expected through the evening.';
  }

  return `${current.conditionLabel} expected through the evening.`;
}
