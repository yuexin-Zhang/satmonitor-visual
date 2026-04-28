import { useState, useEffect } from 'react';
import { Zap } from 'lucide-react';
import { LineChart } from '@mui/x-charts/LineChart';
import { useXScale, useYScale } from '@mui/x-charts';
import { fetchDashboardConfig } from '@/src/api/dashboard-config';
import type { DashboardConfig } from '@/src/api/dashboard-config';

export default function PowerInfo() {
  const [chartKey, setChartKey] = useState(0);
  useEffect(() => {
    setChartKey(k => k + 1);
  }, []);

  const [config, setConfig] = useState<Partial<DashboardConfig> | null>(null);

  useEffect(() => {
    fetchDashboardConfig().then(setConfig).catch(() => {});
  }, []);

  const powerData = config?.power?.powerHistory?.data ?? [4.2, 3.8, 5.1, 4.5, 4.0, 4.8];
  const months = config?.power?.powerHistory?.labels ?? ['1月', '2月', '3月', '4月', '5月', '6月'];
  const powerMax = config?.power?.powerHistory?.max ?? 5.1;
  const voltage = config?.power?.voltage ?? '220V';
  const current = config?.power?.current ?? '3A';
  const yearlyConsumption = config?.power?.yearlyConsumption ?? 5;

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
      <div className="panel-header">
        <h2 className="panel-title">
          <Zap className="title-icon text-sky-500" />
          电源信息
        </h2>
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

        {/* 功率曲线图 */}
        <div className="flex-1 flex flex-col">
          <div className="flex justify-between items-center text-[clamp(12px,1vw,16px)] mb-0.5">
            <span className="text-slate-400">功率曲线图</span>
            <span className="text-yellow-400 font-mono">MAX: {powerMax} kWh</span>
          </div>
          <div className="flex-1" style={{ overflow: 'visible' }}>
            <LineChart key={chartKey}
              xAxis={[{ data: months, scaleType: 'point' }]}
              yAxis={[{ min: 0, max: 6, tickInterval: [0, 2, 4, 6] }]}
              series={[
                {
                  data: powerData,
                  color: '#facc15',
                  showMark: true,
                  label: '耗电量',
                  curve: 'monotoneX'
                },
              ]}
              height={160}
              margin={{ top: 20, bottom: 28, left: 20, right: 20 }}
              grid={{ horizontal: true, vertical: true }}
              slotProps={{
                legend: { hidden: true } as any,
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
                '.MuiChartsTooltip-paper': {
                  backgroundColor: '#0f172a !important',
                  color: '#e2e8f0 !important',
                  border: '1px solid rgba(250, 204, 21, 0.3) !important',
                  borderRadius: '4px !important',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3) !important',
                  zIndex: '9999 !important'
                },
                '.MuiChartsTooltip-table': {
                  fontSize: 'clamp(11px, 0.9vw, 14px) !important',
                  color: '#e2e8f0 !important'
                },
                '.MuiChartsTooltip-table caption': {
                  fontSize: 'clamp(11px, 0.9vw, 14px) !important',
                  padding: '2px 4px !important',
                  color: '#facc15 !important'
                },
                '.MuiChartsTooltip-cell': {
                  fontSize: 'clamp(11px, 0.9vw, 14px) !important',
                  color: '#e2e8f0 !important'
                },
                '.MuiChartsTooltip-mark': {
                  width: '6px !important',
                  height: '6px !important'
                },
                '.MuiChartsTooltip-root': {
                  pointerEvents: 'auto'
                }
              }}
            >
              <LineLabels data={powerData} xData={months} />
            </LineChart>
          </div>
        </div>
      </div>
    </div>
  );
}
