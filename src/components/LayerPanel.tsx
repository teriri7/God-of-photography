import React from 'react';
import { Layer } from '../types';
import {
  Layers,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  Trash2,
  Sliders,
  Plus,
  X,
  Copy,
} from 'lucide-react';

interface LayerPanelProps {
  isOpen: boolean;
  onClose: () => void;
  layers: Layer[];
  activeLayerId: string | null;
  onSelectLayer: (id: string) => void;
  onToggleVisibility: (id: string) => void;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
  onDeleteLayer: (id: string) => void;
  onDuplicateLayer: (id: string) => void;
  onChangeOpacity: (id: string, opacity: number) => void;
  onChangeBlendMode: (id: string, blendMode: GlobalCompositeOperation) => void;
  onOpenColorGrading: (id: string) => void;
  onAddLayer: () => void;
}

export const LayerPanel: React.FC<LayerPanelProps> = ({
  isOpen,
  onClose,
  layers,
  activeLayerId,
  onSelectLayer,
  onToggleVisibility,
  onMoveUp,
  onMoveDown,
  onDeleteLayer,
  onDuplicateLayer,
  onChangeOpacity,
  onChangeBlendMode,
  onOpenColorGrading,
  onAddLayer,
}) => {
  if (!isOpen) return null;

  // PS 图层栈中，视觉上顶部的图层排在最上面（即数组索引最大者在最顶）
  const displayLayers = [...layers].reverse();

  return (
    <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      <div className="w-full max-w-xs h-full glass-panel border-l border-pink-200/60 shadow-2xl flex flex-col p-4 animate-in slide-in-from-right duration-200">
        {/* 面板头部 */}
        <div className="flex items-center justify-between pb-3 border-b border-pink-200/50">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-xl bg-pink-500 text-white flex items-center justify-center shadow-sm">
              <Layers className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-bold text-slate-800">图层面板 (Layers)</h2>
          </div>
          <div className="flex items-center space-x-1">
            <button
              onClick={onAddLayer}
              title="添加新图层"
              className="w-7 h-7 rounded-full bg-pink-100 text-pink-600 hover:bg-pink-200 flex items-center justify-center transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-full hover:bg-slate-200/60 text-slate-500 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 图层列表滚动区 */}
        <div className="flex-1 overflow-y-auto py-3 space-y-2.5 no-scrollbar">
          {layers.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-4">
              <p className="text-xs text-slate-400 mb-3">暂无图层</p>
              <button
                onClick={onAddLayer}
                className="px-3 py-1.5 rounded-full bg-pink-100 text-pink-600 text-xs font-semibold flex items-center space-x-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>导入底层图片</span>
              </button>
            </div>
          ) : (
            displayLayers.map((layer, index) => {
              const isActive = layer.id === activeLayerId;
              const originalIndex = layers.findIndex((l) => l.id === layer.id);
              const canMoveUp = originalIndex < layers.length - 1;
              const canMoveDown = originalIndex > 0;

              return (
                <div
                  key={layer.id}
                  onClick={() => onSelectLayer(layer.id)}
                  className={`p-2.5 rounded-2xl transition-all duration-200 border cursor-pointer ${
                    isActive
                      ? 'glass-card-active shadow-md'
                      : 'bg-white/60 hover:bg-white/90 border-pink-100'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    {/* 左侧：缩略图与图层名 */}
                    <div className="flex items-center space-x-2 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-100 border border-pink-200/60 shrink-0 checkerboard-bg">
                        <img
                          src={layer.sourceUrl}
                          alt={layer.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center space-x-1">
                          <span className="text-xs font-bold text-slate-800 truncate">
                            {layer.name}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {layer.width}×{layer.height}
                        </div>
                      </div>
                    </div>

                    {/* 右侧：显隐开关与调色按钮 */}
                    <div className="flex items-center space-x-1 shrink-0">
                      {/* 显隐 */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleVisibility(layer.id);
                        }}
                        title={layer.visible ? "隐藏图层" : "显示图层"}
                        className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors ${
                          layer.visible
                            ? 'text-pink-600 bg-pink-100/60'
                            : 'text-slate-400 bg-slate-100'
                        }`}
                      >
                        {layer.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      </button>

                      {/* 调色按钮 */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenColorGrading(layer.id);
                        }}
                        title="打开图层调色面板"
                        className="w-6 h-6 rounded-lg bg-pink-100 hover:bg-pink-200 text-pink-600 flex items-center justify-center transition-colors"
                      >
                        <Sliders className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* 图层属性快捷条：不透明度 */}
                  <div className="space-y-1.5 pt-1 border-t border-pink-100/50">
                    <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium">
                      <span>不透明度</span>
                      <span className="font-mono">{layer.opacity}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={layer.opacity}
                      onChange={(e) => onChangeOpacity(layer.id, Number(e.target.value))}
                      onClick={(e) => e.stopPropagation()}
                      className="w-full pink-slider"
                    />
                  </div>

                  {/* 图层操作按钮：上下移动、复制、删除 */}
                  <div className="flex items-center justify-between pt-2 text-[10px]">
                    <div className="flex items-center space-x-1">
                      <button
                        disabled={!canMoveUp}
                        onClick={(e) => {
                          e.stopPropagation();
                          onMoveUp(layer.id);
                        }}
                        title="上移一层"
                        className="px-1.5 py-1 rounded-md bg-white/70 hover:bg-pink-100 disabled:opacity-30 text-slate-600 flex items-center"
                      >
                        <ArrowUp className="w-3 h-3 mr-0.5" /> 上移
                      </button>
                      <button
                        disabled={!canMoveDown}
                        onClick={(e) => {
                          e.stopPropagation();
                          onMoveDown(layer.id);
                        }}
                        title="下移一层"
                        className="px-1.5 py-1 rounded-md bg-white/70 hover:bg-pink-100 disabled:opacity-30 text-slate-600 flex items-center"
                      >
                        <ArrowDown className="w-3 h-3 mr-0.5" /> 下移
                      </button>
                    </div>

                    <div className="flex items-center space-x-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDuplicateLayer(layer.id);
                        }}
                        title="复制图层"
                        className="p-1 rounded-md hover:bg-pink-100 text-slate-500 hover:text-pink-600 transition-colors"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteLayer(layer.id);
                        }}
                        title="删除图层"
                        className="p-1 rounded-md hover:bg-rose-100 text-slate-500 hover:text-rose-600 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
