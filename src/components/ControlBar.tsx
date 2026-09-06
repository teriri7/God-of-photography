import React, { useRef } from 'react';
import { Sparkles, ImagePlus, ChevronDown, Ratio, Maximize2, Cpu } from 'lucide-react';

interface ControlBarProps {
  models: string[];
  selectedModel: string;
  onChangeModel: (model: string) => void;
  aspectRatio: string;
  onChangeAspectRatio: (ratio: string) => void;
  resolutionMode: '1K' | '2K' | '4K';
  onChangeResolutionMode: (mode: '1K' | '2K' | '4K') => void;
  onPickImage: () => void;
  onStartGeneration: () => void;
  isGenerating: boolean;
  hasInputImage: boolean;
  autoDetectedRatio?: string | null;
}

const ASPECT_RATIOS = ['1:1', '2:3', '3:2', '3:4', '4:3', '9:16', '16:9'];
const RESOLUTION_OPTIONS: Array<{ value: '1K' | '2K' | '4K'; label: string }> = [
  { value: '1K', label: '1K' },
  { value: '2K', label: '2K' },
  { value: '4K', label: '4K' },
];

export const ControlBar: React.FC<ControlBarProps> = ({
  models,
  selectedModel,
  onChangeModel,
  aspectRatio,
  onChangeAspectRatio,
  resolutionMode,
  onChangeResolutionMode,
  onPickImage,
  onStartGeneration,
  isGenerating,
  hasInputImage,
  autoDetectedRatio,
}) => {
  return (
    <div className="w-full px-3 py-3 space-y-3 glass-panel border-t border-pink-200/60 shadow-lg">
      {/* 第一行：模型选择 & 参数快捷控制 */}
      <div className="space-y-2">
        {/* 模型下拉选择 */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1 text-pink-600 shrink-0 text-xs font-bold">
            <Cpu className="w-3.5 h-3.5" />
            <span>AI模型:</span>
          </div>
          <div className="relative flex-1">
            <select
              value={selectedModel}
              onChange={(e) => onChangeModel(e.target.value)}
              className="w-full glass-input appearance-none px-2.5 py-1.5 rounded-xl text-xs font-medium text-slate-800 pr-7 truncate"
            >
              {models.map((model) => (
                <option key={model} value={model}>
                  {model}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* 画面比例与分辨率快捷 Pill */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
          {/* 画面比例 */}
          <div className="flex items-center space-x-1 overflow-x-auto no-scrollbar py-0.5">
            <span className="text-[10px] text-slate-500 font-medium shrink-0 flex items-center mr-0.5">
              <Ratio className="w-3 h-3 text-pink-500 mr-0.5" /> 比例:
            </span>
            {ASPECT_RATIOS.map((ratio) => {
              const isSelected = aspectRatio === ratio;
              const isAuto = autoDetectedRatio === ratio;
              return (
                <button
                  key={ratio}
                  onClick={() => onChangeAspectRatio(ratio)}
                  className={`relative px-2 py-1 rounded-lg text-[10px] font-semibold shrink-0 transition-all ${
                    isSelected
                      ? 'bg-gradient-to-r from-pink-500 to-rose-400 text-white shadow-xs'
                      : 'bg-white/70 hover:bg-pink-100 text-slate-600 border border-pink-100'
                  }`}
                >
                  {ratio}
                  {isAuto && (
                    <span className="ml-1 text-[8px] bg-pink-100/90 text-pink-600 px-1 rounded-full font-bold">
                      原图
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* 分辨率 1K / 2K / 4K 模式 */}
          <div className="flex items-center space-x-1 shrink-0">
            <span className="text-[10px] text-slate-500 font-medium flex items-center mr-1">
              <Maximize2 className="w-3 h-3 text-pink-500 mr-0.5" /> 分辨率:
            </span>
            <div className="flex bg-pink-100/60 p-0.5 rounded-lg border border-pink-200/50">
              {RESOLUTION_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => onChangeResolutionMode(opt.value)}
                  className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold transition-all ${
                    resolutionMode === opt.value
                      ? 'bg-white text-pink-600 shadow-xs'
                      : 'text-slate-600 hover:text-pink-600'
                  }`}
                >
                  {opt.label}
                  {opt.value === '4K' && (
                    <span className="ml-0.5 text-[8px] text-amber-500 font-extrabold">★</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 第二行：核心交互按钮（打开图片 + 开始图生图大按钮） */}
      <div className="flex items-center space-x-2.5 pt-1">
        {/* 打开手机本地图片 */}
        <button
          onClick={onPickImage}
          className="flex-1 py-3 px-3 rounded-2xl glass-panel hover:bg-white/90 text-slate-700 font-bold text-xs flex items-center justify-center space-x-1.5 border border-pink-200 shadow-sm active:scale-95 transition-all"
        >
          <ImagePlus className="w-4 h-4 text-pink-500" />
          <span>{hasInputImage ? '更换图片' : '打开图片'}</span>
        </button>

        {/* 开始图生图处理 */}
        <button
          onClick={onStartGeneration}
          disabled={!hasInputImage || isGenerating}
          className="flex-[2] py-3 px-4 rounded-2xl bg-gradient-to-r from-pink-500 via-rose-400 to-pink-500 hover:from-pink-600 hover:to-rose-500 disabled:opacity-40 text-white font-bold text-xs shadow-lg shadow-pink-300/60 active:scale-95 transition-all flex items-center justify-center space-x-2 relative overflow-hidden group"
        >
          {/* 按钮微光流光效果 */}
          <div className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/25 to-transparent -skew-x-12 group-hover:translate-x-[250%] transition-transform duration-1000 ease-out" />
          
          <Sparkles className={`w-4 h-4 text-pink-100 ${isGenerating ? 'animate-spin' : 'animate-pulse'}`} />
          <span className="tracking-wide">
            {isGenerating ? 'AI 处理中...' : '开始生成并载入新图层'}
          </span>
        </button>
      </div>
    </div>
  );
};
