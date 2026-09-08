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
 * 渲染单个图层（包含 CSS 滤镜与高级像素调色：白平衡、影调、自由变换）
 */
export async function renderLayerToCanvas(
  layer: Layer,
  targetWidth: number,
  targetHeight: number,
  baseWidth: number = targetWidth,
  baseHeight: number = targetHeight,
  ignoreTransform: boolean = false
): Promise<HTMLCanvasElement> {
  const layerCanvas = document.createElement('canvas');
  layerCanvas.width = targetWidth;
  layerCanvas.height = targetHeight;
  const ctx = layerCanvas.getContext('2d');
  if (!ctx) return layerCanvas;

  const img = await loadImage(layer.sourceUrl);
  const filter = layer.filter;
  const transform = layer.transform || { x: 0, y: 0, scale: 1, rotation: 0 };

  // 计算居中等比铺满 / 自适应尺寸
  const hRatio = targetWidth / img.width;
  const vRatio = targetHeight / img.height;
  const ratio = Math.min(hRatio, vRatio);
  const drawWidth = img.width * ratio;
  const drawHeight = img.height * ratio;

  if (ignoreTransform) {
    const offsetX = (targetWidth - drawWidth) / 2;
    const offsetY = (targetHeight - drawHeight) / 2;
    ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
  } else {
    // 相对基准分辨率的坐标缩放因子
    const coordScale = baseWidth > 0 ? targetWidth / baseWidth : 1;
    const tX = (transform.x || 0) * coordScale;
    const tY = (transform.y || 0) * coordScale;
    const tScale = transform.scale ?? 1;
    const tRot = transform.rotation ?? 0;

    ctx.save();
    const centerX = targetWidth / 2 + tX;
    const centerY = targetHeight / 2 + tY;
    ctx.translate(centerX, centerY);
    if (tRot !== 0) {
      ctx.rotate((tRot * Math.PI) / 180);
    }
    ctx.scale(tScale, tScale);
    ctx.drawImage(img, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
    ctx.restore();
  }

  // 如果存在任意 Camera Raw 调色参数，进行全像素级精确调色
  const hasAdjustments =
    filter.exposure !== 0 ||
    filter.contrast !== 0 ||
    filter.highlights !== 0 ||
    filter.shadows !== 0 ||
    filter.whites !== 0 ||
    filter.blacks !== 0 ||
    filter.temperature !== 0 ||
    filter.tint !== 0 ||
    filter.saturation !== 0;

  if (hasAdjustments) {
    applyAdvancedTonalAdjustments(ctx, targetWidth, targetHeight, filter);
  }

  return layerCanvas;
}

/**
 * 将图层的影调调色永久烘焙（Bake）到底层像素位图中，并重置调色参数为 0
 */
export async function bakeLayerFilter(layer: Layer): Promise<Layer> {
  const filter = layer.filter;
  const hasAdjustments =
    filter.exposure !== 0 ||
    filter.contrast !== 0 ||
    filter.highlights !== 0 ||
    filter.shadows !== 0 ||
    filter.whites !== 0 ||
    filter.blacks !== 0 ||
    filter.temperature !== 0 ||
    filter.tint !== 0 ||
    filter.saturation !== 0;

  if (!hasAdjustments) return layer;

  // 使用图层自身原始分辨率烘焙像素，保留其独立位移与缩放 transform
  const bakedCanvas = await renderLayerToCanvas(
    layer,
    layer.width,
    layer.height,
    layer.width,
    layer.height,
    true
  );
  const bakedDataUrl = bakedCanvas.toDataURL('image/png');

  return {
    ...layer,
    sourceUrl: bakedDataUrl,
    filter: {
      exposure: 0,
      contrast: 0,
      highlights: 0,
      shadows: 0,
      whites: 0,
      blacks: 0,
      temperature: 0,
      tint: 0,
      saturation: 0,
    },
  };
}

/**
 * 类似 Adobe Camera Raw / Lightroom 的全能影调像素级调色引擎
 */
function applyAdvancedTonalAdjustments(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  filter: LayerFilterSettings
) {
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  // 1. 白平衡系数
  const tempR = filter.temperature > 0 ? 1 + (filter.temperature / 100) * 0.35 : 1;
  const tempB = filter.temperature < 0 ? 1 + (Math.abs(filter.temperature) / 100) * 0.35 : 1 - (filter.temperature / 100) * 0.15;
  const tintG = filter.tint < 0 ? 1 + (Math.abs(filter.tint) / 100) * 0.25 : 1 - (filter.tint / 100) * 0.15;
  const tintRB = filter.tint > 0 ? 1 + (filter.tint / 100) * 0.15 : 1;

  // 2. 曝光系数: 2 ^ (exposure / 50)
  const exposureFactor = Math.pow(2, filter.exposure / 50);

  // 3. 对比度系数
  const contrastFactor = (filter.contrast + 100) / 100;

  // 4. 饱和度系数
  const satFactor = Math.max(0, (filter.saturation + 100) / 100);

  // 5. 影调权重增益 (-100 ~ 100)
  const highlightAdj = (filter.highlights / 100) * 60;
  const shadowAdj = (filter.shadows / 100) * 60;
  const whiteAdj = (filter.whites / 100) * 55;
  const blackAdj = (filter.blacks / 100) * 55;

  const len = data.length;
  for (let i = 0; i < len; i += 4) {
    if (data[i + 3] === 0) continue; // 透明像素跳过

    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];

    // ① 色温与色调 (White Balance)
    r = r * tempR * tintRB;
    g = g * tintG;
    b = b * tempB * tintRB;

    // ② 曝光 (Exposure)
    r *= exposureFactor;
    g *= exposureFactor;
    b *= exposureFactor;

    // 计算当前亮度
    let lum = 0.299 * r + 0.587 * g + 0.114 * b;

    // ③ 影调四段控制：高光 / 阴影 / 白色 / 黑色
    // 阴影 (Shadows: 0 ~ 160)
    if (shadowAdj !== 0 && lum < 160) {
      const wShadow = Math.max(0, 1 - lum / 160);
      r += shadowAdj * wShadow;
      g += shadowAdj * wShadow;
      b += shadowAdj * wShadow;
    }

    // 高光 (Highlights: 96 ~ 255)
    if (highlightAdj !== 0 && lum > 96) {
      const wHighlight = Math.max(0, (lum - 96) / 159);
      r += highlightAdj * wHighlight;
      g += highlightAdj * wHighlight;
      b += highlightAdj * wHighlight;
    }

    // 白色 (Whites: 极亮区 180 ~ 255)
    if (whiteAdj !== 0 && lum > 175) {
      const wWhite = Math.max(0, (lum - 175) / 80);
      r += whiteAdj * wWhite;
      g += whiteAdj * wWhite;
      b += whiteAdj * wWhite;
    }

    // 黑色 (Blacks: 极暗区 0 ~ 80)
    if (blackAdj !== 0 && lum < 85) {
      const wBlack = Math.max(0, 1 - lum / 85);
      r += blackAdj * wBlack;
      g += blackAdj * wBlack;
      b += blackAdj * wBlack;
    }

    // ④ 对比度 (Contrast: 绕 128 中心展开或收缩)
    if (filter.contrast !== 0) {
      r = (r - 128) * contrastFactor + 128;
      g = (g - 128) * contrastFactor + 128;
      b = (b - 128) * contrastFactor + 128;
    }

    // ⑤ 饱和度 (Saturation)
    if (filter.saturation !== 0) {
      lum = 0.299 * r + 0.587 * g + 0.114 * b;
      r = lum + (r - lum) * satFactor;
      g = lum + (g - lum) * satFactor;
      b = lum + (b - lum) * satFactor;
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
  const baseWidth = layers[0] ? layers[0].width : width;
  const baseHeight = layers[0] ? layers[0].height : height;

  for (const layer of visibleLayers) {
    const layerCanvas = await renderLayerToCanvas(layer, width, height, baseWidth, baseHeight);
    
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
