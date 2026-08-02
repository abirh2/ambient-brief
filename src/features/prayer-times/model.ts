export type PrayerName = 'fajr' | 'sunrise' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';

export interface PrayerTime { name: PrayerName; time: string; timestamp: Date }

export interface DailyPrayerSchedule {
  gregorianDate: string;
  hijriDate: { day: number; monthName: string; year: number; formatted: string };
  timezone: string;
  prayers: PrayerTime[];
  calculationMethod: string;
  asrMethod: 'standard' | 'hanafi';
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
