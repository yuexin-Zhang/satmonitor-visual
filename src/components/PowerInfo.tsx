import { useState, useEffect, useCallback, useMemo } from 'react';
import { Zap } from 'lucide-react';
import { httpGet, getEffectiveStationId } from '@/src/http/client';
import { snowApi, dashboardApi } from '@/src/http/api';
import type { SystemDetail, PowerChartItem } from '@/src/http/types';
import ThresholdBarChart, { type TimeRange } from './ThresholdBarChart';

// 功率阈值缺省（kWh）
const DEFAULT_POWER_THRESHOLD = 4.2;
// 年度累计耗电缺省（接口未返回时显示）
const DEFAULT_YEARLY_CONSUMPTION = 0;

// 防御性读取能耗统计中的累计用电量（后端字段名可能有差异）
function readYearlyConsumption(data: any): number | undefined {
  if (!data || typeof data !== 'object') return undefined;
  const keys = [
    'yearlyConsumption', 'totalConsumption', 'totalEnergy',
    'totalKwh', 'energyConsumption', 'energy', 'consumption', 'kwh',
  ];
  for (const k of keys) {
    const v = data[k];
    if (typeof v === 'number' && !isNaN(v)) return Math.round(v * 10) / 10;
  }
  return undefined;
}

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
  const timeLevel: 1 | 2 = (range === 'hour' || range === 'day' || range === 'week') ? 1 : 2;
  return {
    tag: 1,
    startTime: start.toISOString().slice(0, 10) + ' 00:00:00',
    endTime: end.toISOString().slice(0, 10) + ' 23:59:59',
    timeLevel,
  };
}

export default function PowerInfo() {
  const [deviceData, setDeviceData] = useState<Partial<SystemDetail> | null>(null);
  const [range, setRange] = useState<TimeRange>('week');
  const [apiData, setApiData] = useState<PowerChartItem[]>([]);
  const [refreshTime, setRefreshTime] = useState<Date | null>(null);
  // 年度累计耗电：来自 /v1/sat/dashboard/energy-stats
  const [yearlyConsumption, setYearlyConsumption] = useState<number>(DEFAULT_YEARLY_CONSUMPTION);

  useEffect(() => {
    httpGet<SystemDetail>('/v1/snow/detail', { params: { tag: 1 } }).then((data) => { setDeviceData(data); setRefreshTime(new Date()); }).catch(() => {});

    // 年度累计耗电：GET /v1/sat/dashboard/energy-stats
    const year = new Date().getFullYear();
    dashboardApi
      .getEnergyStats({
        stationId: getEffectiveStationId(),
        startTime: `${year}-01-01 00:00:00`,
        endTime: `${year}-12-31 23:59:59`,
      })
      .then((data) => {
        const v = readYearlyConsumption(data);
        if (v != null) setYearlyConsumption(v);
      })
      .catch(() => {});
  }, []);

  const fetchPowerChart = useCallback((r: TimeRange) => {
    snowApi.getPowerChartByLevel(getRangeParams(r)).then(setApiData).catch(() => setApiData([]));
  }, []);

  useEffect(() => {
    fetchPowerChart(range);
  }, [range, fetchPowerChart]);

  const handleRangeChange = useCallback((r: TimeRange) => {
    setRange(r);
  }, []);

  const voltage = deviceData?.voltage || '--';
  const current = deviceData?.current || '--';
  const relays = deviceData?.relays ?? [];

  const chartData = useMemo(() => {
    if (apiData.length > 0) {
      return apiData.map((item) => ({ label: item.time.slice(5, 10), value: item.value }));
    }
    // 接口无数据时显示空状态占位（非 mock）
    return [{ label: '暂无数据', value: 0 }];
  }, [apiData]);

  const powerMax = useMemo(
    () => (chartData.length ? Math.max(...chartData.map((d) => d.value)) : 0),
    [chartData],
  );
  const threshold = DEFAULT_POWER_THRESHOLD;

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
