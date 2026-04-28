import { useState, useEffect } from 'react';
import { Sun } from 'lucide-react';
import { fetchDashboardConfig } from '@/src/api/dashboard-config';
import type { DashboardConfig } from '@/src/api/dashboard-config';

export default function SunInterference() {
  const [config, setConfig] = useState<Partial<DashboardConfig> | null>(null);

  useEffect(() => {
    fetchDashboardConfig().then(setConfig).catch(() => {});
  }, []);

  const todayAlert = config?.sunInterference?.todayAlert ?? false;
  const nextPeriod = config?.sunInterference?.nextPeriod ?? '3月4日—3月12日';
  const yearlyCount = config?.sunInterference?.yearlyCount ?? 3;
  return (
    <div className="glass-card h-full flex flex-col">
      <div className="panel-header">
        <h2 className="panel-title"><Sun className="title-icon text-sky-500" />日凌信息</h2>
      </div>

      <div className="panel-content flex-1 flex flex-col gap-1.5 justify-start overflow-y-auto p-2">
        <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-900/5 border border-amber-800/20 text-[clamp(11px,0.9vw,15px)] text-amber-400 font-medium">
              <Sun className="title-icon text-amber-400" />
              日凌
            </span>
            <span className="text-[clamp(11px,0.9vw,15px)] text-emerald-400 font-medium">{todayAlert ? '今日有预警' : '今日无预警'}</span>
        </div>

        <div className="flex items-center gap-2 text-[clamp(11px,0.9vw,15px)]">
          <span className="text-slate-400">距离最近时间:</span>
          <span className="text-slate-200">{nextPeriod}</span>
        </div>

        <div className="flex items-center gap-2 text-[clamp(11px,0.9vw,15px)]">
          <span className="text-slate-400">本年度预警累计</span>
          <span className="text-[clamp(13px,1.05vw,18px)] text-amber-400 font-mono font-bold">{yearlyCount}</span>
          <span className="text-slate-400">次</span>
          <span className="text-[clamp(11px,0.9vw,15px)] text-slate-500">（前一天预警）</span>
        </div>
      </div>
    </div>
  );
}
