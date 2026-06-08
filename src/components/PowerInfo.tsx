import { useState, useEffect, useCallback, useMemo } from 'react';
import { Zap } from 'lucide-react';
import { httpGet } from '@/src/http/client';
import { MOCK_DASHBOARD_CONFIG } from '@/src/http/mock';
import type { DashboardConfig, SystemDetail, PowerChartItem } from '@/src/http/types';
import ThresholdBarChart, { type TimeRange } from './ThresholdBarChart';

// 生成当天最近 1 小时内每 5 分钟的时间点
function generateHourPowerData(): { label: string; value: number }[] {
  const now = new Date();
  return Array.from({ length: 12 }, (_, i) => {
    const t = new Date(now.getTime() - (11 - i) * 5 * 60_000);
    return {
      label: `${String(t.getHours()).padStart(2, '0')}:${String(t.getMinutes()).padStart(2, '0')}`,
      value: Math.round((3 + Math.random() * 3) * 10) / 10,
    };
  });
}

const MOCK_POWER_BY_RANGE: Record<TimeRange, () => { label: string; value: number }[]> = {
  hour: generateHourPowerData,
  day: () => [
    { label: '00:00', value: 3.2 }, { label: '04:00', value: 2.8 },
    { label: '08:00', value: 4.5 }, { label: '12:00', value: 5.1 },
    { label: '16:00', value: 4.0 }, { label: '20:00', value: 3.6 },
  ],
  week: () => [
    { label: '周一', value: 4.2 }, { label: '周二', value: 3.8 },
    { label: '周三', value: 5.1 }, { label: '周四', value: 4.5 },
    { label: '周五', value: 4.0 }, { label: '周六', value: 4.8 },
    { label: '周日', value: 3.9 },
  ],
  month: () => Array.from({ length: 10 }, (_, i) => ({
    label: `${i * 3 + 1}日`,
    value: Math.round((3 + Math.random() * 3) * 10) / 10,
  })),
  halfYear: () => [
    { label: '1月', value: 4.2 }, { label: '2月', value: 3.8 },
    { label: '3月', value: 4.5 }, { label: '4月', value: 4.1 },
    { label: '5月', value: 3.9 }, { label: '6月', value: 4.3 },
  ],
  year: () => [
    { label: '1月', value: 4.0 }, { label: '2月', value: 3.5 },
    { label: '3月', value: 4.8 }, { label: '4月', value: 5.2 },
    { label: '5月', value: 4.1 }, { label: '6月', value: 3.8 },
    { label: '7月', value: 4.5 }, { label: '8月', value: 3.2 },
    { label: '9月', value: 4.9 }, { label: '10月', value: 5.0 },
    { label: '11月', value: 4.3 }, { label: '12月', value: 3.7 },
  ],
};

function getRangeParams(range: TimeRange) {
  const end = new Date();
  const start = new Date();
  switch (range) {
    case 'hour': start.setHours(start.getHours() - 1); break;
    case 'day': start.setHours(0, 0, 0, 0); break;
    case 'week': start.setDate(start.getDate() - 7); break;
    case 'month': start.setDate(start.getDate() - 30); break;
    case 'halfYear': start.setDate(start.getDate() - 180); break;
    case 'year': start.setFullYear(start.getFullYear() - 1); break;
  }
  const timeLevel = (range === 'hour' || range === 'day' || range === 'week') ? 1 : 2;
  return {
    tag: 1,
    startTime: start.toISOString().slice(0, 10) + ' 00:00:00',
    endTime: end.toISOString().slice(0, 10) + ' 23:59:59',
    timeLevel,
  };
}

export default function PowerInfo() {
  const [config, setConfig] = useState<Partial<DashboardConfig> | null>(null);
  const [deviceData, setDeviceData] = useState<Partial<SystemDetail> | null>(null);
  const [range, setRange] = useState<TimeRange>('week');
  const [apiData, setApiData] = useState<PowerChartItem[]>([]);
  const [refreshTime, setRefreshTime] = useState<Date | null>(null);

  useEffect(() => {
    setConfig(MOCK_DASHBOARD_CONFIG);
    httpGet<SystemDetail>('/v1/snow/detail', { params: { tag: 1 } }).then((data) => { setDeviceData(data); setRefreshTime(new Date()); }).catch(() => {});
  }, []);

  const fetchPowerChart = useCallback((r: TimeRange) => {
    httpGet<PowerChartItem[]>('/v1/snow/power-chart-by-level', {
      params: getRangeParams(r),
    }).then(setApiData).catch(() => setApiData([]));
  }, []);

  useEffect(() => {
    fetchPowerChart(range);
  }, [range, fetchPowerChart]);

  const handleRangeChange = useCallback((r: TimeRange) => {
    setRange(r);
  }, []);

  const voltage = deviceData?.voltage || config?.power?.voltage || '--';
  const current = deviceData?.current || config?.power?.current || '--';
  const yearlyConsumption = config?.power?.yearlyConsumption ?? 5;
  const relays = deviceData?.relays ?? [];

  const chartData = useMemo(() => {
    if (apiData.length > 0) {
      return apiData.map((item) => ({ label: item.time.slice(5, 10), value: item.value }));
    }
    return MOCK_POWER_BY_RANGE[range]();
  }, [apiData, range]);

  const powerMax = useMemo(() => Math.max(...chartData.map((d) => d.value)), [chartData]);
  const threshold = 4.2; // kWh mock 阈值

  return (
    <div className="glass-card h-full flex flex-col">
      <div className="panel-header justify-between">
        <h2 className="panel-title">
          <Zap className="title-icon text-sky-500" />
          电源信息
        </h2>
        {refreshTime && <span className="text-[clamp(10px,0.8vw,12px)] text-slate-600 font-mono">{String(refreshTime.getHours()).padStart(2,'0')}:{String(refreshTime.getMinutes()).padStart(2,'0')}:{String(refreshTime.getSeconds()).padStart(2,'0')}</span>}
      </div>

      <div className="panel-content flex-1 flex flex-col gap-1 overflow-y-auto p-2">
        {/* 电压和电流 */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 flex-1">
            <span className="text-[clamp(11px,0.9vw,15px)] text-slate-400">电压:</span>
            <span className="text-[clamp(11px,0.9vw,15px)] font-medium text-slate-200">{voltage}</span>
          </div>
          <div className="flex items-center gap-2 flex-1">
            <span className="text-[clamp(11px,0.9vw,15px)] text-slate-400">电流:</span>
            <span className="text-[clamp(11px,0.9vw,15px)] font-medium text-slate-200">{current}</span>
          </div>
        </div>

        {/* 本年度累计耗电 */}
        <div className="flex items-center justify-between bg-slate-800/10 rounded py-1">
          <span className="text-[clamp(11px,0.9vw,15px)] text-slate-400">本年度累计耗电:</span>
          <span className="text-[clamp(14px,1.1vw,19px)] font-bold text-yellow-400">{yearlyConsumption} <span className="text-[clamp(11px,0.9vw,15px)] font-normal text-slate-400">kWh</span></span>
        </div>

        {/* 继电器状态 */}
        {relays.length > 0 && (
          <div className="shrink-0">
            <div className="flex justify-between items-center text-[clamp(11px,0.9vw,15px)] mb-1">
              <span className="text-slate-400">继电器状态</span>
              <span className="text-sky-400 font-mono">{relays.filter(r => r.state).length}/{relays.length} 开启</span>
            </div>
            <div className="grid grid-cols-4 gap-1">
              {relays.map((relay) => (
                <div
                  key={relay.id}
                  className={`flex flex-col items-center p-1 rounded border text-[clamp(10px,0.8vw,13px)] transition-colors ${
                    relay.state
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                      : 'bg-slate-800/30 border-slate-700/40 text-slate-500'
                  }`}
                >
                  <span className="truncate w-full text-center">{relay.name.replace(/继电器\s*/, '')}</span>
                  <span className={`font-mono font-bold ${relay.state ? 'text-emerald-400' : 'text-slate-600'}`}>
                    {relay.state ? 'ON' : 'OFF'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 功率柱状图 */}
        <ThresholdBarChart
          data={chartData}
          threshold={threshold}
          colorAbove="#0ea5e9"
          colorBelow="#f43f5e"
          yMax={6}
          yTickInterval={[0, 2, 4, 6]}
          title="功率曲线"
          rightLabel={`MAX: ${powerMax} kWh`}
          range={range}
          onRangeChange={handleRangeChange}
          height={130}
          unit=" kWh"
        />
      </div>
    </div>
  );
}
