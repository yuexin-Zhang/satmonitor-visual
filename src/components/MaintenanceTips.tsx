import { useEffect, useRef, useState, useCallback } from 'react';
import { Bell, AlertTriangle, Volume2, VolumeX, List, Image } from 'lucide-react';
import { alarmApi, cameraApi } from '@/src/http/api';
import type { SatAlarmRecordVO } from '@/src/http/types';
import AlertListDialog, { type AlertItem } from './AlertListDialog';
import AlertImageDialog from './AlertImageDialog';

interface MaintenanceTipsProps {
  isAlerting?: boolean;
}

// 默认抓图设备（与 LiveVideo 一致）
const CAPTURE_DEVICE_SERIAL = 'GN1818878';
const CAPTURE_CHANNEL_NO = 1;

// 抓图失败时的提示文案
const CAPTURE_ERROR_TEXT =
  '实时抓拍获取失败，可能原因：\n1. 设备不在线\n2. 萤石云抓图权限未开通\n3. 未登录或令牌过期';

// 将后端告警记录 SatAlarmRecordVO 映射为前端 AlertItem
// imageUrl 留空：查看图片时通过 cameraApi.capture 实时抓拍获取
function alarmRecordToAlertItem(r: SatAlarmRecordVO): AlertItem {
  return {
    id: `alarm-${r.id}`,
    title: r.title || r.alarmType || '系统告警',
    message: r.content || r.remark || '',
    time: r.triggerTime || r.confirmTime || r.closeTime || new Date().toISOString(),
    imageUrl: '',
    status: r.status === 0 ? 'pending' : 'resolved',
  };
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
    // 先静音 gain，确保立即无声
    if (gainRef.current && audioCtxRef.current) {
      try {
        gainRef.current.gain.cancelScheduledValues(audioCtxRef.current.currentTime);
        gainRef.current.gain.setValueAtTime(0, audioCtxRef.current.currentTime);
      } catch {}
    }
    if (oscRef.current) {
      try { oscRef.current.stop(); } catch {}
      try { oscRef.current.disconnect(); } catch {}
      oscRef.current = null;
    }
    if (gainRef.current) {
      try { gainRef.current.disconnect(); } catch {}
      gainRef.current = null;
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
    gain.gain.value = 0;
    gainRef.current = gain;
    let isHigh = true;
    const toggleFreq = () => {
      if (oscRef.current) {
        try { oscRef.current.stop(); } catch {}
        try { oscRef.current.disconnect(); } catch {}
      }
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = isHigh ? 660 : 440;
      osc.connect(gain);
      const now = ctx.currentTime;
      gain.gain.cancelScheduledValues(now);
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.06, now + 0.05);  // 50ms 渐入
      gain.gain.setValueAtTime(0.06, now + 0.5);             // 持续
      gain.gain.linearRampToValueAtTime(0, now + 0.8);       // 300ms 渐出
      osc.start();
      oscRef.current = osc;
      isHigh = !isHigh;
    };
    toggleFreq();
    intervalRef.current = window.setInterval(toggleFreq, 850);
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
  const [isAlerting, setIsAlerting] = useState(initialAlerting ?? false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [audioUnlocked, setAudioUnlocked] = useState(false);

  /* 报警列表（来自后端 /v1/sat/alarms/records/page） */
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [listOpen, setListOpen] = useState(false);

  /* 抓图弹窗：实时调用 cameraApi.capture 获取画面 */
  const [imageOpen, setImageOpen] = useState(false);
  const [currentImageAlert, setCurrentImageAlert] = useState<AlertItem | null>(null);
  const [dialogImageUrl, setDialogImageUrl] = useState('');
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState('');

  /* 拉取后端告警记录（status=0 待处理 + status=1 已确认），合并本地已处理标记 */
  const refreshAlerts = useCallback(async () => {
    try {
      const [pendingRes, recentRes] = await Promise.all([
        alarmApi.getRecordsPage({ pageNum: 1, pageSize: 50, status: 0 }),
        alarmApi.getRecordsPage({ pageNum: 1, pageSize: 50, status: 1 }),
      ]);
      const records = [
        ...(pendingRes?.list || []),
        ...(recentRes?.list || []),
      ];
      if (records.length === 0) {
        // 后端无数据时清空列表
        setAlerts([]);
        if (initialAlerting === undefined) setIsAlerting(false);
        return;
      }
      // 去重（按 id），按触发时间倒序
      const map = new Map<number, SatAlarmRecordVO>();
      for (const r of records) map.set(r.id, r);
      const sorted = Array.from(map.values()).sort(
        (a, b) => new Date(b.triggerTime || b.confirmTime || b.closeTime || 0).getTime() - new Date(a.triggerTime || a.confirmTime || a.closeTime || 0).getTime()
      );
      const items = sorted.map((r) => alarmRecordToAlertItem(r));
      setAlerts(items);
      // 同步报警状态：有 pending 记录则报警
      const hasPending = items.some((a) => a.status === 'pending');
      if (initialAlerting === undefined) setIsAlerting(hasPending);
    } catch (err) {
      console.error('refreshAlerts failed', err);
    }
  }, [initialAlerting]);

  useEffect(() => {
    refreshAlerts();
    // 5分钟刷新一次
    const timer = setInterval(refreshAlerts, 300_000);
    return () => clearInterval(timer);
  }, [refreshAlerts]);

  /* 浏览器自动播放策略：需用户交互后才能播放报警音 */
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

  const pendingCount = alerts.filter((a) => a.status === 'pending').length;
  const latestPending = alerts
    .filter((a) => a.status === 'pending')
    .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())[0];

  // 实时抓拍取图：POST /v1/sat/cameras/{deviceSerial}/capture
  const captureImage = useCallback(async (alert: AlertItem) => {
    setCurrentImageAlert(alert);
    setImageOpen(true);
    setImageLoading(true);
    setImageError('');
    setDialogImageUrl('');
    try {
      const res = await cameraApi.capture(CAPTURE_DEVICE_SERIAL, CAPTURE_CHANNEL_NO);
      const url = res?.picUrl;
      if (url) {
        setDialogImageUrl(url);
      } else {
        setImageError(CAPTURE_ERROR_TEXT);
      }
    } catch (err) {
      console.error('cameraApi.capture failed', err);
      setImageError(CAPTURE_ERROR_TEXT);
    } finally {
      setImageLoading(false);
    }
  }, []);

  const handleViewImage = (alert: AlertItem) => {
    captureImage(alert);
  };

  const handleViewLatestImage = () => {
    if (latestPending) {
      captureImage(latestPending);
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
        {/* 静音按钮 - 左上角，始终显示 */}
        <button
          onClick={() => setSoundEnabled((v) => !v)}
          className="absolute -top-9 left-0 px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors z-20"
          title={soundEnabled ? '关闭报警音' : '开启报警音'}
        >
          {soundEnabled ? (
            <Volume2 className="w-4 h-4 text-sky-400" />
          ) : (
            <VolumeX className="w-4 h-4 text-slate-500" />
          )}
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
                        '检测到异常告警，请查看详情或前往现场排查'
                    )}
                    {latestPending && (
                      <span className="text-xs text-slate-500 ml-1 shrink-0">
                        ({formatAlertTime(latestPending.time)})
                      </span>
                    )}
                  </span>
                ) : (
                  <>系统运行正常，暂无异常告警。</>
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
              <button
                onClick={() => setListOpen(true)}
                className={`shrink-0 inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-md border transition-colors cursor-pointer ${
                  isAlerting
                    ? 'bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20'
                    : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                查看全部{isAlerting ? ` (${pendingCount})` : ''}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 告警记录弹窗：5个状态Tab + 分页 + 确认/处置/闭环操作 */}
      <AlertListDialog
        open={listOpen}
        onClose={() => setListOpen(false)}
        onViewImage={handleViewImage}
        onActionComplete={refreshAlerts}
      />

      {/* 图片详情弹窗：实时抓拍画面 */}
      <AlertImageDialog
        open={imageOpen}
        imageUrl={dialogImageUrl}
        title={currentImageAlert?.title ?? '实时抓拍'}
        loading={imageLoading}
        errorText={imageError || undefined}
        onClose={() => setImageOpen(false)}
      />
    </>
  );
}
