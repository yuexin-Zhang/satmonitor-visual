import { useEffect, useState, useCallback } from 'react';
import { Save, RotateCcw, Settings, Plus, Trash2, Edit2, X, Check } from 'lucide-react';
import { fetchDashboardConfig, saveDashboardConfig } from '@/src/api/dashboard-config';
import type { DashboardConfig, OperationRecordConfig } from '@/src/api/dashboard-config';

const defaultConfig: DashboardConfig = {
  siteName: '',
  antenna: {
    satellite: '',
    azimuth: '',
    elevation: '',
    frequency: { name: '', value: 0, polarization: '', symbolRate: 0 },
    signalHistory: { data: [], labels: [], max: 0 },
    signalAlert: { status: 'normal', count: 0 },
    displacement: { horizontal: '', vertical: '', status: '' },
    offsetAlert: { count: 0 },
  },
  sunInterference: { status: '', todayAlert: false, nextPeriod: '', yearlyCount: 0 },
  liveVideo: { streamUrl: '', streamName: '', enabled: false },
  maintenanceTips: { enabled: false, isAlerting: false, message: '', alertMessage: '' },
  environment: {
    weather: [],
    rainSnowSensor: { status: '', text: '' },
    humidityAvg: 0,
    yearlyStats: { snowForecastDays: 0, snowDetectedCount: 0, meltTests: 0, meltExecutions: 0 },
  },
  power: { voltage: '', current: '', yearlyConsumption: 0, powerHistory: { data: [], labels: [], max: 0 } },
  operations: [],
  position: { horizontal: '', vertical: '', status: '', signalAlertCount: 0, offsetAlertCount: 0 },
  alertThresholds: { signalMin: 0, tempMax: 0, displacementMax: 0 },
  heatingPolicy: 'auto',
  notificationEnabled: false,
};

export default function DataConfig() {
  const [config, setConfig] = useState<DashboardConfig>(defaultConfig);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [jsonErrors, setJsonErrors] = useState<Record<string, string>>({});

  // JSON textarea 的独立文本状态（避免输入时回弹）
  const [signalHistoryText, setSignalHistoryText] = useState('');
  const [powerHistoryText, setPowerHistoryText] = useState('');

  // 运维记录编辑状态
  const [editingOpId, setEditingOpId] = useState<string | null>(null);
  const [editOpForm, setEditOpForm] = useState<Partial<OperationRecordConfig>>({});
  const [showAddOp, setShowAddOp] = useState(false);
  const [newOp, setNewOp] = useState<OperationRecordConfig>({
    id: '',
    date: '',
    time: '',
    code: '',
    title: '',
    subtitle: '',
    iconType: 'tool',
  });

  useEffect(() => {
    fetchDashboardConfig()
      .then((data) => {
        const cfg = { ...defaultConfig, ...data };
        setConfig(cfg);
        setSignalHistoryText(JSON.stringify(cfg.antenna.signalHistory, null, 2));
        setPowerHistoryText(JSON.stringify(cfg.power.powerHistory, null, 2));
      })
      .catch(() => {});
  }, []);

  const handleSave = async () => {
    setLoading(true);
    try {
      let finalConfig = { ...config };

      try {
        finalConfig.antenna = {
          ...finalConfig.antenna,
          signalHistory: JSON.parse(signalHistoryText),
        };
      } catch {
        setJsonErrors((prev) => ({ ...prev, signalHistory: 'JSON 格式错误，无法保存' }));
        setLoading(false);
        return;
      }

      try {
        finalConfig.power = {
          ...finalConfig.power,
          powerHistory: JSON.parse(powerHistoryText),
        };
      } catch {
        setJsonErrors((prev) => ({ ...prev, powerHistory: 'JSON 格式错误，无法保存' }));
        setLoading(false);
        return;
      }

      await saveDashboardConfig(finalConfig);
      setConfig(finalConfig);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error('保存失败', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    fetchDashboardConfig()
      .then((data) => {
        const cfg = { ...defaultConfig, ...data };
        setConfig(cfg);
        setSignalHistoryText(JSON.stringify(cfg.antenna.signalHistory, null, 2));
        setPowerHistoryText(JSON.stringify(cfg.power.powerHistory, null, 2));
        setJsonErrors({});
      })
      .catch(() => {});
  };

  const updateConfig = useCallback((updates: Partial<DashboardConfig>) => {
    setConfig((prev) => ({ ...prev, ...updates }));
  }, []);

  const inputClass =
    'w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-[clamp(14px,1.05vw,20px)] text-slate-200 focus:outline-none focus:border-sky-500/50';
  const labelClass = 'block text-[clamp(14px,1.05vw,20px)] text-slate-500 mb-1.5';
  const cardClass = 'bg-slate-900/50 border border-slate-800 rounded-xl p-5 scroll-mt-24';
  const sectionTitleClass = 'text-[clamp(18px,1.4vw,28px)] font-medium text-slate-200 mb-4';

  // 运维记录操作
  const handleAddOp = () => {
    if (!newOp.date.trim() || !newOp.title.trim()) return;
    const op: OperationRecordConfig = {
      ...newOp,
      id: Date.now().toString(),
    };
    setConfig((prev) => ({ ...prev, operations: [...prev.operations, op] }));
    setShowAddOp(false);
    setNewOp({ id: '', date: '', time: '', code: '', title: '', subtitle: '', iconType: 'tool' });
  };

  const handleDeleteOp = (id: string) => {
    if (!confirm('确定删除该运维记录吗？')) return;
    setConfig((prev) => ({ ...prev, operations: prev.operations.filter((o) => o.id !== id) }));
  };

  const handleEditOp = (op: OperationRecordConfig) => {
    setEditingOpId(op.id);
    setEditOpForm({ ...op });
  };

  const handleSaveEditOp = () => {
    if (!editingOpId) return;
    setConfig((prev) => ({
      ...prev,
      operations: prev.operations.map((o) =>
        o.id === editingOpId ? ({ ...o, ...editOpForm } as OperationRecordConfig) : o
      ),
    }));
    setEditingOpId(null);
  };

  return (
    <div className="max-w-4xl pb-20 pt-6">
      {/* 顶部栏 - sticky */}
      <div className="sticky top-0 z-20 bg-slate-950/95 backdrop-blur-md py-4 mb-6 -mx-6 px-6 border-b border-slate-800/50">
        <div className="flex items-center justify-between">
          <h2 className={`${sectionTitleClass} mb-0 flex items-center gap-2`}>
            <Settings className="w-5 h-5 text-sky-500" />
            数据配置
          </h2>
          <div className="flex items-center gap-3">
            {saved && (
              <span className="text-[clamp(14px,1.05vw,20px)] text-emerald-400">保存成功</span>
            )}
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-[clamp(14px,1.05vw,20px)] text-slate-300 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              重置
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 disabled:bg-sky-800 text-[clamp(14px,1.05vw,20px)] text-white transition-colors"
            >
              <Save className="w-4 h-4" />
              {loading ? '保存中...' : '保存'}
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* 站点信息 */}
        <section id="site-info" className={cardClass}>
          <h3 className={sectionTitleClass}>站点信息</h3>
          <div>
            <label className={labelClass}>站点名称</label>
            <input
              type="text"
              value={config.siteName}
              onChange={(e) => updateConfig({ siteName: e.target.value })}
              className={inputClass}
            />
          </div>
        </section>

        {/* 天线信息 */}
        <section id="antenna" className={cardClass}>
          <h3 className={sectionTitleClass}>天线信息</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className={labelClass}>卫星</label>
                <input
                  type="text"
                  value={config.antenna.satellite}
                  onChange={(e) =>
                    updateConfig({
                      antenna: { ...config.antenna, satellite: e.target.value },
                    })
                  }
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>方位角</label>
                <input
                  type="text"
                  value={config.antenna.azimuth}
                  onChange={(e) =>
                    updateConfig({
                      antenna: { ...config.antenna, azimuth: e.target.value },
                    })
                  }
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>仰角</label>
                <input
                  type="text"
                  value={config.antenna.elevation}
                  onChange={(e) =>
                    updateConfig({
                      antenna: { ...config.antenna, elevation: e.target.value },
                    })
                  }
                  className={inputClass}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className={labelClass}>频率名称</label>
                <input
                  type="text"
                  value={config.antenna.frequency.name}
                  onChange={(e) =>
                    updateConfig({
                      antenna: {
                        ...config.antenna,
                        frequency: { ...config.antenna.frequency, name: e.target.value },
                      },
                    })
                  }
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>频率数值 (MHz)</label>
                <input
                  type="number"
                  value={config.antenna.frequency.value}
                  onChange={(e) =>
                    updateConfig({
                      antenna: {
                        ...config.antenna,
                        frequency: { ...config.antenna.frequency, value: Number(e.target.value) },
                      },
                    })
                  }
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>极化方式</label>
                <input
                  type="text"
                  value={config.antenna.frequency.polarization}
                  onChange={(e) =>
                    updateConfig({
                      antenna: {
                        ...config.antenna,
                        frequency: { ...config.antenna.frequency, polarization: e.target.value },
                      },
                    })
                  }
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>符号率 (Msps)</label>
                <input
                  type="number"
                  value={config.antenna.frequency.symbolRate}
                  onChange={(e) =>
                    updateConfig({
                      antenna: {
                        ...config.antenna,
                        frequency: { ...config.antenna.frequency, symbolRate: Number(e.target.value) },
                      },
                    })
                  }
                  className={inputClass}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>位移水平</label>
                <input
                  type="text"
                  value={config.antenna.displacement.horizontal}
                  onChange={(e) =>
                    updateConfig({
                      antenna: {
                        ...config.antenna,
                        displacement: { ...config.antenna.displacement, horizontal: e.target.value },
                      },
                    })
                  }
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>位移垂直</label>
                <input
                  type="text"
                  value={config.antenna.displacement.vertical}
                  onChange={(e) =>
                    updateConfig({
                      antenna: {
                        ...config.antenna,
                        displacement: { ...config.antenna.displacement, vertical: e.target.value },
                      },
                    })
                  }
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label className={labelClass}>信号强度历史数据 (JSON)</label>
              <textarea
                rows={4}
                value={signalHistoryText}
                onChange={(e) => {
                  setSignalHistoryText(e.target.value);
                  try {
                    JSON.parse(e.target.value);
                    setJsonErrors((prev) => {
                      const next = { ...prev };
                      delete next.signalHistory;
                      return next;
                    });
                  } catch {
                    setJsonErrors((prev) => ({ ...prev, signalHistory: 'JSON 格式错误' }));
                  }
                }}
                className={`${inputClass} font-mono text-sm resize-y ${jsonErrors.signalHistory ? 'border-rose-500' : ''}`}
              />
              {jsonErrors.signalHistory && (
                <p className="text-rose-400 text-sm mt-1">{jsonErrors.signalHistory}</p>
              )}
              <p className="text-slate-600 text-sm mt-1">
                格式: {'{ data: number[], labels: string[], max: number }'}
              </p>
            </div>
          </div>
        </section>

        {/* 日凌信息 */}
        <section id="sun-interference" className={cardClass}>
          <h3 className={sectionTitleClass}>日凌信息</h3>
          <div className="space-y-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={config.sunInterference.todayAlert}
                onChange={(e) =>
                  updateConfig({
                    sunInterference: { ...config.sunInterference, todayAlert: e.target.checked },
                  })
                }
                className="w-4 h-4 accent-sky-500 rounded"
              />
              <span className="text-[clamp(14px,1.05vw,20px)] text-slate-300">今日是否有预警</span>
            </label>
            <div>
              <label className={labelClass}>最近预警时间段</label>
              <input
                type="text"
                value={config.sunInterference.nextPeriod}
                onChange={(e) =>
                  updateConfig({
                    sunInterference: { ...config.sunInterference, nextPeriod: e.target.value },
                  })
                }
                className={inputClass}
                placeholder="例如: 04/15 06:30 - 04/15 08:00"
              />
            </div>
            <div>
              <label className={labelClass}>年度累计次数</label>
              <input
                type="number"
                value={config.sunInterference.yearlyCount}
                onChange={(e) =>
                  updateConfig({
                    sunInterference: {
                      ...config.sunInterference,
                      yearlyCount: Number(e.target.value),
                    },
                  })
                }
                className={inputClass}
              />
            </div>
          </div>
        </section>

        {/* 实时监控 */}
        <section id="live-video" className={cardClass}>
          <h3 className={sectionTitleClass}>实时监控</h3>
          <div className="space-y-4">
            <div>
              <label className={labelClass}>视频流 URL</label>
              <input
                type="text"
                value={config.liveVideo.streamUrl}
                onChange={(e) =>
                  updateConfig({
                    liveVideo: { ...config.liveVideo, streamUrl: e.target.value },
                  })
                }
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>流名称</label>
              <input
                type="text"
                value={config.liveVideo.streamName}
                onChange={(e) =>
                  updateConfig({
                    liveVideo: { ...config.liveVideo, streamName: e.target.value },
                  })
                }
                className={inputClass}
              />
            </div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={config.liveVideo.enabled}
                onChange={(e) =>
                  updateConfig({
                    liveVideo: { ...config.liveVideo, enabled: e.target.checked },
                  })
                }
                className="w-4 h-4 accent-sky-500 rounded"
              />
              <span className="text-[clamp(14px,1.05vw,20px)] text-slate-300">是否启用监控</span>
            </label>
          </div>
        </section>

        {/* 运检提示 */}
        <section id="maintenance-tips" className={cardClass}>
          <h3 className={sectionTitleClass}>智能运检提示</h3>
          <div className="space-y-4">
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.maintenanceTips.enabled}
                  onChange={(e) =>
                    updateConfig({
                      maintenanceTips: { ...config.maintenanceTips, enabled: e.target.checked },
                    })
                  }
                  className="w-4 h-4 accent-sky-500 rounded"
                />
                <span className="text-[clamp(14px,1.05vw,20px)] text-slate-300">是否展示</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.maintenanceTips.isAlerting}
                  onChange={(e) =>
                    updateConfig({
                      maintenanceTips: { ...config.maintenanceTips, isAlerting: e.target.checked },
                    })
                  }
                  className="w-4 h-4 accent-sky-500 rounded"
                />
                <span className="text-[clamp(14px,1.05vw,20px)] text-slate-300">是否告警</span>
              </label>
            </div>
            <div>
              <label className={labelClass}>正常提示文字</label>
              <textarea
                rows={2}
                value={config.maintenanceTips.message}
                onChange={(e) =>
                  updateConfig({
                    maintenanceTips: { ...config.maintenanceTips, message: e.target.value },
                  })
                }
                className={`${inputClass} resize-y`}
              />
            </div>
            <div>
              <label className={labelClass}>告警提示文字</label>
              <textarea
                rows={2}
                value={config.maintenanceTips.alertMessage}
                onChange={(e) =>
                  updateConfig({
                    maintenanceTips: { ...config.maintenanceTips, alertMessage: e.target.value },
                  })
                }
                className={`${inputClass} resize-y`}
              />
            </div>
          </div>
        </section>

        {/* 气象融雪 */}
        <section id="environment" className={cardClass}>
          <h3 className={sectionTitleClass}>气象融雪</h3>
          <div className="space-y-4">
            <div>
              <label className={labelClass}>三天天气预报</label>
              <div className="space-y-2">
                {[0, 1, 2].map((idx) => {
                  const day = config.environment.weather[idx] || {
                    day: '',
                    condition: '',
                    temp: 0,
                    humidity: 0,
                    icon: '',
                  };
                  return (
                    <div key={idx} className="grid grid-cols-5 gap-3">
                      <input
                        type="text"
                        placeholder="日期"
                        value={day.day}
                        onChange={(e) => {
                          const weather = [...config.environment.weather];
                          weather[idx] = { ...day, day: e.target.value };
                          updateConfig({ environment: { ...config.environment, weather } });
                        }}
                        className={inputClass}
                      />
                      <input
                        type="text"
                        placeholder="天气条件"
                        value={day.condition}
                        onChange={(e) => {
                          const weather = [...config.environment.weather];
                          weather[idx] = { ...day, condition: e.target.value };
                          updateConfig({ environment: { ...config.environment, weather } });
                        }}
                        className={inputClass}
                      />
                      <input
                        type="number"
                        placeholder="温度"
                        value={day.temp}
                        onChange={(e) => {
                          const weather = [...config.environment.weather];
                          weather[idx] = { ...day, temp: Number(e.target.value) };
                          updateConfig({ environment: { ...config.environment, weather } });
                        }}
                        className={inputClass}
                      />
                      <input
                        type="number"
                        placeholder="湿度 (%)"
                        value={day.humidity}
                        onChange={(e) => {
                          const weather = [...config.environment.weather];
                          weather[idx] = { ...day, humidity: Number(e.target.value) };
                          updateConfig({ environment: { ...config.environment, weather } });
                        }}
                        className={inputClass}
                      />
                      <input
                        type="text"
                        placeholder="图标"
                        value={day.icon}
                        onChange={(e) => {
                          const weather = [...config.environment.weather];
                          weather[idx] = { ...day, icon: e.target.value };
                          updateConfig({ environment: { ...config.environment, weather } });
                        }}
                        className={inputClass}
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <label className={labelClass}>雨雪传感器状态文字</label>
              <input
                type="text"
                value={config.environment.rainSnowSensor.text}
                onChange={(e) =>
                  updateConfig({
                    environment: {
                      ...config.environment,
                      rainSnowSensor: { ...config.environment.rainSnowSensor, text: e.target.value },
                    },
                  })
                }
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>湿度平均值 (%)</label>
              <input
                type="number"
                value={config.environment.humidityAvg}
                onChange={(e) =>
                  updateConfig({
                    environment: { ...config.environment, humidityAvg: Number(e.target.value) },
                  })
                }
                className={inputClass}
              />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className={labelClass}>年度预报降雪天数</label>
                <input
                  type="number"
                  value={config.environment.yearlyStats.snowForecastDays}
                  onChange={(e) =>
                    updateConfig({
                      environment: {
                        ...config.environment,
                        yearlyStats: {
                          ...config.environment.yearlyStats,
                          snowForecastDays: Number(e.target.value),
                        },
                      },
                    })
                  }
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>年度探测降雪次数</label>
                <input
                  type="number"
                  value={config.environment.yearlyStats.snowDetectedCount}
                  onChange={(e) =>
                    updateConfig({
                      environment: {
                        ...config.environment,
                        yearlyStats: {
                          ...config.environment.yearlyStats,
                          snowDetectedCount: Number(e.target.value),
                        },
                      },
                    })
                  }
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>融雪试验次数</label>
                <input
                  type="number"
                  value={config.environment.yearlyStats.meltTests}
                  onChange={(e) =>
                    updateConfig({
                      environment: {
                        ...config.environment,
                        yearlyStats: {
                          ...config.environment.yearlyStats,
                          meltTests: Number(e.target.value),
                        },
                      },
                    })
                  }
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>融雪执行次数</label>
                <input
                  type="number"
                  value={config.environment.yearlyStats.meltExecutions}
                  onChange={(e) =>
                    updateConfig({
                      environment: {
                        ...config.environment,
                        yearlyStats: {
                          ...config.environment.yearlyStats,
                          meltExecutions: Number(e.target.value),
                        },
                      },
                    })
                  }
                  className={inputClass}
                />
              </div>
            </div>
          </div>
        </section>

        {/* 电源信息 */}
        <section id="power" className={cardClass}>
          <h3 className={sectionTitleClass}>电源信息</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className={labelClass}>电压</label>
                <input
                  type="text"
                  value={config.power.voltage}
                  onChange={(e) =>
                    updateConfig({ power: { ...config.power, voltage: e.target.value } })
                  }
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>电流</label>
                <input
                  type="text"
                  value={config.power.current}
                  onChange={(e) =>
                    updateConfig({ power: { ...config.power, current: e.target.value } })
                  }
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>年度累计耗电 (kWh)</label>
                <input
                  type="number"
                  value={config.power.yearlyConsumption}
                  onChange={(e) =>
                    updateConfig({
                      power: { ...config.power, yearlyConsumption: Number(e.target.value) },
                    })
                  }
                  className={inputClass}
                />
              </div>
            </div>
            <div>
              <label className={labelClass}>功率历史数据 (JSON)</label>
              <textarea
                rows={4}
                value={powerHistoryText}
                onChange={(e) => {
                  setPowerHistoryText(e.target.value);
                  try {
                    JSON.parse(e.target.value);
                    setJsonErrors((prev) => {
                      const next = { ...prev };
                      delete next.powerHistory;
                      return next;
                    });
                  } catch {
                    setJsonErrors((prev) => ({ ...prev, powerHistory: 'JSON 格式错误' }));
                  }
                }}
                className={`${inputClass} font-mono text-sm resize-y ${jsonErrors.powerHistory ? 'border-rose-500' : ''}`}
              />
              {jsonErrors.powerHistory && (
                <p className="text-rose-400 text-sm mt-1">{jsonErrors.powerHistory}</p>
              )}
              <p className="text-slate-600 text-sm mt-1">
                格式: {'{ data: number[], labels: string[], max: number }'}
              </p>
            </div>
          </div>
        </section>

        {/* 运维记录 */}
        <section id="operations" className={cardClass}>
          <h3 className={`${sectionTitleClass} flex items-center justify-between`}>
            <span>运维记录</span>
            <button
              onClick={() => setShowAddOp(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-[clamp(14px,1.05vw,20px)] text-white transition-colors"
            >
              <Plus className="w-4 h-4" />
              新增
            </button>
          </h3>

          {showAddOp && (
            <div className="bg-slate-950/50 border border-slate-800 rounded-lg p-4 mb-4 space-y-3">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <input
                  type="text"
                  placeholder="日期"
                  value={newOp.date}
                  onChange={(e) => setNewOp({ ...newOp, date: e.target.value })}
                  className={inputClass}
                />
                <input
                  type="text"
                  placeholder="时间"
                  value={newOp.time}
                  onChange={(e) => setNewOp({ ...newOp, time: e.target.value })}
                  className={inputClass}
                />
                <input
                  type="text"
                  placeholder="编码"
                  value={newOp.code}
                  onChange={(e) => setNewOp({ ...newOp, code: e.target.value })}
                  className={inputClass}
                />
                <input
                  type="text"
                  placeholder="图标类型"
                  value={newOp.iconType}
                  onChange={(e) => setNewOp({ ...newOp, iconType: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="标题"
                  value={newOp.title}
                  onChange={(e) => setNewOp({ ...newOp, title: e.target.value })}
                  className={inputClass}
                />
                <input
                  type="text"
                  placeholder="副标题"
                  value={newOp.subtitle}
                  onChange={(e) => setNewOp({ ...newOp, subtitle: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleAddOp}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[clamp(14px,1.05vw,20px)] transition-colors"
                >
                  <Check className="w-4 h-4" />
                  确认
                </button>
                <button
                  onClick={() => setShowAddOp(false)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[clamp(14px,1.05vw,20px)] transition-colors"
                >
                  <X className="w-4 h-4" />
                  取消
                </button>
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-[clamp(14px,1.05vw,20px)]">
              <thead>
                <tr className="border-b border-slate-800 text-slate-500">
                  <th className="text-left px-3 py-2 font-medium">日期</th>
                  <th className="text-left px-3 py-2 font-medium">时间</th>
                  <th className="text-left px-3 py-2 font-medium">编码</th>
                  <th className="text-left px-3 py-2 font-medium">标题</th>
                  <th className="text-left px-3 py-2 font-medium">副标题</th>
                  <th className="text-left px-3 py-2 font-medium">图标</th>
                  <th className="text-right px-3 py-2 font-medium">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {config.operations.map((op) => (
                  <tr key={op.id} className="hover:bg-slate-800/30 transition-colors">
                    {editingOpId === op.id ? (
                      <>
                        <td className="px-3 py-2">
                          <input
                            type="text"
                            value={editOpForm.date || ''}
                            onChange={(e) => setEditOpForm({ ...editOpForm, date: e.target.value })}
                            className={`${inputClass} px-2 py-1`}
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="text"
                            value={editOpForm.time || ''}
                            onChange={(e) => setEditOpForm({ ...editOpForm, time: e.target.value })}
                            className={`${inputClass} px-2 py-1`}
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="text"
                            value={editOpForm.code || ''}
                            onChange={(e) => setEditOpForm({ ...editOpForm, code: e.target.value })}
                            className={`${inputClass} px-2 py-1`}
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="text"
                            value={editOpForm.title || ''}
                            onChange={(e) => setEditOpForm({ ...editOpForm, title: e.target.value })}
                            className={`${inputClass} px-2 py-1`}
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="text"
                            value={editOpForm.subtitle || ''}
                            onChange={(e) => setEditOpForm({ ...editOpForm, subtitle: e.target.value })}
                            className={`${inputClass} px-2 py-1`}
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="text"
                            value={editOpForm.iconType || ''}
                            onChange={(e) => setEditOpForm({ ...editOpForm, iconType: e.target.value })}
                            className={`${inputClass} px-2 py-1`}
                          />
                        </td>
                        <td className="px-3 py-2 text-right">
                          <button
                            onClick={handleSaveEditOp}
                            className="text-emerald-400 hover:text-emerald-300 mr-2"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setEditingOpId(null)}
                            className="text-slate-500 hover:text-slate-300"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-3 py-2 text-slate-300">{op.date}</td>
                        <td className="px-3 py-2 text-slate-300">{op.time}</td>
                        <td className="px-3 py-2 text-slate-400">{op.code}</td>
                        <td className="px-3 py-2 text-slate-300">{op.title}</td>
                        <td className="px-3 py-2 text-slate-400">{op.subtitle}</td>
                        <td className="px-3 py-2 text-slate-400">{op.iconType}</td>
                        <td className="px-3 py-2 text-right">
                          <button
                            onClick={() => handleEditOp(op)}
                            className="text-sky-400 hover:text-sky-300 mr-2"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteOp(op.id)}
                            className="text-rose-400 hover:text-rose-300"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
                {config.operations.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-3 py-6 text-center text-slate-500">
                      暂无运维记录
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
