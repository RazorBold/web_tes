export interface RoomType {
  id: string;
  keyName: string;
  displayName: string;
  tempMin: number;
  tempMax: number;
  humidityMin: number;
  humidityMax: number;
}

export interface RoomStatus {
  id: string;
  name: string;
  roomTypeName: string;
  temperature: number;
  humidity: number;
  ok: boolean;
}

export interface TempHumOverview {
  avgTemp: number;
  avgHumidity: number;
  tempHistory: number[];
  humidityHistory: number[];
}
