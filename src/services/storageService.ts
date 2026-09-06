import { ApiConfig, PromptPreset } from '../types';

const STORAGE_KEYS = {
  API_CONFIG: 'pinklayer_api_config',
  MODELS: 'pinklayer_models',
  PRESETS: 'pinklayer_presets',
  SIMULATOR_MODE: 'pinklayer_simulator_mode',
};

export const DEFAULT_API_CONFIG: ApiConfig = {
  baseUrl: 'https://api.momoapi.icu/',
  apiKey: 'sk-HopXIFgvhinItOuMgOVUGT8Z80PuINBhGr4FKK7ZDW2VZ06J',
  selectedModel: '[yu]gemini-3.1-flash-lite-image',
};

export const DEFAULT_PRESETS: PromptPreset[] = [
  {
    id: 'preset-anime',
    title: '二次元立绘',
    subtitle: '清透少女/赛璐璐风',
    prompt: '二次元动漫风格，精致的二次元少女立绘，清澈明亮的双眸，细腻的发丝细节，樱花粉色调，高质量立绘，Masterpiece, highly detailed anime art',
    iconName: 'Sparkles',
  },
  {
    id: 'preset-film',
    title: '胶片写真',
    subtitle: '复古暖调/梦幻光影',
    prompt: '电影感胶片写真，35mm柯达胶片质感，柔和的漫射暖光，微微的胶片颗粒，自然柔光氛围，复古色调，8k高清细节，cinematic film photography, soft aesthetic',
    iconName: 'Camera',
  },
  {
    id: 'preset-cyberpunk',
    title: '赛博霓虹',
    subtitle: '未来科幻/绚丽光斑',
    prompt: '赛博朋克霓虹光影，粉蓝渐变流光，未来都市科幻背景，全息投影粒子，边缘高光，梦幻炫光，cyberpunk neon lights, luminous glow, ultra detailed',
    iconName: 'Zap',
  },
  {
    id: 'preset-enhance',
    title: '极简高级',
    subtitle: '高清重绘/清透质感',
    prompt: '极简高级感写真，通透自然的皮肤质感，柔和的环境光，优雅的构图，画面极其精致细腻，超清画质，8k resolution, elegant masterpiece, clean background',
    iconName: 'Palette',
  },
];

export const storageService = {
  getApiConfig(): ApiConfig {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.API_CONFIG);
      if (data) {
        return { ...DEFAULT_API_CONFIG, ...JSON.parse(data) };
      }
    } catch (e) {
      console.error('Failed to load api config:', e);
    }
    return DEFAULT_API_CONFIG;
  },

  saveApiConfig(config: ApiConfig): void {
    try {
      localStorage.setItem(STORAGE_KEYS.API_CONFIG, JSON.stringify(config));
    } catch (e) {
      console.error('Failed to save api config:', e);
    }
  },

  getModels(): string[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.MODELS);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.error('Failed to load models:', e);
    }
    return ['[yu]gemini-3.1-flash-lite-image', '[yu1]gemini-3.1-flash-image', 'gpt-image-2'];
  },

  saveModels(models: string[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.MODELS, JSON.stringify(models));
    } catch (e) {
      console.error('Failed to save models:', e);
    }
  },

  getPresets(): PromptPreset[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PRESETS);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.error('Failed to load presets:', e);
    }
    return DEFAULT_PRESETS;
  },

  savePresets(presets: PromptPreset[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.PRESETS, JSON.stringify(presets));
    } catch (e) {
      console.error('Failed to save presets:', e);
    }
  },

  getSimulatorMode(): boolean {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SIMULATOR_MODE);
      return data !== null ? JSON.parse(data) : true;
    } catch {
      return true;
    }
  },

  saveSimulatorMode(enabled: boolean): void {
    try {
      localStorage.setItem(STORAGE_KEYS.SIMULATOR_MODE, JSON.stringify(enabled));
    } catch (e) {
      console.error('Failed to save simulator mode:', e);
    }
  }
};
