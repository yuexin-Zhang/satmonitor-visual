import { useEffect, useState, useCallback } from 'react';
import { Menu as MenuIcon, Plus, Trash2, Edit2, Save, X, Eye, EyeOff } from 'lucide-react';
import { menuApi } from '@/src/http/api';
import type { MenuVO, MenuForm, OptionLong } from '@/src/http/types';

const TYPE_MAP: Record<number, string> = { 1: '菜单', 2: '目录', 3: '外链', 4: '按钮' };

const emptyForm: MenuForm = { parentId: 0, name: '', type: 1, routePath: '', component: '', perm: '', visible: 1, sort: 0, icon: '' };

export default function Menus() {
  const [list, setList] = useState<MenuVO[]>([]);
  const [menuOptions, setMenuOptions] = useState<OptionLong[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<MenuForm>(emptyForm);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  const load = useCallback(async () => {
    try {
      const [menus, opts] = await Promise.all([menuApi.getList(), menuApi.getOptions().catch(() => [])]);
      setList(menus || []);
      setMenuOptions(opts || []);
    } catch (err) { console.error(err); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleEdit = async (m: MenuVO) => {
    try { const f = await menuApi.getForm(m.id); setEditingId(m.id); setForm(f); } catch (err) { console.error(err); }
  };
  const handleAdd = async () => {
    if (!form.name?.trim()) return;
    try { await menuApi.create(form); setShowAdd(false); setForm(emptyForm); load(); } catch (err) { console.error(err); alert('新增失败'); }
  };
  const handleSave = async () => {
    if (editingId == null) return;
    try { await menuApi.update(editingId, form); setEditingId(null); setForm(emptyForm); load(); } catch (err) { console.error(err); alert('修改失败'); }
  };
  const handleDelete = async (id: number) => {
    if (!confirm('确定删除该菜单吗？子菜单也会一并删除。')) return;
    try { await menuApi.remove(id); load(); } catch (err) { console.error(err); alert('删除失败'); }
  };
  const handleToggleVisible = async (m: MenuVO) => {
    try { await menuApi.toggleVisible(m.id, m.visible === 1 ? 0 : 1); load(); } catch (err) { console.error(err); }
  };

  const toggleExpand = (id: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const renderTree = (nodes: MenuVO[], depth = 0): React.ReactNode => (
    nodes.map((m) => {
      const hasChildren = m.children && m.children.length > 0;
      const isExpanded = expanded.has(m.id);
      return (
        <>
          <tr key={m.id} className="hover:bg-slate-800/30">
            <td className="px-5 py-3" style={{ paddingLeft: 20 + depth * 24 }}>
              <div className="flex items-center gap-2">
                {hasChildren ? (
                  <button onClick={() => toggleExpand(m.id)} className="text-slate-500 hover:text-slate-300">{isExpanded ? '▼' : '▶'}</button>
                ) : <span className="w-3" />}
                <MenuIcon className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-slate-200">{m.name}</span>
              </div>
            </td>
            <td className="px-5 py-3 text-slate-400">{TYPE_MAP[m.type ?? 1] || '--'}</td>
            <td className="px-5 py-3 text-slate-500 font-mono text-xs">{m.routePath || '--'}</td>
            <td className="px-5 py-3 text-slate-500 font-mono text-xs">{m.perm || '--'}</td>
            <td className="px-5 py-3 text-slate-400">{m.sort ?? 0}</td>
            <td className="px-5 py-3">
              <button onClick={() => handleToggleVisible(m)}>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded cursor-pointer ${m.visible === 1 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'}`}>
                  {m.visible === 1 ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                  {m.visible === 1 ? '显示' : '隐藏'}
                </span>
              </button>
            </td>
            <td className="px-5 py-3 text-right whitespace-nowrap">
              <button onClick={() => handleEdit(m)} className="text-sky-400 hover:text-sky-300 mr-3"><Edit2 className="w-4 h-4 inline" /></button>
              <button onClick={() => handleDelete(m.id)} className="text-rose-400 hover:text-rose-300"><Trash2 className="w-4 h-4 inline" /></button>
            </td>
          </tr>
          {hasChildren && isExpanded && renderTree(m.children!, depth + 1)}
        </>
      );
    })
  );

  const inputClass = 'w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-[clamp(14px,1.05vw,20px)] text-slate-200 focus:outline-none focus:border-sky-500/50';

  return (
    <div className="pt-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-[clamp(18px,1.3vw,26px)] font-medium text-slate-100 flex items-center gap-2">
          <MenuIcon className="w-5 h-5 text-sky-500" />菜单管理
        </h2>
        <button onClick={() => { setShowAdd(true); setForm(emptyForm); }} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-[clamp(14px,1.05vw,20px)] text-white"><Plus className="w-4 h-4" />新增菜单</button>
      </div>

      {(showAdd || editingId != null) && (
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 mb-4">
          <h3 className="text-[clamp(14px,1.05vw,20px)] font-medium text-slate-300 mb-3">{editingId != null ? '编辑菜单' : '新增菜单'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div><label className="block text-[clamp(14px,1.05vw,20px)] text-slate-500 mb-1">父菜单</label><select value={form.parentId ?? 0} onChange={(e) => setForm({ ...form, parentId: Number(e.target.value) })} className={inputClass}><option value={0}>顶级</option>{menuOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select></div>
            <div><label className="block text-[clamp(14px,1.05vw,20px)] text-slate-500 mb-1">名称 *</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} /></div>
            <div><label className="block text-[clamp(14px,1.05vw,20px)] text-slate-500 mb-1">类型</label><select value={form.type ?? 1} onChange={(e) => setForm({ ...form, type: Number(e.target.value) })} className={inputClass}>{Object.entries(TYPE_MAP).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
            <div><label className="block text-[clamp(14px,1.05vw,20px)] text-slate-500 mb-1">路由路径</label><input value={form.routePath || ''} onChange={(e) => setForm({ ...form, routePath: e.target.value })} className={inputClass} /></div>
            <div><label className="block text-[clamp(14px,1.05vw,20px)] text-slate-500 mb-1">组件路径</label><input value={form.component || ''} onChange={(e) => setForm({ ...form, component: e.target.value })} className={inputClass} /></div>
            <div><label className="block text-[clamp(14px,1.05vw,20px)] text-slate-500 mb-1">权限标识</label><input value={form.perm || ''} onChange={(e) => setForm({ ...form, perm: e.target.value })} className={inputClass} /></div>
            <div><label className="block text-[clamp(14px,1.05vw,20px)] text-slate-500 mb-1">图标</label><input value={form.icon || ''} onChange={(e) => setForm({ ...form, icon: e.target.value })} className={inputClass} /></div>
            <div><label className="block text-[clamp(14px,1.05vw,20px)] text-slate-500 mb-1">排序</label><input type="number" value={form.sort ?? 0} onChange={(e) => setForm({ ...form, sort: Number(e.target.value) })} className={inputClass} /></div>
            <div><label className="block text-[clamp(14px,1.05vw,20px)] text-slate-500 mb-1">显示</label><select value={form.visible ?? 1} onChange={(e) => setForm({ ...form, visible: Number(e.target.value) })} className={inputClass}><option value={1}>显示</option><option value={0}>隐藏</option></select></div>
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
            <th className="text-left px-5 py-3 font-medium">名称</th><th className="text-left px-5 py-3 font-medium">类型</th><th className="text-left px-5 py-3 font-medium">路由</th><th className="text-left px-5 py-3 font-medium">权限</th><th className="text-left px-5 py-3 font-medium">排序</th><th className="text-left px-5 py-3 font-medium">显示</th><th className="text-right px-5 py-3 font-medium">操作</th>
          </tr></thead>
          <tbody className="divide-y divide-slate-800">
            {renderTree(list)}
            {list.length === 0 && <tr><td colSpan={7} className="px-5 py-8 text-center text-slate-500">暂无菜单数据</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
