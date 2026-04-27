import { useEffect, useRef, useState, useCallback } from 'react';
import { Bell, AlertTriangle, Volume2, VolumeX } from 'lucide-react';
import { fetchDashboardConfig } from '@/src/api/dashboard-config';
import type { DashboardConfig } from '@/src/api/dashboard-config';

interface MaintenanceTipsProps {
  isAlerting?: boolean;
}

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
      try {
        oscRef.current.stop();
      } catch {
        // ignore
      }
      oscRef.current = null;
    }
    if (audioCtxRef.current) {
      try {
        audioCtxRef.current.close();
      } catch {
        // ignore
      }
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
      if (oscRef.current) {
        try {
          oscRef.current.stop();
        } catch {
          // ignore
        }
      }
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
    if (enabled) {
      start();
    } else {
      stop();
    }
    return () => stop();
  }, [enabled, start, stop]);

  return { stop };
}

export default function MaintenanceTips({ isAlerting: initialAlerting }: MaintenanceTipsProps) {
  const [config, setConfig] = useState<Partial<DashboardConfig> | null>(null);

  useEffect(() => {
    fetchDashboardConfig().then(setConfig).catch(() => {});
  }, []);

  const [isAlerting, setIsAlerting] = useState(initialAlerting ?? false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [audioUnlocked, setAudioUnlocked] = useState(false);

  // 浏览器自动播放策略：需要用户交互后才能播放音频
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

  useEffect(() => {
    if (config?.maintenanceTips && initialAlerting === undefined) {
      setIsAlerting(config.maintenanceTips.isAlerting);
    }
  }, [config, initialAlerting]);

  useAlarmSound(isAlerting && soundEnabled && audioUnlocked);

  if (config?.maintenanceTips?.enabled === false) return null;

  return (
    <div
      className={`dashboard-panel border backdrop-blur-2xl transition-colors duration-500 ${
        isAlerting
          ? 'bg-red-500/5 border-red-500/20'
          : 'bg-emerald-500/5 border-emerald-500/20'
      }`}
    >
      <div className="p-4 flex items-center gap-6">
        {/* 状态图标 */}
        <div className="relative shrink-0">
          {isAlerting && (
            <div
              className={`absolute -inset-2 rounded-full animate-ping ${
                isAlerting ? 'bg-red-500/20' : 'bg-emerald-500/20'
              }`}
            />
          )}
          <div
            className={`p-3 rounded-full border relative transition-colors duration-500 ${
              isAlerting
                ? 'bg-red-500/20 border-red-500/30'
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
        <div className="flex-1">
          <h3
            className={`text-[clamp(11px,1.0vw,14px)] font-bold flex items-center gap-2 transition-colors duration-500 ${
              isAlerting ? 'text-red-400' : 'text-emerald-400'
            }`}
          >
            <AlertTriangle className="title-icon" />
            智能运检提示:
          </h3>
          <p className="text-[clamp(11px,1.0vw,14px)] text-slate-300 mt-1">
            {isAlerting ? (
              <>
                {config?.maintenanceTips?.alertMessage ?? '近期有大雨，请检查电源系统或网络，部件位置请点击标识 (最好可以点击出图片)'}
              </>
            ) : (
              <>{config?.maintenanceTips?.message ?? '系统运行正常，暂无异常告警。'}</>
            )}
          </p>
        </div>

        {/* 右侧控制区 */}
        <div className="hidden sm:flex items-center gap-3">
          {/* 静音/开启按钮 */}
          {isAlerting && (
            <button
              onClick={() => setSoundEnabled((v) => !v)}
              className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
              title={soundEnabled ? '关闭报警音' : '开启报警音'}
            >
              {soundEnabled ? (
                <Volume2 className="w-4 h-4 text-red-400" />
              ) : (
                <VolumeX className="w-4 h-4 text-slate-400" />
              )}
            </button>
          )}

          {/* 状态显示 */}
          <div className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg">
            <div className="flex flex-col text-right">
              <span className="text-[clamp(11px,1.0vw,14px)] uppercase text-slate-400">
                当前系统状态
              </span>
              <span
                className={`text-[clamp(11px,1.0vw,14px)] font-bold transition-colors duration-500 ${
                  isAlerting ? 'text-yellow-500' : 'text-emerald-500'
                }`}
              >
                {isAlerting ? '注意环境风险' : '运行正常'}
              </span>
            </div>
            <div
              className={`w-2 h-2 rounded-full transition-colors duration-500 ${
                isAlerting ? 'bg-yellow-500' : 'bg-emerald-500'
              }`}
            />
          </div>

          {/* 模拟切换按钮（方便演示） */}
          <button
            onClick={() => setIsAlerting((v) => !v)}
            className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-[clamp(11px,1.0vw,14px)] text-slate-300"
          >
            {isAlerting ? '模拟正常' : '模拟报警'}
          </button>
        </div>
      </div>
    </div>
  );
}
