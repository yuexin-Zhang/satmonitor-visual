import { useEffect, useState, useCallback } from 'react';
import { ShieldAlert, Plus, Trash2, Edit2, Save, X, CheckCircle, Wrench, Lock } from 'lucide-react';
import { alarmApi, stationApi } from '@/src/http/api';
import type { SatAlarmRule, SatAlarmRuleForm, SatAlarmRecordVO, OptionLong } from '@/src/http/types';

type TabKey = 'rules' | 'records';
const TAB_LIST: { key: TabKey; label: string }[] = [
  { key: 'rules', label: '告警规则' },
  { key: 'records', label: '告警记录' },
];

const LEVEL_MAP: Record<number, { label: string; color: string }> = {
  1: { label: '一级', color: 'bg-amber-500/10 text-amber-400 border border-amber-500/20' },
  2: { label: '二级', color: 'bg-orange-500/10 text-orange-400 border border-orange-500/20' },
  3: { label: '三级', color: 'bg-rose-500/10 text-rose-400 border border-rose-500/20' },
};

const RECORD_STATUS_MAP: Record<number, { label: string; color: string }> = {
  0: { label: '待确认', color: 'bg-amber-500/10 text-amber-400 border border-amber-500/20' },
  1: { label: '已确认', color: 'bg-sky-500/10 text-sky-400 border border-sky-500/20' },
  2: { label: '处置中', color: 'bg-orange-500/10 text-orange-400 border border-orange-500/20' },
  3: { label: '已闭环', color: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' },
  4: { label: '超时督办', color: 'bg-rose-500/10 text-rose-400 border border-rose-500/20' },
};

const emptyRuleForm: SatAlarmRuleForm = { stationId: undefined, ruleType: '', alarmLevel: 1, level2TimeoutMinutes: 30, level3TimeoutMinutes: 120, notifyChannels: 'popup', enabled: 1 };

export default function Alarms() {
  const [activeTab, setActiveTab] = useState<TabKey>('rules');
  const [stationOptions, setStationOptions] = useState<OptionLong[]>([]);

  // 规则
  const [rules, setRules] = useState<SatAlarmRule[]>([]);
  const [showAddRule, setShowAddRule] = useState(false);
  const [editingRuleId, setEditingRuleId] = useState<number | null>(null);
  const [ruleForm, setRuleForm] = useState<SatAlarmRuleForm>(emptyRuleForm);

  // 记录
  const [records, setRecords] = useState<SatAlarmRecordVO[]>([]);
  const [recordTotal, setRecordTotal] = useState(0);
  const [recordPage, setRecordPage] = useState(1);
  const [recordStatus, setRecordStatus] = useState<number | undefined>(undefined);
  const [recordStation, setRecordStation] = useState<number | undefined>(undefined);
  const [handleTarget, setHandleTarget] = useState<number | null>(null);
  const [handleRemark, setHandleRemark] = useState('');

  const loadRules = useCallback(async () => {
    try { const res = await alarmApi.getRules(); setRules(res || []); } catch (err) { console.error(err); }
  }, []);

  const loadRecords = useCallback(async () => {
    try {
      const res = await alarmApi.getRecordsPage({ pageNum: recordPage, pageSize: 10, status: recordStatus, stationId: recordStation });
      setRecords(res.list || []);
      setRecordTotal(res.total || 0);
    } catch (err) { console.error(err); }
  }, [recordPage, recordStatus, recordStation]);

  useEffect(() => { stationApi.getOptions().then(setStationOptions).catch(() => {}); }, []);
  useEffect(() => { if (activeTab === 'rules') loadRules(); else loadRecords(); }, [activeTab, loadRules, loadRecords]);

  // 规则操作
  const handleAddRule = async () => {
    if (!ruleForm.ruleType?.trim()) return;
    try { await alarmApi.createRule(ruleForm); setShowAddRule(false); setRuleForm(emptyRuleForm); loadRules(); } catch (err) { console.error(err); alert('新增失败'); }
  };
  const handleEditRule = (r: SatAlarmRule) => { setEditingRuleId(r.id); setRuleForm({ ...r, config: r.configJson }); };
  const handleSaveRule = async () => {
    if (editingRuleId == null) return;
    try { await alarmApi.updateRule(editingRuleId, ruleForm); setEditingRuleId(null); setRuleForm(emptyRuleForm); loadRules(); } catch (err) { console.error(err); alert('修改失败'); }
  };
  const handleDeleteRule = async (id: number) => {
    if (!confirm('确定删除该规则吗？')) return;
    try { await alarmApi.removeRule(id); loadRules(); } catch (err) { console.error(err); alert('删除失败'); }
  };

  // 记录操作
  const handleConfirm = async (id: number) => { try { await alarmApi.confirm(id); loadRecords(); } catch (err) { console.error(err); } };
  const handleClose = async (id: number) => { try { await alarmApi.close(id); loadRecords(); } catch (err) { console.error(err); } };
  const handleHandle = async () => {
    if (handleTarget == null) return;
    try { await alarmApi.handle(handleTarget, handleRemark || undefined); setHandleTarget(null); setHandleRemark(''); loadRecords(); } catch (err) { console.error(err); alert('处置失败'); }
  };

  const inputClass = 'w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-[clamp(14px,1.05vw,20px)] text-slate-200 focus:outline-none focus:border-sky-500/50';
  const recordTotalPages = Math.max(1, Math.ceil(recordTotal / 10));
  const stationName = (id?: number) => stationOptions.find((s) => s.value === id)?.label;

  return (
    <div className="pt-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-[clamp(18px,1.3vw,26px)] font-medium text-slate-100 flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-sky-500" />告警管理
        </h2>
      </div>

      <div className="flex gap-2 mb-6 border-b border-slate-800">
        {TAB_LIST.map((tab) => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`px-4 py-2.5 text-[clamp(14px,1.05vw,20px)] transition-colors border-b-2 -mb-[1px] ${activeTab === tab.key ? 'text-sky-400 border-sky-500' : 'text-slate-500 border-transparent hover:text-slate-300'}`}>{tab.label}</button>
        ))}
      </div>

      {/* ========== 告警规则 ========== */}
      {activeTab === 'rules' && (
        <div>
          <div className="flex justify-end mb-4">
            <button onClick={() => { setShowAddRule(true); setRuleForm(emptyRuleForm); }} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-[clamp(14px,1.05vw,20px)] text-white"><Plus className="w-4 h-4" />新增规则</button>
          </div>

          {(showAddRule || editingRuleId != null) && (
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 mb-4">
              <h3 className="text-[clamp(14px,1.05vw,20px)] font-medium text-slate-300 mb-3">{editingRuleId != null ? '编辑规则' : '新增规则'}</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div><label className="block text-[clamp(14px,1.05vw,20px)] text-slate-500 mb-1">告警类型 *</label><input value={ruleForm.ruleType || ''} onChange={(e) => setRuleForm({ ...ruleForm, ruleType: e.target.value })} className={inputClass} placeholder="如 signal_low" /></div>
                <div><label className="block text-[clamp(14px,1.05vw,20px)] text-slate-500 mb-1">台站(空=全局)</label><select value={ruleForm.stationId ?? ''} onChange={(e) => setRuleForm({ ...ruleForm, stationId: e.target.value ? Number(e.target.value) : undefined })} className={inputClass}><option value="">全局</option>{stationOptions.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}</select></div>
                <div><label className="block text-[clamp(14px,1.05vw,20px)] text-slate-500 mb-1">默认等级</label><select value={ruleForm.alarmLevel ?? 1} onChange={(e) => setRuleForm({ ...ruleForm, alarmLevel: Number(e.target.value) })} className={inputClass}>{Object.entries(LEVEL_MAP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select></div>
                <div><label className="block text-[clamp(14px,1.05vw,20px)] text-slate-500 mb-1">Level2升级超时(分)</label><input type="number" value={ruleForm.level2TimeoutMinutes ?? 30} onChange={(e) => setRuleForm({ ...ruleForm, level2TimeoutMinutes: Number(e.target.value) })} className={inputClass} /></div>
                <div><label className="block text-[clamp(14px,1.05vw,20px)] text-slate-500 mb-1">Level3升级超时(分)</label><input type="number" value={ruleForm.level3TimeoutMinutes ?? 120} onChange={(e) => setRuleForm({ ...ruleForm, level3TimeoutMinutes: Number(e.target.value) })} className={inputClass} /></div>
                <div><label className="block text-[clamp(14px,1.05vw,20px)] text-slate-500 mb-1">通知渠道</label><input value={ruleForm.notifyChannels || ''} onChange={(e) => setRuleForm({ ...ruleForm, notifyChannels: e.target.value })} className={inputClass} placeholder="popup,sms" /></div>
                <div><label className="block text-[clamp(14px,1.05vw,20px)] text-slate-500 mb-1">启用</label><select value={ruleForm.enabled ?? 1} onChange={(e) => setRuleForm({ ...ruleForm, enabled: Number(e.target.value) })} className={inputClass}><option value={1}>启用</option><option value={0}>禁用</option></select></div>
              </div>
              <div className="flex gap-2 mt-4">
                <button onClick={editingRuleId != null ? handleSaveRule : handleAddRule} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[clamp(14px,1.05vw,20px)]"><Save className="w-4 h-4" />保存</button>
                <button onClick={() => { setShowAddRule(false); setEditingRuleId(null); setRuleForm(emptyRuleForm); }} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[clamp(14px,1.05vw,20px)]"><X className="w-4 h-4" />取消</button>
              </div>
            </div>
          )}

          <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden overflow-x-auto">
            <table className="w-full text-[clamp(14px,1.05vw,20px)]">
              <thead><tr className="border-b border-slate-800 text-slate-500">
                <th className="text-left px-5 py-3 font-medium">ID</th><th className="text-left px-5 py-3 font-medium">类型</th><th className="text-left px-5 py-3 font-medium">台站</th><th className="text-left px-5 py-3 font-medium">等级</th><th className="text-left px-5 py-3 font-medium">通知渠道</th><th className="text-left px-5 py-3 font-medium">状态</th><th className="text-right px-5 py-3 font-medium">操作</th>
              </tr></thead>
              <tbody className="divide-y divide-slate-800">
                {rules.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-800/30">
                    <td className="px-5 py-3 text-slate-400">{r.id}</td>
                    <td className="px-5 py-3 text-slate-200">{r.ruleType || '--'}</td>
                    <td className="px-5 py-3 text-slate-300">{r.stationId ? stationName(r.stationId) || r.stationId : '全局'}</td>
                    <td className="px-5 py-3"><span className={`inline-flex px-2 py-0.5 rounded ${LEVEL_MAP[r.alarmLevel ?? 1]?.color || ''}`}>{LEVEL_MAP[r.alarmLevel ?? 1]?.label || '--'}</span></td>
                    <td className="px-5 py-3 text-slate-400">{r.notifyChannels || '--'}</td>
                    <td className="px-5 py-3"><span className={`inline-flex px-2 py-0.5 rounded ${r.enabled === 1 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'}`}>{r.enabled === 1 ? '启用' : '禁用'}</span></td>
                    <td className="px-5 py-3 text-right whitespace-nowrap">
                      <button onClick={() => handleEditRule(r)} className="text-sky-400 hover:text-sky-300 mr-3"><Edit2 className="w-4 h-4 inline" /></button>
                      <button onClick={() => handleDeleteRule(r.id)} className="text-rose-400 hover:text-rose-300"><Trash2 className="w-4 h-4 inline" /></button>
                    </td>
                  </tr>
                ))}
                {rules.length === 0 && <tr><td colSpan={7} className="px-5 py-8 text-center text-slate-500">暂无告警规则</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========== 告警记录 ========== */}
      {activeTab === 'records' && (
        <div>
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 mb-4 flex flex-wrap items-center gap-3">
            <select value={recordStation ?? ''} onChange={(e) => { setRecordStation(e.target.value ? Number(e.target.value) : undefined); setRecordPage(1); }} className={`${inputClass} max-w-[180px]`}>
              <option value="">全部台站</option>
              {stationOptions.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
            <select value={recordStatus ?? ''} onChange={(e) => { setRecordStatus(e.target.value ? Number(e.target.value) : undefined); setRecordPage(1); }} className={`${inputClass} max-w-[140px]`}>
              <option value="">全部状态</option>
              {Object.entries(RECORD_STATUS_MAP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>

          {handleTarget != null && (
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 mb-4">
              <h3 className="text-[clamp(14px,1.05vw,20px)] font-medium text-slate-300 mb-3">处置告警 (ID: {handleTarget})</h3>
              <div className="flex items-end gap-3">
                <div className="flex-1 max-w-md"><label className="block text-[clamp(14px,1.05vw,20px)] text-slate-500 mb-1">处理备注</label><input value={handleRemark} onChange={(e) => setHandleRemark(e.target.value)} className={inputClass} placeholder="处理说明" /></div>
                <button onClick={handleHandle} className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[clamp(14px,1.05vw,20px)]">确认处置</button>
                <button onClick={() => { setHandleTarget(null); setHandleRemark(''); }} className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[clamp(14px,1.05vw,20px)]">取消</button>
              </div>
            </div>
          )}

          <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden overflow-x-auto">
            <table className="w-full text-[clamp(14px,1.05vw,20px)]">
              <thead><tr className="border-b border-slate-800 text-slate-500">
                <th className="text-left px-5 py-3 font-medium">ID</th><th className="text-left px-5 py-3 font-medium">台站</th><th className="text-left px-5 py-3 font-medium">类型</th><th className="text-left px-5 py-3 font-medium">等级</th><th className="text-left px-5 py-3 font-medium">标题</th><th className="text-left px-5 py-3 font-medium">状态</th><th className="text-left px-5 py-3 font-medium">触发时间</th><th className="text-right px-5 py-3 font-medium">操作</th>
              </tr></thead>
              <tbody className="divide-y divide-slate-800">
                {records.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-800/30">
                    <td className="px-5 py-3 text-slate-400">{r.id}</td>
                    <td className="px-5 py-3 text-slate-300">{r.stationName || '--'}</td>
                    <td className="px-5 py-3 text-slate-400">{r.alarmType || '--'}</td>
                    <td className="px-5 py-3"><span className={`inline-flex px-2 py-0.5 rounded ${LEVEL_MAP[r.alarmLevel ?? 1]?.color || ''}`}>{LEVEL_MAP[r.alarmLevel ?? 1]?.label || '--'}</span></td>
                    <td className="px-5 py-3 text-slate-200 max-w-xs truncate" title={r.title}>{r.title || '--'}</td>
                    <td className="px-5 py-3"><span className={`inline-flex px-2 py-0.5 rounded ${RECORD_STATUS_MAP[r.status]?.color || ''}`}>{RECORD_STATUS_MAP[r.status]?.label || '--'}</span></td>
                    <td className="px-5 py-3 text-slate-400 whitespace-nowrap">{r.triggerTime || '--'}</td>
                    <td className="px-5 py-3 text-right whitespace-nowrap">
                      {r.status === 0 && <button onClick={() => handleConfirm(r.id)} title="确认" className="text-sky-400 hover:text-sky-300 mr-2"><CheckCircle className="w-4 h-4 inline" /></button>}
                      {(r.status === 1 || r.status === 0) && <button onClick={() => setHandleTarget(r.id)} title="处置" className="text-amber-400 hover:text-amber-300 mr-2"><Wrench className="w-4 h-4 inline" /></button>}
                      {(r.status === 1 || r.status === 2) && <button onClick={() => handleClose(r.id)} title="闭环" className="text-emerald-400 hover:text-emerald-300 mr-2"><Lock className="w-4 h-4 inline" /></button>}
                    </td>
                  </tr>
                ))}
                {records.length === 0 && <tr><td colSpan={8} className="px-5 py-8 text-center text-slate-500">暂无告警记录</td></tr>}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between mt-4 text-[clamp(14px,1.05vw,20px)] text-slate-500">
            <span>共 {recordTotal} 条</span>
            <div className="flex items-center gap-2">
              <button disabled={recordPage <= 1} onClick={() => setRecordPage((p) => p - 1)} className="px-3 py-1 rounded-lg bg-slate-800 disabled:opacity-40 hover:bg-slate-700 text-slate-300">上一页</button>
              <span>{recordPage} / {recordTotalPages}</span>
              <button disabled={recordPage >= recordTotalPages} onClick={() => setRecordPage((p) => p + 1)} className="px-3 py-1 rounded-lg bg-slate-800 disabled:opacity-40 hover:bg-slate-700 text-slate-300">下一页</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
