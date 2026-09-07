export interface LayerFilterSettings {
  // Camera Raw 核心基本面板参数
  exposure: number;     // 曝光 (-100 ~ 100)
  contrast: number;     // 对比度 (-100 ~ 100)
  highlights: number;   // 高光 (-100 ~ 100)
  shadows: number;      // 阴影 (-100 ~ 100)
  whites: number;       // 白色 (-100 ~ 100)
  blacks: number;       // 黑色 (-100 ~ 100)
  temperature: number;  // 色温 (-100 ~ 100)
  tint: number;         // 色调 (-100 ~ 100)
  saturation: number;   // 饱和度 (-100 ~ 100)
}

export const DEFAULT_FILTER_SETTINGS: LayerFilterSettings = {
  exposure: 0,
  contrast: 0,
  highlights: 0,
  shadows: 0,
  whites: 0,
  blacks: 0,
  temperature: 0,
  tint: 0,
  saturation: 0,
};

export interface Layer {
  id: string;
  name: string;
  visible: boolean;
  opacity: number; // 0 ~ 100
  blendMode: GlobalCompositeOperation;
  sourceUrl: string; // Base64 or ObjectURL
  width: number;
  height: number;
  filter: LayerFilterSettings;
  createdAt: number;
}

export interface ApiConfig {
  baseUrl: string;
  apiKey: string;
  selectedModel: string;
}

export interface ApiEndpoint {
  id: string;
  name: string;               // 自定义简单名称, 如 "MomoAPI", "个人中转", "备用线路"
  baseUrl: string;
  apiKey: string;
  models: string[];           // 该线路独立拉取的模型列表
  selectedModel?: string;     // 该线路记忆的默认生图模型
  selectedVisionModel?: string; // 该线路记忆的默认视觉模型
}

export interface PromptPreset {
  id: string;
  title: string;
  subtitle: string;
  prompt: string;
  iconName: string;
}

export type ResolutionMode = '1K' | '2K' | '4K';

export interface ResolutionOption {
  label: string;
  value: string;
  width: number;
  height: number;
}

export interface AspectRatioOption {
  label: string;
  value: string;
  ratio: number;
}
