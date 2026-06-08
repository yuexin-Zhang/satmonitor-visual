import { useState, useEffect } from 'react';
import { Package, Plus, Trash2, Upload, CheckCircle, XCircle, Clock, Cpu } from 'lucide-react';
import { httpGet } from '@/src/http/client';
import type { OTAModel } from '@/src/http/types';

const STATUS_MAP = {
  draft: { label: '草稿', color: 'bg-slate-500/10 text-slate-400 border border-slate-500/20' },
  published: { label: '已发布', color: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' },
  deprecated: { label: '已废弃', color: 'bg-rose-500/10 text-rose-400 border border-rose-500/20' },
};

export default function OTAManage() {
  const [list, setList] = useState<OTAModel[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newModel, setNewModel] = useState<Partial<OTAModel>>({
    name: '',
    version: '',
    description: '',
    fileSize: '',
    deviceType: '',
    status: 'draft',
  });

  useEffect(() => {
    httpGet<OTAModel[]>('/admin/ota-models').then(setList).catch(() => {});
  }, []);

  const handleAdd = () => {
    if (!newModel.name?.trim() || !newModel.version?.trim()) return;
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    const model: OTAModel = {
      id: Date.now().toString(),
      name: newModel.name,
      version: newModel.version,
      description: newModel.description || '',
      fileSize: newModel.fileSize || '--',
      deviceType: newModel.deviceType || '通用设备',
      status: newModel.status || 'draft',
      createdAt: now,
      updatedAt: now,
    };
    setList((prev) => [...prev, model]);
    setShowAdd(false);
    setNewModel({ name: '', version: '', description: '', fileSize: '', deviceType: '', status: 'draft' });
  };

  const handleDelete = (id: string) => {
    if (!confirm('确定删除该OTA模型吗？')) return;
    setList((prev) => prev.filter((m) => m.id !== id));
  };

  const toggleStatus = (id: string, target: 'published' | 'deprecated') => {
    setList((prev) =>
      prev.map((m) =>
        m.id === id
          ? { ...m, status: target, updatedAt: new Date().toISOString().slice(0, 19).replace('T', ' ') }
          : m
      )
    );
  };

  const inputClass =
    'w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-[clamp(14px,1.05vw,20px)] text-slate-200 focus:outline-none focus:border-sky-500/50';

  return (
    <div className="pt-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-[clamp(18px,1.3vw,26px)] font-medium text-slate-100 flex items-center gap-2">
          <Package className="w-5 h-5 text-sky-500" />
          OTA模型管理
        </h2>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-[clamp(14px,1.05vw,20px)] text-white transition-colors"
        >
          <Plus className="w-4 h-4" />
          新增模型
        </button>
      </div>

      {/* 新增表单 */}
      {showAdd && (
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 mb-4">
          <h3 className="text-slate-300 font-medium mb-3">新增OTA模型</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-[clamp(14px,1.05vw,20px)] text-slate-500 mb-1">模型名称</label>
              <input value={newModel.name} onChange={(e) => setNewModel({ ...newModel, name: e.target.value })} className={inputClass} placeholder="例如：融雪控制模型" />
            </div>
            <div>
              <label className="block text-[clamp(14px,1.05vw,20px)] text-slate-500 mb-1">版本号</label>
              <input value={newModel.version} onChange={(e) => setNewModel({ ...newModel, version: e.target.value })} className={inputClass} placeholder="例如：v2.1.0" />
            </div>
            <div>
              <label className="block text-[clamp(14px,1.05vw,20px)] text-slate-500 mb-1">适用设备</label>
              <input value={newModel.deviceType} onChange={(e) => setNewModel({ ...newModel, deviceType: e.target.value })} className={inputClass} placeholder="例如：主控单元" />
            </div>
            <div>
              <label className="block text-[clamp(14px,1.05vw,20px)] text-slate-500 mb-1">文件大小</label>
              <input value={newModel.fileSize} onChange={(e) => setNewModel({ ...newModel, fileSize: e.target.value })} className={inputClass} placeholder="例如：12.5MB" />
            </div>
            <div>
              <label className="block text-[clamp(14px,1.05vw,20px)] text-slate-500 mb-1">状态</label>
              <select value={newModel.status} onChange={(e) => setNewModel({ ...newModel, status: e.target.value as 'draft' | 'published' | 'deprecated' })} className={inputClass}>
                <option value="draft">草稿</option>
                <option value="published">已发布</option>
              </select>
            </div>
          </div>
          <div className="mt-3">
            <label className="block text-[clamp(14px,1.05vw,20px)] text-slate-500 mb-1">描述</label>
            <input value={newModel.description} onChange={(e) => setNewModel({ ...newModel, description: e.target.value })} className={inputClass} placeholder="模型描述信息" />
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={handleAdd} className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[clamp(14px,1.05vw,20px)]">确认</button>
            <button onClick={() => setShowAdd(false)} className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[clamp(14px,1.05vw,20px)]">取消</button>
          </div>
        </div>
      )}

      {/* 模型列表 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {list.map((item) => (
          <div key={item.id} className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 hover:border-sky-500/20 transition-colors">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-sky-500/10 flex items-center justify-center border border-sky-500/20">
                  <Cpu className="w-5 h-5 text-sky-500" />
                </div>
                <div>
                  <h3 className="text-[clamp(16px,1.2vw,24px)] font-medium text-slate-200">{item.name}</h3>
                  <p className="text-[clamp(14px,1.05vw,20px)] text-slate-500">{item.version}</p>
                </div>
              </div>
              <span className={`inline-flex px-2 py-0.5 rounded text-xs ${STATUS_MAP[item.status].color}`}>
                {STATUS_MAP[item.status].label}
              </span>
            </div>

            <p className="text-[clamp(14px,1.05vw,20px)] text-slate-400 mb-4 line-clamp-2">{item.description || '暂无描述'}</p>

            <div className="space-y-2 text-[clamp(14px,1.05vw,20px)] text-slate-500 mb-4">
              <div className="flex justify-between">
                <span>适用设备</span>
                <span className="text-slate-300">{item.deviceType}</span>
              </div>
              <div className="flex justify-between">
                <span>文件大小</span>
                <span className="text-slate-300">{item.fileSize}</span>
              </div>
              <div className="flex justify-between">
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" />创建时间</span>
                <span className="text-slate-300">{item.createdAt}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-3 border-t border-slate-800">
              {item.status === 'draft' && (
                <button
                  onClick={() => toggleStatus(item.id, 'published')}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 text-[clamp(14px,1.05vw,20px)] transition-colors"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  发布
                </button>
              )}
              {item.status === 'published' && (
                <button
                  onClick={() => toggleStatus(item.id, 'deprecated')}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 text-[clamp(14px,1.05vw,20px)] transition-colors"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  废弃
                </button>
              )}
              <button
                onClick={() => handleDelete(item.id)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 text-[clamp(14px,1.05vw,20px)] transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {list.length === 0 && (
        <div className="text-center py-16 text-slate-500">
          <Upload className="w-10 h-10 mx-auto mb-3 opacity-50" />
          <p className="text-[clamp(14px,1.05vw,20px)]">暂无OTA模型</p>
        </div>
      )}
    </div>
  );
}
