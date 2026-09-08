import React from 'react';
import { Settings, Download, Smartphone, Monitor, Layers } from 'lucide-react';

interface HeaderProps {
  onOpenSettings: () => void;
  layerCount: number;
  isSimulator: boolean;
  onToggleSimulator: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenSettings,
  layerCount,
  isSimulator,
  onToggleSimulator,
}) => {
  return (
    <header className="sticky top-0 z-30 w-full px-3 py-1 flex items-center justify-between glass-panel border-b border-pink-200/40 shrink-0">
      {/* 极简左侧：小巧粉色呼吸圆点与图层数指示 */}
      <div className="flex items-center space-x-2">
        <div className="w-5 h-5 rounded-md bg-gradient-to-tr from-pink-500 to-rose-400 flex items-center justify-center shadow-xs">
          <Layers className="w-3 h-3 text-white" />
        </div>
        <span className="text-[11px] font-bold text-pink-600/90 font-mono tracking-tight">
          {layerCount > 0 ? `${layerCount} 个图层` : '未导入'}
        </span>
      </div>

      {/* 右侧极简工具组 */}
      <div className="flex items-center space-x-1.5">
        {/* 电脑端手机模拟器开关 */}
        <button
          onClick={onToggleSimulator}
          title={isSimulator ? "切换为全屏自适应视图" : "切换为手机外框模拟器"}
          className="hidden md:flex items-center justify-center w-7 h-7 rounded-full bg-white/70 hover:bg-pink-100/80 text-pink-600 transition-all border border-pink-200/60"
        >
          {isSimulator ? <Monitor className="w-3.5 h-3.5" /> : <Smartphone className="w-3.5 h-3.5" />}
        </button>

        {/* API 设置按钮 */}
        <button
          onClick={onOpenSettings}
          title="API 与模型设置"
          className="flex items-center justify-center w-7 h-7 rounded-full bg-white/80 hover:bg-pink-100/80 text-pink-600 transition-all border border-pink-200/60 active:scale-90 shadow-xs"
        >
          <Settings className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
};
