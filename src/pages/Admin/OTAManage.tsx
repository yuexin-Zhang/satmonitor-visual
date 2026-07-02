import { useEffect, useState, useCallback } from 'react';
import { Package, Plus, Cpu, Clock, Upload, Send } from 'lucide-react';
import { otaApi, stationApi } from '@/src/http/api';
import type { SatOtaVersion, SatOtaVersionForm, SatOtaTask, SatOtaTaskForm, OptionLong } from '@/src/http/types';

type TabKey = 'versions' | 'tasks';

const TAB_LIST: { key: TabKey; label: string }[] = [
  { key: 'versions', label: '固件版本' },
  { key: 'tasks', label: '升级任务' },
];

const TASK_STATUS_MAP: Record<number, { label: string; color: string }> = {
  0: { label: '待升级', color: 'bg-amber-500/10 text-amber-400 border border-amber-500/20' },
  1: { label: '升级中', color: 'bg-sky-500/10 text-sky-400 border border-sky-500/20' },
  2: { label: '成功', color: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' },
  3: { label: '失败', color: 'bg-rose-500/10 text-rose-400 border border-rose-500/20' },
};

export default function OTAManage() {
  const [activeTab, setActiveTab] = useState<TabKey>('versions');

  // 固件版本
  const [versions, setVersions] = useState<SatOtaVersion[]>([]);
  const [versionPage, setVersionPage] = useState(1);
  const [versionTotal, setVersionTotal] = useState(0);
  const [showAddVersion, setShowAddVersion] = useState(false);
  const [versionForm, setVersionForm] = useState<SatOtaVersionForm>({ versionNo: '', deviceModel: '', fileUrl: '', description: '' });

  // 升级任务
  const [tasks, setTasks] = useState<SatOtaTask[]>([]);
  const [taskPage, setTaskPage] = useState(1);
  const [taskTotal, setTaskTotal] = useState(0);
  const [showAddTask, setShowAddTask] = useState(false);
  const [taskForm, setTaskForm] = useState<SatOtaTaskForm>({ versionId: 0, stationIds: [], scheduleTime: '' });

  const [stationOptions, setStationOptions] = useState<OptionLong[]>([]);

  const loadVersions = useCallback(async () => {
    try {
      const res = await otaApi.getVersionsPage({ pageNum: versionPage, pageSize: 12 });
      setVersions(res.list || []);
      setVersionTotal(res.total || 0);
    } catch (err) {
      console.error('加载固件版本失败', err);
    }
  }, [versionPage]);

  const loadTasks = useCallback(async () => {
    try {
      const res = await otaApi.getTasksPage({ pageNum: taskPage, pageSize: 12 });
      setTasks(res.list || []);
      setTaskTotal(res.total || 0);
    } catch (err) {
      console.error('加载升级任务失败', err);
    }
  }, [taskPage]);

  useEffect(() => {
    stationApi.getOptions().then(setStationOptions).catch(() => {});
  }, []);

  useEffect(() => {
    if (activeTab === 'versions') loadVersions();
    else loadTasks();
  }, [activeTab, loadVersions, loadTasks]);

  const handleAddVersion = async () => {
    if (!versionForm.versionNo.trim()) return;
    try {
      await otaApi.createVersion(versionForm);
      setShowAddVersion(false);
      setVersionForm({ versionNo: '', deviceModel: '', fileUrl: '', description: '' });
      loadVersions();
    } catch (err) {
      console.error('新增版本失败', err);
      alert('新增失败');
    }
  };

  const handleAddTask = async () => {
    if (!taskForm.versionId || taskForm.stationIds.length === 0) return;
    try {
      await otaApi.createTask(taskForm);
      setShowAddTask(false);
      setTaskForm({ versionId: 0, stationIds: [], scheduleTime: '' });
      loadTasks();
    } catch (err) {
      console.error('创建任务失败', err);
      alert('创建失败');
    }
  };

  const inputClass =
    'w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-[clamp(14px,1.05vw,20px)] text-slate-200 focus:outline-none focus:border-sky-500/50';

  return (
    <div className="pt-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-[clamp(18px,1.3vw,26px)] font-medium text-slate-100 flex items-center gap-2">
          <Package className="w-5 h-5 text-sky-500" />
          OTA升级管理
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

      {/* ========== 固件版本 ========== */}
      {activeTab === 'versions' && (
        <div>
          <div className="flex justify-end mb-4">
            <button
              onClick={() => setShowAddVersion(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-[clamp(14px,1.05vw,20px)] text-white"
            >
              <Plus className="w-4 h-4" />上传固件版本
            </button>
          </div>

          {showAddVersion && (
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 mb-4">
              <h3 className="text-slate-300 font-medium mb-3">上传固件版本</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[clamp(14px,1.05vw,20px)] text-slate-500 mb-1">版本号 *</label>
                  <input value={versionForm.versionNo} onChange={(e) => setVersionForm({ ...versionForm, versionNo: e.target.value })} className={inputClass} placeholder="例如 v2.1.0" />
                </div>
                <div>
                  <label className="block text-[clamp(14px,1.05vw,20px)] text-slate-500 mb-1">适用设备型号</label>
                  <input value={versionForm.deviceModel} onChange={(e) => setVersionForm({ ...versionForm, deviceModel: e.target.value })} className={inputClass} placeholder="设备型号" />
                </div>
                <div>
                  <label className="block text-[clamp(14px,1.05vw,20px)] text-slate-500 mb-1">升级包地址</label>
                  <input value={versionForm.fileUrl} onChange={(e) => setVersionForm({ ...versionForm, fileUrl: e.target.value })} className={inputClass} placeholder="URL" />
                </div>
                <div>
                  <label className="block text-[clamp(14px,1.05vw,20px)] text-slate-500 mb-1">版本说明</label>
                  <input value={versionForm.description} onChange={(e) => setVersionForm({ ...versionForm, description: e.target.value })} className={inputClass} placeholder="更新说明" />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button onClick={handleAddVersion} className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[clamp(14px,1.05vw,20px)]">确认</button>
                <button onClick={() => setShowAddVersion(false)} className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[clamp(14px,1.05vw,20px)]">取消</button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {versions.map((item) => (
              <div key={item.id} className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 hover:border-sky-500/20">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-sky-500/10 flex items-center justify-center border border-sky-500/20">
                      <Cpu className="w-5 h-5 text-sky-500" />
                    </div>
                    <div>
                      <h3 className="text-[clamp(16px,1.2vw,24px)] font-medium text-slate-200">{item.versionNo}</h3>
                      <p className="text-[clamp(14px,1.05vw,20px)] text-slate-500">{item.deviceModel || '通用'}</p>
                    </div>
                  </div>
                </div>
                <p className="text-[clamp(14px,1.05vw,20px)] text-slate-400 mb-4 line-clamp-2">{item.description || '暂无说明'}</p>
                <div className="space-y-2 text-[clamp(14px,1.05vw,20px)] text-slate-500">
                  <div className="flex justify-between">
                    <span className="flex items-center gap-1"><Upload className="w-3 h-3" />包地址</span>
                    <span className="text-slate-300 truncate max-w-[150px]" title={item.fileUrl}>{item.fileUrl || '--'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />创建时间</span>
                    <span className="text-slate-300">{item.createTime || '--'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {versions.length === 0 && (
            <div className="text-center py-16 text-slate-500">
              <Upload className="w-10 h-10 mx-auto mb-3 opacity-50" />
              <p className="text-[clamp(14px,1.05vw,20px)]">暂无固件版本</p>
            </div>
          )}

          <div className="flex items-center justify-between mt-4 text-[clamp(14px,1.05vw,20px)] text-slate-500">
            <span>共 {versionTotal} 条</span>
            <div className="flex items-center gap-2">
              <button disabled={versionPage <= 1} onClick={() => setVersionPage((p) => p - 1)} className="px-3 py-1 rounded-lg bg-slate-800 disabled:opacity-40 hover:bg-slate-700 text-slate-300">上一页</button>
              <span>{versionPage} / {Math.max(1, Math.ceil(versionTotal / 12))}</span>
              <button disabled={versionPage >= Math.ceil(versionTotal / 12)} onClick={() => setVersionPage((p) => p + 1)} className="px-3 py-1 rounded-lg bg-slate-800 disabled:opacity-40 hover:bg-slate-700 text-slate-300">下一页</button>
            </div>
          </div>
        </div>
      )}

      {/* ========== 升级任务 ========== */}
      {activeTab === 'tasks' && (
        <div>
          <div className="flex justify-end mb-4">
            <button
              onClick={() => setShowAddTask(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-[clamp(14px,1.05vw,20px)] text-white"
            >
              <Plus className="w-4 h-4" />创建升级任务
            </button>
          </div>

          {showAddTask && (
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 mb-4">
              <h3 className="text-slate-300 font-medium mb-3">创建升级任务</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[clamp(14px,1.05vw,20px)] text-slate-500 mb-1">固件版本 *</label>
                  <select value={taskForm.versionId} onChange={(e) => setTaskForm({ ...taskForm, versionId: Number(e.target.value) })} className={inputClass}>
                    <option value={0}>请选择</option>
                    {versions.map((v) => (
                      <option key={v.id} value={v.id}>{v.versionNo}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[clamp(14px,1.05vw,20px)] text-slate-500 mb-1">计划时间</label>
                  <input type="datetime-local" value={taskForm.scheduleTime} onChange={(e) => setTaskForm({ ...taskForm, scheduleTime: e.target.value })} className={inputClass} />
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-[clamp(14px,1.05vw,20px)] text-slate-500 mb-1">目标台站 *</label>
                <div className="flex flex-wrap gap-2">
                  {stationOptions.map((s) => (
                    <label key={s.value} className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={taskForm.stationIds.includes(s.value)}
                        onChange={(e) => {
                          const ids = e.target.checked
                            ? [...taskForm.stationIds, s.value]
                            : taskForm.stationIds.filter((id) => id !== s.value);
                          setTaskForm({ ...taskForm, stationIds: ids });
                        }}
                        className="w-3.5 h-3.5 accent-sky-500 rounded"
                      />
                      <span className="text-[clamp(14px,1.05vw,20px)] text-slate-300">{s.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button onClick={handleAddTask} className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[clamp(14px,1.05vw,20px)]">确认</button>
                <button onClick={() => setShowAddTask(false)} className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[clamp(14px,1.05vw,20px)]">取消</button>
              </div>
            </div>
          )}

          <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden overflow-x-auto">
            <table className="w-full text-[clamp(14px,1.05vw,20px)]">
              <thead>
                <tr className="border-b border-slate-800 text-slate-500">
                  <th className="text-left px-5 py-3 font-medium">ID</th>
                  <th className="text-left px-5 py-3 font-medium">版本ID</th>
                  <th className="text-left px-5 py-3 font-medium">台站ID</th>
                  <th className="text-left px-5 py-3 font-medium">计划时间</th>
                  <th className="text-left px-5 py-3 font-medium">状态</th>
                  <th className="text-left px-5 py-3 font-medium">失败原因</th>
                  <th className="text-left px-5 py-3 font-medium">创建时间</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {tasks.map((task) => (
                  <tr key={task.id} className="hover:bg-slate-800/30">
                    <td className="px-5 py-3 text-slate-400">{task.id}</td>
                    <td className="px-5 py-3 text-slate-300">{task.versionId}</td>
                    <td className="px-5 py-3 text-slate-300">{task.stationId ?? '--'}</td>
                    <td className="px-5 py-3 text-slate-400 whitespace-nowrap">{task.scheduleTime || '立即'}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded ${TASK_STATUS_MAP[task.status]?.color || ''}`}>
                        {TASK_STATUS_MAP[task.status]?.label || '--'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-rose-400 max-w-xs truncate" title={task.failReason || ''}>{task.failReason || '--'}</td>
                    <td className="px-5 py-3 text-slate-400 whitespace-nowrap">{task.createTime || '--'}</td>
                  </tr>
                ))}
                {tasks.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-5 py-8 text-center text-slate-500">
                      <Send className="w-6 h-6 mx-auto mb-2 opacity-40" />
                      暂无升级任务
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between mt-4 text-[clamp(14px,1.05vw,20px)] text-slate-500">
            <span>共 {taskTotal} 条</span>
            <div className="flex items-center gap-2">
              <button disabled={taskPage <= 1} onClick={() => setTaskPage((p) => p - 1)} className="px-3 py-1 rounded-lg bg-slate-800 disabled:opacity-40 hover:bg-slate-700 text-slate-300">上一页</button>
              <span>{taskPage} / {Math.max(1, Math.ceil(taskTotal / 12))}</span>
              <button disabled={taskPage >= Math.ceil(taskTotal / 12)} onClick={() => setTaskPage((p) => p + 1)} className="px-3 py-1 rounded-lg bg-slate-800 disabled:opacity-40 hover:bg-slate-700 text-slate-300">下一页</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
