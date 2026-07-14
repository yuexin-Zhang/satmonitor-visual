import { useState, useCallback, useRef, useEffect } from 'react';
import { Video, AlertTriangle, Loader2, RefreshCw } from 'lucide-react';
import { cameraApi } from '@/src/http/api';
import { getEffectiveStationId } from '@/src/http/client';

// channelNo 固定 1
const DEFAULT_CHANNEL_NO = 1;
// quality=1 高清主码流（必须用 1，不要用 2，否则 9053）
const DEFAULT_QUALITY = 1;
// protocol=2 返回 playerUrl，用 iframe 嵌入萤石官方播放器（支持 H.265）
const DEFAULT_PROTOCOL = 2;
// 无 expireTime 时默认 20 小时刷新一次（地址约 24 小时过期）
const DEFAULT_REFRESH_MS = 20 * 3600 * 1000;
// 重试退避基数（秒），指数退避：3s, 6s, 12s, 24s, 30s, 30s...
const RETRY_BASE_DELAY = 3000;
const RETRY_MAX_DELAY = 30000;

interface LiveVideoProps {
  /** 台站 ID，默认取登录用户绑定台站 */
  stationId?: number;
  /** 通道号，默认 1 */
  channelNo?: number;
  /** 是否启用，默认 true */
  enabled?: boolean;
}

export default function LiveVideo({
  stationId,
  channelNo = DEFAULT_CHANNEL_NO,
  enabled = true,
}: LiveVideoProps) {
  const effectiveStationId = stationId ?? getEffectiveStationId();

  // 萤石官方播放器地址（iframe src）
  const [playerUrl, setPlayerUrl] = useState<string | null>(null);
  const [streamName, setStreamName] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  // 用于强制 iframe 重新挂载
  const [key, setKey] = useState(0);

  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryCountRef = useRef(0);
  const mountedRef = useRef(true);

  /**
   * 取流主流程：
   * 1. 调后端 /v1/sat/cameras/live-address?stationId=&channelNo=1&protocol=2&quality=1 拿最新 playerUrl
   * 2. 用 iframe 嵌入 data.playerUrl（萤石官方 H5 播放器，支持 H.265）
   * 3. 拿到地址后根据 expireTime 安排下次刷新（提前 5 分钟，默认 20 小时）
   * 4. 失败时重新调接口再试（指数退避）
   */
  const loadStream = useCallback(async () => {
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }

    try {
      const data = await cameraApi.getLiveAddressByStation({
        stationId: effectiveStationId,
        channelNo,
        protocol: DEFAULT_PROTOCOL,
        quality: DEFAULT_QUALITY,
      });

      // 后端可能返回数组或单个对象，兼容两种格式
      const first = Array.isArray(data) ? data[0] : data;
      if (!first?.playerUrl) {
        throw new Error('接口未返回 playerUrl');
      }

      if (!mountedRef.current) return;

      setPlayerUrl(first.playerUrl);
      setStreamName(`${first.deviceSerial ?? ''}_${first.channelNo ?? channelNo}`);
      setError(null);
      setLoading(false);
      retryCountRef.current = 0;

      scheduleRefresh(first.expireTime);
      console.log('[LiveVideo] got playerUrl, expireTime:', first.expireTime);
    } catch (e: any) {
      console.warn('[LiveVideo] getLiveAddress failed:', e?.message || e);
      if (!mountedRef.current) return;

      retryCountRef.current += 1;
      const attempt = retryCountRef.current;
      const delay = Math.min(RETRY_MAX_DELAY, RETRY_BASE_DELAY * 2 ** (attempt - 1));

      setError(
        `视频流获取失败（第 ${attempt} 次重试，${Math.round(delay / 1000)}s 后自动重试）：\n${e?.message || e}\n\n可能原因：\n1. 未登录或登录已过期\n2. 萤石设备离线\n3. 萤石云直播权限未开通`,
      );
      setLoading(false);

      // 播放失败时重新调接口再试
      retryTimerRef.current = setTimeout(() => {
        if (mountedRef.current) loadStream().catch(() => {});
      }, delay);
    }
  }, [effectiveStationId, channelNo]);

  /**
   * 根据过期时间安排下一次刷新。
   * 默认提前 5 分钟刷新；无 expireTime 时 20 小时刷新一次。
   */
  const scheduleRefresh = useCallback(
    (expireTime?: string) => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }
      let ms = DEFAULT_REFRESH_MS;
      if (expireTime) {
        const exp =
          typeof expireTime === 'string'
            ? /\d{13,}/.test(expireTime)
              ? Number(expireTime)
              : new Date(expireTime).getTime()
            : expireTime;
        if (exp > Date.now()) {
          ms = Math.max(60_000, exp - Date.now() - 5 * 60 * 1000);
        }
      }
      refreshTimerRef.current = setTimeout(() => {
        console.log('[LiveVideo] auto-refreshing live address...');
        loadStream().catch(() => {});
      }, ms);
    },
    [loadStream],
  );

  // 初始加载 & stationId 变化时重新加载
  useEffect(() => {
    mountedRef.current = true;
    setLoading(true);
    retryCountRef.current = 0;
    loadStream().catch(() => {});

    return () => {
      mountedRef.current = false;
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
    };
  }, [loadStream]);

  // playerUrl 变化时强制 iframe 重新加载
  useEffect(() => {
    if (playerUrl) {
      setLoading(true);
      setError(null);
      setKey((k) => k + 1);
    }
  }, [playerUrl]);

  const handleRetry = useCallback(() => {
    setError(null);
    setLoading(true);
    retryCountRef.current = 0;
    loadStream().catch(() => {});
  }, [loadStream]);

  if (!enabled) {
    return (
      <div className="glass-card h-full flex flex-col">
        <div className="panel-header">
          <h2 className="panel-title"><Video className="title-icon text-sky-500" />实时画面监控</h2>
        </div>
        <div className="flex-1 bg-black/70 relative m-3 rounded border border-slate-800 flex items-center justify-center overflow-hidden">
          <div className="text-white/60 text-sm">实时监控已禁用</div>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card h-full flex flex-col">
      <div className="panel-header">
        <h2 className="panel-title"><Video className="title-icon text-sky-500" />实时画面监控</h2>
      </div>

      <div className="flex-1 bg-black/70 relative m-3 rounded border border-slate-800 flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10 pointer-events-none" />
        <div className="absolute top-2 left-2 z-20 text-[clamp(12px,1.05vw,17px)] bg-red-600 px-1 rounded animate-pulse text-white font-bold">REC</div>

        {/* Loading */}
        {loading && !error && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/60 text-white/80">
            <Loader2 className="w-8 h-8 animate-spin mb-2" />
            <span className="text-sm">正在连接视频流...</span>
          </div>
        )}

        {/* Error Overlay */}
        {error && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/80 text-white/90 px-6 text-center">
            <AlertTriangle className="w-10 h-10 text-amber-400 mb-3" />
            <pre className="text-sm whitespace-pre-wrap leading-relaxed mb-4">{error}</pre>
            <button
              onClick={handleRetry}
              className="flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-500 rounded text-sm transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              立即重试
            </button>
          </div>
        )}

        <div className="w-full h-full">
          {playerUrl && (
            <iframe
              key={key}
              src={playerUrl}
              width="100%"
              height="100%"
              frameBorder="0"
              allowFullScreen
              allow="autoplay; fullscreen"
              onLoad={() => {
                setLoading(false);
                setError(null);
              }}
            />
          )}
        </div>

        <div className="absolute bottom-2 left-2 z-20 text-[clamp(12px,1.05vw,17px)] text-white/40 font-mono">
          <span>VIDEO_STREAM: {streamName} [station:{effectiveStationId}]</span>
        </div>
      </div>
    </div>
  );
}
