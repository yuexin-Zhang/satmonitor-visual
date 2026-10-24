import { useState, useEffect, useCallback, useRef } from 'react';
import { Cloud, CloudRain, Sun, Thermometer } from 'lucide-react';
import { httpGet, getEffectiveStationId, getEffectiveStationTag } from '@/src/http/client';
import { snowApi, snowExecLogApi, weatherApi, environmentApi } from '@/src/http/api';
import type { SystemDetail, TemperatureChartItem, SatWeatherDayVO } from '@/src/http/types';
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

// 温度阈值：超过 35°C 红色预警（高温）
const TEMP_THRESHOLD = 35;

// 默认天气数据（接口失败时回退）
const DEFAULT_WEATHER: { day: string; data: SatWeatherDayVO | null }[] = [
  { day: '今天', data: null },
  { day: '明天', data: null },
  { day: '后天', data: null },
];
const DEFAULT_HUMIDITY = 60;
const DEFAULT_YEARLY_STATS = {
  snowForecastDays: 0,
  snowDetectedCount: 0,
  meltTests: 0,
  meltExecutions: 0,
};

// 将 /v1/snow/temperature-chart-by-level 响应转为图表数据
// 优先使用空气温度传感器（air/空气/airTemperature）
function toTempChartData(rows: TemperatureChartItem[]): { label: string; value: number }[] {
  if (!rows || rows.length === 0) return [];
  const airRows = rows.filter((r) =>
    /air|空气/i.test(r.sensorName || '') || r.sensorName === 'airTemperature'
  );
  const picked = airRows.length > 0 ? airRows : rows;
  const byTime = new Map<string, number>();
  for (const r of picked) {
    const label = (r.time || '').slice(11, 16) || r.time;
    if (label) byTime.set(label, r.temperature);
  }
  return Array.from(byTime.entries()).map(([label, value]) => ({ label, value: Math.round(value * 10) / 10 }));
}

function formatRefreshTime(date: Date) {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`;
}

export default function EnvironmentalInfo() {
  const [deviceData, setDeviceData] = useState<Partial<SystemDetail> | null>(null);
  const [tempData, setTempData] = useState<{ label: string; value: number }[]>([]);
  const [refreshTime, setRefreshTime] = useState<Date>(new Date());
  // 年度融雪统计：meltTests(自测 execType=3) / meltExecutions(全部) 来自 /v1/sat/snow-exec-logs/page
  const [yearlyStats, setYearlyStats] = useState(DEFAULT_YEARLY_STATS);
  // 三天天气预报 来自 /v1/sat/weather/forecast
  const [forecast, setForecast] = useState<SatWeatherDayVO[] | null>(null);
  // 环境数据（湿度）来自 /v1/sat/environment/current
  const [humidity, setHumidity] = useState<number | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 年度融雪统计：分别按 execType=3（自测）和全部统计 total
  const fetchSnowStats = useCallback(async () => {
    const stationId = getEffectiveStationId();
    try {
      const [testsRes, allRes] = await Promise.all([
        snowExecLogApi.getPage({ pageNum: 1, pageSize: 1, stationId, execType: 3 }).catch(() => null),
        snowExecLogApi.getPage({ pageNum: 1, pageSize: 1, stationId }).catch(() => null),
      ]);
      setYearlyStats((prev) => ({
        ...prev,
        meltTests: testsRes?.total ?? prev.meltTests,
        meltExecutions: allRes?.total ?? prev.meltExecutions,
      }));
    } catch {
      /* ignore */
    }
  }, []);

  // 天气预报 + 环境统计（雪天预测/实测）+ 当前环境（湿度）
  // 页面刷新时 token 可能正在刷新，首次请求可能失败，延迟重试一次
  const fetchWeatherAndEnv = useCallback(async (isRetry = false) => {
    const stationId = getEffectiveStationId();
    try {
      const [forecastRes, envCurrentRes, envStatsRes] = await Promise.all([
        weatherApi.getForecast(stationId).catch((e) => { if (!isRetry) console.warn('[weather] forecast failed, will retry', e?.message); return null; }),
        environmentApi.getCurrent(stationId).catch(() => null),
        environmentApi.getStats(stationId).catch(() => null),
      ]);
      if (forecastRes) {
        setForecast([forecastRes.today, forecastRes.tomorrow, forecastRes.dayAfterTomorrow]);
      } else if (!isRetry) {
        // 首次失败：2秒后重试（等 token 刷新完成）
        setTimeout(() => fetchWeatherAndEnv(true), 2000);
      }
      if (envCurrentRes && typeof envCurrentRes.humidity === 'number') {
        setHumidity(envCurrentRes.humidity);
      }
      if (envStatsRes) {
        setYearlyStats((prev) => ({
          ...prev,
          snowForecastDays: envStatsRes.snowForecastDays ?? prev.snowForecastDays,
          snowDetectedCount: envStatsRes.snowDetectedCount ?? prev.snowDetectedCount,
        }));
      }
    } catch {
      /* ignore */
    }
  }, []);

  const fetchTempHistory = useCallback(() => {
    const now = new Date();
    const start = new Date(now.getTime() - 5 * 3600_000); // 最近 6 小时
    snowApi.getTemperatureChartByLevel({
      tag: getEffectiveStationTag(),
      startTime: start.toISOString().slice(0, 10) + ' 00:00:00',
      endTime: now.toISOString().slice(0, 10) + ' 23:59:59',
      timeLevel: 1,
    })
      .then((rows) => {
        const chart = toTempChartData(rows);
        setTempData(chart); // 接口无数据时为空数组，由空状态占位
      })
      .catch(() => setTempData([]));
  }, []);

  const fetchData = useCallback(() => {
    httpGet<SystemDetail>('/v1/snow/detail', { params: { tag: getEffectiveStationTag() } })
      .then((data) => { setDeviceData(data); setRefreshTime(new Date()); })
      .catch(() => {});
    fetchTempHistory();
    fetchSnowStats();
    fetchWeatherAndEnv();
  }, [fetchTempHistory, fetchSnowStats, fetchWeatherAndEnv]);

  useEffect(() => {
    fetchData();
    // 湿度5分钟更新一次，整体5分钟刷新
    timerRef.current = setInterval(fetchData, 300_000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [fetchData]);

  const weatherDays = forecast
    ? forecast.map((data, idx) => ({ day: DEFAULT_WEATHER[idx].day, data }))
    : DEFAULT_WEATHER;
  const rainSnowSensor = deviceData?.rainSnow
    ? { status: 'normal', text: deviceData.rainSnow }
    : { status: 'normal', text: '无雨雪' };
  const humidityAvg = humidity ?? DEFAULT_HUMIDITY;
  const tempsensors = deviceData?.tempsensors ?? [];

  const tempThreshold = TEMP_THRESHOLD;
  // 温度图表数据：接口无数据时显示空状态占位
  const tempChartData = tempData.length > 0 ? tempData : [{ label: '暂无数据', value: 0 }];

  return (
    <div className="glass-card h-full flex flex-col">
      <div className="panel-header justify-between">
        <h2 className="panel-title"><Thermometer className="title-icon text-sky-500" />气象&融雪</h2>
        <span className="text-[clamp(10px,0.8vw,12px)] text-slate-600 font-mono">{formatRefreshTime(refreshTime)}</span>
      </div>

      <div className="panel-content flex-1 flex flex-col gap-1 overflow-y-auto p-2">
        {/* 三天天气卡片 */}
        <div className="shrink-0 grid grid-cols-3 gap-2">
          {weatherDays.map((item, idx) => {
            const dayData = item.data;
            const condition = dayData?.condition ?? '暂无';
            const temp = dayData?.temp ?? '--';
            const iconKey = dayData?.icon ?? 'Sun';
            const { Icon, color } = iconMap[iconKey] ?? { Icon: Sun, color: 'text-amber-400' };
            return (
              <div key={idx} className={`${idx === 0 ? 'bg-sky-900/10 border-sky-800/30' : 'bg-slate-800/10 border-slate-700/30'} px-2 py-1 rounded border transition-colors`}>
                <div className="flex items-center justify-between">
                  <div className="flex flex-col gap-0.5">
                    <div className="text-[clamp(11px,0.9vw,15px)] text-slate-400">{item.day}</div>
                    <div className="text-[clamp(13px,1.1vw,18px)] text-slate-200 font-bold">{temp}°C</div>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className={`text-[clamp(11px,0.9vw,15px)] uppercase font-bold tracking-tighter ${color}`}>{condition}</div>
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
          data={tempChartData}
          threshold={tempThreshold}
          invert
          yMax={40}
          yTickInterval={[0, 10, 20, 30, 40]}
          title="温度趋势"
          height={130}
          unit="°C"
        />

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
