import { useEffect, useState, useCallback } from 'react';
import { BellRing, Plus, Trash2, Edit2, Save, X, Send, Undo2, Eye } from 'lucide-react';
import { noticeApi } from '@/src/http/api';
import type { NoticePageVO, NoticeForm, NoticeDetailVO } from '@/src/http/types';

const STATUS_MAP: Record<number, { label: string; color: string }> = {
  0: { label: '未发布', color: 'bg-slate-500/10 text-slate-400 border border-slate-500/20' },
  1: { label: '已发布', color: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' },
  2: { label: '已撤回', color: 'bg-amber-500/10 text-amber-400 border border-amber-500/20' },
};

const LEVEL_MAP: Record<string, string> = { L: '低', M: '中', H: '高' };

const emptyForm: NoticeForm = { title: '', content: '', type: 1, level: 'M', targetType: 1, targetUserIds: [] };

export default function Notices() {
  const [list, setList] = useState<NoticePageVO[]>([]);
  const [total, setTotal] = useState(0);
  const [pageNum, setPageNum] = useState(1);
  const [keywords, setKeywords] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<NoticeForm>(emptyForm);
  const [detail, setDetail] = useState<NoticeDetailVO | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await noticeApi.getPage({ pageNum, pageSize: 10, title: keywords || undefined });
      setList(res.list || []);
      setTotal(res.total || 0);
    } catch (err) { console.error(err); }
  }, [pageNum, keywords]);

  useEffect(() => { load(); }, [load]);

  const handleEdit = async (n: NoticePageVO) => { try { const f = await noticeApi.getForm(n.id); setEditingId(n.id); setForm(f); } catch (err) { console.error(err); } };
  const handleAdd = async () => {
    if (!form.title?.trim() || !form.content?.trim()) return;
    try { await noticeApi.create(form); setShowAdd(false); setForm(emptyForm); load(); } catch (err) { console.error(err); alert('新增失败'); }
  };
  const handleSave = async () => {
    if (editingId == null) return;
    try { await noticeApi.update(editingId, form); setEditingId(null); setForm(emptyForm); load(); } catch (err) { console.error(err); alert('修改失败'); }
  };
  const handleDelete = async (id: number) => {
    if (!confirm('确定删除该通知吗？')) return;
    try { await noticeApi.remove(String(id)); load(); } catch (err) { console.error(err); alert('删除失败'); }
  };
  const handlePublish = async (id: number) => { try { await noticeApi.publish(id); load(); } catch (err) { console.error(err); alert('发布失败'); } };
  const handleRevoke = async (id: number) => { if (!confirm('确定撤回该通知吗？')) return; try { await noticeApi.revoke(id); load(); } catch (err) { console.error(err); alert('撤回失败'); } };
  const handleView = async (id: number) => { try { const d = await noticeApi.getDetail(id); setDetail(d); } catch (err) { console.error(err); } };

  const inputClass = 'w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-[clamp(14px,1.05vw,20px)] text-slate-200 focus:outline-none focus:border-sky-500/50';
  const totalPages = Math.max(1, Math.ceil(total / 10));

  return (
    <div className="pt-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-[clamp(18px,1.3vw,26px)] font-medium text-slate-100 flex items-center gap-2">
          <BellRing className="w-5 h-5 text-sky-500" />通知公告
        </h2>
        <button onClick={() => { setShowAdd(true); setForm(emptyForm); }} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-[clamp(14px,1.05vw,20px)] text-white"><Plus className="w-4 h-4" />新增通知</button>
      </div>

      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 mb-4">
        <input value={keywords} onChange={(e) => { setKeywords(e.target.value); setPageNum(1); }} placeholder="搜索通知标题" className={`${inputClass} max-w-xs`} />
      </div>

      {(showAdd || editingId != null) && (
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 mb-4">
          <h3 className="text-[clamp(14px,1.05vw,20px)] font-medium text-slate-300 mb-3">{editingId != null ? '编辑通知' : '新增通知'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="md:col-span-2"><label className="block text-[clamp(14px,1.05vw,20px)] text-slate-500 mb-1">标题 *</label><input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputClass} /></div>
            <div><label className="block text-[clamp(14px,1.05vw,20px)] text-slate-500 mb-1">优先级</label><select value={form.level || 'M'} onChange={(e) => setForm({ ...form, level: e.target.value })} className={inputClass}>{Object.entries(LEVEL_MAP).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
          </div>
          <div className="mb-4"><label className="block text-[clamp(14px,1.05vw,20px)] text-slate-500 mb-1">内容 *</label><textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={5} className={inputClass} /></div>
          <div className="flex gap-2">
            <button onClick={editingId != null ? handleSave : handleAdd} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[clamp(14px,1.05vw,20px)]"><Save className="w-4 h-4" />保存</button>
            <button onClick={() => { setShowAdd(false); setEditingId(null); setForm(emptyForm); }} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[clamp(14px,1.05vw,20px)]"><X className="w-4 h-4" />取消</button>
          </div>
        </div>
      )}

      {detail && (
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[clamp(16px,1.2vw,24px)] font-medium text-slate-200">{detail.title}</h3>
            <button onClick={() => setDetail(null)} className="text-slate-500 hover:text-slate-300"><X className="w-4 h-4" /></button>
          </div>
          <div className="text-[clamp(14px,1.05vw,20px)] text-slate-400 mb-2">发布人：{detail.publisherName || '--'} | 等级：{LEVEL_MAP[detail.level || ''] || '--'} | 发布时间：{detail.publishTime || '--'}</div>
          <div className="text-[clamp(14px,1.05vw,20px)] text-slate-300 whitespace-pre-wrap bg-slate-950 rounded-lg p-4 border border-slate-800">{detail.content}</div>
        </div>
      )}

      <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden overflow-x-auto">
        <table className="w-full text-[clamp(14px,1.05vw,20px)]">
          <thead><tr className="border-b border-slate-800 text-slate-500">
            <th className="text-left px-5 py-3 font-medium">ID</th><th className="text-left px-5 py-3 font-medium">标题</th><th className="text-left px-5 py-3 font-medium">优先级</th><th className="text-left px-5 py-3 font-medium">发布人</th><th className="text-left px-5 py-3 font-medium">状态</th><th className="text-left px-5 py-3 font-medium">发布时间</th><th className="text-right px-5 py-3 font-medium">操作</th>
          </tr></thead>
          <tbody className="divide-y divide-slate-800">
            {list.map((n) => (
              <tr key={n.id} className="hover:bg-slate-800/30">
                <td className="px-5 py-3 text-slate-400">{n.id}</td>
                <td className="px-5 py-3 text-slate-200">{n.title}</td>
                <td className="px-5 py-3"><span className="text-slate-300">{LEVEL_MAP[n.level || ''] || '--'}</span></td>
                <td className="px-5 py-3 text-slate-400">{n.publisherName || '--'}</td>
                <td className="px-5 py-3"><span className={`inline-flex px-2 py-0.5 rounded ${STATUS_MAP[n.publishStatus]?.color || ''}`}>{STATUS_MAP[n.publishStatus]?.label || '--'}</span></td>
                <td className="px-5 py-3 text-slate-400 whitespace-nowrap">{n.publishTime || '--'}</td>
                <td className="px-5 py-3 text-right whitespace-nowrap">
                  <button onClick={() => handleView(n.id)} title="查看" className="text-slate-400 hover:text-slate-200 mr-2"><Eye className="w-4 h-4 inline" /></button>
                  {n.publishStatus === 0 && <button onClick={() => handlePublish(n.id)} title="发布" className="text-emerald-400 hover:text-emerald-300 mr-2"><Send className="w-4 h-4 inline" /></button>}
                  {n.publishStatus === 1 && <button onClick={() => handleRevoke(n.id)} title="撤回" className="text-amber-400 hover:text-amber-300 mr-2"><Undo2 className="w-4 h-4 inline" /></button>}
                  <button onClick={() => handleEdit(n)} className="text-sky-400 hover:text-sky-300 mr-2"><Edit2 className="w-4 h-4 inline" /></button>
                  <button onClick={() => handleDelete(n.id)} className="text-rose-400 hover:text-rose-300"><Trash2 className="w-4 h-4 inline" /></button>
                </td>
              </tr>
            ))}
            {list.length === 0 && <tr><td colSpan={7} className="px-5 py-8 text-center text-slate-500">暂无通知</td></tr>}
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
