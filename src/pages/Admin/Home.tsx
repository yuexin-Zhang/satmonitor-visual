import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Monitor,
  Users,
  Settings,
  FileText,
  Activity,
  ShieldCheck,
} from 'lucide-react';
import { fetchOverview } from '@/src/api/dashboard';
import { fetchUsers, fetchOperationLogs } from '@/src/api/admin';
import type { OverviewData } from '@/src/api/dashboard';
import type { User, OperationLog } from '@/src/api/admin';

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[clamp(14px,1.05vw,20px)] text-slate-500">{label}</p>
          <p className="text-[clamp(22px,1.6vw,34px)] font-bold text-slate-100 mt-1">{value}</p>
        </div>
        <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
    </div>
  );
}

function QuickLink({
  icon: Icon,
  label,
  desc,
  to,
}: {
  icon: React.ElementType;
  label: string;
  desc: string;
  to: string;
}) {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(to)}
      className="flex items-center gap-4 p-4 rounded-lg bg-slate-800/30 border border-slate-800 hover:border-sky-500/30 hover:bg-sky-500/5 transition-colors text-left"
    >
      <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center">
        <Icon className="w-5 h-5 text-sky-500" />
      </div>
      <div>
        <p className="text-[clamp(14px,1.05vw,20px)] font-medium text-slate-200">{label}</p>
        <p className="text-[clamp(14px,1.05vw,20px)] text-slate-500">{desc}</p>
      </div>
    </button>
  );
}

export default function AdminHome() {
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [logs, setLogs] = useState<OperationLog[]>([]);

  useEffect(() => {
    fetchOverview().then(setOverview).catch(() => {});
    fetchUsers().then(setUsers).catch(() => {});
    fetchOperationLogs().then(setLogs).catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Monitor}
          label="系统状态"
          value={overview?.systemStatus === 'normal' ? '运行正常' : '异常'}
          color="bg-emerald-500/20"
        />
        <StatCard icon={Users} label="用户数量" value={users.length} color="bg-sky-500/20" />
        <StatCard icon={FileText} label="操作日志" value={logs.length} color="bg-amber-500/20" />
        <StatCard
          icon={Activity}
          label="在线时长"
          value={overview?.uptime || '--'}
          color="bg-violet-500/20"
        />
      </div>

      {/* 系统信息 + 最近日志 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 系统信息 */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5">
          <h3 className="text-[clamp(22px,1.7vw,36px)] font-medium text-slate-200 mb-4 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-sky-500" />
            系统信息
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between text-[clamp(14px,1.05vw,20px)]">
              <span className="text-slate-500">站点名称</span>
              <span className="text-slate-200">{overview?.siteName || '--'}</span>
            </div>
            <div className="flex justify-between text-[clamp(14px,1.05vw,20px)]">
              <span className="text-slate-500">网络状态</span>
              <span className="text-emerald-400">{overview?.network || '--'}</span>
            </div>
            <div className="flex justify-between text-[clamp(14px,1.05vw,20px)]">
              <span className="text-slate-500">数据库</span>
              <span className="text-emerald-400">{overview?.database || '--'}</span>
            </div>
            <div className="flex justify-between text-[clamp(14px,1.05vw,20px)]">
              <span className="text-slate-500">加密方式</span>
              <span className="text-slate-200">{overview?.encryption || '--'}</span>
            </div>
          </div>
        </div>

        {/* 最近操作日志 */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5">
          <h3 className="text-[clamp(22px,1.7vw,36px)] font-medium text-slate-200 mb-4 flex items-center gap-2">
            <FileText className="w-4 h-4 text-amber-500" />
            最近操作日志
          </h3>
          <div className="space-y-2 max-h-[240px] overflow-y-auto custom-scroll">
            {logs.slice(0, 6).map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between py-2 border-b border-slate-800/50 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                  <div>
                    <p className="text-[clamp(14px,1.05vw,20px)] text-slate-300">{log.action}</p>
                    <p className="text-[clamp(14px,1.05vw,20px)] text-slate-500">{log.detail}</p>
                  </div>
                </div>
                <span className="text-[clamp(14px,1.05vw,20px)] text-slate-500 whitespace-nowrap">{log.time}</span>
              </div>
            ))}
            {logs.length === 0 && (
              <p className="text-[clamp(14px,1.05vw,20px)] text-slate-500 text-center py-4">暂无操作日志</p>
            )}
          </div>
        </div>
      </div>

      {/* 快捷入口 */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5">
        <h3 className="text-[clamp(22px,1.7vw,36px)] font-medium text-slate-200 mb-4">快捷入口</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <QuickLink icon={Settings} label="数据配置" desc="修改告警阈值、站点信息" to="/admin/config" />
          <QuickLink icon={Users} label="用户管理" desc="管理系统用户权限" to="/admin/users" />
          <QuickLink icon={FileText} label="操作日志" desc="查看所有操作记录" to="/admin/logs" />
        </div>
      </div>
    </div>
  );
}
