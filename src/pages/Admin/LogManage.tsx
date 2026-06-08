import { useState, useEffect } from 'react';
import { FileText, Trash2, Filter, AlertTriangle, Info, AlertCircle, Bug, Download } from 'lucide-react';
import { httpGet, httpPost } from '@/src/http/client';
import type { SystemLog } from '@/src/http/types';

const LEVEL_MAP = {
  info: { label: '信息', color: 'bg-sky-500/10 text-sky-400 border border-sky-500/20', icon: Info },
  warning: { label: '警告', color: 'bg-amber-500/10 text-amber-400 border border-amber-500/20', icon: AlertTriangle },
  error: { label: '错误', color: 'bg-rose-500/10 text-rose-400 border border-rose-500/20', icon: AlertCircle },
  debug: { label: '调试', color: 'bg-slate-500/10 text-slate-400 border border-slate-500/20', icon: Bug },
};

const MODULE_OPTIONS = ['全部', '用户管理', '传感器', '融雪策略', '抓拍系统', '日凌管理', 'OTA升级', '系统'];
const LEVEL_OPTIONS = ['全部', 'info', 'warning', 'error', 'debug'];

export default function LogManage() {
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [filtered, setFiltered] = useState<SystemLog[]>([]);
  const [moduleFilter, setModuleFilter] = useState('全部');
  const [levelFilter, setLevelFilter] = useState('全部');
  const [keyword, setKeyword] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  useEffect(() => {
    httpGet<SystemLog[]>('/admin/system-logs').then((data) => {
      setLogs(data);
      setFiltered(data);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    let result = [...logs];
    if (moduleFilter !== '全部') {
      result = result.filter((l) => l.module === moduleFilter);
    }
    if (levelFilter !== '全部') {
      result = result.filter((l) => l.level === levelFilter);
    }
    if (keyword.trim()) {
      const k = keyword.toLowerCase();
      result = result.filter((l) =>
        l.message.toLowerCase().includes(k) ||
        l.detail.toLowerCase().includes(k) ||
        (l.user || '').toLowerCase().includes(k)
      );
    }
    if (dateRange.start) {
      result = result.filter((l) => l.createdAt >= dateRange.start);
    }
    if (dateRange.end) {
      result = result.filter((l) => l.createdAt <= dateRange.end + ' 23:59:59');
    }
    setFiltered(result);
  }, [logs, moduleFilter, levelFilter, keyword, dateRange]);

  const handleClear = async () => {
    if (!confirm('确定清空所有日志吗？此操作不可恢复。')) return;
    try {
      await httpPost('/admin/system-logs/clear');
      setLogs([]);
      setFiltered([]);
    } catch (err) {
      console.error('清空失败', err);
    }
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(filtered, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logs_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const inputClass =
    'bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-[clamp(14px,1.05vw,20px)] text-slate-200 focus:outline-none focus:border-sky-500/50';

  return (
    <div className="pt-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-[clamp(18px,1.3vw,26px)] font-medium text-slate-100 flex items-center gap-2">
          <FileText className="w-5 h-5 text-sky-500" />
          日志管理
        </h2>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-[clamp(14px,1.05vw,20px)] text-slate-300 transition-colors"
          >
            <Download className="w-4 h-4" />
            导出
          </button>
          <button
            onClick={handleClear}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-[clamp(14px,1.05vw,20px)] text-white transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            清空
          </button>
        </div>
      </div>

      {/* 筛选栏 */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 mb-4 flex flex-wrap items-end gap-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-500" />
          <span className="text-[clamp(14px,1.05vw,20px)] text-slate-500">筛选：</span>
        </div>
        <div>
          <label className="block text-xs text-slate-600 mb-1">模块</label>
          <select value={moduleFilter} onChange={(e) => setModuleFilter(e.target.value)} className={inputClass}>
            {MODULE_OPTIONS.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-slate-600 mb-1">级别</label>
          <select value={levelFilter} onChange={(e) => setLevelFilter(e.target.value)} className={inputClass}>
            {LEVEL_OPTIONS.map((l) => (
              <option key={l} value={l}>{l === '全部' ? '全部' : LEVEL_MAP[l as keyof typeof LEVEL_MAP].label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-slate-600 mb-1">开始时间</label>
          <input type="date" value={dateRange.start} onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })} className={inputClass} />
        </div>
        <div>
          <label className="block text-xs text-slate-600 mb-1">结束时间</label>
          <input type="date" value={dateRange.end} onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })} className={inputClass} />
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs text-slate-600 mb-1">关键词</label>
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="搜索日志内容..."
            className={`${inputClass} w-full`}
          />
        </div>
      </div>

      {/* 日志列表 */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
        <table className="w-full text-[clamp(14px,1.05vw,20px)]">
          <thead>
            <tr className="border-b border-slate-800 text-slate-500">
              <th className="text-left px-5 py-3">级别</th>
              <th className="text-left px-5 py-3">模块</th>
              <th className="text-left px-5 py-3">消息</th>
              <th className="text-left px-5 py-3">详情</th>
              <th className="text-left px-5 py-3">用户</th>
              <th className="text-left px-5 py-3">IP</th>
              <th className="text-left px-5 py-3">时间</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {filtered.map((log) => {
              const levelInfo = LEVEL_MAP[log.level];
              const LevelIcon = levelInfo.icon;
              return (
                <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[clamp(14px,1.05vw,20px)] ${levelInfo.color}`}>
                      <LevelIcon className="w-3 h-3" />
                      {levelInfo.label}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-slate-400">{log.module}</td>
                  <td className="px-5 py-3 text-slate-200 max-w-xs truncate" title={log.message}>{log.message}</td>
                  <td className="px-5 py-3 text-slate-400 max-w-xs truncate" title={log.detail}>{log.detail}</td>
                  <td className="px-5 py-3 text-slate-400">{log.user || '--'}</td>
                  <td className="px-5 py-3 text-slate-500 font-mono text-xs">{log.ip || '--'}</td>
                  <td className="px-5 py-3 text-slate-400 whitespace-nowrap">{log.createdAt}</td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="px-5 py-8 text-center text-slate-500">暂无日志记录</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 text-[clamp(14px,1.05vw,20px)] text-slate-600">
        共 {filtered.length} 条记录{keyword || moduleFilter !== '全部' || levelFilter !== '全部' ? '（已过滤）' : ''}
      </div>
    </div>
  );
}
