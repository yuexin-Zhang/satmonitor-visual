import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { LogOut } from 'lucide-react';
import { httpGet, getEffectiveStationTag } from '@/src/http/client';
import type { SystemDetail } from '@/src/http/types';

export default function Header() {
  const navigate = useNavigate();
  const [time, setTime] = useState(dayjs());
  const [deviceData, setDeviceData] = useState<{ organizationName?: string } | null>(null);

  useEffect(() => {
    httpGet<SystemDetail>('/v1/snow/detail', { params: { tag: getEffectiveStationTag() } }).then((data) => setDeviceData(data)).catch(() => {});
  }, []);

  // 站点名称：来自 /v1/snow/detail.organizationName，接口未返回时显示中性占位
  const siteName = deviceData?.organizationName || '监测台站';

  useEffect(() => {
    const timer = setInterval(() => setTime(dayjs()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="h-20 flex items-center justify-between px-6 py-6 relative z-50 overflow-hidden">
      {/* 背景层 */}
      <div className="absolute inset-0 bg-gradient-to-b from-sky-950/30 via-sky-950/10 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-sky-500/60 to-transparent" />
      
      {/* 顶部装饰线 */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sky-400/40 to-transparent" />
      
      {/* 底部扫描线动画 */}
      <div className="scan-line absolute inset-x-0 bottom-0 h-[2px]" />

      {/* 左侧装饰块 */}
      <div className="flex items-center gap-4 relative z-10">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-sky-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(56,189,248,0.8)]" />
          <div className="text-sky-300 text-[clamp(13px,1.0vw,20px)] tracking-widest font-medium">
            {siteName}
          </div>
        </div>
      </div>

      {/* 中间标题区域 */}
      <div className="flex-1 flex items-center justify-center relative z-10">
        <div className="flex items-center gap-4">
          {/* 左侧装饰 */}
          <div className="hidden md:flex items-center gap-1">
            <div className="w-1 h-1 bg-sky-400/80" />
            <div className="w-8 h-px bg-gradient-to-r from-sky-400 to-transparent" />
            <div className="w-1.5 h-1.5 border border-sky-400/60 rotate-45" />
            <div className="w-12 h-px bg-gradient-to-r from-sky-400/40 to-transparent" />
          </div>
          
          {/* 标题 */}
          <h1 className="header-title text-xl md:text-3xl lg:text-4xl font-black tracking-[0.15em] text-center whitespace-nowrap">
            卫星天线智能可视化监管
          </h1>
          
          {/* 右侧装饰 */}
          <div className="hidden md:flex items-center gap-1">
            <div className="w-12 h-px bg-gradient-to-l from-sky-400/40 to-transparent" />
            <div className="w-1.5 h-1.5 border border-sky-400/60 rotate-45" />
            <div className="w-8 h-px bg-gradient-to-l from-sky-400 to-transparent" />
            <div className="w-1 h-1 bg-sky-400/80" />
          </div>
        </div>
      </div>

      {/* 右侧时间区域 + 退出登录 */}
      <div className="flex items-center gap-4 font-mono text-right relative z-10">
        <div className="hidden md:flex flex-col items-end gap-0.5">
          <div className="text-sm text-sky-400 font-medium">{time.format('YYYY.MM.DD')}</div>
        </div>
        <div className="relative">
          <div className="text-base md:text-2xl font-light text-white leading-none tabular-nums tracking-wider drop-shadow-[0_0_10px_rgba(56,189,248,0.5)]">
            {time.format('HH:mm:ss')}
          </div>
        </div>
        <button
          onClick={() => {
            localStorage.removeItem('monitor_token');
            localStorage.removeItem('monitor_user');
            navigate('/login');
          }}
          className="flex items-center gap-1.5 text-slate-400 hover:text-rose-400 transition-colors text-[clamp(12px,0.9vw,16px)] ml-2 cursor-pointer"
          title="退出登录"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden md:inline">退出</span>
        </button>
      </div>
    </header>
  );
}
