import { Satellite } from 'lucide-react';
import ThreeScene from './antenna/ThreeScene';

export default function AntennaDisplay() {
  return (
    <div className="glass-card h-full relative overflow-hidden group">
      {/* <div className="absolute top-4 left-4 z-10 pointer-events-none">
        <h2 className="panel-title text-sky-400">
          <Satellite className="title-icon text-sky-500" />
          核心天线阵列可视化
        </h2>
        <p className="text-[clamp(13px,1.1vw,18px)] text-slate-400">RF TRANSMISSION MAPPING V1.4</p>
      </div> */}

      <ThreeScene />
    </div>
  );
}
