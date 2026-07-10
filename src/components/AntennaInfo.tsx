import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Radio,
  Signal,
  MoveDiagonal,
  ShieldCheck,
} from 'lucide-react';
import { snowApi, thresholdApi, dashboardApi } from '@/src/http/api';
import { getEffectiveStationId } from '@/src/http/client';
import type { SystemDetail, SnowDataHistoryItem } from '@/src/http/types';
import ThresholdBarChart, { type TimeRange } from './ThresholdBarChart';

// 天线基础参数：后端 /v1/snow/extra-info 实测仅返回 relayStates，不含卫星/方位角/仰角/频率，
// 后端暂无对应接口，故此处使用静态常量（非 mock 数据）。接入接口后替换即可。
const ANTENNA_CONST = {
  satellite: '中星6E 115.5°',
  azimuth: '192°',
  elevation: '40°',
  frequency: { name: '浙江一套', value: 3825, polarization: '垂直(V)', symbolRate: 6780 },
};
// 信号阈值缺省（接口未返回或未登录时使用）
const DEFAULT_SIGNAL_MIN = 70;

// 不同时间范围对应的查询参数（startTime/endTime/timeLevel）
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
  // timeLevel: 1=小时/日/周粒度, 2=月/半年/年粒度
  const timeLevel: 1 | 2 = (range === 'hour' || range === 'day' || range === 'week') ? 1 : 2;
  return {
    tag: 1,
    startTime: start.toISOString().slice(0, 10) + ' 00:00:00',
    endTime: end.toISOString().slice(0, 10) + ' 23:59:59',
    timeLevel,
  };
}

// 将 /v1/snow/data-history 返回的原始数据转为图表可用格式
// 取 signalStrength 字段作为信号强度，time 取 MM-DD 或 HH:mm 作为 label
function toChartData(rows: SnowDataHistoryItem[], range: TimeRange): { label: string; value: number }[] {
  return rows.map((row) => {
    const raw = row.signalStrength;
    // 后端可能以字符串 "92%" 或数字 92 返回
    const value = typeof raw === 'string' ? parseFloat(raw) : (raw as number) ?? 0;
    const t = row.time || '';
    // 小时/日 粒度显示 HH:mm，其它显示 MM-DD
    const label = (range === 'hour' || range === 'day')
      ? t.slice(11, 16)
      : t.slice(5, 10);
    return { label, value: Math.round(value) };
  });
}

// 当接口无数据时的空状态占位（非 mock，仅表示暂无数据）
function emptyChartData(): { label: string; value: number }[] {
  return [{ label: '暂无数据', value: 0 }];
}

// 防御性读取阈值配置中的 signalMin（config 可能是对象或 JSON 字符串，字段名后端可能有差异）
function readSignalMin(configRaw: any): number | undefined {
  if (configRaw == null) return undefined;
  const cfg = typeof configRaw === 'string' ? safeParse(configRaw) : configRaw;
  if (!cfg || typeof cfg !== 'object') return undefined;
  const v = cfg.signalMin ?? cfg.signalStrengthMin ?? cfg.minSignal ?? cfg.signal_min;
  return typeof v === 'number' ? v : undefined;
}
function safeParse(s: string): any {
  try { return JSON.parse(s); } catch { return undefined; }
}

// 防御性读取风险统计中的 信号强度预警次数 / 天线偏移预警次数
function readRiskCounts(data: any): { signal: number; offset: number } {
  if (!data || typeof data !== 'object') return { signal: 0, offset: 0 };
  const pick = (...keys: string[]) => {
    for (const k of keys) {
      const v = data[k];
      if (typeof v === 'number') return v;
      if (v && typeof v === 'object' && typeof v.count === 'number') return v.count;
    }
    return undefined;
  };
  const signal =
    pick('signalAlertCount', 'signalCount', 'signalAlerts', 'signal') ?? 0;
  const offset =
    pick('offsetAlertCount', 'displacementAlertCount', 'offsetCount', 'displacementCount', 'offset', 'displacement') ?? 0;
  return { signal, offset };
}

export default function AntennaInfo() {
  const [deviceData, setDeviceData] = useState<Partial<SystemDetail> | null>(null);
  const [range, setRange] = useState<TimeRange>('day');
  const [refreshTime, setRefreshTime] = useState<Date | null>(null);
  const [signalHistory, setSignalHistory] = useState<{ label: string; value: number }[]>([]);

  // 真实接口拉取的阈值与年度风险次数（未登录/接口失败时回落到常量）
  const [signalMin, setSignalMin] = useState<number>(DEFAULT_SIGNAL_MIN);
  const [riskCounts, setRiskCounts] = useState<{ signal: number; offset: number }>({ signal: 0, offset: 0 });

  // 设备实时详情 + 信号阈值 + 年度风险统计
  useEffect(() => {
    snowApi.getDetail(1).then((data) => { setDeviceData(data); setRefreshTime(new Date()); }).catch(() => {});

    const stationId = getEffectiveStationId();
    // 信号阈值：GET /v1/sat/thresholds/{stationId}
    thresholdApi
      .get(stationId)
      .then((res) => {
        const m = readSignalMin(res?.config);
        if (m != null) setSignalMin(m);
      })
      .catch(() => {});

    // 年度风险统计：GET /v1/sat/dashboard/risk-stats
    const year = new Date().getFullYear();
    dashboardApi
      .getRiskStats({
        stationId,
        startTime: `${year}-01-01 00:00:00`,
        endTime: `${year}-12-31 23:59:59`,
      })
      .then((data) => setRiskCounts(readRiskCounts(data)))
      .catch(() => {});
  }, []);

  const fetchSignalHistory = useCallback((r: TimeRange) => {
    snowApi.getDataHistory(getRangeParams(r))
      .then((rows) => setSignalHistory(rows?.length ? toChartData(rows, r) : []))
      .catch(() => setSignalHistory([]));
  }, []);

  useEffect(() => {
    fetchSignalHistory(range);
  }, [range, fetchSignalHistory]);

  const realSignalStrength = deviceData?.signalStrength;
  // 强度预警状态：根据实时信号强度与阈值比较（无实时值时显示正常）
  const signalAlertStatus = (() => {
    if (realSignalStrength == null || realSignalStrength === '') return '正常';
    const num = typeof realSignalStrength === 'string' ? parseFloat(realSignalStrength) : realSignalStrength;
    return !isNaN(num) && num < signalMin ? '预警' : '正常';
  })();

  const { satellite, azimuth, elevation, frequency: freq } = ANTENNA_CONST;
  // 位移状况：水平取 yaw，垂直取 pitch（来自 /v1/snow/detail）
  const displacementHorizontal = deviceData?.yaw || '--';
  const displacementVertical = deviceData?.pitch || '--';
  const displacementStatus = '正常';
  const signalAlertCount = riskCounts.signal;
  const offsetAlertCount = riskCounts.offset;
  const threshold = signalMin;

  const chartData = useMemo(() => {
    if (signalHistory.length > 0) return signalHistory;
    return emptyChartData();
  }, [signalHistory]);
  const signalMax = useMemo(
    () => (chartData.length ? Math.max(...chartData.map((d) => d.value)) : 0),
    [chartData],
  );

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
            <span className="text-slate-400">{freq.name}:</span>
            <span className="text-sky-400 font-mono">{freq.value}</span>
            <span className="text-slate-500">{freq.polarization}:</span>
            <span className="text-sky-400 font-mono">{freq.symbolRate}</span>
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
                      <span className="text-[clamp(11px,0.9vw,15px)] text-emerald-400 font-medium">{displacementStatus}</span>
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
                    <span className={`text-[clamp(11px,0.9vw,15px)] font-medium ${signalAlertStatus === '预警' ? 'text-rose-400' : 'text-emerald-400'}`}>{signalAlertStatus}</span>
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
