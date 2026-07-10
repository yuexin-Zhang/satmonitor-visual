import { useState, useEffect } from 'react';
import { Bell, Info, Flame, AlertTriangle, CheckCircle, Wifi, Activity } from 'lucide-react';
import { dashboardApi } from '@/src/http/api';
import type { SatDashboardOverviewVO, SatStationOverviewVO } from '@/src/http/types';

function formatRefreshTime(date: Date) {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`;
}

function formatLastReport(timeStr?: string) {
  if (!timeStr) return '--';
  const d = new Date(timeStr);
  if (isNaN(d.getTime())) return '--';
  return `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export default function OperationsRecord() {
  const [overview, setOverview] = useState<SatDashboardOverviewVO | null>(null);
  const [refreshTime, setRefreshTime] = useState<Date | null>(null);

  useEffect(() => {
    dashboardApi
      .getOverview()
      .then((data) => { setOverview(data); setRefreshTime(new Date()); })
      .catch(() => setRefreshTime(new Date()));
  }, []);

  const activeAlarms = overview?.activeAlarms ?? 0;
  const todaySnowExecCount = overview?.todaySnowExecCount ?? 0;
  const alarmCloseRate = overview?.alarmCloseRate;
  const avgHandleMinutes = overview?.avgHandleMinutes;
  const deviceOnlineRate = overview?.deviceOnlineRate;
  const stationList = overview?.stationList ?? [];

  return (
    <div className="glass-card h-full flex flex-col">
      <div className="panel-header justify-between">
        <h2 className="panel-title">
          <Bell className="title-icon text-sky-500" />
          运维记录
        </h2>
        <span className="text-[clamp(10px,0.8vw,12px)] text-slate-600 font-mono">
          {refreshTime ? formatRefreshTime(refreshTime) : '--:--:--'}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-2 custom-scroll">
        {/* 运维指标 */}
        <div className="grid grid-cols-2 gap-2 mb-2">
          <div className="rounded-md border border-orange-500/20 bg-orange-950/5 px-2 py-1.5">
            <div className="flex items-center gap-1.5 mb-0.5">
              <Flame className="w-3.5 h-3.5 text-orange-400" />
              <span className="text-[clamp(10px,0.8vw,13px)] text-slate-400">今日融雪</span>
            </div>
            <div className="text-[clamp(14px,1.1vw,19px)] text-orange-400 font-bold font-mono">
              {todaySnowExecCount} <span className="text-[clamp(10px,0.8vw,13px)] font-normal text-slate-400">次</span>
            </div>
          </div>

          <div className="rounded-md border border-red-500/20 bg-red-950/5 px-2 py-1.5">
            <div className="flex items-center gap-1.5 mb-0.5">
              <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
              <span className="text-[clamp(10px,0.8vw,13px)] text-slate-400">活跃告警</span>
            </div>
            <div className="text-[clamp(14px,1.1vw,19px)] text-red-400 font-bold font-mono">
              {activeAlarms} <span className="text-[clamp(10px,0.8vw,13px)] font-normal text-slate-400">条</span>
            </div>
          </div>

          <div className="rounded-md border border-emerald-500/20 bg-emerald-950/5 px-2 py-1.5">
            <div className="flex items-center gap-1.5 mb-0.5">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[clamp(10px,0.8vw,13px)] text-slate-400">告警闭环率</span>
            </div>
            <div className="text-[clamp(14px,1.1vw,19px)] text-emerald-400 font-bold font-mono">
              {alarmCloseRate != null ? `${Math.round(alarmCloseRate * 10) / 10}%` : '--'}
            </div>
          </div>

          <div className="rounded-md border border-sky-500/20 bg-sky-950/5 px-2 py-1.5">
            <div className="flex items-center gap-1.5 mb-0.5">
              <Activity className="w-3.5 h-3.5 text-sky-400" />
              <span className="text-[clamp(10px,0.8vw,13px)] text-slate-400">平均处置</span>
            </div>
            <div className="text-[clamp(14px,1.1vw,19px)] text-sky-400 font-bold font-mono">
              {avgHandleMinutes != null ? `${Math.round(avgHandleMinutes * 10) / 10}` : '--'} <span className="text-[clamp(10px,0.8vw,13px)] font-normal text-slate-400">分钟</span>
            </div>
          </div>
        </div>

        {/* 台站运行分布 */}
        <div className="border-t border-slate-800 pt-2">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[clamp(11px,0.9vw,14px)] text-slate-300 font-medium">台站运行分布</span>
            <div className="flex items-center gap-2 text-[clamp(10px,0.8vw,12px)] text-slate-400">
              <Wifi className="w-3 h-3 text-emerald-400" />
              <span>在线率 {deviceOnlineRate != null ? `${Math.round(deviceOnlineRate * 10) / 10}%` : '--'}</span>
            </div>
          </div>

          {stationList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6 text-slate-500">
              <Info className="w-6 h-6 mb-1.5 text-slate-600" />
              <p className="text-[clamp(11px,0.9vw,14px)]">暂无台站数据</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {stationList.map((s: SatStationOverviewVO) => (
                <div key={s.stationId} className="flex items-center gap-2 px-1.5 py-1 rounded bg-slate-800/20">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${s.onlineStatus === 1 ? 'bg-emerald-500' : 'bg-slate-600'}`} />
                  <span className="text-[clamp(11px,0.9vw,14px)] text-slate-200 flex-1 truncate">{s.stationName || `台站${s.stationId}`}</span>
                  {s.alarmCount != null && s.alarmCount > 0 && (
                    <span className="text-[clamp(10px,0.8vw,12px)] text-red-400 font-mono">{s.alarmCount}告警</span>
                  )}
                  {s.todaySnowCount != null && s.todaySnowCount > 0 && (
                    <span className="text-[clamp(10px,0.8vw,12px)] text-orange-400 font-mono">{s.todaySnowCount}融雪</span>
                  )}
                  <span className="text-[clamp(10px,0.8vw,12px)] text-slate-500 font-mono shrink-0">{formatLastReport(s.lastReportTime)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
