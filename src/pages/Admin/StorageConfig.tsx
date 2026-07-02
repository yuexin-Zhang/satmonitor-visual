import { useEffect, useState, useCallback } from 'react';
import { Database, Save, RefreshCw } from 'lucide-react';
import { storageConfigApi } from '@/src/http/api';
import type { SatStorageConfig } from '@/src/http/types';

export default function StorageConfig() {
  const [list, setList] = useState<SatStorageConfig[]>([]);
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await storageConfigApi.getList();
      setList(res || []);
      const map: Record<string, string> = {};
      (res || []).forEach((c) => { map[c.configKey] = c.configValue; });
      setEdits(map);
    } catch (err) { console.error(err); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await storageConfigApi.batchUpdate(edits);
      load();
      alert('存储配置已批量更新');
    } catch (err) { console.error(err); alert('保存失败'); }
    finally { setSaving(false); }
  };

  const inputClass = 'w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-[clamp(14px,1.05vw,20px)] text-slate-200 focus:outline-none focus:border-sky-500/50';

  return (
    <div className="pt-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-[clamp(18px,1.3vw,26px)] font-medium text-slate-100 flex items-center gap-2">
          <Database className="w-5 h-5 text-sky-500" />存储配置
        </h2>
        <div className="flex gap-2">
          <button onClick={load} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-[clamp(14px,1.05vw,20px)] text-slate-300"><RefreshCw className="w-4 h-4" />刷新</button>
          <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-[clamp(14px,1.05vw,20px)] text-white"><Save className="w-4 h-4" />批量保存</button>
        </div>
      </div>

      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5">
        <p className="text-[clamp(14px,1.05vw,20px)] text-slate-500 mb-4">存储相关配置项，修改后点击"批量保存"统一生效。</p>
        <div className="space-y-4">
          {list.map((c) => (
            <div key={c.id} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
              <div>
                <div className="text-slate-200 text-[clamp(14px,1.05vw,20px)]">{c.configName || c.configKey}</div>
                <div className="text-[10px] text-slate-500 font-mono">{c.configKey}</div>
              </div>
              <div className="md:col-span-2">
                <input value={edits[c.configKey] ?? ''} onChange={(e) => setEdits({ ...edits, [c.configKey]: e.target.value })} className={inputClass} placeholder={c.configValue} />
                {c.remark && <p className="text-[10px] text-slate-600 mt-1">{c.remark}</p>}
              </div>
            </div>
          ))}
          {list.length === 0 && <p className="text-center text-slate-500 py-8 text-[clamp(14px,1.05vw,20px)]">暂无存储配置</p>}
        </div>
      </div>
    </div>
  );
}
