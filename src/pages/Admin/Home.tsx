import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Satellite,
  ShieldAlert,
  Snowflake,
  Cpu,
  Activity,
  Eye,
} from 'lucide-react';
import { dashboardApi, logApi } from '@/src/http/api';
import type { SatDashboardOverviewVO, VisitStatsVO } from '@/src/http/types';

interface StatItem {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  path: string;
}

export default function AdminHome() {
  const navigate = useNavigate();
  const [overview, setOverview] = useState<SatDashboardOverviewVO | null>(null);
  const [visit, setVisit] = useState<VisitStatsVO | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      dashboardApi.getOverview(),
      logApi.getVisitStats(),
    ]).then(([ov, vs]) => {
      if (ov.status === 'fulfilled') setOverview(ov.value);
      if (vs.status === 'fulfilled') setVisit(vs.value);
      setLoading(false);
    });
  }, []);

  const stats: StatItem[] = [
    {
      label: '台站总数 / 在线',
      value: overview ? `${overview.onlineStations}/${overview.totalStations}` : '--',
      icon: Satellite,
      color: 'bg-sky-500/20',
      path: '/admin/stations',
    },
    {
      label: '活跃告警',
      value: overview?.activeAlarms ?? '--',
      icon: ShieldAlert,
      color: 'bg-rose-500/20',
      path: '/admin/alarms',
    },
    {
      label: '今日融雪执行',
      value: overview?.todaySnowExecCount ?? '--',
      icon: Snowflake,
      color: 'bg-cyan-500/20',
      path: '/admin/snow-exec-logs',
    },
    {
      label: '设备在线率',
      value: overview?.deviceOnlineRate != null ? `${overview.deviceOnlineRate}%` : '--',
      icon: Cpu,
      color: 'bg-emerald-500/20',
      path: '/admin/devices',
    },
    {
      label: '告警闭环率',
      value: overview?.alarmCloseRate != null ? `${overview.alarmCloseRate}%` : '--',
      icon: Activity,
      color: 'bg-amber-500/20',
      path: '/admin/alarms',
    },
  ];

  return (
    <div className="space-y-6 pt-6">
      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {stats.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.label}
              onClick={() => navigate(item.path)}
              className="w-full bg-slate-900/50 border border-slate-800 rounded-xl p-5 text-left hover:border-sky-500/30 hover:bg-sky-500/5 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[clamp(14px,1.05vw,20px)] text-slate-500">{item.label}</p>
                  <p className="text-[clamp(22px,1.6vw,34px)] font-bold text-slate-100 mt-1">
                    {loading ? '--' : item.value}
                  </p>
                </div>
                <div className={`w-10 h-10 rounded-lg ${item.color} flex items-center justify-center`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* 台站运行分布 */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5">
        <h3 className="text-[clamp(18px,1.4vw,28px)] font-medium text-slate-200 mb-4 flex items-center gap-2">
          <Satellite className="w-5 h-5 text-sky-500" />
          台站运行分布
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-[clamp(14px,1.05vw,20px)]">
            <thead>
              <tr className="border-b border-slate-800 text-slate-500">
                <th className="text-left px-3 py-2 font-medium">台站名称</th>
                <th className="text-left px-3 py-2 font-medium">在线状态</th>
                <th className="text-left px-3 py-2 font-medium">活跃告警</th>
                <th className="text-left px-3 py-2 font-medium">今日融雪</th>
                <th className="text-left px-3 py-2 font-medium">最近上报</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {overview?.stationList?.map((s) => (
                <tr key={s.stationId} className="hover:bg-slate-800/30">
                  <td className="px-3 py-2 text-slate-200">{s.stationName}</td>
                  <td className="px-3 py-2">
                    <span className={`inline-flex px-2 py-0.5 rounded ${s.onlineStatus ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'}`}>
                      {s.onlineStatus ? '在线' : '离线'}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-slate-300">{s.alarmCount ?? 0}</td>
                  <td className="px-3 py-2 text-slate-300">{s.todaySnowCount ?? 0}</td>
                  <td className="px-3 py-2 text-slate-400">{s.lastReportTime || '--'}</td>
                </tr>
              ))}
              {!overview?.stationList?.length && (
                <tr>
                  <td colSpan={5} className="px-3 py-8 text-center text-slate-500">
                    {loading ? '加载中...' : '暂无台站数据'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 访问统计 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5">
          <h3 className="text-[clamp(18px,1.4vw,28px)] font-medium text-slate-200 mb-4 flex items-center gap-2">
            <Eye className="w-5 h-5 text-sky-500" />
            访问统计
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex justify-between text-[clamp(14px,1.05vw,20px)] py-3 border-b border-slate-800/50">
              <span className="text-slate-500">今日访客(UV)</span>
              <span className="text-sky-400">{visit?.todayUvCount ?? '--'}</span>
            </div>
            <div className="flex justify-between text-[clamp(14px,1.05vw,20px)] py-3 border-b border-slate-800/50">
              <span className="text-slate-500">累计访客</span>
              <span className="text-slate-200">{visit?.totalUvCount ?? '--'}</span>
            </div>
            <div className="flex justify-between text-[clamp(14px,1.05vw,20px)] py-3 border-b border-slate-800/50">
              <span className="text-slate-500">今日浏览(PV)</span>
              <span className="text-emerald-400">{visit?.todayPvCount ?? '--'}</span>
            </div>
            <div className="flex justify-between text-[clamp(14px,1.05vw,20px)] py-3 border-b border-slate-800/50">
              <span className="text-slate-500">累计浏览</span>
              <span className="text-slate-200">{visit?.totalPvCount ?? '--'}</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5">
          <h3 className="text-[clamp(18px,1.4vw,28px)] font-medium text-slate-200 mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-sky-500" />
            系统运行指标
          </h3>
          <div className="space-y-3 text-[clamp(14px,1.05vw,20px)]">
            <div className="flex justify-between py-3 border-b border-slate-800/50">
              <span className="text-slate-500">平均处置时长</span>
              <span className="text-slate-200">
                {overview?.avgHandleMinutes != null ? `${overview.avgHandleMinutes} 分钟` : '--'}
              </span>
            </div>
            <div className="flex justify-between py-3 border-b border-slate-800/50">
              <span className="text-slate-500">在线台站数</span>
              <span className="text-emerald-400">{overview?.onlineStations ?? '--'}</span>
            </div>
            <div className="flex justify-between py-3 border-b border-slate-800/50">
              <span className="text-slate-500">总台站数</span>
              <span className="text-slate-200">{overview?.totalStations ?? '--'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
