import { useEffect, useState, useCallback } from 'react';
import { Bot, Save, RefreshCw } from 'lucide-react';
import { aiConfigApi } from '@/src/http/api';

export default function AIConfig() {
  const [configText, setConfigText] = useState('{}');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await aiConfigApi.get();
      setConfigText(JSON.stringify(res ?? {}, null, 2));
    } catch (err) {
      console.error(err);
      setConfigText('{}');
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    let data;
    try { data = JSON.parse(configText); } catch { alert('JSON 格式错误'); return; }
    setSaving(true);
    try {
      await aiConfigApi.update(data);
      load();
      alert('AI 配置已更新');
    } catch (err) { console.error(err); alert('保存失败'); }
    finally { setSaving(false); }
  };

  return (
    <div className="pt-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-[clamp(18px,1.3vw,26px)] font-medium text-slate-100 flex items-center gap-2">
          <Bot className="w-5 h-5 text-sky-500" />AI / 数字孪生配置
        </h2>
        <div className="flex gap-2">
          <button onClick={load} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-[clamp(14px,1.05vw,20px)] text-slate-300"><RefreshCw className="w-4 h-4" />刷新</button>
          <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-[clamp(14px,1.05vw,20px)] text-white"><Save className="w-4 h-4" />保存</button>
        </div>
      </div>

      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5">
        <p className="text-[clamp(14px,1.05vw,20px)] text-slate-500 mb-3">AI 及数字孪生相关配置（JSON 格式）</p>
        <textarea
          value={configText}
          onChange={(e) => setConfigText(e.target.value)}
          rows={22}
          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-[clamp(14px,1.05vw,20px)] text-emerald-300 font-mono focus:outline-none focus:border-sky-500/50"
          placeholder='{"model": "...", "apiKey": "..."}'
        />
      </div>
    </div>
  );
}
