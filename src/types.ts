export interface LayerFilterSettings {
  // 一级调色
  temperature: number;   // -100 ~ 100 (冷/暖)
  tint: number;          // -100 ~ 100 (品红/绿)
  brightness: number;    // -100 ~ 100
  contrast: number;      // -100 ~ 100
  saturation: number;    // -100 ~ 100
  
  // 二级影调
  shadows: number;       // -100 ~ 100
  highlights: number;    // -100 ~ 100
  exposure: number;      // -100 ~ 100
  hueRotate: number;     // -180 ~ 180
}

export const DEFAULT_FILTER_SETTINGS: LayerFilterSettings = {
  temperature: 0,
  tint: 0,
  brightness: 0,
  contrast: 0,
  saturation: 0,
  shadows: 0,
  highlights: 0,
  exposure: 0,
  hueRotate: 0,
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
