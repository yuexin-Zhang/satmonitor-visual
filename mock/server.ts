import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateSystemData } from '../src/components/antenna/dataGenerator';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(cors());
app.use(express.json());

const DEFAULT_PORT = 8989;
const MAX_PORT_TRY = 10;

// ========== 统一的 Dashboard 配置中心（Admin 可修改，Dashboard 读取） ==========

let dashboardConfig = {
  siteName: '淳安广播转播台',
  // 天线信息
  antenna: {
    satellite: '中星6E 115.5°',
    azimuth: '192°',
    elevation: '40°',
    frequency: { name: '浙江一套', value: 3825, polarization: '垂直(V)', symbolRate: 6780 },
    signalHistory: {
      data: [85, 78, 92, 88, 75, 82, 85],
      labels: ['4.1', '4.2', '4.3', '4.4', '4.5', '4.6', '4.7'],
      max: 92,
    },
    signalAlert: { status: 'normal', count: 2 },
    displacement: { horizontal: '0.001°', vertical: '-0.002°', status: 'normal' },
    offsetAlert: { count: 2 },
  },
  // 日凌信息
  sunInterference: {
    status: 'normal',
    todayAlert: false,
    nextPeriod: '3月4日—3月12日',
    yearlyCount: 3,
  },
  // 实时监控画面
  liveVideo: {
    streamUrl:
      'https://open.ys7.com/v3/openlive/GN1818878_1_1.m3u8?expire=1777856899&id=968800755977609216&t=77eb7bbc8fb13026968fefe86d04905a78e657790802ea811bc66dd7222ad731&ev=101&supportH265=1',
    streamName: 'GN1818878_1_1',
    enabled: true,
  },
  // 智能运检提示
  maintenanceTips: {
    enabled: true,
    isAlerting: false,
    message: '系统运行正常，暂无异常告警。',
    alertMessage: '近期有大雨，请检查电源系统或网络，部件位置请点击标识',
  },
  // 气象融雪
  environment: {
    weather: [
      { day: '今天', condition: '晴朗', temp: 24, humidity: 45, icon: 'sun' },
      { day: '明天', condition: '多云', temp: 22, humidity: 55, icon: 'cloud' },
      { day: '后天', condition: '小雨', temp: 19, humidity: 80, icon: 'rain' },
    ],
    rainSnowSensor: { status: 'clear', text: '无雨雪' },
    humidityAvg: 60,
    yearlyStats: {
      snowForecastDays: 3,
      snowDetectedCount: 5,
      meltTests: 3,
      meltExecutions: 5,
    },
  },
  // 电源信息
  power: {
    voltage: '220V',
    current: '3A',
    yearlyConsumption: 5,
    powerHistory: {
      data: [4.2, 3.8, 5.1, 4.5, 4.0, 4.8],
      labels: ['1月', '2月', '3月', '4月', '5月', '6月'],
      max: 5.1,
    },
  },
  // 运维记录
  operations: [
    { id: '1', date: '今天', time: '09:59', code: 'ANT_H001', title: '天线页面01加热故障', subtitle: '请检查加热模块', iconType: 'heat-fault' },
    { id: '2', date: '今天', time: '09:42', code: 'HT_A002', title: '自动启动加热', subtitle: '', iconType: 'heat' },
    { id: '3', date: '今天', time: '09:30', code: 'AI_V003', title: 'AI视觉监测有雪', subtitle: '摄像头视野受阻', iconType: 'eye' },
    { id: '4', date: '今天', time: '09:15', code: 'TMP_L004', title: '空气温度低于2°', subtitle: '当前温度：1.5°C', iconType: 'temp-low' },
    { id: '5', date: '2026年4月5日', time: '21:16', code: 'RS_S005', title: '雨雪传感器有雨雪', subtitle: '检测到降水', iconType: 'rain-snow' },
    { id: '6', date: '2026年4月5日', time: '20:45', code: 'HT_M006', title: '手动关闭加热', subtitle: '', iconType: 'heat-off' },
    { id: '7', date: '2026年4月5日', time: '20:30', code: 'HT_M007', title: '手动启动加热', subtitle: '', iconType: 'heat' },
    { id: '8', date: '2026年4月4日', time: '18:20', code: 'PWR_F008', title: '电源信息故障', subtitle: '请检查供电系统', iconType: 'power-fault' },
    { id: '9', date: '2026年4月4日', time: '17:10', code: 'ANT_T009', title: '天线温度故障', subtitle: '温度传感器异常', iconType: 'antenna-fault' },
    { id: '10', date: '2026年4月4日', time: '16:55', code: 'AIR_T010', title: '空气温度故障', subtitle: '温度读数异常', iconType: 'temp-fault' },
    { id: '11', date: '2026年4月3日', time: '14:30', code: 'RS_F011', title: '雨雪传感器故障', subtitle: '传感器无响应', iconType: 'rain-snow-fault' },
    { id: '12', date: '2026年4月3日', time: '13:20', code: 'MOV_F012', title: '位移故障', subtitle: '请检查机械结构', iconType: 'move-fault' },
    { id: '13', date: '2026年4月3日', time: '12:00', code: 'SIG_F013', title: '信号强度故障', subtitle: '信号丢失或弱', iconType: 'signal-fault' },
  ],
  // 位移状况
  position: {
    horizontal: '0.001°',
    vertical: '-0.002°',
    status: 'normal',
    signalAlertCount: 2,
    offsetAlertCount: 2,
  },
  // 系统级设置
  alertThresholds: {
    signalMin: 70,
    tempMax: 80,
    displacementMax: 0.005,
  },
  heatingPolicy: 'auto',
  notificationEnabled: true,
};

// ========== Dashboard APIs（从 dashboardConfig 读取） ==========

app.get('/api/dashboard/config', (_req, res) => {
  res.json({ code: '00000', data: dashboardConfig });
});

app.get('/api/dashboard/overview', (_req, res) => {
  res.json({
    code: '00000',
    data: {
      siteName: dashboardConfig.siteName,
      systemStatus: 'normal',
      uptime: '142:55:12',
      network: 'online',
      database: 'connected',
      encryption: 'AES-256',
    },
  });
});

app.get('/api/dashboard/antenna', (_req, res) => {
  res.json({ code: '00000', data: dashboardConfig.antenna });
});

app.get('/api/dashboard/environment', (_req, res) => {
  res.json({ code: '00000', data: dashboardConfig.environment });
});

app.get('/api/dashboard/power', (_req, res) => {
  res.json({ code: '00000', data: dashboardConfig.power });
});

app.get('/api/dashboard/operations', (_req, res) => {
  res.json({ code: '00000', data: dashboardConfig.operations });
});

app.get('/api/dashboard/sun-interference', (_req, res) => {
  res.json({ code: '00000', data: dashboardConfig.sunInterference });
});

app.get('/api/dashboard/position', (_req, res) => {
  res.json({ code: '00000', data: dashboardConfig.position });
});

app.get('/api/dashboard/system', (_req, res) => {
  res.json({ code: '00000', data: generateSystemData() });
});

// ========== Admin APIs ==========

let users = [
  { id: '1', username: 'admin', role: 'administrator', status: 'active', createdAt: '2026-01-01' },
  { id: '2', username: 'operator', role: 'operator', status: 'active', createdAt: '2026-03-15' },
];

let operationLogs = [
  { id: '1', user: 'admin', action: '修改告警阈值', detail: '信号强度阈值调整为 70', time: '2026-04-27 10:30:00' },
  { id: '2', user: 'operator', action: '手动启动加热', detail: 'BLADE_01 手动加热', time: '2026-04-27 09:42:00' },
];

app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (username === 'admin' && password === 'admin123') {
    res.json({
      code: '00000',
      data: { token: 'mock-jwt-token-' + Date.now(), user: { id: '1', username: 'admin', role: 'administrator' } },
    });
  } else {
    res.status(401).json({ code: 'A0001', msg: '用户名或密码错误' });
  }
});

// 获取完整 Dashboard 配置（Admin 数据配置页面用）
app.get('/api/admin/config', (_req, res) => {
  res.json({ code: '00000', data: dashboardConfig });
});

// 保存 Dashboard 配置（Admin 修改后同步给 Dashboard）
app.post('/api/admin/config', (req, res) => {
  dashboardConfig = { ...dashboardConfig, ...req.body };
  operationLogs.unshift({
    id: String(operationLogs.length + 1),
    user: 'admin',
    action: '修改数据配置',
    detail: JSON.stringify(Object.keys(req.body)),
    time: new Date().toISOString().replace('T', ' ').slice(0, 19),
  });
  res.json({ code: '00000', data: dashboardConfig });
});

app.get('/api/admin/users', (_req, res) => {
  res.json({ code: '00000', data: users });
});

app.post('/api/admin/users', (req, res) => {
  const newUser = { id: String(users.length + 1), ...req.body, createdAt: new Date().toISOString().slice(0, 10) };
  users.push(newUser);
  res.json({ code: '00000', data: newUser });
});

app.put('/api/admin/users/:id', (req, res) => {
  const idx = users.findIndex((u: any) => u.id === req.params.id);
  if (idx === -1) return res.status(404).json({ code: 'B0001', msg: '用户不存在' });
  users[idx] = { ...users[idx], ...req.body };
  res.json({ code: '00000', data: users[idx] });
});

app.delete('/api/admin/users/:id', (req, res) => {
  const idx = users.findIndex((u: any) => u.id === req.params.id);
  if (idx === -1) return res.status(404).json({ code: 'B0001', msg: '用户不存在' });
  users.splice(idx, 1);
  res.json({ code: '00000', data: null });
});

app.get('/api/admin/operation-logs', (_req, res) => {
  res.json({ code: '00000', data: operationLogs });
});

// ========== 真实设备数据代理 ==========
app.get('/api/v1/snow/detail', (_req, res) => {
  const systemData = generateSystemData();
  res.json({
    code: '00000',
    data: {
      rainSnow: systemData.system.environment.rainSnowStatus === 'clear' ? '无雨雪' :
                systemData.system.environment.rainSnowStatus === 'rain' ? '雨' : '雪',
      airTemperature: systemData.system.environment.airTemperature,
      potTemperature: systemData.system.environment.dishTemperature,
      signalStrength: String(systemData.system.satelliteSignal.signalStrength),
      roll: systemData.system.attitude.status === 'normal' ? '正常' : '异常',
      pitch: systemData.system.attitude.status === 'normal' ? '正常' : '异常',
      yaw: systemData.system.displacementFault.status === 'normal' ? '正常' : '异常',
      relays: [
        ...systemData.system.relays.heatingRelays.map((r, i) => ({ name: `加热继电器${i + 1}`, state: r.status === 'on' })),
        { name: '报警继电器', state: systemData.system.relays.alarmRelay.status === 'on' },
      ],
      tempsensors: systemData.blades.map((b, i) => ({
        name: `锅面_${i * 2 + 1}_${i * 2 + 2}`,
        value: b.temperature.current ?? 0,
      })),
    },
  });
});

function tryListen(port: number, tryCount = 0) {
  const server = app.listen(port, () => {
    fs.writeFileSync(path.resolve(__dirname, '.port'), String(port));
    console.log(`[Mock Server] running at http://127.0.0.1:${port}`);
    console.log(`[Mock Server] Dashboard APIs: http://127.0.0.1:${port}/api/dashboard/*`);
    console.log(`[Mock Server] Admin APIs: http://127.0.0.1:${port}/api/admin/*`);
  });

  server.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      if (tryCount < MAX_PORT_TRY) {
        console.log(`[Mock Server] 端口 ${port} 被占用，尝试 ${port + 1}...`);
        tryListen(port + 1, tryCount + 1);
      } else {
        console.error(`[Mock Server] 错误：端口 ${DEFAULT_PORT} ~ ${DEFAULT_PORT + MAX_PORT_TRY} 均被占用`);
        process.exit(1);
      }
    } else {
      console.error('[Mock Server] 启动失败:', err.message);
      process.exit(1);
    }
  });
}

tryListen(Number(process.env.MOCK_PORT) || DEFAULT_PORT);
