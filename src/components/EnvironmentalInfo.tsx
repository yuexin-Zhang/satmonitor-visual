import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Cloud, CloudRain, Sun, Thermometer } from 'lucide-react';
import { httpGet } from '@/src/http/client';
import { MOCK_DASHBOARD_CONFIG } from '@/src/http/mock';
import type { DashboardConfig, SystemDetail } from '@/src/http/types';
import ThresholdBarChart from './ThresholdBarChart';

const iconMap: Record<string, { Icon: typeof Sun; color: string }> = {
  Sun: { Icon: Sun, color: 'text-amber-400' },
  sun: { Icon: Sun, color: 'text-amber-400' },
  Cloud: { Icon: Cloud, color: 'text-slate-400' },
  cloud: { Icon: Cloud, color: 'text-slate-400' },
  CloudRain: { Icon: CloudRain, color: 'text-blue-400' },
  rain: { Icon: CloudRain, color: 'text-blue-400' },
  CloudSnow: { Icon: CloudRain, color: 'text-cyan-400' },
  snow: { Icon: CloudRain, color: 'text-cyan-400' },
};

// 上海 6 月初真实气温 mock：当前 + 前 5 小时
function generateShanghaiTempData(): { label: string; value: number }[] {
  const now = new Date();
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getTime() - (5 - i) * 3600_000);
    const hour = d.getHours();
    // 6 月初上海气温：凌晨 ~20°C，午后 ~30°C，用 sin 近似
    const base = 25 + 5 * Math.sin(((hour - 6) / 24) * Math.PI * 2);
    return {
      label: `${String(hour).padStart(2, '0')}:00`,
      value: Math.round((base + (Math.random() - 0.5) * 2) * 10) / 10,
    };
  });
}

function formatRefreshTime(date: Date) {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`;
}

export default function EnvironmentalInfo() {
  const [config, setConfig] = useState<Partial<DashboardConfig> | null>(null);
  const [deviceData, setDeviceData] = useState<Partial<SystemDetail> | null>(null);
  const [tempData, setTempData] = useState<{ label: string; value: number }[]>(() => generateShanghaiTempData());
  const [refreshTime, setRefreshTime] = useState<Date>(new Date());

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchData = useCallback(() => {
    httpGet<SystemDetail>('/v1/snow/detail', { params: { tag: 1 } })
      .then((data) => { setDeviceData(data); setRefreshTime(new Date()); })
      .catch(() => {});
    // 温度数据刷新（当前无专用 API，用 mock 模拟）
    setTempData(generateShanghaiTempData());
  }, []);

  useEffect(() => {
    setConfig(MOCK_DASHBOARD_CONFIG);
    fetchData();
    timerRef.current = setInterval(fetchData, 3600_000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [fetchData]);

  const defaultWeather = [
    { day: '今天', condition: '晴朗', temp: 27, humidity: 65, icon: 'Sun' },
    { day: '明天', condition: '多云', temp: 25, humidity: 70, icon: 'Cloud' },
    { day: '后天', condition: '小雨', temp: 23, humidity: 85, icon: 'CloudRain' },
  ];

  const weather = config?.environment?.weather ?? defaultWeather;
  const rainSnowSensor = deviceData?.rainSnow
    ? { status: 'normal', text: deviceData.rainSnow }
    : (config?.environment?.rainSnowSensor ?? { status: 'normal', text: '无雨雪' });
  const humidityAvg = config?.environment?.humidityAvg ?? 60;
  const yearlyStats = config?.environment?.yearlyStats ?? {
    snowForecastDays: 3,
    snowDetectedCount: 5,
    meltTests: 3,
    meltExecutions: 5,
  };
  const tempsensors = deviceData?.tempsensors ?? [];

  // 温度阈值：超过 35°C 红色预警（高温）
  const tempThreshold = 35;

  return (
    <div className="glass-card h-full flex flex-col">
      <div className="panel-header justify-between">
        <h2 className="panel-title"><Thermometer className="title-icon text-sky-500" />气象&融雪</h2>
        <span className="text-[clamp(10px,0.8vw,12px)] text-slate-600 font-mono">{formatRefreshTime(refreshTime)}</span>
      </div>

      <div className="panel-content flex-1 flex flex-col gap-1 overflow-y-auto p-2">
        {/* 三天天气卡片 */}
        <div className="shrink-0 grid grid-cols-3 gap-2">
          {weather.map((item, idx) => {
            const { Icon, color } = iconMap[item.icon] ?? { Icon: Sun, color: 'text-amber-400' };
            return (
              <div key={idx} className={`${idx === 0 ? 'bg-sky-900/10 border-sky-800/30' : 'bg-slate-800/10 border-slate-700/30'} px-2 py-1 rounded border transition-colors`}>
                <div className="flex items-center justify-between">
                  <div className="flex flex-col gap-0.5">
                    <div className="text-[clamp(11px,0.9vw,15px)] text-slate-400">{item.day}</div>
                    <div className="text-[clamp(13px,1.1vw,18px)] text-slate-200 font-bold">{item.temp}°C</div>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className={`text-[clamp(11px,0.9vw,15px)] uppercase font-bold tracking-tighter ${color}`}>{item.condition}</div>
                    <Icon className={`${color} flex-shrink-0`} style={{ width: 'clamp(18px, 1.8vw, 28px)', height: 'clamp(18px, 1.8vw, 28px)' }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* 雨雪传感器 + 湿度 */}
        <div className="shrink-0 flex justify-between items-center text-[clamp(11px,0.9vw,16px)] px-1 pt-1">
          <span className="text-slate-400">雨雪传感器: <span className="text-emerald-400">{rainSnowSensor.text}</span></span>
          <span className="text-slate-400">湿度: <span className="text-sky-400 font-mono">{humidityAvg}%</span></span>
          <span className={`px-1.5 py-0.5 rounded text-[clamp(10px,0.8vw,13px)] font-medium ${rainSnowSensor.status === 'normal' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'}`}>
            {rainSnowSensor.status === 'normal' ? '正常' : '异常'}
          </span>
        </div>

        {/* 温度趋势柱状图（不切换范围，只显示 6 小时） */}
        <ThresholdBarChart
          data={tempData}
          threshold={tempThreshold}
          yMax={40}
          yTickInterval={[0, 10, 20, 30, 40]}
          title="温度趋势"
          height={130}
          unit="°C"
        />

        {/* 真实温度传感器 */}
        {tempsensors.length > 0 && (
          <div className="shrink-0 mt-1">
            <div className="flex justify-between items-center text-[clamp(11px,0.9vw,16px)] mb-1 px-1">
              <span className="text-slate-400">锅面温度传感器</span>
              <span className="text-sky-400 font-mono">
                空气: {deviceData?.airTemperature ?? '--'}°C
                {deviceData?.potTemperature != null && deviceData.potTemperature !== -127 && (
                  <span className="ml-2">锅面: {deviceData.potTemperature}°C</span>
                )}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {tempsensors.map((sensor) => (
                <div key={sensor.id} className="flex flex-col items-center p-1.5 bg-slate-800/20 rounded border border-slate-700/30">
                  <span className="text-[clamp(10px,0.8vw,13px)] text-slate-500">{sensor.name}</span>
                  <span className="text-[clamp(13px,1.0vw,17px)] text-slate-200 font-mono font-bold">{sensor.value}°C</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 底部统计信息 */}
        <div className="shrink-0 relative overflow-hidden rounded-md border border-slate-700/50 bg-slate-900/20 mt-1">
          <div className="relative flex items-stretch">
            <div className="flex flex-col items-center justify-center px-1.5 py-0.5 bg-slate-800/25 border-r border-slate-700/50">
              <span className="text-[clamp(11px,0.9vw,16px)] text-slate-300" style={{ writingMode: 'vertical-rl' }}>本年度</span>
            </div>
            <div className="flex-1 px-1.5 py-1">
              <div className="grid grid-cols-2 gap-2 text-[clamp(11px,0.9vw,16px)]">
                <div className="flex items-center gap-1">
                   <span className="text-slate-400">天气预测有雪</span>
                   <span className="text-slate-200 font-bold">{yearlyStats.snowForecastDays}天</span>
                </div>
                <div className="flex items-center gap-1">
                   <span className="text-slate-400">实测有雪累计</span>
                   <span className="text-slate-200 font-bold">{yearlyStats.snowDetectedCount}次</span>
                </div>
                <div className="flex items-center gap-1">
                   <span className="text-slate-400">执行融雪测试</span>
                   <span className="text-slate-200 font-bold">{yearlyStats.meltTests}次</span>
                </div>
                <div className="flex items-center gap-1">
                   <span className="text-slate-400">执行融雪功能</span>
                   <span className="text-slate-200 font-bold">{yearlyStats.meltExecutions}次</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
