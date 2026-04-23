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
import { useMemo } from 'react';

interface RecordItem {
  id: string;
  date: string;
  time: string;
  code: string;
  title: string;
  subtitle: string;
  iconType:
    | 'heat'
    | 'heat-off'
    | 'heat-fault'
    | 'eye'
    | 'temp-low'
    | 'temp'
    | 'temp-fault'
    | 'rain-snow'
    | 'rain-snow-fault'
    | 'antenna'
    | 'antenna-fault'
    | 'power'
    | 'power-fault'
    | 'move'
    | 'move-fault'
    | 'signal'
    | 'signal-fault';
}

function RecordIcon({ type }: { type: RecordItem['iconType'] }) {
  const base = 'w-6 h-6';
  switch (type) {
    case 'heat':
      return <Flame className={`${base} text-orange-400`} strokeWidth={1.5} />;
    case 'heat-off':
      return <PowerOff className={`${base} text-slate-300`} strokeWidth={1.5} />;
    case 'heat-fault':
      return (
        <div className="relative w-7 h-7 flex items-center justify-center">
          <Flame className="w-5 h-5 text-orange-400" strokeWidth={1.5} />
          <AlertTriangle className="w-3 h-3 text-red-400 absolute -bottom-0.5 -right-0.5" strokeWidth={2.5} />
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
        <div className="relative w-7 h-7 flex items-center justify-center">
          <Thermometer className="w-5 h-5 text-cyan-300" strokeWidth={1.5} />
          <AlertTriangle className="w-3 h-3 text-red-400 absolute -bottom-0.5 -right-0.5" strokeWidth={2.5} />
        </div>
      );
    case 'rain-snow':
      return <CloudRain className={`${base} text-blue-300`} strokeWidth={1.5} />;
    case 'rain-snow-fault':
      return (
        <div className="relative w-7 h-7 flex items-center justify-center">
          <CloudRain className="w-5 h-5 text-blue-300" strokeWidth={1.5} />
          <AlertTriangle className="w-3 h-3 text-red-400 absolute -bottom-0.5 -right-0.5" strokeWidth={2.5} />
        </div>
      );
    case 'antenna':
      return <Antenna className={`${base} text-slate-200`} strokeWidth={1.5} />;
    case 'antenna-fault':
      return (
        <div className="relative w-7 h-7 flex items-center justify-center">
          <Antenna className="w-5 h-5 text-slate-200" strokeWidth={1.5} />
          <AlertTriangle className="w-3 h-3 text-red-400 absolute -bottom-0.5 -right-0.5" strokeWidth={2.5} />
        </div>
      );
    case 'power':
      return <Zap className={`${base} text-yellow-300`} strokeWidth={1.5} />;
    case 'power-fault':
      return (
        <div className="relative w-7 h-7 flex items-center justify-center">
          <Zap className="w-5 h-5 text-yellow-300" strokeWidth={1.5} />
          <AlertTriangle className="w-3 h-3 text-red-400 absolute -bottom-0.5 -right-0.5" strokeWidth={2.5} />
        </div>
      );
    case 'move':
      return <Move className={`${base} text-slate-200`} strokeWidth={1.5} />;
    case 'move-fault':
      return (
        <div className="relative w-7 h-7 flex items-center justify-center">
          <Move className="w-5 h-5 text-slate-200" strokeWidth={1.5} />
          <AlertTriangle className="w-3 h-3 text-red-400 absolute -bottom-0.5 -right-0.5" strokeWidth={2.5} />
        </div>
      );
    case 'signal':
      return <Signal className={`${base} text-green-300`} strokeWidth={1.5} />;
    case 'signal-fault':
      return (
        <div className="relative w-7 h-7 flex items-center justify-center">
          <Signal className="w-5 h-5 text-green-300" strokeWidth={1.5} />
          <AlertTriangle className="w-3 h-3 text-red-400 absolute -bottom-0.5 -right-0.5" strokeWidth={2.5} />
        </div>
      );
    default:
      return <Info className={`${base} text-slate-200`} strokeWidth={1.5} />;
  }
}

export default function OperationsRecord() {
  const records: RecordItem[] = [
    {
      id: '1',
      date: '今天',
      time: '09:59',
      code: 'ANT_H001',
      title: '天线页面01加热故障',
      subtitle: '请检查加热模块',
      iconType: 'heat-fault',
    },
    {
      id: '2',
      date: '今天',
      time: '09:42',
      code: 'HT_A002',
      title: '自动启动加热',
      subtitle: '',
      iconType: 'heat',
    },
    {
      id: '3',
      date: '今天',
      time: '09:30',
      code: 'AI_V003',
      title: 'AI视觉监测有雪',
      subtitle: '摄像头视野受阻',
      iconType: 'eye',
    },
    {
      id: '4',
      date: '今天',
      time: '09:15',
      code: 'TMP_L004',
      title: '空气温度低于2°',
      subtitle: '当前温度：1.5°C',
      iconType: 'temp-low',
    },
    {
      id: '5',
      date: '2026年4月5日',
      time: '21:16',
      code: 'RS_S005',
      title: '雨雪传感器有雨雪',
      subtitle: '检测到降水',
      iconType: 'rain-snow',
    },
    {
      id: '6',
      date: '2026年4月5日',
      time: '20:45',
      code: 'HT_M006',
      title: '手动关闭加热',
      subtitle: '',
      iconType: 'heat-off',
    },
    {
      id: '7',
      date: '2026年4月5日',
      time: '20:30',
      code: 'HT_M007',
      title: '手动启动加热',
      subtitle: '',
      iconType: 'heat',
    },
    {
      id: '8',
      date: '2026年4月4日',
      time: '18:20',
      code: 'PWR_F008',
      title: '电源信息故障',
      subtitle: '请检查供电系统',
      iconType: 'power-fault',
    },
    {
      id: '9',
      date: '2026年4月4日',
      time: '17:10',
      code: 'ANT_T009',
      title: '天线温度故障',
      subtitle: '温度传感器异常',
      iconType: 'antenna-fault',
    },
    {
      id: '10',
      date: '2026年4月4日',
      time: '16:55',
      code: 'AIR_T010',
      title: '空气温度故障',
      subtitle: '温度读数异常',
      iconType: 'temp-fault',
    },
    {
      id: '11',
      date: '2026年4月3日',
      time: '14:30',
      code: 'RS_F011',
      title: '雨雪传感器故障',
      subtitle: '传感器无响应',
      iconType: 'rain-snow-fault',
    },
    {
      id: '12',
      date: '2026年4月3日',
      time: '13:20',
      code: 'MOV_F012',
      title: '位移故障',
      subtitle: '请检查机械结构',
      iconType: 'move-fault',
    },
    {
      id: '13',
      date: '2026年4月3日',
      time: '12:00',
      code: 'SIG_F013',
      title: '信号强度故障',
      subtitle: '信号丢失或弱',
      iconType: 'signal-fault',
    },
  ];

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
      <div className="panel-header">
        <h2 className="panel-title">
          <Bell className="title-icon text-sky-500" />
          运维记录
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-3 custom-scroll">
        <div className="space-y-5">
          {grouped.map(([date, items]) => (
            <div key={date}>
              <div className="text-[clamp(12px,1.05vw,15px)] text-slate-300 font-medium mb-3">
                {date}
              </div>
              <div className="space-y-4">
                {items.map((record) => (
                  <div key={record.id} className="flex items-start gap-3">
                    {/* Icon */}
                    <div className="flex-shrink-0 w-7 h-7 flex items-center justify-center mt-0.5">
                      <RecordIcon type={record.iconType} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      {/* Time | Code */}
                      <div className="text-[clamp(11px,1.0vw,14px)] text-slate-300 font-mono mb-1">
                        {record.time} | {record.code}
                      </div>

                      {/* Title */}
                      <div className="text-[clamp(13px,1.1vw,16px)] text-slate-100 font-medium leading-snug mb-0.5">
                        {record.title}
                      </div>

                      {/* Subtitle */}
                      {record.subtitle && (
                        <div className="text-[clamp(11px,1.0vw,14px)] text-slate-400 leading-snug">
                          {record.subtitle}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
