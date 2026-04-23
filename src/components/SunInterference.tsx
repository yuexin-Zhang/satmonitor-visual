import { Sun } from 'lucide-react';

export default function SunInterference() {
  return (
    <div className="glass-card h-full flex flex-col">
      <div className="panel-header">
        <h2 className="panel-title"><Sun className="title-icon text-sky-500" />日凌信息</h2>
      </div>

      <div className="panel-content flex-1 flex flex-col gap-1.5 justify-start overflow-y-auto">
        <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-900/5 border border-amber-800/20 text-[clamp(10px,0.85vw,14px)] text-amber-400 font-medium">
              <Sun className="title-icon text-amber-400" />
              日凌
            </span>
            <span className="text-[clamp(10px,0.85vw,14px)] text-emerald-400 font-medium">今日无预警</span>
        </div>

        <div className="flex items-center gap-2 text-[clamp(10px,0.85vw,14px)]">
          <span className="text-slate-400">距离最近时间:</span>
          <span className="text-slate-200">3月4日—3月12日</span>
        </div>

        <div className="flex items-center gap-2 text-[clamp(10px,0.85vw,14px)]">
          <span className="text-slate-400">本年度预警累计</span>
          <span className="text-[clamp(12px,1.0vw,18px)] text-amber-400 font-mono font-bold">3</span>
          <span className="text-slate-400">次</span>
          <span className="text-[clamp(10px,0.85vw,14px)] text-slate-500">（前一天预警）</span>
        </div>
      </div>
    </div>
  );
}
