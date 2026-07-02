import { useEffect, useState, useCallback } from 'react';
import { Settings, Save, History, RotateCcw, Radio } from 'lucide-react';
import { thresholdApi, strategyApi, stationApi } from '@/src/http/api';
import type { OptionLong, SatThresholdVO, SatThresholdVersionVO, SatSnowStrategyVO } from '@/src/http/types';

type TabKey = 'threshold' | 'strategy';

const TAB_LIST: { key: TabKey; label: string }[] = [
  { key: 'threshold', label: '阈值配置' },
  { key: 'strategy', label: '融雪策略' },
];

const SYNC_STATUS_MAP: Record<number, { label: string; color: string }> = {
  0: { label: '待同步', color: 'bg-amber-500/10 text-amber-400 border border-amber-500/20' },
  1: { label: '已同步', color: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' },
  2: { label: '同步失败', color: 'bg-rose-500/10 text-rose-400 border border-rose-500/20' },
};

const RUN_MODE_MAP: Record<number, string> = { 1: '自动', 2: '禁止自动', 3: '仅手动' };

export default function StrategyConfig() {
  const [activeTab, setActiveTab] = useState<TabKey>('threshold');
  const [stationOptions, setStationOptions] = useState<OptionLong[]>([]);
  const [stationId, setStationId] = useState<number | undefined>(undefined);

  // 阈值
  const [threshold, setThreshold] = useState<SatThresholdVO | null>(null);
  const [thresholdConfig, setThresholdConfig] = useState('');
  const [versions, setVersions] = useState<SatThresholdVersionVO[]>([]);

  // 策略
  const [strategy, setStrategy] = useState<SatSnowStrategyVO | null>(null);
  const [strategyConfig, setStrategyConfig] = useState('');
  const [runMode, setRunMode] = useState(1);
  const [strategyName, setStrategyName] = useState('');

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    stationApi.getOptions().then((opts) => {
      setStationOptions(opts);
      if (opts.length > 0) setStationId(opts[0].value);
    });
  }, []);

  const loadThreshold = useCallback(async () => {
    if (!stationId) return;
    try {
      const [th, vers] = await Promise.all([
        thresholdApi.get(stationId).catch(() => null),
        thresholdApi.getVersions(stationId).catch(() => []),
      ]);
      setThreshold(th);
      setThresholdConfig(th?.config ? JSON.stringify(th.config, null, 2) : '{}');
      setVersions(vers || []);
    } catch (err) {
      console.error('加载阈值失败', err);
    }
  }, [stationId]);

  const loadStrategy = useCallback(async () => {
    if (!stationId) return;
    try {
      const st = await strategyApi.get(stationId).catch(() => null);
      setStrategy(st);
      setStrategyConfig(st?.config ? JSON.stringify(st.config, null, 2) : '{}');
      setRunMode(st?.runMode ?? 1);
      setStrategyName(st?.name ?? '');
    } catch (err) {
      console.error('加载策略失败', err);
    }
  }, [stationId]);

  useEffect(() => {
    if (stationId) {
      loadThreshold();
      loadStrategy();
    }
  }, [stationId, loadThreshold, loadStrategy]);

  const handleSaveThreshold = async () => {
    if (!stationId) return;
    let config;
    try {
      config = JSON.parse(thresholdConfig);
    } catch {
      alert('阈值配置 JSON 格式错误');
      return;
    }
    setSaving(true);
    try {
      await thresholdApi.update({ stationId, config });
      loadThreshold();
      alert('阈值配置已保存并下发');
    } catch (err) {
      console.error('保存阈值失败', err);
      alert('保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveStrategy = async () => {
    if (!stationId) return;
    let config;
    try {
      config = JSON.parse(strategyConfig);
    } catch {
      alert('策略配置 JSON 格式错误');
      return;
    }
    setSaving(true);
    try {
      await strategyApi.update({ stationId, name: strategyName, config, runMode });
      loadStrategy();
      alert('融雪策略已保存并下发');
    } catch (err) {
      console.error('保存策略失败', err);
      alert('保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handleRollback = async (versionId: number) => {
    if (!stationId) return;
    if (!confirm('确定回滚到该版本吗？')) return;
    try {
      await thresholdApi.rollback(stationId, versionId);
      loadThreshold();
      alert('已回滚');
    } catch (err) {
      console.error('回滚失败', err);
      alert('回滚失败');
    }
  };

  const inputClass =
    'bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-[clamp(14px,1.05vw,20px)] text-slate-200 focus:outline-none focus:border-sky-500/50';

  return (
    <div className="pt-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-[clamp(18px,1.3vw,26px)] font-medium text-slate-100 flex items-center gap-2">
          <Settings className="w-5 h-5 text-sky-500" />
          阈值/策略配置
        </h2>
      </div>

      {/* 台站选择 */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 mb-4 flex items-center gap-3">
        <Radio className="w-4 h-4 text-sky-500" />
        <label className="text-[clamp(14px,1.05vw,20px)] text-slate-400">选择台站</label>
        <select
          value={stationId ?? ''}
          onChange={(e) => setStationId(e.target.value ? Number(e.target.value) : undefined)}
          className={`${inputClass} min-w-[200px]`}
        >
          {stationOptions.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>

      {/* Tab 切换 */}
      <div className="flex gap-2 mb-6 border-b border-slate-800">
        {TAB_LIST.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 text-[clamp(14px,1.05vw,20px)] transition-colors border-b-2 -mb-[1px] ${
              activeTab === tab.key
                ? 'text-sky-400 border-sky-500'
                : 'text-slate-500 border-transparent hover:text-slate-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ========== 阈值配置 ========== */}
      {activeTab === 'threshold' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[clamp(16px,1.2vw,24px)] font-medium text-slate-200">阈值配置 (JSON)</h3>
                {threshold && (
                  <div className="flex items-center gap-3 text-[clamp(14px,1.05vw,20px)]">
                    <span className="text-slate-500">版本: v{threshold.version}</span>
                    <span className={`inline-flex px-2 py-0.5 rounded ${SYNC_STATUS_MAP[threshold.syncStatus ?? 0]?.color || ''}`}>
                      {SYNC_STATUS_MAP[threshold.syncStatus ?? 0]?.label || '--'}
                    </span>
                  </div>
                )}
              </div>
              <textarea
                value={thresholdConfig}
                onChange={(e) => setThresholdConfig(e.target.value)}
                rows={18}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-[clamp(14px,1.05vw,20px)] text-emerald-300 font-mono focus:outline-none focus:border-sky-500/50"
                placeholder='{"signalMin": 70, "tempMax": 60}'
              />
              <div className="flex gap-2 mt-4">
                <button
                  onClick={handleSaveThreshold}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white text-[clamp(14px,1.05vw,20px)]"
                >
                  <Save className="w-4 h-4" />保存并下发
                </button>
              </div>
            </div>
          </div>

          {/* 版本历史 */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5">
            <h3 className="text-[clamp(16px,1.2vw,24px)] font-medium text-slate-200 mb-3 flex items-center gap-2">
              <History className="w-4 h-4 text-sky-500" />版本历史
            </h3>
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {versions.map((v) => (
                <div key={v.id} className="bg-slate-950 border border-slate-800 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[clamp(14px,1.05vw,20px)] text-sky-400 font-medium">v{v.version}</span>
                    <button
                      onClick={() => handleRollback(v.id)}
                      className="text-amber-400 hover:text-amber-300 text-[clamp(14px,1.05vw,20px)] flex items-center gap-1"
                    >
                      <RotateCcw className="w-3 h-3" />回滚
                    </button>
                  </div>
                  <p className="text-[clamp(14px,1.05vw,20px)] text-slate-500">{v.createTime || '--'}</p>
                </div>
              ))}
              {versions.length === 0 && (
                <p className="text-center text-slate-500 py-6 text-[clamp(14px,1.05vw,20px)]">暂无版本历史</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========== 融雪策略 ========== */}
      {activeTab === 'strategy' && (
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[clamp(16px,1.2vw,24px)] font-medium text-slate-200">融雪策略配置</h3>
            {strategy && (
              <div className="flex items-center gap-3 text-[clamp(14px,1.05vw,20px)]">
                <span className="text-slate-500">版本: v{strategy.version}</span>
                <span className={`inline-flex px-2 py-0.5 rounded ${SYNC_STATUS_MAP[strategy.syncStatus ?? 0]?.color || ''}`}>
                  {SYNC_STATUS_MAP[strategy.syncStatus ?? 0]?.label || '--'}
                </span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-[clamp(14px,1.05vw,20px)] text-slate-500 mb-1">策略名称</label>
              <input value={strategyName} onChange={(e) => setStrategyName(e.target.value)} className={`${inputClass} w-full`} placeholder="策略名称" />
            </div>
            <div>
              <label className="block text-[clamp(14px,1.05vw,20px)] text-slate-500 mb-1">运行模式</label>
              <select value={runMode} onChange={(e) => setRunMode(Number(e.target.value))} className={`${inputClass} w-full`}>
                {Object.entries(RUN_MODE_MAP).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
          </div>

          <label className="block text-[clamp(14px,1.05vw,20px)] text-slate-500 mb-1">策略配置 (JSON)</label>
          <textarea
            value={strategyConfig}
            onChange={(e) => setStrategyConfig(e.target.value)}
            rows={14}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-[clamp(14px,1.05vw,20px)] text-emerald-300 font-mono focus:outline-none focus:border-sky-500/50"
            placeholder='{"tempThreshold": 2, "maxDuration": 120}'
          />
          <div className="flex gap-2 mt-4">
            <button
              onClick={handleSaveStrategy}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white text-[clamp(14px,1.05vw,20px)]"
            >
              <Save className="w-4 h-4" />保存并下发
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
