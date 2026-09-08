import React, { useState, useRef, useEffect, useCallback } from 'react';

export interface PinkSliderProps {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  defaultValue?: number;
  onChange: (value: number) => void;
  className?: string;
  disabled?: boolean;
}

/**
 * 精致粉色防误触滑块组件
 * 核心机制：
 * 1. 只有按住「红点 (Thumb)」并左右滑动时才改变数值；
 * 2. 避免误触：点击滑块轨道不会突跳数值，防止手机上下滑动滚屏时发生误触；
 * 3. 双击红点可快速复位至默认值 (如 0 或 100)；
 * 4. 支持双极性滑杆（如 -100 ~ +100，以 0 点居中向两侧填充指示条）。
 */
export const PinkSlider: React.FC<PinkSliderProps> = ({
  value,
  min = 0,
  max = 100,
  step = 1,
  defaultValue,
  onChange,
  className = '',
  disabled = false,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  // 计算滑块百分比位置 (0% ~ 100%)
  const range = max - min;
  const percentage = range > 0 ? Math.max(0, Math.min(100, ((value - min) / range) * 100)) : 0;

  // 判断是否属于以 0 为中心的双极滑块 (例如曝光、色温等 -100 到 100)
  const isBipolar = min < 0 && max > 0;
  const zeroPercent = isBipolar && range > 0 ? ((0 - min) / range) * 100 : 0;

  // 根据当前指针 clientX 计算对应的新值
  const updateValueFromPointer = useCallback(
    (clientX: number) => {
      if (!trackRef.current) return;
      const rect = trackRef.current.getBoundingClientRect();
      if (rect.width <= 0) return;

      const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      let newVal = min + ratio * (max - min);

      if (step > 0) {
        const stepsCount = Math.round((newVal - min) / step);
        newVal = min + stepsCount * step;
      }
      newVal = Math.max(min, Math.min(max, newVal));

      const stepDecimals = step.toString().split('.')[1]?.length || 0;
      if (stepDecimals > 0) {
        newVal = Number(newVal.toFixed(stepDecimals));
      } else {
        newVal = Math.round(newVal);
      }

      onChangeRef.current(newVal);
    },
    [min, max, step]
  );

  useEffect(() => {
    if (!isDragging) return;

    const handlePointerMove = (e: PointerEvent) => {
      e.preventDefault();
      updateValueFromPointer(e.clientX);
    };

    const handlePointerUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: false });
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    };
  }, [isDragging, updateValueFromPointer]);

  // 只有在手指/鼠标按下红点时才激活拖动模式
  const handleThumbPointerDown = (e: React.PointerEvent) => {
    if (disabled) return;
    e.stopPropagation();
    e.preventDefault();
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch (_) {}
    setIsDragging(true);
  };

  // 双击快速复位
  const handleDoubleClick = (e: React.MouseEvent) => {
    if (disabled) return;
    e.stopPropagation();
    const resetVal = defaultValue !== undefined ? defaultValue : (min <= 0 && max >= 0 ? 0 : min);
    onChangeRef.current(resetVal);
  };

  // 计算视觉填充条
  let fillStyle: React.CSSProperties = { left: '0%', width: '0%' };
  if (isBipolar) {
    if (percentage >= zeroPercent) {
      fillStyle = {
        left: `${zeroPercent}%`,
        width: `${percentage - zeroPercent}%`,
      };
    } else {
      fillStyle = {
        left: `${percentage}%`,
        width: `${zeroPercent - percentage}%`,
      };
    }
  } else {
    fillStyle = {
      left: '0%',
      width: `${percentage}%`,
    };
  }

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className={`relative w-full h-7 flex items-center select-none ${
        disabled ? 'opacity-40 pointer-events-none' : ''
      } ${className}`}
    >
      {/* 滑块轨道 (纯展示与取景范围，点击不跳变，避免误触) */}
      <div
        ref={trackRef}
        className="relative w-full h-1.5 mx-2 rounded-full bg-pink-200/70"
      >
        {/* 有色进度填充条 */}
        <div
          className="absolute top-0 bottom-0 rounded-full bg-gradient-to-r from-pink-400 to-rose-400 pointer-events-none"
          style={fillStyle}
        />

        {/* 双极滑块 0 点中位微弱标识 */}
        {isBipolar && (
          <div
            className="absolute top-1/2 -translate-y-1/2 w-1 h-2 rounded-full bg-pink-300/80 -translate-x-1/2 pointer-events-none"
            style={{ left: `${zeroPercent}%` }}
          />
        )}

        {/* 交互红点 (Thumb)：增大触控热区至 36x36px，仅按中此处才能拖动 */}
        <div
          style={{ left: `${percentage}%` }}
          onPointerDown={handleThumbPointerDown}
          onDoubleClick={handleDoubleClick}
          className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center cursor-grab active:cursor-grabbing touch-none z-10"
          role="slider"
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={value}
          tabIndex={disabled ? -1 : 0}
          onKeyDown={(e) => {
            if (disabled) return;
            if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
              e.preventDefault();
              onChangeRef.current(Math.max(min, value - step));
            } else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
              e.preventDefault();
              onChangeRef.current(Math.min(max, value + step));
            }
          }}
        >
          {/* 视觉圆点 (红点/粉点)：18px */}
          <div
            className={`w-[18px] h-[18px] rounded-full bg-gradient-to-tr from-pink-500 to-rose-500 border-[2.5px] border-white shadow-[0_2px_6px_rgba(236,72,153,0.4)] transition-transform duration-100 pointer-events-none ${
              isDragging ? 'scale-125 shadow-[0_2px_12px_rgba(236,72,153,0.7)]' : 'hover:scale-110'
            }`}
          />
        </div>
      </div>
    </div>
  );
};
