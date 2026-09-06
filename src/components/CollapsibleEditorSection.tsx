import React, { useState } from 'react';
import { Layer, LayerFilterSettings, DEFAULT_FILTER_SETTINGS } from '../types';
import {
  Layers,
  Sliders,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  Trash2,
  Copy,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

interface CollapsibleEditorSectionProps {
  layers: Layer[];
  activeLayerId: string | null;
  onSelectLayer: (id: string) => void;
  onToggleVisibility: (id: string) => void;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
  onDeleteLayer: (id: string) => void;
  onDuplicateLayer: (id: string) => void;
  onChangeOpacity: (id: string, opacity: number) => void;
  onUpdateFilter: (layerId: string, filter: LayerFilterSettings) => void;
}

export const CollapsibleEditorSection: React.FC<CollapsibleEditorSectionProps> = ({
  layers,
  activeLayerId,
  onSelectLayer,
  onToggleVisibility,
  onMoveUp,
  onMoveDown,
  onDeleteLayer,
  onDuplicateLayer,
  onChangeOpacity,
  onUpdateFilter,
}) => {
  // 两个部分默认均为折叠状态
  const [isLayersOpen, setIsLayersOpen] = useState(false);
  const [isTonalOpen, setIsTonalOpen] = useState(false);

  const activeLayer = layers.find((l) => l.id === activeLayerId) || layers[layers.length - 1] || null;

  const handleFilterChange = (key: keyof LayerFilterSettings, val: number) => {
    if (!activeLayer) return;
    onUpdateFilter(activeLayer.id, {
      ...activeLayer.filter,
      [key]: val,
    });
  };

  const handleResetFilters = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!activeLayer) return;
    onUpdateFilter(activeLayer.id, { ...DEFAULT_FILTER_SETTINGS });
  };

  const displayLayers = [...layers].reverse();

  return (
    <div className="w-full px-3 py-1.5 space-y-2">
      {/* 1. 折叠栏：图层调整 */}
      <div className="glass-panel rounded-2xl overflow-hidden border border-pink-200/50 shadow-xs transition-all duration-200">
        <button
          onClick={() => setIsLayersOpen(!isLayersOpen)}
          className="w-full px-3.5 py-2.5 flex items-center justify-between hover:bg-white/40 active:bg-white/60 transition-colors"
        >
          <div className="flex items-center space-x-2">
            <div className="w-5 h-5 rounded-md bg-pink-100 text-pink-600 flex items-center justify-center">
              <Layers className="w-3 h-3" />
            </div>
            <span className="text-xs font-bold text-slate-800">图层调整</span>
            {layers.length > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 bg-pink-100 text-pink-600 font-bold rounded-full">
                {layers.length}
              </span>
            )}
          </div>
          <div className="flex items-center space-x-1.5 text-slate-400">
            <span className="text-[10px] text-pink-400">
              {isLayersOpen ? '点击收起' : '展开管理顺序/透明度'}
            </span>
            {isLayersOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </div>
        </button>

        {/* 图层展开内容 */}
        {isLayersOpen && (
          <div className="px-3 pb-3 pt-1 border-t border-pink-100/60 space-y-2 max-h-56 overflow-y-auto no-scrollbar animate-in slide-in-from-top-1 duration-150">
            {layers.length === 0 ? (
              <p className="text-[11px] text-slate-400 py-3 text-center">暂未导入图片图层</p>
            ) : (
              displayLayers.map((layer) => {
                const isActive = layer.id === activeLayer?.id;
                const origIdx = layers.findIndex((l) => l.id === layer.id);
                const canMoveUp = origIdx < layers.length - 1;
                const canMoveDown = origIdx > 0;

                return (
                  <div
                    key={layer.id}
                    onClick={() => onSelectLayer(layer.id)}
                    className={`p-2 rounded-xl transition-all border cursor-pointer ${
                      isActive
                        ? 'glass-card-active shadow-xs'
                        : 'bg-white/60 hover:bg-white/80 border-pink-100/80'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 min-w-0 flex-1">
                        <div className="w-8 h-8 rounded-lg overflow-hidden bg-slate-100 shrink-0 border border-pink-200/50 checkerboard-bg">
                          <img src={layer.sourceUrl} alt={layer.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] font-bold text-slate-800 truncate leading-tight">
                            {layer.name}
                          </p>
                          <span className="text-[9px] text-slate-400 font-mono">
                            {layer.width}×{layer.height}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-1 shrink-0">
                        {/* 显隐 */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleVisibility(layer.id);
                          }}
                          className={`w-6 h-6 rounded-md flex items-center justify-center transition-colors ${
                            layer.visible ? 'text-pink-600 bg-pink-100/70' : 'text-slate-400 bg-slate-100'
                          }`}
                        >
                          {layer.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3 text-slate-400" />}
                        </button>
                        {/* 上下移 */}
                        <button
                          disabled={!canMoveUp}
                          onClick={(e) => {
                            e.stopPropagation();
                            onMoveUp(layer.id);
                          }}
                          className="w-6 h-6 rounded-md bg-white/80 hover:bg-pink-100 disabled:opacity-20 flex items-center justify-center text-slate-600"
                        >
                          <ArrowUp className="w-3 h-3" />
                        </button>
                        <button
                          disabled={!canMoveDown}
                          onClick={(e) => {
                            e.stopPropagation();
                            onMoveDown(layer.id);
                          }}
                          className="w-6 h-6 rounded-md bg-white/80 hover:bg-pink-100 disabled:opacity-20 flex items-center justify-center text-slate-600"
                        >
                          <ArrowDown className="w-3 h-3" />
                        </button>
                        {/* 复制 */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDuplicateLayer(layer.id);
                          }}
                          className="w-6 h-6 rounded-md hover:bg-pink-100 text-slate-500 hover:text-pink-600 flex items-center justify-center"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                        {/* 删除 */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteLayer(layer.id);
                          }}
                          className="w-6 h-6 rounded-md hover:bg-rose-100 text-slate-400 hover:text-rose-600 flex items-center justify-center"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* 不透明度滑杆 */}
                    <div className="flex items-center space-x-2 pt-1.5 mt-1 border-t border-pink-100/50">
                      <span className="text-[9px] text-slate-500 font-medium shrink-0">
                        不透明度: <strong className="font-mono text-pink-600">{layer.opacity}%</strong>
                      </span>
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
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* 2. 折叠栏：画面影调调整 (Camera Raw) */}
      <div className="glass-panel rounded-2xl overflow-hidden border border-pink-200/50 shadow-xs transition-all duration-200">
        <button
          onClick={() => setIsTonalOpen(!isTonalOpen)}
          className="w-full px-3.5 py-2.5 flex items-center justify-between hover:bg-white/40 active:bg-white/60 transition-colors"
        >
          <div className="flex items-center space-x-2">
            <div className="w-5 h-5 rounded-md bg-pink-100 text-pink-600 flex items-center justify-center">
              <Sliders className="w-3 h-3" />
            </div>
            <span className="text-xs font-bold text-slate-800">画面影调 (Camera Raw)</span>
            {activeLayer && (
              <span className="text-[10px] text-pink-500 font-semibold truncate max-w-[90px]">
                {activeLayer.name}
              </span>
            )}
          </div>

          <div className="flex items-center space-x-1.5">
            {activeLayer && isTonalOpen && (
              <button
                onClick={handleResetFilters}
                title="重置当前图层影调"
                className="px-2 py-0.5 rounded-full bg-pink-100/80 hover:bg-pink-200 text-pink-700 text-[10px] font-semibold flex items-center space-x-0.5"
              >
                <RotateCcw className="w-2.5 h-2.5" />
                <span>重置</span>
              </button>
            )}
            <span className="text-[10px] text-pink-400">
              {isTonalOpen ? '点击收起' : '展开实时调色'}
            </span>
            {isTonalOpen ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
          </div>
        </button>

        {/* 影调展开内容：曝光、对比度、高光、阴影、白色、黑色、色温、色调、饱和度 */}
        {isTonalOpen && (
          <div className="px-3.5 pb-3 pt-2 border-t border-pink-100/60 space-y-3 max-h-64 overflow-y-auto no-scrollbar animate-in slide-in-from-top-1 duration-150">
            {!activeLayer ? (
              <p className="text-[11px] text-slate-400 py-3 text-center">请先导入图片后调节影调</p>
            ) : (
              <>
                {/* 1. 曝光 */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-medium text-slate-700">
                    <span>曝光 (Exposure)</span>
                    <span className="font-mono text-pink-600 font-bold">
                      {activeLayer.filter.exposure > 0 ? `+${activeLayer.filter.exposure}` : activeLayer.filter.exposure}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="-100"
                    max="100"
                    value={activeLayer.filter.exposure}
                    onChange={(e) => handleFilterChange('exposure', Number(e.target.value))}
                    className="w-full pink-slider"
                  />
                </div>

                {/* 2. 对比度 */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-medium text-slate-700">
                    <span>对比度 (Contrast)</span>
                    <span className="font-mono text-pink-600 font-bold">
                      {activeLayer.filter.contrast > 0 ? `+${activeLayer.filter.contrast}` : activeLayer.filter.contrast}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="-100"
                    max="100"
                    value={activeLayer.filter.contrast}
                    onChange={(e) => handleFilterChange('contrast', Number(e.target.value))}
                    className="w-full pink-slider"
                  />
                </div>

                {/* 3. 高光 */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-medium text-slate-700">
                    <span>高光 (Highlights)</span>
                    <span className="font-mono text-pink-600 font-bold">
                      {activeLayer.filter.highlights > 0 ? `+${activeLayer.filter.highlights}` : activeLayer.filter.highlights}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="-100"
                    max="100"
                    value={activeLayer.filter.highlights}
                    onChange={(e) => handleFilterChange('highlights', Number(e.target.value))}
                    className="w-full pink-slider"
                  />
                </div>

                {/* 4. 阴影 */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-medium text-slate-700">
                    <span>阴影 (Shadows)</span>
                    <span className="font-mono text-pink-600 font-bold">
                      {activeLayer.filter.shadows > 0 ? `+${activeLayer.filter.shadows}` : activeLayer.filter.shadows}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="-100"
                    max="100"
                    value={activeLayer.filter.shadows}
                    onChange={(e) => handleFilterChange('shadows', Number(e.target.value))}
                    className="w-full pink-slider"
                  />
                </div>

                {/* 5. 白色 */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-medium text-slate-700">
                    <span>白色 (Whites)</span>
                    <span className="font-mono text-pink-600 font-bold">
                      {activeLayer.filter.whites > 0 ? `+${activeLayer.filter.whites}` : activeLayer.filter.whites}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="-100"
                    max="100"
                    value={activeLayer.filter.whites}
                    onChange={(e) => handleFilterChange('whites', Number(e.target.value))}
                    className="w-full pink-slider"
                  />
                </div>

                {/* 6. 黑色 */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-medium text-slate-700">
                    <span>黑色 (Blacks)</span>
                    <span className="font-mono text-pink-600 font-bold">
                      {activeLayer.filter.blacks > 0 ? `+${activeLayer.filter.blacks}` : activeLayer.filter.blacks}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="-100"
                    max="100"
                    value={activeLayer.filter.blacks}
                    onChange={(e) => handleFilterChange('blacks', Number(e.target.value))}
                    className="w-full pink-slider"
                  />
                </div>

                {/* 7. 色温 */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-medium text-slate-700">
                    <span>色温 (冷蓝 / 暖橙)</span>
                    <span className="font-mono text-pink-600 font-bold">
                      {activeLayer.filter.temperature > 0 ? `+${activeLayer.filter.temperature}` : activeLayer.filter.temperature}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="-100"
                    max="100"
                    value={activeLayer.filter.temperature}
                    onChange={(e) => handleFilterChange('temperature', Number(e.target.value))}
                    className="w-full pink-slider"
                  />
                </div>

                {/* 8. 色调 */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-medium text-slate-700">
                    <span>色调 (偏绿 / 偏洋红)</span>
                    <span className="font-mono text-pink-600 font-bold">
                      {activeLayer.filter.tint > 0 ? `+${activeLayer.filter.tint}` : activeLayer.filter.tint}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="-100"
                    max="100"
                    value={activeLayer.filter.tint}
                    onChange={(e) => handleFilterChange('tint', Number(e.target.value))}
                    className="w-full pink-slider"
                  />
                </div>

                {/* 9. 饱和度 */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-medium text-slate-700">
                    <span>色彩饱和度 (Saturation)</span>
                    <span className="font-mono text-pink-600 font-bold">
                      {activeLayer.filter.saturation > 0 ? `+${activeLayer.filter.saturation}` : activeLayer.filter.saturation}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="-100"
                    max="100"
                    value={activeLayer.filter.saturation}
                    onChange={(e) => handleFilterChange('saturation', Number(e.target.value))}
                    className="w-full pink-slider"
                  />
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
