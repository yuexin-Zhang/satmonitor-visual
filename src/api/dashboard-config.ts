import { get, post } from './request';

export interface AntennaConfig {
  satellite: string;
  azimuth: string;
  elevation: string;
  frequency: { name: string; value: number; polarization: string; symbolRate: number };
  signalHistory: { data: number[]; labels: string[]; max: number };
  signalAlert: { status: string; count: number };
  displacement: { horizontal: string; vertical: string; status: string };
  offsetAlert: { count: number };
}

export interface SunInterferenceConfig {
  status: string;
  todayAlert: boolean;
  nextPeriod: string;
  yearlyCount: number;
}

export interface LiveVideoConfig {
  streamUrl: string;
  streamName: string;
  enabled: boolean;
}

export interface MaintenanceTipsConfig {
  enabled: boolean;
  isAlerting: boolean;
  message: string;
  alertMessage: string;
}

export interface EnvironmentConfig {
  weather: { day: string; condition: string; temp: number; humidity: number; icon: string }[];
  rainSnowSensor: { status: string; text: string };
  humidityAvg: number;
  yearlyStats: {
    snowForecastDays: number;
    snowDetectedCount: number;
    meltTests: number;
    meltExecutions: number;
  };
}

export interface PowerConfig {
  voltage: string;
  current: string;
  yearlyConsumption: number;
  powerHistory: { data: number[]; labels: string[]; max: number };
}

export interface OperationRecordConfig {
  id: string;
  date: string;
  time: string;
  code: string;
  title: string;
  subtitle: string;
  iconType: string;
}

export interface PositionConfig {
  horizontal: string;
  vertical: string;
  status: string;
  signalAlertCount: number;
  offsetAlertCount: number;
}

export interface DashboardConfig {
  siteName: string;
  antenna: AntennaConfig;
  sunInterference: SunInterferenceConfig;
  liveVideo: LiveVideoConfig;
  maintenanceTips: MaintenanceTipsConfig;
  environment: EnvironmentConfig;
  power: PowerConfig;
  operations: OperationRecordConfig[];
  position: PositionConfig;
  alertThresholds: {
    signalMin: number;
    tempMax: number;
    displacementMax: number;
  };
  heatingPolicy: string;
  notificationEnabled: boolean;
}

export const fetchDashboardConfig = () => get<DashboardConfig>('/dashboard/config');
export const saveDashboardConfig = (config: Partial<DashboardConfig>) => post<DashboardConfig>('/admin/config', config);
