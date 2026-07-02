import { useEffect, useState, useCallback } from 'react';
import { Snowflake, RefreshCw } from 'lucide-react';
import { snowExecLogApi, stationApi } from '@/src/http/api';
import type { SatSnowExecLogVO, OptionLong } from '@/src/http/types';

const EXEC_TYPE_MAP: Record<number, string> = { 1: '自动', 2: '手动', 3: '自测' };
const STATUS_MAP: Record<number, { label: string; color: string }> = {
  0: { label: '执行中', color: 'bg-sky-500/10 text-sky-400 border border-sky-500/20' },
  1: { label: '成功', color: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' },
  2: { label: '失败', color: 'bg-rose-500/10 text-rose-400 border border-rose-500/20' },
};

export default function SnowExecLogs() {
  const [list, setList] = useState<SatSnowExecLogVO[]>([]);
  const [total, setTotal] = useState(0);
  const [pageNum, setPageNum] = useState(1);
  const [stationOptions, setStationOptions] = useState<OptionLong[]>([]);
  const [stationFilter, setStationFilter] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await snowExecLogApi.getPage({ pageNum, pageSize: 15, stationId: stationFilter });
      setList(res.list || []);
      setTotal(res.total || 0);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [pageNum, stationFilter]);

  useEffect(() => { stationApi.getOptions().then(setStationOptions).catch(() => {}); }, []);
  useEffect(() => { load(); }, [load]);

  const inputClass = 'bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-[clamp(14px,1.05vw,20px)] text-slate-200 focus:outline-none focus:border-sky-500/50';
  const totalPages = Math.max(1, Math.ceil(total / 15));

  return (
    <div className="pt-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-[clamp(18px,1.3vw,26px)] font-medium text-slate-100 flex items-center gap-2">
          <Snowflake className="w-5 h-5 text-sky-500" />融雪执行日志
        </h2>
      </div>

      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 mb-4 flex items-center gap-3">
        <select value={stationFilter ?? ''} onChange={(e) => { setStationFilter(e.target.value ? Number(e.target.value) : undefined); setPageNum(1); }} className={`${inputClass} max-w-[180px]`}>
          <option value="">全部台站</option>
          {stationOptions.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <button onClick={load} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-[clamp(14px,1.05vw,20px)] text-slate-300"><RefreshCw className="w-4 h-4" />刷新</button>
      </div>

      <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden overflow-x-auto">
        <table className="w-full text-[clamp(14px,1.05vw,20px)]">
          <thead><tr className="border-b border-slate-800 text-slate-500">
            <th className="text-left px-5 py-3 font-medium">ID</th><th className="text-left px-5 py-3 font-medium">台站</th><th className="text-left px-5 py-3 font-medium">类型</th><th className="text-left px-5 py-3 font-medium">触发原因</th><th className="text-left px-5 py-3 font-medium">开始</th><th className="text-left px-5 py-3 font-medium">结束</th><th className="text-left px-5 py-3 font-medium">状态</th><th className="text-left px-5 py-3 font-medium">创建时间</th>
          </tr></thead>
          <tbody className="divide-y divide-slate-800">
            {list.map((log) => (
              <tr key={log.id} className="hover:bg-slate-800/30">
                <td className="px-5 py-3 text-slate-400">{log.id}</td>
                <td className="px-5 py-3 text-slate-200">{log.stationName || log.stationId || '--'}</td>
                <td className="px-5 py-3"><span className="text-slate-300">{EXEC_TYPE_MAP[log.execType ?? 0] || '--'}</span></td>
                <td className="px-5 py-3 text-slate-400 max-w-xs truncate" title={log.triggerReason || ''}>{log.triggerReason || '--'}</td>
                <td className="px-5 py-3 text-slate-400 whitespace-nowrap">{log.startTime || '--'}</td>
                <td className="px-5 py-3 text-slate-400 whitespace-nowrap">{log.endTime || '--'}</td>
                <td className="px-5 py-3"><span className={`inline-flex px-2 py-0.5 rounded ${STATUS_MAP[log.status ?? 0]?.color || ''}`}>{STATUS_MAP[log.status ?? 0]?.label || '--'}</span></td>
                <td className="px-5 py-3 text-slate-400 whitespace-nowrap">{log.createTime || '--'}</td>
              </tr>
            ))}
            {list.length === 0 && <tr><td colSpan={8} className="px-5 py-8 text-center text-slate-500">{loading ? '加载中...' : '暂无执行日志'}</td></tr>}
          </tbody>
        </table>
      </div>

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
