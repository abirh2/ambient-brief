export function formatUvLabel(uvIndex: number | null): string {
  if (uvIndex === null) return 'Unavailable';
  if (uvIndex < 3) return 'Low';
  if (uvIndex < 6) return 'Moderate';
  if (uvIndex < 8) return 'High';
  if (uvIndex < 11) return 'Very high';
  return 'Extreme';
}
