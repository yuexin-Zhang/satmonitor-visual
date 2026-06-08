import { X } from 'lucide-react';

interface AlertImageDialogProps {
  open: boolean;
  imageUrl: string;
  title: string;
  onClose: () => void;
}

export default function AlertImageDialog({ open, imageUrl, title, onClose }: AlertImageDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* 遮罩 */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* 内容卡片 */}
      <div className="relative z-10 w-[95vw] h-[95vh] max-w-[1400px] max-h-[900px] flex flex-col">
        {/* 标题栏 */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900/90 border border-slate-700 rounded-t-lg">
          <span className="text-slate-100 font-bold text-lg truncate pr-6">{title}</span>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-white/10 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 图片区域 — 无滚动条，填满容器 */}
        <div className="relative flex-1 bg-slate-950 border-x border-b border-slate-700 rounded-b-lg overflow-hidden">
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover"
          />
        </div>
      </div>
    </div>
  );
}
