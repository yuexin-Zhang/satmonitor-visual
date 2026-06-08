import { useState, useEffect } from 'react';
import { Sun, Plus, Trash2, Calendar, Clock, AlertTriangle } from 'lucide-react';
import { httpGet } from '@/src/http/client';
import type { SunInterferenceRecord } from '@/src/http/types';

const IMPACT_MAP = {
  low: { label: '低', color: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' },
  medium: { label: '中', color: 'bg-amber-500/10 text-amber-400 border border-amber-500/20' },
  high: { label: '高', color: 'bg-rose-500/10 text-rose-400 border border-rose-500/20' },
};

const STATUS_MAP = {
  upcoming: { label: '即将发生', color: 'bg-sky-500/10 text-sky-400 border border-sky-500/20' },
  active: { label: '进行中', color: 'bg-amber-500/10 text-amber-400 border border-amber-500/20' },
  passed: { label: '已结束', color: 'bg-slate-500/10 text-slate-400 border border-slate-500/20' },
};

export default function SunInterferenceManage() {
  const [list, setList] = useState<SunInterferenceRecord[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newRecord, setNewRecord] = useState<Partial<SunInterferenceRecord>>({
    year: new Date().getFullYear(),
    startDate: '',
    endDate: '',
    peakTime: '',
    duration: 120,
    impactLevel: 'medium',
    alertEnabled: true,
    status: 'upcoming',
    notes: '',
  });

  useEffect(() => {
    httpGet<SunInterferenceRecord[]>('/admin/sun-interferences').then(setList).catch(() => {});
  }, []);

  const handleAdd = () => {
    if (!newRecord.startDate || !newRecord.endDate) return;
    const record: SunInterferenceRecord = {
      id: Date.now().toString(),
      year: newRecord.year || new Date().getFullYear(),
      startDate: newRecord.startDate,
      endDate: newRecord.endDate,
      peakTime: newRecord.peakTime || '',
      duration: newRecord.duration || 120,
      impactLevel: newRecord.impactLevel || 'medium',
      alertEnabled: newRecord.alertEnabled ?? true,
      status: newRecord.status || 'upcoming',
      notes: newRecord.notes || '',
    };
    setList((prev) => [...prev, record]);
    setShowAdd(false);
    setNewRecord({
      year: new Date().getFullYear(),
      startDate: '',
      endDate: '',
      peakTime: '',
      duration: 120,
      impactLevel: 'medium',
      alertEnabled: true,
      status: 'upcoming',
      notes: '',
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm('确定删除该日凌记录吗？')) return;
    setList((prev) => prev.filter((r) => r.id !== id));
  };

  const inputClass =
    'w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-[clamp(14px,1.05vw,20px)] text-slate-200 focus:outline-none focus:border-sky-500/50';

  return (
    <div className="pt-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-[clamp(18px,1.3vw,26px)] font-medium text-slate-100 flex items-center gap-2">
          <Sun className="w-5 h-5 text-sky-500" />
          日凌管理
        </h2>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-[clamp(14px,1.05vw,20px)] text-white transition-colors"
        >
          <Plus className="w-4 h-4" />
          新增记录
        </button>
      </div>

      {/* 新增表单 */}
      {showAdd && (
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 mb-4">
          <h3 className="text-slate-300 font-medium mb-3">新增日凌记录</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-[clamp(14px,1.05vw,20px)] text-slate-500 mb-1">年份</label>
              <input type="number" value={newRecord.year} onChange={(e) => setNewRecord({ ...newRecord, year: Number(e.target.value) })} className={inputClass} />
            </div>
            <div>
              <label className="block text-[clamp(14px,1.05vw,20px)] text-slate-500 mb-1">开始日期</label>
              <input type="date" value={newRecord.startDate} onChange={(e) => setNewRecord({ ...newRecord, startDate: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className="block text-[clamp(14px,1.05vw,20px)] text-slate-500 mb-1">结束日期</label>
              <input type="date" value={newRecord.endDate} onChange={(e) => setNewRecord({ ...newRecord, endDate: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className="block text-[clamp(14px,1.05vw,20px)] text-slate-500 mb-1">峰值时间</label>
              <input type="datetime-local" value={newRecord.peakTime} onChange={(e) => setNewRecord({ ...newRecord, peakTime: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className="block text-[clamp(14px,1.05vw,20px)] text-slate-500 mb-1">持续时间(分钟)</label>
              <input type="number" value={newRecord.duration} onChange={(e) => setNewRecord({ ...newRecord, duration: Number(e.target.value) })} className={inputClass} />
            </div>
            <div>
              <label className="block text-[clamp(14px,1.05vw,20px)] text-slate-500 mb-1">影响级别</label>
              <select value={newRecord.impactLevel} onChange={(e) => setNewRecord({ ...newRecord, impactLevel: e.target.value as 'low' | 'medium' | 'high' })} className={inputClass}>
                <option value="low">低</option>
                <option value="medium">中</option>
                <option value="high">高</option>
              </select>
            </div>
            <div>
              <label className="block text-[clamp(14px,1.05vw,20px)] text-slate-500 mb-1">状态</label>
              <select value={newRecord.status} onChange={(e) => setNewRecord({ ...newRecord, status: e.target.value as 'upcoming' | 'active' | 'passed' })} className={inputClass}>
                <option value="upcoming">即将发生</option>
                <option value="active">进行中</option>
                <option value="passed">已结束</option>
              </select>
            </div>
            <div className="flex items-end gap-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={newRecord.alertEnabled} onChange={(e) => setNewRecord({ ...newRecord, alertEnabled: e.target.checked })} className="w-4 h-4 accent-sky-500 rounded" />
                <span className="text-[clamp(14px,1.05vw,20px)] text-slate-300">启用预警</span>
              </label>
            </div>
          </div>
          <div className="mt-3">
            <label className="block text-[clamp(14px,1.05vw,20px)] text-slate-500 mb-1">备注</label>
            <input value={newRecord.notes} onChange={(e) => setNewRecord({ ...newRecord, notes: e.target.value })} className={inputClass} placeholder="备注信息" />
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={handleAdd} className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[clamp(14px,1.05vw,20px)]">确认</button>
            <button onClick={() => setShowAdd(false)} className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[clamp(14px,1.05vw,20px)]">取消</button>
          </div>
        </div>
      )}

      {/* 列表 */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
        <table className="w-full text-[clamp(14px,1.05vw,20px)]">
          <thead>
            <tr className="border-b border-slate-800 text-slate-500">
              <th className="text-left px-5 py-3">年份</th>
              <th className="text-left px-5 py-3">起止时间</th>
              <th className="text-left px-5 py-3">峰值时间</th>
              <th className="text-left px-5 py-3">持续时间</th>
              <th className="text-left px-5 py-3">影响级别</th>
              <th className="text-left px-5 py-3">预警</th>
              <th className="text-left px-5 py-3">状态</th>
              <th className="text-right px-5 py-3">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {list.map((item) => (
              <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                <td className="px-5 py-3 text-slate-200 font-medium">{item.year}</td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    {item.startDate} ~ {item.endDate}
                  </div>
                </td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    {item.peakTime || '--'}
                  </div>
                </td>
                <td className="px-5 py-3 text-slate-300">{item.duration}分钟</td>
                <td className="px-5 py-3">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded ${IMPACT_MAP[item.impactLevel].color}`}>
                    <AlertTriangle className="w-3 h-3" />
                    {IMPACT_MAP[item.impactLevel].label}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <span className={`inline-flex px-2 py-0.5 rounded ${item.alertEnabled ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'}`}>
                    {item.alertEnabled ? '已开启' : '未开启'}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <span className={`inline-flex px-2 py-0.5 rounded ${STATUS_MAP[item.status].color}`}>
                    {STATUS_MAP[item.status].label}
                  </span>
                </td>
                <td className="px-5 py-3 text-right">
                  <button onClick={() => handleDelete(item.id)} className="text-rose-400 hover:text-rose-300"><Trash2 className="w-4 h-4" /></button>
                </td>
              </tr>
            ))}
            {list.length === 0 && (
              <tr><td colSpan={8} className="px-5 py-8 text-center text-slate-500">暂无数凌记录</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
