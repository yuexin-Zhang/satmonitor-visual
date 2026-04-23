import { ChevronRight, Activity } from 'lucide-react';

export default function PositionStatus() {
  return (
    <div className="dashboard-panel h-full">
       <div className="panel-header py-1.5 min-h-0 bg-transparent border-none">
        <div className="flex items-center gap-2">
          <Activity className="title-icon text-green-400" />
          <h2 className="panel-title text-white">位移状况</h2>
        </div>
      </div>
      
      <div className="px-4 pb-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs text-dash-text-dim">水平:</span>
              <span className="font-mono text-sm text-white">0.001°</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-dash-text-dim">垂直:</span>
              <span className="font-mono text-sm text-white">-0.002°</span>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <div className="text-green-400 text-sm font-bold flex items-center gap-1">
              正常
              <ChevronRight className="w-3 h-3" />
            </div>
          </div>
        </div>

          <div className="grid grid-cols-2 gap-2 py-2 border-t border-dash-border/30">
          <div className="flex flex-col items-center p-2 bg-blue-500/5 rounded">
             <span className="text-[clamp(10px,0.9vw,13px)] text-dash-text-dim">信号强度预警</span>
             <div className="flex items-baseline gap-1">
               <span className="text-lg font-bold text-white">2</span>
               <span className="text-[clamp(10px,0.9vw,13px)] text-dash-text-dim">次</span>
             </div>
          </div>
          <div className="flex flex-col items-center p-2 bg-blue-500/5 rounded">
             <span className="text-[clamp(10px,0.9vw,13px)] text-dash-text-dim">天线偏移预警</span>
             <div className="flex items-baseline gap-1">
               <span className="text-lg font-bold text-white">2</span>
               <span className="text-[clamp(10px,0.9vw,13px)] text-dash-text-dim">次</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
