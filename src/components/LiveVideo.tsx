import ReactPlayer from 'react-player';
import { Video } from 'lucide-react';

const ReactPlayerElement = ReactPlayer as any;

export default function LiveVideo() {
  const streamUrl = "https://open.ys7.com/v3/openlive/GN1818878_1_1.m3u8?expire=1772181588&id=947525939894525952&t=b52c5c0db3f7d173351b31500841c5270c0e03b3b1f747937ee27ec0e544d392&ev=101&supportH265=1";

  return (
    <div className="glass-card h-full flex flex-col">
      <div className="panel-header">
        <h2 className="panel-title"><Video className="title-icon text-sky-500" />实时画面监控</h2>
      </div>
      
      <div className="flex-1 bg-black/70 relative m-3 rounded border border-slate-800 flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10 pointer-events-none"></div>
        <div className="absolute top-2 left-2 z-20 text-[clamp(10px,0.9vw,13px)] bg-red-600 px-1 rounded animate-pulse text-white font-bold">REC</div>
        
        <div className="w-full h-full">
          <ReactPlayerElement
            url={streamUrl}
            playing
            muted
            width="100%"
            height="100%"
            controls={false}
            config={{
              file: {
                forceHLS: true,
              },
            } as any}
          />
        </div>
        
        <div className="absolute bottom-2 left-2 z-20 text-[clamp(10px,0.9vw,13px)] text-white/40 font-mono flex flex-col">
          <span>VIDEO_STREAM: GN1818878_1_1</span>
          <span>2026-04-22 14:32:05</span>
        </div>
      </div>
    </div>
  );
}
