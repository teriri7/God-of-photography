import React, { useState } from 'react';
import { PromptPreset } from '../types';
import { Sparkles, Camera, Zap, Palette, Edit3, Check, X } from 'lucide-react';

interface PromptPresetGridProps {
  presets: PromptPreset[];
  selectedPresetId: string;
  onSelectPreset: (preset: PromptPreset) => void;
  onUpdatePreset: (updatedPreset: PromptPreset) => void;
  customPrompt: string;
  onChangeCustomPrompt: (val: string) => void;
}

export const PromptPresetGrid: React.FC<PromptPresetGridProps> = ({
  presets,
  selectedPresetId,
  onSelectPreset,
  onUpdatePreset,
  customPrompt,
  onChangeCustomPrompt,
}) => {
  const [editingPreset, setEditingPreset] = useState<PromptPreset | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editPrompt, setEditPrompt] = useState('');

  const renderIcon = (name: string) => {
    switch (name) {
      case 'Sparkles': return <Sparkles className="w-4 h-4 text-pink-500" />;
      case 'Camera': return <Camera className="w-4 h-4 text-rose-500" />;
      case 'Zap': return <Zap className="w-4 h-4 text-amber-500" />;
      case 'Palette': return <Palette className="w-4 h-4 text-fuchsia-500" />;
      default: return <Sparkles className="w-4 h-4 text-pink-500" />;
    }
  };

  const handleStartEdit = (e: React.MouseEvent, preset: PromptPreset) => {
    e.stopPropagation();
    setEditingPreset(preset);
    setEditTitle(preset.title);
    setEditPrompt(preset.prompt);
  };

  const handleSaveEdit = () => {
    if (editingPreset) {
      onUpdatePreset({
        ...editingPreset,
        title: editTitle.trim() || editingPreset.title,
        prompt: editPrompt.trim() || editingPreset.prompt,
      });
      setEditingPreset(null);
    }
  };

  return (
    <div className="w-full px-3 py-2 space-y-2.5">
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-bold text-slate-700 flex items-center space-x-1">
          <Sparkles className="w-3.5 h-3.5 text-pink-500" />
          <span>创意风格预设 (2×2 格子)</span>
        </span>
        <span className="text-[10px] text-pink-400">点击选中 / 点笔编辑预设</span>
      </div>

      {/* 2*2 格子布局 */}
      <div className="grid grid-cols-2 gap-2.5">
        {presets.slice(0, 4).map((preset) => {
          const isSelected = preset.id === selectedPresetId;
          return (
            <div
              key={preset.id}
              onClick={() => onSelectPreset(preset)}
              className={`relative p-3 rounded-2xl cursor-pointer transition-all duration-200 flex flex-col justify-between min-h-[76px] ${
                isSelected
                  ? 'glass-card-active scale-[1.02]'
                  : 'glass-panel hover:bg-white/80 active:scale-95'
              }`}
            >
              {/* 卡片头部：图标与标题 */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1.5">
                  <div className="w-6 h-6 rounded-lg bg-pink-100 flex items-center justify-center">
                    {renderIcon(preset.iconName)}
                  </div>
                  <h4 className="text-xs font-bold text-slate-800 leading-tight">
                    {preset.title}
                  </h4>
                </div>
                {/* 编辑小按钮 */}
                <button
                  onClick={(e) => handleStartEdit(e, preset)}
                  title="编辑预设提示词"
                  className="w-5 h-5 rounded-full hover:bg-pink-200/60 flex items-center justify-center text-slate-400 hover:text-pink-600 transition-colors"
                >
                  <Edit3 className="w-3 h-3" />
                </button>
              </div>

              {/* 卡片描述 */}
              <p className="text-[10px] text-slate-500 mt-1 line-clamp-1">
                {preset.subtitle || preset.prompt}
              </p>

              {/* 选中高亮小角标 */}
              {isSelected && (
                <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-pink-500 ring-2 ring-pink-200 animate-pulse" />
              )}
            </div>
          );
        })}
      </div>

      {/* 自由补充提示词输入框 */}
      <div className="glass-panel p-2 rounded-2xl flex items-center space-x-2 border border-pink-200/50">
        <input
          type="text"
          value={customPrompt}
          onChange={(e) => onChangeCustomPrompt(e.target.value)}
          placeholder="补充自定义提示词（如：粉色发带、猫耳、梦幻花瓣...）"
          className="w-full bg-transparent px-2 py-1 text-xs text-slate-700 placeholder-slate-400 outline-none"
        />
        {customPrompt && (
          <button
            onClick={() => onChangeCustomPrompt('')}
            className="text-slate-400 hover:text-pink-500 p-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* 编辑预设的模态弹窗 */}
      {editingPreset && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm glass-panel p-5 rounded-3xl space-y-4 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800 flex items-center space-x-1.5">
                <Edit3 className="w-4 h-4 text-pink-500" />
                <span>自定义修改预设</span>
              </h3>
              <button
                onClick={() => setEditingPreset(null)}
                className="w-7 h-7 rounded-full bg-pink-100 flex items-center justify-center text-pink-600 hover:bg-pink-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  预设名称
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full glass-input px-3 py-2 rounded-xl text-xs text-slate-800"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  提示词内容
                </label>
                <textarea
                  rows={4}
                  value={editPrompt}
                  onChange={(e) => setEditPrompt(e.target.value)}
                  className="w-full glass-input px-3 py-2 rounded-xl text-xs text-slate-800 resize-none"
                />
              </div>
            </div>

            <div className="flex space-x-2 pt-1">
              <button
                onClick={() => setEditingPreset(null)}
                className="flex-1 py-2 rounded-xl bg-slate-100 text-slate-600 text-xs font-semibold hover:bg-slate-200 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSaveEdit}
                className="flex-1 py-2 rounded-xl bg-gradient-to-r from-pink-500 to-rose-400 text-white text-xs font-bold shadow-md shadow-pink-300/60 hover:from-pink-600 hover:to-rose-500 transition-all flex items-center justify-center space-x-1"
              >
                <Check className="w-3.5 h-3.5" />
                <span>保存预设</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
