import { useState, useEffect } from 'react';
import { Cloud, CloudRain, Sun, Thermometer } from 'lucide-react';
import { BarChart } from '@mui/x-charts/BarChart';
import { fetchDashboardConfig } from '@/src/api/dashboard-config';
import type { DashboardConfig } from '@/src/api/dashboard-config';

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

export default function EnvironmentalInfo() {
  const [chartKey, setChartKey] = useState(0);
  useEffect(() => {
    setChartKey(k => k + 1);
  }, []);

  const [config, setConfig] = useState<Partial<DashboardConfig> | null>(null);

  useEffect(() => {
    fetchDashboardConfig().then(setConfig).catch(() => {});
  }, []);

  const defaultWeather = [
    { day: '今天', condition: '晴朗', temp: 24, humidity: 45, icon: 'Sun' },
    { day: '明天', condition: '多云', temp: 22, humidity: 55, icon: 'Cloud' },
    { day: '后天', condition: '小雨', temp: 19, humidity: 80, icon: 'CloudRain' },
  ];

  const weather = config?.environment?.weather ?? defaultWeather;
  const rainSnowSensor = config?.environment?.rainSnowSensor ?? { status: 'normal', text: '无 雨雪' };
  const humidityAvg = config?.environment?.humidityAvg ?? 60;
  const yearlyStats = config?.environment?.yearlyStats ?? {
    snowForecastDays: 3,
    snowDetectedCount: 5,
    meltTests: 3,
    meltExecutions: 5,
  };

  return (
    <div className="glass-card h-full flex flex-col">
      <div className="panel-header">
        <h2 className="panel-title"><Thermometer className="title-icon text-sky-500" />气象&融雪</h2>
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

        {/* 雨雪传感器状态 */}
        <div className="shrink-0 flex justify-between items-center text-[clamp(11px,0.9vw,16px)] px-1 pt-1">
          <span className="text-slate-400">雨雪传感器: <span className="text-emerald-400">{rainSnowSensor.text}</span></span>
          <span className={`px-1.5 py-0.5 rounded text-[clamp(10px,0.8vw,13px)] font-medium ${rainSnowSensor.status === 'normal' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'}`}>
            {rainSnowSensor.status === 'normal' ? '正常' : '异常'}
          </span>
        </div>

        {/* 湿度柱状图 */}
        <div className="shrink-0 flex flex-col">
          <div className="flex justify-between items-center text-[clamp(11px,0.9vw,16px)] mb-1 px-1">
            <span className="text-slate-400">湿度趋势</span>
            <span className="text-sky-400 font-mono">AVG: {humidityAvg}%</span>
          </div>
          <div className="flex-1 overflow-hidden">
            <BarChart key={chartKey}
              xAxis={[{ scaleType: 'band', data: weather.map(d => d.day) }]}
              series={[
                {
                  data: weather.map(d => d.humidity),
                  label: '湿度',
                  color: '#0ea5e9',
                  barLabel: 'value',
                  barLabelPlacement: 'outside',
                },
              ]}
              height={120}
              margin={{ top: 16, bottom: 0, left: 12, right: 10 }}
              slotProps={{
                legend: { hidden: true } as any,
                tooltip: {
                  trigger: 'none',
                } as any,
                barLabel: {
                  style: { fill: '#e2e8f0', fontSize: 'clamp(11px, 0.85vw, 13px)' }
                } as any
              }}
              sx={{
                '& .MuiChartsAxis-tickLabel': {
                  fill: '#94a3b8 !important',
                  fontSize: 'clamp(11px, 0.9vw, 14px) !important'
                },
                '& .MuiChartsAxis-line': {
                  stroke: '#1e293b !important'
                },
                '& .MuiChartsAxis-tick': {
                  stroke: '#1e293b !important'
                },
                '.MuiChartsTooltip-paper': {
                  backgroundColor: '#0f172a !important',
                  color: '#e2e8f0 !important',
                  border: '1px solid rgba(14, 165, 233, 0.3) !important',
                  borderRadius: '4px !important',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3) !important'
                },
                '.MuiChartsTooltip-table': {
                  fontSize: 'clamp(11px, 0.9vw, 14px) !important',
                  color: '#e2e8f0 !important'
                }
              }}
            />
          </div>
        </div>

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
