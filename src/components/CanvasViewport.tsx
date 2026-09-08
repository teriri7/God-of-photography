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
  isCompact?: boolean;
}

export const CanvasViewport: React.FC<CanvasViewportProps> = ({
  layers,
  isGenerating,
  onPickImage,
  activeLayerId,
  aspectRatio,
  isCompact = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // 根据画面比例计算 CSS aspectRatio 表达式，确保横屏、竖屏、方形均完美自适应视口高度
  const getAspectRatioValue = () => {
    switch (aspectRatio) {
      case '1:1': return '1 / 1';
      case '2:3': return '2 / 3';
      case '3:2': return '3 / 2';
      case '9:16': return '9 / 16';
      case '16:9': return '16 / 9';
      case '3:4': return '3 / 4';
      case '4:3': return '4 / 3';
      default: return '1 / 1';
    }
  };

  // 当图层改变、可见性改变或滤镜改变时重新渲染
  useEffect(() => {
    if (!canvasRef.current || layers.length === 0) return;
    
    let isCancelled = false;
    let animFrameId: number | null = null;
    const canvas = canvasRef.current;

    // 默认以第一个图层或标准高清尺寸为基准，但在交互视口中限制最大渲染尺寸以确保 60fps 流畅调色拖动
    const baseLayer = layers[0];
    const rawW = baseLayer ? baseLayer.width : 1024;
    const rawH = baseLayer ? baseLayer.height : 1024;

    const maxDim = 960;
    let width = rawW;
    let height = rawH;
    if (width > maxDim || height > maxDim) {
      if (width > height) {
        height = Math.round((height * maxDim) / width);
        width = maxDim;
      } else {
        width = Math.round((width * maxDim) / height);
        height = maxDim;
      }
    }

    animFrameId = requestAnimationFrame(() => {
      renderLayersComposite(layers, canvas, width, height).catch((err) => {
        if (!isCancelled) {
          console.error('Error rendering canvas composite:', err);
        }
      });
    });

    return () => {
      isCancelled = true;
      if (animFrameId) {
        cancelAnimationFrame(animFrameId);
      }
    };
  }, [layers]);

  const hasLayers = layers.length > 0;
  const activeLayer = layers.find((l) => l.id === activeLayerId);

  return (
    <div
      className={`relative w-full flex items-center justify-center px-3 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        isCompact ? 'h-[235px] py-1' : 'h-[290px] py-1.5'
      }`}
    >
      {/* 画布外框包装器：展开调色/图层时自适应平滑缩小至约 80% 大小 */}
      <div
        style={{ aspectRatio: getAspectRatioValue() }}
        className={`relative h-full max-h-full max-w-full rounded-3xl overflow-hidden glass-panel p-1.5 shadow-xl shadow-pink-200/50 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] flex items-center justify-center ${
          isCompact ? 'ring-2 ring-pink-400/50 shadow-pink-300/40' : ''
        }`}
      >
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
            <div
              className={`absolute bottom-2 left-2 right-2 px-2.5 py-1 rounded-full glass-panel-subtle flex items-center justify-between text-slate-700 pointer-events-none transition-all ${
                isCompact ? 'text-[9px] py-0.5' : 'text-xs'
              }`}
            >
              <span className="font-medium truncate max-w-[130px]">
                当前: <strong className="text-pink-600 font-semibold">{activeLayer.name}</strong>
              </span>
              <div className="flex items-center space-x-1.5 text-[10px] text-slate-500 font-mono">
                <span>{activeLayer.opacity}%</span>
                <span>{activeLayer.visible ? <Eye className="w-2.5 h-2.5 text-emerald-500 inline" /> : <EyeOff className="w-2.5 h-2.5 text-slate-400 inline" />}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
