import React, { useState } from 'react';
import { PromptPreset } from '../types';
import { Sparkles, Camera, Zap, Palette, Edit3, Check, X } from 'lucide-react';

interface PresetModalProps {
  isOpen: boolean;
  onClose: () => void;
  presets: PromptPreset[];
  selectedPresetId: string;
  onSelectPreset: (preset: PromptPreset) => void;
  onUpdatePreset: (updatedPreset: PromptPreset) => void;
  customPrompt: string;
  onChangeCustomPrompt: (val: string) => void;
}

export const PresetModal: React.FC<PresetModalProps> = ({
  isOpen,
  onClose,
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

  if (!isOpen) return null;

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
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md glass-panel rounded-t-3xl sm:rounded-3xl shadow-2xl p-5 border border-pink-200/80 animate-in slide-in-from-bottom-6 duration-200 flex flex-col max-h-[85vh]">
        {/* 顶部标题栏 */}
        <div className="flex items-center justify-between pb-3 border-b border-pink-200/60">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-pink-500 to-rose-400 flex items-center justify-center text-white shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">选择创意提示词预设</h3>
              <p className="text-[10px] text-pink-500">点击任意卡片选定生图风格，点笔图标可自定义</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 预设卡片列表 */}
        <div className="flex-1 overflow-y-auto py-3 space-y-2.5 no-scrollbar">
          <div className="grid grid-cols-2 gap-2.5">
            {presets.map((preset) => {
              const isSelected = preset.id === selectedPresetId;
              return (
                <div
                  key={preset.id}
                  onClick={() => {
                    onSelectPreset(preset);
                  }}
                  className={`relative p-3 rounded-2xl cursor-pointer transition-all duration-200 flex flex-col justify-between min-h-[80px] ${
                    isSelected
                      ? 'glass-card-active scale-[1.02] ring-2 ring-pink-400/50'
                      : 'glass-panel hover:bg-white/80 active:scale-95'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1.5">
                      <div className="w-6 h-6 rounded-lg bg-pink-100 flex items-center justify-center">
                        {renderIcon(preset.iconName)}
                      </div>
                      <h4 className="text-xs font-bold text-slate-800 leading-tight">
                        {preset.title}
                      </h4>
                    </div>
                    <button
                      onClick={(e) => handleStartEdit(e, preset)}
                      title="编辑预设提示词"
                      className="w-5 h-5 rounded-full hover:bg-pink-200/60 flex items-center justify-center text-slate-400 hover:text-pink-600 transition-colors"
                    >
                      <Edit3 className="w-3 h-3" />
                    </button>
                  </div>

                  <p className="text-[10px] text-slate-500 mt-1.5 line-clamp-2">
                    {preset.subtitle || preset.prompt}
                  </p>

                  {isSelected && (
                    <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-pink-500 ring-2 ring-pink-200 animate-pulse" />
                  )}
                </div>
              );
            })}
          </div>

          {/* 自由补充提示词 */}
          <div className="pt-2">
            <label className="text-[11px] font-bold text-slate-700 block mb-1">
              自由补充定制提示词:
            </label>
            <div className="glass-panel p-2 rounded-2xl flex items-center space-x-2 border border-pink-200/50">
              <input
                type="text"
                value={customPrompt}
                onChange={(e) => onChangeCustomPrompt(e.target.value)}
                placeholder="补充你的创意细节（例如：樱花花瓣飘落、粉色光晕...）"
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
          </div>
        </div>

        {/* 底部确定按钮 */}
        <div className="pt-3 border-t border-pink-200/60">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-400 hover:from-pink-600 hover:to-rose-500 text-white font-bold text-xs shadow-md shadow-pink-300/50 transition-all flex items-center justify-center space-x-1.5 active:scale-98"
          >
            <Check className="w-4 h-4" />
            <span>选定预设并返回</span>
          </button>
        </div>

        {/* 编辑单个预设的弹窗 */}
        {editingPreset && (
          <div className="fixed inset-0 z-60 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="w-full max-w-xs glass-panel p-4 rounded-3xl space-y-3 shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-800 flex items-center space-x-1">
                  <Edit3 className="w-3.5 h-3.5 text-pink-500" />
                  <span>编辑预设词</span>
                </h4>
                <button onClick={() => setEditingPreset(null)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div>
                <label className="text-[10px] font-semibold text-slate-500 block mb-1">名称</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full glass-input px-2.5 py-1.5 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold text-slate-500 block mb-1">提示词内容</label>
                <textarea
                  rows={3}
                  value={editPrompt}
                  onChange={(e) => setEditPrompt(e.target.value)}
                  className="w-full glass-input px-2.5 py-1.5 rounded-xl text-xs resize-none"
                />
              </div>

              <div className="flex space-x-2 pt-1">
                <button
                  onClick={() => setEditingPreset(null)}
                  className="flex-1 py-1.5 rounded-xl bg-slate-100 text-slate-600 text-xs font-semibold"
                >
                  取消
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="flex-1 py-1.5 rounded-xl bg-pink-500 text-white text-xs font-bold shadow-xs"
                >
                  保存
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
