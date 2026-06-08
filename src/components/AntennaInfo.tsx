import { useState, useEffect, useMemo } from 'react';
import {
  Info,
  Radio,
  Signal,
  MoveDiagonal,
  ShieldCheck,
} from 'lucide-react';
import { httpGet } from '@/src/http/client';
import { MOCK_DASHBOARD_CONFIG } from '@/src/http/mock';
import type { DashboardConfig, SystemDetail } from '@/src/http/types';
import ThresholdBarChart, { type TimeRange } from './ThresholdBarChart';

// 生成当天最近 1 小时内每 5 分钟的时间点
function generateHourSignalData(): { label: string; value: number }[] {
  const now = new Date();
  return Array.from({ length: 12 }, (_, i) => {
    const t = new Date(now.getTime() - (11 - i) * 5 * 60_000);
    return {
      label: `${String(t.getHours()).padStart(2, '0')}:${String(t.getMinutes()).padStart(2, '0')}`,
      value: Math.round(70 + Math.random() * 30),
    };
  });
}

// 不同时间范围对应的 mock 信号强度数据
const MOCK_SIGNAL_BY_RANGE: Record<TimeRange, () => { label: string; value: number }[]> = {
  hour: generateHourSignalData,
  day: () => [
    { label: '00:00', value: 92 }, { label: '04:00', value: 88 },
    { label: '08:00', value: 78 }, { label: '12:00', value: 65 },
    { label: '16:00', value: 85 }, { label: '20:00', value: 90 },
  ],
  week: () => [
    { label: '周一', value: 92 }, { label: '周二', value: 78 },
    { label: '周三', value: 65 }, { label: '周四', value: 88 },
    { label: '周五', value: 75 }, { label: '周六', value: 82 },
    { label: '周日', value: 85 },
  ],
  month: () => Array.from({ length: 10 }, (_, i) => ({
    label: `${i * 3 + 1}日`,
    value: Math.round(70 + Math.random() * 30),
  })),
  halfYear: () => [
    { label: '1月', value: 85 }, { label: '2月', value: 78 },
    { label: '3月', value: 68 }, { label: '4月', value: 92 },
    { label: '5月', value: 88 }, { label: '6月', value: 82 },
  ],
  year: () => [
    { label: '1月', value: 88 }, { label: '2月', value: 82 },
    { label: '3月', value: 68 }, { label: '4月', value: 75 },
    { label: '5月', value: 92 }, { label: '6月', value: 85 },
    { label: '7月', value: 78 }, { label: '8月', value: 90 },
    { label: '9月', value: 72 }, { label: '10月', value: 65 },
    { label: '11月', value: 88 }, { label: '12月', value: 92 },
  ],
};

export default function AntennaInfo() {
  const [config, setConfig] = useState<Partial<DashboardConfig> | null>(null);
  const [deviceData, setDeviceData] = useState<Partial<SystemDetail> | null>(null);
  const [range, setRange] = useState<TimeRange>('day');
  const [refreshTime, setRefreshTime] = useState<Date | null>(null);

  useEffect(() => {
    setConfig(MOCK_DASHBOARD_CONFIG);
    httpGet<SystemDetail>('/v1/snow/detail', { params: { tag: 1 } }).then((data) => { setDeviceData(data); setRefreshTime(new Date()); }).catch(() => {});
  }, []);

  const satellite = config?.antenna?.satellite ?? '中星6E 115.5°';
  const azimuth = config?.antenna?.azimuth ?? '192°';
  const elevation = config?.antenna?.elevation ?? '40°';
  const freqName = config?.antenna?.frequency?.name ?? '浙江一套';
  const freqValue = config?.antenna?.frequency?.value ?? 3825;
  const freqPolarization = config?.antenna?.frequency?.polarization ?? '垂直(V)';
  const freqSymbolRate = config?.antenna?.frequency?.symbolRate ?? 6780;
  const realSignalStrength = deviceData?.signalStrength;
  const signalAlertStatus = config?.antenna?.signalAlert?.status ?? '正常';
  const signalAlertCount = config?.antenna?.signalAlert?.count ?? 2;
  const displacementHorizontal = config?.antenna?.displacement?.horizontal ?? '0.001°';
  const displacementVertical = config?.antenna?.displacement?.vertical ?? '-0.002°';
  const displacementStatus = config?.antenna?.displacement?.status ?? '正常';
  const offsetAlertCount = config?.antenna?.offsetAlert?.count ?? 2;
  const threshold = config?.alertThresholds?.signalMin ?? 70;

  const chartData = useMemo(() => MOCK_SIGNAL_BY_RANGE[range](), [range]);
  const signalMax = useMemo(() => Math.max(...chartData.map((d) => d.value)), [chartData]);

  return (
    <div className="glass-card h-full flex flex-col">
      <div className="panel-header justify-between">
        <h2 className="panel-title">
          <Radio className="title-icon text-sky-500" />
          天线信息
        </h2>
        {refreshTime && <span className="text-[clamp(10px,0.8vw,12px)] text-slate-600 font-mono">{String(refreshTime.getHours()).padStart(2,'0')}:{String(refreshTime.getMinutes()).padStart(2,'0')}:{String(refreshTime.getSeconds()).padStart(2,'0')}</span>}
      </div>

      <div className="panel-content flex-1 flex flex-col gap-2 overflow-y-auto p-2">
        {/* 基础参数 */}
        <div className="shrink-0 space-y-1 text-[clamp(11px,0.9vw,15px)]">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">卫星:</span>
            <span className="text-slate-200">{satellite}</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 flex-1">
              <span className="text-slate-400">方位角:</span>
              <span className="text-slate-200">{azimuth}</span>
            </div>
            <div className="flex items-center gap-2 flex-1">
              <span className="text-slate-400">仰角:</span>
              <span className="text-slate-200">{elevation}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400">{freqName}:</span>
            <span className="text-sky-400 font-mono">{freqValue}</span>
            <span className="text-slate-500">{freqPolarization}:</span>
            <span className="text-sky-400 font-mono">{freqSymbolRate}</span>
          </div>
        </div>

        {/* 信息框 + 柱状图 */}
        <div className="flex-1 min-h-0 flex flex-col overflow-y-auto">
          <div className="pt-4 border-t border-slate-800 flex flex-col">
            <div className="space-y-2">
              {/* 位移状况 */}
              <div className="relative overflow-hidden rounded-md border border-amber-500/20 bg-amber-950/5">
                <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 to-transparent" />
                <div className="relative px-1.5 py-0.5">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-6 h-6 rounded bg-amber-500/15 flex items-center justify-center">
                      <MoveDiagonal className="w-3.5 h-3.5 text-amber-400" />
                    </div>
                    <span className="text-[clamp(11px,0.9vw,15px)] text-slate-200 font-medium">位移状况</span>
                    <div className="flex-1 h-px bg-gradient-to-r from-amber-500/30 to-transparent" />
                    <div className="flex items-center gap-1">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span className="text-[clamp(11px,0.9vw,15px)] text-emerald-400 font-medium">{displacementStatus === 'normal' ? '正常' : displacementStatus}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-[clamp(11px,0.9vw,15px)]">
                    <div className="flex items-center gap-1">
                      <span className="text-slate-400">水平:</span>
                      <span className="text-slate-200 font-mono">{displacementHorizontal}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-slate-400">垂直:</span>
                      <span className="text-slate-200 font-mono">{displacementVertical}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 强度预警 */}
              <div className="relative overflow-hidden rounded-md border border-sky-500/20 bg-sky-950/10">
                <div className="absolute inset-0 bg-gradient-to-r from-sky-500/5 to-transparent" />
                <div className="relative flex items-center gap-2 px-1.5 py-1">
                  <div className="w-6 h-6 rounded bg-sky-500/15 flex items-center justify-center">
                    <Signal className="w-3.5 h-3.5 text-sky-400" />
                  </div>
                  <span className="text-[clamp(11px,0.9vw,15px)] text-slate-200 font-medium">强度预警</span>
                  <div className="flex-1 h-px bg-gradient-to-r from-sky-500/60 to-transparent" />
                  <div className="ml-auto flex items-center gap-2">
                    {realSignalStrength && (
                      <span className="text-[clamp(11px,0.9vw,15px)] text-sky-400 font-mono">{realSignalStrength}%</span>
                    )}
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span className="text-[clamp(11px,0.9vw,15px)] text-emerald-400 font-medium">{signalAlertStatus === 'normal' ? '正常' : signalAlertStatus}</span>
                  </div>
                </div>
              </div>

              {/* 柱状图 */}
              <ThresholdBarChart
                data={chartData}
                threshold={threshold}
                yMax={100}
                yTickInterval={[0, 20, 40, 60, 80, 100]}
                title="强度值"
                rightLabel={`MAX: ${signalMax}%`}
                range={range}
                onRangeChange={setRange}
                height={130}
              />

              {/* 本年度总结 */}
              <div className="relative overflow-hidden rounded-md border border-slate-700/50 bg-slate-900/20 mt-2">
                <div className="relative flex items-stretch">
                  <div className="flex flex-col items-center justify-center px-1.5 py-1 bg-slate-800/25 border-r border-slate-700/50">
                    <span className="text-[clamp(11px,0.9vw,15px)] text-slate-300" style={{ writingMode: 'vertical-rl' }}>本年度</span>
                  </div>
                  <div className="flex-1 px-1.5 py-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[clamp(11px,0.9vw,15px)] text-slate-300">信号强度预警</span>
                      <span className="text-[clamp(11px,0.9vw,15px)] text-amber-400 font-mono font-bold">{signalAlertCount}</span>
                      <span className="text-[clamp(11px,0.9vw,15px)] text-slate-400">次</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[clamp(11px,0.9vw,15px)] text-slate-300">天线偏移预警</span>
                      <span className="text-[clamp(11px,0.9vw,15px)] text-rose-400 font-mono font-bold">{offsetAlertCount}</span>
                      <span className="text-[clamp(12px,1.0vw,16px)] text-slate-400">次</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
