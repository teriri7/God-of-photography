import React, { useEffect, useRef, useState } from 'react';
import { Layer, LayerTransform, DEFAULT_LAYER_TRANSFORM } from '../types';
import {
  renderLayersComposite,
  screenToLayerCoords,
  screenToLayerRadius,
  drawMaskBrushStroke,
} from '../utils/canvasRenderer';
import {
  ImagePlus,
  Sparkles,
  Eye,
  EyeOff,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Move,
  Paintbrush,
  Lock,
  Check,
  RotateCw,
} from 'lucide-react';

interface CanvasViewportProps {
  layers: Layer[];
  isGenerating: boolean;
  onPickImage: () => void;
  activeLayerId: string | null;
  aspectRatio: string;
  isCompact?: boolean;
  onUpdateLayerTransform?: (layerId: string, transform: LayerTransform) => void;
  // 蒙版与画笔控制
  isBrushActive?: boolean;
  onToggleBrush?: (active?: boolean) => void;
  onUpdateLayerMask?: (layerId: string, maskDataUrl: string) => void;
  onAddMask?: (layerId: string) => void;
}

export const CanvasViewport: React.FC<CanvasViewportProps> = ({
  layers,
  isGenerating,
  onPickImage,
  activeLayerId,
  aspectRatio,
  isCompact = false,
  onUpdateLayerTransform,
  isBrushActive = false,
  onToggleBrush,
  onUpdateLayerMask,
  onAddMask,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // 蒙版画笔专属状态
  const [brushColor, setBrushColor] = useState<'black' | 'white'>('black');
  const [brushSize, setBrushSize] = useState<number>(36);
  const brushHardness = 0.5; // 固定 50% 柔边硬度
  const [isPainting, setIsPainting] = useState<boolean>(false);
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const activeMaskCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

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

  const hasLayers = layers.length > 0;
  const activeLayer = layers.find((l) => l.id === activeLayerId) || layers[layers.length - 1] || null;

  // 快捷刷新 Composite 画布
  const triggerCanvasRedraw = () => {
    if (!canvasRef.current || layers.length === 0) return;
    const canvas = canvasRef.current;
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
    renderLayersComposite(layers, canvas, width, height).catch((err) => {
      console.error('Error rendering canvas composite:', err);
    });
  };

  // 当图层改变、可见性改变、滤镜改变或位移缩放改变时重新渲染
  useEffect(() => {
    if (!canvasRef.current || layers.length === 0) return;
    
    let isCancelled = false;
    let animFrameId: number | null = null;
    const canvas = canvasRef.current;

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

  // 当活跃图层存在 maskDataUrl 但未初始化内存 maskCanvas 时，异步装载
  useEffect(() => {
    if (!activeLayer) return;
    if (activeLayer.maskDataUrl && !(activeLayer as any).maskCanvas) {
      const img = new Image();
      img.onload = () => {
        const mCanvas = document.createElement('canvas');
        mCanvas.width = activeLayer.width;
        mCanvas.height = activeLayer.height;
        const mCtx = mCanvas.getContext('2d');
        if (mCtx) {
          mCtx.drawImage(img, 0, 0);
        }
        (activeLayer as any).maskCanvas = mCanvas;
        triggerCanvasRedraw();
      };
      img.src = activeLayer.maskDataUrl;
    }
  }, [activeLayer?.id, activeLayer?.maskDataUrl]);

  // 指针按下 (支持蒙版涂抹或移动图层)
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!activeLayer || !hasLayers) return;

    // 检查点击目标：如果是任何按钮或控制元素，不要拦截其点击
    const targetElement = e.target as HTMLElement;
    if (targetElement.closest('button, input, select, textarea, [role="button"]')) {
      return;
    }

    // 1. 如果蒙版画笔处于激活状态：锁定图片，完全禁止拖拽缩放
    if (isBrushActive) {
      e.preventDefault();
      try {
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      } catch {}

      // 确保蒙版画布已就绪
      let maskCanvas = (activeLayer as any).maskCanvas as HTMLCanvasElement | undefined;
      if (!maskCanvas) {
        maskCanvas = document.createElement('canvas');
        maskCanvas.width = activeLayer.width;
        maskCanvas.height = activeLayer.height;
        const mCtx = maskCanvas.getContext('2d');
        if (mCtx) {
          if (activeLayer.maskDataUrl) {
            const img = new Image();
            img.onload = () => {
              mCtx.drawImage(img, 0, 0);
              triggerCanvasRedraw();
            };
            img.src = activeLayer.maskDataUrl;
          } else {
            mCtx.fillStyle = '#ffffff';
            mCtx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);
          }
        }
        (activeLayer as any).maskCanvas = maskCanvas;
      }

      setIsPainting(true);
      activeMaskCanvasRef.current = maskCanvas;

      if (canvasRef.current) {
        const coords = screenToLayerCoords(
          e.clientX,
          e.clientY,
          canvasRef.current,
          activeLayer,
          layers[0]?.width || 1024,
          layers[0]?.height || 1024
        );
        if (coords) {
          lastPointRef.current = coords;
          const mCtx = maskCanvas.getContext('2d');
          if (mCtx) {
            const r = screenToLayerRadius(brushSize / 2, canvasRef.current, activeLayer);
            drawMaskBrushStroke(
              mCtx,
              coords.x,
              coords.y,
              coords.x,
              coords.y,
              r,
              brushColor === 'black',
              brushHardness
            );
            triggerCanvasRedraw();
          }
        }
      }

      setCursorPos({ x: e.clientX, y: e.clientY });
      return;
    }

    // 2. 正常图层位移手势 (画笔未激活时)
    if (!onUpdateLayerTransform) return;
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

  // 指针移动 (画笔涂抹或图层拖拽)
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    // 1. 蒙版画笔模式
    if (isBrushActive) {
      setCursorPos({ x: e.clientX, y: e.clientY });
      if (!isPainting || !activeLayer || !canvasRef.current) return;

      const maskCanvas = activeMaskCanvasRef.current || (activeLayer as any).maskCanvas;
      if (!maskCanvas) return;
      const mCtx = maskCanvas.getContext('2d');
      if (!mCtx) return;

      const coords = screenToLayerCoords(
        e.clientX,
        e.clientY,
        canvasRef.current,
        activeLayer,
        layers[0]?.width || 1024,
        layers[0]?.height || 1024
      );
      if (!coords) return;

      const p0 = lastPointRef.current || coords;
      const r = screenToLayerRadius(brushSize / 2, canvasRef.current, activeLayer);
      drawMaskBrushStroke(
        mCtx,
        p0.x,
        p0.y,
        coords.x,
        coords.y,
        r,
        brushColor === 'black',
        brushHardness
      );
      lastPointRef.current = coords;
      triggerCanvasRedraw();
      return;
    }

    // 2. 正常图层位移手势
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

  // 指针抬起
  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isBrushActive) {
      if (isPainting && activeLayer) {
        setIsPainting(false);
        lastPointRef.current = null;
        const maskCanvas = activeMaskCanvasRef.current || (activeLayer as any).maskCanvas;
        if (maskCanvas && onUpdateLayerMask) {
          const maskDataUrl = maskCanvas.toDataURL('image/png');
          onUpdateLayerMask(activeLayer.id, maskDataUrl);
        }
      }
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {}
      return;
    }

    setIsDragging(false);
    setDragStart(null);
    setInitialTransform(null);
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
  };

  // 双指捏合缩放 (Touch Pinch) - 画笔激活时严格锁定
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (isBrushActive) return; // 锁定图片，禁止缩放
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
    if (isBrushActive) return; // 锁定图片，禁止缩放
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

  // PC 鼠标滚轮缩放 - 画笔激活时严格锁定
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (isBrushActive) return; // 锁定图片，禁止滚轮缩放
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
    if (isBrushActive) return;
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
    if (isBrushActive) return;
    if (!activeLayer || !onUpdateLayerTransform) return;
    onUpdateLayerTransform(activeLayer.id, { ...DEFAULT_LAYER_TRANSFORM });
  };

  return (
    <div className="w-full flex flex-col items-center justify-start shrink-0">
      {/* 1. 独立置于图片窗口上方的蒙版画笔专属控制条 (绝不遮挡图片内容，点击零冲突) */}
      {isBrushActive && (
        <div
          onPointerDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          className="w-full px-3 mb-1.5 shrink-0 z-30 animate-in fade-in slide-in-from-top-2 duration-200"
        >
          <div className="w-full p-2.5 rounded-2xl bg-slate-900/90 backdrop-blur-xl border border-pink-400/40 text-white shadow-xl shadow-pink-500/15 flex flex-col gap-2">
            {/* 第一行：标题、锁定状态、硬度 50% 与 完成退出按钮 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                <div className="flex items-center space-x-1.5">
                  <Paintbrush className="w-3.5 h-3.5 text-pink-400" />
                  <span className="text-xs font-bold text-pink-200">蒙版画笔</span>
                </div>
                <div className="flex items-center space-x-1 px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-[10px] font-semibold border border-amber-500/30">
                  <Lock className="w-2.5 h-2.5" />
                  <span>画布已锁定</span>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-white/10 text-pink-200 font-semibold">
                  硬度 50%
                </span>
              </div>

              <button
                type="button"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleBrush?.(false);
                }}
                className="px-3 py-1 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white text-xs font-bold flex items-center space-x-1 shadow-md shadow-pink-500/30 active:scale-95 transition-transform shrink-0 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>完成</span>
              </button>
            </div>

            {/* 第二行：黑透 / 白不透切换与画笔粗细 */}
            <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-white/10">
              <div className="flex items-center space-x-1.5 shrink-0">
                <button
                  type="button"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    setBrushColor('black');
                  }}
                  className={`px-2.5 py-1 rounded-lg flex items-center space-x-1.5 text-[11px] font-semibold transition-all cursor-pointer ${
                    brushColor === 'black'
                      ? 'bg-black text-white ring-2 ring-pink-400 shadow-md scale-105'
                      : 'bg-white/10 text-slate-300 hover:bg-white/20'
                  }`}
                >
                  <span className="w-3 h-3 rounded-full bg-black border border-white inline-block shrink-0" />
                  <span>黑透 (擦除)</span>
                </button>
                <button
                  type="button"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    setBrushColor('white');
                  }}
                  className={`px-2.5 py-1 rounded-lg flex items-center space-x-1.5 text-[11px] font-semibold transition-all cursor-pointer ${
                    brushColor === 'white'
                      ? 'bg-white text-slate-900 ring-2 ring-pink-400 shadow-md scale-105 font-bold'
                      : 'bg-white/10 text-slate-300 hover:bg-white/20'
                  }`}
                >
                  <span className="w-3 h-3 rounded-full bg-white border border-slate-400 inline-block shrink-0" />
                  <span>白不透 (恢复)</span>
                </button>
              </div>

              {/* 粗细调节滑杆 */}
              <div className="flex items-center space-x-2 flex-1 max-w-[150px]">
                <span className="text-[10px] text-pink-300 shrink-0 font-mono">
                  {brushSize}px
                </span>
                <input
                  type="range"
                  min="8"
                  max="120"
                  value={brushSize}
                  onPointerDown={(e) => e.stopPropagation()}
                  onChange={(e) => setBrushSize(Number(e.target.value))}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full pink-slider cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. 图片视窗区域 */}
      <div
        className={`relative w-full flex items-center justify-center px-3 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] shrink-0 ${
          isBrushActive
            ? 'h-[330px] max-h-[46vh] py-0.5'
            : isCompact
            ? 'h-[300px] py-1'
            : 'h-[390px] max-h-[52vh] py-1.5'
        }`}
      >
        <div
          ref={containerRef}
          style={{ aspectRatio: getAspectRatioValue() }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onPointerLeave={() => {
            setCursorPos(null);
            if (isPainting && activeLayer) {
              setIsPainting(false);
              lastPointRef.current = null;
              const maskCanvas = activeMaskCanvasRef.current || (activeLayer as any).maskCanvas;
              if (maskCanvas && onUpdateLayerMask) {
                const maskDataUrl = maskCanvas.toDataURL('image/png');
                onUpdateLayerMask(activeLayer.id, maskDataUrl);
              }
            }
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onWheel={handleWheel}
          className={`relative h-full max-h-full max-w-full rounded-3xl overflow-hidden glass-panel p-1.5 shadow-xl shadow-pink-200/50 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] flex items-center justify-center select-none ${
            hasLayers
              ? isBrushActive
                ? 'cursor-crosshair touch-none'
                : isDragging
                ? 'cursor-grabbing touch-none'
                : 'cursor-grab touch-pan-y'
              : 'touch-pan-y'
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

            {/* 左上角快捷画笔入口 (正常模式下显示) */}
            {hasLayers && activeLayer && !isBrushActive && (
              <button
                type="button"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!activeLayer.maskDataUrl) {
                    onAddMask?.(activeLayer.id);
                  }
                  onToggleBrush?.(true);
                }}
                title="启用蒙版画笔涂抹"
                className="absolute top-2 left-2 flex items-center space-x-1 bg-black/60 hover:bg-pink-600/90 backdrop-blur-md px-2.5 py-1 rounded-full text-white text-[10px] font-bold shadow-md z-20 border border-white/20 active:scale-95 transition-all select-none"
              >
                <Paintbrush className="w-3 h-3 text-pink-300" />
                <span>{activeLayer.maskDataUrl ? '蒙版画笔' : '+ 蒙版'}</span>
              </button>
            )}

            {/* 实时笔刷圆形光标 (画笔激活时跟随手指/鼠标) */}
            {isBrushActive && cursorPos && containerRef.current && (() => {
              const rect = containerRef.current.getBoundingClientRect();
              const cx = cursorPos.x - rect.left;
              const cy = cursorPos.y - rect.top;
              return (
                <div
                  className={`pointer-events-none absolute rounded-full border-2 transition-transform duration-75 z-40 ${
                    brushColor === 'black'
                      ? 'border-black/80 bg-black/20 ring-1 ring-white/60'
                      : 'border-white bg-white/30 ring-1 ring-black/50'
                  }`}
                  style={{
                    left: `${cx}px`,
                    top: `${cy}px`,
                    width: `${brushSize}px`,
                    height: `${brushSize}px`,
                    transform: 'translate(-50%, -50%)',
                  }}
                />
              );
            })()}

            {/* 右上角悬浮变换快捷工具条（仅在画笔未激活、且有多图层或活跃图层有位移/缩放时展示） */}
            {hasLayers && activeLayer && !isBrushActive && (
              <div 
                onPointerDown={(e) => e.stopPropagation()}
                className="absolute top-2 right-2 flex items-center space-x-1 bg-black/55 backdrop-blur-md px-2 py-1 rounded-full text-white text-[10px] font-bold shadow-md z-20 border border-white/20 select-none"
              >
                <button
                  onPointerDown={(e) => e.stopPropagation()}
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
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => handleZoom(0.1, e)}
                  title="放大图层"
                  className="w-5 h-5 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center active:scale-90"
                >
                  <ZoomIn className="w-3 h-3" />
                </button>
                {(activeLayer.transform?.x !== 0 || activeLayer.transform?.y !== 0 || (activeLayer.transform?.scale && activeLayer.transform.scale !== 1)) && (
                  <button
                    onPointerDown={(e) => e.stopPropagation()}
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
    </div>
  );
};
