import { useEffect, useState, useCallback } from 'react';
import { SlidersHorizontal, Plus, Trash2, Edit2, Save, X, ShieldCheck } from 'lucide-react';
import { roleApi, menuApi } from '@/src/http/api';
import type { RolePageVO, RoleForm, MenuVO } from '@/src/http/types';

const emptyForm: RoleForm = { name: '', code: '', sort: 0, status: 1, dataScope: 1 };

export default function Roles() {
  const [list, setList] = useState<RolePageVO[]>([]);
  const [total, setTotal] = useState(0);
  const [pageNum, setPageNum] = useState(1);
  const [pageSize] = useState(10);
  const [keywords, setKeywords] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<RoleForm>(emptyForm);

  // 权限分配
  const [menus, setMenus] = useState<MenuVO[]>([]);
  const [permRoleId, setPermRoleId] = useState<number | null>(null);
  const [selectedMenuIds, setSelectedMenuIds] = useState<number[]>([]);

  const load = useCallback(async () => {
    try {
      const res = await roleApi.getPage({ pageNum, pageSize, keywords: keywords || undefined });
      setList(res.list || []);
      setTotal(res.total || 0);
    } catch (err) { console.error(err); }
  }, [pageNum, pageSize, keywords]);

  useEffect(() => { load(); }, [load]);

  const handleEdit = async (r: RolePageVO) => {
    try { const f = await roleApi.getForm(r.id); setEditingId(r.id); setForm(f); } catch (err) { console.error(err); }
  };
  const handleAdd = async () => {
    if (!form.name?.trim() || !form.code?.trim()) return;
    try { await roleApi.create(form); setShowAdd(false); setForm(emptyForm); load(); } catch (err) { console.error(err); alert('新增失败'); }
  };
  const handleSave = async () => {
    if (editingId == null) return;
    try { await roleApi.update(editingId, form); setEditingId(null); setForm(emptyForm); load(); } catch (err) { console.error(err); alert('修改失败'); }
  };
  const handleDelete = async (id: number) => {
    if (!confirm('确定删除该角色吗？')) return;
    try { await roleApi.remove(String(id)); load(); } catch (err) { console.error(err); alert('删除失败'); }
  };
  const handleToggleStatus = async (r: RolePageVO) => {
    try { await roleApi.updateStatus(r.id, r.status === 1 ? 0 : 1); load(); } catch (err) { console.error(err); }
  };

  const handleAssign = async (roleId: number) => {
    setPermRoleId(roleId);
    try {
      const [menuList, ids] = await Promise.all([menuApi.getList(), roleApi.getMenuIds(roleId).catch(() => [])]);
      setMenus(menuList || []);
      setSelectedMenuIds(ids || []);
    } catch (err) { console.error(err); }
  };

  const toggleMenu = (id: number) => {
    setSelectedMenuIds((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]);
  };

  const handleSavePerm = async () => {
    if (permRoleId == null) return;
    try { await roleApi.assignMenus(permRoleId, selectedMenuIds); alert('权限已保存'); setPermRoleId(null); } catch (err) { console.error(err); alert('保存失败'); }
  };

  const renderMenuTree = (nodes: MenuVO[], depth = 0): React.ReactNode => (
    nodes.map((m) => (
      <div key={m.id}>
        <label className="flex items-center gap-2 py-1.5" style={{ paddingLeft: depth * 20 }}>
          <input type="checkbox" checked={selectedMenuIds.includes(m.id)} onChange={() => toggleMenu(m.id)} className="w-3.5 h-3.5 accent-sky-500 rounded" />
          <span className="text-[clamp(14px,1.05vw,20px)] text-slate-300">{m.name}</span>
          {m.perm && <span className="text-[10px] text-slate-600 font-mono">[{m.perm}]</span>}
        </label>
        {m.children && m.children.length > 0 && renderMenuTree(m.children, depth + 1)}
      </div>
    ))
  );

  const inputClass = 'w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-[clamp(14px,1.05vw,20px)] text-slate-200 focus:outline-none focus:border-sky-500/50';
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="pt-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-[clamp(18px,1.3vw,26px)] font-medium text-slate-100 flex items-center gap-2">
          <SlidersHorizontal className="w-5 h-5 text-sky-500" />角色管理
        </h2>
        <button onClick={() => { setShowAdd(true); setForm(emptyForm); }} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-[clamp(14px,1.05vw,20px)] text-white"><Plus className="w-4 h-4" />新增角色</button>
      </div>

      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 mb-4">
        <input value={keywords} onChange={(e) => { setKeywords(e.target.value); setPageNum(1); }} placeholder="搜索角色名称" className={`${inputClass} max-w-xs`} />
      </div>

      {(showAdd || editingId != null) && (
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 mb-4">
          <h3 className="text-[clamp(14px,1.05vw,20px)] font-medium text-slate-300 mb-3">{editingId != null ? '编辑角色' : '新增角色'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div><label className="block text-[clamp(14px,1.05vw,20px)] text-slate-500 mb-1">名称 *</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} /></div>
            <div><label className="block text-[clamp(14px,1.05vw,20px)] text-slate-500 mb-1">编码 *</label><input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} className={inputClass} /></div>
            <div><label className="block text-[clamp(14px,1.05vw,20px)] text-slate-500 mb-1">排序</label><input type="number" value={form.sort ?? 0} onChange={(e) => setForm({ ...form, sort: Number(e.target.value) })} className={inputClass} /></div>
            <div><label className="block text-[clamp(14px,1.05vw,20px)] text-slate-500 mb-1">状态</label><select value={form.status ?? 1} onChange={(e) => setForm({ ...form, status: Number(e.target.value) })} className={inputClass}><option value={1}>启用</option><option value={0}>禁用</option></select></div>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={editingId != null ? handleSave : handleAdd} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[clamp(14px,1.05vw,20px)]"><Save className="w-4 h-4" />保存</button>
            <button onClick={() => { setShowAdd(false); setEditingId(null); setForm(emptyForm); }} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[clamp(14px,1.05vw,20px)]"><X className="w-4 h-4" />取消</button>
          </div>
        </div>
      )}

      {/* 权限分配 */}
      {permRoleId != null && (
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 mb-4">
          <h3 className="text-[clamp(14px,1.05vw,20px)] font-medium text-slate-300 mb-3 flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-sky-500" />分配菜单权限 (角色ID: {permRoleId})</h3>
          <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 max-h-96 overflow-y-auto">
            {renderMenuTree(menus)}
            {menus.length === 0 && <p className="text-center text-slate-500 py-4 text-[clamp(14px,1.05vw,20px)]">暂无菜单数据</p>}
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={handleSavePerm} className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[clamp(14px,1.05vw,20px)]">保存权限</button>
            <button onClick={() => setPermRoleId(null)} className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[clamp(14px,1.05vw,20px)]">取消</button>
          </div>
        </div>
      )}

      <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden overflow-x-auto">
        <table className="w-full text-[clamp(14px,1.05vw,20px)]">
          <thead><tr className="border-b border-slate-800 text-slate-500">
            <th className="text-left px-5 py-3 font-medium">ID</th><th className="text-left px-5 py-3 font-medium">名称</th><th className="text-left px-5 py-3 font-medium">编码</th><th className="text-left px-5 py-3 font-medium">排序</th><th className="text-left px-5 py-3 font-medium">状态</th><th className="text-left px-5 py-3 font-medium">创建时间</th><th className="text-right px-5 py-3 font-medium">操作</th>
          </tr></thead>
          <tbody className="divide-y divide-slate-800">
            {list.map((r) => (
              <tr key={r.id} className="hover:bg-slate-800/30">
                <td className="px-5 py-3 text-slate-400">{r.id}</td>
                <td className="px-5 py-3 text-slate-200">{r.name}</td>
                <td className="px-5 py-3 text-slate-400 font-mono">{r.code}</td>
                <td className="px-5 py-3 text-slate-300">{r.sort ?? 0}</td>
                <td className="px-5 py-3"><button onClick={() => handleToggleStatus(r)}><span className={`inline-flex px-2 py-0.5 rounded cursor-pointer ${r.status === 1 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>{r.status === 1 ? '启用' : '禁用'}</span></button></td>
                <td className="px-5 py-3 text-slate-400 whitespace-nowrap">{r.createTime || '--'}</td>
                <td className="px-5 py-3 text-right whitespace-nowrap">
                  <button onClick={() => handleAssign(r.id)} title="分配权限" className="text-sky-400 hover:text-sky-300 mr-3"><ShieldCheck className="w-4 h-4 inline" /></button>
                  <button onClick={() => handleEdit(r)} className="text-amber-400 hover:text-amber-300 mr-3"><Edit2 className="w-4 h-4 inline" /></button>
                  <button onClick={() => handleDelete(r.id)} className="text-rose-400 hover:text-rose-300"><Trash2 className="w-4 h-4 inline" /></button>
                </td>
              </tr>
            ))}
            {list.length === 0 && <tr><td colSpan={7} className="px-5 py-8 text-center text-slate-500">暂无角色数据</td></tr>}
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
