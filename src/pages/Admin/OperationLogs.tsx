import { useEffect, useState } from 'react';
import { FileText, Clock, User, Activity } from 'lucide-react';
import { fetchOperationLogs } from '@/src/api/admin';
import type { OperationLog } from '@/src/api/admin';

export default function OperationLogs() {
  const [logs, setLogs] = useState<OperationLog[]>([]);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    fetchOperationLogs().then(setLogs).catch(() => {});
  }, []);

  const filtered = logs.filter(
    (log) =>
      log.user.includes(filter) ||
      log.action.includes(filter) ||
      log.detail.includes(filter)
  );

  return (
    <div className="pt-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-[clamp(18px,1.3vw,26px)] font-medium text-slate-100 flex items-center gap-2">
          <FileText className="w-5 h-5 text-sky-500" />
          操作日志
        </h2>
        <input
          type="text"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="搜索用户、操作或详情..."
          className="bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-[clamp(14px,1.05vw,20px)] text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-sky-500/50 w-64"
        />
      </div>

      <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
        <table className="w-full text-[clamp(14px,1.05vw,20px)]">
          <thead>
            <tr className="border-b border-slate-800 text-slate-500">
              <th className="text-left px-5 py-3 font-medium">ID</th>
              <th className="text-left px-5 py-3 font-medium">操作用户</th>
              <th className="text-left px-5 py-3 font-medium">操作类型</th>
              <th className="text-left px-5 py-3 font-medium">详情</th>
              <th className="text-left px-5 py-3 font-medium">时间</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {filtered.map((log) => (
              <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                <td className="px-5 py-3 text-slate-400">{log.id}</td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-slate-500" />
                    <span className="text-slate-200">{log.user}</span>
                  </div>
                </td>
                <td className="px-5 py-3">
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[clamp(14px,1.05vw,20px)] bg-sky-500/10 text-sky-400 border border-sky-500/20">
                    <Activity className="w-3 h-3" />
                    {log.action}
                  </span>
                </td>
                <td className="px-5 py-3 text-slate-300 max-w-xs truncate" title={log.detail}>
                  {log.detail}
                </td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Clock className="w-3.5 h-3.5" />
                    {log.time}
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-slate-500">
                  暂无操作日志
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 text-[clamp(14px,1.05vw,20px)] text-slate-600">
        共 {filtered.length} 条记录{filter ? '（已过滤）' : ''}
      </div>
    </div>
  );
}
