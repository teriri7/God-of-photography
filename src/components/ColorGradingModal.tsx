import React, { useState } from 'react';
import { Layer, LayerFilterSettings, DEFAULT_FILTER_SETTINGS } from '../types';
import { Sliders, Sun, RotateCcw, Check, Sparkles, ChevronRight, ChevronDown, Layers } from 'lucide-react';

interface ColorGradingModalProps {
  layer: Layer | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateFilter: (layerId: string, filter: LayerFilterSettings) => void;
}

export const ColorGradingModal: React.FC<ColorGradingModalProps> = ({
  layer,
  isOpen,
  onClose,
  onUpdateFilter,
}) => {
  const [activeTab, setActiveTab] = useState<'basic' | 'tonal'>('basic');

  if (!isOpen || !layer) return null;

  const currentFilter = layer.filter;

  const handleSliderChange = (key: keyof LayerFilterSettings, value: number) => {
    onUpdateFilter(layer.id, {
      ...currentFilter,
      [key]: value,
    });
  };

  const handleReset = () => {
    onUpdateFilter(layer.id, { ...DEFAULT_FILTER_SETTINGS });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md glass-panel rounded-t-3xl sm:rounded-3xl shadow-2xl p-5 border border-pink-200/80 animate-in slide-in-from-bottom-6 duration-200 flex flex-col max-h-[85vh]">
        {/* 顶部标题与重置 */}
        <div className="flex items-center justify-between pb-3 border-b border-pink-200/60">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-pink-500 to-rose-400 flex items-center justify-center text-white shadow-sm">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                图层调色与影调
              </h3>
              <p className="text-[10px] text-pink-500 font-medium">
                正在调节: {layer.name}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-1.5">
            <button
              onClick={handleReset}
              className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-pink-100 text-slate-600 hover:text-pink-600 text-xs flex items-center space-x-1 transition-colors"
              title="重置为默认值"
            >
              <RotateCcw className="w-3 h-3" />
              <span>重置</span>
            </button>
          </div>
        </div>

        {/* 选项卡切换：一级基础色彩 / 二级高级影调 */}
        <div className="flex p-1 bg-pink-100/60 rounded-xl my-3">
          <button
            onClick={() => setActiveTab('basic')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'basic'
                ? 'bg-white text-pink-600 shadow-xs'
                : 'text-slate-600 hover:text-pink-600'
            }`}
          >
            一级：白平衡与色彩
          </button>
          <button
            onClick={() => setActiveTab('tonal')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'tonal'
                ? 'bg-white text-pink-600 shadow-xs'
                : 'text-slate-600 hover:text-pink-600'
            }`}
          >
            二级：影调与明暗
          </button>
        </div>

        {/* 调色滑块区域 */}
        <div className="flex-1 overflow-y-auto space-y-4 py-2 px-1 no-scrollbar">
          {activeTab === 'basic' ? (
            <>
              {/* 白平衡 - 色温 */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-medium text-slate-700">
                  <span className="flex items-center">
                    色温 (冷蓝 / 暖橙)
                  </span>
                  <span className="font-mono text-pink-600">{currentFilter.temperature > 0 ? `+${currentFilter.temperature}` : currentFilter.temperature}</span>
                </div>
                <div className="relative flex items-center">
                  <input
                    type="range"
                    min="-100"
                    max="100"
                    value={currentFilter.temperature}
                    onChange={(e) => handleSliderChange('temperature', Number(e.target.value))}
                    className="w-full pink-slider"
                  />
                </div>
                <div className="flex justify-between text-[9px] text-slate-400">
                  <span>-100 冷调</span>
                  <span>0 原色</span>
                  <span>+100 暖调</span>
                </div>
              </div>

              {/* 白平衡 - 色调 */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-medium text-slate-700">
                  <span className="flex items-center">
                    色调 (偏绿 / 偏洋红)
                  </span>
                  <span className="font-mono text-pink-600">{currentFilter.tint > 0 ? `+${currentFilter.tint}` : currentFilter.tint}</span>
                </div>
                <input
                  type="range"
                  min="-100"
                  max="100"
                  value={currentFilter.tint}
                  onChange={(e) => handleSliderChange('tint', Number(e.target.value))}
                  className="w-full pink-slider"
                />
                <div className="flex justify-between text-[9px] text-slate-400">
                  <span>-100 偏绿</span>
                  <span>0 原色</span>
                  <span>+100 偏品红</span>
                </div>
              </div>

              {/* 饱和度 */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-medium text-slate-700">
                  <span>色彩饱和度</span>
                  <span className="font-mono text-pink-600">{currentFilter.saturation > 0 ? `+${currentFilter.saturation}` : currentFilter.saturation}</span>
                </div>
                <input
                  type="range"
                  min="-100"
                  max="100"
                  value={currentFilter.saturation}
                  onChange={(e) => handleSliderChange('saturation', Number(e.target.value))}
                  className="w-full pink-slider"
                />
              </div>

              {/* 亮度 */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-medium text-slate-700">
                  <span>画面亮度</span>
                  <span className="font-mono text-pink-600">{currentFilter.brightness > 0 ? `+${currentFilter.brightness}` : currentFilter.brightness}</span>
                </div>
                <input
                  type="range"
                  min="-100"
                  max="100"
                  value={currentFilter.brightness}
                  onChange={(e) => handleSliderChange('brightness', Number(e.target.value))}
                  className="w-full pink-slider"
                />
              </div>

              {/* 对比度 */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-medium text-slate-700">
                  <span>明暗对比度</span>
                  <span className="font-mono text-pink-600">{currentFilter.contrast > 0 ? `+${currentFilter.contrast}` : currentFilter.contrast}</span>
                </div>
                <input
                  type="range"
                  min="-100"
                  max="100"
                  value={currentFilter.contrast}
                  onChange={(e) => handleSliderChange('contrast', Number(e.target.value))}
                  className="w-full pink-slider"
                />
              </div>
            </>
          ) : (
            /* 二级影调菜单 */
            <>
              <div className="p-2.5 rounded-xl bg-pink-50/80 border border-pink-200/50 mb-2">
                <p className="text-[11px] text-pink-700 font-medium leading-relaxed">
                  影调调整支持精确控制画面亮部与暗部细节，营造高级电影感。
                </p>
              </div>

              {/* 阴影 */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-medium text-slate-700">
                  <span>暗部阴影 (Shadows)</span>
                  <span className="font-mono text-pink-600">{currentFilter.shadows > 0 ? `+${currentFilter.shadows}` : currentFilter.shadows}</span>
                </div>
                <input
                  type="range"
                  min="-100"
                  max="100"
                  value={currentFilter.shadows}
                  onChange={(e) => handleSliderChange('shadows', Number(e.target.value))}
                  className="w-full pink-slider"
                />
                <div className="flex justify-between text-[9px] text-slate-400">
                  <span>压暗深邃</span>
                  <span>提亮暗部细节</span>
                </div>
              </div>

              {/* 高光 */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-medium text-slate-700">
                  <span>亮部高光 (Highlights)</span>
                  <span className="font-mono text-pink-600">{currentFilter.highlights > 0 ? `+${currentFilter.highlights}` : currentFilter.highlights}</span>
                </div>
                <input
                  type="range"
                  min="-100"
                  max="100"
                  value={currentFilter.highlights}
                  onChange={(e) => handleSliderChange('highlights', Number(e.target.value))}
                  className="w-full pink-slider"
                />
                <div className="flex justify-between text-[9px] text-slate-400">
                  <span>抑制过曝</span>
                  <span>提升光芒</span>
                </div>
              </div>

              {/* 曝光 */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-medium text-slate-700">
                  <span>整体曝光度 (Exposure)</span>
                  <span className="font-mono text-pink-600">{currentFilter.exposure > 0 ? `+${currentFilter.exposure}` : currentFilter.exposure}</span>
                </div>
                <input
                  type="range"
                  min="-100"
                  max="100"
                  value={currentFilter.exposure}
                  onChange={(e) => handleSliderChange('exposure', Number(e.target.value))}
                  className="w-full pink-slider"
                />
              </div>

              {/* 色相偏移 */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-medium text-slate-700">
                  <span>色相旋转 (Hue Shift)</span>
                  <span className="font-mono text-pink-600">{currentFilter.hueRotate}°</span>
                </div>
                <input
                  type="range"
                  min="-180"
                  max="180"
                  value={currentFilter.hueRotate}
                  onChange={(e) => handleSliderChange('hueRotate', Number(e.target.value))}
                  className="w-full pink-slider"
                />
              </div>
            </>
          )}
        </div>

        {/* 底部完成按钮 */}
        <div className="pt-3 border-t border-pink-200/60 mt-2">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-400 hover:from-pink-600 hover:to-rose-500 text-white font-bold text-xs shadow-lg shadow-pink-300/60 transition-all flex items-center justify-center space-x-1.5 active:scale-98"
          >
            <Check className="w-4 h-4" />
            <span>完成调色</span>
          </button>
        </div>
      </div>
    </div>
  );
};
