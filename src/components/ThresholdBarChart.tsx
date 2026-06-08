import { useMemo, useCallback } from 'react';
import { BarChart } from '@mui/x-charts/BarChart';

export type TimeRange = 'hour' | 'day' | 'week' | 'month' | 'halfYear' | 'year';

interface ThresholdBarChartProps {
  data: { label: string; value: number }[];
  threshold: number;
  colorAbove?: string;
  colorBelow?: string;
  yMax: number;
  yTickInterval?: number[];
  title?: string;
  rightLabel?: string;
  range?: TimeRange;
  onRangeChange?: (range: TimeRange) => void;
  height?: number;
  unit?: string;
}

const RANGE_OPTIONS: { value: TimeRange; label: string }[] = [
  { value: 'hour', label: '小时' },
  { value: 'day', label: '日' },
  { value: 'week', label: '周' },
  { value: 'month', label: '月' },
  { value: 'halfYear', label: '6个月' },
  { value: 'year', label: '年' },
];

export default function ThresholdBarChart({
  data,
  threshold,
  colorAbove = '#0ea5e9',
  colorBelow = '#f43f5e',
  yMax,
  yTickInterval,
  title,
  rightLabel,
  range,
  onRangeChange,
  height = 160,
  unit = '',
}: ThresholdBarChartProps) {
  const labels = useMemo(() => data.map((d) => d.label), [data]);

  const aboveData = useMemo(
    () => data.map((d) => (d.value >= threshold ? d.value : null)),
    [data, threshold],
  );
  const belowData = useMemo(
    () => data.map((d) => (d.value < threshold ? d.value : null)),
    [data, threshold],
  );

  // bar label 不带单位，只显示数字
  const aboveBarLabel = useCallback((item: any) => item.value != null ? `${item.value}` : '', []);
  const belowBarLabel = useCallback((item: any) => item.value != null ? `${item.value}` : '', []);

  const showRangeSelector = range != null && onRangeChange != null;

  return (
    <div className="flex flex-col">
      {/* 标题行：左侧标题+阈值，右侧单位 */}
      {(title || unit) && (
        <div className="flex justify-between items-center text-[clamp(11px,0.9vw,15px)] mb-1">
          <span className="text-slate-400">
            {title}
            {threshold != null && (
              <span className="text-slate-500 ml-2">
                阈值: {threshold}{unit}
              </span>
            )}
          </span>
          {unit && <span className="text-slate-500 font-mono">{unit}</span>}
          {!unit && rightLabel && <span className="text-sky-400 font-mono">{rightLabel}</span>}
        </div>
      )}

      {/* 范围切换（可选） */}
      {showRangeSelector && (
        <div className="flex gap-1 mb-1.5">
          {RANGE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onRangeChange!(opt.value)}
              className={`px-2 py-0.5 rounded text-[clamp(10px,0.8vw,13px)] font-medium transition-colors ${
                range === opt.value
                  ? 'bg-sky-600 text-white'
                  : 'bg-slate-800/60 text-slate-400 hover:bg-slate-700/60 hover:text-slate-300'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}

      {/* 柱状图 */}
      <div style={{ overflow: 'visible' }}>
        <BarChart
          xAxis={[{ scaleType: 'band', data: labels }]}
          yAxis={
            yTickInterval
              ? [{ min: 0, max: yMax, tickInterval: yTickInterval }]
              : [{ min: 0, max: yMax }]
          }
          series={[
            {
              data: aboveData,
              label: '正常',
              color: colorAbove,
              stack: 'val',
              barLabel: aboveBarLabel,
              valueFormatter: (v: number | null) => v != null ? `${v}${unit}` : '',
            },
            {
              data: belowData,
              label: '预警',
              color: colorBelow,
              stack: 'val',
              barLabel: belowBarLabel,
              valueFormatter: (v: number | null) => v != null ? `${v}${unit}` : '',
            },
          ]}
          height={height}
          margin={{ top: 18, bottom: 24, left: 8, right: 8 }}
          grid={{ horizontal: true, vertical: false }}
          slotProps={{
            legend: { hidden: true } as any,
            // trigger='item' 只显示 hover 到的那根柱子的信息，不显示另一条 series
            tooltip: { trigger: 'item' } as any,
            barLabel: {
              style: { fill: '#e2e8f0', fontSize: 'clamp(10px, 0.8vw, 12px)' },
            } as any,
          }}
          sx={{
            '& .MuiChartsAxis-tickLabel': {
              fill: '#94a3b8 !important',
              fontSize: 'clamp(10px, 0.85vw, 13px) !important',
            },
            '& .MuiChartsAxis-line': { stroke: '#1e293b !important' },
            '& .MuiChartsAxis-tick': { stroke: '#1e293b !important' },
            '& .MuiChartsGrid-line': { stroke: '#1e293b !important', strokeDasharray: 'none !important' },
            '.MuiChartsTooltip-paper': {
              backgroundColor: '#0f172a !important',
              color: '#e2e8f0 !important',
              border: '1px solid rgba(14, 165, 233, 0.3) !important',
              borderRadius: '4px !important',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3) !important',
            },
            '.MuiChartsTooltip-table': {
              fontSize: 'clamp(11px, 0.9vw, 14px) !important',
              color: '#e2e8f0 !important',
            },
            '.MuiChartsTooltip-table caption': {
              fontSize: 'clamp(11px, 0.9vw, 14px) !important',
              color: '#94a3b8 !important',
            },
            '.MuiChartsTooltip-table td': {
              color: '#e2e8f0 !important',
            },
            '.MuiChartsTooltip-table th': {
              color: '#94a3b8 !important',
            },
            '.MuiChartsTooltip-mark': {
              width: '8px !important',
              height: '8px !important',
            },
          }}
        />
      </div>
    </div>
  );
}
