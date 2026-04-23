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
  const signalData = [85, 78, 92, 88, 75, 82, 85];
  const xLabels = ['4.1', '4.2', '4.3', '4.4', '4.5', '4.6', '4.7'];

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
              fontSize="clamp(10px,0.8vw,12px)"
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

      <div className="panel-content flex-1 flex flex-col gap-3 overflow-y-auto">
        {/* 基础参数 */}
        <div className="space-y-1.5 text-[clamp(10px,0.85vw,14px)]">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">卫星:</span>
            <span className="text-slate-200">中星6E 115.5°</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 flex-1">
              <span className="text-slate-400">方位角:</span>
              <span className="text-slate-200">192°</span>
            </div>
            <div className="flex items-center gap-2 flex-1">
              <span className="text-slate-400">仰角:</span>
              <span className="text-slate-200">40°</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400">浙江一套:</span>
            <span className="text-sky-400 font-mono">3825</span>
            <span className="text-slate-500">垂直(V):</span>
            <span className="text-sky-400 font-mono">6780</span>
          </div>
        </div>

        {/* 折线图 与 后续信息共享同一父容器，若空间不足则垂直滚动 */}
        <div className="flex-1 min-h-0 flex flex-col" style={{ overflow: 'visible' }}>
          <div className="pt-2 border-t border-slate-800 flex flex-col flex-shrink-0" style={{ overflow: 'visible' }}>
            <div className="flex justify-between items-center text-[clamp(10px,0.85vw,14px)] mb-1">
              <span className="text-slate-400">强度值</span>
              <span className="text-sky-400 font-mono">MAX: 92%</span>
            </div>

            <div className="relative min-h-[170px] mb-3" style={{ overflow: 'visible' }}>
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
                height={160}
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
                    fontSize: 'clamp(10px, 0.85vw, 14px) !important'
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

            {/* 可滚动的信息框区域 */}
            <div className="flex-1 min-h-0 overflow-y-auto space-y-2">
              {/* 强度预警 */}
              <div className="mt-2 relative overflow-hidden rounded-md border border-sky-500/20 bg-sky-950/10">
              <div className="absolute inset-0 bg-gradient-to-r from-sky-500/5 to-transparent" />
                <div className="relative flex items-center gap-2 px-2 py-1.5">
                <div className="w-6 h-6 rounded bg-sky-500/15 flex items-center justify-center">
                  <Signal className="w-3.5 h-3.5 text-sky-400" />
                </div>
                <span className="text-[clamp(10px,0.85vw,14px)] text-slate-200">强度预警</span>
                {/* <ChevronRight className="w-3 h-3 text-sky-500/60" /> */}
                <div className="flex-1 h-px bg-gradient-to-r from-sky-500/60 to-transparent" />
                <div className="ml-auto flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  <span className="text-[clamp(10px,0.85vw,14px)] text-emerald-400 font-medium">正常</span>
                </div>
              </div>
            </div>

            {/* 位移状况 */}
            <div className="relative overflow-hidden rounded-md border border-amber-500/20 bg-amber-950/5 mt-2">
              <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 to-transparent" />
              <div className="relative px-2 py-1.5">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-5 h-5 rounded bg-amber-500/15 flex items-center justify-center">
                    <MoveDiagonal className="w-3 h-3 text-amber-400" />
                  </div>
                  <span className="text-[clamp(10px,0.85vw,14px)] text-slate-200 font-medium">位移状况</span>
                  <div className="flex-1 h-px bg-gradient-to-r from-amber-500/30 to-transparent" />
                  <div className="flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    <span className="text-[clamp(10px,0.85vw,14px)] text-emerald-400 font-medium">正常</span>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-[clamp(10px,0.85vw,14px)]">
                  <div className="flex items-center gap-1">
                    <span className="text-slate-400">水平:</span>
                    <span className="text-slate-200 font-mono">0.001°</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-slate-400">垂直:</span>
                    <span className="text-slate-200 font-mono">-0.002°</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 本年度总结 */}
            <div className="relative overflow-hidden rounded-md border border-slate-700/50 bg-slate-900/20 mt-2">
              <div className="relative flex items-stretch">
                <div className="flex flex-col items-center justify-center px-2 py-1.5 bg-slate-800/25 border-r border-slate-700/50">
                  <span className="text-[clamp(10px,0.85vw,14px)] text-slate-300" style={{ writingMode: 'vertical-rl' }}>本年度</span>
                </div>
                <div className="flex-1 px-2 py-2 space-y-1">
                  <div className="flex items-center gap-2">
                      {/* <AlertTriangle className="w-3 h-3 text-amber-400" /> */}
                      <span className="text-[clamp(10px,0.85vw,14px)] text-slate-300">信号强度预警</span>
                      <span className="text-[clamp(10px,0.85vw,14px)] text-amber-400 font-mono font-bold">2</span>
                      <span className="text-[clamp(10px,0.85vw,14px)] text-slate-400">次</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {/* <Activity className="w-3 h-3 text-rose-400" /> */}
                      <span className="text-[clamp(10px,0.85vw,14px)] text-slate-300">天线偏移预警</span>
                      <span className="text-[clamp(10px,0.85vw,14px)] text-rose-400 font-mono font-bold">2</span>
                      <span className="text-[clamp(11px,1.0vw,15px)] text-slate-400">次</span>
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
