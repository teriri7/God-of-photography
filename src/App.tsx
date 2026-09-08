import React, { useState, useEffect, useRef } from 'react';
import {
  Layer,
  LayerFilterSettings,
  DEFAULT_FILTER_SETTINGS,
  LayerTransform,
  DEFAULT_LAYER_TRANSFORM,
  ApiEndpoint,
  PromptPreset,
} from './types';
import { storageService } from './services/storageService';
import { apiService } from './services/apiService';
import { mediaService } from './services/mediaService';
import {
  exportCompositeImage,
  loadImage,
  bakeLayerFilter,
  convertToJpeg,
  createDefaultWhiteMask,
} from './utils/canvasRenderer';
import { detectClosestAspectRatio, calculateDimensions, ResolutionMode } from './utils/ratioHelper';

import { Header } from './components/Header';
import { CanvasViewport } from './components/CanvasViewport';
import { CollapsibleEditorSection } from './components/CollapsibleEditorSection';
import { PresetModal } from './components/PresetModal';
import { SemiSynthesisModal } from './components/SemiSynthesisModal';
import { ControlBar } from './components/ControlBar';
import { ApiSettingsModal } from './components/ApiSettingsModal';
import { PhoneSimulatorFrame } from './components/PhoneSimulatorFrame';

export const App: React.FC = () => {
  // 1. 持久化状态初始化 (多 API 线路与模型)
  const [endpoints, setEndpoints] = useState<ApiEndpoint[]>(() => storageService.getEndpoints());
  const [activeEndpointId, setActiveEndpointId] = useState<string>(() => storageService.getActiveEndpointId());
  const activeEndpoint = endpoints.find((ep) => ep.id === activeEndpointId) || endpoints[0];

  const [models, setModels] = useState<string[]>(() => activeEndpoint?.models || storageService.getModels());
  const [selectedModel, setSelectedModel] = useState<string>(() => {
    return activeEndpoint?.selectedModel || storageService.getLastImageModel() || activeEndpoint?.models[0] || '[yu]gemini-3.1-flash-lite-image';
  });
  const [presets, setPresets] = useState<PromptPreset[]>(() => storageService.getPresets());
  const [isSimulator, setIsSimulator] = useState<boolean>(() => storageService.getSimulatorMode());

  // 2. 主页面交互状态 (画幅比例与分辨率记忆，默认选用首个预设「场照除杂」)
  const [selectedPresetId, setSelectedPresetId] = useState<string>(() => presets[0]?.id || 'preset-declutter');
  const [customPrompt, setCustomPrompt] = useState<string>('');
  const [aspectRatio, setAspectRatio] = useState<string>(() => storageService.getLastAspectRatio() || '1:1');
  const [autoDetectedRatio, setAutoDetectedRatio] = useState<string | null>(null);
  const [resolutionMode, setResolutionMode] = useState<ResolutionMode>(() => storageService.getLastResolution() || '2K');

  // 3. 图层系统状态
  const [layers, setLayers] = useState<Layer[]>([]);
  const [activeLayerId, setActiveLayerId] = useState<string | null>(null);

  // 4. 弹窗与抽屉控制
  const [isPresetModalOpen, setIsPresetModalOpen] = useState<boolean>(false);
  const [isSemiSynthesisOpen, setIsSemiSynthesisOpen] = useState<boolean>(false);
  const [semiSynthesisBaseImage, setSemiSynthesisBaseImage] = useState<string>('');
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  // 5. 编辑区域互斥状态 ('none' | 'layers' | 'tonal')
  const [expandedSection, setExpandedSection] = useState<'none' | 'layers' | 'tonal'>('none');

  // 将当前活跃图层（或指定图层）的影调滤镜固化（Bake）到底层像素位图，并重置滑杆为 0
  const handleBakeCurrentFilter = async (): Promise<Layer[] | null> => {
    const target = layers.find((l) => l.id === activeLayerId) || layers[layers.length - 1];
    if (!target) return null;
    const isModified = Object.entries(target.filter).some(([k, v]) => {
      return (DEFAULT_FILTER_SETTINGS as any)[k] !== v;
    });
    if (!isModified) return layers;

    try {
      const baked = await bakeLayerFilter(target);
      const updated = layers.map((l) => (l.id === baked.id ? baked : l));
      setLayers(updated);
      showToast(`已将影调调整永久应用至「${target.name}」`, 'success');
      return updated;
    } catch (err) {
      console.error('Bake filter error:', err);
      return layers;
    }
  };

  const handleToggleSection = async (section: 'layers' | 'tonal') => {
    if (expandedSection === 'tonal') {
      await handleBakeCurrentFilter();
    }
    setExpandedSection((prev) => (prev === section ? 'none' : section));
  };

  const handleUpdateLayerTransform = (id: string, transform: LayerTransform) => {
    setLayers((prev) =>
      prev.map((l) => (l.id === id ? { ...l, transform } : l))
    );
  };

  // 6. 蒙版画笔状态与图层蒙版操作 (黑透白不透)
  const [isMaskBrushActive, setIsMaskBrushActive] = useState<boolean>(false);

  const handleAddMask = (layerId: string) => {
    const target = layers.find((l) => l.id === layerId);
    if (!target) return;
    const maskDataUrl = createDefaultWhiteMask(target.width, target.height);
    setLayers((prev) =>
      prev.map((l) => (l.id === layerId ? { ...l, maskDataUrl } : l))
    );
    setActiveLayerId(layerId);
    showToast(`已为「${target.name}」添加白色蒙版 (白不透)`, 'success');
  };

  const handleRemoveMask = (layerId: string) => {
    setLayers((prev) =>
      prev.map((l) => {
        if (l.id === layerId) {
          const next = { ...l };
          delete next.maskDataUrl;
          delete (next as any).maskCanvas;
          return next;
        }
        return l;
      })
    );
    if (isMaskBrushActive && activeLayerId === layerId) {
      setIsMaskBrushActive(false);
    }
    showToast('已移除图层蒙版', 'info');
  };

  const handleUpdateLayerMask = (layerId: string, maskDataUrl: string) => {
    setLayers((prev) =>
      prev.map((l) => (l.id === layerId ? { ...l, maskDataUrl } : l))
    );
  };

  const handleToggleBrush = (active?: boolean) => {
    const targetState = active !== undefined ? active : !isMaskBrushActive;
    if (targetState) {
      const current = layers.find((l) => l.id === activeLayerId) || layers[layers.length - 1];
      if (!current) {
        showToast('请先选择或导入一个图层', 'error');
        return;
      }
      if (!current.maskDataUrl) {
        handleAddMask(current.id);
      }
      setIsMaskBrushActive(true);
      showToast('蒙版画笔已开启 (画布已锁定，黑透白不透)', 'info');
    } else {
      setIsMaskBrushActive(false);
      showToast('已退出蒙版画笔 (画布缩放拖拽已解锁)', 'info');
    }
  };

  // 7. 异步操作指示器
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // 隐藏的相册/文件选择器
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // 自动显示 Toast
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  // 持久化同步
  useEffect(() => {
    storageService.saveEndpoints(endpoints);
  }, [endpoints]);

  useEffect(() => {
    storageService.saveActiveEndpointId(activeEndpointId);
  }, [activeEndpointId]);

  useEffect(() => {
    storageService.savePresets(presets);
  }, [presets]);

  useEffect(() => {
    if (!presets.some((p) => p.id === selectedPresetId)) {
      setSelectedPresetId(presets[0]?.id || 'preset-declutter');
    }
  }, [presets, selectedPresetId]);

  useEffect(() => {
    storageService.saveSimulatorMode(isSimulator);
  }, [isSimulator]);

  // 切换 API 线路
  const handleSelectEndpoint = (newId: string) => {
    setActiveEndpointId(newId);
    storageService.saveActiveEndpointId(newId);
    const target = endpoints.find((ep) => ep.id === newId);
    if (target) {
      setModels(target.models || []);
      const modelToUse = target.selectedModel || target.models?.[0] || '[yu]gemini-3.1-flash-lite-image';
      setSelectedModel(modelToUse);
      storageService.saveLastImageModel(modelToUse);
      showToast(`已切换至线路「${target.name}」`, 'info');
    }
  };

  // 更新所有线路
  const handleUpdateEndpoints = (newEndpoints: ApiEndpoint[]) => {
    setEndpoints(newEndpoints);
    storageService.saveEndpoints(newEndpoints);
    const current = newEndpoints.find((ep) => ep.id === activeEndpointId);
    if (current) {
      setModels(current.models || []);
    }
  };

  // 更改模型并持久化
  const handleChangeModel = (m: string) => {
    setSelectedModel(m);
    storageService.saveLastImageModel(m);
    setEndpoints((prev) =>
      prev.map((ep) => (ep.id === activeEndpointId ? { ...ep, selectedModel: m } : ep))
    );
  };

  // 更改分辨率并持久化
  const handleChangeResolutionMode = (mode: ResolutionMode) => {
    setResolutionMode(mode);
    storageService.saveLastResolution(mode);
  };

  // 更改比例并持久化
  const handleChangeAspectRatio = (ratio: string) => {
    setAspectRatio(ratio);
    storageService.saveLastAspectRatio(ratio);
  };

  // 打开系统相册/文件选择
  const handleTriggerPickImage = () => {
    fileInputRef.current?.click();
  };

  // 处理文件上传并新建图层
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const dataUrl = event.target?.result as string;
        const img = await loadImage(dataUrl);

        const detectedRatio = detectClosestAspectRatio(img.width, img.height);
        setAspectRatio(detectedRatio);
        setAutoDetectedRatio(detectedRatio);

        const newLayer: Layer = {
          id: `layer-${Date.now()}`,
          name: `图层 ${layers.length + 1} (${layers.length === 0 ? '原图' : '导入'})`,
          visible: true,
          opacity: 100,
          blendMode: 'source-over',
          sourceUrl: dataUrl,
          width: img.width,
          height: img.height,
          filter: { ...DEFAULT_FILTER_SETTINGS },
          createdAt: Date.now(),
        };

        setLayers((prev) => [...prev, newLayer]);
        setActiveLayerId(newLayer.id);
        showToast(`已导入图片 (${img.width}×${img.height})，自动匹配画幅 ${detectedRatio}`, 'success');
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      console.error(err);
      showToast('加载图片失败，请重试', 'error');
    } finally {
      // 清空 input 允许再次选同名文件
      e.target.value = '';
    }
  };

  // 核心功能：点击开始按钮，调用图生图 API，并自动载入新图层
  const handleStartGeneration = async () => {
    if (layers.length === 0) {
      showToast('请先选择或打开一张图片作为基准图', 'error');
      return;
    }

    // 自动烘焙固化当前未收起的影调参数
    const currentLayers = (await handleBakeCurrentFilter()) || layers;

    // 关键：导出所有可见图层、贴纸移动/缩放与调色后的完整合成图，采用 0.95 质量 JPG 极大提升处理与上传速度
    let baseInputUrl = '';
    try {
      const { dataUrl } = await exportCompositeImage(currentLayers, 'image/jpeg', 0.95);
      baseInputUrl = dataUrl;
    } catch (e) {
      console.error('导出画布合成图失败，使用顶层图层回退:', e);
      const targetLayer = currentLayers.find((l) => l.id === activeLayerId) || currentLayers[currentLayers.length - 1];
      baseInputUrl = targetLayer?.sourceUrl ? await convertToJpeg(targetLayer.sourceUrl, 0.95) : '';
    }

    const currentPreset = presets.find((p) => p.id === selectedPresetId);
    const combinedPrompt = [currentPreset?.prompt, customPrompt].filter(Boolean).join('，');

    // 计算指定画幅与分辨率模式下的像素规格（支持4K极高分辨率）
    const { dimensionStr } = calculateDimensions(aspectRatio, resolutionMode);
    const formattedResolution = `${resolutionMode} (${dimensionStr})`;

    setIsGenerating(true);
    showToast(`已向 [${activeEndpoint.name}] 发送请求 (画幅 ${aspectRatio}, 分辨率 ${formattedResolution})...`, 'info');

    try {
      const generatedImageUrl = await apiService.generateImageToImage({
        baseUrl: activeEndpoint.baseUrl,
        apiKey: activeEndpoint.apiKey,
        model: selectedModel,
        prompt: combinedPrompt,
        inputImageBase64: baseInputUrl,
        resolution: formattedResolution,
        aspectRatio,
      });

      // 载入生成的图片并压入图层栈
      const img = await loadImage(generatedImageUrl);

      const generatedLayer: Layer = {
        id: `layer-${Date.now()}`,
        name: `图层 ${layers.length + 1} (${currentPreset?.title || 'AI生成'})`,
        visible: true,
        opacity: 100,
        blendMode: 'source-over',
        sourceUrl: generatedImageUrl,
        width: img.width,
        height: img.height,
        filter: { ...DEFAULT_FILTER_SETTINGS },
        createdAt: Date.now(),
      };

      setLayers((prev) => [...prev, generatedLayer]);
      setActiveLayerId(generatedLayer.id);
      showToast('AI 新图层已成功生成并压入画布！', 'success');
    } catch (err: any) {
      console.error(err);
      showToast(err.message || '生成失败，请检查 API 配置或网络', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  // 导出/保存全图层 100% 无损 PNG 合成图至系统相册
  const handleExport = async () => {
    if (layers.length === 0) return;

    setIsExporting(true);
    showToast('正在合成 100% 原画质无损 PNG 并流式保存...', 'info');

    try {
      // 1. 无损合成生成二进制 Blob，不产生超长 Base64 字符串
      const { blob } = await exportCompositeImage(layers, 'image/png');

      // 2. 512KB 分块流式写入手机相册，内存占用 < 2MB，彻底杜绝 OOM 闪退
      const res = await mediaService.saveBlobToGallery(
        blob,
        `摄影之神_${Date.now()}.png`,
        (percent) => {
          if (percent % 25 === 0 && percent < 100) {
            showToast(`正在无损保存至相册... ${percent}%`, 'info');
          }
        }
      );
      showToast(res.message, 'success');
    } catch (err: any) {
      console.error('保存至手机相册失败:', err);
      showToast(err?.message || '保存到相册失败，请重试', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  // 打开半合成全流程并基于全图层最新所见即所得画面
  const handleOpenSemiSynthesis = async () => {
    if (layers.length === 0) {
      showToast('请先选择或导入一张图片', 'error');
      return;
    }
    const currentLayers = (await handleBakeCurrentFilter()) || layers;
    try {
      // 关键优化：采用 0.95 质量的高清 JPG 格式导出，彻底消除 30MB PNG 导致的卡顿与内存压力
      const { dataUrl } = await exportCompositeImage(currentLayers, 'image/jpeg', 0.95);
      setSemiSynthesisBaseImage(dataUrl);
    } catch (err) {
      console.error('合成半合成基准图失败:', err);
      const targetLayer = currentLayers.find((l) => l.id === activeLayerId) || currentLayers[currentLayers.length - 1];
      if (targetLayer?.sourceUrl) {
        const fallbackJpeg = await convertToJpeg(targetLayer.sourceUrl, 0.95);
        setSemiSynthesisBaseImage(fallbackJpeg);
      } else {
        setSemiSynthesisBaseImage('');
      }
    }
    setIsSemiSynthesisOpen(true);
  };

  // 图层操作
  const handleToggleVisibility = (id: string) => {
    setLayers((prev) =>
      prev.map((l) => (l.id === id ? { ...l, visible: !l.visible } : l))
    );
  };

  const handleMoveUp = (id: string) => {
    setLayers((prev) => {
      const index = prev.findIndex((l) => l.id === id);
      if (index >= prev.length - 1) return prev;
      const newLayers = [...prev];
      const temp = newLayers[index];
      newLayers[index] = newLayers[index + 1];
      newLayers[index + 1] = temp;
      return newLayers;
    });
  };

  const handleMoveDown = (id: string) => {
    setLayers((prev) => {
      const index = prev.findIndex((l) => l.id === id);
      if (index <= 0) return prev;
      const newLayers = [...prev];
      const temp = newLayers[index];
      newLayers[index] = newLayers[index - 1];
      newLayers[index - 1] = temp;
      return newLayers;
    });
  };

  const handleDeleteLayer = (id: string) => {
    setLayers((prev) => {
      const next = prev.filter((l) => l.id !== id);
      if (activeLayerId === id) {
        setActiveLayerId(next[next.length - 1]?.id || null);
      }
      return next;
    });
    showToast('图层已删除', 'info');
  };

  const handleDuplicateLayer = (id: string) => {
    const layerToDup = layers.find((l) => l.id === id);
    if (!layerToDup) return;
    const duplicated: Layer = {
      ...layerToDup,
      id: `layer-${Date.now()}`,
      name: `${layerToDup.name} (副本)`,
      createdAt: Date.now(),
    };
    setLayers((prev) => [...prev, duplicated]);
    setActiveLayerId(duplicated.id);
    showToast('图层已复制', 'success');
  };

  const handleChangeOpacity = (id: string, opacity: number) => {
    setLayers((prev) =>
      prev.map((l) => (l.id === id ? { ...l, opacity } : l))
    );
  };

  const handleChangeBlendMode = (id: string, blendMode: GlobalCompositeOperation) => {
    setLayers((prev) =>
      prev.map((l) => (l.id === id ? { ...l, blendMode } : l))
    );
  };

  const handleUpdateFilter = (id: string, filter: LayerFilterSettings) => {
    setLayers((prev) =>
      prev.map((l) => (l.id === id ? { ...l, filter } : l))
    );
  };

  const handleUpdatePreset = (updated: PromptPreset) => {
    setPresets((prev) =>
      prev.map((p) => (p.id === updated.id ? updated : p))
    );
    showToast(`预设「${updated.title}」已保存`, 'success');
  };

  const handleAddPreset = (newPreset: PromptPreset) => {
    setPresets((prev) => [...prev, newPreset]);
    setSelectedPresetId(newPreset.id);
    showToast(`预设「${newPreset.title}」已添加并选定`, 'success');
  };

  const handleDeletePreset = (id: string) => {
    setPresets((prev) => prev.filter((p) => p.id !== id));
    if (selectedPresetId === id) {
      setSelectedPresetId(presets[0]?.id || 'preset-declutter');
    }
    showToast('预设已删除', 'info');
  };

  const handleAddGeneratedLayer = async (imageUrl: string, layerName: string) => {
    try {
      const img = await loadImage(imageUrl);
      const newLayer: Layer = {
        id: `layer-${Date.now()}`,
        name: `图层 ${layers.length + 1} (${layerName})`,
        visible: true,
        opacity: 100,
        blendMode: 'source-over',
        sourceUrl: imageUrl,
        width: img.width,
        height: img.height,
        filter: { ...DEFAULT_FILTER_SETTINGS },
        createdAt: Date.now(),
      };
      setLayers((prev) => [...prev, newLayer]);
      setActiveLayerId(newLayer.id);
    } catch (e) {
      console.error('Failed to add generated layer:', e);
    }
  };

  return (
    <PhoneSimulatorFrame
      isSimulator={isSimulator}
      onToggleSimulator={() => setIsSimulator(!isSimulator)}
    >
      <div className="w-full h-full flex flex-col justify-between overflow-hidden relative">
        {/* 隐藏的文件输入组件 */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />

        {/* 顶部紧凑导航 */}
        <Header
          onOpenSettings={() => setIsSettingsOpen(true)}
          layerCount={layers.length}
          isSimulator={isSimulator}
          onToggleSimulator={() => setIsSimulator(!isSimulator)}
        />

        {/* 中间主滚动视图 */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar flex flex-col justify-start pb-2">
          {/* 画布预览视窗 (展开图层或影调时平滑自适应缩小至 80% 紧凑模式) */}
          <CanvasViewport
            layers={layers}
            isGenerating={isGenerating}
            onPickImage={handleTriggerPickImage}
            activeLayerId={activeLayerId}
            aspectRatio={aspectRatio}
            isCompact={expandedSection !== 'none'}
            onUpdateLayerTransform={handleUpdateLayerTransform}
            isBrushActive={isMaskBrushActive}
            onToggleBrush={handleToggleBrush}
            onUpdateLayerMask={handleUpdateLayerMask}
            onAddMask={handleAddMask}
          />

          {/* 功能菜单栏列表（统一管理半合成、风格预设、图层调整、画面影调，支持上下拉动流畅滚动浏览，方便未来自由扩展更多功能栏） */}
          <CollapsibleEditorSection
            onOpenSemiSynthesis={handleOpenSemiSynthesis}
            currentPreset={presets.find((p) => p.id === selectedPresetId)}
            onOpenPresetModal={() => setIsPresetModalOpen(true)}
            layers={layers}
            activeLayerId={activeLayerId}
            onSelectLayer={setActiveLayerId}
            onToggleVisibility={handleToggleVisibility}
            onMoveUp={handleMoveUp}
            onMoveDown={handleMoveDown}
            onDeleteLayer={handleDeleteLayer}
            onDuplicateLayer={handleDuplicateLayer}
            onChangeOpacity={handleChangeOpacity}
            onUpdateFilter={handleUpdateFilter}
            expandedSection={expandedSection}
            onToggleSection={handleToggleSection}
            onUpdateLayerTransform={handleUpdateLayerTransform}
            onBakeFilter={handleBakeCurrentFilter}
            isBrushActive={isMaskBrushActive}
            onToggleBrush={handleToggleBrush}
            onAddMask={handleAddMask}
            onRemoveMask={handleRemoveMask}
          />
        </div>

        {/* 底部参数切换与开始生成按钮 */}
        <ControlBar
          endpoints={endpoints}
          activeEndpointId={activeEndpointId}
          onChangeEndpoint={handleSelectEndpoint}
          models={models}
          selectedModel={selectedModel}
          onChangeModel={handleChangeModel}
          aspectRatio={aspectRatio}
          onChangeAspectRatio={handleChangeAspectRatio}
          resolutionMode={resolutionMode}
          onChangeResolutionMode={handleChangeResolutionMode}
          onPickImage={handleTriggerPickImage}
          onExport={handleExport}
          isExporting={isExporting}
          onStartGeneration={handleStartGeneration}
          isGenerating={isGenerating}
          hasInputImage={layers.length > 0}
          autoDetectedRatio={autoDetectedRatio}
        />

        {/* 预设二级选择模态窗（一行一个，自由添加删除） */}
        <PresetModal
          isOpen={isPresetModalOpen}
          onClose={() => setIsPresetModalOpen(false)}
          presets={presets}
          selectedPresetId={selectedPresetId}
          onSelectPreset={(p) => {
            setSelectedPresetId(p.id);
            showToast(`已选定风格预设「${p.title}」`, 'success');
          }}
          onUpdatePreset={handleUpdatePreset}
          onAddPreset={handleAddPreset}
          onDeletePreset={handleDeletePreset}
          customPrompt={customPrompt}
          onChangeCustomPrompt={setCustomPrompt}
        />

        {/* 半合成全流程多步全新页面 */}
        <SemiSynthesisModal
          isOpen={isSemiSynthesisOpen}
          onClose={() => setIsSemiSynthesisOpen(false)}
          baseImage={semiSynthesisBaseImage || (layers.find((l) => l.id === activeLayerId) || layers[layers.length - 1])?.sourceUrl || ''}
          endpoints={endpoints}
          activeEndpointId={activeEndpointId}
          onSelectEndpoint={handleSelectEndpoint}
          initialAspectRatio={aspectRatio}
          onAddLayer={handleAddGeneratedLayer}
          onToast={showToast}
        />

        {/* API 与模型设置模态窗 */}
        <ApiSettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          endpoints={endpoints}
          activeEndpointId={activeEndpointId}
          onSelectEndpoint={handleSelectEndpoint}
          onUpdateEndpoints={handleUpdateEndpoints}
          onToast={showToast}
        />

        {/* 顶部全局 Toast 浮动提示条 */}
        {toast && (
          <div className="absolute top-14 left-4 right-4 z-50 flex justify-center pointer-events-none animate-in fade-in slide-in-from-top-3 duration-200">
            <div
              className={`px-4 py-2 rounded-2xl shadow-xl backdrop-blur-md text-xs font-bold border flex items-center space-x-2 ${
                toast.type === 'success'
                  ? 'bg-emerald-500/90 text-white border-emerald-400'
                  : toast.type === 'error'
                  ? 'bg-rose-500/90 text-white border-rose-400'
                  : 'bg-pink-600/90 text-white border-pink-400'
              }`}
            >
              <span>{toast.message}</span>
            </div>
          </div>
        )}
      </div>
    </PhoneSimulatorFrame>
  );
};
