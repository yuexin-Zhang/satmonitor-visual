
export interface WeatherData {
  temp: number;
  humidity: number;
  condition: string;
  date: string;
}

export interface OperationRecord {
  id: string;
  time: string;
  type: string;
  content: string;
  status: 'info' | 'warning' | 'error';
}

export interface InspectionRecord {
  id: string;
  time: string;
  code: string;
  description: string;
}

export interface AntennaInfo {
  name: string;
  satellite: string;
  azimuth: string;
  elevation: string;
  signalStrength: number[];
  dates: string[];
}
