import type {
  DashboardConfig,
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
