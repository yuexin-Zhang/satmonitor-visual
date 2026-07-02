import { useEffect, useState, useCallback } from 'react';
import { Radio, Plus, Trash2, Edit2, Save, X, RefreshCw } from 'lucide-react';
import { configApi } from '@/src/http/api';
import type { ConfigVO, ConfigForm } from '@/src/http/types';

const emptyForm: ConfigForm = { configName: '', configKey: '', configValue: '', remark: '' };

export default function SystemConfig() {
  const [list, setList] = useState<ConfigVO[]>([]);
  const [total, setTotal] = useState(0);
  const [pageNum, setPageNum] = useState(1);
  const [keywords, setKeywords] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<ConfigForm>(emptyForm);

  const load = useCallback(async () => {
    try {
      const res = await configApi.getPage({ pageNum, pageSize: 15, keywords: keywords || undefined });
      setList(res.list || []);
      setTotal(res.total || 0);
    } catch (err) { console.error(err); }
  }, [pageNum, keywords]);

  useEffect(() => { load(); }, [load]);

  const handleEdit = async (c: ConfigVO) => { try { const f = await configApi.getForm(c.id); setEditingId(c.id); setForm(f); } catch (err) { console.error(err); } };
  const handleAdd = async () => {
    if (!form.configName?.trim() || !form.configKey?.trim()) return;
    try { await configApi.create(form); setShowAdd(false); setForm(emptyForm); load(); } catch (err) { console.error(err); alert('新增失败'); }
  };
  const handleSave = async () => {
    if (editingId == null) return;
    try { await configApi.update(editingId, form); setEditingId(null); setForm(emptyForm); load(); } catch (err) { console.error(err); alert('修改失败'); }
  };
  const handleDelete = async (id: number) => {
    if (!confirm('确定删除该配置吗？')) return;
    try { await configApi.remove(id); load(); } catch (err) { console.error(err); alert('删除失败'); }
  };
  const handleRefresh = async () => {
    try { await configApi.refresh(); alert('缓存已刷新'); } catch (err) { console.error(err); alert('刷新失败'); }
  };

  const inputClass = 'w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-[clamp(14px,1.05vw,20px)] text-slate-200 focus:outline-none focus:border-sky-500/50';
  const totalPages = Math.max(1, Math.ceil(total / 15));

  return (
    <div className="pt-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-[clamp(18px,1.3vw,26px)] font-medium text-slate-100 flex items-center gap-2">
          <Radio className="w-5 h-5 text-sky-500" />系统配置
        </h2>
        <div className="flex gap-2">
          <button onClick={handleRefresh} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-[clamp(14px,1.05vw,20px)] text-slate-300"><RefreshCw className="w-4 h-4" />刷新缓存</button>
          <button onClick={() => { setShowAdd(true); setForm(emptyForm); }} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-[clamp(14px,1.05vw,20px)] text-white"><Plus className="w-4 h-4" />新增配置</button>
        </div>
      </div>

      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 mb-4">
        <input value={keywords} onChange={(e) => { setKeywords(e.target.value); setPageNum(1); }} placeholder="搜索配置名称/键" className={`${inputClass} max-w-xs`} />
      </div>

      {(showAdd || editingId != null) && (
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 mb-4">
          <h3 className="text-[clamp(14px,1.05vw,20px)] font-medium text-slate-300 mb-3">{editingId != null ? '编辑配置' : '新增配置'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="block text-[clamp(14px,1.05vw,20px)] text-slate-500 mb-1">配置名称 *</label><input value={form.configName} onChange={(e) => setForm({ ...form, configName: e.target.value })} className={inputClass} /></div>
            <div><label className="block text-[clamp(14px,1.05vw,20px)] text-slate-500 mb-1">配置键 *</label><input value={form.configKey} onChange={(e) => setForm({ ...form, configKey: e.target.value })} className={inputClass} disabled={editingId != null} /></div>
            <div><label className="block text-[clamp(14px,1.05vw,20px)] text-slate-500 mb-1">配置值 *</label><input value={form.configValue} onChange={(e) => setForm({ ...form, configValue: e.target.value })} className={inputClass} /></div>
            <div><label className="block text-[clamp(14px,1.05vw,20px)] text-slate-500 mb-1">备注</label><input value={form.remark || ''} onChange={(e) => setForm({ ...form, remark: e.target.value })} className={inputClass} /></div>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={editingId != null ? handleSave : handleAdd} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[clamp(14px,1.05vw,20px)]"><Save className="w-4 h-4" />保存</button>
            <button onClick={() => { setShowAdd(false); setEditingId(null); setForm(emptyForm); }} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[clamp(14px,1.05vw,20px)]"><X className="w-4 h-4" />取消</button>
          </div>
        </div>
      )}

      <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden overflow-x-auto">
        <table className="w-full text-[clamp(14px,1.05vw,20px)]">
          <thead><tr className="border-b border-slate-800 text-slate-500">
            <th className="text-left px-5 py-3 font-medium">ID</th><th className="text-left px-5 py-3 font-medium">名称</th><th className="text-left px-5 py-3 font-medium">键</th><th className="text-left px-5 py-3 font-medium">值</th><th className="text-left px-5 py-3 font-medium">备注</th><th className="text-right px-5 py-3 font-medium">操作</th>
          </tr></thead>
          <tbody className="divide-y divide-slate-800">
            {list.map((c) => (
              <tr key={c.id} className="hover:bg-slate-800/30">
                <td className="px-5 py-3 text-slate-400">{c.id}</td>
                <td className="px-5 py-3 text-slate-200">{c.configName}</td>
                <td className="px-5 py-3 text-slate-500 font-mono text-xs">{c.configKey}</td>
                <td className="px-5 py-3 text-slate-300 font-mono text-xs max-w-xs truncate" title={c.configValue}>{c.configValue}</td>
                <td className="px-5 py-3 text-slate-400">{c.remark || '--'}</td>
                <td className="px-5 py-3 text-right whitespace-nowrap">
                  <button onClick={() => handleEdit(c)} className="text-sky-400 hover:text-sky-300 mr-3"><Edit2 className="w-4 h-4 inline" /></button>
                  <button onClick={() => handleDelete(c.id)} className="text-rose-400 hover:text-rose-300"><Trash2 className="w-4 h-4 inline" /></button>
                </td>
              </tr>
            ))}
            {list.length === 0 && <tr><td colSpan={6} className="px-5 py-8 text-center text-slate-500">暂无配置</td></tr>}
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
