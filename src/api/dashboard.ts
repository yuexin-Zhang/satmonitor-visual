import { get } from './request';

// 驾驶舱总览
export interface OverviewData {
  siteName: string;
  systemStatus: string;
  uptime: string;
  network: string;
  database: string;
  encryption: string;
}
export const fetchOverview = () => get<OverviewData>('/dashboard/overview');

// 天线信息
export interface AntennaData {
  satellite: string;
  azimuth: string;
  elevation: string;
  frequency: { name: string; value: number; polarization: string; symbolRate: number };
  signalHistory: { data: number[]; labels: string[]; max: number };
  signalAlert: { status: string; count: number };
  displacement: { horizontal: string; vertical: string; status: string };
  offsetAlert: { count: number };
}
export const fetchAntenna = () => get<AntennaData>('/dashboard/antenna');

// 环境信息
export interface EnvironmentData {
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
export const fetchEnvironment = () => get<EnvironmentData>('/dashboard/environment');

// 电源信息
export interface PowerData {
  voltage: string;
  current: string;
  yearlyConsumption: number;
  powerHistory: { data: number[]; labels: string[]; max: number };
}
export const fetchPower = () => get<PowerData>('/dashboard/power');

// 运维记录
export interface OperationRecord {
  id: string;
  date: string;
  time: string;
  code: string;
  title: string;
  subtitle: string;
  iconType: string;
}
export const fetchOperations = () => get<OperationRecord[]>('/dashboard/operations');

// 日凌信息
export interface SunInterferenceData {
  status: string;
  todayAlert: boolean;
  nextPeriod: string;
  yearlyCount: number;
}
export const fetchSunInterference = () => get<SunInterferenceData>('/dashboard/sun-interference');

// 位移状况
export interface PositionData {
  horizontal: string;
  vertical: string;
  status: string;
  signalAlertCount: number;
  offsetAlertCount: number;
}
export const fetchPosition = () => get<PositionData>('/dashboard/position');

