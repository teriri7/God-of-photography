import React, { useState, useEffect, useRef } from 'react';
import { Layer, LayerFilterSettings, DEFAULT_FILTER_SETTINGS, ApiConfig, PromptPreset } from './types';
import { storageService } from './services/storageService';
import { apiService } from './services/apiService';
import { exportCompositeImage, loadImage } from './utils/canvasRenderer';

import { Header } from './components/Header';
import { CanvasViewport } from './components/CanvasViewport';
import { PromptPresetGrid } from './components/PromptPresetGrid';
import { ControlBar } from './components/ControlBar';
import { LayerPanel } from './components/LayerPanel';
import { ColorGradingModal } from './components/ColorGradingModal';
import { ApiSettingsModal } from './components/ApiSettingsModal';
import { PhoneSimulatorFrame } from './components/PhoneSimulatorFrame';

export const App: React.FC = () => {
  // 1. 持久化状态初始化
  const [apiConfig, setApiConfig] = useState<ApiConfig>(() => storageService.getApiConfig());
  const [models, setModels] = useState<string[]>(() => storageService.getModels());
  const [presets, setPresets] = useState<PromptPreset[]>(() => storageService.getPresets());
  const [isSimulator, setIsSimulator] = useState<boolean>(() => storageService.getSimulatorMode());

  // 2. 主页面交互状态
  const [selectedPresetId, setSelectedPresetId] = useState<string>(presets[0]?.id || 'preset-anime');
  const [customPrompt, setCustomPrompt] = useState<string>('');
  const [aspectRatio, setAspectRatio] = useState<string>('1:1');
  const [resolution, setResolution] = useState<string>('1024x1024');

  // 3. 图层系统状态
  const [layers, setLayers] = useState<Layer[]>([]);
  const [activeLayerId, setActiveLayerId] = useState<string | null>(null);

  // 4. 弹窗与抽屉控制
  const [isLayerPanelOpen, setIsLayerPanelOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [gradingLayerId, setGradingLayerId] = useState<string | null>(null);

  // 5. 异步操作指示器
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
    storageService.saveApiConfig(apiConfig);
  }, [apiConfig]);

  useEffect(() => {
    storageService.saveModels(models);
  }, [models]);

  useEffect(() => {
    storageService.savePresets(presets);
  }, [presets]);

  useEffect(() => {
    storageService.saveSimulatorMode(isSimulator);
  }, [isSimulator]);

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
        showToast(`成功导入图片 (${img.width}×${img.height})`, 'success');
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

    // 取得当前活跃图层或顶层图层作为参考图
    const targetLayer = layers.find((l) => l.id === activeLayerId) || layers[layers.length - 1];
    const currentPreset = presets.find((p) => p.id === selectedPresetId);
    const combinedPrompt = [currentPreset?.prompt, customPrompt].filter(Boolean).join('，');

    setIsGenerating(true);
    showToast('已向中转站发送图生图请求，AI 正在创作中...', 'info');

    try {
      const generatedImageUrl = await apiService.generateImageToImage({
        baseUrl: apiConfig.baseUrl,
        apiKey: apiConfig.apiKey,
        model: apiConfig.selectedModel,
        prompt: combinedPrompt,
        inputImageBase64: targetLayer.sourceUrl,
        resolution,
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

  // 导出合成图
  const handleExport = async () => {
    if (layers.length === 0) return;

    setIsExporting(true);
    showToast('正在合成高清全图层并导出...', 'info');

    try {
      const { dataUrl, blob } = await exportCompositeImage(layers, 'image/png');

      // 浏览器端直接触发下载
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `PinkLayer_Art_${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showToast('导出成功！已保存高清图像', 'success');
    } catch (err: any) {
      console.error(err);
      showToast('导出图像失败', 'error');
    } finally {
      setIsExporting(false);
    }
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

  const gradingTargetLayer = layers.find((l) => l.id === gradingLayerId) || null;

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

        {/* 顶部导航 */}
        <Header
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenLayerPanel={() => setIsLayerPanelOpen(true)}
          onExport={handleExport}
          layerCount={layers.length}
          isSimulator={isSimulator}
          onToggleSimulator={() => setIsSimulator(!isSimulator)}
          isExporting={isExporting}
        />

        {/* 中间主滚动视图 */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar flex flex-col justify-between pb-2">
          {/* 画布预览视窗 */}
          <CanvasViewport
            layers={layers}
            isGenerating={isGenerating}
            onPickImage={handleTriggerPickImage}
            activeLayerId={activeLayerId}
            aspectRatio={aspectRatio}
          />

          {/* 2×2 提示词预设网格区 */}
          <PromptPresetGrid
            presets={presets}
            selectedPresetId={selectedPresetId}
            onSelectPreset={(p) => setSelectedPresetId(p.id)}
            onUpdatePreset={handleUpdatePreset}
            customPrompt={customPrompt}
            onChangeCustomPrompt={setCustomPrompt}
          />
        </div>

        {/* 底部参数切换与开始生成按钮 */}
        <ControlBar
          models={models}
          selectedModel={apiConfig.selectedModel}
          onChangeModel={(m) => setApiConfig((prev) => ({ ...prev, selectedModel: m }))}
          aspectRatio={aspectRatio}
          onChangeAspectRatio={setAspectRatio}
          resolution={resolution}
          onChangeResolution={setResolution}
          onPickImage={handleTriggerPickImage}
          onStartGeneration={handleStartGeneration}
          isGenerating={isGenerating}
          hasInputImage={layers.length > 0}
        />

        {/* 图层面板侧滑抽屉 */}
        <LayerPanel
          isOpen={isLayerPanelOpen}
          onClose={() => setIsLayerPanelOpen(false)}
          layers={layers}
          activeLayerId={activeLayerId}
          onSelectLayer={setActiveLayerId}
          onToggleVisibility={handleToggleVisibility}
          onMoveUp={handleMoveUp}
          onMoveDown={handleMoveDown}
          onDeleteLayer={handleDeleteLayer}
          onDuplicateLayer={handleDuplicateLayer}
          onChangeOpacity={handleChangeOpacity}
          onChangeBlendMode={handleChangeBlendMode}
          onOpenColorGrading={(id) => setGradingLayerId(id)}
          onAddLayer={handleTriggerPickImage}
        />

        {/* 二级调色与影调调节模态窗 */}
        <ColorGradingModal
          layer={gradingTargetLayer}
          isOpen={gradingLayerId !== null}
          onClose={() => setGradingLayerId(null)}
          onUpdateFilter={handleUpdateFilter}
        />

        {/* API 与模型设置模态窗 */}
        <ApiSettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          config={apiConfig}
          onSaveConfig={(cfg) => {
            setApiConfig(cfg);
            showToast('API 设置已更新保存', 'success');
          }}
          models={models}
          onUpdateModels={(newModels) => {
            setModels(newModels);
            if (!newModels.includes(apiConfig.selectedModel) && newModels.length > 0) {
              setApiConfig((prev) => ({ ...prev, selectedModel: newModels[0] }));
            }
          }}
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
