import React from 'react';
import { PromptPreset } from '../types';
import { Sparkles, Wand2, ChevronRight } from 'lucide-react';

interface PresetBarProps {
  currentPreset?: PromptPreset;
  onOpenPresetModal: () => void;
  onSemiBlend: () => void;
}

export const PresetBar: React.FC<PresetBarProps> = ({
  currentPreset,
  onOpenPresetModal,
  onSemiBlend,
}) => {
  return (
    <div className="w-full px-3 py-1.5 flex items-center space-x-2">
      {/* 按钮一：选择预设按钮（点击弹出二级预设页面） */}
      <button
        onClick={onOpenPresetModal}
        className="flex-1 py-2.5 px-3 rounded-2xl glass-panel hover:bg-white/80 border border-pink-200/70 shadow-xs flex items-center justify-between transition-all active:scale-98 group"
      >
        <div className="flex items-center space-x-2 min-w-0">
          <div className="w-6 h-6 rounded-xl bg-pink-100 flex items-center justify-center text-pink-600 shrink-0">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div className="text-left truncate">
            <span className="text-[10px] text-slate-400 block leading-tight">当前预设风格</span>
            <span className="text-xs font-bold text-slate-800 truncate block">
              {currentPreset?.title || '选择预设'}
            </span>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-pink-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
      </button>

      {/* 按钮二：右侧并排的「半合成」预留功能按钮 */}
      <button
        onClick={onSemiBlend}
        className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-rose-400/90 via-pink-400/90 to-fuchsia-400/90 hover:from-rose-500 hover:to-fuchsia-500 text-white font-bold text-xs shadow-sm shadow-pink-300/40 border border-white/60 flex items-center space-x-1.5 active:scale-95 transition-all shrink-0"
      >
        <Wand2 className="w-3.5 h-3.5" />
        <span>半合成</span>
      </button>
    </div>
  );
};
