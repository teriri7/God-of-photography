import React from 'react';
import { PromptPreset } from '../types';
import { Sparkles, Wand2, ChevronRight } from 'lucide-react';

interface PresetBarProps {
  currentPreset?: PromptPreset;
  onOpenPresetModal: () => void;
  onOpenSemiSynthesis: () => void;
}

export const PresetBar: React.FC<PresetBarProps> = ({
  currentPreset,
  onOpenPresetModal,
  onOpenSemiSynthesis,
}) => {
  return (
    <div className="w-full px-3 py-1 space-y-2">
      {/* 1. 单独放到预设上方的「半合成」核心功能按钮卡片 */}
      <button
        onClick={onOpenSemiSynthesis}
        className="w-full py-2.5 px-3.5 rounded-2xl bg-gradient-to-r from-pink-500/90 via-rose-500/90 to-fuchsia-500/90 hover:from-pink-600 hover:to-fuchsia-600 text-white font-bold text-xs shadow-md shadow-pink-300/50 border border-white/60 flex items-center justify-between active:scale-[0.98] transition-all group"
      >
        <div className="flex items-center space-x-2.5 min-w-0">
          <div className="w-7 h-7 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white shrink-0 group-hover:rotate-12 transition-transform">
            <Wand2 className="w-4 h-4" />
          </div>
          <div className="text-left truncate">
            <div className="flex items-center space-x-1.5">
              <span className="text-xs font-extrabold tracking-wide">半合成</span>
              <span className="text-[9px] px-1.5 py-0.2 bg-white/30 rounded-full font-semibold">
                场照除杂+角色布景
              </span>
            </div>
            <span className="text-[10px] text-pink-100 font-normal block truncate">
              一键除杂穿帮 → 识别角色特征 → 真实落地道具智能生成
            </span>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-white/80 group-hover:translate-x-1 transition-transform shrink-0" />
      </button>

      {/* 2. 下方的「选择预设」常规按钮 */}
      <button
        onClick={onOpenPresetModal}
        className="w-full py-2 px-3 rounded-2xl glass-panel hover:bg-white/80 border border-pink-200/70 shadow-xs flex items-center justify-between transition-all active:scale-[0.98] group"
      >
        <div className="flex items-center space-x-2 min-w-0">
          <div className="w-6 h-6 rounded-xl bg-pink-100 flex items-center justify-center text-pink-600 shrink-0">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div className="text-left truncate">
            <span className="text-[10px] text-slate-400 block leading-none mb-0.5">当前生图预设</span>
            <span className="text-xs font-bold text-slate-800 truncate block">
              {currentPreset?.title || '选择预设'}
            </span>
          </div>
        </div>
        <div className="flex items-center space-x-1 text-pink-500 text-xs font-semibold">
          <span className="text-[11px]">切换风格</span>
          <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </div>
      </button>
    </div>
  );
};
