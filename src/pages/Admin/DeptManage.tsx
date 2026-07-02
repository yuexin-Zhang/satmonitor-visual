import { useEffect, useState, useCallback } from 'react';
import { Building2, Plus, Trash2, Edit2, Save, X } from 'lucide-react';
import { deptApi } from '@/src/http/api';
import type { DeptVO, DeptForm, OptionLong } from '@/src/http/types';

const emptyForm: DeptForm = { name: '', code: '', parentId: 0, status: 1, sort: 0 };

export default function DeptManage() {
  const [list, setList] = useState<DeptVO[]>([]);
  const [options, setOptions] = useState<OptionLong[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<DeptForm>(emptyForm);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  const load = useCallback(async () => {
    try {
      const [depts, opts] = await Promise.all([deptApi.getList(), deptApi.getOptions().catch(() => [])]);
      setList(depts || []);
      setOptions(opts || []);
      // 默认展开全部
      const allIds = new Set<number>();
      const collect = (nodes: DeptVO[]) => nodes.forEach((n) => { allIds.add(n.id); if (n.children) collect(n.children); });
      collect(depts || []);
      setExpanded(allIds);
    } catch (err) { console.error(err); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleEdit = async (d: DeptVO) => {
    try { const f = await deptApi.getForm(d.id); setEditingId(d.id); setForm(f); } catch (err) { console.error(err); }
  };
  const handleAdd = async () => {
    if (!form.name?.trim() || form.parentId == null) return;
    try { await deptApi.create(form); setShowAdd(false); setForm(emptyForm); load(); } catch (err) { console.error(err); alert('新增失败'); }
  };
  const handleSave = async () => {
    if (editingId == null) return;
    try { await deptApi.update(editingId, form); setEditingId(null); setForm(emptyForm); load(); } catch (err) { console.error(err); alert('修改失败'); }
  };
  const handleDelete = async (id: number) => {
    if (!confirm('确定删除该部门吗？')) return;
    try { await deptApi.remove(String(id)); load(); } catch (err) { console.error(err); alert('删除失败'); }
  };

  const toggleExpand = (id: number) => {
    setExpanded((prev) => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  };

  const renderTree = (nodes: DeptVO[], depth = 0): React.ReactNode => (
    nodes.map((d) => {
      const hasChildren = d.children && d.children.length > 0;
      const isExpanded = expanded.has(d.id);
      return (
        <>
          <tr key={d.id} className="hover:bg-slate-800/30">
            <td className="px-5 py-3" style={{ paddingLeft: 20 + depth * 24 }}>
              <div className="flex items-center gap-2">
                {hasChildren ? (
                  <button onClick={() => toggleExpand(d.id)} className="text-slate-500 hover:text-slate-300">{isExpanded ? '▼' : '▶'}</button>
                ) : <span className="w-3" />}
                <Building2 className="w-3.5 h-3.5 text-sky-500" />
                <span className="text-slate-200">{d.name}</span>
              </div>
            </td>
            <td className="px-5 py-3 text-slate-400 font-mono">{d.code || '--'}</td>
            <td className="px-5 py-3 text-slate-400">{d.sort ?? 0}</td>
            <td className="px-5 py-3">
              <span className={`inline-flex px-2 py-0.5 rounded ${d.status === 1 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>{d.status === 1 ? '启用' : '禁用'}</span>
            </td>
            <td className="px-5 py-3 text-slate-400 whitespace-nowrap">{d.createTime || '--'}</td>
            <td className="px-5 py-3 text-right whitespace-nowrap">
              <button onClick={() => handleEdit(d)} className="text-sky-400 hover:text-sky-300 mr-3"><Edit2 className="w-4 h-4 inline" /></button>
              <button onClick={() => handleDelete(d.id)} className="text-rose-400 hover:text-rose-300"><Trash2 className="w-4 h-4 inline" /></button>
            </td>
          </tr>
          {hasChildren && isExpanded && renderTree(d.children!, depth + 1)}
        </>
      );
    })
  );

  const inputClass = 'w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-[clamp(14px,1.05vw,20px)] text-slate-200 focus:outline-none focus:border-sky-500/50';

  return (
    <div className="pt-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-[clamp(18px,1.3vw,26px)] font-medium text-slate-100 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-sky-500" />部门管理
        </h2>
        <button onClick={() => { setShowAdd(true); setForm(emptyForm); }} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-[clamp(14px,1.05vw,20px)] text-white"><Plus className="w-4 h-4" />新增部门</button>
      </div>

      {(showAdd || editingId != null) && (
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 mb-4">
          <h3 className="text-[clamp(14px,1.05vw,20px)] font-medium text-slate-300 mb-3">{editingId != null ? '编辑部门' : '新增部门'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div><label className="block text-[clamp(14px,1.05vw,20px)] text-slate-500 mb-1">父部门 *</label><select value={form.parentId ?? 0} onChange={(e) => setForm({ ...form, parentId: Number(e.target.value) })} className={inputClass}><option value={0}>顶级</option>{options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select></div>
            <div><label className="block text-[clamp(14px,1.05vw,20px)] text-slate-500 mb-1">名称 *</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} /></div>
            <div><label className="block text-[clamp(14px,1.05vw,20px)] text-slate-500 mb-1">编号</label><input value={form.code || ''} onChange={(e) => setForm({ ...form, code: e.target.value })} className={inputClass} /></div>
            <div><label className="block text-[clamp(14px,1.05vw,20px)] text-slate-500 mb-1">排序</label><input type="number" value={form.sort ?? 0} onChange={(e) => setForm({ ...form, sort: Number(e.target.value) })} className={inputClass} /></div>
            <div><label className="block text-[clamp(14px,1.05vw,20px)] text-slate-500 mb-1">状态</label><select value={form.status ?? 1} onChange={(e) => setForm({ ...form, status: Number(e.target.value) })} className={inputClass}><option value={1}>启用</option><option value={0}>禁用</option></select></div>
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
            <th className="text-left px-5 py-3 font-medium">名称</th><th className="text-left px-5 py-3 font-medium">编号</th><th className="text-left px-5 py-3 font-medium">排序</th><th className="text-left px-5 py-3 font-medium">状态</th><th className="text-left px-5 py-3 font-medium">创建时间</th><th className="text-right px-5 py-3 font-medium">操作</th>
          </tr></thead>
          <tbody className="divide-y divide-slate-800">
            {renderTree(list)}
            {list.length === 0 && <tr><td colSpan={6} className="px-5 py-8 text-center text-slate-500">暂无部门数据</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
