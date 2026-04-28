import { useState, useEffect } from 'react';
import { LineChart } from '@mui/x-charts/LineChart';
import { AnimatedArea } from '@mui/x-charts/LineChart';
import { useXScale, useYScale } from '@mui/x-charts';
import {
  Info,
  Radio,
  Signal,
  MoveDiagonal,
  AlertTriangle,
  ShieldCheck,
  ChevronRight,
  Activity
} from 'lucide-react';
import { fetchDashboardConfig } from '@/src/api/dashboard-config';
import type { DashboardConfig } from '@/src/api/dashboard-config';

function CustomArea(props: any) {
  const { ownerState, ...other } = props;
  return (
    <AnimatedArea
      {...other}
      ownerState={{ ...ownerState, gradientId: 'signalGradient' }}
    />
  );
}

export default function AntennaInfo() {
  const [config, setConfig] = useState<Partial<DashboardConfig> | null>(null);

  useEffect(() => {
    fetchDashboardConfig().then(setConfig).catch(() => {});
  }, []);

  const signalData = config?.antenna?.signalHistory?.data ?? [85, 78, 92, 88, 75, 82, 85];
  const xLabels = config?.antenna?.signalHistory?.labels ?? ['4.1', '4.2', '4.3', '4.4', '4.5', '4.6', '4.7'];
  const signalMax = config?.antenna?.signalHistory?.max ?? 92;
  const satellite = config?.antenna?.satellite ?? '中星6E 115.5°';
  const azimuth = config?.antenna?.azimuth ?? '192°';
  const elevation = config?.antenna?.elevation ?? '40°';
  const freqName = config?.antenna?.frequency?.name ?? '浙江一套';
  const freqValue = config?.antenna?.frequency?.value ?? 3825;
  const freqPolarization = config?.antenna?.frequency?.polarization ?? '垂直(V)';
  const freqSymbolRate = config?.antenna?.frequency?.symbolRate ?? 6780;
  const signalAlertStatus = config?.antenna?.signalAlert?.status ?? '正常';
  const signalAlertCount = config?.antenna?.signalAlert?.count ?? 2;
  const displacementHorizontal = config?.antenna?.displacement?.horizontal ?? '0.001°';
  const displacementVertical = config?.antenna?.displacement?.vertical ?? '-0.002°';
  const displacementStatus = config?.antenna?.displacement?.status ?? '正常';
  const offsetAlertCount = config?.antenna?.offsetAlert?.count ?? 2;

  function LineLabels({ data, xData }: { data: number[]; xData: string[] }) {
    const xScale = useXScale<'point'>();
    const yScale = useYScale<'linear'>();

    return (
      <g>
        {data.map((value, i) => {
          const x = (xScale(xData[i]) ?? 0);
          const y = (yScale(value) ?? 0) - 10;
          return (
            <text
              key={i}
              x={x}
              y={y}
              textAnchor="middle"
              fill="#e2e8f0"
              fontSize="clamp(12px,0.95vw,16px)"
            >
              {value}
            </text>
          );
        })}
      </g>
    );
  }

  return (
    <div className="glass-card h-full flex flex-col">
      <div className="panel-header justify-start">
        <h2 className="panel-title">
          <Radio className="title-icon text-sky-500" />
          天线信息
        </h2>
        <Info className="w-3 h-3 text-slate-500 cursor-help" />
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

        {/* 折线图 与 后续信息：空间不足时在此容器内滚动 */}
        <div className="flex-1 min-h-0 flex flex-col overflow-y-auto">
          <div className="pt-2 border-t border-slate-800 flex flex-col">
            <div className="shrink-0 flex justify-between items-center text-[clamp(11px,0.9vw,15px)] mb-1">
              <span className="text-slate-400">强度值</span>
              <span className="text-sky-400 font-mono">MAX: {signalMax}%</span>
            </div>

            <div className="shrink-0 relative min-h-[160px]" style={{ overflow: 'visible' }}>
              <LineChart
                xAxis={[{ data: xLabels, scaleType: 'point' }]}
                yAxis={[{ min: 0, max: 100, tickInterval: [0, 20, 40, 60, 80, 100] }]}
                series={[
                  {
                    data: signalData,
                    area: true,
                    color: '#0ea5e9',
                    label: '强度',
                    curve: 'linear',
                    showMark: true,
                  },
                ]}
                height={150}
                margin={{ top: 16, bottom: 4, left: 6, right: 60 }}
                grid={{ horizontal: true, vertical: true }}
                slots={{ area: CustomArea }}
                slotProps={{
                  legend: { hidden: true } as any,
                  tooltip: { trigger: 'none' } as any,
                }}
                sx={{
                  cursor: 'pointer',
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
                  '& .MuiChartsGrid-line': {
                    stroke: '#1e293b !important',
                    strokeDasharray: 'none !important'
                  },
                  '.MuiChartsTooltip-root': {
                    display: 'none !important'
                  },

                  
                }}
              >
                <LineLabels data={signalData} xData={xLabels} />
                <defs>
                  <linearGradient id="signalGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0" />
                  </linearGradient>
                </defs>
              </LineChart>
            </div>

            {/* 信息框区域 */}
            <div className="space-y-1">
              {/* 强度预警 */}
              <div className="mt-1 relative overflow-hidden rounded-md border border-sky-500/20 bg-sky-950/10">
              <div className="absolute inset-0 bg-gradient-to-r from-sky-500/5 to-transparent" />
                <div className="relative flex items-center gap-2 px-1.5 py-1">
                <div className="w-6 h-6 rounded bg-sky-500/15 flex items-center justify-center">
                  <Signal className="w-3.5 h-3.5 text-sky-400" />
                </div>
                <span className="text-[clamp(11px,0.9vw,15px)] text-slate-200 font-medium">强度预警</span>
                {/* <ChevronRight className="w-3 h-3 text-sky-500/60" /> */}
                <div className="flex-1 h-px bg-gradient-to-r from-sky-500/60 to-transparent" />
                <div className="ml-auto flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span className="text-[clamp(11px,0.9vw,15px)] text-emerald-400 font-medium">{signalAlertStatus === 'normal' ? '正常' : signalAlertStatus}</span>
                </div>
              </div>
            </div>

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

            {/* 本年度总结 */}
            <div className="relative overflow-hidden rounded-md border border-slate-700/50 bg-slate-900/20 mt-2">
              <div className="relative flex items-stretch">
                <div className="flex flex-col items-center justify-center px-1.5 py-1 bg-slate-800/25 border-r border-slate-700/50">
                  <span className="text-[clamp(11px,0.9vw,15px)] text-slate-300" style={{ writingMode: 'vertical-rl' }}>本年度</span>
                </div>
                <div className="flex-1 px-1.5 py-1 space-y-1">
                  <div className="flex items-center gap-2">
                      {/* <AlertTriangle className="w-3 h-3 text-amber-400" /> */}
                      <span className="text-[clamp(11px,0.9vw,15px)] text-slate-300">信号强度预警</span>
                      <span className="text-[clamp(11px,0.9vw,15px)] text-amber-400 font-mono font-bold">{signalAlertCount}</span>
                      <span className="text-[clamp(11px,0.9vw,15px)] text-slate-400">次</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {/* <Activity className="w-3 h-3 text-rose-400" /> */}
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
