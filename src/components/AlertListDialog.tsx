import { useState, useEffect, useCallback } from 'react';
import {
  X,
  Image,
  CheckCircle,
  Clock,
  AlertCircle,
  Wrench,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import { alarmApi } from '@/src/http/api';
import type { SatAlarmRecordVO } from '@/src/http/types';

export interface AlertItem {
  id: string;
  title: string;
  message: string;
  time: string;
  imageUrl: string;
  status: 'pending' | 'resolved';
}

// 告警状态：0待确认 1已确认 2处置中 3已闭环 4超时督办
const STATUS_TABS = [
  { value: 0, label: '待确认', activeColor: 'text-red-400', barColor: 'bg-red-400', badgeColor: 'bg-red-500/20 text-red-400' },
  { value: 1, label: '已确认', activeColor: 'text-amber-400', barColor: 'bg-amber-400', badgeColor: 'bg-amber-500/20 text-amber-400' },
  { value: 2, label: '处置中', activeColor: 'text-sky-400', barColor: 'bg-sky-400', badgeColor: 'bg-sky-500/20 text-sky-400' },
  { value: 3, label: '已闭环', activeColor: 'text-emerald-400', barColor: 'bg-emerald-400', badgeColor: 'bg-emerald-500/20 text-emerald-400' },
  { value: 4, label: '超时督办', activeColor: 'text-orange-400', barColor: 'bg-orange-400', badgeColor: 'bg-orange-500/20 text-orange-400' },
] as const;

const STATUS_LABELS: Record<number, string> = {
  0: '待确认',
  1: '已确认',
  2: '处置中',
  3: '已闭环',
  4: '超时督办',
};

const PAGE_SIZE = 8;

interface AlertListDialogProps {
  open: boolean;
  onClose: () => void;
  onViewImage?: (alert: AlertItem) => void;
  onActionComplete?: () => void;
}

// 根据告警状态返回可用操作
function getActionsForStatus(status: number): Array<{ action: 'confirm' | 'handle' | 'close'; label: string; icon: typeof CheckCircle; color: string }> {
  const confirmAction = { action: 'confirm' as const, label: '确认', icon: CheckCircle, color: 'text-amber-400 hover:bg-amber-500/10 border-amber-500/30' };
  const handleAction = { action: 'handle' as const, label: '处置', icon: Wrench, color: 'text-sky-400 hover:bg-sky-500/10 border-sky-500/30' };
  const closeAction = { action: 'close' as const, label: '闭环', icon: ShieldCheck, color: 'text-emerald-400 hover:bg-emerald-500/10 border-emerald-500/30' };

  switch (status) {
    case 0: return [confirmAction, handleAction, closeAction]; // 待确认
    case 1: return [handleAction, closeAction];                 // 已确认
    case 2: return [closeAction];                                // 处置中
    case 3: return [];                                           // 已闭环
    case 4: return [confirmAction, handleAction, closeAction]; // 超时督办
    default: return [confirmAction, handleAction, closeAction];
  }
}

function formatTime(timeStr?: string) {
  if (!timeStr) return '--';
  const d = new Date(timeStr);
  if (isNaN(d.getTime())) return '--';
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export default function AlertListDialog({ open, onClose, onViewImage, onActionComplete }: AlertListDialogProps) {
  const [activeTab, setActiveTab] = useState<number>(0);
  const [pageNum, setPageNum] = useState(1);
  const [records, setRecords] = useState<SatAlarmRecordVO[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const fetchData = useCallback(async (tab: number, page: number) => {
    setLoading(true);
    try {
      const res = await alarmApi.getRecordsPage({
        pageNum: page,
        pageSize: PAGE_SIZE,
        status: tab,
      });
      setRecords(res?.list ?? []);
      setTotal(res?.total ?? 0);
    } catch {
      setRecords([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      fetchData(activeTab, pageNum);
    }
  }, [open, activeTab, pageNum, fetchData]);

  const handleTabChange = (tab: number) => {
    setActiveTab(tab);
    setPageNum(1);
  };

  const handleAction = async (id: number, action: 'confirm' | 'handle' | 'close') => {
    setActionLoading(id);
    try {
      if (action === 'confirm') await alarmApi.confirm(id);
      else if (action === 'handle') await alarmApi.handle(id);
      else if (action === 'close') await alarmApi.close(id);
      await fetchData(activeTab, pageNum);
      onActionComplete?.();
    } catch (err) {
      console.error(`alarm ${action} failed`, err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleViewImage = (record: SatAlarmRecordVO) => {
    const alertItem: AlertItem = {
      id: `alarm-${record.id}`,
      title: record.title || record.alarmType || '系统告警',
      message: record.content || record.remark || '',
      time: record.triggerTime || '',
      imageUrl: '',
      status: record.status === 0 ? 'pending' : 'resolved',
    };
    onViewImage?.(alertItem);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* 遮罩 */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* 弹窗卡片 */}
      <div className="relative z-10 w-full max-w-4xl max-h-[85vh] flex flex-col bg-slate-900/95 border border-slate-700 rounded-xl shadow-2xl overflow-hidden">
        {/* 头部 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/60">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-red-400" />
            <h2 className="text-xl font-bold text-slate-100">告警记录</h2>
            <span className="text-sm px-2.5 py-0.5 rounded-full bg-slate-700 text-slate-300">
              共 {total} 条
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 5 个状态 Tab */}
        <div className="flex border-b border-slate-700/60">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => handleTabChange(tab.value)}
              className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-3 text-sm font-medium transition-colors relative ${
                activeTab === tab.value
                  ? tab.activeColor
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.value === 0 && <Clock className="w-4 h-4" />}
              {tab.value === 1 && <CheckCircle className="w-4 h-4" />}
              {tab.value === 2 && <Wrench className="w-4 h-4" />}
              {tab.value === 3 && <ShieldCheck className="w-4 h-4" />}
              {tab.value === 4 && <AlertCircle className="w-4 h-4" />}
              <span className="hidden sm:inline">{tab.label}</span>
              {activeTab === tab.value && (
                <div className={`absolute bottom-0 left-0 right-0 h-0.5 ${tab.barColor} rounded-t-full`} />
              )}
            </button>
          ))}
        </div>

        {/* 列表 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 text-sky-400 animate-spin" />
            </div>
          ) : records.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-500">
              <CheckCircle className="w-12 h-12 mb-4 text-slate-600" />
              <p className="text-base">暂无{STATUS_LABELS[activeTab]}告警</p>
            </div>
          ) : (
            records.map((record) => {
              const actions = getActionsForStatus(record.status);
              const tab = STATUS_TABS.find((t) => t.value === record.status);
              return (
                <div
                  key={record.id}
                  className="flex items-start gap-4 p-4 rounded-lg bg-slate-800/60 border border-slate-700/40 hover:border-slate-600 transition-colors"
                >
                  {/* 状态指示 */}
                  <div className="mt-1 shrink-0">
                    {record.status === 3 ? (
                      <CheckCircle className="w-5 h-5 text-emerald-500" />
                    ) : record.status === 4 ? (
                      <AlertCircle className="w-5 h-5 text-orange-500 animate-pulse" />
                    ) : (
                      <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                    )}
                  </div>

                  {/* 内容 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-base font-semibold text-slate-200 truncate">
                        {record.title || record.alarmType || '系统告警'}
                      </span>
                      <span className={`shrink-0 text-xs px-2 py-0.5 rounded border ${tab?.badgeColor ?? 'border-slate-600 text-slate-400'}`}>
                        {STATUS_LABELS[record.status] ?? '未知'}
                      </span>
                      {record.alarmLevel != null && (
                        <span className={`shrink-0 text-xs px-1.5 py-0.5 rounded ${
                          record.alarmLevel >= 3 ? 'bg-red-500/15 text-red-400' :
                          record.alarmLevel === 2 ? 'bg-amber-500/15 text-amber-400' :
                          'bg-sky-500/15 text-sky-400'
                        }`}>
                          L{record.alarmLevel}
                        </span>
                      )}
                    </div>
                    {record.content && (
                      <p className="text-sm text-slate-400 mb-2 line-clamp-2">{record.content}</p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-slate-500">
                      <span>{formatTime(record.triggerTime)}</span>
                      {record.stationName && <span>{record.stationName}</span>}
                      {record.remark && <span className="truncate">备注: {record.remark}</span>}
                    </div>
                  </div>

                  {/* 操作 */}
                  <div className="flex flex-col gap-1.5 shrink-0">
                    {onViewImage && (
                      <button
                        onClick={() => handleViewImage(record)}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-white/5 border border-white/10 hover:bg-white/10 text-xs text-slate-300 transition-colors"
                      >
                        <Image className="w-3.5 h-3.5" />
                        查看图片
                      </button>
                    )}
                    {actions.map(({ action, label, icon: Icon, color }) => (
                      <button
                        key={action}
                        onClick={() => handleAction(record.id, action)}
                        disabled={actionLoading === record.id}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${color}`}
                      >
                        {actionLoading === record.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Icon className="w-3.5 h-3.5" />
                        )}
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* 分页 */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-slate-700/60">
          <span className="text-sm text-slate-400">
            第 {pageNum} / {totalPages} 页，共 {total} 条
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPageNum((p) => Math.max(1, p - 1))}
              disabled={pageNum <= 1 || loading}
              className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-white/5 border border-white/10 hover:bg-white/10 text-sm text-slate-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
              上一页
            </button>
            <button
              onClick={() => setPageNum((p) => Math.min(totalPages, p + 1))}
              disabled={pageNum >= totalPages || loading}
              className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-white/5 border border-white/10 hover:bg-white/10 text-sm text-slate-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              下一页
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
