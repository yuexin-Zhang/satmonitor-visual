import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Settings,
  Sun,
  FileText,
  Package,
  ShieldCheck,
} from 'lucide-react';

interface StatItem {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  path: string;
}

function StatCard({ item }: { item: StatItem }) {
  const navigate = useNavigate();
  const Icon = item.icon;
  return (
    <button
      onClick={() => navigate(item.path)}
      className="w-full bg-slate-900/50 border border-slate-800 rounded-xl p-5 text-left hover:border-sky-500/30 hover:bg-sky-500/5 transition-colors"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[clamp(14px,1.05vw,20px)] text-slate-500">{item.label}</p>
          <p className="text-[clamp(22px,1.6vw,34px)] font-bold text-slate-100 mt-1">{item.value}</p>
        </div>
        <div className={`w-10 h-10 rounded-lg ${item.color} flex items-center justify-center`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
    </button>
  );
}

export default function AdminHome() {
  const [stats, setStats] = useState<StatItem[]>([
    { label: '用户数量', value: '--', icon: Users, color: 'bg-sky-500/20', path: '/admin/users' },
    { label: '策略配置', value: '--', icon: Settings, color: 'bg-emerald-500/20', path: '/admin/strategy' },
    { label: '日凌记录', value: '--', icon: Sun, color: 'bg-amber-500/20', path: '/admin/sun-interference' },
    { label: '日志数量', value: '--', icon: FileText, color: 'bg-violet-500/20', path: '/admin/logs' },
    { label: 'OTA模型', value: '--', icon: Package, color: 'bg-rose-500/20', path: '/admin/ota' },
  ]);

  useEffect(() => {
    // 后续接入真实后端后，可在此调用接口获取概览数据
    // 暂时使用模拟数据展示布局
    const timer = setTimeout(() => {
      setStats((prev) =>
        prev.map((s) => ({
          ...s,
          value: s.label === '用户数量' ? 3 : s.label === '策略配置' ? 5 : s.label === '日凌记录' ? 2 : s.label === '日志数量' ? 128 : 4,
        }))
      );
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="space-y-6 pt-6">
      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {stats.map((item) => (
          <StatCard key={item.label} item={item} />
        ))}
      </div>

      {/* 系统状态 */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5">
        <h3 className="text-[clamp(18px,1.4vw,28px)] font-medium text-slate-200 mb-4 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-sky-500" />
          系统状态
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex justify-between text-[clamp(14px,1.05vw,20px)] py-3 border-b border-slate-800/50">
            <span className="text-slate-500">系统运行状态</span>
            <span className="text-emerald-400">运行正常</span>
          </div>
          <div className="flex justify-between text-[clamp(14px,1.05vw,20px)] py-3 border-b border-slate-800/50">
            <span className="text-slate-500">数据库连接</span>
            <span className="text-emerald-400">已连接</span>
          </div>
          <div className="flex justify-between text-[clamp(14px,1.05vw,20px)] py-3 border-b border-slate-800/50">
            <span className="text-slate-500">网络状态</span>
            <span className="text-emerald-400">在线</span>
          </div>
          <div className="flex justify-between text-[clamp(14px,1.05vw,20px)] py-3 border-b border-slate-800/50">
            <span className="text-slate-500">传感器在线数</span>
            <span className="text-slate-200">12 / 12</span>
          </div>
          <div className="flex justify-between text-[clamp(14px,1.05vw,20px)] py-3 border-b border-slate-800/50">
            <span className="text-slate-500">融雪策略状态</span>
            <span className="text-emerald-400">自动运行中</span>
          </div>
          <div className="flex justify-between text-[clamp(14px,1.05vw,20px)] py-3 border-b border-slate-800/50">
            <span className="text-slate-500">OTA模型版本</span>
            <span className="text-slate-200">v2.1.0</span>
          </div>
        </div>
      </div>
    </div>
  );
}
