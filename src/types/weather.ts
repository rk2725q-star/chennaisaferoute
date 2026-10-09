export type FloodRiskLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'EXTREME';

export interface ChennaiWeatherCurrent {
  time: string;
  temperature: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  windDirection: number;
  weatherCode: number;
  conditionText: string;
  icon: string;
  precipitationMm: number;
  isRaining: boolean;
}

export interface DailyForecastItem {
  date: string;
  dayName: string;
  weatherCode: number;
  conditionText: string;
  icon: string;
  tempMax: number;
  tempMin: number;
  precipSumMm: number;
  precipProbMax: number;
  windSpeedMax: number;
  floodRiskLevel: FloodRiskLevel;
}

export interface HourlyForecastItem {
  time: string;
  fullTime: string;
  temp: number;
  precipMm: number;
  precipProb: number;
  weatherCode: number;
  icon: string;
}

export interface ZoneWeatherItem {
  id: string;
  name: string;
  lat: number;
  lon: number;
  tempMax: number;
  precip24h: number;
  status: string;
}

export interface ChennaiForecastResponse {
  success: boolean;
  city: string;
  source: string;
  lastUpdated: string;
  current: ChennaiWeatherCurrent;
  daily: DailyForecastItem[];
  hourlyToday: HourlyForecastItem[];
  zones: ZoneWeatherItem[];
}
