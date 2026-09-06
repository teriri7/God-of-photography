export interface RatioInfo {
  label: string;
  w: number;
  h: number;
  val: number;
}

export const SUPPORTED_RATIOS: RatioInfo[] = [
  { label: '1:1', w: 1, h: 1, val: 1.0 },
  { label: '2:3', w: 2, h: 3, val: 2 / 3 },
  { label: '3:2', w: 3, h: 2, val: 3 / 2 },
  { label: '3:4', w: 3, h: 4, val: 3 / 4 },
  { label: '4:3', w: 4, h: 3, val: 4 / 3 },
  { label: '9:16', w: 9, h: 16, val: 9 / 16 },
  { label: '16:9', w: 16, h: 9, val: 16 / 9 },
];

export type ResolutionMode = '1K' | '2K' | '4K';

export const RESOLUTION_MODES: { label: ResolutionMode; desc: string; baseEdge: number }[] = [
  { label: '1K', desc: '标准画质', baseEdge: 1024 },
  { label: '2K', desc: '高清细节', baseEdge: 2048 },
  { label: '4K', desc: '超清旗舰', baseEdge: 4096 },
];

/**
 * 根据导入图片的宽和高，自动检测并匹配最接近的标准画幅比例
 * 例如 4000x6000 -> 4000/6000 = 0.6667 -> 自动匹配 2:3
 * 6000x4000 -> 1.5 -> 自动匹配 3:2
 */
export function detectClosestAspectRatio(width: number, height: number): string {
  if (!width || !height) return '1:1';
  const imgRatio = width / height;

  let closest = SUPPORTED_RATIOS[0];
  let minDiff = Math.abs(imgRatio - closest.val);

  for (let i = 1; i < SUPPORTED_RATIOS.length; i++) {
    const diff = Math.abs(imgRatio - SUPPORTED_RATIOS[i].val);
    if (diff < minDiff) {
      minDiff = diff;
      closest = SUPPORTED_RATIOS[i];
    }
  }

  return closest.label;
}

/**
 * 根据比例与分辨率模式（1K, 2K, 4K）计算出具体的像素尺寸
 */
export function calculateDimensions(aspectRatio: string, mode: ResolutionMode): { width: number; height: number; dimensionStr: string } {
  const match = SUPPORTED_RATIOS.find((r) => r.label === aspectRatio) || SUPPORTED_RATIOS[0];
  const config = RESOLUTION_MODES.find((m) => m.label === mode) || RESOLUTION_MODES[0];
  const maxEdge = config.baseEdge;

  let width: number;
  let height: number;

  if (match.w >= match.h) {
    width = maxEdge;
    height = Math.round((maxEdge * match.h) / match.w);
  } else {
    height = maxEdge;
    width = Math.round((maxEdge * match.w) / match.h);
  }

  return {
    width,
    height,
    dimensionStr: `${width}x${height}`,
  };
}
