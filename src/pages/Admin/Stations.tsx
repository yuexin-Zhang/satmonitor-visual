import { useEffect, useState, useCallback } from 'react';
import { Satellite, Plus, Trash2, Edit2, Save, X, RefreshCw } from 'lucide-react';
import { stationApi } from '@/src/http/api';
import type { SatStationPageVO, SatStationForm } from '@/src/http/types';

const emptyForm: SatStationForm = {
  name: '', code: '', tag: undefined, address: '', region: '', manager: '',
  managerPhone: '', deviceIp: '', longitude: undefined, latitude: undefined, status: 1, remark: '',
};

export default function Stations() {
  const [list, setList] = useState<SatStationPageVO[]>([]);
  const [total, setTotal] = useState(0);
  const [pageNum, setPageNum] = useState(1);
  const [pageSize] = useState(10);
  const [keywords, setKeywords] = useState('');
  const [loading, setLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<SatStationForm>(emptyForm);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await stationApi.getPage({ pageNum, pageSize, keywords: keywords || undefined });
      setList(res.list || []);
      setTotal(res.total || 0);
    } catch (err) {
      console.error('加载台站失败', err);
    } finally {
      setLoading(false);
    }
  }, [pageNum, pageSize, keywords]);

  useEffect(() => { load(); }, [load]);

  const handleEdit = async (s: SatStationPageVO) => {
    try {
      const f = await stationApi.getForm(s.id);
      setEditingId(s.id);
      setForm(f);
    } catch (err) { console.error(err); }
  };

  const handleAdd = async () => {
    if (!form.name?.trim()) return;
    try {
      await stationApi.create(form);
      setShowAdd(false);
      setForm(emptyForm);
      load();
    } catch (err) { console.error(err); alert('新增失败'); }
  };

  const handleSaveEdit = async () => {
    if (editingId == null) return;
    try {
      await stationApi.update(editingId, form);
      setEditingId(null);
      setForm(emptyForm);
      load();
    } catch (err) { console.error(err); alert('修改失败'); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定删除该台站吗？')) return;
    try { await stationApi.remove(id); load(); } catch (err) { console.error(err); alert('删除失败'); }
  };

  const inputClass = 'w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-[clamp(14px,1.05vw,20px)] text-slate-200 focus:outline-none focus:border-sky-500/50';
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="pt-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-[clamp(18px,1.3vw,26px)] font-medium text-slate-100 flex items-center gap-2">
          <Satellite className="w-5 h-5 text-sky-500" />台站管理
        </h2>
        <button onClick={() => { setShowAdd(true); setForm(emptyForm); }} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-[clamp(14px,1.05vw,20px)] text-white">
          <Plus className="w-4 h-4" />新增台站
        </button>
      </div>

      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 mb-4 flex items-center gap-3">
        <input value={keywords} onChange={(e) => { setKeywords(e.target.value); setPageNum(1); }} placeholder="搜索名称/编号" className={`${inputClass} max-w-xs`} />
        <button onClick={load} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-[clamp(14px,1.05vw,20px)] text-slate-300"><RefreshCw className="w-4 h-4" />刷新</button>
      </div>

      {(showAdd || editingId != null) && (
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 mb-4">
          <h3 className="text-[clamp(14px,1.05vw,20px)] font-medium text-slate-300 mb-3">
            {editingId != null ? `编辑台站 (ID: ${editingId})` : '新增台站'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div><label className="block text-[clamp(14px,1.05vw,20px)] text-slate-500 mb-1">名称 *</label><input value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} /></div>
            <div><label className="block text-[clamp(14px,1.05vw,20px)] text-slate-500 mb-1">编号</label><input value={form.code || ''} onChange={(e) => setForm({ ...form, code: e.target.value })} className={inputClass} /></div>
            <div><label className="block text-[clamp(14px,1.05vw,20px)] text-slate-500 mb-1">系统标识tag</label><input type="number" value={form.tag ?? ''} onChange={(e) => setForm({ ...form, tag: e.target.value ? Number(e.target.value) : undefined })} className={inputClass} /></div>
            <div><label className="block text-[clamp(14px,1.05vw,20px)] text-slate-500 mb-1">区域</label><input value={form.region || ''} onChange={(e) => setForm({ ...form, region: e.target.value })} className={inputClass} /></div>
            <div><label className="block text-[clamp(14px,1.05vw,20px)] text-slate-500 mb-1">负责人</label><input value={form.manager || ''} onChange={(e) => setForm({ ...form, manager: e.target.value })} className={inputClass} /></div>
            <div><label className="block text-[clamp(14px,1.05vw,20px)] text-slate-500 mb-1">联系电话</label><input value={form.managerPhone || ''} onChange={(e) => setForm({ ...form, managerPhone: e.target.value })} className={inputClass} /></div>
            <div><label className="block text-[clamp(14px,1.05vw,20px)] text-slate-500 mb-1">边缘终端IP</label><input value={form.deviceIp || ''} onChange={(e) => setForm({ ...form, deviceIp: e.target.value })} className={inputClass} /></div>
            <div><label className="block text-[clamp(14px,1.05vw,20px)] text-slate-500 mb-1">经度</label><input type="number" value={form.longitude ?? ''} onChange={(e) => setForm({ ...form, longitude: e.target.value ? Number(e.target.value) : undefined })} className={inputClass} /></div>
            <div><label className="block text-[clamp(14px,1.05vw,20px)] text-slate-500 mb-1">纬度</label><input type="number" value={form.latitude ?? ''} onChange={(e) => setForm({ ...form, latitude: e.target.value ? Number(e.target.value) : undefined })} className={inputClass} /></div>
            <div><label className="block text-[clamp(14px,1.05vw,20px)] text-slate-500 mb-1">地址</label><input value={form.address || ''} onChange={(e) => setForm({ ...form, address: e.target.value })} className={inputClass} /></div>
            <div><label className="block text-[clamp(14px,1.05vw,20px)] text-slate-500 mb-1">状态</label><select value={form.status ?? 1} onChange={(e) => setForm({ ...form, status: Number(e.target.value) })} className={inputClass}><option value={1}>启用</option><option value={0}>禁用</option></select></div>
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
              <th className="text-left px-5 py-3 font-medium">编号</th>
              <th className="text-left px-5 py-3 font-medium">区域</th>
              <th className="text-left px-5 py-3 font-medium">在线状态</th>
              <th className="text-left px-5 py-3 font-medium">告警数</th>
              <th className="text-left px-5 py-3 font-medium">设备数</th>
              <th className="text-left px-5 py-3 font-medium">负责人</th>
              <th className="text-left px-5 py-3 font-medium">状态</th>
              <th className="text-right px-5 py-3 font-medium">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {list.map((s) => (
              <tr key={s.id} className="hover:bg-slate-800/30">
                <td className="px-5 py-3 text-slate-400">{s.id}</td>
                <td className="px-5 py-3 text-slate-200">{s.name}</td>
                <td className="px-5 py-3 text-slate-400">{s.code || '--'}</td>
                <td className="px-5 py-3 text-slate-300">{s.region || '--'}</td>
                <td className="px-5 py-3">
                  <span className={`inline-flex px-2 py-0.5 rounded ${s.onlineStatus ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'}`}>{s.onlineStatus ? '在线' : '离线'}</span>
                </td>
                <td className="px-5 py-3 text-rose-400">{s.alarmCount ?? 0}</td>
                <td className="px-5 py-3 text-slate-300">{s.deviceCount ?? 0}</td>
                <td className="px-5 py-3 text-slate-400">{s.manager || '--'}</td>
                <td className="px-5 py-3">
                  <span className={`inline-flex px-2 py-0.5 rounded ${s.status === 1 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>{s.status === 1 ? '启用' : '禁用'}</span>
                </td>
                <td className="px-5 py-3 text-right whitespace-nowrap">
                  <button onClick={() => handleEdit(s)} className="text-sky-400 hover:text-sky-300 mr-3"><Edit2 className="w-4 h-4 inline" /></button>
                  <button onClick={() => handleDelete(s.id)} className="text-rose-400 hover:text-rose-300"><Trash2 className="w-4 h-4 inline" /></button>
                </td>
              </tr>
            ))}
            {list.length === 0 && (
              <tr><td colSpan={10} className="px-5 py-8 text-center text-slate-500">{loading ? '加载中...' : '暂无台站数据'}</td></tr>
            )}
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
