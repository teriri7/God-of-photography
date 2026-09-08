import React, { useState, useEffect } from 'react';
import { ApiEndpoint, ResolutionMode } from '../types';
import { apiService } from '../services/apiService';
import { DECLUTTER_PRESET, storageService } from '../services/storageService';
import { calculateDimensions, detectClosestAspectRatio } from '../utils/ratioHelper';
import {
  Wand2,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Check,
  X,
  Cpu,
  Ratio,
  Maximize2,
  Eye,
  Loader2,
  Layers,
  FileText,
  Globe,
  ChevronDown,
} from 'lucide-react';

interface SemiSynthesisModalProps {
  isOpen: boolean;
  onClose: () => void;
  baseImage: string; // 当前工作台显示的基准原图
  endpoints: ApiEndpoint[];
  activeEndpointId: string;
  onSelectEndpoint: (id: string) => void;
  initialAspectRatio?: string;
  onAddLayer: (imageUrl: string, layerName: string) => void;
  onToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

const ASPECT_RATIOS = ['1:1', '2:3', '3:2', '3:4', '4:3', '9:16', '16:9'];
const RESOLUTION_OPTIONS: Array<{ value: ResolutionMode; label: string }> = [
  { value: '1K', label: '1K' },
  { value: '2K', label: '2K' },
  { value: '4K', label: '4K' },
];

export const SemiSynthesisModal: React.FC<SemiSynthesisModalProps> = ({
  isOpen,
  onClose,
  baseImage,
  endpoints,
  activeEndpointId,
  onSelectEndpoint,
  initialAspectRatio,
  onAddLayer,
  onToast,
}) => {
  // 当前步骤：1 = 场照除杂, 2 = 角色识别与道具设计, 3 = 最终布景成图
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // 线路与模型配置
  const [currentEndpointId, setCurrentEndpointId] = useState<string>(activeEndpointId);
  const activeEndpoint = endpoints.find((ep) => ep.id === currentEndpointId) || endpoints[0];

  const [selectedModel, setSelectedModel] = useState<string>(() => {
    return activeEndpoint?.selectedModel || storageService.getLastImageModel() || activeEndpoint?.models[0] || '[yu]gemini-3.1-flash-lite-image';
  });

  const [visionModel, setVisionModel] = useState<string>(() => {
    return activeEndpoint?.selectedVisionModel || storageService.getLastVisionModel() || 'tsc1-gpt-5.6-sol';
  });

  // 画幅比例自适应与记忆
  const [aspectRatio, setAspectRatio] = useState<string>(() => initialAspectRatio || storageService.getLastAspectRatio() || '1:1');
  const [autoDetectedRatio, setAutoDetectedRatio] = useState<string | null>(null);

  // 分辨率选择与记忆 (2K/4K)
  const [resolutionMode, setResolutionMode] = useState<ResolutionMode>(() => storageService.getLastResolution() || '2K');

  // 图像状态流转
  const [cleanedImage, setCleanedImage] = useState<string>(''); // 步骤1除杂后的图片
  const [finalImage, setFinalImage] = useState<string>('');     // 步骤3最终布景图片

  // 加载与状态
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processStatus, setProcessStatus] = useState<string>('');

  // 步骤2：角色识别与布景的 6 个核心文本字段
  const [character, setCharacter] = useState<string>('');
  const [sceneTheme, setSceneTheme] = useState<string>('');
  const [groundEffect, setGroundEffect] = useState<string>('');
  const [groundProps, setGroundProps] = useState<string>('');
  const [floatingElements, setFloatingElements] = useState<string>('');
  const [characterAttr, setCharacterAttr] = useState<string>('');
  const [hasRecognized, setHasRecognized] = useState<boolean>(false);

  // 当导入基准图变化时，自动计算自然尺寸并锁定画幅比例（如 4000x6000 -> 2:3）
  useEffect(() => {
    if (baseImage) {
      const img = new Image();
      img.onload = () => {
        if (img.naturalWidth && img.naturalHeight) {
          const detected = detectClosestAspectRatio(img.naturalWidth, img.naturalHeight);
          setAspectRatio(detected);
          setAutoDetectedRatio(detected);
          storageService.saveLastAspectRatio(detected);
        }
      };
      img.src = baseImage;
    }
  }, [baseImage]);

  // 同步外部线路变化
  useEffect(() => {
    if (activeEndpointId && activeEndpointId !== currentEndpointId) {
      setCurrentEndpointId(activeEndpointId);
    }
  }, [activeEndpointId]);

  if (!isOpen) return null;

  // 获取当前正在处理的参考图（如果做完除杂则用除杂图，否则用原图）
  const activeWorkingImage = cleanedImage || baseImage;

  // 线路与模型联动修改处理
  const handleEndpointChange = (newId: string) => {
    setCurrentEndpointId(newId);
    onSelectEndpoint(newId);
    const target = endpoints.find((ep) => ep.id === newId);
    if (target) {
      if (target.selectedModel) {
        setSelectedModel(target.selectedModel);
        storageService.saveLastImageModel(target.selectedModel);
      } else if (target.models?.length) {
        setSelectedModel(target.models[0]);
        storageService.saveLastImageModel(target.models[0]);
      }
      if (target.selectedVisionModel) {
        setVisionModel(target.selectedVisionModel);
        storageService.saveLastVisionModel(target.selectedVisionModel);
      }
    }
  };

  const handleImageModelChange = (model: string) => {
    setSelectedModel(model);
    storageService.saveLastImageModel(model);
  };

  const handleVisionModelChange = (model: string) => {
    setVisionModel(model);
    storageService.saveLastVisionModel(model);
  };

  const handleResolutionChange = (res: ResolutionMode) => {
    setResolutionMode(res);
    storageService.saveLastResolution(res);
  };

  const handleRatioChange = (ratio: string) => {
    setAspectRatio(ratio);
    storageService.saveLastAspectRatio(ratio);
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 步骤 1：执行场照除杂
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const handleRunDeclutter = async () => {
    setIsProcessing(true);
    setProcessStatus('正在调用摄影修图模型进行场照除杂...');
    onToast('开始场照除杂处理...', 'info');

    try {
      const { dimensionStr } = calculateDimensions(aspectRatio, resolutionMode);
      const res = await apiService.generateImageToImage({
        baseUrl: activeEndpoint.baseUrl,
        apiKey: activeEndpoint.apiKey,
        model: selectedModel,
        prompt: DECLUTTER_PRESET.prompt,
        inputImageBase64: baseImage,
        resolution: `${resolutionMode} (${dimensionStr})`,
        aspectRatio,
      });

      setCleanedImage(res);
      // 保存至主工作台图层面板
      onAddLayer(res, '半合成·场照除杂');
      onToast('场照除杂成功！已自动存入图层面板', 'success');
    } catch (err: any) {
      console.error(err);
      onToast(err.message || '除杂请求失败，请检查网络或配置', 'error');
    } finally {
      setIsProcessing(false);
      setProcessStatus('');
    }
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 步骤 2：角色识别与道具设计顾问
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const handleRunRoleRecognition = async () => {
    setIsProcessing(true);
    setProcessStatus('正在调用顾问模型识别 Coser 角色与定制布景道具...');
    onToast('AI 正在观察照片并设计布景...', 'info');

    const promptText = `你是二次元/Cosplay 摄影领域的角色识别与布景顾问。我会给你一张 Cosplay 实拍图, 你要识别画面中 coser 扮演的角色(哪部作品的谁; 认不出具体角色就描述其气质与风格), 然后为「半合成(无垂悬)」功能的各输入框给出建议值。
【本次丰富度档位: 丰富 (4/5)】
要求:
1. 只输出一个 JSON 对象, 不要输出任何其他文字。
2. JSON 必须包含 "character" 键(识别出的角色, 如"作品名的角色名"; 认不出写气质描述), 以及以下每个键: "布景主题", "地面效果", "地面道具", "浮空元素", "角色属性"。
3. 除 "角色属性" 与 "道具密度" 外, 每个键的值都要按【丰富】档位给出 3-4 种元素, 有主次层次, 每个值约 45 字以内; 饱满, 主道具+配景兼备, 用顿号分隔多个物件。 内容要与角色主题呼应、且是现实中存在的实体(本功能成图要求完全写实画风, 严禁发光/魔法/CG 元素)。
4. "角色属性" 值简述角色气质与风格即可(20 字以内)。
5. 值里不要出现【】这两个符号。`;

    try {
      const rawResponse = await apiService.callVisionChat({
        baseUrl: activeEndpoint.baseUrl,
        apiKey: activeEndpoint.apiKey,
        model: visionModel,
        prompt: promptText,
        inputImageBase64: activeWorkingImage,
      });

      const parsed = apiService.parseRoleRecognitionJson(rawResponse);
      setCharacter(parsed.character || '未命名角色');
      setSceneTheme(parsed.sceneTheme || '写实主题漫展布景');
      setGroundEffect(parsed.groundEffect || '写实石板路面与自然散落物');
      setGroundProps(parsed.groundProps || '主题写实落地道具摆件');
      setFloatingElements(parsed.floatingElements || '无悬浮特效实体物件');
      setCharacterAttr(parsed.characterAttr || '英气唯美的Cosplay角色');
      setHasRecognized(true);

      onToast('角色识别与布景顾问设计已完成，可自由编辑！', 'success');
    } catch (err: any) {
      console.error(err);
      onToast(err.message || '角色识别请求失败', 'error');
    } finally {
      setIsProcessing(false);
      setProcessStatus('');
    }
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 步骤 3：组装最终提示词并开始生图
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const handleRunSceneSynthesis = async () => {
    setIsProcessing(true);
    setProcessStatus('正在根据布景参数生成全写实漫展落地场景...');
    onToast('开始现场布景生图...', 'info');

    // 组装完整的官方布景规范提示词
    const fullScenePrompt = `# 漫展现场 · 简单布景提示词（保留漫展背景 · 只加地面效果+周围道具）

> 用途：把一张 Cosplay 漫展实拍图做"现场布景化"——在保留原图漫展背景与人物、人物身上的光 100% 不变的前提下，只在人物脚下/周围的地面做效果、摆放主题道具物件（含少量浮空环绕物），并让它们与现场光线一致、产生真实接触阴影，像在漫展现场给 coser 简单搭出来的场照。
> 关键：不替换背景——漫展就是漫展，背景原样保留，新道具只叠在它前面。

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【★★★ 第一步 · 强制门禁：先做二选一判断，再决定后面做什么 ★★★】
在做任何事之前，先看这张图，做一个非此即彼的判断——只能进入 A 或 B 其中一条路：

【路径B · 不适合】如果这张图是【半身/胸像/大头特写、脚不在画面、画面下方没有容纳地面布景的空间、人物被裁切得看不到落脚点】——那么本次任务的【唯一正确输出】就是：一张【纯黑背景 + 居中白色文字】的图，白字写明原因，例如"此图为半身特写、无脚部与落脚空间，不适合添加地面布景。建议使用含脚部/落脚面的全身图。"。除这行白字外整图纯黑，【不画任何布景/道具/人物/其它内容】。
→ 【重要认知】：遇到不适合的图就输出黑底说明，【这不是失败、不是偷懒，而是本任务要求的、专业且正确的应对】。绝不要因为"想生成点画面"就对一张不适合的图硬加布景——对不适合的图硬做，才是真正的失败。宁可交黑底，也不硬做。

【路径A · 适合】只有当这张图是【全身或近全身、能看到脚部或明确落脚区域、画面下方有空间】时，才进入下面的完整流程去添加地面效果/道具/浮空元素。

判断标准（满足"适合"需同时具备）：① 能看到人物脚部或明确的站立/落脚点；② 画面下方有容纳地面布景的空间；③ 全身或近全身构图（非半身/特写）。三条缺一 → 走路径B。
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

任务：给一张 Cosplay 漫展实拍图做"现场布景化"——在【保留原图人物、原漫展背景 100% 不变】的前提下，在人物脚下/周围生成【主题地面效果、地面道具摆件、少量浮空环绕元素】，并让这些新增物与人物、与地面之间产生【投影与接触阴影】，使整张图看起来像"在漫展现场为这位 coser 简单布置了一个主题小场景"。【关键：新增的地面/道具/浮空物全部是照片级写实真实材质，绝不是塑料/PVC/CG/插画质感】——因为人物是实拍真人、背景是真实漫展现场，新增物必须同为真实质感，做到"真人站在漫展里真实布置的道具中"，而非"真人混进塑料玩具堆或 CG 贴图里"。
（注：以下所有步骤，仅在上面判断为【路径A·适合】时才执行；若判断为【路径B·不适合】，直接输出黑底白字，忽略以下全部。）

【★ 与"换背景"的根本区别（必须守住）】
- 本任务【绝不替换、绝不重绘漫展背景】：背景里的场馆/展台/人群/灯光/墙面/地面远处等，全部原样保留不动。
- 只能在【人物脚下与周围的近处地面、以及人物四周的中近景空间】叠加新的地面效果与道具；新增物可以【叠在原背景前方形成遮挡】，但不得改动、替换、重画背景本身。
- 类比：就像在漫展现场，在 coser 脚边铺点道具、摆几样主题物件——背景还是那个漫展，只是脚下周围被布置了一下。

【 "character": "${character || '漫展Coser'}"】
- 布景主题：${sceneTheme}
- 地面效果：${groundEffect}
- 地面道具：${groundProps}
- 浮空元素：${floatingElements}
- 角色属性描述：${characterAttr}
- 五个框相互独立：填了的框按填入内容做，留空的框各自根据"角色属性/看图分析"自动生成。角色属性框是所有自动判定的方向指引与语义引擎。

【地面效果 — 人物脚下与周围（本任务核心）】
- 在人物脚下/落脚区与周围近处地面，叠加与主题呼应的真实地面效果：铺一层石板/泥土/草地/落叶/积水/瓦砾/沙地/地毯/木板等（按填空或角色气质自动判定），材质【照片级写实】（真石头颗粒风化、真泥土湿感、真草叶脉络、真积水镜面倒影、真落叶质感）。
- 这层地面效果【叠在原漫展地面之上/之前】，覆盖人物脚周的近处地面区域，向四周与远处自然过渡、逐渐融回原背景地面（不做成一块生硬的"地毯边缘"，边缘自然消隐或被道具、虚化掩盖）。
- 【与脚部真实接触】：站立姿态→脚踏在新地面上、有真实接触与压痕/陷入感、脚下有接触阴影；腾空/单脚点地姿态→保持原姿态不动，地面在下方合理承接，不强行拽落地、不改姿态。
- 地面不出现任何文字/铭牌/品牌名，只做纯造型与材质。

【地面道具 — 脚周围的写实摆件】
- 在人物脚下/周围地面摆放主题道具：例如按填空摆放，高低错落、主次分明；【严禁高大物件挡在人物正面关键部位前面】，道具多在人物脚侧、后方或斜前低矮处；材质照片级真实，带自然岁月痕迹或现实制作质感。
- 【真实接触与投影】：所有地面道具底面与新铺地面紧密贴合，在地面投下清晰的接触阴影与方向性漫展投射阴影。

【浮空元素 — 人物四周的中景与背景空间】
- 在人物四周空间添加少量主题呼应的浮空物件：例如飘落花瓣、落叶、绸布幡旗等；【绝对写实实体质感，严禁任何魔法光环、发光法阵、CG光球】；适度运动模糊，烘托现场漫展拍摄氛围。`;

    try {
      const { dimensionStr } = calculateDimensions(aspectRatio, resolutionMode);
      const res = await apiService.generateImageToImage({
        baseUrl: activeEndpoint.baseUrl,
        apiKey: activeEndpoint.apiKey,
        model: selectedModel,
        prompt: fullScenePrompt,
        inputImageBase64: activeWorkingImage,
        resolution: `${resolutionMode} (${dimensionStr})`,
        aspectRatio,
      });

      setFinalImage(res);
      setStep(3);
      // 保存至图层面板
      onAddLayer(res, `半合成·${character || '布景完成'}`);
      onToast('最终布景成图已生成，并自动存入图层！', 'success');
    } catch (err: any) {
      console.error(err);
      onToast(err.message || '生图失败，请检查模型与配置', 'error');
    } finally {
      setIsProcessing(false);
      setProcessStatus('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex flex-col justify-between overflow-hidden animate-in fade-in duration-200 select-none pt-[max(env(safe-area-inset-top,0px),34px)] pb-[max(env(safe-area-inset-bottom,0px),12px)]">
      {/* 顶部紧凑导航条（避让状态栏，精简高度） */}
      <div className="w-full px-3 py-1.5 glass-panel border-b border-pink-200/60 flex items-center justify-between shrink-0 shadow-xs">
        <div className="flex items-center space-x-2 min-w-0">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-pink-500 to-rose-400 flex items-center justify-center text-white shadow-xs shrink-0">
            <Wand2 className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center space-x-1.5">
              <span className="text-xs font-bold text-slate-800 shrink-0">半合成流水线</span>
              <span className="text-[9px] px-1.5 py-0.2 bg-pink-100 text-pink-700 rounded-full font-mono font-bold shrink-0">
                步骤 {step}/3
              </span>
              <span className="text-[9px] text-pink-600 font-medium truncate max-w-[150px]">
                {step === 1 && '场照除杂'}
                {step === 2 && '特征识别与道具'}
                {step === 3 && '落地布景成图'}
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          title="关闭"
          className="w-7 h-7 rounded-full bg-white/80 hover:bg-white text-slate-600 hover:text-slate-900 flex items-center justify-center transition-colors shadow-xs shrink-0 ml-2"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* 中间主内容区（带滚动） */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 no-scrollbar max-w-lg mx-auto w-full">
        {/* 顶部图片预览区：移除硬编码的 aspect-square，自适应原图竖向或横向比例 */}
        <div className="relative w-full max-h-[36vh] min-h-[180px] mx-auto glass-panel p-2 rounded-3xl shadow-lg border border-pink-200/60 overflow-hidden flex items-center justify-center checkerboard-bg">
          <img
            src={step === 3 && finalImage ? finalImage : activeWorkingImage}
            alt="处理预览"
            className="max-h-[34vh] w-auto max-w-full object-contain rounded-2xl shadow-sm transition-all"
          />

          {/* 加载提示蒙层 */}
          {isProcessing && (
            <div className="absolute inset-0 bg-black/50 backdrop-blur-xs flex flex-col items-center justify-center p-4 text-white z-20 animate-in fade-in">
              <Loader2 className="w-8 h-8 text-pink-400 animate-spin mb-2" />
              <p className="text-xs font-bold">{processStatus}</p>
              <p className="text-[10px] text-pink-200 mt-1">处理完成后会自动存入图层面板</p>
            </div>
          )}

          {/* 图像状态与比例微标签 */}
          <div className="absolute bottom-2 left-2 flex items-center space-x-1.5">
            <span className="px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-xs text-[9px] text-white font-medium">
              {step === 1 && (cleanedImage ? '已除杂预览' : '原图')}
              {step === 2 && (cleanedImage ? '使用除杂图' : '使用原图')}
              {step === 3 && (finalImage ? '最终布景图' : '待生成')}
            </span>
            <span className="px-2 py-0.5 rounded-full bg-pink-600/80 backdrop-blur-xs text-[9px] text-white font-mono font-bold">
              {aspectRatio}
            </span>
            <span className="px-2 py-0.5 rounded-full bg-slate-800/80 backdrop-blur-xs text-[9px] text-white font-bold">
              {resolutionMode}
            </span>
          </div>
        </div>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {/* 步骤 1 视图：场照除杂 */}
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {step === 1 && (
          <div className="space-y-2.5 animate-in fade-in duration-200">
            {/* 选项参数配置卡 */}
            <div className="glass-panel p-3 rounded-2xl space-y-2 border border-pink-200/50">
              {/* API 线路与图像模型并排选择 */}
              <div className="grid grid-cols-2 gap-2">
                {/* API 线路 */}
                <div className="flex items-center space-x-1 min-w-0">
                  <span className="text-[10px] font-bold text-pink-700 flex items-center space-x-0.5 shrink-0">
                    <Globe className="w-3 h-3 text-pink-500" />
                    <span>线路:</span>
                  </span>
                  <div className="relative flex-1 min-w-0">
                    <select
                      value={currentEndpointId}
                      onChange={(e) => handleEndpointChange(e.target.value)}
                      className="w-full glass-input appearance-none px-2 py-1 rounded-xl text-xs font-semibold text-pink-700 pr-5 truncate"
                    >
                      {(endpoints || []).map((ep) => (
                        <option key={ep.id} value={ep.id}>{ep.name}</option>
                      ))}
                    </select>
                    <ChevronDown className="w-3 h-3 text-pink-400 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                {/* 图像模型 */}
                <div className="flex items-center space-x-1 min-w-0">
                  <span className="text-[10px] font-bold text-pink-700 flex items-center space-x-0.5 shrink-0">
                    <Cpu className="w-3 h-3 text-pink-500" />
                    <span>模型:</span>
                  </span>
                  <div className="relative flex-1 min-w-0">
                    <select
                      value={selectedModel}
                      onChange={(e) => handleImageModelChange(e.target.value)}
                      className="w-full glass-input appearance-none px-2 py-1 rounded-xl text-xs text-slate-800 pr-5 truncate"
                    >
                      {(activeEndpoint?.models || []).map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                    <ChevronDown className="w-3 h-3 text-slate-400 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* 画面比例与分辨率快速切换 */}
              <div className="flex items-center justify-between pt-1 border-t border-pink-100 gap-2">
                {/* 比例选择 */}
                <div className="flex items-center space-x-1 overflow-x-auto no-scrollbar py-0.5">
                  <span className="text-[10px] text-slate-500 font-medium shrink-0 flex items-center">
                    <Ratio className="w-3 h-3 text-pink-500 mr-0.5" /> 比例:
                  </span>
                  {ASPECT_RATIOS.map((ratio) => {
                    const isSelected = aspectRatio === ratio;
                    const isAuto = autoDetectedRatio === ratio;
                    return (
                      <button
                        key={ratio}
                        type="button"
                        onClick={() => handleRatioChange(ratio)}
                        className={`px-1.5 py-0.5 rounded-md text-[9px] font-semibold shrink-0 transition-all ${
                          isSelected
                            ? 'bg-gradient-to-r from-pink-500 to-rose-400 text-white shadow-xs'
                            : 'bg-white/70 hover:bg-pink-100 text-slate-600 border border-pink-100'
                        }`}
                      >
                        {ratio}
                        {isAuto && <span className="ml-0.5 text-[7px] text-pink-200">原图</span>}
                      </button>
                    );
                  })}
                </div>

                {/* 分辨率 1K / 2K / 4K 模式 */}
                <div className="flex items-center space-x-1 shrink-0">
                  <span className="text-[10px] text-slate-500 font-medium flex items-center">
                    <Maximize2 className="w-3 h-3 text-pink-500 mr-0.5" /> 分辨率:
                  </span>
                  <div className="flex bg-pink-100/60 p-0.5 rounded-lg border border-pink-200/50">
                    {RESOLUTION_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => handleResolutionChange(opt.value)}
                        className={`px-1.5 py-0.2 rounded-md text-[9px] font-bold transition-all ${
                          resolutionMode === opt.value
                            ? 'bg-white text-pink-600 shadow-xs'
                            : 'text-slate-600 hover:text-pink-600'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 预设信息提示卡 */}
              <div className="p-2 rounded-xl bg-pink-50/60 border border-pink-100 text-[10px] text-slate-600">
                <span className="font-bold text-pink-600">默认预设: 场照除杂</span>
                <p className="line-clamp-2 mt-0.5 text-slate-500 font-mono text-[9px]">
                  {DECLUTTER_PRESET.prompt}
                </p>
              </div>
            </div>

            {/* 步骤1按钮区 */}
            <div className="space-y-2 pt-1">
              {!cleanedImage ? (
                <div className="flex space-x-2">
                  <button
                    onClick={handleRunDeclutter}
                    disabled={isProcessing}
                    className="flex-1 py-3 px-3 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-400 hover:from-pink-600 hover:to-rose-500 disabled:opacity-40 text-white font-bold text-xs shadow-md shadow-pink-300/60 flex items-center justify-center space-x-1.5 active:scale-98"
                  >
                    <Wand2 className="w-4 h-4" />
                    <span>开始除杂</span>
                  </button>

                  <button
                    onClick={() => setStep(2)}
                    disabled={isProcessing}
                    className="px-4 py-3 rounded-2xl bg-white/80 hover:bg-pink-100 text-slate-700 font-bold text-xs border border-pink-200 shadow-xs flex items-center space-x-1 active:scale-98"
                  >
                    <span>下一步/跳过</span>
                    <ArrowRight className="w-3.5 h-3.5 text-pink-500" />
                  </button>
                </div>
              ) : (
                /* 已完成除杂后的操作 */
                <div className="flex space-x-2">
                  <button
                    onClick={handleRunDeclutter}
                    disabled={isProcessing}
                    className="flex-1 py-3 px-3 rounded-2xl bg-white/80 hover:bg-pink-100 text-slate-700 font-bold text-xs border border-pink-200 shadow-xs flex items-center justify-center space-x-1.5 active:scale-98"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-pink-600" />
                    <span>循环除杂</span>
                  </button>

                  <button
                    onClick={() => setStep(2)}
                    disabled={isProcessing}
                    className="flex-[1.5] py-3 px-3 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-400 hover:from-pink-600 hover:to-rose-500 text-white font-bold text-xs shadow-md shadow-pink-300/60 flex items-center justify-center space-x-1.5 active:scale-98"
                  >
                    <span>下一步：选择模型与识别角色</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {/* 步骤 2 视图：角色识别与道具布景顾问 */}
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {step === 2 && (
          <div className="space-y-3 animate-in fade-in duration-200">
            {/* 视觉分析模型 (Vision LLM) 自由选择卡 */}
            <div className="glass-panel p-2.5 rounded-2xl border border-pink-200/50 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                {/* 线路选择 */}
                <div className="flex items-center space-x-1 min-w-0">
                  <span className="text-[10px] font-bold text-slate-700 flex items-center space-x-0.5 shrink-0">
                    <Globe className="w-3 h-3 text-pink-500" />
                    <span>线路:</span>
                  </span>
                  <div className="relative flex-1 min-w-0">
                    <select
                      value={currentEndpointId}
                      onChange={(e) => handleEndpointChange(e.target.value)}
                      className="w-full glass-input appearance-none px-2 py-1 rounded-xl text-xs font-semibold text-pink-700 pr-5 truncate"
                    >
                      {(endpoints || []).map((ep) => (
                        <option key={ep.id} value={ep.id}>{ep.name}</option>
                      ))}
                    </select>
                    <ChevronDown className="w-3 h-3 text-pink-400 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                {/* 视觉模型选择 */}
                <div className="flex items-center space-x-1 min-w-0">
                  <span className="text-[10px] font-bold text-slate-700 flex items-center space-x-0.5 shrink-0">
                    <Sparkles className="w-3 h-3 text-pink-500" />
                    <span>LLM模型:</span>
                  </span>
                  <div className="relative flex-1 min-w-0">
                    <select
                      value={visionModel}
                      onChange={(e) => handleVisionModelChange(e.target.value)}
                      className="w-full glass-input appearance-none px-2 py-1 rounded-xl text-xs font-mono text-slate-800 pr-5 truncate"
                    >
                      {(activeEndpoint?.models || []).map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                    <ChevronDown className="w-3 h-3 text-slate-400 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* 启动识别按钮：点击之后才开始识别 */}
              <button
                onClick={handleRunRoleRecognition}
                disabled={isProcessing}
                className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-pink-500 to-rose-400 hover:from-pink-600 hover:to-rose-500 text-white text-xs font-bold shadow-md shadow-pink-300/50 flex items-center justify-center space-x-1.5 active:scale-98 disabled:opacity-50"
              >
                <Sparkles className={`w-3.5 h-3.5 ${isProcessing ? 'animate-spin' : ''}`} />
                <span>{character ? '重新识别角色与布景' : '开始识别角色与布景'}</span>
              </button>
            </div>

            {/* 六项核心内容独立编辑框 */}
            <div className="glass-panel p-3 rounded-2xl border border-pink-200/60 space-y-2.5">
              <div className="flex items-center justify-between pb-1 border-b border-pink-100">
                <span className="text-xs font-bold text-slate-800">
                  角色与布景参数 (六项自由编辑)
                </span>
                <span className="text-[9px] text-pink-500 font-medium">
                  {character ? '已填充，可自由微调' : '点击上方「开始识别」或手动填写'}
                </span>
              </div>

              {/* 1. 角色名 */}
              <div>
                <label className="text-[10px] font-bold text-pink-600 block mb-0.5">
                  1. 识别角色 (character):
                </label>
                <input
                  type="text"
                  value={character}
                  onChange={(e) => setCharacter(e.target.value)}
                  placeholder="例如：原神的刻晴"
                  className="w-full glass-input px-2.5 py-1.5 rounded-xl text-xs text-slate-800 font-semibold"
                />
              </div>

              {/* 2. 布景主题 */}
              <div>
                <label className="text-[10px] font-bold text-pink-600 block mb-0.5">
                  2. 布景主题:
                </label>
                <textarea
                  rows={2}
                  value={sceneTheme}
                  onChange={(e) => setSceneTheme(e.target.value)}
                  placeholder="例如：璃月中式古风庭院，青瓦飞檐亭台、雕花石栏、朱红廊柱..."
                  className="w-full glass-input px-2.5 py-1.5 rounded-xl text-xs text-slate-800 resize-none"
                />
              </div>

              {/* 3. 地面效果 */}
              <div>
                <label className="text-[10px] font-bold text-pink-600 block mb-0.5">
                  3. 地面效果:
                </label>
                <textarea
                  rows={2}
                  value={groundEffect}
                  onChange={(e) => setGroundEffect(e.target.value)}
                  placeholder="例如：青石板仿古地砖、局部青苔痕迹、细碎落叶..."
                  className="w-full glass-input px-2.5 py-1.5 rounded-xl text-xs text-slate-800 resize-none"
                />
              </div>

              {/* 4. 地面道具 */}
              <div>
                <label className="text-[10px] font-bold text-pink-600 block mb-0.5">
                  4. 地面道具:
                </label>
                <textarea
                  rows={2}
                  value={groundProps}
                  onChange={(e) => setGroundProps(e.target.value)}
                  placeholder="例如：古朴石质灯座、散落干桂花、矮款紫砂花钵..."
                  className="w-full glass-input px-2.5 py-1.5 rounded-xl text-xs text-slate-800 resize-none"
                />
              </div>

              {/* 5. 浮空元素 */}
              <div>
                <label className="text-[10px] font-bold text-pink-600 block mb-0.5">
                  5. 浮空元素:
                </label>
                <textarea
                  rows={2}
                  value={floatingElements}
                  onChange={(e) => setFloatingElements(e.target.value)}
                  placeholder="例如：垂落绸布幡旗、悬挂纸质灯笼、屋檐垂挂流苏挂饰..."
                  className="w-full glass-input px-2.5 py-1.5 rounded-xl text-xs text-slate-800 resize-none"
                />
              </div>

              {/* 6. 角色属性 */}
              <div>
                <label className="text-[10px] font-bold text-pink-600 block mb-0.5">
                  6. 角色属性描述:
                </label>
                <input
                  type="text"
                  value={characterAttr}
                  onChange={(e) => setCharacterAttr(e.target.value)}
                  placeholder="例如：飒爽干练，清冷英气的璃月女剑士"
                  className="w-full glass-input px-2.5 py-1.5 rounded-xl text-xs text-slate-800 font-semibold"
                />
              </div>
            </div>

            {/* 步骤2底部操作栏 */}
            <div className="flex space-x-2 pt-1">
              <button
                onClick={() => setStep(1)}
                className="px-4 py-3 rounded-2xl bg-white/80 hover:bg-pink-100 text-slate-700 font-bold text-xs border border-pink-200 shadow-xs flex items-center space-x-1"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-pink-500" />
                <span>上一步</span>
              </button>

              <button
                onClick={() => setStep(3)}
                className="flex-1 py-3 px-3 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-400 hover:from-pink-600 hover:to-rose-500 text-white font-bold text-xs shadow-md shadow-pink-300/60 flex items-center justify-center space-x-1.5 active:scale-98"
              >
                <span>下一步：确认布景并生图</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {/* 步骤 3 视图：最终落地布景生图 */}
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {step === 3 && (
          <div className="space-y-3 animate-in fade-in duration-200">
            {/* 生图参数确认卡片 */}
            <div className="glass-panel p-3 rounded-2xl space-y-2 border border-pink-200/50">
              <div className="grid grid-cols-2 gap-2">
                {/* 线路选择 */}
                <div className="flex items-center space-x-1 min-w-0">
                  <span className="text-[10px] font-bold text-pink-700 flex items-center space-x-0.5 shrink-0">
                    <Globe className="w-3 h-3 text-pink-500" />
                    <span>线路:</span>
                  </span>
                  <div className="relative flex-1 min-w-0">
                    <select
                      value={currentEndpointId}
                      onChange={(e) => handleEndpointChange(e.target.value)}
                      className="w-full glass-input appearance-none px-2 py-1 rounded-xl text-xs font-semibold text-pink-700 pr-5 truncate"
                    >
                      {(endpoints || []).map((ep) => (
                        <option key={ep.id} value={ep.id}>{ep.name}</option>
                      ))}
                    </select>
                    <ChevronDown className="w-3 h-3 text-pink-400 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                {/* 生图模型 */}
                <div className="flex items-center space-x-1 min-w-0">
                  <span className="text-[10px] font-bold text-pink-700 flex items-center space-x-0.5 shrink-0">
                    <Cpu className="w-3 h-3 text-pink-500" />
                    <span>模型:</span>
                  </span>
                  <div className="relative flex-1 min-w-0">
                    <select
                      value={selectedModel}
                      onChange={(e) => handleImageModelChange(e.target.value)}
                      className="w-full glass-input appearance-none px-2 py-1 rounded-xl text-xs text-slate-800 pr-5 truncate"
                    >
                      {(activeEndpoint?.models || []).map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                    <ChevronDown className="w-3 h-3 text-slate-400 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* 比例与分辨率展示与切换 */}
              <div className="flex items-center justify-between pt-1 border-t border-pink-100 gap-2">
                <div className="flex items-center space-x-1 overflow-x-auto no-scrollbar py-0.5">
                  <span className="text-[10px] text-slate-500 font-medium shrink-0 flex items-center">
                    <Ratio className="w-3 h-3 text-pink-500 mr-0.5" /> 比例:
                  </span>
                  {ASPECT_RATIOS.map((ratio) => (
                    <button
                      key={ratio}
                      type="button"
                      onClick={() => handleRatioChange(ratio)}
                      className={`px-1.5 py-0.5 rounded-md text-[9px] font-semibold shrink-0 transition-all ${
                        aspectRatio === ratio
                          ? 'bg-gradient-to-r from-pink-500 to-rose-400 text-white shadow-xs'
                          : 'bg-white/70 hover:bg-pink-100 text-slate-600 border border-pink-100'
                      }`}
                    >
                      {ratio}
                    </button>
                  ))}
                </div>

                <div className="flex items-center space-x-1 shrink-0">
                  <span className="text-[10px] text-slate-500 font-medium flex items-center">
                    <Maximize2 className="w-3 h-3 text-pink-500 mr-0.5" /> 分辨率:
                  </span>
                  <div className="flex bg-pink-100/60 p-0.5 rounded-lg border border-pink-200/50">
                    {RESOLUTION_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => handleResolutionChange(opt.value)}
                        className={`px-1.5 py-0.2 rounded-md text-[9px] font-bold transition-all ${
                          resolutionMode === opt.value
                            ? 'bg-white text-pink-600 shadow-xs'
                            : 'text-slate-600 hover:text-pink-600'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 提示概要 */}
              <div className="p-2 rounded-xl bg-pink-50/60 border border-pink-100 text-[10px] text-slate-600">
                <span className="font-bold text-pink-600">角色: {character || '未指定'}</span>
                <p className="text-[9px] text-slate-500 mt-0.5 truncate">
                  主题: {sceneTheme || '写实漫展布景'} | 道具: {groundProps || '写实地表摆件'}
                </p>
              </div>
            </div>

            {/* 如果已生成成图 */}
            {finalImage && (
              <div className="p-3 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-[11px] text-emerald-800 flex items-center space-x-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>布景大片已成功生成，并已自动添加至工作台图层列表中！</span>
              </div>
            )}

            {/* 生图与导航按钮 */}
            <div className="flex space-x-2 pt-1">
              <button
                onClick={() => setStep(2)}
                className="px-4 py-3 rounded-2xl bg-white/80 hover:bg-pink-100 text-slate-700 font-bold text-xs border border-pink-200 shadow-xs flex items-center space-x-1 shrink-0"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-pink-500" />
                <span>修改布景</span>
              </button>

              <button
                onClick={handleRunSceneSynthesis}
                disabled={isProcessing}
                className="flex-1 py-3 px-3 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-400 hover:from-pink-600 hover:to-rose-500 disabled:opacity-40 text-white font-bold text-xs shadow-md shadow-pink-300/60 flex items-center justify-center space-x-1.5 active:scale-98"
              >
                <Wand2 className="w-4 h-4" />
                <span>{finalImage ? '重新生图' : '开始全写实现场布景生图'}</span>
              </button>

              {finalImage && (
                <button
                  onClick={onClose}
                  className="px-4 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-md shadow-emerald-200 flex items-center space-x-1 shrink-0 active:scale-98"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>完成</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

