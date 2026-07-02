import { useEffect, useState, useCallback } from 'react';
import { Camera, RefreshCw, Play, Camera as CamIcon, Tv } from 'lucide-react';
import { cameraApi } from '@/src/http/api';
import type { Ys7DeviceVO, Ys7ChannelVO, Ys7LiveAddressVO } from '@/src/http/types';

export default function Cameras() {
  const [devices, setDevices] = useState<Ys7DeviceVO[]>([]);
  const [selectedSerial, setSelectedSerial] = useState<string | null>(null);
  const [channels, setChannels] = useState<Ys7ChannelVO[]>([]);
  const [liveAddresses, setLiveAddresses] = useState<Ys7LiveAddressVO[]>([]);
  const [token, setToken] = useState<string | null>(null);
  const [loadingChannels, setLoadingChannels] = useState(false);

  const loadDevices = useCallback(async () => {
    try {
      const res = await cameraApi.getDevices();
      setDevices(res || []);
    } catch (err) { console.error(err); }
  }, []);

  useEffect(() => { loadDevices(); }, [loadDevices]);

  const handleSelectDevice = async (serial: string) => {
    setSelectedSerial(serial);
    setChannels([]);
    setLiveAddresses([]);
    setLoadingChannels(true);
    try {
      const res = await cameraApi.getChannels(serial);
      setChannels(res || []);
    } catch (err) { console.error(err); }
    finally { setLoadingChannels(false); }
  };

  const handleGetLive = async (channelNo: number) => {
    if (!selectedSerial) return;
    try {
      const res = await cameraApi.getLiveAddress({ deviceSerial: selectedSerial, channelNo });
      setLiveAddresses(res || []);
    } catch (err) { console.error(err); alert('获取直播地址失败'); }
  };

  const handleCapture = async (channelNo: number) => {
    if (!selectedSerial) return;
    try {
      const res = await cameraApi.capture(selectedSerial, channelNo);
      if (res?.picUrl) window.open(res.picUrl, '_blank');
      else alert('抓图成功，无返回地址');
    } catch (err) { console.error(err); alert('抓图失败'); }
  };

  const handleGetToken = async () => {
    try {
      const res = await cameraApi.getToken();
      setToken(res?.accessToken || null);
    } catch (err) { console.error(err); alert('获取Token失败'); }
  };

  const cardClass = 'bg-slate-900/50 border border-slate-800 rounded-xl p-5';

  return (
    <div className="pt-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-[clamp(18px,1.3vw,26px)] font-medium text-slate-100 flex items-center gap-2">
          <Camera className="w-5 h-5 text-sky-500" />摄像头管理
        </h2>
        <div className="flex gap-2">
          <button onClick={handleGetToken} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-[clamp(14px,1.05vw,20px)] text-slate-300"><Tv className="w-4 h-4" />获取Token</button>
          <button onClick={loadDevices} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-[clamp(14px,1.05vw,20px)] text-slate-300"><RefreshCw className="w-4 h-4" />刷新</button>
        </div>
      </div>

      {token && (
        <div className="bg-sky-500/10 border border-sky-500/20 rounded-lg px-4 py-2 mb-4 text-[clamp(14px,1.05vw,20px)] text-sky-300 font-mono break-all">AccessToken: {token}</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* 设备列表 */}
        <div className={cardClass}>
          <h3 className="text-[clamp(16px,1.2vw,24px)] font-medium text-slate-200 mb-3">设备列表</h3>
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {devices.map((d) => (
              <button
                key={d.deviceSerial}
                onClick={() => handleSelectDevice(d.deviceSerial)}
                className={`w-full text-left p-3 rounded-lg border transition-colors ${selectedSerial === d.deviceSerial ? 'bg-sky-500/10 border-sky-500/30' : 'bg-slate-950 border-slate-800 hover:border-slate-700'}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[clamp(14px,1.05vw,20px)] text-slate-200">{d.deviceName || d.deviceSerial}</span>
                  <span className={`w-2 h-2 rounded-full ${d.onlineStatus ? 'bg-emerald-500' : 'bg-slate-600'}`} />
                </div>
                <div className="text-[10px] text-slate-500 font-mono mt-1">{d.deviceSerial}</div>
              </button>
            ))}
            {devices.length === 0 && <p className="text-center text-slate-500 py-6 text-[clamp(14px,1.05vw,20px)]">暂无设备</p>}
          </div>
        </div>

        {/* 通道列表 */}
        <div className={cardClass}>
          <h3 className="text-[clamp(16px,1.2vw,24px)] font-medium text-slate-200 mb-3">
            通道列表 {selectedSerial && <span className="text-[10px] text-slate-500 font-mono">({selectedSerial})</span>}
          </h3>
          {loadingChannels ? (
            <p className="text-center text-slate-500 py-6 text-[clamp(14px,1.05vw,20px)]">加载中...</p>
          ) : (
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {channels.map((ch) => (
                <div key={ch.channelNo} className="bg-slate-950 border border-slate-800 rounded-lg p-3 flex items-center justify-between">
                  <div>
                    <div className="text-[clamp(14px,1.05vw,20px)] text-slate-200">{ch.channelName || `通道${ch.channelNo}`}</div>
                    <div className="text-[10px] text-slate-500">通道号: {ch.channelNo}</div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleGetLive(ch.channelNo)} title="直播地址" className="text-sky-400 hover:text-sky-300 p-1"><Play className="w-4 h-4" /></button>
                    <button onClick={() => handleCapture(ch.channelNo)} title="抓图" className="text-amber-400 hover:text-amber-300 p-1"><CamIcon className="w-4 h-4" /></button>
                  </div>
                </div>
              ))}
              {!selectedSerial && <p className="text-center text-slate-500 py-6 text-[clamp(14px,1.05vw,20px)]">请先选择设备</p>}
              {selectedSerial && channels.length === 0 && <p className="text-center text-slate-500 py-6 text-[clamp(14px,1.05vw,20px)]">暂无通道</p>}
            </div>
          )}
        </div>

        {/* 直播地址 */}
        <div className={cardClass}>
          <h3 className="text-[clamp(16px,1.2vw,24px)] font-medium text-slate-200 mb-3">直播地址</h3>
          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {liveAddresses.map((addr, i) => (
              <div key={i} className="bg-slate-950 border border-slate-800 rounded-lg p-3 space-y-1">
                {addr.url && (
                  <a href={addr.url} target="_blank" rel="noreferrer" className="block text-[clamp(14px,1.05vw,20px)] text-sky-400 hover:text-sky-300 break-all font-mono text-xs">直播: {addr.url}</a>
                )}
                {addr.playerUrl && (
                  <a href={addr.playerUrl} target="_blank" rel="noreferrer" className="block text-[clamp(14px,1.05vw,20px)] text-emerald-400 hover:text-emerald-300 break-all font-mono text-xs">H5播放器: {addr.playerUrl}</a>
                )}
                {addr.expireTime && <div className="text-[10px] text-slate-600">过期: {addr.expireTime}</div>}
              </div>
            ))}
            {liveAddresses.length === 0 && <p className="text-center text-slate-500 py-6 text-[clamp(14px,1.05vw,20px)]">点击通道的播放按钮获取地址</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
