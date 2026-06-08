import { useState, useEffect } from 'react';
import { Settings, Plus, Trash2, Edit2, Save, X, Check, AlertTriangle } from 'lucide-react';
import { httpGet } from '@/src/http/client';
import type { SensorThreshold, MeltStrategy, CaptureConfig } from '@/src/http/types';

type TabKey = 'sensor' | 'melt' | 'capture';

const TAB_LIST: { key: TabKey; label: string }[] = [
  { key: 'sensor', label: '传感器阈值' },
  { key: 'melt', label: '融雪策略' },
  { key: 'capture', label: '抓拍时长' },
];

const SENSOR_TYPE_MAP: Record<string, string> = {
  temperature: '温度',
  humidity: '湿度',
  displacement: '位移',
  signal: '信号强度',
  voltage: '电压',
  current: '电流',
};

export default function StrategyConfig() {
  const [activeTab, setActiveTab] = useState<TabKey>('sensor');

  // 传感器阈值
  const [sensorList, setSensorList] = useState<SensorThreshold[]>([]);
  const [sensorEditingId, setSensorEditingId] = useState<string | null>(null);
  const [sensorEditForm, setSensorEditForm] = useState<Partial<SensorThreshold>>({});
  const [showAddSensor, setShowAddSensor] = useState(false);
  const [newSensor, setNewSensor] = useState<SensorThreshold>({
    id: '',
    name: '',
    type: 'temperature',
    minValue: 0,
    maxValue: 100,
    alertLevel: 'warning',
    enabled: true,
  });

  // 融雪策略
  const [meltList, setMeltList] = useState<MeltStrategy[]>([]);
  const [meltEditingId, setMeltEditingId] = useState<string | null>(null);
  const [meltEditForm, setMeltEditForm] = useState<Partial<MeltStrategy>>({});
  const [showAddMelt, setShowAddMelt] = useState(false);
  const [newMelt, setNewMelt] = useState<MeltStrategy>({
    id: '',
    name: '',
    triggerType: 'auto',
    tempThreshold: 2,
    snowDetectEnabled: true,
    maxMeltDuration: 60,
    scheduleTime: '06:00',
    enabled: true,
  });

  // 抓拍配置
  const [captureList, setCaptureList] = useState<CaptureConfig[]>([]);
  const [captureEditingId, setCaptureEditingId] = useState<string | null>(null);
  const [captureEditForm, setCaptureEditForm] = useState<Partial<CaptureConfig>>({});
  const [showAddCapture, setShowAddCapture] = useState(false);
  const [newCapture, setNewCapture] = useState<CaptureConfig>({
    id: '',
    cameraName: '',
    captureDuration: 5,
    captureInterval: 30,
    storageDays: 30,
    enabled: true,
  });

  useEffect(() => {
    httpGet<SensorThreshold[]>('/admin/sensor-thresholds').then(setSensorList).catch(() => {});
    httpGet<MeltStrategy[]>('/admin/melt-strategies').then(setMeltList).catch(() => {});
    httpGet<CaptureConfig[]>('/admin/capture-configs').then(setCaptureList).catch(() => {});
  }, []);

  const inputClass =
    'w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-[clamp(14px,1.05vw,20px)] text-slate-200 focus:outline-none focus:border-sky-500/50';

  // ---------- 传感器阈值操作 ----------
  const handleSaveSensor = (id: string) => {
    setSensorList((prev) =>
      prev.map((s) => (s.id === id ? ({ ...s, ...sensorEditForm } as SensorThreshold) : s))
    );
    setSensorEditingId(null);
  };
  const handleDeleteSensor = (id: string) => {
    if (!confirm('确定删除该阈值配置吗？')) return;
    setSensorList((prev) => prev.filter((s) => s.id !== id));
  };
  const handleAddSensor = () => {
    if (!newSensor.name.trim()) return;
    setSensorList((prev) => [...prev, { ...newSensor, id: Date.now().toString() }]);
    setShowAddSensor(false);
    setNewSensor({ id: '', name: '', type: 'temperature', minValue: 0, maxValue: 100, alertLevel: 'warning', enabled: true });
  };

  // ---------- 融雪策略操作 ----------
  const handleSaveMelt = (id: string) => {
    setMeltList((prev) =>
      prev.map((s) => (s.id === id ? ({ ...s, ...meltEditForm } as MeltStrategy) : s))
    );
    setMeltEditingId(null);
  };
  const handleDeleteMelt = (id: string) => {
    if (!confirm('确定删除该融雪策略吗？')) return;
    setMeltList((prev) => prev.filter((s) => s.id !== id));
  };
  const handleAddMelt = () => {
    if (!newMelt.name.trim()) return;
    setMeltList((prev) => [...prev, { ...newMelt, id: Date.now().toString() }]);
    setShowAddMelt(false);
    setNewMelt({ id: '', name: '', triggerType: 'auto', tempThreshold: 2, snowDetectEnabled: true, maxMeltDuration: 60, scheduleTime: '06:00', enabled: true });
  };

  // ---------- 抓拍配置操作 ----------
  const handleSaveCapture = (id: string) => {
    setCaptureList((prev) =>
      prev.map((s) => (s.id === id ? ({ ...s, ...captureEditForm } as CaptureConfig) : s))
    );
    setCaptureEditingId(null);
  };
  const handleDeleteCapture = (id: string) => {
    if (!confirm('确定删除该抓拍配置吗？')) return;
    setCaptureList((prev) => prev.filter((s) => s.id !== id));
  };
  const handleAddCapture = () => {
    if (!newCapture.cameraName.trim()) return;
    setCaptureList((prev) => [...prev, { ...newCapture, id: Date.now().toString() }]);
    setShowAddCapture(false);
    setNewCapture({ id: '', cameraName: '', captureDuration: 5, captureInterval: 30, storageDays: 30, enabled: true });
  };

  return (
    <div className="pt-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-[clamp(18px,1.3vw,26px)] font-medium text-slate-100 flex items-center gap-2">
          <Settings className="w-5 h-5 text-sky-500" />
          策略配置
        </h2>
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

      {/* ========== 传感器阈值 ========== */}
      {activeTab === 'sensor' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => setShowAddSensor(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-[clamp(14px,1.05vw,20px)] text-white transition-colors"
            >
              <Plus className="w-4 h-4" />
              新增阈值
            </button>
          </div>

          {showAddSensor && (
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5">
              <h3 className="text-slate-300 font-medium mb-3">新增传感器阈值</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <input value={newSensor.name} onChange={(e) => setNewSensor({ ...newSensor, name: e.target.value })} className={inputClass} placeholder="传感器名称" />
                <select value={newSensor.type} onChange={(e) => setNewSensor({ ...newSensor, type: e.target.value })} className={inputClass}>
                  {Object.entries(SENSOR_TYPE_MAP).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
                <input type="number" value={newSensor.minValue} onChange={(e) => setNewSensor({ ...newSensor, minValue: Number(e.target.value) })} className={inputClass} placeholder="最小值" />
                <input type="number" value={newSensor.maxValue} onChange={(e) => setNewSensor({ ...newSensor, maxValue: Number(e.target.value) })} className={inputClass} placeholder="最大值" />
              </div>
              <div className="flex gap-2 mt-4">
                <button onClick={handleAddSensor} className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[clamp(14px,1.05vw,20px)]"><Check className="w-4 h-4 inline mr-1" />确认</button>
                <button onClick={() => setShowAddSensor(false)} className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[clamp(14px,1.05vw,20px)]"><X className="w-4 h-4 inline mr-1" />取消</button>
              </div>
            </div>
          )}

          <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
            <table className="w-full text-[clamp(14px,1.05vw,20px)]">
              <thead>
                <tr className="border-b border-slate-800 text-slate-500">
                  <th className="text-left px-5 py-3">名称</th>
                  <th className="text-left px-5 py-3">类型</th>
                  <th className="text-left px-5 py-3">最小值</th>
                  <th className="text-left px-5 py-3">最大值</th>
                  <th className="text-left px-5 py-3">告警级别</th>
                  <th className="text-left px-5 py-3">状态</th>
                  <th className="text-right px-5 py-3">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {sensorList.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-5 py-3">
                      {sensorEditingId === item.id ? (
                        <input value={sensorEditForm.name || ''} onChange={(e) => setSensorEditForm({ ...sensorEditForm, name: e.target.value })} className={inputClass} />
                      ) : (
                        <span className="text-slate-200">{item.name}</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-slate-400">{SENSOR_TYPE_MAP[item.type] || item.type}</td>
                    <td className="px-5 py-3">
                      {sensorEditingId === item.id ? (
                        <input type="number" value={sensorEditForm.minValue ?? item.minValue} onChange={(e) => setSensorEditForm({ ...sensorEditForm, minValue: Number(e.target.value) })} className={inputClass} />
                      ) : (
                        <span className="text-slate-300">{item.minValue}</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      {sensorEditingId === item.id ? (
                        <input type="number" value={sensorEditForm.maxValue ?? item.maxValue} onChange={(e) => setSensorEditForm({ ...sensorEditForm, maxValue: Number(e.target.value) })} className={inputClass} />
                      ) : (
                        <span className="text-slate-300">{item.maxValue}</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      {sensorEditingId === item.id ? (
                        <select value={sensorEditForm.alertLevel || item.alertLevel} onChange={(e) => setSensorEditForm({ ...sensorEditForm, alertLevel: e.target.value as 'warning' | 'danger' })} className={inputClass}>
                          <option value="warning">警告</option>
                          <option value="danger">危险</option>
                        </select>
                      ) : (
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded ${item.alertLevel === 'danger' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
                          <AlertTriangle className="w-3 h-3" />
                          {item.alertLevel === 'danger' ? '危险' : '警告'}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded ${item.enabled ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'}`}>
                        {item.enabled ? '启用' : '禁用'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      {sensorEditingId === item.id ? (
                        <button onClick={() => handleSaveSensor(item.id)} className="text-emerald-400 hover:text-emerald-300 mr-3"><Save className="w-4 h-4" /></button>
                      ) : (
                        <button onClick={() => { setSensorEditingId(item.id); setSensorEditForm({ ...item }); }} className="text-sky-400 hover:text-sky-300 mr-3"><Edit2 className="w-4 h-4" /></button>
                      )}
                      <button onClick={() => handleDeleteSensor(item.id)} className="text-rose-400 hover:text-rose-300"><Trash2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
                {sensorList.length === 0 && (
                  <tr><td colSpan={7} className="px-5 py-8 text-center text-slate-500">暂无传感器阈值配置</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========== 融雪策略 ========== */}
      {activeTab === 'melt' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => setShowAddMelt(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-[clamp(14px,1.05vw,20px)] text-white transition-colors">
              <Plus className="w-4 h-4" />新增策略
            </button>
          </div>

          {showAddMelt && (
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5">
              <h3 className="text-slate-300 font-medium mb-3">新增融雪策略</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input value={newMelt.name} onChange={(e) => setNewMelt({ ...newMelt, name: e.target.value })} className={inputClass} placeholder="策略名称" />
                <select value={newMelt.triggerType} onChange={(e) => setNewMelt({ ...newMelt, triggerType: e.target.value as 'auto' | 'manual' | 'schedule' })} className={inputClass}>
                  <option value="auto">自动</option>
                  <option value="manual">手动</option>
                  <option value="schedule">定时</option>
                </select>
                <input type="number" value={newMelt.tempThreshold} onChange={(e) => setNewMelt({ ...newMelt, tempThreshold: Number(e.target.value) })} className={inputClass} placeholder="温度阈值(°C)" />
                <input type="number" value={newMelt.maxMeltDuration} onChange={(e) => setNewMelt({ ...newMelt, maxMeltDuration: Number(e.target.value) })} className={inputClass} placeholder="最大时长(分钟)" />
                <input type="time" value={newMelt.scheduleTime} onChange={(e) => setNewMelt({ ...newMelt, scheduleTime: e.target.value })} className={inputClass} />
              </div>
              <div className="flex gap-2 mt-4">
                <button onClick={handleAddMelt} className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[clamp(14px,1.05vw,20px)]"><Check className="w-4 h-4 inline mr-1" />确认</button>
                <button onClick={() => setShowAddMelt(false)} className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[clamp(14px,1.05vw,20px)]"><X className="w-4 h-4 inline mr-1" />取消</button>
              </div>
            </div>
          )}

          <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
            <table className="w-full text-[clamp(14px,1.05vw,20px)]">
              <thead>
                <tr className="border-b border-slate-800 text-slate-500">
                  <th className="text-left px-5 py-3">策略名称</th>
                  <th className="text-left px-5 py-3">触发方式</th>
                  <th className="text-left px-5 py-3">温度阈值</th>
                  <th className="text-left px-5 py-3">最大时长</th>
                  <th className="text-left px-5 py-3">雪检</th>
                  <th className="text-left px-5 py-3">状态</th>
                  <th className="text-right px-5 py-3">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {meltList.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-5 py-3 text-slate-200">{item.name}</td>
                    <td className="px-5 py-3 text-slate-400">{item.triggerType === 'auto' ? '自动' : item.triggerType === 'manual' ? '手动' : '定时'}</td>
                    <td className="px-5 py-3 text-slate-300">{item.tempThreshold}°C</td>
                    <td className="px-5 py-3 text-slate-300">{item.maxMeltDuration}分钟</td>
                    <td className="px-5 py-3 text-slate-300">{item.snowDetectEnabled ? '启用' : '禁用'}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded ${item.enabled ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'}`}>
                        {item.enabled ? '启用' : '禁用'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button onClick={() => handleDeleteMelt(item.id)} className="text-rose-400 hover:text-rose-300"><Trash2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
                {meltList.length === 0 && (
                  <tr><td colSpan={7} className="px-5 py-8 text-center text-slate-500">暂无融雪策略</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========== 抓拍时长 ========== */}
      {activeTab === 'capture' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => setShowAddCapture(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-[clamp(14px,1.05vw,20px)] text-white transition-colors">
              <Plus className="w-4 h-4" />新增配置
            </button>
          </div>

          {showAddCapture && (
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5">
              <h3 className="text-slate-300 font-medium mb-3">新增抓拍配置</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <input value={newCapture.cameraName} onChange={(e) => setNewCapture({ ...newCapture, cameraName: e.target.value })} className={inputClass} placeholder="摄像头名称" />
                <input type="number" value={newCapture.captureDuration} onChange={(e) => setNewCapture({ ...newCapture, captureDuration: Number(e.target.value) })} className={inputClass} placeholder="抓拍时长(秒)" />
                <input type="number" value={newCapture.captureInterval} onChange={(e) => setNewCapture({ ...newCapture, captureInterval: Number(e.target.value) })} className={inputClass} placeholder="抓拍间隔(秒)" />
                <input type="number" value={newCapture.storageDays} onChange={(e) => setNewCapture({ ...newCapture, storageDays: Number(e.target.value) })} className={inputClass} placeholder="存储天数" />
              </div>
              <div className="flex gap-2 mt-4">
                <button onClick={handleAddCapture} className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[clamp(14px,1.05vw,20px)]"><Check className="w-4 h-4 inline mr-1" />确认</button>
                <button onClick={() => setShowAddCapture(false)} className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[clamp(14px,1.05vw,20px)]"><X className="w-4 h-4 inline mr-1" />取消</button>
              </div>
            </div>
          )}

          <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
            <table className="w-full text-[clamp(14px,1.05vw,20px)]">
              <thead>
                <tr className="border-b border-slate-800 text-slate-500">
                  <th className="text-left px-5 py-3">摄像头</th>
                  <th className="text-left px-5 py-3">抓拍时长</th>
                  <th className="text-left px-5 py-3">抓拍间隔</th>
                  <th className="text-left px-5 py-3">存储天数</th>
                  <th className="text-left px-5 py-3">状态</th>
                  <th className="text-right px-5 py-3">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {captureList.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-5 py-3 text-slate-200">{item.cameraName}</td>
                    <td className="px-5 py-3 text-slate-300">{item.captureDuration}秒</td>
                    <td className="px-5 py-3 text-slate-300">{item.captureInterval}秒</td>
                    <td className="px-5 py-3 text-slate-300">{item.storageDays}天</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded ${item.enabled ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'}`}>
                        {item.enabled ? '启用' : '禁用'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button onClick={() => handleDeleteCapture(item.id)} className="text-rose-400 hover:text-rose-300"><Trash2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
                {captureList.length === 0 && (
                  <tr><td colSpan={6} className="px-5 py-8 text-center text-slate-500">暂无抓拍配置</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
