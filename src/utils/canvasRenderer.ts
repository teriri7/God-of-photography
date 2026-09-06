import { Layer, LayerFilterSettings } from '../types';

/**
 * 图像缓存对象，避免重复创建 HTMLImageElement
 */
const imageCache = new Map<string, HTMLImageElement>();

export function loadImage(src: string): Promise<HTMLImageElement> {
  if (imageCache.has(src)) {
    const cached = imageCache.get(src)!;
    if (cached.complete) return Promise.resolve(cached);
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imageCache.set(src, img);
      resolve(img);
    };
    img.onerror = (e) => reject(e);
    img.src = src;
  });
}

/**
 * 渲染单个图层（包含 CSS 滤镜与高级像素调色：白平衡、影调）
 */
export async function renderLayerToCanvas(
  layer: Layer,
  targetWidth: number,
  targetHeight: number
): Promise<HTMLCanvasElement> {
  const layerCanvas = document.createElement('canvas');
  layerCanvas.width = targetWidth;
  layerCanvas.height = targetHeight;
  const ctx = layerCanvas.getContext('2d');
  if (!ctx) return layerCanvas;

  const img = await loadImage(layer.sourceUrl);
  const filter = layer.filter;

  // 1. 构建基本 CSS 滤镜字符串
  const brightnessVal = 100 + filter.brightness; // 0 ~ 200%
  const contrastVal = 100 + filter.contrast;     // 0 ~ 200%
  const saturationVal = 100 + filter.saturation; // 0 ~ 200%
  const hueVal = filter.hueRotate;               // -180 ~ 180deg

  ctx.filter = `brightness(${brightnessVal}%) contrast(${contrastVal}%) saturate(${saturationVal}%) hue-rotate(${hueVal}deg)`;

  // 计算居中等比铺满 / 自适应尺寸
  const hRatio = targetWidth / img.width;
  const vRatio = targetHeight / img.height;
  const ratio = Math.min(hRatio, vRatio);
  const drawWidth = img.width * ratio;
  const drawHeight = img.height * ratio;
  const offsetX = (targetWidth - drawWidth) / 2;
  const offsetY = (targetHeight - drawHeight) / 2;

  ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);

  // 2. 如果存在白平衡（色温/色调）或二级影调（阴影/高光/曝光），进行精准像素级调色
  const hasAdvancedAdjustments =
    filter.temperature !== 0 ||
    filter.tint !== 0 ||
    filter.exposure !== 0 ||
    filter.shadows !== 0 ||
    filter.highlights !== 0;

  if (hasAdvancedAdjustments) {
    applyAdvancedTonalAdjustments(ctx, targetWidth, targetHeight, filter);
  }

  return layerCanvas;
}

/**
 * 精准白平衡与影调处理
 */
function applyAdvancedTonalAdjustments(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  filter: LayerFilterSettings
) {
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  // 色温系数: 暖调增加红/减少蓝，冷调增加蓝/减少红
  const tempR = filter.temperature > 0 ? 1 + (filter.temperature / 100) * 0.3 : 1;
  const tempB = filter.temperature < 0 ? 1 + (Math.abs(filter.temperature) / 100) * 0.3 : 1 - (filter.temperature / 100) * 0.15;

  // 色调系数: 品红增加红蓝/减少绿，绿调增加绿/减少红蓝
  const tintG = filter.tint < 0 ? 1 + (Math.abs(filter.tint) / 100) * 0.25 : 1 - (filter.tint / 100) * 0.15;
  const tintRB = filter.tint > 0 ? 1 + (filter.tint / 100) * 0.15 : 1;

  // 曝光系数: 2 ^ (exposure / 50)
  const exposureFactor = Math.pow(2, filter.exposure / 50);

  // 阴影与高光强度 (-100 ~ 100)
  const shadowAdj = (filter.shadows / 100) * 60;
  const highlightAdj = (filter.highlights / 100) * 60;

  const len = data.length;
  for (let i = 0; i < len; i += 4) {
    if (data[i + 3] === 0) continue; // 透明像素跳过

    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];

    // 1. 白平衡
    r = r * tempR * tintRB;
    g = g * tintG;
    b = b * tempB * tintRB;

    // 2. 曝光
    r *= exposureFactor;
    g *= exposureFactor;
    b *= exposureFactor;

    // 3. 影调（阴影与高光分离控制）
    if (shadowAdj !== 0 || highlightAdj !== 0) {
      const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
      
      // 阴影权重（暗部 0~128 显著，越暗权重越高）
      if (shadowAdj !== 0 && luminance < 160) {
        const shadowWeight = Math.max(0, 1 - luminance / 160);
        r += shadowAdj * shadowWeight;
        g += shadowAdj * shadowWeight;
        b += shadowAdj * shadowWeight;
      }

      // 高光权重（亮部 96~255 显著，越亮权重越高）
      if (highlightAdj !== 0 && luminance > 96) {
        const highlightWeight = Math.max(0, (luminance - 96) / 159);
        r += highlightAdj * highlightWeight;
        g += highlightAdj * highlightWeight;
        b += highlightAdj * highlightWeight;
      }
    }

    // 约束在 0 ~ 255 区间
    data[i] = Math.min(255, Math.max(0, r));
    data[i + 1] = Math.min(255, Math.max(0, g));
    data[i + 2] = Math.min(255, Math.max(0, b));
  }

  ctx.putImageData(imgData, 0, 0);
}

/**
 * 复合多图层渲染到目标 Canvas
 */
export async function renderLayersComposite(
  layers: Layer[],
  targetCanvas: HTMLCanvasElement,
  outputWidth?: number,
  outputHeight?: number
): Promise<void> {
  const width = outputWidth || targetCanvas.width;
  const height = outputHeight || targetCanvas.height;

  if (targetCanvas.width !== width || targetCanvas.height !== height) {
    targetCanvas.width = width;
    targetCanvas.height = height;
  }

  const ctx = targetCanvas.getContext('2d');
  if (!ctx) return;

  // 清除画布
  ctx.clearRect(0, 0, width, height);

  // 按照图层顺序（自底向上）绘制所有可见图层
  const visibleLayers = layers.filter((l) => l.visible);

  for (const layer of visibleLayers) {
    const layerCanvas = await renderLayerToCanvas(layer, width, height);
    
    ctx.save();
    ctx.globalAlpha = layer.opacity / 100;
    ctx.globalCompositeOperation = layer.blendMode || 'source-over';
    ctx.drawImage(layerCanvas, 0, 0, width, height);
    ctx.restore();
  }
}

/**
 * 导出全分辨率合成图片 (DataURL / Blob)
 */
export async function exportCompositeImage(
  layers: Layer[],
  format: 'image/png' | 'image/jpeg' = 'image/png',
  quality = 0.95
): Promise<{ dataUrl: string; blob: Blob }> {
  // 获取参考图层最大分辨率
  let maxWidth = 1024;
  let maxHeight = 1024;

  for (const l of layers) {
    if (l.width > maxWidth) maxWidth = l.width;
    if (l.height > maxHeight) maxHeight = l.height;
  }

  const exportCanvas = document.createElement('canvas');
  exportCanvas.width = maxWidth;
  exportCanvas.height = maxHeight;

  await renderLayersComposite(layers, exportCanvas, maxWidth, maxHeight);

  const dataUrl = exportCanvas.toDataURL(format, quality);
  const blob = await new Promise<Blob>((resolve, reject) => {
    exportCanvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Canvas 导出 Blob 失败'))),
      format,
      quality
    );
  });

  return { dataUrl, blob };
}
