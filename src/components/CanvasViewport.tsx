import React, { useEffect, useRef, useState } from 'react';
import { Layer, LayerTransform, DEFAULT_LAYER_TRANSFORM } from '../types';
import { renderLayersComposite } from '../utils/canvasRenderer';
import { ImagePlus, Sparkles, Eye, EyeOff, ZoomIn, ZoomOut, RotateCcw, Move } from 'lucide-react';

interface CanvasViewportProps {
  layers: Layer[];
  isGenerating: boolean;
  onPickImage: () => void;
  activeLayerId: string | null;
  aspectRatio: string;
  isCompact?: boolean;
  onUpdateLayerTransform?: (layerId: string, transform: LayerTransform) => void;
}

export const CanvasViewport: React.FC<CanvasViewportProps> = ({
  layers,
  isGenerating,
  onPickImage,
  activeLayerId,
  aspectRatio,
  isCompact = false,
  onUpdateLayerTransform,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // 交互式图层位移与缩放手势状态
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [initialTransform, setInitialTransform] = useState<LayerTransform | null>(null);
  const [pinchDist, setPinchDist] = useState<number | null>(null);
  const [initialPinchScale, setInitialPinchScale] = useState<number>(1);

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

  // 当图层改变、可见性改变、滤镜改变或位移缩放改变时重新渲染
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
  const activeLayer = layers.find((l) => l.id === activeLayerId) || layers[layers.length - 1] || null;

  // 单指/鼠标拖动活跃图层
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!activeLayer || !onUpdateLayerTransform || !hasLayers) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    // 只有单张底图时，触摸不抢占指针，让移动端能顺畅上下滑动浏览菜单栏
    if (e.pointerType === 'touch' && layers.length <= 1) return;
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {}
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setInitialTransform(activeLayer.transform || { ...DEFAULT_LAYER_TRANSFORM });
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || !dragStart || !initialTransform || !activeLayer || !onUpdateLayerTransform || !canvasRef.current) return;
    const canvasRect = canvasRef.current.getBoundingClientRect();
    const baseWidth = layers[0]?.width || 1024;
    const scaleFactor = canvasRect.width > 0 ? baseWidth / canvasRect.width : 1;

    const dx = (e.clientX - dragStart.x) * scaleFactor;
    const dy = (e.clientY - dragStart.y) * scaleFactor;

    onUpdateLayerTransform(activeLayer.id, {
      ...initialTransform,
      x: Math.round(initialTransform.x + dx),
      y: Math.round(initialTransform.y + dy),
    });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(false);
    setDragStart(null);
    setInitialTransform(null);
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
  };

  // 双指捏合缩放 (Touch Pinch)
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2 && activeLayer) {
      const d = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      setPinchDist(d);
      setInitialPinchScale(activeLayer.transform?.scale || 1);
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2 && activeLayer && pinchDist && onUpdateLayerTransform) {
      const d = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const scaleRatio = d / pinchDist;
      const newScale = Math.max(0.1, Math.min(5.0, Number((initialPinchScale * scaleRatio).toFixed(2))));
      const currentTransform = activeLayer.transform || { ...DEFAULT_LAYER_TRANSFORM };
      onUpdateLayerTransform(activeLayer.id, {
        ...currentTransform,
        scale: newScale,
      });
    }
  };

  const handleTouchEnd = () => {
    setPinchDist(null);
  };

  // PC 鼠标滚轮缩放
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (!activeLayer || !onUpdateLayerTransform) return;
    const currentTransform = activeLayer.transform || { ...DEFAULT_LAYER_TRANSFORM };
    const factor = e.deltaY < 0 ? 1.06 : 0.94;
    const newScale = Math.max(0.1, Math.min(5.0, Number((currentTransform.scale * factor).toFixed(2))));
    onUpdateLayerTransform(activeLayer.id, {
      ...currentTransform,
      scale: newScale,
    });
  };

  // 缩放按钮交互 (+/- 10%)
  const handleZoom = (delta: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!activeLayer || !onUpdateLayerTransform) return;
    const currentTransform = activeLayer.transform || { ...DEFAULT_LAYER_TRANSFORM };
    const newScale = Math.max(0.1, Math.min(5.0, Number((currentTransform.scale + delta).toFixed(2))));
    onUpdateLayerTransform(activeLayer.id, {
      ...currentTransform,
      scale: newScale,
    });
  };

  // 复位变换
  const handleResetTransform = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!activeLayer || !onUpdateLayerTransform) return;
    onUpdateLayerTransform(activeLayer.id, { ...DEFAULT_LAYER_TRANSFORM });
  };

  return (
    <div
      className={`relative w-full flex items-center justify-center px-3 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] shrink-0 ${
        isCompact ? 'h-[300px] py-1' : 'h-[390px] max-h-[52vh] py-1.5'
      }`}
    >
      {/* 画布外框包装器：触控与手势自由缩放移动贴纸，未拖拽时支持上下拉动手势浏览菜单栏 */}
      <div
        style={{ aspectRatio: getAspectRatioValue() }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onWheel={handleWheel}
        className={`relative h-full max-h-full max-w-full rounded-3xl overflow-hidden glass-panel p-1.5 shadow-xl shadow-pink-200/50 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] flex items-center justify-center ${
          hasLayers ? (isDragging ? 'cursor-grabbing touch-none' : 'cursor-grab touch-pan-y') : 'touch-pan-y'
        } ${isCompact ? 'ring-2 ring-pink-400/50 shadow-pink-300/40' : ''}`}
      >
        {/* 透明棋盘格背景 */}
        <div className="relative w-full h-full rounded-[22px] overflow-hidden checkerboard-bg flex items-center justify-center select-none">
          {hasLayers ? (
            <canvas
              ref={canvasRef}
              className="max-w-full max-h-full object-contain pointer-events-none transition-transform duration-100"
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

          {/* 右上角悬浮变换快捷工具条（仅在有多图层或活跃图层有位移/缩放时展示） */}
          {hasLayers && activeLayer && (
            <div className="absolute top-2 right-2 flex items-center space-x-1 bg-black/55 backdrop-blur-md px-2 py-1 rounded-full text-white text-[10px] font-bold shadow-md z-20 border border-white/20 select-none">
              <button
                onClick={(e) => handleZoom(-0.1, e)}
                title="缩小图层"
                className="w-5 h-5 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center active:scale-90"
              >
                <ZoomOut className="w-3 h-3" />
              </button>
              <span className="font-mono text-pink-300 px-1 min-w-[34px] text-center text-[10px]">
                {Math.round((activeLayer.transform?.scale || 1) * 100)}%
              </span>
              <button
                onClick={(e) => handleZoom(0.1, e)}
                title="放大图层"
                className="w-5 h-5 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center active:scale-90"
              >
                <ZoomIn className="w-3 h-3" />
              </button>
              {(activeLayer.transform?.x !== 0 || activeLayer.transform?.y !== 0 || (activeLayer.transform?.scale && activeLayer.transform.scale !== 1)) && (
                <button
                  onClick={handleResetTransform}
                  title="复位位置与缩放"
                  className="w-5 h-5 rounded-full bg-rose-500/80 hover:bg-rose-600 flex items-center justify-center active:scale-90 ml-0.5"
                >
                  <RotateCcw className="w-2.5 h-2.5" />
                </button>
              )}
            </div>
          )}

          {/* AI 生成中微光加载蒙层 */}
          {isGenerating && (
            <div className="absolute inset-0 bg-pink-900/30 backdrop-blur-md flex flex-col items-center justify-center p-6 z-30 text-white animate-in fade-in duration-300">
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
              className={`absolute bottom-2 left-2 right-2 px-2.5 py-1 rounded-full glass-panel-subtle flex items-center justify-between text-slate-700 pointer-events-none transition-all z-20 ${
                isCompact ? 'text-[9px] py-0.5' : 'text-xs'
              }`}
            >
              <div className="flex items-center space-x-1.5 truncate max-w-[170px]">
                <Move className="w-3 h-3 text-pink-500 shrink-0" />
                <span className="font-medium truncate">
                  当前: <strong className="text-pink-600 font-semibold">{activeLayer.name}</strong>
                </span>
              </div>
              <div className="flex items-center space-x-1.5 text-[10px] text-slate-500 font-mono shrink-0">
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
