import { useEffect, useState, useCallback } from 'react';
import { FileText, Download, RefreshCw, Activity } from 'lucide-react';
import { logApi } from '@/src/http/api';
import type { LogPageVO, VisitStatsVO, VisitTrendVO } from '@/src/http/types';

export default function LogManage() {
  const [list, setList] = useState<LogPageVO[]>([]);
  const [total, setTotal] = useState(0);
  const [pageNum, setPageNum] = useState(1);
  const [pageSize] = useState(15);
  const [keywords, setKeywords] = useState('');
  const [module, setModule] = useState('');
  const [loading, setLoading] = useState(false);

  const [visit, setVisit] = useState<VisitStatsVO | null>(null);
  const [trend, setTrend] = useState<VisitTrendVO | null>(null);

  const loadList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await logApi.getPage({
        pageNum,
        pageSize,
        keywords: keywords || undefined,
        module: module || undefined,
      });
      setList(res.list || []);
      setTotal(res.total || 0);
    } catch (err) {
      console.error('加载日志失败', err);
    } finally {
      setLoading(false);
    }
  }, [pageNum, pageSize, keywords, module]);

  useEffect(() => {
    logApi.getVisitStats().then(setVisit).catch(() => {});
    logApi.getVisitTrend().then(setTrend).catch(() => {});
  }, []);

  useEffect(() => {
    loadList();
  }, [loadList]);

  const handleExport = () => {
    const dataStr = JSON.stringify(list, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logs_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const inputClass =
    'bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-[clamp(14px,1.05vw,20px)] text-slate-200 focus:outline-none focus:border-sky-500/50';

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  // 简易趋势柱状图
  const maxPv = trend ? Math.max(...trend.pvList, 1) : 1;

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
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-[clamp(14px,1.05vw,20px)] text-slate-300"
          >
            <Download className="w-4 h-4" />导出
          </button>
        </div>
      </div>

      {/* 访问统计面板 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5">
          <h3 className="text-[clamp(16px,1.2vw,24px)] font-medium text-slate-200 mb-3">访问统计</h3>
          <div className="grid grid-cols-2 gap-4 text-[clamp(14px,1.05vw,20px)]">
            <div className="flex justify-between py-2 border-b border-slate-800/50">
              <span className="text-slate-500">今日UV</span>
              <span className="text-sky-400">{visit?.todayUvCount ?? '--'}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-800/50">
              <span className="text-slate-500">累计UV</span>
              <span className="text-slate-200">{visit?.totalUvCount ?? '--'}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-800/50">
              <span className="text-slate-500">今日PV</span>
              <span className="text-emerald-400">{visit?.todayPvCount ?? '--'}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-800/50">
              <span className="text-slate-500">累计PV</span>
              <span className="text-slate-200">{visit?.totalPvCount ?? '--'}</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5">
          <h3 className="text-[clamp(16px,1.2vw,24px)] font-medium text-slate-200 mb-3 flex items-center gap-2">
            <Activity className="w-4 h-4 text-sky-500" />访问趋势
          </h3>
          {trend && trend.dates?.length > 0 ? (
            <div className="flex items-end gap-1 h-32">
              {trend.dates.map((d, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full bg-sky-500/40 hover:bg-sky-500/60 rounded-t transition-colors"
                    style={{ height: `${(trend.pvList[i] / maxPv) * 100}%` }}
                    title={`${d}: ${trend.pvList[i]} PV / ${trend.ipList[i]} IP`}
                  />
                  <span className="text-[10px] text-slate-600 whitespace-nowrap">{d.slice(5)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-slate-500 py-8 text-[clamp(14px,1.05vw,20px)]">暂无趋势数据</p>
          )}
        </div>
      </div>

      {/* 筛选栏 */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 mb-4 flex flex-wrap items-center gap-3">
        <input
          type="text"
          value={keywords}
          onChange={(e) => { setKeywords(e.target.value); setPageNum(1); }}
          placeholder="搜索日志内容"
          className={`${inputClass} max-w-xs`}
        />
        <input
          type="text"
          value={module}
          onChange={(e) => { setModule(e.target.value); setPageNum(1); }}
          placeholder="模块"
          className={`${inputClass} max-w-[120px]`}
        />
        <button
          onClick={loadList}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-[clamp(14px,1.05vw,20px)] text-slate-300"
        >
          <RefreshCw className="w-4 h-4" />刷新
        </button>
      </div>

      {/* 日志列表 */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden overflow-x-auto">
        <table className="w-full text-[clamp(14px,1.05vw,20px)]">
          <thead>
            <tr className="border-b border-slate-800 text-slate-500">
              <th className="text-left px-5 py-3 font-medium">模块</th>
              <th className="text-left px-5 py-3 font-medium">内容</th>
              <th className="text-left px-5 py-3 font-medium">请求路径</th>
              <th className="text-left px-5 py-3 font-medium">方法</th>
              <th className="text-left px-5 py-3 font-medium">IP</th>
              <th className="text-left px-5 py-3 font-medium">操作人</th>
              <th className="text-left px-5 py-3 font-medium">耗时</th>
              <th className="text-left px-5 py-3 font-medium">时间</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {list.map((log) => (
              <tr key={log.id} className="hover:bg-slate-800/30">
                <td className="px-5 py-3 text-slate-400">{log.module || '--'}</td>
                <td className="px-5 py-3 text-slate-200 max-w-xs truncate" title={log.content}>{log.content || '--'}</td>
                <td className="px-5 py-3 text-slate-400 max-w-xs truncate font-mono text-xs" title={log.requestUri}>{log.requestUri || '--'}</td>
                <td className="px-5 py-3 text-slate-400">{log.method || '--'}</td>
                <td className="px-5 py-3 text-slate-500 font-mono text-xs">{log.ip || '--'}</td>
                <td className="px-5 py-3 text-slate-400">{log.operator || '--'}</td>
                <td className="px-5 py-3 text-slate-400">{log.executionTime != null ? `${log.executionTime}ms` : '--'}</td>
                <td className="px-5 py-3 text-slate-400 whitespace-nowrap">{log.createTime || '--'}</td>
              </tr>
            ))}
            {list.length === 0 && (
              <tr>
                <td colSpan={8} className="px-5 py-8 text-center text-slate-500">
                  {loading ? '加载中...' : '暂无日志记录'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 分页 */}
      <div className="flex items-center justify-between mt-4 text-[clamp(14px,1.05vw,20px)] text-slate-500">
        <span>共 {total} 条</span>
        <div className="flex items-center gap-2">
          <button disabled={pageNum <= 1} onClick={() => setPageNum((p) => p - 1)} className="px-3 py-1 rounded-lg bg-slate-800 disabled:opacity-40 hover:bg-slate-700 text-slate-300">上一页</button>
          <span>{pageNum} / {totalPages}</span>
          <button disabled={pageNum >= totalPages} onClick={() => setPageNum((p) => p + 1)} className="px-3 py-1 rounded-lg bg-slate-800 disabled:opacity-40 hover:bg-slate-700 text-slate-300">下一页</button>
        </div>
      </div>
    </div>
  );
}
