import { useState, useEffect } from 'react';
import { ChevronRight, Activity } from 'lucide-react';
import { httpGet } from '@/src/http/client';
import { MOCK_DASHBOARD_CONFIG } from '@/src/http/mock';
import type { DashboardConfig, SystemDetail } from '@/src/http/types';

export default function PositionStatus() {
  const [config, setConfig] = useState<Partial<DashboardConfig> | null>(null);
  const [deviceData, setDeviceData] = useState<Partial<SystemDetail> | null>(null);
  const [refreshTime, setRefreshTime] = useState<Date | null>(null);

  useEffect(() => {
    setConfig(MOCK_DASHBOARD_CONFIG);
    httpGet<SystemDetail>('/v1/snow/detail', { params: { tag: 1 } }).then((data) => { setDeviceData(data); setRefreshTime(new Date()); }).catch(() => {});
  }, []);

  const horizontal = config?.position?.horizontal ?? '0.001°';
  const vertical = config?.position?.vertical ?? '-0.002°';
  const status = config?.position?.status ?? '正常';
  const signalAlertCount = config?.position?.signalAlertCount ?? 2;
  const offsetAlertCount = config?.position?.offsetAlertCount ?? 2;

  // 真实设备姿态数据
  const yaw = deviceData?.yaw || '--';
  const roll = deviceData?.roll || '--';
  const pitch = deviceData?.pitch || '--';
  return (
    <div className="dashboard-panel h-full">
       <div className="panel-header py-1.5 min-h-0 bg-transparent border-none justify-between">
        <div className="flex items-center gap-2">
          <Activity className="title-icon text-green-400" />
          <h2 className="panel-title text-white">位移状况</h2>
        </div>
        {refreshTime && <span className="text-[clamp(10px,0.8vw,12px)] text-slate-600 font-mono">{String(refreshTime.getHours()).padStart(2,'0')}:{String(refreshTime.getMinutes()).padStart(2,'0')}:{String(refreshTime.getSeconds()).padStart(2,'0')}</span>}
      </div>
      
      <div className="px-4 pb-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs text-dash-text-dim">水平:</span>
              <span className="font-mono text-sm text-white">{horizontal}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-dash-text-dim">垂直:</span>
              <span className="font-mono text-sm text-white">{vertical}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-dash-text-dim">偏航:</span>
              <span className="font-mono text-sm text-emerald-400">{yaw}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-dash-text-dim">横滚:</span>
              <span className="font-mono text-sm text-emerald-400">{roll}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-dash-text-dim">俯仰:</span>
              <span className="font-mono text-sm text-emerald-400">{pitch}</span>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <div className="text-green-400 text-sm font-bold flex items-center gap-1">
              {status}
              <ChevronRight className="w-3 h-3" />
            </div>
          </div>
        </div>

          <div className="grid grid-cols-2 gap-2 py-2 border-t border-dash-border/30">
          <div className="flex flex-col items-center p-2 bg-blue-500/5 rounded">
             <span className="text-[clamp(12px,1.05vw,17px)] text-dash-text-dim">信号强度预警</span>
             <div className="flex items-baseline gap-1">
               <span className="text-lg font-bold text-white">{signalAlertCount}</span>
               <span className="text-[clamp(12px,1.05vw,17px)] text-dash-text-dim">次</span>
             </div>
          </div>
          <div className="flex flex-col items-center p-2 bg-blue-500/5 rounded">
             <span className="text-[clamp(12px,1.05vw,17px)] text-dash-text-dim">天线偏移预警</span>
             <div className="flex items-baseline gap-1">
               <span className="text-lg font-bold text-white">{offsetAlertCount}</span>
               <span className="text-[clamp(12px,1.05vw,17px)] text-dash-text-dim">次</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
