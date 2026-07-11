import { useEffect, useState, useCallback } from 'react';
import { Radio, Save, RotateCcw, Loader2 } from 'lucide-react';
import { antennaApi, stationApi } from '@/src/http/api';
import type { OptionLong, AntennaConfigForm } from '@/src/http/types';

const POLARIZATION_OPTIONS = ['垂直(V)', '水平(H)', '左旋(LHCP)', '右旋(RHCP)'];

const EMPTY_FORM: AntennaConfigForm = {
  stationId: 0,
  satellite: '',
  azimuth: '',
  elevation: '',
  frequency: { name: '', value: 0, polarization: '垂直(V)', symbolRate: 0 },
};

export default function AntennaConfig() {
  const [stationOptions, setStationOptions] = useState<OptionLong[]>([]);
  const [stationId, setStationId] = useState<number | undefined>(undefined);
  const [form, setForm] = useState<AntennaConfigForm>(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [normalizing, setNormalizing] = useState(false);
  // 位移信息（只读展示）
  const [displacement, setDisplacement] = useState<{
    horizontal: string;
    vertical: string;
    status: string;
    normalizedAt: string;
  } | null>(null);

  useEffect(() => {
    stationApi.getOptions().then((opts) => {
      setStationOptions(opts);
      if (opts.length > 0) setStationId(opts[0].value);
    });
  }, []);

  const loadConfig = useCallback(async () => {
    if (!stationId) return;
    setLoading(true);
    setDisplacement(null);
    try {
      const data = await antennaApi.getConfig(stationId);
      setForm({
        stationId: data.stationId,
        satellite: data.satellite ?? '',
        azimuth: data.azimuth ?? '',
        elevation: data.elevation ?? '',
        frequency: data.frequency ?? {
          name: '',
          value: 0,
          polarization: '垂直(V)',
          symbolRate: 0,
        },
      });
      if (data.displacement) {
        setDisplacement({
          horizontal: data.displacement.horizontal,
          vertical: data.displacement.vertical,
          status: data.displacement.status,
          normalizedAt: data.displacement.normalizedAt,
        });
      }
    } catch (err) {
      console.error('加载天线参数失败', err);
      setForm({ ...EMPTY_FORM, stationId });
    } finally {
      setLoading(false);
    }
  }, [stationId]);

  useEffect(() => {
    if (stationId) loadConfig();
  }, [stationId, loadConfig]);

  const handleSave = async () => {
    if (!stationId) return;
    if (!form.satellite.trim() || !form.azimuth.trim() || !form.elevation.trim()) {
      alert('卫星、方位角、仰角为必填项');
      return;
    }
    setSaving(true);
    try {
      await antennaApi.saveConfig({ ...form, stationId });
      alert('天线参数已保存');
      loadConfig();
    } catch (err) {
      console.error('保存天线参数失败', err);
      alert('保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handleNormalize = async () => {
    if (!stationId) return;
    if (!confirm('确认将当前 MCU 上报的姿态设为基准（归一化）？\n归一化后位移显示归零，并自动关闭该台站未完结的位移告警。')) return;
    setNormalizing(true);
    try {
      await antennaApi.normalize(stationId);
      alert('位移已归一化');
      loadConfig();
    } catch (err) {
      console.error('归一化失败', err);
      alert('归一化失败');
    } finally {
      setNormalizing(false);
    }
  };

  const inputClass =
    'bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-[clamp(14px,1.05vw,20px)] text-slate-200 focus:outline-none focus:border-sky-500/50';
  const labelClass = 'block text-[clamp(14px,1.05vw,20px)] text-slate-500 mb-1';

  return (
    <div className="pt-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-[clamp(18px,1.3vw,26px)] font-medium text-slate-100 flex items-center gap-2">
          <Radio className="w-5 h-5 text-sky-500" />
          天线参数管理
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

      {loading ? (
        <div className="flex items-center justify-center py-20 text-slate-500">
          <Loader2 className="w-6 h-6 animate-spin mr-2" /> 加载中...
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* 主表单 */}
          <div className="lg:col-span-2">
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 space-y-5">
              <h3 className="text-[clamp(16px,1.2vw,24px)] font-medium text-slate-200">卫星 / 方位角 / 仰角</h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className={labelClass}>卫星名称及轨道位置</label>
                  <input
                    value={form.satellite}
                    onChange={(e) => setForm({ ...form, satellite: e.target.value })}
                    className={`${inputClass} w-full`}
                    placeholder="如 中星6E 115.5°"
                  />
                </div>
                <div>
                  <label className={labelClass}>方位角</label>
                  <input
                    value={form.azimuth}
                    onChange={(e) => setForm({ ...form, azimuth: e.target.value })}
                    className={`${inputClass} w-full`}
                    placeholder="如 192°"
                  />
                </div>
                <div>
                  <label className={labelClass}>仰角</label>
                  <input
                    value={form.elevation}
                    onChange={(e) => setForm({ ...form, elevation: e.target.value })}
                    className={`${inputClass} w-full`}
                    placeholder="如 40°"
                  />
                </div>
              </div>

              <div className="border-t border-slate-800 pt-5">
                <h4 className="text-[clamp(15px,1.1vw,22px)] font-medium text-slate-300 mb-3">频率参数</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>播出节目</label>
                    <input
                      value={form.frequency?.name ?? ''}
                      onChange={(e) =>
                        setForm({ ...form, frequency: { ...form.frequency!, name: e.target.value } })
                      }
                      className={`${inputClass} w-full`}
                      placeholder="如 浙江一套"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>极化方式</label>
                    <select
                      value={form.frequency?.polarization ?? '垂直(V)'}
                      onChange={(e) =>
                        setForm({ ...form, frequency: { ...form.frequency!, polarization: e.target.value } })
                      }
                      className={`${inputClass} w-full`}
                    >
                      {POLARIZATION_OPTIONS.map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>频率值 (MHz)</label>
                    <input
                      type="number"
                      value={form.frequency?.value ?? 0}
                      onChange={(e) =>
                        setForm({ ...form, frequency: { ...form.frequency!, value: Number(e.target.value) } })
                      }
                      className={`${inputClass} w-full`}
                      placeholder="如 3825"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>符号率</label>
                    <input
                      type="number"
                      value={form.frequency?.symbolRate ?? 0}
                      onChange={(e) =>
                        setForm({ ...form, frequency: { ...form.frequency!, symbolRate: Number(e.target.value) } })
                      }
                      className={`${inputClass} w-full`}
                      placeholder="如 6780"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white text-[clamp(14px,1.05vw,20px)]"
                >
                  <Save className="w-4 h-4" />
                  {saving ? '保存中...' : '保存配置'}
                </button>
                <button
                  onClick={loadConfig}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[clamp(14px,1.05vw,20px)]"
                >
                  <RotateCcw className="w-4 h-4" />重新加载
                </button>
              </div>
            </div>
          </div>

          {/* 位移归一化 */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5">
            <h3 className="text-[clamp(16px,1.2vw,24px)] font-medium text-slate-200 mb-3 flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-amber-400" />位移归一化
            </h3>
            <p className="text-[clamp(13px,1vw,18px)] text-slate-500 leading-relaxed mb-4">
              将当前 MCU 上报的 yaw/pitch/roll 设为基准。之后展示与告警均按相对偏移计算，偏移绝对值 ≥ 1° 才告警。
            </p>

            {displacement ? (
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-[clamp(14px,1.05vw,20px)]">
                  <span className="text-slate-500">水平位移</span>
                  <span className="text-slate-200 font-mono">{displacement.horizontal}</span>
                </div>
                <div className="flex justify-between text-[clamp(14px,1.05vw,20px)]">
                  <span className="text-slate-500">垂直位移</span>
                  <span className="text-slate-200 font-mono">{displacement.vertical}</span>
                </div>
                <div className="flex justify-between text-[clamp(14px,1.05vw,20px)]">
                  <span className="text-slate-500">状态</span>
                  <span className="text-emerald-400">{displacement.status}</span>
                </div>
                <div className="flex justify-between text-[clamp(14px,1.05vw,20px)]">
                  <span className="text-slate-500">归一化时间</span>
                  <span className="text-slate-400">{displacement.normalizedAt || '--'}</span>
                </div>
              </div>
            ) : (
              <p className="text-center text-slate-600 py-4 text-[clamp(14px,1.05vw,20px)]">暂无位移数据</p>
            )}

            <button
              onClick={handleNormalize}
              disabled={normalizing}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-[clamp(14px,1.05vw,20px)]"
            >
              <RotateCcw className="w-4 h-4" />
              {normalizing ? '归一化中...' : '执行归一化'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
