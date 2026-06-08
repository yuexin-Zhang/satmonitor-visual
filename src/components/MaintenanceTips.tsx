import { useEffect, useRef, useState, useCallback } from 'react';
import { Bell, AlertTriangle, Volume2, VolumeX, List, Image } from 'lucide-react';
import { MOCK_DASHBOARD_CONFIG } from '@/src/http/mock';
import type { DashboardConfig } from '@/src/http/types';
import AlertListDialog, { type AlertItem } from './AlertListDialog';
import AlertImageDialog from './AlertImageDialog';

interface MaintenanceTipsProps {
  isAlerting?: boolean;
}

/* ---------- 报警图片占位图 ---------- */
const ALERT_IMAGES = [
  `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800"><rect fill="#0f172a" width="1200" height="800"/><rect x="80" y="120" width="1040" height="560" rx="20" fill="#1e293b" stroke="#334155" stroke-width="4"/><text x="600" y="400" dominant-baseline="middle" text-anchor="middle" fill="#94a3b8" font-size="56" font-family="sans-serif" font-weight="bold">电源系统示意图</text></svg>')}`,
  `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800"><rect fill="#0f172a" width="1200" height="800"/><rect x="80" y="120" width="1040" height="560" rx="20" fill="#1e293b" stroke="#334155" stroke-width="4"/><text x="600" y="400" dominant-baseline="middle" text-anchor="middle" fill="#94a3b8" font-size="56" font-family="sans-serif" font-weight="bold">网络设备布局图</text></svg>')}`,
  `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800"><rect fill="#0f172a" width="1200" height="800"/><rect x="80" y="120" width="1040" height="560" rx="20" fill="#1e293b" stroke="#334155" stroke-width="4"/><text x="600" y="400" dominant-baseline="middle" text-anchor="middle" fill="#94a3b8" font-size="56" font-family="sans-serif" font-weight="bold">天线部件结构图</text></svg>')}`,
];

function generateMockAlerts(baseMessage: string): AlertItem[] {
  const now = new Date();
  const msgs = [
    { title: '电源系统异常', message: baseMessage, imageIdx: 0 },
    { title: '网络连接中断', message: '网络设备响应超时，请检查交换机及光纤连接状态。', imageIdx: 1 },
    { title: '天线部件位移', message: '检测到天线水平位移超出阈值，请检查固定支架。', imageIdx: 2 },
  ];
  return msgs.map((m, i) => ({
    id: `alert-${now.getTime()}-${i}`,
    title: m.title,
    message: m.message,
    time: new Date(now.getTime() - i * 8 * 60 * 1000).toISOString(),
    imageUrl: ALERT_IMAGES[m.imageIdx],
    status: 'pending' as const,
  }));
}

/* ---------- localStorage 持久化 ---------- */
const LS_KEY = 'satmonitor-alerts-v1';

function loadAlerts(): AlertItem[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveAlerts(alerts: AlertItem[]) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(alerts));
  } catch {}
}

/* ---------- 报警音效 ---------- */
function useAlarmSound(enabled: boolean) {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscRef = useRef<OscillatorNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const intervalRef = useRef<number | null>(null);

  const stop = useCallback(() => {
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (oscRef.current) {
      try { oscRef.current.stop(); } catch {}
      oscRef.current = null;
    }
    if (audioCtxRef.current) {
      try { audioCtxRef.current.close(); } catch {}
      audioCtxRef.current = null;
    }
  }, []);

  const start = useCallback(() => {
    stop();
    const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    audioCtxRef.current = ctx;
    const gain = ctx.createGain();
    gain.connect(ctx.destination);
    gain.gain.value = 0.15;
    gainRef.current = gain;
    let isHigh = true;
    const toggleFreq = () => {
      if (oscRef.current) { try { oscRef.current.stop(); } catch {} }
      const osc = ctx.createOscillator();
      osc.type = 'square';
      osc.frequency.value = isHigh ? 880 : 440;
      osc.connect(gain);
      osc.start();
      oscRef.current = osc;
      isHigh = !isHigh;
    };
    toggleFreq();
    intervalRef.current = window.setInterval(toggleFreq, 400);
  }, [stop]);

  useEffect(() => {
    if (enabled) start(); else stop();
    return () => stop();
  }, [enabled, start, stop]);

  return { stop };
}

/* ---------- 时间格式化 ---------- */
function formatAlertTime(iso: string) {
  const d = new Date(iso);
  return `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export default function MaintenanceTips({ isAlerting: initialAlerting }: MaintenanceTipsProps) {
  const [config, setConfig] = useState<Partial<DashboardConfig> | null>(null);
  const [isAlerting, setIsAlerting] = useState(initialAlerting ?? false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [audioUnlocked, setAudioUnlocked] = useState(false);

  /* 报警列表 */
  const [alerts, setAlerts] = useState<AlertItem[]>(loadAlerts);
  const [listOpen, setListOpen] = useState(false);
  const [imageOpen, setImageOpen] = useState(false);
  const [currentImageAlert, setCurrentImageAlert] = useState<AlertItem | null>(null);

  useEffect(() => {
    setConfig(MOCK_DASHBOARD_CONFIG);
  }, []);

  useEffect(() => {
    if (config?.maintenanceTips && initialAlerting === undefined) {
      setIsAlerting(config.maintenanceTips.isAlerting);
    }
  }, [config, initialAlerting]);

  /* 报警状态变化时生成/清理模拟数据 */
  const prevAlertingRef = useRef(isAlerting);
  useEffect(() => {
    if (isAlerting && !prevAlertingRef.current) {
      // 从没有报警变为报警：生成模拟数据
      const existingPending = alerts.filter((a) => a.status === 'pending');
      if (existingPending.length === 0) {
        const msg = config?.maintenanceTips?.alertMessage ?? '近期有大雨，请检查电源系统或网络，部件位置请点击标识';
        const newAlerts = generateMockAlerts(msg);
        const merged = [...newAlerts, ...alerts];
        setAlerts(merged);
        saveAlerts(merged);
      }
    }
    prevAlertingRef.current = isAlerting;
  }, [isAlerting, alerts, config]);

  /* 持久化 */
  useEffect(() => {
    saveAlerts(alerts);
  }, [alerts]);

  /* 浏览器自动播放策略 */
  useEffect(() => {
    const unlock = () => {
      setAudioUnlocked(true);
      document.removeEventListener('click', unlock);
      document.removeEventListener('touchstart', unlock);
    };
    document.addEventListener('click', unlock);
    document.addEventListener('touchstart', unlock);
    return () => {
      document.removeEventListener('click', unlock);
      document.removeEventListener('touchstart', unlock);
    };
  }, []);

  useAlarmSound(isAlerting && soundEnabled && audioUnlocked);

  if (config?.maintenanceTips?.enabled === false) return null;

  const pendingCount = alerts.filter((a) => a.status === 'pending').length;
  const latestPending = alerts
    .filter((a) => a.status === 'pending')
    .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())[0];

  const handleResolve = (id: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: 'resolved' as const } : a))
    );
  };

  const handleViewImage = (alert: AlertItem) => {
    setCurrentImageAlert(alert);
    setImageOpen(true);
  };

  const handleViewLatestImage = () => {
    if (latestPending) {
      setCurrentImageAlert(latestPending);
      setImageOpen(true);
    }
  };

  /* 渲染报警消息：把"请点击标识"等部分替换成"查看详情" */
  const renderAlertMessage = (msg: string) => {
    const clickPattern = /(.*?)(请点击标识|点击出图片|点击查看图片|点击查看)(.*)/;
    const match = msg.match(clickPattern);
    if (!match) {
      return (
        <>
          <span>{msg}</span>
          <span
            onClick={handleViewLatestImage}
            className="inline-flex items-center gap-1 text-sky-400 hover:text-sky-300 cursor-pointer underline underline-offset-2 transition-colors ml-1"
          >
            <Image className="w-3.5 h-3.5" />
            查看详情
          </span>
        </>
      );
    }
    return (
      <>
        {match[1]}
        <span
          onClick={handleViewLatestImage}
          className="inline-flex items-center gap-1 text-sky-400 hover:text-sky-300 cursor-pointer underline underline-offset-2 transition-colors"
        >
          <Image className="w-3.5 h-3.5" />
          查看详情
        </span>
        {match[3]}
      </>
    );
  };

  return (
    <>
      <div className="relative">
        {/* 静音按钮 — 左上角 */}
        {isAlerting && (
          <button
            onClick={() => setSoundEnabled((v) => !v)}
            className="absolute -top-9 left-0 px-2 py-1 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors z-10"
            title={soundEnabled ? '关闭报警音' : '开启报警音'}
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-red-400" />
            ) : (
              <VolumeX className="w-4 h-4 text-slate-400" />
            )}
          </button>
        )}

        {/* 模拟切换按钮 */}
        <button
          onClick={() => setIsAlerting((v) => !v)}
          className="absolute -top-9 right-0 px-3 py-1 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-[clamp(12px,1vw,14px)] text-slate-300 z-10"
        >
          {isAlerting ? '模拟正常' : '模拟报警'}
        </button>

        <div
          className={`dashboard-panel border backdrop-blur-2xl transition-colors duration-500 ${
            isAlerting
              ? 'bg-red-500/5 border-red-500/20'
              : 'bg-emerald-500/5 border-emerald-500/20'
          }`}
        >
          <div className="p-4 flex items-center gap-6 min-w-0">
            {/* 状态图标 */}
            <div className="relative shrink-0 w-14 h-14 flex items-center justify-center">
              <div
                className={`p-3 rounded-full border relative transition-colors duration-500 ${
                  isAlerting
                    ? 'bg-red-500/20 border-red-500/30 animate-pulse-ring'
                    : 'bg-emerald-500/20 border-emerald-500/30'
                }`}
              >
                <Bell
                  className={`w-6 h-6 transition-colors duration-500 ${
                    isAlerting ? 'text-red-500' : 'text-emerald-500'
                  }`}
                />
              </div>
            </div>

            {/* 提示内容 */}
            <div className="flex-1 min-w-0">
              <h3
                className={`text-[clamp(13px,1.1vw,18px)] font-bold flex items-center gap-2 transition-colors duration-500 ${
                  isAlerting ? 'text-red-400' : 'text-emerald-400'
                }`}
              >
                <AlertTriangle className="title-icon" />
                智能运检提示:
              </h3>
              <p className="text-[clamp(13px,1.1vw,18px)] text-slate-300 mt-1">
                {isAlerting ? (
                  <span className="inline-flex items-center gap-x-1 flex-wrap">
                    {renderAlertMessage(
                      latestPending?.message ??
                        config?.maintenanceTips?.alertMessage ??
                        '近期有大雨，请检查电源系统或网络，部件位置请点击标识'
                    )}
                    {latestPending && (
                      <span className="text-xs text-slate-500 ml-1 shrink-0">
                        ({formatAlertTime(latestPending.time)})
                      </span>
                    )}
                  </span>
                ) : (
                  <>{config?.maintenanceTips?.message ?? '系统运行正常，暂无异常告警。'}</>
                )}
              </p>
            </div>

            {/* 右侧控制区 */}
            <div className="hidden sm:flex flex-col items-end gap-2">
              {/* 状态标签 — 无边框，简洁 tag 样式 */}
              <div className="flex items-center gap-1.5">
                <div
                  className={`w-2 h-2 rounded-full ${
                    isAlerting ? 'bg-yellow-500' : 'bg-emerald-500'
                  }`}
                />
                <span
                  className={`text-sm font-bold ${
                    isAlerting ? 'text-yellow-500' : 'text-emerald-500'
                  }`}
                >
                  {isAlerting ? '注意环境风险' : '运行正常'}
                </span>
              </div>

              {/* 查看全部报警 — 正常状态下也可查看历史 */}
              {alerts.length > 0 && (
                <button
                  onClick={() => setListOpen(true)}
                  className={`shrink-0 inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-md border transition-colors cursor-pointer ${
                    isAlerting
                      ? 'bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20'
                      : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  <List className="w-3.5 h-3.5" />
                  查看全部 ({isAlerting ? pendingCount : alerts.length})
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 报警列表弹窗 */}
      <AlertListDialog
        open={listOpen}
        alerts={alerts}
        onClose={() => setListOpen(false)}
        onResolve={handleResolve}
        onViewImage={handleViewImage}
      />

      {/* 图片详情弹窗 */}
      <AlertImageDialog
        open={imageOpen}
        imageUrl={currentImageAlert?.imageUrl ?? ''}
        title={currentImageAlert?.title ?? ''}
        onClose={() => setImageOpen(false)}
      />
    </>
  );
}
