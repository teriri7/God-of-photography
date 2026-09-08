import React, { useState } from 'react';
import { PromptPreset } from '../types';
import { Sparkles, Camera, Zap, Palette, Wand2, Plus, Edit3, Trash2, Check, X } from 'lucide-react';

interface PresetModalProps {
  isOpen: boolean;
  onClose: () => void;
  presets: PromptPreset[];
  selectedPresetId: string;
  onSelectPreset: (preset: PromptPreset) => void;
  onUpdatePreset: (updatedPreset: PromptPreset) => void;
  onAddPreset: (newPreset: PromptPreset) => void;
  onDeletePreset: (presetId: string) => void;
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
  onAddPreset,
  onDeletePreset,
  customPrompt,
  onChangeCustomPrompt,
}) => {
  const [editingPreset, setEditingPreset] = useState<PromptPreset | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editSubtitle, setEditSubtitle] = useState('');
  const [editPrompt, setEditPrompt] = useState('');

  // 新增预设状态
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSubtitle, setNewSubtitle] = useState('');
  const [newPrompt, setNewPrompt] = useState('');

  if (!isOpen) return null;

  const renderIcon = (name: string) => {
    switch (name) {
      case 'Wand2': return <Wand2 className="w-4 h-4 text-rose-500" />;
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
    setEditSubtitle(preset.subtitle || '');
    setEditPrompt(preset.prompt);
  };

  const handleSaveEdit = () => {
    if (editingPreset) {
      onUpdatePreset({
        ...editingPreset,
        title: editTitle.trim() || editingPreset.title,
        subtitle: editSubtitle.trim() || editingPreset.subtitle,
        prompt: editPrompt.trim() || editingPreset.prompt,
      });
      setEditingPreset(null);
    }
  };

  const handleSaveNew = () => {
    if (!newTitle.trim() || !newPrompt.trim()) return;
    const newPreset: PromptPreset = {
      id: `preset-${Date.now()}`,
      title: newTitle.trim(),
      subtitle: newSubtitle.trim() || '自定义创意预设',
      prompt: newPrompt.trim(),
      iconName: 'Sparkles',
    };
    onAddPreset(newPreset);
    setIsAdding(false);
    setNewTitle('');
    setNewSubtitle('');
    setNewPrompt('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200 pt-[max(env(safe-area-inset-top,0px),24px)] pb-[max(env(safe-area-inset-bottom,0px),12px)]">
      <div className="w-full max-w-md glass-panel rounded-t-3xl sm:rounded-3xl shadow-2xl p-4 sm:p-5 border border-pink-200/80 animate-in slide-in-from-bottom-6 duration-200 flex flex-col max-h-[88vh]">
        {/* 顶部标题栏 */}
        <div className="flex items-center justify-between pb-2.5 border-b border-pink-200/60 shrink-0">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-pink-500 to-rose-400 flex items-center justify-center text-white shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">创意提示词预设库</h3>
              <p className="text-[10px] text-pink-500">一行一个上下滚动，支持自定义增删改</p>
            </div>
          </div>
          <div className="flex items-center space-x-1.5">
            <button
              onClick={() => setIsAdding(true)}
              className="px-2.5 py-1 rounded-full bg-pink-100 hover:bg-pink-200 text-pink-700 text-xs font-semibold flex items-center space-x-1 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>添加预设</span>
            </button>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 单行列表区域（一行一个，上下拉动） */}
        <div className="flex-1 overflow-y-auto py-2.5 space-y-2 no-scrollbar">
          {presets.map((preset) => {
            const isSelected = preset.id === selectedPresetId;
            return (
              <div
                key={preset.id}
                onClick={() => onSelectPreset(preset)}
                className={`p-3 rounded-2xl cursor-pointer transition-all border flex flex-col justify-between ${
                  isSelected
                    ? 'glass-card-active ring-1.5 ring-pink-400/80 shadow-sm'
                    : 'bg-white/60 hover:bg-white/85 border-pink-100/90'
                }`}
              >
                {/* 第一行：图标、标题、副标题与操作区 */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 min-w-0 flex-1">
                    <div className="w-7 h-7 rounded-lg bg-pink-100/80 flex items-center justify-center shrink-0">
                      {renderIcon(preset.iconName)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-1.5">
                        <h4 className="text-xs font-bold text-slate-800 truncate">
                          {preset.title}
                        </h4>
                        {isSelected && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-pink-500 text-white font-bold shrink-0">
                            当前生效
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-pink-600/80 truncate font-medium">
                        {preset.subtitle || '点击选用此风格'}
                      </p>
                    </div>
                  </div>

                  {/* 右侧编辑与删除按钮 */}
                  <div className="flex items-center space-x-1 shrink-0 ml-2">
                    <button
                      onClick={(e) => handleStartEdit(e, preset)}
                      title="编辑预设"
                      className="w-6 h-6 rounded-lg bg-white/70 hover:bg-pink-100 text-slate-500 hover:text-pink-600 flex items-center justify-center transition-colors"
                    >
                      <Edit3 className="w-3 h-3" />
                    </button>
                    {presets.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm(`确定删除预设「${preset.title}」吗？`)) {
                            onDeletePreset(preset.id);
                          }
                        }}
                        title="删除预设"
                        className="w-6 h-6 rounded-lg bg-white/70 hover:bg-rose-100 text-slate-400 hover:text-rose-600 flex items-center justify-center transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>

                {/* 第二行：提示词内容预览 */}
                <div className="mt-2 pt-1.5 border-t border-pink-100/40 text-[10px] text-slate-500 line-clamp-2 font-mono bg-pink-50/40 p-1.5 rounded-lg">
                  {preset.prompt}
                </div>
              </div>
            );
          })}
        </div>

        {/* 自由定制补充输入框 */}
        <div className="pt-2 border-t border-pink-200/50 shrink-0">
          <label className="text-[11px] font-bold text-slate-700 block mb-1">
            自由补充创意细节:
          </label>
          <div className="glass-panel p-2 rounded-2xl flex items-center space-x-2 border border-pink-200/50">
            <input
              type="text"
              value={customPrompt}
              onChange={(e) => onChangeCustomPrompt(e.target.value)}
              placeholder="在此补充微调内容（如：增加唯美樱花落瓣、特写发丝光影...）"
              className="w-full bg-transparent px-2 py-0.5 text-xs text-slate-700 placeholder-slate-400 outline-none"
            />
            {customPrompt && (
              <button
                onClick={() => onChangeCustomPrompt('')}
                className="text-slate-400 hover:text-pink-500 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* 底部关闭/确定按钮 */}
        <div className="pt-2.5 shrink-0">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-400 hover:from-pink-600 hover:to-rose-500 text-white font-bold text-xs shadow-md shadow-pink-300/50 transition-all flex items-center justify-center space-x-1.5 active:scale-98"
          >
            <Check className="w-4 h-4" />
            <span>完成选择并返回</span>
          </button>
        </div>

        {/* 新建预设弹窗 */}
        {isAdding && (
          <div className="fixed inset-0 z-60 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="w-full max-w-sm glass-panel p-4 rounded-3xl space-y-3 shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-800 flex items-center space-x-1">
                  <Plus className="w-3.5 h-3.5 text-pink-500" />
                  <span>添加新创意预设</span>
                </h4>
                <button onClick={() => setIsAdding(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div>
                <label className="text-[10px] font-semibold text-slate-500 block mb-1">预设标题</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="例如：赛博街景 / 洛丽塔茶会"
                  className="w-full glass-input px-2.5 py-1.5 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold text-slate-500 block mb-1">副标题描述</label>
                <input
                  type="text"
                  value={newSubtitle}
                  onChange={(e) => setNewSubtitle(e.target.value)}
                  placeholder="例如：冷暖交织 / 梦幻霓虹粒子"
                  className="w-full glass-input px-2.5 py-1.5 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold text-slate-500 block mb-1">提示词内容 (可填写 JSON 或自然语言)</label>
                <textarea
                  rows={4}
                  value={newPrompt}
                  onChange={(e) => setNewPrompt(e.target.value)}
                  placeholder="填写具体的生图提示词或指令结构..."
                  className="w-full glass-input px-2.5 py-1.5 rounded-xl text-xs resize-none font-mono"
                />
              </div>

              <div className="flex space-x-2 pt-1">
                <button
                  onClick={() => setIsAdding(false)}
                  className="flex-1 py-2 rounded-xl bg-slate-100 text-slate-600 text-xs font-semibold"
                >
                  取消
                </button>
                <button
                  onClick={handleSaveNew}
                  disabled={!newTitle.trim() || !newPrompt.trim()}
                  className="flex-1 py-2 rounded-xl bg-gradient-to-r from-pink-500 to-rose-400 disabled:opacity-40 text-white text-xs font-bold shadow-xs"
                >
                  添加保存
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 编辑单个预设的弹窗 */}
        {editingPreset && (
          <div className="fixed inset-0 z-60 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="w-full max-w-sm glass-panel p-4 rounded-3xl space-y-3 shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-800 flex items-center space-x-1">
                  <Edit3 className="w-3.5 h-3.5 text-pink-500" />
                  <span>编辑预设内容</span>
                </h4>
                <button onClick={() => setEditingPreset(null)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div>
                <label className="text-[10px] font-semibold text-slate-500 block mb-1">预设标题</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full glass-input px-2.5 py-1.5 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold text-slate-500 block mb-1">副标题描述</label>
                <input
                  type="text"
                  value={editSubtitle}
                  onChange={(e) => setEditSubtitle(e.target.value)}
                  className="w-full glass-input px-2.5 py-1.5 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold text-slate-500 block mb-1">提示词内容</label>
                <textarea
                  rows={4}
                  value={editPrompt}
                  onChange={(e) => setEditPrompt(e.target.value)}
                  className="w-full glass-input px-2.5 py-1.5 rounded-xl text-xs resize-none font-mono"
                />
              </div>

              <div className="flex space-x-2 pt-1">
                <button
                  onClick={() => setEditingPreset(null)}
                  className="flex-1 py-2 rounded-xl bg-slate-100 text-slate-600 text-xs font-semibold"
                >
                  取消
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="flex-1 py-2 rounded-xl bg-gradient-to-r from-pink-500 to-rose-400 text-white text-xs font-bold shadow-xs"
                >
                  保存修改
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
