import {
  Bell,
  Flame,
  PowerOff,
  Eye,
  ThermometerSnowflake,
  Thermometer,
  CloudRain,
  Antenna,
  Zap,
  Move,
  Signal,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { alarmApi, snowExecLogApi } from '@/src/http/api';
import type { SatAlarmRecordVO, SatSnowExecLogVO } from '@/src/http/types';

interface RecordItem {
  id: string;
  date: string;
  time: string;
  code: string;
  title: string;
  subtitle: string;
  iconType: string;
}

// 将后端告警记录转为运维记录格式
function alarmToRecord(r: SatAlarmRecordVO): RecordItem {
  // 根据 alarmType 推断图标
  const t = (r.alarmType || '').toLowerCase();
  let iconType = 'info';
  if (/signal|信号/.test(t)) iconType = r.status === 0 ? 'signal-fault' : 'signal';
  else if (/power|电源|电压|电流/.test(t)) iconType = r.status === 0 ? 'power-fault' : 'power';
  else if (/temp|温度/.test(t)) iconType = r.status === 0 ? 'temp-fault' : 'temp';
  else if (/rain|snow|雨雪/.test(t)) iconType = r.status === 0 ? 'rain-snow-fault' : 'rain-snow';
  else if (/move|位移|offset/.test(t)) iconType = r.status === 0 ? 'move-fault' : 'move';
  else if (/antenna|天线/.test(t)) iconType = r.status === 0 ? 'antenna-fault' : 'antenna';
  else if (/heat|加热/.test(t)) iconType = r.status === 0 ? 'heat-fault' : 'heat';

  const time = r.triggerTime || r.confirmTime || r.closeTime || '';
  return {
    id: `alarm-${r.id}`,
    date: formatDateLabel(time),
    time: time.slice(11, 16),
    code: r.alarmType || `ALM-${r.id}`,
    title: r.title || r.alarmType || '系统告警',
    subtitle: r.content || r.remark || '',
    iconType,
  };
}

// 将融雪执行日志转为运维记录格式
function snowLogToRecord(r: SatSnowExecLogVO): RecordItem {
  // 1=自动 2=手动 3=自测
  const isAuto = r.execType === 1;
  const isFailed = r.status === 2;
  let iconType = isAuto ? 'heat' : 'heat';
  if (isFailed) iconType = 'heat-fault';
  const time = r.startTime || r.createTime || '';
  return {
    id: `snow-${r.id}`,
    date: formatDateLabel(time),
    time: time.slice(11, 16),
    code: `SNOW-${String(r.id).padStart(4, '0')}`,
    title: `${isAuto ? '自动' : (r.execType === 3 ? '自测' : '手动')}启动加热`,
    subtitle: r.triggerReason || (isFailed ? '执行失败' : '执行成功'),
    iconType,
  };
}

// 把时间戳转为友好日期标签（今天/昨天/具体日期）
function formatDateLabel(timeStr: string): string {
  if (!timeStr) return '未知';
  const d = new Date(timeStr);
  if (isNaN(d.getTime())) return '未知';
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = Math.round((today.getTime() - target.getTime()) / 86400_000);
  if (diffDays === 0) return '今天';
  if (diffDays === 1) return '昨天';
  if (diffDays === -1) return '明天';
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

function RecordIcon({ type }: { type: RecordItem['iconType'] }) {
  const base = 'w-5 h-5';
  switch (type) {
    case 'heat':
      return <Flame className={`${base} text-orange-400`} strokeWidth={1.5} />;
    case 'heat-off':
      return <PowerOff className={`${base} text-slate-300`} strokeWidth={1.5} />;
    case 'heat-fault':
      return (
        <div className="relative w-6 h-6 flex items-center justify-center">
          <Flame className="w-4 h-4 text-orange-400" strokeWidth={1.5} />
          <AlertTriangle className="w-2.5 h-2.5 text-red-400 absolute -bottom-0.5 -right-0.5" strokeWidth={2.5} />
        </div>
      );
    case 'eye':
      return <Eye className={`${base} text-sky-300`} strokeWidth={1.5} />;
    case 'temp-low':
      return <ThermometerSnowflake className={`${base} text-cyan-300`} strokeWidth={1.5} />;
    case 'temp':
      return <Thermometer className={`${base} text-cyan-300`} strokeWidth={1.5} />;
    case 'temp-fault':
      return (
        <div className="relative w-6 h-6 flex items-center justify-center">
          <Thermometer className="w-4 h-4 text-cyan-300" strokeWidth={1.5} />
          <AlertTriangle className="w-2.5 h-2.5 text-red-400 absolute -bottom-0.5 -right-0.5" strokeWidth={2.5} />
        </div>
      );
    case 'rain-snow':
      return <CloudRain className={`${base} text-blue-300`} strokeWidth={1.5} />;
    case 'rain-snow-fault':
      return (
        <div className="relative w-6 h-6 flex items-center justify-center">
          <CloudRain className="w-4 h-4 text-blue-300" strokeWidth={1.5} />
          <AlertTriangle className="w-2.5 h-2.5 text-red-400 absolute -bottom-0.5 -right-0.5" strokeWidth={2.5} />
        </div>
      );
    case 'antenna':
      return <Antenna className={`${base} text-slate-200`} strokeWidth={1.5} />;
    case 'antenna-fault':
      return (
        <div className="relative w-6 h-6 flex items-center justify-center">
          <Antenna className="w-4 h-4 text-slate-200" strokeWidth={1.5} />
          <AlertTriangle className="w-2.5 h-2.5 text-red-400 absolute -bottom-0.5 -right-0.5" strokeWidth={2.5} />
        </div>
      );
    case 'power':
      return <Zap className={`${base} text-yellow-300`} strokeWidth={1.5} />;
    case 'power-fault':
      return (
        <div className="relative w-6 h-6 flex items-center justify-center">
          <Zap className="w-4 h-4 text-yellow-300" strokeWidth={1.5} />
          <AlertTriangle className="w-2.5 h-2.5 text-red-400 absolute -bottom-0.5 -right-0.5" strokeWidth={2.5} />
        </div>
      );
    case 'move':
      return <Move className={`${base} text-slate-200`} strokeWidth={1.5} />;
    case 'move-fault':
      return (
        <div className="relative w-6 h-6 flex items-center justify-center">
          <Move className="w-4 h-4 text-slate-200" strokeWidth={1.5} />
          <AlertTriangle className="w-2.5 h-2.5 text-red-400 absolute -bottom-0.5 -right-0.5" strokeWidth={2.5} />
        </div>
      );
    case 'signal':
      return <Signal className={`${base} text-green-300`} strokeWidth={1.5} />;
    case 'signal-fault':
      return (
        <div className="relative w-6 h-6 flex items-center justify-center">
          <Signal className="w-4 h-4 text-green-300" strokeWidth={1.5} />
          <AlertTriangle className="w-2.5 h-2.5 text-red-400 absolute -bottom-0.5 -right-0.5" strokeWidth={2.5} />
        </div>
      );
    default:
      return <Info className={`${base} text-slate-200`} strokeWidth={1.5} />;
  }
}

export default function OperationsRecord() {
  const [loadTime] = useState(() => new Date());
  const [apiRecords, setApiRecords] = useState<RecordItem[]>([]);
  const [refreshTime, setRefreshTime] = useState<Date | null>(null);

  // 拉取最近 30 天告警 + 融雪执行日志，合并按时间倒序
  useEffect(() => {
    const end = new Date();
    const start = new Date(end.getTime() - 30 * 86400_000);
    const startTime = start.toISOString().slice(0, 10) + ' 00:00:00';
    const endTime = end.toISOString().slice(0, 10) + ' 23:59:59';
    Promise.all([
      alarmApi.getRecordsPage({ pageNum: 1, pageSize: 30, startTime, endTime }).catch(() => ({ list: [] as SatAlarmRecordVO[], total: 0 })),
      snowExecLogApi.getPage({ pageNum: 1, pageSize: 30 }).catch(() => ({ list: [] as SatSnowExecLogVO[], total: 0 })),
    ])
      .then(([alarmRes, snowRes]) => {
        const alarmRecs = (alarmRes?.list || []).map(alarmToRecord);
        const snowRecs = (snowRes?.list || []).map(snowLogToRecord);
        const merged = [...alarmRecs, ...snowRecs].sort((a, b) => {
          // 按 date+time 倒序
          return (b.date + b.time).localeCompare(a.date + a.time);
        });
        setApiRecords(merged);
        setRefreshTime(new Date());
      })
      .catch(() => setRefreshTime(new Date()));
  }, []);

  // 运维记录只来自真实接口；接口无数据时展示空状态
  const records = apiRecords;
  const isEmpty = apiRecords.length === 0;

  const grouped = useMemo(() => {
    const map = new Map<string, RecordItem[]>();
    for (const r of records) {
      if (!map.has(r.date)) map.set(r.date, []);
      map.get(r.date)!.push(r);
    }
    return Array.from(map.entries());
  }, [records]);

  return (
    <div className="glass-card h-full flex flex-col">
      <div className="panel-header justify-between">
        <h2 className="panel-title">
          <Bell className="title-icon text-sky-500" />
          运维记录
        </h2>
        <span className="text-[clamp(10px,0.8vw,12px)] text-slate-600 font-mono">{refreshTime ? `${String(refreshTime.getHours()).padStart(2,'0')}:${String(refreshTime.getMinutes()).padStart(2,'0')}:${String(refreshTime.getSeconds()).padStart(2,'0')}` : `${String(loadTime.getHours()).padStart(2,'0')}:${String(loadTime.getMinutes()).padStart(2,'0')}:${String(loadTime.getSeconds()).padStart(2,'0')}`}</span>
      </div>

      <div className="flex-1 overflow-y-auto p-2 custom-scroll">
        <div className="space-y-2">
          {isEmpty ? (
            <div className="flex flex-col items-center justify-center py-10 text-slate-500">
              <Info className="w-8 h-8 mb-2 text-slate-600" />
              <p className="text-[clamp(12px,1vw,15px)]">暂无运维记录</p>
            </div>
          ) : (
            grouped.map(([date, items]) => (
            <div key={date}>
              <div className="text-[clamp(12px,1.0vw,16px)] text-slate-300 font-medium mb-1">
                {date}
              </div>
              <div className="space-y-2">
                {items.map((record) => (
                  <div key={record.id} className="flex items-start gap-3">
                    {/* Icon */}
                    <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center">
                      <RecordIcon type={record.iconType} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      {/* Time | Code */}
                      <div className="text-[clamp(11px,0.9vw,14px)] text-slate-300 font-mono">
                        {record.time} | {record.code}
                      </div>

                      {/* Title */}
                      <div className="text-[clamp(12px,1.0vw,16px)] text-slate-100 font-medium leading-snug">
                        {record.title}
                      </div>

                      {/* Subtitle */}
                      {record.subtitle && (
                        <div className="text-[clamp(11px,0.9vw,14px)] text-slate-400 leading-snug">
                          {record.subtitle}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
          )}
        </div>
      </div>
    </div>
  );
}
