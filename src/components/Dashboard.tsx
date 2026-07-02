import { useState, useEffect } from 'react';
import Header from './Header';
import AntennaInfo from './AntennaInfo';
import PositionStatus from './PositionStatus';
import SunInterference from './SunInterference';
import LiveVideo from './LiveVideo';
import EnvironmentalInfo from './EnvironmentalInfo';
import PowerInfo from './PowerInfo';
import OperationsRecord from './OperationsRecord';
import MaintenanceTips from './MaintenanceTips';
import AntennaDisplay from './AntennaDisplay';
import BackgroundAnimation from './BackgroundAnimation';
import { stationApi } from '@/src/http/api';
import { getEffectiveStationId } from '@/src/http/client';
import type { SatStationOverviewVO } from '@/src/http/types';

export default function Dashboard() {
  // 台站运行总览：驱动底部状态栏的 NETWORK 在线状态与设备最后上报时间。
  // /v1/sat/stations/{id}/overview 需登录态；未绑定台站时回退默认 1，接口失败时回退静态默认。
  const [overview, setOverview] = useState<SatStationOverviewVO | null>(null);

  useEffect(() => {
    stationApi.getOverview(getEffectiveStationId()).then(setOverview).catch(() => {});
  }, []);

  // onlineStatus: 1=在线, 0/其它=离线；接口未返回时维持默认 ONLINE
  const online = overview?.onlineStatus === 1;
  const onlineUnknown = overview == null || overview.onlineStatus == null;
  const networkColor = onlineUnknown ? 'bg-green-500' : online ? 'bg-green-500' : 'bg-red-500';
  const networkLabel = onlineUnknown ? 'NETWORK: ONLINE' : online ? 'NETWORK: ONLINE' : 'NETWORK: OFFLINE';
  // SYSTEM_UPTIME 无对应后端接口，改用设备最后上报时间（更真实），无数据时显示 --
  const lastReport = overview?.lastReportTime;

  return (
    <div className="flex flex-col h-screen w-full bg-dash-bg text-slate-200 overflow-hidden grid-bg relative">
      {/* 炫酷背景动画层 */}
      <BackgroundAnimation />
      
      {/* 环境光晕层 */}
      <div className="ambient-glow" />
      
      {/* CRT 扫描线覆盖 */}
      <div className="crt-overlay" />

      {/* 内容层 */}
      <div className="relative z-10 flex flex-col h-full">
        <Header />

        <main className="flex-1 p-4 grid grid-cols-12 gap-4 min-h-0 overflow-y-auto">
          {/* Left Column */}
          <div className="col-span-3 flex flex-col gap-3 overflow-hidden">
            <div className="flex-[4.5] min-h-0">
              <AntennaInfo />
            </div>
            <div className="flex-[1.8] min-h-0">
              <SunInterference />
            </div>
            <div className="flex-[3] min-h-0">
              <LiveVideo />
            </div>
          </div>

          {/* Center Column */}
          <div className="col-span-6 flex flex-col gap-4 overflow-auto relative">
            <div className="flex-1 min-h-0">
              <AntennaDisplay />
            </div>
            <div className="shrink-0">
              <MaintenanceTips />
            </div>
          </div>

          {/* Right Column */}
          <div className="col-span-3 flex flex-col gap-4 overflow-hidden">
            <div className="flex-[2.3] min-h-0">
              <EnvironmentalInfo />
            </div>
            <div className="flex-[1.9] min-h-0">
              <PowerInfo />
            </div>
            <div className="flex-[2.1] min-h-0">
              <OperationsRecord />
            </div>
          </div>
        </main>

        {/* Footer Status Bar */}
        <footer className="h-10 flex justify-between items-center px-6 text-[clamp(11px,0.95vw,15px)] text-slate-500 py-1 border-t border-slate-900 bg-slate-950/80 backdrop-blur-sm">
          <div className="flex space-x-6">
            <span className="flex items-center">
              <span className={`w-1.5 h-1.5 ${networkColor} rounded-full mr-1.5 animate-pulse`}></span> {networkLabel}
            </span>
            <span className="flex items-center">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5"></span> DATABASE: CONNECTED
            </span>
            <span className="flex items-center">
              <span className="w-1.5 h-1.5 bg-sky-500 rounded-full mr-1.5"></span> ENCRYPTION: AES-256
            </span>
          </div>
          <div className="font-mono">LAST_REPORT: {lastReport || '--'}</div>
        </footer>
      </div>
    </div>
  );
}
