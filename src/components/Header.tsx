import React from 'react';
import { Settings, Download, Smartphone, Monitor, Layers } from 'lucide-react';

interface HeaderProps {
  onOpenSettings: () => void;
  onOpenLayerPanel: () => void;
  onExport: () => void;
  layerCount: number;
  isSimulator: boolean;
  onToggleSimulator: () => void;
  isExporting: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenSettings,
  onOpenLayerPanel,
  onExport,
  layerCount,
  isSimulator,
  onToggleSimulator,
  isExporting,
}) => {
  return (
    <header className="sticky top-0 z-30 w-full px-4 py-3 flex items-center justify-between glass-panel border-b border-pink-200/50">
      {/* 应用 Logo 与名称 */}
      <div className="flex items-center space-x-2.5">
        <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-pink-500 to-rose-400 flex items-center justify-center shadow-md shadow-pink-300/60 ring-2 ring-white/80">
          <Layers className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-base font-bold bg-gradient-to-r from-pink-600 via-rose-500 to-pink-500 bg-clip-text text-transparent leading-tight tracking-tight">
            PinkLayer AI
          </h1>
          <p className="text-[10px] text-pink-400 font-medium tracking-wider uppercase">
            PS Layer Studio
          </p>
        </div>
      </div>

      {/* 右侧操作按钮组 */}
      <div className="flex items-center space-x-2">
        {/* 电脑端手机模拟器开关（仅桌面环境有用） */}
        <button
          onClick={onToggleSimulator}
          title={isSimulator ? "切换为全屏自适应视图" : "切换为手机外框模拟器"}
          className="hidden md:flex items-center justify-center w-8 h-8 rounded-full bg-white/70 hover:bg-pink-100/80 text-pink-600 transition-all shadow-xs border border-pink-200/60"
        >
          {isSimulator ? <Monitor className="w-4 h-4" /> : <Smartphone className="w-4 h-4" />}
        </button>

        {/* 打开图层管理面板 */}
        <button
          onClick={onOpenLayerPanel}
          className="relative flex items-center space-x-1 px-3 py-1.5 rounded-full bg-pink-100/70 hover:bg-pink-200/70 text-pink-700 transition-all border border-pink-200/80 active:scale-95 text-xs font-semibold shadow-xs"
        >
          <Layers className="w-3.5 h-3.5" />
          <span>图层</span>
          {layerCount > 0 && (
            <span className="ml-0.5 px-1.5 py-0.2 text-[10px] bg-pink-500 text-white rounded-full font-bold">
              {layerCount}
            </span>
          )}
        </button>

        {/* 导出按钮 */}
        <button
          onClick={onExport}
          disabled={layerCount === 0 || isExporting}
          className="flex items-center space-x-1 px-3 py-1.5 rounded-full bg-gradient-to-r from-pink-500 to-rose-400 hover:from-pink-600 hover:to-rose-500 disabled:opacity-40 text-white transition-all shadow-sm shadow-pink-300/50 active:scale-95 text-xs font-semibold"
        >
          <Download className="w-3.5 h-3.5" />
          <span>{isExporting ? '导出中...' : '导出'}</span>
        </button>

        {/* API 设置按钮 */}
        <button
          onClick={onOpenSettings}
          title="API 与模型设置"
          className="flex items-center justify-center w-8 h-8 rounded-full bg-white/80 hover:bg-pink-100/80 text-pink-600 transition-all border border-pink-200/60 active:scale-90 shadow-xs"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
