import { useEffect, useState, useCallback } from 'react';
import { BookMarked, Plus, Trash2, Edit2, Save, X, ChevronRight } from 'lucide-react';
import { dictApi } from '@/src/http/api';
import type { DictPageVO, DictForm, DictItemPageVO, DictItemForm } from '@/src/http/types';

const emptyDict: DictForm = { name: '', dictCode: '', remark: '', status: 1 };
const emptyItem: DictItemForm = { label: '', value: '', sort: 0, status: 1, tagType: '' };

export default function Dicts() {
  const [dicts, setDicts] = useState<DictPageVO[]>([]);
  const [dictTotal, setDictTotal] = useState(0);
  const [dictPage, setDictPage] = useState(1);
  const [keywords, setKeywords] = useState('');
  const [selectedDict, setSelectedDict] = useState<DictPageVO | null>(null);

  const [showAddDict, setShowAddDict] = useState(false);
  const [editingDictId, setEditingDictId] = useState<number | null>(null);
  const [dictForm, setDictForm] = useState<DictForm>(emptyDict);

  const [items, setItems] = useState<DictItemPageVO[]>([]);
  const [itemTotal, setItemTotal] = useState(0);
  const [itemPage, setItemPage] = useState(1);
  const [showAddItem, setShowAddItem] = useState(false);
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [itemForm, setItemForm] = useState<DictItemForm>(emptyItem);

  const loadDicts = useCallback(async () => {
    try {
      const res = await dictApi.getPage({ pageNum: dictPage, pageSize: 10, keywords: keywords || undefined });
      setDicts(res.list || []);
      setDictTotal(res.total || 0);
    } catch (err) { console.error(err); }
  }, [dictPage, keywords]);

  const loadItems = useCallback(async () => {
    if (!selectedDict) return;
    try {
      const res = await dictApi.getItemsPage(selectedDict.dictCode, { pageNum: itemPage, pageSize: 10 });
      setItems(res.list || []);
      setItemTotal(res.total || 0);
    } catch (err) { console.error(err); }
  }, [selectedDict, itemPage]);

  useEffect(() => { loadDicts(); }, [loadDicts]);
  useEffect(() => { if (selectedDict) loadItems(); }, [selectedDict, loadItems]);

  // 字典操作
  const handleAddDict = async () => {
    if (!dictForm.dictCode?.trim()) return;
    try { await dictApi.create(dictForm); setShowAddDict(false); setDictForm(emptyDict); loadDicts(); } catch (err) { console.error(err); alert('新增失败'); }
  };
  const handleEditDict = async (d: DictPageVO) => { try { const f = await dictApi.getForm(d.id); setEditingDictId(d.id); setDictForm(f); } catch (err) { console.error(err); } };
  const handleSaveDict = async () => {
    if (editingDictId == null) return;
    try { await dictApi.update(editingDictId, dictForm); setEditingDictId(null); setDictForm(emptyDict); loadDicts(); } catch (err) { console.error(err); alert('修改失败'); }
  };
  const handleDeleteDict = async (id: number) => {
    if (!confirm('确定删除该字典吗？')) return;
    try { await dictApi.remove(String(id)); loadDicts(); } catch (err) { console.error(err); alert('删除失败'); }
  };

  // 字典项操作
  const handleAddItem = async () => {
    if (!selectedDict || !itemForm.label?.trim()) return;
    try { await dictApi.createItem(selectedDict.dictCode, itemForm); setShowAddItem(false); setItemForm(emptyItem); loadItems(); } catch (err) { console.error(err); alert('新增失败'); }
  };
  const handleEditItem = async (it: DictItemPageVO) => {
    if (!selectedDict) return;
    try { const f = await dictApi.getItemForm(selectedDict.dictCode, it.id); setEditingItemId(it.id); setItemForm(f); } catch (err) { console.error(err); }
  };
  const handleSaveItem = async () => {
    if (editingItemId == null || !selectedDict) return;
    try { await dictApi.updateItem(selectedDict.dictCode, editingItemId, itemForm); setEditingItemId(null); setItemForm(emptyItem); loadItems(); } catch (err) { console.error(err); alert('修改失败'); }
  };
  const handleDeleteItem = async (id: number) => {
    if (!confirm('确定删除该字典项吗？') || !selectedDict) return;
    try { await dictApi.removeItem(selectedDict.dictCode, String(id)); loadItems(); } catch (err) { console.error(err); alert('删除失败'); }
  };

  const inputClass = 'w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-[clamp(14px,1.05vw,20px)] text-slate-200 focus:outline-none focus:border-sky-500/50';

  return (
    <div className="pt-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-[clamp(18px,1.3vw,26px)] font-medium text-slate-100 flex items-center gap-2">
          <BookMarked className="w-5 h-5 text-sky-500" />字典管理
        </h2>
        <button onClick={() => { setShowAddDict(true); setDictForm(emptyDict); }} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-[clamp(14px,1.05vw,20px)] text-white"><Plus className="w-4 h-4" />新增字典</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 字典列表 */}
        <div>
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 mb-4">
            <input value={keywords} onChange={(e) => { setKeywords(e.target.value); setDictPage(1); }} placeholder="搜索字典" className={`${inputClass}`} />
          </div>

          {(showAddDict || editingDictId != null) && (
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 mb-4">
              <h3 className="text-[clamp(14px,1.05vw,20px)] font-medium text-slate-300 mb-3">{editingDictId != null ? '编辑字典' : '新增字典'}</h3>
              <div className="space-y-3">
                <div><label className="block text-[clamp(14px,1.05vw,20px)] text-slate-500 mb-1">编码 *</label><input value={dictForm.dictCode} onChange={(e) => setDictForm({ ...dictForm, dictCode: e.target.value })} className={inputClass} disabled={editingDictId != null} /></div>
                <div><label className="block text-[clamp(14px,1.05vw,20px)] text-slate-500 mb-1">名称</label><input value={dictForm.name || ''} onChange={(e) => setDictForm({ ...dictForm, name: e.target.value })} className={inputClass} /></div>
                <div><label className="block text-[clamp(14px,1.05vw,20px)] text-slate-500 mb-1">备注</label><input value={dictForm.remark || ''} onChange={(e) => setDictForm({ ...dictForm, remark: e.target.value })} className={inputClass} /></div>
              </div>
              <div className="flex gap-2 mt-3">
                <button onClick={editingDictId != null ? handleSaveDict : handleAddDict} className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[clamp(14px,1.05vw,20px)]"><Save className="w-4 h-4 inline" />保存</button>
                <button onClick={() => { setShowAddDict(false); setEditingDictId(null); setDictForm(emptyDict); }} className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[clamp(14px,1.05vw,20px)]">取消</button>
              </div>
            </div>
          )}

          <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
            <table className="w-full text-[clamp(14px,1.05vw,20px)]">
              <thead><tr className="border-b border-slate-800 text-slate-500"><th className="text-left px-4 py-3 font-medium">字典</th><th className="text-right px-4 py-3 font-medium">操作</th></tr></thead>
              <tbody className="divide-y divide-slate-800">
                {dicts.map((d) => (
                  <tr key={d.id} className={`hover:bg-slate-800/30 cursor-pointer ${selectedDict?.id === d.id ? 'bg-sky-500/5' : ''}`} onClick={() => { setSelectedDict(d); setItemPage(1); }}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <ChevronRight className={`w-3.5 h-3.5 transition-transform ${selectedDict?.id === d.id ? 'rotate-90 text-sky-400' : 'text-slate-600'}`} />
                        <div>
                          <div className="text-slate-200">{d.name || d.dictCode}</div>
                          <div className="text-[10px] text-slate-500 font-mono">{d.dictCode}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => handleEditDict(d)} className="text-sky-400 hover:text-sky-300 mr-2"><Edit2 className="w-4 h-4 inline" /></button>
                      <button onClick={() => handleDeleteDict(d.id)} className="text-rose-400 hover:text-rose-300"><Trash2 className="w-4 h-4 inline" /></button>
                    </td>
                  </tr>
                ))}
                {dicts.length === 0 && <tr><td colSpan={2} className="px-4 py-8 text-center text-slate-500">暂无字典</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        {/* 字典项列表 */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[clamp(16px,1.2vw,24px)] font-medium text-slate-200">
              {selectedDict ? `字典项 - ${selectedDict.name || selectedDict.dictCode}` : '请选择左侧字典'}
            </h3>
            {selectedDict && <button onClick={() => { setShowAddItem(true); setItemForm(emptyItem); }} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-[clamp(14px,1.05vw,20px)] text-white"><Plus className="w-4 h-4" />新增项</button>}
          </div>

          {(showAddItem || editingItemId != null) && selectedDict && (
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 mb-4">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-[clamp(14px,1.05vw,20px)] text-slate-500 mb-1">标签 *</label><input value={itemForm.label || ''} onChange={(e) => setItemForm({ ...itemForm, label: e.target.value })} className={inputClass} /></div>
                <div><label className="block text-[clamp(14px,1.05vw,20px)] text-slate-500 mb-1">值</label><input value={itemForm.value || ''} onChange={(e) => setItemForm({ ...itemForm, value: e.target.value })} className={inputClass} /></div>
                <div><label className="block text-[clamp(14px,1.05vw,20px)] text-slate-500 mb-1">排序</label><input type="number" value={itemForm.sort ?? 0} onChange={(e) => setItemForm({ ...itemForm, sort: Number(e.target.value) })} className={inputClass} /></div>
                <div><label className="block text-[clamp(14px,1.05vw,20px)] text-slate-500 mb-1">状态</label><select value={itemForm.status ?? 1} onChange={(e) => setItemForm({ ...itemForm, status: Number(e.target.value) })} className={inputClass}><option value={1}>启用</option><option value={0}>禁用</option></select></div>
              </div>
              <div className="flex gap-2 mt-3">
                <button onClick={editingItemId != null ? handleSaveItem : handleAddItem} className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[clamp(14px,1.05vw,20px)]">保存</button>
                <button onClick={() => { setShowAddItem(false); setEditingItemId(null); setItemForm(emptyItem); }} className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[clamp(14px,1.05vw,20px)]">取消</button>
              </div>
            </div>
          )}

          <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
            <table className="w-full text-[clamp(14px,1.05vw,20px)]">
              <thead><tr className="border-b border-slate-800 text-slate-500"><th className="text-left px-4 py-3 font-medium">标签</th><th className="text-left px-4 py-3 font-medium">值</th><th className="text-left px-4 py-3 font-medium">状态</th><th className="text-right px-4 py-3 font-medium">操作</th></tr></thead>
              <tbody className="divide-y divide-slate-800">
                {items.map((it) => (
                  <tr key={it.id} className="hover:bg-slate-800/30">
                    <td className="px-4 py-3 text-slate-200">{it.label}</td>
                    <td className="px-4 py-3 text-slate-400 font-mono">{it.value}</td>
                    <td className="px-4 py-3"><span className={`inline-flex px-2 py-0.5 rounded ${it.status === 1 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'}`}>{it.status === 1 ? '启用' : '禁用'}</span></td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => handleEditItem(it)} className="text-sky-400 hover:text-sky-300 mr-2"><Edit2 className="w-4 h-4 inline" /></button>
                      <button onClick={() => handleDeleteItem(it.id)} className="text-rose-400 hover:text-rose-300"><Trash2 className="w-4 h-4 inline" /></button>
                    </td>
                  </tr>
                ))}
                {items.length === 0 && <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-500">{selectedDict ? '暂无字典项' : '请先选择字典'}</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
