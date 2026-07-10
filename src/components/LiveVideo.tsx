import React, { useState, useCallback, useRef, useEffect } from 'react';
import ReactPlayer from 'react-player';
import { Video, AlertTriangle, Loader2, RefreshCw } from 'lucide-react';
import { cameraApi, snowApi } from '@/src/http/api';

const ReactPlayerElement = ReactPlayer as any;

// 默认摄像头设备（萤石云）
const DEFAULT_DEVICE_SERIAL = 'GN1818878';
const DEFAULT_CHANNEL_NO = 1;
// 兜底地址：当所有接口都失败时使用（已过期的 v3/openlive 地址）
const FALLBACK_URL =
  'https://open.ys7.com/v3/openlive/GN1818878_1_1.m3u8?expire=1777856899&id=968800755977609216&t=77eb7bbc8fb13026968fefe86d04905a78e657790802ea811bc66dd7222ad731&ev=101&supportH265=1';
const FALLBACK_NAME = 'GN1818878_1_1';

// SRS 直播流（优先于萤石，地址配置在 .env：VITE_SRS_HLS_CHUNAN）
const DEFAULT_SRS_URL = import.meta.env.VITE_SRS_HLS_CHUNAN || '';

interface LiveVideoProps {
  /** 指定设备序列号，默认 GN1818878 */
  deviceSerial?: string;
  /** 指定通道号，默认 1 */
  channelNo?: number;
  /** 兜底流地址（接口全部失败时使用） */
  fallbackUrl?: string;
  /** 是否启用，默认 true */
  enabled?: boolean;
  /** SRS 直播流地址；传空字符串禁用 SRS，不传则读 VITE_SRS_HLS_CHUNAN */
  srsUrl?: string;
}

export default function LiveVideo({
  deviceSerial = DEFAULT_DEVICE_SERIAL,
  channelNo = DEFAULT_CHANNEL_NO,
  fallbackUrl = FALLBACK_URL,
  enabled = true,
  srsUrl = DEFAULT_SRS_URL,
}: LiveVideoProps) {
  // 最终用于播放的地址
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [streamName, setStreamName] = useState<string>(`${deviceSerial}_${channelNo}`);
  // 数据来源标记，便于调试
  const [source, setSource] = useState<'srs' | 'backend' | 'ys7-direct' | 'fallback' | null>(null);
  // 是否使用 iframe 播放（针对 playerUrl）
  const [useIframe, setUseIframe] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [key, setKey] = useState(0);
  const playerRef = useRef<any>(null);
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // SRS 播放失败后置 true，自动重试时跳过 SRS 直接降级到萤石；手动重试时重置
  const skipSrsRef = useRef(false);

  /**
   * 取流主流程：
   * 0) 优先使用 SRS 直播流（配置在 .env，不走后端，流不过期）
   * 1) 后端 /v1/sat/cameras/live-address（自动使用本地 monitor_token / admin_token）
   * 2) 失败（如 401）时降级：调 /v1/snow/ys7-token（公开免认证）拿萤石 token，再直接调萤石开放 API
   * 3) 仍失败时使用兜底地址（可能已过期，播放会触发 onError）
   * 拿到地址后根据 expireTime 安排下次刷新
   */
  const loadStream = useCallback(async () => {
    const serial = deviceSerial;
    const channel = channelNo;

    // ---------- 第 0 级：SRS 直播流（配置在 .env，不走后端）----------
    if (srsUrl && !skipSrsRef.current) {
      try {
        // 先探测 SRS 流是否可达（3 秒超时），避免 SRS 挂了时长时间卡在 loading
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        const resp = await fetch(srsUrl, { method: 'HEAD', signal: controller.signal });
        clearTimeout(timeoutId);
        if (!resp.ok) throw new Error(`SRS HTTP ${resp.status}`);
        // 探测通过，使用 SRS 流播放
        setStreamUrl(srsUrl);
        setUseIframe(false);
        setStreamName('SRS: chunan-cam1');
        setSource('srs');
        setError(null);
        // SRS 流不过期，无需安排刷新
        if (refreshTimerRef.current) {
          clearTimeout(refreshTimerRef.current);
          refreshTimerRef.current = null;
        }
        console.log('[LiveVideo] using SRS stream:', srsUrl);
        return;
      } catch (e: any) {
        const reason = e?.name === 'AbortError' ? 'timeout(3s)' : e?.message || e;
        console.warn('[LiveVideo] SRS probe failed, fallback to 萤石:', reason);
        skipSrsRef.current = true;
        // 继续走第 1 级（萤石）
      }
    }

    // ---------- 第 1 级：后端 live-address ----------
    try {
      const list = await cameraApi.getLiveAddress({
        deviceSerial: serial,
        channelNo: channel,
        protocol: 1, // HLS，浏览器兼容最好
      });
      // 后端可能返回数组或单个对象，兼容两种格式
      const first = Array.isArray(list) ? list[0] : list;
      console.log('[LiveVideo] backend response:', {
        list,
        first,
        firstPlayerUrl: first?.playerUrl,
        hasPlayerUrl: !!first?.playerUrl,
        playerUrlType: typeof first?.playerUrl,
        isArray: Array.isArray(list),
      });
      if (first) {
        // 检查是否有 HLS 地址（m3u8 格式）
        const hlsUrl = (first as any).hls || (first as any).hlsHd || (first as any).rtmpHls;
        if (hlsUrl && hlsUrl.includes('.m3u8')) {
          // 找到 HLS 地址，使用 ReactPlayer 播放
          setStreamUrl(hlsUrl);
          setUseIframe(false);
          setStreamName(`${first.deviceSerial ?? serial}_${first.channelNo ?? channel}`);
          setSource('backend');
          setError(null);
          scheduleRefresh(first.expireTime);
          console.log('[LiveVideo] using HLS URL from backend');
          return;
        }
        // 没有 HLS 地址，尝试使用 playerUrl（iframe 模式）
        if (first.playerUrl) {
          setStreamUrl(first.playerUrl);
          setUseIframe(true);
          setStreamName(`${first.deviceSerial ?? serial}_${first.channelNo ?? channel}`);
          setSource('backend');
          setError(null);
          scheduleRefresh(first.expireTime);
          console.log('[LiveVideo] using playerUrl (iframe mode)');
          return;
        }
      }
      console.warn('[LiveVideo] backend live-address returned empty or no valid url', list);
    } catch (e: any) {
      console.warn('[LiveVideo] backend live-address failed:', e?.message || e);
    }

    // ---------- 第 2 级：公开 ys7-token + 萤石开放 API ----------
    try {
      const tokenRes = await snowApi.getYs7Token();
      const accessToken = tokenRes?.accessToken;
      if (!accessToken) throw new Error('ys7-token 返回为空');
      const resp = await fetch('https://open.ys7.com/api/lapp/live/address/get', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          accessToken,
          source: `${serial}:${channel}`,
        }),
      });
      const json = await resp.json();
      if (json.code !== '200') {
        throw new Error(`萤石 ${json.code}: ${json.msg || ''}`);
      }
      const item = json.data?.[0];
      const url = item?.hlsHd || item?.hls;
      if (!url) {
        // 例如 ret=60060 "The address is unbound"
        throw new Error(item?.desc ? `萤石取流失败: ${item.desc}` : '萤石未返回播放地址');
      }
      setStreamUrl(url);
      setUseIframe(false);
      setStreamName(`${serial}_${channel}`);
      setSource('ys7-direct');
      setError(null);
      // 萤石直播地址有效期通常 7 天，提前 1 天刷新
      scheduleRefresh(Date.now() + 24 * 3600 * 1000);
      return;
    } catch (e: any) {
      console.warn('[LiveVideo] ys7-direct failed:', e?.message || e);
    }

    // ---------- 第 3 级：兜底硬编码地址 ----------
    setStreamUrl(fallbackUrl);
    setUseIframe(false);
    setStreamName(FALLBACK_NAME);
    setSource('fallback');
    setLoading(false); // 兜底地址设置后结束 loading 状态，交由 ReactPlayer 的 onReady/onError 接管
    setError(
      '视频流接口暂不可用（可能原因：未登录、萤石账号未开通直播权限）。\n已切换到兜底地址，若地址过期将无法播放。',
    );
  }, [deviceSerial, channelNo, fallbackUrl, srsUrl]);

  /**
   * 根据过期时间安排下一次刷新。
   * 默认提前 5 分钟刷新；无 expireTime 时 30 分钟轮询一次。
   */
  const scheduleRefresh = useCallback((expireTime?: string | number) => {
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
    let ms = 30 * 60 * 1000;
    if (expireTime) {
      const exp =
        typeof expireTime === 'string'
          ? /\d{13,}/.test(expireTime)
            ? Number(expireTime) // 毫秒时间戳字符串
            : new Date(expireTime).getTime()
          : expireTime;
      if (exp > Date.now()) {
        ms = Math.max(60_000, exp - Date.now() - 5 * 60 * 1000);
      }
    }
    refreshTimerRef.current = setTimeout(() => {
      loadStream().catch(() => {});
    }, ms);
  }, [loadStream]);

  // 初始加载
  useEffect(() => {
    setLoading(true);
    loadStream().finally(() => {
      // 第一次加载完成（无论成功失败），loading 状态交由后续 useEffect + ReactPlayer 控制
    });
    return () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    };
  }, [loadStream]);

  // 接口返回的 streamUrl 变化时，强制 react-player 重新加载
  useEffect(() => {
    if (streamUrl) {
      setLoading(true);
      setError(null);
      setKey((k) => k + 1);
    }
  }, [streamUrl]);

  const handleError = useCallback((e: any) => {
    console.error('[LiveVideo] playback error:', e, 'source=', source);
    if (source === 'srs') {
      // SRS 失败 -> 标记跳过，8 秒后自动重试会降级到萤石
      skipSrsRef.current = true;
      setError(
        'SRS 直播流连接失败，8 秒后自动降级到萤石云备用流。\n' +
          '可能原因：SRS 服务未启动 / 端口未放行 / 流未推送到 SRS / HTTPS 页面加载 HTTP 流（Mixed Content）',
      );
    } else {
      setError(
        '视频流加载失败，请检查：\n' +
          '1. 设备是否在线\n' +
          '2. 萤石云直播权限是否开通（ret=60060 表示地址未绑定）\n' +
          '3. 取流地址是否过期（token 会自动刷新，可点重试）\n' +
          '4. 浏览器是否支持 H265（Chrome 对 H265 支持极差）',
      );
    }
    setLoading(false);
  }, [source]);

  const handleReady = useCallback(() => {
    setLoading(false);
    setError(null);
  }, []);

  const handleRetry = useCallback(() => {
    setError(null);
    setLoading(true);
    // 手动重试 -> 重置 SRS 跳过标记，优先再试 SRS
    skipSrsRef.current = false;
    // 重新走一遍取流流程（不只是重载 player）
    loadStream().catch(() => {});
  }, [loadStream]);

  // 播放错误时 8 秒后自动重试（SRS 失败后降级到萤石；不重置 skipSrsRef）
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
        setLoading(true);
        loadStream().catch(() => {});
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [error, loadStream]);

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
          {streamUrl && (
            useIframe ? (
              // iframe 模式（针对萤石 playerUrl）
              <iframe
                key={key}
                ref={playerRef as any}
                src={streamUrl}
                width="100%"
                height="100%"
                frameBorder="0"
                allowFullScreen
                allow="autoplay; fullscreen"
                onLoad={() => {
                  setLoading(false);
                  setError(null);
                }}
                onError={() => {
                  handleError(new Error('iframe load failed'));
                }}
              />
            ) : (
              // ReactPlayer 模式（针对 HLS m3u8）
              <ReactPlayerElement
                key={key}
                ref={playerRef}
                url={streamUrl}
                playing
                muted
                width="100%"
                height="100%"
                controls={false}
                onReady={handleReady}
                onError={handleError}
                config={{
                  file: {
                    forceHLS: true,
                    hlsOptions: {
                      enableWorker: true,
                      // 对于直播流，降低缓冲以提升实时性
                      liveSyncDurationCount: 3,
                      // 遇到 404 片段时自动跳过后续，避免卡死
                      fragLoadErrorTolerance: 5,
                    },
                  },
                } as any}
              />
            )
          )}
        </div>

        <div className="absolute bottom-2 left-2 z-20 text-[clamp(12px,1.05vw,17px)] text-white/40 font-mono flex flex-col">
          <span>VIDEO_STREAM: {streamName} {source && <span className="text-white/30">[{source}]</span>}</span>
          <span>{new Date().toLocaleString('zh-CN', { hour12: false })}</span>
        </div>
      </div>
    </div>
  );
}
