import React, { useState, useCallback, useRef, useEffect } from 'react';
import ReactPlayer from 'react-player';
import { Video, AlertTriangle, Loader2, RefreshCw } from 'lucide-react';
import { fetchDashboardConfig } from '@/src/api/dashboard-config';
import type { DashboardConfig } from '@/src/api/dashboard-config';

const ReactPlayerElement = ReactPlayer as any;

interface LiveVideoProps {
  /** 萤石云开放直播地址，建议取流时去掉 supportH265=1 以获取 H264 流，浏览器兼容性更好 */
  streamUrl?: string;
  streamName?: string;
}

export default function LiveVideo({
  streamUrl: propStreamUrl = "https://open.ys7.com/v3/openlive/GN1818878_1_1.m3u8?expire=1777856899&id=968800755977609216&t=77eb7bbc8fb13026968fefe86d04905a78e657790802ea811bc66dd7222ad731&ev=101&supportH265=1",
  streamName: propStreamName = "GN1818878_1_1",
}: LiveVideoProps) {
  const [config, setConfig] = useState<Partial<DashboardConfig> | null>(null);

  useEffect(() => {
    fetchDashboardConfig().then(setConfig).catch(() => {});
  }, []);

  const streamUrl = config?.liveVideo?.streamUrl ?? propStreamUrl;
  const streamName = config?.liveVideo?.streamName ?? propStreamName;
  const enabled = config?.liveVideo?.enabled ?? true;
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [key, setKey] = useState(0);
  const playerRef = useRef<any>(null);

  const handleError = useCallback((e: any) => {
    console.error('LiveVideo playback error:', e);
    setError('视频流加载失败，请检查：\n1. 设备是否在线\n2. 取流地址是否过期（萤石云 token 会过期）\n3. 浏览器是否支持 H265（Chrome 对 H265 支持极差，建议获取 H264 流）');
    setLoading(false);
  }, []);

  const handleReady = useCallback(() => {
    setLoading(false);
    setError(null);
  }, []);

  const handleRetry = useCallback(() => {
    setError(null);
    setLoading(true);
    setKey((k) => k + 1);
  }, []);

  // 自动重试一次（应对偶尔的网络抖动）
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        handleRetry();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, handleRetry]);

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
        <div className="absolute top-2 left-2 z-20 text-[clamp(10px,0.9vw,13px)] bg-red-600 px-1 rounded animate-pulse text-white font-bold">REC</div>

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
        </div>

        <div className="absolute bottom-2 left-2 z-20 text-[clamp(10px,0.9vw,13px)] text-white/40 font-mono flex flex-col">
          <span>VIDEO_STREAM: {streamName}</span>
          <span>{new Date().toLocaleString('zh-CN', { hour12: false })}</span>
        </div>
      </div>
    </div>
  );
}
