// ==================== 通用 ====================
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

// ==================== Admin 登录 ====================
export interface LoginParams {
  username: string;
  password: string;
}

export interface LoginResult {
  token: string;
  user: { id: string; username: string; role: string };
}

// ==================== 用户管理 ====================
export interface User {
  id: string;
  username: string;
  password?: string;
  department: string;
  role: string;
  status: 'active' | 'inactive';
  createdAt: string;
}

// ==================== 传感器阈值配置 ====================
export interface SensorThreshold {
  id: string;
  name: string;
  type: string;
  minValue: number;
  maxValue: number;
  alertLevel: 'warning' | 'danger';
  enabled: boolean;
}

// ==================== 融雪策略配置 ====================
export interface MeltStrategy {
  id: string;
  name: string;
  triggerType: 'auto' | 'manual' | 'schedule';
  tempThreshold: number;
  snowDetectEnabled: boolean;
  maxMeltDuration: number;
  scheduleTime?: string;
  enabled: boolean;
}

// ==================== 抓拍时长配置 ====================
export interface CaptureConfig {
  id: string;
  cameraName: string;
  captureDuration: number;
  captureInterval: number;
  storageDays: number;
  enabled: boolean;
}

// ==================== 日凌管理 ====================
export interface SunInterferenceRecord {
  id: string;
  year: number;
  startDate: string;
  endDate: string;
  peakTime: string;
  duration: number;
  impactLevel: 'low' | 'medium' | 'high';
  alertEnabled: boolean;
  status: 'upcoming' | 'active' | 'passed';
  notes?: string;
}

// ==================== 日志管理 ====================
export interface SystemLog {
  id: string;
  level: 'info' | 'warning' | 'error' | 'debug';
  module: string;
  message: string;
  detail: string;
  user?: string;
  ip?: string;
  createdAt: string;
}

// ==================== OTA模型管理 ====================
export interface OTAModel {
  id: string;
  name: string;
  version: string;
  description: string;
  fileSize: string;
  status: 'draft' | 'published' | 'deprecated';
  deviceType: string;
  createdAt: string;
  updatedAt: string;
}

// ==================== Dashboard 配置 ====================
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

// ==================== 设备数据 ====================
export interface Relay {
  id: number;
  name: string;
  state: boolean;
}

export interface TempSensor {
  id: number;
  name: string;
  value: number;
}

export interface SystemDetail {
  yaw: string;
  roll: string;
  pitch: string;
  power: string;
  energy: string;
  relays: Relay[];
  current: string;
  voltage: string;
  rainSnow: string;
  tempsensors: TempSensor[];
  airTemperature: number;
  potTemperature: number;
  signalStrength: string;
  organizationName: string;
}

export interface PowerChartParams {
  tag?: number;
  startTime?: string;
  endTime?: string;
  timeLevel?: 1 | 2;
}

export interface PowerChartItem {
  time: string;
  value: number;
}

export interface TemperatureChartItem {
  sensorName: string;
  time: string;
  temperature: number;
  maxTemperature?: number;
  minTemperature?: number;
  sampleCount?: number;
  timeLevel?: number;
}

// ==================== Dashboard 独立接口（备用）====================
export interface OverviewData {
  siteName: string;
  systemStatus: string;
  uptime: string;
  network: string;
  database: string;
  encryption: string;
}

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

export interface PowerData {
  voltage: string;
  current: string;
  yearlyConsumption: number;
  powerHistory: { data: number[]; labels: string[]; max: number };
}

export interface SunInterferenceData {
  status: string;
  todayAlert: boolean;
  nextPeriod: string;
  yearlyCount: number;
}

export interface PositionData {
  horizontal: string;
  vertical: string;
  status: string;
  signalAlertCount: number;
  offsetAlertCount: number;
}
