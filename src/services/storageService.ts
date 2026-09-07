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

export const DECLUTTER_PRESET: PromptPreset = {
  id: 'preset-declutter',
  title: '场照除杂',
  subtitle: '摄影修图师级智能去除路人/灯架/反光板/杂物并无缝背景修补',
  prompt: '{"role":"摄影后期修图师","base_rules":{"preserve_composition":true,"preserve_model":"严禁改变模特的动作、表情、服装、肤色","preserve_background_structure":"保证背景除杂物外的建筑框架、地面、墙体结构完全不变","preserve_global_hsl_gamma":true,"no_scale_rotate_translate":true},"detection":{"identify_clutter":"自动识别画面中不属于场景原有结构的穿帮元素：路人/观众/围观者、摄影灯/灯架/灯罩/反光板/柔光箱、三脚架/摄影包/水瓶等工作人员物品、地面电线/胶带标记","identify_background":"分析背景材质类型(墙面/地面/植被/天空)、纹理模式、光影方向，用于修补参考"},"removal_operations":{"people_removal":{"action":"完全移除背景中所有路人和工作人员","inpaint":"移除区域使用周围背景材质智能填充，纹理方向、透视比例、光影明暗与邻近区域完全一致"},"equipment_removal":{"action":"移除所有摄影设备(灯架/灯罩/反光板/线缆/标记胶带)","light_preservation":"移除灯具后不改变其光照效果——灯的光源效果保留，只移除灯具实体","inpaint":"设备遮挡区域使用场景原有材质(墙面砖纹/地面纹理/植物)精确重建"},"debris_removal":{"action":"移除地面零散杂物(垃圾/落叶堆/水瓶/其他不相关物品)","ground_rebuild":"地面修补区域与周围地砖/地板/草地纹理无缝衔接"}},"quality_control":{"texture_match":"所有修补区域的材质纹理(砖缝/木纹/草地)方向和密度与周围完全匹配","light_match":"修补区域的光影渐变与原图一致，无突兀的亮斑或暗区","perspective_match":"修补纹理的透视缩放与场景消失点一致","edge_blend":"修补区域边缘与周围无缝融合，无可见AI修补痕迹","noise_match":"修补区域噪点颗粒度与原图完全一致"}}',
  iconName: 'Wand2',
};

export const DEFAULT_PRESETS: PromptPreset[] = [
  DECLUTTER_PRESET,
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
        const parsed: PromptPreset[] = JSON.parse(data);
        const exists = parsed.some((p) => p.id === 'preset-declutter');
        if (!exists) {
          return [DECLUTTER_PRESET, ...parsed];
        }
        return parsed;
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
