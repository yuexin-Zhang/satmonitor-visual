import { useState, useMemo } from 'react';
import { X, Image, CheckCircle, Clock, AlertCircle } from 'lucide-react';

export interface AlertItem {
  id: string;
  title: string;
  message: string;
  time: string;
  imageUrl: string;
  status: 'pending' | 'resolved';
}

interface AlertListDialogProps {
  open: boolean;
  alerts: AlertItem[];
  onClose: () => void;
  onResolve: (id: string) => void;
  onViewImage: (alert: AlertItem) => void;
}

type TabType = 'pending' | 'resolved';

function formatTimeDisplay(timeStr: string) {
  const date = new Date(timeStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 7) return `${days}天前`;
  return timeStr.slice(0, 16).replace('T', ' ');
}

export default function AlertListDialog({ open, alerts, onClose, onResolve, onViewImage }: AlertListDialogProps) {
  const [activeTab, setActiveTab] = useState<TabType>('pending');

  const filteredAlerts = useMemo(() => {
    return alerts
      .filter((a) => a.status === activeTab)
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
  }, [alerts, activeTab]);

  const pendingCount = useMemo(() => alerts.filter((a) => a.status === 'pending').length, [alerts]);
  const resolvedCount = useMemo(() => alerts.filter((a) => a.status === 'resolved').length, [alerts]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* 遮罩 */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* 弹窗卡片 */}
      <div className="relative z-10 w-full max-w-3xl max-h-[85vh] flex flex-col bg-slate-900/95 border border-slate-700 rounded-xl shadow-2xl overflow-hidden">
        {/* 头部 */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-700/60">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-red-400" />
            <h2 className="text-xl font-bold text-slate-100">报警列表</h2>
            <span className="text-sm px-2.5 py-0.5 rounded-full bg-slate-700 text-slate-300">
              共 {alerts.length} 条
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab */}
        <div className="flex border-b border-slate-700/60">
          <button
            onClick={() => setActiveTab('pending')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-4 text-base font-medium transition-colors relative ${
              activeTab === 'pending'
                ? 'text-red-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock className="w-5 h-5" />
            待处理
            {pendingCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 text-sm min-w-[1.5rem] text-center">
                {pendingCount}
              </span>
            )}
            {activeTab === 'pending' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-400 rounded-t-full" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('resolved')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-4 text-base font-medium transition-colors relative ${
              activeTab === 'resolved'
                ? 'text-emerald-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <CheckCircle className="w-5 h-5" />
            已处理
            {resolvedCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-sm min-w-[1.5rem] text-center">
                {resolvedCount}
              </span>
            )}
            {activeTab === 'resolved' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-400 rounded-t-full" />
            )}
          </button>
        </div>

        {/* 列表 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
          {filteredAlerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-500">
              {activeTab === 'pending' ? (
                <>
                  <CheckCircle className="w-12 h-12 mb-4 text-emerald-500/40" />
                  <p className="text-base">暂无待处理报警</p>
                </>
              ) : (
                <>
                  <Clock className="w-12 h-12 mb-4 text-slate-600" />
                  <p className="text-base">暂无已处理报警</p>
                </>
              )}
            </div>
          ) : (
            filteredAlerts.map((alert) => (
              <div
                key={alert.id}
                className="flex items-start gap-4 p-4 rounded-lg bg-slate-800/60 border border-slate-700/40 hover:border-slate-600 transition-colors"
              >
                {/* 状态指示 */}
                <div className="mt-1">
                  {alert.status === 'pending' ? (
                    <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                  ) : (
                    <CheckCircle className="w-6 h-6 text-emerald-500" />
                  )}
                </div>

                {/* 内容 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-base font-semibold text-slate-200 truncate">
                      {alert.title}
                    </span>
                    <span
                      className={`shrink-0 text-xs px-2 py-0.5 rounded border ${
                        alert.status === 'pending'
                          ? 'border-red-500/30 text-red-400 bg-red-500/10'
                          : 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10'
                      }`}
                    >
                      {alert.status === 'pending' ? '待处理' : '已处理'}
                    </span>
                  </div>
                  <p className="text-sm text-slate-400 mb-2 line-clamp-2">{alert.message}</p>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-slate-500">{formatTimeDisplay(alert.time)}</span>
                    <span className="text-sm text-slate-600">{alert.time.slice(0, 16).replace('T', ' ')}</span>
                  </div>
                </div>

                {/* 操作 */}
                <div className="flex flex-col gap-2 shrink-0">
                  <button
                    onClick={() => onViewImage(alert)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-md bg-white/5 border border-white/10 hover:bg-white/10 text-sm text-slate-300 transition-colors"
                  >
                    <Image className="w-4 h-4" />
                    查看图片
                  </button>
                  {alert.status === 'pending' && (
                    <button
                      onClick={() => onResolve(alert.id)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-md bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 text-sm text-emerald-400 transition-colors"
                    >
                      <CheckCircle className="w-4 h-4" />
                      标记处理
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
