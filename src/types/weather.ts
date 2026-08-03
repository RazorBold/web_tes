export interface WeatherStation {
  id: string;
  name: string;
  zone: string;
  lat: number;
  lng: number;
}

export interface WeatherCurrent {
  temperature: number;
  humidity: number;
  windSpeed: number;
  windDirection: number;
  rainfall: number;
  pressure: number;
  condition: string;
  observedAt: string;
}

export interface WeatherOverview {
  station: WeatherStation;
  current: WeatherCurrent;
  avgTemp: number;
  maxTemp: number;
  dailyRainfall: number;
  avgWindSpeed: number;
  hourlyTemp: { time: string; temperature: number }[];
  dailyRainfall7d: { date: string; rainfall: number }[];
}
