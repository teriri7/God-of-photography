import React, { useEffect, useRef } from 'react';
import { Layer } from '../types';
import { renderLayersComposite } from '../utils/canvasRenderer';
import { ImagePlus, Sparkles, Loader2, Eye, EyeOff } from 'lucide-react';

interface CanvasViewportProps {
  layers: Layer[];
  isGenerating: boolean;
  onPickImage: () => void;
  activeLayerId: string | null;
  aspectRatio: string;
}

export const CanvasViewport: React.FC<CanvasViewportProps> = ({
  layers,
  isGenerating,
  onPickImage,
  activeLayerId,
  aspectRatio,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // 根据画面比例计算容器样式
  const getAspectRatioPadding = () => {
    switch (aspectRatio) {
      case '1:1': return 'aspect-square';
      case '2:3': return 'aspect-[2/3]';
      case '3:2': return 'aspect-[3/2]';
      case '9:16': return 'aspect-[9/16]';
      case '16:9': return 'aspect-[16/9]';
      case '3:4': return 'aspect-[3/4]';
      case '4:3': return 'aspect-[4/3]';
      default: return 'aspect-square';
    }
  };

  // 当图层改变、可见性改变或滤镜改变时重新渲染
  useEffect(() => {
    if (!canvasRef.current || layers.length === 0) return;
    
    let isCancelled = false;
    const canvas = canvasRef.current;

    // 默认以第一个图层或标准高清尺寸为基准
    const baseLayer = layers[0];
    const width = baseLayer ? baseLayer.width : 1024;
    const height = baseLayer ? baseLayer.height : 1024;

    renderLayersComposite(layers, canvas, width, height).catch((err) => {
      if (!isCancelled) {
        console.error('Error rendering canvas composite:', err);
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [layers]);

  const hasLayers = layers.length > 0;
  const activeLayer = layers.find((l) => l.id === activeLayerId);

  return (
    <div className="relative w-full flex items-center justify-center p-3">
      {/* 画布外框包装器 */}
      <div className={`relative w-full max-w-[480px] ${getAspectRatioPadding()} max-h-[50vh] rounded-3xl overflow-hidden glass-panel p-1.5 shadow-xl shadow-pink-200/50 transition-all duration-300`}>
        {/* 透明棋盘格背景 */}
        <div className="relative w-full h-full rounded-[22px] overflow-hidden checkerboard-bg flex items-center justify-center">
          {hasLayers ? (
            <canvas
              ref={canvasRef}
              className="max-w-full max-h-full object-contain pointer-events-auto transition-transform duration-200"
            />
          ) : (
            /* 空状态：点击选择手机图片 */
            <div
              onClick={onPickImage}
              className="w-full h-full flex flex-col items-center justify-center p-6 text-center cursor-pointer group bg-gradient-to-b from-white/80 to-pink-50/70 hover:from-white/95 hover:to-pink-100/90 transition-all duration-300"
            >
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-pink-400 to-rose-300 flex items-center justify-center text-white shadow-lg shadow-pink-300/60 group-hover:scale-105 transition-transform duration-300 mb-3">
                <ImagePlus className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-slate-800 mb-1">
                打开图片或相册
              </h3>
              <p className="text-xs text-pink-500 max-w-[220px] leading-relaxed">
                轻触选择一张照片作为底层画布，开启 AI 图层与风格重绘
              </p>
              <div className="mt-4 px-4 py-1.5 rounded-full bg-pink-100 text-pink-600 text-xs font-semibold flex items-center space-x-1 border border-pink-200 group-hover:bg-pink-200 transition-colors">
                <Sparkles className="w-3.5 h-3.5" />
                <span>选择原图</span>
              </div>
            </div>
          )}

          {/* AI 生成中微光加载蒙层 */}
          {isGenerating && (
            <div className="absolute inset-0 bg-pink-900/30 backdrop-blur-md flex flex-col items-center justify-center p-6 z-20 text-white animate-in fade-in duration-300">
              <div className="relative mb-4">
                <div className="w-16 h-16 rounded-full border-4 border-white/20 border-t-pink-400 animate-spin flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-pink-300 animate-pulse" />
                </div>
              </div>
              <p className="text-sm font-bold text-white drop-shadow-sm tracking-wide">
                AI 正在渲染新图层...
              </p>
              <p className="text-[11px] text-pink-200 mt-1 max-w-[220px] text-center">
                调用多模态模型生图中，生成完毕将自动压入图层栈
              </p>
            </div>
          )}

          {/* 浮动当前图层提示胶囊 */}
          {hasLayers && activeLayer && (
            <div className="absolute bottom-2 left-2 right-2 px-3 py-1.5 rounded-full glass-panel-subtle flex items-center justify-between text-xs text-slate-700 pointer-events-none">
              <span className="font-medium truncate max-w-[150px]">
                当前图层: <strong className="text-pink-600 font-semibold">{activeLayer.name}</strong>
              </span>
              <div className="flex items-center space-x-2 text-[10px] text-slate-500 font-mono">
                <span>不透明度: {activeLayer.opacity}%</span>
                <span>{activeLayer.visible ? <Eye className="w-3 h-3 text-emerald-500 inline" /> : <EyeOff className="w-3 h-3 text-slate-400 inline" />}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
