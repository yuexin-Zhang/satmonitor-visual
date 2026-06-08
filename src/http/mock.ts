import type {
  DashboardConfig,
  User,
  SensorThreshold,
  MeltStrategy,
  CaptureConfig,
  SystemLog,
  OTAModel,
  SunInterferenceRecord,
} from './types';

export const MOCK_DASHBOARD_CONFIG: DashboardConfig = {
  siteName: '淳安广播转播台',
  antenna: {
    satellite: '中星6B',
    azimuth: '162.3°',
    elevation: '52.8°',
    frequency: {
      name: 'C波段',
      value: 3840,
      polarization: '水平',
      symbolRate: 27490,
    },
    signalHistory: {
      data: [85, 78, 92, 88, 75, 82, 85],
      labels: ['4.1', '4.2', '4.3', '4.4', '4.5', '4.6', '4.7'],
      max: 100,
    },
    signalAlert: { status: '正常', count: 0 },
    displacement: { horizontal: '0.001°', vertical: '-0.002°', status: '正常' },
    offsetAlert: { count: 0 },
  },
  sunInterference: {
    status: '正常',
    todayAlert: false,
    nextPeriod: '3月4日—3月12日',
    yearlyCount: 3,
  },
  liveVideo: {
    streamUrl:
      'https://open.ys7.com/v3/openlive/GN1818878_1_1.m3u8?expire=1777856899&id=968800755977609216&t=77eb7bbc8fb13026968fefe86d04905a78e657790802ea811bc66dd7222ad731&ev=101&supportH265=1',
    streamName: 'GN1818878_1_1',
    enabled: true,
  },
  maintenanceTips: {
    enabled: true,
    isAlerting: false,
    message: '今日暂无维护提醒',
    alertMessage: '',
  },
  environment: {
    weather: [
      { day: '今天', condition: '晴朗', temp: 24, humidity: 45, icon: 'Sun' },
      { day: '明天', condition: '多云', temp: 22, humidity: 50, icon: 'Cloud' },
      { day: '后天', condition: '小雨', temp: 19, humidity: 65, icon: 'CloudRain' },
    ],
    rainSnowSensor: { status: 'normal', text: '无雨雪' },
    humidityAvg: 50,
    yearlyStats: {
      snowForecastDays: 12,
      snowDetectedCount: 3,
      meltTests: 8,
      meltExecutions: 6,
    },
  },
  power: {
    voltage: '220V',
    current: '2.5A',
    yearlyConsumption: 12580,
    powerHistory: {
      data: [420, 380, 450, 410, 390, 430, 440],
      labels: ['1月', '2月', '3月', '4月', '5月', '6月', '7月'],
      max: 500,
    },
  },
  operations: [
    { id: '1', date: '2024-04-01', time: '08:30', code: 'OP-240401-001', title: '日常巡检', subtitle: '设备运行正常', iconType: 'check' },
    { id: '2', date: '2024-04-01', time: '14:00', code: 'OP-240401-002', title: '信号强度校准', subtitle: '信号强度 92%', iconType: 'signal' },
    { id: '3', date: '2024-04-02', time: '09:15', code: 'OP-240402-001', title: '天线角度微调', subtitle: '方位角 162.3°', iconType: 'move' },
    { id: '4', date: '2024-04-02', time: '16:30', code: 'OP-240402-002', title: '融雪系统测试', subtitle: '测试通过', iconType: 'snow' },
    { id: '5', date: '2024-04-03', time: '10:00', code: 'OP-240403-001', title: '电源系统检查', subtitle: '电压 220V 正常', iconType: 'power' },
  ],
  position: {
    horizontal: '0.001°',
    vertical: '-0.002°',
    status: '正常',
    signalAlertCount: 0,
    offsetAlertCount: 0,
  },
  alertThresholds: {
    signalMin: 70,
    tempMax: 60,
    displacementMax: 0.05,
  },
  heatingPolicy: '自动融雪',
  notificationEnabled: true,
};

// ==================== Admin Mock Data ====================

export const MOCK_USERS: User[] = [
  { id: '1', username: 'admin', department: '技术部', role: 'administrator', status: 'active', createdAt: '2024-01-15 09:00:00' },
  { id: '2', username: 'operator1', department: '运维部', role: 'operator', status: 'active', createdAt: '2024-02-20 10:30:00' },
  { id: '3', username: 'viewer1', department: '综合部', role: 'viewer', status: 'inactive', createdAt: '2024-03-10 14:00:00' },
];

export const MOCK_SENSOR_THRESHOLDS: SensorThreshold[] = [
  { id: '1', name: '锅面温度', type: 'temperature', minValue: -20, maxValue: 60, alertLevel: 'warning', enabled: true },
  { id: '2', name: '环境湿度', type: 'humidity', minValue: 20, maxValue: 90, alertLevel: 'warning', enabled: true },
  { id: '3', name: '水平位移', type: 'displacement', minValue: -0.1, maxValue: 0.1, alertLevel: 'danger', enabled: true },
  { id: '4', name: '信号强度', type: 'signal', minValue: 70, maxValue: 100, alertLevel: 'danger', enabled: true },
  { id: '5', name: '供电电压', type: 'voltage', minValue: 200, maxValue: 240, alertLevel: 'warning', enabled: false },
];

export const MOCK_MELT_STRATEGIES: MeltStrategy[] = [
  { id: '1', name: '低温自动融雪', triggerType: 'auto', tempThreshold: 2, snowDetectEnabled: true, maxMeltDuration: 120, enabled: true },
  { id: '2', name: '定时早间融雪', triggerType: 'schedule', tempThreshold: 5, snowDetectEnabled: false, maxMeltDuration: 60, scheduleTime: '06:00', enabled: true },
];

export const MOCK_CAPTURE_CONFIGS: CaptureConfig[] = [
  { id: '1', cameraName: '主摄像头', captureDuration: 5, captureInterval: 30, storageDays: 30, enabled: true },
  { id: '2', cameraName: '辅助摄像头', captureDuration: 3, captureInterval: 60, storageDays: 15, enabled: false },
];

export const MOCK_SYSTEM_LOGS: SystemLog[] = [
  { id: '1', level: 'info', module: '系统', message: '系统启动完成', detail: '服务初始化正常，所有模块加载完毕', user: 'system', ip: '127.0.0.1', createdAt: '2024-04-01 08:00:00' },
  { id: '2', level: 'warning', module: '传感器', message: '锅面温度传感器数据延迟', detail: '最近3分钟未收到锅面温度数据', user: 'operator1', ip: '192.168.1.10', createdAt: '2024-04-01 09:15:00' },
  { id: '3', level: 'error', module: '融雪策略', message: '融雪策略执行失败', detail: '继电器1未响应，请检查硬件连接', user: 'operator1', ip: '192.168.1.10', createdAt: '2024-04-01 10:30:00' },
  { id: '4', level: 'info', module: '用户管理', message: '用户登录', detail: '用户 operator1 登录成功', user: 'operator1', ip: '192.168.1.10', createdAt: '2024-04-01 08:30:00' },
  { id: '5', level: 'debug', module: 'OTA升级', message: '模型版本检查', detail: '当前版本 v2.1.0，远程版本 v2.1.0，无需更新', user: 'system', ip: '127.0.0.1', createdAt: '2024-04-01 07:00:00' },
  { id: '6', level: 'warning', module: '日凌管理', message: '日凌预警', detail: '预计3月4日至3月12日发生日凌，信号可能受影响', user: 'system', ip: '127.0.0.1', createdAt: '2024-03-01 00:00:00' },
];

export const MOCK_OTA_MODELS: OTAModel[] = [
  { id: '1', name: '天线控制模型', version: 'v2.1.0', description: '支持自动追踪与校准', fileSize: '12.5 MB', status: 'published', deviceType: '天线控制器', createdAt: '2024-01-10 10:00:00', updatedAt: '2024-03-15 14:30:00' },
  { id: '2', name: '融雪控制模型', version: 'v1.3.2', description: '优化温度阈值算法', fileSize: '8.2 MB', status: 'published', deviceType: '融雪控制器', createdAt: '2024-02-05 09:00:00', updatedAt: '2024-03-10 11:00:00' },
  { id: '3', name: '信号分析模型', version: 'v0.9.0', description: '实验性信号预测模型', fileSize: '25.0 MB', status: 'draft', deviceType: '信号处理器', createdAt: '2024-03-20 16:00:00', updatedAt: '2024-03-20 16:00:00' },
];

export const MOCK_SUN_INTERFERENCES: SunInterferenceRecord[] = [
  { id: '1', year: 2024, startDate: '2024-03-04', endDate: '2024-03-12', peakTime: '03-08 12:00', duration: 120, impactLevel: 'medium', alertEnabled: true, status: 'passed', notes: '春季日凌' },
  { id: '2', year: 2024, startDate: '2024-09-20', endDate: '2024-09-28', peakTime: '09-24 12:00', duration: 150, impactLevel: 'high', alertEnabled: true, status: 'upcoming', notes: '秋季日凌' },
  { id: '3', year: 2025, startDate: '2025-03-05', endDate: '2025-03-13', peakTime: '03-09 12:00', duration: 110, impactLevel: 'low', alertEnabled: false, status: 'upcoming', notes: '' },
];
