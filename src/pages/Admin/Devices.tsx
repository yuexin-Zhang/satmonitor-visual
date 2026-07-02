import { useEffect, useState, useCallback } from 'react';
import { Cpu, Plus, Trash2, Edit2, Save, X, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { deviceApi, stationApi } from '@/src/http/api';
import type { SatDevicePageVO, SatDeviceForm, OptionLong } from '@/src/http/types';

const emptyForm: SatDeviceForm = { name: '', stationId: undefined, deviceType: '', deviceCode: '', location: '', serialNo: '', installTime: '', remark: '' };

export default function Devices() {
  const [list, setList] = useState<SatDevicePageVO[]>([]);
  const [total, setTotal] = useState(0);
  const [pageNum, setPageNum] = useState(1);
  const [pageSize] = useState(10);
  const [keywords, setKeywords] = useState('');
  const [stationFilter, setStationFilter] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [stationOptions, setStationOptions] = useState<OptionLong[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<SatDeviceForm>(emptyForm);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await deviceApi.getPage({ pageNum, pageSize, keywords: keywords || undefined, stationId: stationFilter });
      setList(res.list || []);
      setTotal(res.total || 0);
    } catch (err) {
      console.error('加载设备失败', err);
    } finally {
      setLoading(false);
    }
  }, [pageNum, pageSize, keywords, stationFilter]);

  useEffect(() => { stationApi.getOptions().then(setStationOptions).catch(() => {}); }, []);
  useEffect(() => { load(); }, [load]);

  const handleEdit = async (d: SatDevicePageVO) => {
    try { const f = await deviceApi.getForm(d.id); setEditingId(d.id); setForm(f); } catch (err) { console.error(err); }
  };
  const handleAdd = async () => {
    if (!form.name?.trim()) return;
    try { await deviceApi.create(form); setShowAdd(false); setForm(emptyForm); load(); } catch (err) { console.error(err); alert('新增失败'); }
  };
  const handleSaveEdit = async () => {
    if (editingId == null) return;
    try { await deviceApi.update(editingId, form); setEditingId(null); setForm(emptyForm); load(); } catch (err) { console.error(err); alert('修改失败'); }
  };
  const handleDelete = async (id: number) => {
    if (!confirm('确定删除该设备吗？')) return;
    try { await deviceApi.remove(id); load(); } catch (err) { console.error(err); alert('删除失败'); }
  };
  const handleMark = async (d: SatDevicePageVO, target: 'normal' | 'fault') => {
    try { target === 'normal' ? await deviceApi.markNormal(d.id) : await deviceApi.markFault(d.id); load(); } catch (err) { console.error(err); }
  };

  const inputClass = 'w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-[clamp(14px,1.05vw,20px)] text-slate-200 focus:outline-none focus:border-sky-500/50';
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="pt-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-[clamp(18px,1.3vw,26px)] font-medium text-slate-100 flex items-center gap-2">
          <Cpu className="w-5 h-5 text-sky-500" />设备管理
        </h2>
        <button onClick={() => { setShowAdd(true); setForm(emptyForm); }} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-[clamp(14px,1.05vw,20px)] text-white">
          <Plus className="w-4 h-4" />新增设备
        </button>
      </div>

      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 mb-4 flex flex-wrap items-center gap-3">
        <input value={keywords} onChange={(e) => { setKeywords(e.target.value); setPageNum(1); }} placeholder="搜索设备名称/编号" className={`${inputClass} max-w-xs`} />
        <select value={stationFilter ?? ''} onChange={(e) => { setStationFilter(e.target.value ? Number(e.target.value) : undefined); setPageNum(1); }} className={`${inputClass} max-w-[180px]`}>
          <option value="">全部台站</option>
          {stationOptions.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <button onClick={load} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-[clamp(14px,1.05vw,20px)] text-slate-300"><RefreshCw className="w-4 h-4" />刷新</button>
      </div>

      {(showAdd || editingId != null) && (
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 mb-4">
          <h3 className="text-[clamp(14px,1.05vw,20px)] font-medium text-slate-300 mb-3">{editingId != null ? `编辑设备 (ID: ${editingId})` : '新增设备'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div><label className="block text-[clamp(14px,1.05vw,20px)] text-slate-500 mb-1">名称 *</label><input value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} /></div>
            <div><label className="block text-[clamp(14px,1.05vw,20px)] text-slate-500 mb-1">台站</label><select value={form.stationId ?? ''} onChange={(e) => setForm({ ...form, stationId: e.target.value ? Number(e.target.value) : undefined })} className={inputClass}><option value="">请选择</option>{stationOptions.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}</select></div>
            <div><label className="block text-[clamp(14px,1.05vw,20px)] text-slate-500 mb-1">设备类型</label><input value={form.deviceType || ''} onChange={(e) => setForm({ ...form, deviceType: e.target.value })} className={inputClass} placeholder="camera/sensor/relay" /></div>
            <div><label className="block text-[clamp(14px,1.05vw,20px)] text-slate-500 mb-1">设备编号</label><input value={form.deviceCode || ''} onChange={(e) => setForm({ ...form, deviceCode: e.target.value })} className={inputClass} /></div>
            <div><label className="block text-[clamp(14px,1.05vw,20px)] text-slate-500 mb-1">序列号</label><input value={form.serialNo || ''} onChange={(e) => setForm({ ...form, serialNo: e.target.value })} className={inputClass} /></div>
            <div><label className="block text-[clamp(14px,1.05vw,20px)] text-slate-500 mb-1">安装位置</label><input value={form.location || ''} onChange={(e) => setForm({ ...form, location: e.target.value })} className={inputClass} /></div>
            <div><label className="block text-[clamp(14px,1.05vw,20px)] text-slate-500 mb-1">投用时间</label><input type="date" value={form.installTime?.slice(0, 10) || ''} onChange={(e) => setForm({ ...form, installTime: e.target.value })} className={inputClass} /></div>
            <div><label className="block text-[clamp(14px,1.05vw,20px)] text-slate-500 mb-1">备注</label><input value={form.remark || ''} onChange={(e) => setForm({ ...form, remark: e.target.value })} className={inputClass} /></div>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={editingId != null ? handleSaveEdit : handleAdd} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[clamp(14px,1.05vw,20px)]"><Save className="w-4 h-4" />保存</button>
            <button onClick={() => { setShowAdd(false); setEditingId(null); setForm(emptyForm); }} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[clamp(14px,1.05vw,20px)]"><X className="w-4 h-4" />取消</button>
          </div>
        </div>
      )}

      <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden overflow-x-auto">
        <table className="w-full text-[clamp(14px,1.05vw,20px)]">
          <thead>
            <tr className="border-b border-slate-800 text-slate-500">
              <th className="text-left px-5 py-3 font-medium">ID</th>
              <th className="text-left px-5 py-3 font-medium">名称</th>
              <th className="text-left px-5 py-3 font-medium">台站</th>
              <th className="text-left px-5 py-3 font-medium">类型</th>
              <th className="text-left px-5 py-3 font-medium">序列号</th>
              <th className="text-left px-5 py-3 font-medium">在线</th>
              <th className="text-left px-5 py-3 font-medium">运行状态</th>
              <th className="text-left px-5 py-3 font-medium">最近上报</th>
              <th className="text-right px-5 py-3 font-medium">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {list.map((d) => (
              <tr key={d.id} className="hover:bg-slate-800/30">
                <td className="px-5 py-3 text-slate-400">{d.id}</td>
                <td className="px-5 py-3 text-slate-200">{d.name}</td>
                <td className="px-5 py-3 text-slate-300">{d.stationName || '--'}</td>
                <td className="px-5 py-3 text-slate-400">{d.deviceType || '--'}</td>
                <td className="px-5 py-3 text-slate-400">{d.serialNo || '--'}</td>
                <td className="px-5 py-3">
                  <span className={`inline-flex px-2 py-0.5 rounded ${d.onlineStatus ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'}`}>{d.onlineStatus ? '在线' : '离线'}</span>
                </td>
                <td className="px-5 py-3">
                  <span className={`inline-flex px-2 py-0.5 rounded ${d.runStatus === 1 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>{d.runStatus === 1 ? '正常' : '故障'}</span>
                </td>
                <td className="px-5 py-3 text-slate-400 whitespace-nowrap">{d.lastReportTime || '--'}</td>
                <td className="px-5 py-3 text-right whitespace-nowrap">
                  {d.runStatus !== 1 && <button onClick={() => handleMark(d, 'normal')} title="标记正常" className="text-emerald-400 hover:text-emerald-300 mr-2"><CheckCircle className="w-4 h-4 inline" /></button>}
                  {d.runStatus === 1 && <button onClick={() => handleMark(d, 'fault')} title="标记故障" className="text-amber-400 hover:text-amber-300 mr-2"><AlertCircle className="w-4 h-4 inline" /></button>}
                  <button onClick={() => handleEdit(d)} className="text-sky-400 hover:text-sky-300 mr-2"><Edit2 className="w-4 h-4 inline" /></button>
                  <button onClick={() => handleDelete(d.id)} className="text-rose-400 hover:text-rose-300"><Trash2 className="w-4 h-4 inline" /></button>
                </td>
              </tr>
            ))}
            {list.length === 0 && <tr><td colSpan={9} className="px-5 py-8 text-center text-slate-500">{loading ? '加载中...' : '暂无设备数据'}</td></tr>}
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
