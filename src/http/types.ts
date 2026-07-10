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

// ==================== Snow 实时数据查询参数 ====================
export interface SnowHistoryParams {
  tag?: number;
  startTime?: string;
  endTime?: string;
  timeLevel?: 1 | 2;
}

// /v1/snow/data-history 系统数据历史记录（折线图，多指标）
export interface SnowDataHistoryItem {
  time: string;
  // 各指标值：signalStrength / airTemperature / potTemperature / voltage / current / power ...
  [metric: string]: string | number;
}

// /v1/snow/extra-info 扩展信息（后端自定义结构，前端按需读取）
export type SnowExtraInfo = Record<string, any>;

// /v1/sat/dashboard/energy-stats 能耗统计（后端自定义结构）
export type DashboardEnergyStats = Record<string, any>;

// /v1/sat/dashboard/risk-stats 风险事件统计（后端自定义结构）
export type DashboardRiskStats = Record<string, any>;

// ==================== 111.天气数据 ====================
// /v1/sat/weather/forecast 单日天气预报
export interface SatWeatherDayVO {
  condition: string;  // 天气状况
  temp: number;       // 最高温度(℃)
  icon: string;       // 图标标识(Sun/Cloud/CloudRain等)
}

// /v1/sat/weather/forecast 三天天气预报
export interface SatWeatherForecastVO {
  stationId: number;
  today: SatWeatherDayVO;
  tomorrow: SatWeatherDayVO;
  dayAfterTomorrow: SatWeatherDayVO;
}

// ==================== 112.环境数据 ====================
// /v1/sat/environment/current 当前环境数据
export interface SatEnvironmentCurrentVO {
  stationId: number;
  organizationName: string;  // 台站名称
  humidity: number;          // 环境湿度(%)
  airTemperature: number;    // 空气温度(℃)
  rainSnow: string;          // 雨雪状态
}

// /v1/sat/environment/stats 环境统计(雪天等)
export interface SatEnvironmentStatsVO {
  stationId: number;
  year: number;              // 统计年份
  snowForecastDays: number;  // 天气预测有雪天数
  snowDetectedCount: number; // 实测有雪累计次数
}

// ==================== 113.日凌干扰 ====================
// /v1/sat/sun-interference/status 日凌干扰状态
export interface SatSunInterferenceVO {
  stationId: number;
  todayAlert: boolean;  // 今日是否有日凌预警
  nextPeriod: string;   // 距离最近日凌时间窗口
  yearlyCount: number;  // 本年度日凌预警累计次数
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

// ====================================================================
// 以下为 Admin 管理后台真实接口类型（基于 Swagger schema）
// ====================================================================

// ==================== 通用分页 ====================
export interface PageResult<T> {
  list: T[];
  total: number;
}

export interface PageQuery {
  pageNum: number;
  pageSize: number;
}

// ==================== 认证 ====================
export interface AuthToken {
  tokenType?: string;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface CaptchaInfo {
  captchaKey: string;
  captchaBase64: string;
}

export interface CurrentUser {
  userId: number;
  username: string;
  nickname: string;
  avatar?: string;
  roles?: string[];
  perms?: string[];
  allStationsAccess?: boolean;
  stationId?: number;
  stationName?: string;
  stationTag?: number;
}

export interface LoginQuery {
  username: string;
  password: string;
  captchaKey?: string;
  captchaCode?: string;
}

// ==================== 用户 ====================
export interface UserPageVO {
  id: number;
  username: string;
  nickname: string;
  mobile?: string;
  gender?: number;
  avatar?: string;
  email?: string;
  status: number;
  deptName?: string;
  roleNames?: string;
  createTime?: string;
}

export interface UserForm {
  id?: number;
  username: string;
  nickname: string;
  mobile?: string;
  gender?: number;
  avatar?: string;
  email?: string;
  status?: number;
  deptId?: number;
  stationId?: number;
  roleIds: number[];
  openId?: string;
}

export interface UserProfileVO {
  id: number;
  username: string;
  nickname: string;
  avatar?: string;
  gender?: number;
  mobile?: string;
  email?: string;
  deptName?: string;
  roleNames?: string;
  createTime?: string;
}

export interface UserProfileForm {
  id?: number;
  username?: string;
  nickname?: string;
  avatar?: string;
  gender?: number;
  mobile?: string;
  email?: string;
}

export interface PasswordUpdateForm {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// ==================== 角色 ====================
export interface RolePageVO {
  id: number;
  name: string;
  code: string;
  status: number;
  sort?: number;
  createTime?: string;
  updateTime?: string;
}

export interface RoleForm {
  id?: number;
  name: string;
  code: string;
  sort?: number;
  status?: number;
  dataScope?: number;
}

// ==================== 下拉选项 ====================
export interface OptionLong {
  value: number;
  label: string;
  tag?: string;
  children?: OptionLong[];
}

// ==================== 菜单 ====================
export interface MenuVO {
  id: number;
  parentId?: number;
  name: string;
  type?: number;
  routeName?: string;
  routePath?: string;
  component?: string;
  sort?: number;
  visible?: number;
  icon?: string;
  redirect?: string;
  perm?: string;
  children?: MenuVO[];
}

export interface MenuForm {
  id?: number;
  parentId?: number;
  name: string;
  type?: number;
  routeName?: string;
  routePath?: string;
  component?: string;
  perm?: string;
  visible?: number;
  sort?: number;
  icon?: string;
  redirect?: string;
  keepAlive?: number;
  alwaysShow?: number;
}

// ==================== 部门 ====================
export interface DeptVO {
  id: number;
  parentId?: number;
  name: string;
  code?: string;
  sort?: number;
  status: number;
  children?: DeptVO[];
  createTime?: string;
  updateTime?: string;
}

export interface DeptForm {
  id?: number;
  name: string;
  code?: string;
  parentId: number;
  status?: number;
  sort?: number;
}

// ==================== 字典 ====================
export interface DictPageVO {
  id: number;
  name: string;
  dictCode: string;
  status: number;
}

export interface DictForm {
  id?: number;
  name?: string;
  dictCode: string;
  remark?: string;
  status?: number;
}

export interface DictItemPageVO {
  id: number;
  dictCode: string;
  label: string;
  value: string;
  sort?: number;
  status: number;
}

export interface DictItemForm {
  id?: number;
  dictCode?: string;
  value?: string;
  label?: string;
  sort?: number;
  status?: number;
  tagType?: string;
}

export interface DictItemOptionVO {
  value: string;
  label: string;
  tagType?: string;
}

// ==================== 通知公告 ====================
export interface NoticePageVO {
  id: number;
  title: string;
  publishStatus: number;
  type?: number;
  publisherName?: string;
  level?: string;
  publishTime?: string;
  isRead?: number;
  targetType?: number;
  createTime?: string;
  revokeTime?: string;
}

export interface NoticeForm {
  id?: number;
  title: string;
  content: string;
  type?: number;
  level?: string;
  targetType?: number;
  targetUserIds?: number[];
}

export interface NoticeDetailVO {
  id: number;
  title: string;
  content: string;
  type?: number;
  publisherName?: string;
  level?: string;
  publishStatus: number;
  publishTime?: string;
}

// ==================== 系统配置 ====================
export interface ConfigVO {
  id: number;
  configName: string;
  configKey: string;
  configValue: string;
  remark?: string;
}

export interface ConfigForm {
  id?: number;
  configName: string;
  configKey: string;
  configValue: string;
  remark?: string;
}

// ==================== 日志 ====================
export interface LogPageVO {
  id: number;
  module?: string;
  content?: string;
  requestUri?: string;
  method?: string;
  ip?: string;
  region?: string;
  browser?: string;
  os?: string;
  executionTime?: number;
  createBy?: number;
  createTime?: string;
  operator?: string;
}

export interface VisitStatsVO {
  todayUvCount: number;
  totalUvCount: number;
  uvGrowthRate?: number;
  todayPvCount: number;
  totalPvCount: number;
  pvGrowthRate?: number;
}

export interface VisitTrendVO {
  dates: string[];
  pvList: number[];
  ipList: number[];
}

// ==================== 台站 ====================
export interface SatStationPageVO {
  id: number;
  tag?: number;
  name: string;
  code?: string;
  address?: string;
  longitude?: number;
  latitude?: number;
  region?: string;
  manager?: string;
  managerPhone?: string;
  deviceIp?: string;
  status: number;
  remark?: string;
  createTime?: string;
  updateTime?: string;
  onlineStatus?: number;
  alarmCount?: number;
  todaySnowCount?: number;
  deviceCount?: number;
}

export interface SatStationForm {
  id?: number;
  tag?: number;
  name?: string;
  code?: string;
  address?: string;
  longitude?: number;
  latitude?: number;
  region?: string;
  manager?: string;
  managerPhone?: string;
  deviceIp?: string;
  status?: number;
  remark?: string;
}

export interface SatStationOverviewVO {
  stationId: number;
  tag?: number;
  stationName: string;
  onlineStatus?: number;
  alarmCount?: number;
  todaySnowCount?: number;
  realtimeData?: any;
  lastReportTime?: string;
}

export interface OptionString {
  value: string;
  label: string;
}

// ==================== 看板 ====================
export interface SatDashboardOverviewVO {
  totalStations: number;
  onlineStations: number;
  activeAlarms: number;
  todaySnowExecCount: number;
  deviceOnlineRate?: number;
  alarmCloseRate?: number;
  avgHandleMinutes?: number;
  stationList?: SatStationOverviewVO[];
  regionDistribution?: Record<string, number>;
}

// ==================== 设备 ====================
export interface SatDevicePageVO {
  id: number;
  stationId?: number;
  stationName?: string;
  deviceType?: string;
  deviceCode?: string;
  name: string;
  location?: string;
  serialNo?: string;
  installTime?: string;
  onlineStatus?: number;
  runStatus?: number;
  lastReportTime?: string;
  remark?: string;
}

export interface SatDeviceForm {
  id?: number;
  stationId?: number;
  deviceType?: string;
  deviceCode?: string;
  name?: string;
  location?: string;
  serialNo?: string;
  installTime?: string;
  remark?: string;
}

// ==================== 阈值 ====================
export interface SatThresholdVO {
  id: number;
  stationId: number;
  config?: any;
  version?: number;
  syncStatus?: number;
  syncTime?: string;
  updateTime?: string;
}

export interface SatThresholdForm {
  stationId: number;
  config?: any;
}

export interface SatThresholdVersionVO {
  id: number;
  stationId: number;
  version: number;
  config?: any;
  createTime?: string;
}

// ==================== 融雪策略 ====================
export interface SatSnowStrategyVO {
  id: number;
  stationId: number;
  name?: string;
  config?: any;
  runMode?: number;
  version?: number;
  syncStatus?: number;
  updateTime?: string;
}

export interface SatSnowStrategyForm {
  stationId: number;
  name?: string;
  config?: any;
  runMode?: number;
}

// ==================== 融雪执行日志 ====================
export interface SatSnowExecLogVO {
  id: number;
  stationId?: number;
  stationName?: string;
  execType?: number;
  triggerReason?: string;
  startTime?: string;
  endTime?: string;
  status?: number;
  detail?: any;
  createTime?: string;
}

// ==================== 告警 ====================
export interface SatAlarmRule {
  id: number;
  createTime?: string;
  updateTime?: string;
  stationId?: number;
  ruleType?: string;
  alarmLevel?: number;
  level2TimeoutMinutes?: number;
  level3TimeoutMinutes?: number;
  notifyChannels?: string;
  configJson?: string;
  enabled: number;
}

export interface SatAlarmRuleForm {
  id?: number;
  stationId?: number;
  ruleType?: string;
  alarmLevel?: number;
  level2TimeoutMinutes?: number;
  level3TimeoutMinutes?: number;
  notifyChannels?: string;
  config?: any;
  enabled?: number;
}

export interface SatAlarmRecordVO {
  id: number;
  stationId?: number;
  stationName?: string;
  alarmType?: string;
  alarmLevel?: number;
  title?: string;
  content?: string;
  status: number;
  triggerTime?: string;
  lastEscalateTime?: string;
  lastNotifyTime?: string;
  confirmTime?: string;
  closeTime?: string;
  handlerId?: number;
  remark?: string;
}

// ==================== 存储配置 ====================
export interface SatStorageConfig {
  id: number;
  createTime?: string;
  updateTime?: string;
  configKey: string;
  configValue: string;
  configName?: string;
  remark?: string;
}

// ==================== OTA ====================
export interface SatOtaVersion {
  id: number;
  createTime?: string;
  updateTime?: string;
  versionNo: string;
  deviceModel?: string;
  fileUrl?: string;
  description?: string;
}

export interface SatOtaVersionForm {
  versionNo: string;
  deviceModel?: string;
  fileUrl?: string;
  description?: string;
}

export interface SatOtaTask {
  id: number;
  createTime?: string;
  updateTime?: string;
  versionId: number;
  stationId?: number;
  scheduleTime?: string;
  status: number;
  failReason?: string;
}

export interface SatOtaTaskForm {
  versionId: number;
  stationIds: number[];
  scheduleTime?: string;
}

// ==================== 摄像头(萤石) ====================
export interface Ys7DeviceVO {
  deviceSerial: string;
  deviceName?: string;
  deviceType?: string;
  model?: string;
  status?: number;
  onlineStatus?: number;
  defence?: string;
  version?: string;
}

export interface Ys7ChannelVO {
  deviceSerial: string;
  channelNo: number;
  channelName?: string;
  picUrl?: string;
  isEncrypt?: number;
  videoLevel?: number;
  status?: number;
}

export interface Ys7LiveAddressVO {
  deviceSerial: string;
  channelNo: number;
  url?: string;
  ezopenUrl?: string;
  playerUrl?: string;
  expireTime?: string;
  accessToken?: string;
}

export interface Ys7CaptureVO {
  deviceSerial: string;
  channelNo: number;
  picUrl?: string;
}

export interface Ys7TokenVO {
  accessToken: string;
  expireTime?: number;
}
