import { ApiConfig, ApiEndpoint, PromptPreset, ResolutionMode } from '../types';

const STORAGE_KEYS = {
  API_CONFIG: 'pinklayer_api_config',
  API_ENDPOINTS: 'pinklayer_api_endpoints',
  ACTIVE_ENDPOINT_ID: 'pinklayer_active_endpoint_id',
  MODELS: 'pinklayer_models',
  PRESETS: 'pinklayer_presets_v3',
  PRESETS_VERSION: 'pinklayer_presets_version',
  SIMULATOR_MODE: 'pinklayer_simulator_mode',
  LAST_IMAGE_MODEL: 'pinklayer_last_image_model',
  LAST_VISION_MODEL: 'pinklayer_last_vision_model',
  LAST_RESOLUTION: 'pinklayer_last_resolution',
  LAST_ASPECT_RATIO: 'pinklayer_last_aspect_ratio',
};

export const DEFAULT_API_CONFIG: ApiConfig = {
  baseUrl: 'https://api.momoapi.icu/',
  apiKey: '',
  selectedModel: '[yu]gemini-3.1-flash-lite-image',
};

export const DEFAULT_ENDPOINTS: ApiEndpoint[] = [
  {
    id: 'endpoint-momo',
    name: 'MomoAPI',
    baseUrl: 'https://api.momoapi.icu/',
    apiKey: '',
    models: [
      '[yu]gemini-3.1-flash-lite-image',
      '[yu1]gemini-3.1-flash-image',
      '[yu]gemini-3.1-flash-image-preview',
      'tsc1-gpt-5.6-sol',
      'gpt-image-2',
      'gpt-4o',
    ],
    selectedModel: '[yu]gemini-3.1-flash-lite-image',
    selectedVisionModel: 'tsc1-gpt-5.6-sol',
  },
];

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
    id: 'preset-fufu',
    title: 'Fufu玩偶',
    subtitle: 'Chibi Q版毛绒玩偶/场景趣味互动',
    prompt: `{"role":"ACG角色设计合成师","base_rules":{"preserve_composition":true,"preserve_model":true,"no_scale_rotate_translate":true},"detection":{"identify_character":"分析模特Cos角色的服装特征、配饰、发色发型、IP属性","identify_scene":"分析场景中可供玩偶互动的位置(肩膀/头顶/地面/道具旁)"},"fufu_generation":{"design":{"count":"在角色周围随机位置插入1-8个Fufu风格毛绒玩偶","proportion":"Chibi/Q版比例：头身比约1:1至1:1.5，头大身小","costume":"每个玩偶穿着模特角色服装的微缩复制品(含头饰/配饰/武器迷你版)","face":"圆润可爱的面部，略呆萌的表情(^_^或>_<等)，简化的五官","material":"毛绒玩具质感：柔软蓬松的短绒布料(Roughness 0.7-0.9)，缝线可见"},"interaction":{"behaviors":"每个玩偶与场景产生不同的可爱互动：攀爬模特手臂/肩膀、在模特头顶偷看、地面拥抱模特脚踝、骑在道具上、互相叠罗汉、举着迷你武器摆pose","variety":"每个玩偶姿势和表情不同，增加画面趣味性"},"placement":{"random":"分布位置随机自然，避免对称排列","depth":"可在不同景深层：前景/中景/模特身上","occlusion":"玩偶与模特和场景物体的遮挡关系正确"}},"integration":{"lighting":"每个玩偶受原图光源照射，产生正确的高光和投影","shadow":"玩偶在接触面(肩膀/地面)产生柔和投影","color_tone":"玩偶色调与原图整体色调协调","noise_match":"噪点一致"},"constraints":{"严禁":"改变模特任何特征、玩偶遮挡模特面部","禁止":"玩偶风格不统一、玩偶比例过大(每个应为模特身高的10-20%)"}}`,
    iconName: 'Smile',
  },
  {
    id: 'preset-glitter-hair',
    title: '亮闪闪头发',
    subtitle: '哑光CG质感/微观碎钻闪烁发丝',
    prompt: `{"role":"Cosplay人像后期修图师","base_rules":{"preserve_composition":true,"preserve_face":"STRICTLY RETAIN面部不做任何修改","preserve_hairstyle":"保持原有发型结构流向长度","preserve_body":true,"no_scale_rotate_translate":true},"detection":{"identify":"分析头发当前材质(假发/真发)、光泽状态、杂发分布、打卷缠绕区域"},"hair_processing":{"cleanup":{"flyaways":"移除所有飞散杂发和毛躁","tangles":"消除缠绕打结区域","stray_on_body":"清除遮挡面部/手臂/肩部的散落发丝","split_ends":"修复干枯分叉的发尾"},"material_override":{"surface":"消除假发合成纤维的塑料高光，替换为Matte CG texture哑光CG质感","sheen":"表面呈现柔和的丝缎光泽(Roughness 0.35-0.5)而非廉价的镜面反光"},"micro_shimmer":{"selection":"随机选取20-30根极细发丝作为亮点发丝","effect":"在这些细丝上添加微观的多色闪烁光点(microscopic multi-colored shimmering points)","color":"闪烁点颜色为白色/浅金/浅蓝/浅粉的随机微弱色彩(Opacity 20-40%)","distribution":"闪光点沿发丝均匀分布，每根亮丝3-8个光点","appearance":"手绘luminous aesthetic发光美学质感，如同发丝上镶嵌了极微小的碎钻"}},"constraints":{"严禁":"改变面部/身体/背景、改变发型结构颜色发量","禁止":"闪光过强过密导致整体廉价感"},"integration":{"light_match":"闪光高光方向与原图光源一致","noise_match":"噪点一致"}}`,
    iconName: 'Sparkles',
  },
  {
    id: 'preset-remove-shorts',
    title: '去打底',
    subtitle: '打底裤移除/裙摆微延防走光/腿部材质重构',
    prompt: `// scene_type: 商业Cosplay后期 · 打底裤移除与腿部材质重构

// system_role: 你是一位专精Cosplay后期修图与二次元角色还原的数字艺术家。你的核心任务是：移除Coser为了防走光而穿着的、不属于原角色设计的“打底裤（Safety Shorts / Base layer shorts）”，并完美重构被遮挡的大腿区域。你必须精准识别大腿根部不自然的布料堆积、褶皱和勒痕来锁定打底裤区域。由于打底裤可能内穿或外穿于丝袜/网袜，你必须提取下半段真实的腿部材质进行无缝向上顺延。为了绝对防止由于移除打底裤导致露出三角区内裤（走光）或触发NSFW风险，你必须强制执行“裙摆下拉”操作，用自然延伸的裙摆物理覆盖绝对安全区。你的认知基准是：角色设定绝对还原 + 绝对安全防走光 + 腿部材质无缝顺延。

// ═══════════════════════════════════════
// 防护性锁定（至高红线）
// ═══════════════════════════════════════
// strict_sfw_and_anti_exposure: true — 至高红线：绝对禁止生成任何暴露三角区、内裤、底裤或生殖器官的NSFW图像。在移除打底裤后，必须通过向下延伸裙摆或服饰边缘，彻底遮盖大腿根部危险区域。
// preserve_character_design: true — 严禁改变Cosplay角色的原设服装款式、主体颜色、配饰和发型。仅允许对裙摆长度做微调以覆盖危险区。
// preserve_leg_geometry: true — 严禁在移除打底裤后改变大腿的粗细、肌肉走向、动作姿态和空间透视。
// preserve_lower_legwear: true — 严禁改变打底裤下方（未被遮挡区）的原始皮肤肤色、丝袜D数或网袜网格属性，这些是重建上半部分的唯一基准。

// ═══════════════════════════════════════
// 检测与基准记录
// ═══════════════════════════════════════
// 如果收到图像，就首先执行以下检测并记录为基准：
// 1. 识别打底裤区域：寻找大腿上部出现的黑色、白色或肉色紧身布料，重点锁定“大腿根部的横向布料褶皱”、“紧绷堆积感”以及“带有明显厚度或勒痕的水平布料边缘”。
// 2. 识别遮挡关系：判断打底裤是穿在丝袜/网袜外面，还是穿在里面透出颜色。
// 3. 识别原腿部材质：提取打底裤下方无遮挡大腿区域的材质属性（裸肤色 / 纯色丝袜 / 蕾丝网袜 / 复杂印花裤袜）。
// 4. 识别防走光边界：锁定裙底三角区危险边界，计算需要将裙摆下拉多少厘米才能完美覆盖该区域。

// ═══════════════════════════════════════
// 核心处理模块（7个控制滑块）
// ═══════════════════════════════════════

// MODULE_START:防走光裙摆下拉
// @param:防走光裙摆下拉": 0.62
// @param:防走光裙摆下拉_desc": "【最高优先级】在移除打底裤前，强制将裙摆向下延伸以覆盖三角危险区。0.0=不下拉（极高走光风险，模块删除）；0.5=轻微下拉遮挡根部；1.0=安全下拉至大腿绝对安全线。建议默认1.00"
如果该参数大于0，就必须在处理腿部之前优先重构裙摆几何形态。
如果该参数处于0.0-0.5，就识别原裙摆最低点，将其向下顺延2-3厘米，刚好遮住三角区与大腿的交界线。
如果该参数处于0.5-0.8，就将裙子整体视觉长度拉长，确保任何视角下都无法看到内裤区域。
如果该参数大于0.8，就执行绝对安全的裙摆下拉覆盖：依据当前空间透视，将前侧或侧面的裙摆布料自然垂下或顺着重力方向拉长，形成一个完美的物理遮挡罩，将绝对危险区完全封死。
// MODULE_END:防走光裙摆下拉

// MODULE_START:裙摆边缘形态重建
// @param:裙摆边缘形态重建": 0.55
// @param:裙摆边缘形态重建_desc": "确保下拉后的裙摆边缘与原服装款式（百褶、蕾丝、荷叶边、平角）完全一致。0.0=生硬拉伸；0.5=基础边缘平滑；1.0=完美复制原裙摆的复杂工艺与褶皱结构。建议默认0.85"
如果该参数大于0，就对新延长的裙摆进行款式匹配。
如果该参数处于0.0-0.5，就消除下拉裙摆时产生的像素拉伸感，修正生硬的切边。
如果该参数处于0.5-0.8，就精准识别原裙摆是百褶裙、荷叶边还是蕾丝边，并在下拉后的新边缘处完美重构这些工艺细节。
如果该参数大于0.8，就要求下拉部分的布料褶皱、受光反光、材质厚度与原裙子100%一致，严禁出现像“贴抹布”一样的突兀延长带，必须像裙子原本就这么长一样自然。
// MODULE_END:裙摆边缘形态重建

// MODULE_START:打底裤识别与移除
// @param:打底裤识别与移除": 1.00
// @param:打底裤识别与移除_desc": "通过识别布料褶皱和堆积来彻底擦除打底裤。0.0=保留打底裤；0.5=移除边缘明显的打底裤；1.0=彻底清除包括隐性内穿在内的所有打底裤布料、勒痕与褶皱。建议默认1.00"
如果该参数大于0，就强制执行打底裤擦除指令。
如果该参数处于0.0-0.5，就识别大腿上明显的黑色、白色或肉色平角短裤边缘，将其擦除。
如果该参数处于0.5-0.8，就重点锁定大腿根部的“横向布料褶皱”和“由于走动产生的布料堆积”，将这些属于打底裤的物理特征彻底剥离。
如果该参数大于0.8，就执行无死角清除：无论打底裤是穿在丝袜外面（阻断了丝袜），还是穿在丝袜里面（导致该区域颜色发黑/发灰），都必须将其存在痕迹完全抹除，释放被占据的大腿空间。
// MODULE_END:打底裤识别与移除

// MODULE_START:原腿部材质无缝顺延
// @param:原腿部材质无缝顺延": 1.00
// @param:原腿部材质无缝顺延_desc": "用打底裤下方真实的皮肤或纯色丝袜材质向上填补空白。0.0=不处理；0.5=基础颜色填补；1.0=完美继承下半段的肤色、丝袜D数和微观质感，无缝向上顺延。建议默认1.00"
如果该参数大于0，就在移除打底裤后，重构暴露出来的大腿区域。
如果该参数处于0.0-0.5，就提取下半段大腿的平均颜色，向上进行基础填色。
如果该参数处于0.5-0.8，就严格判定底层属性：如果是裸腿，就向上延伸真实的肤色与毛孔；如果是透肉黑丝/白丝，就严格继承下半段的“丹尼数（透肤度）”和反光特性，向上铺满。
如果该参数大于0.8，就必须做到绝对的无缝衔接：严禁在新旧交接处（原打底裤边缘位置）出现色差断层、亮度断层或材质突变。上半截新生成的大腿必须看起来和下半截是完全一体的。
// MODULE_END:原腿部材质无缝顺延

// MODULE_START:复杂网袜与纹理对齐
// @param:复杂网袜与纹理对齐": 0.00
// @param:复杂网袜与纹理对齐_desc": "专门针对网袜、蕾丝袜或印花袜，重建时强制网格对齐。0.0=忽略网格（可能糊掉）；0.5=生成类似网格；1.0=完美计算透视与曲率，使上下网格严丝合缝。建议默认0.80"
如果该参数大于0，且检测到腿部材质包含网格、蕾丝图案或复杂印花时，强制激活几何对齐。
如果该参数处于0.0-0.5，就在重建区生成粗略的同色系网格。
如果该参数处于0.5-0.8，就提取下方网袜的菱形大小、线材粗细，向上进行图案仿制。
如果该参数大于0.8，就执行严谨的曲面映射：新生成的网袜纹理必须顺应大腿的圆柱体透视曲率，并与原下方网格在交界处实现“线条对齐连通”，严禁出现网格错位、断线、大小突变或图案扭曲。如果是肉丝则此模块静默不影响画面。
// MODULE_END:复杂网袜与纹理对齐

// MODULE_START:大腿光影与结构匀化
// @param:大腿光影与结构匀化": 0.52
// @param:大腿光影与结构匀化_desc": "消除打底裤造成的肉体勒痕，恢复大腿圆柱体受光结构。0.0=保留勒痕阴影；0.5=消除边缘勒痕；1.0=重塑大腿完美圆滑的光影滚降过渡。建议默认0.75"
如果该参数大于0，就对重构后的大腿执行结构修复。
如果该参数处于0.0-0.5，就彻底消除原打底裤收口处挤压大腿肉造成的“凹陷勒痕”或暗沉带。
如果该参数处于0.5-0.8，就统一大腿根部到中段的亮度，消除因移除物体导致的局部过亮或过暗斑驳。
如果该参数大于0.8，就重塑大腿的三维立体感：依据全局光照方向，在腿部中间保留高光，向两侧边缘自然滚降压暗（Cylindrical Shading），使失去打底裤约束的大腿呈现真实、饱满、圆润的肉体结构。
// MODULE_END:大腿光影与结构匀化

// MODULE_START:裙底投影重建
// @param:裙底投影重建": 1.00
// @param:裙底投影重建_desc": "为下拉后的新裙摆在大腿上重新计算物理投影。0.0=无阴影（裙子悬浮）；0.5=基础AO环境遮蔽；1.0=完美匹配主光源方向的真实裙底轮廓投影。建议默认0.90"
如果该参数大于0，就必须处理裙摆与大腿的空间光影关系。
如果该参数处于0.0-0.5，就在裙摆边缘正下方的大腿上生成一圈基础的接触暗角（AO）。
如果该参数处于0.5-0.8，就消除原先旧裙摆在大腿下部留下的错误投影残留。
如果该参数大于0.8，就依据当前画面的主光源角度，计算下拉后的新裙摆边缘在大腿上产生的新投影（Cast Shadow）。投影的形状必须与新裙摆的百褶/波浪形态相吻合，边缘软硬度需匹配原图的阴影特征，确保裙子稳稳地“盖”在腿上而不是悬浮在空中。
// MODULE_END:裙底投影重建

// ═══════════════════════════════════════
// 执行顺序与融合校验红线
// ═══════════════════════════════════════
// 步骤1 [危险区锁定] 识别三角区与打底裤边界，计算防走光下拉距离。
// 步骤2 [物理遮罩建立] 按 防走光裙摆下拉 和 裙摆边缘形态重建 优先延长裙子，彻底封死NSFW危险区。
// 步骤3 [特征剥离] 按 打底裤识别与移除 识别并擦除所有带褶皱的紧身布料及勒痕。
// 步骤4 [材质顺延] 按 原腿部材质无缝顺延 取下半段无遮挡腿部材质向上覆盖空白区。
// 步骤5 [纹理对齐] 按 复杂网袜与纹理对齐 修正网格与蕾丝的物理连通性。
// 步骤6 [体积重塑] 按 大腿光影与结构匀化 恢复大腿圆润饱满的受光面。
// 步骤7 [空间锚定] 按 裙底投影重建 重新生成裙子遮盖大腿的自然阴影。
// 步骤8 [至高校验 — SUPREME] 检查：是否走光露出内裤？如果露出，强制加长裙摆回退重算！大腿是否有原打底裤的堆积残留？如果有，重新擦除匀化！
// 【至高红线】整个处理过程必须保证输出结果是一张极度干净、绝对SFW（安全）、完美还原角色设定的Cosplay大片。`,
    iconName: 'Scissors',
  },
  {
    id: 'preset-remove-ladder',
    title: '去梯子',
    subtitle: '移除支撑物/保持动作体型/背景无痕修补',
    prompt: '去掉人物下面的黑色梯子，不要改变人物的动作和体型，真实，清晰，符合景深，要有质感，8k，不改变地面的透视，（根据人物动作判断人物是否悬空），不改变人物的动作和映射光以及服饰',
    iconName: 'Wand2',
  },
  {
    id: 'preset-smoke',
    title: '烟雾特效',
    subtitle: '地面干冰流动/空中漫射烟雾氛围',
    prompt: '在背景的海面和前景的沙滩上添加一些烟雾，烟雾要求类似干冰一样在地面上飘动，飘散在空中的烟雾要求动态感并且被左侧后方的主光照射，要求真实感，营造烟雾弥漫的感觉，整体色调保持不变，保持光影不变，保持人物的动作不变',
    iconName: 'Cloud',
  },
  {
    id: 'preset-face-liquify',
    title: '热机脸',
    subtitle: '面部五官轮廓液化精雕/倒三角精致小脸',
    prompt: `// MODULE_START:facial_liquify
// @param:liquify_intensity": 0.70
// @param:liquify_intensity_desc": "五官液化修改程度。0.0=完全不做任何液化，保持原图五官和脸型不变（此模块将被自动删除）；0.3=轻微调整，仅修正偏差最大的1-2个维度；0.5=中等程度，所有偏差维度均执行但变形量减半；0.7=标准修改，各维度按目标比例的70%靠拢（推荐默认）；1.0=完全液化至目标比例，所有五官和脸型严格对齐目标参数；建议默认0.70"

你是一个Cosplay照片面部液化专精后期师。你只执行面部五官和轮廓的液化变形操作，不做任何磨皮、调色、光影、锐化、背景处理。

===== 全局严禁事项 =====
严禁改变构图、动作、发型、服装、光影、肤质纹理、背景、全局HSL、妆容风格。
严禁裁剪、缩放、旋转画面。
严禁改变眼球视线方向、瞳孔颜色、睫毛数量长度。
严禁改变眉毛形状、粗细、颜色、毛流方向。
严禁改变唇色、唇部妆效、牙齿可见度。
严禁改变鼻部皮肤纹理质感、毛孔密度、高光色温。
严禁改变耳朵位置形态、颈部轮廓。
严禁添加或移除面部的痣、雀斑、面部彩绘等标记。
仅允许面部区域像素位移（液化/变形）。

===== 检测与测量 =====
识别面部关键点：内外眼角、上下眼睑轮廓、瞳孔中心、眉头眉尾眉峰、山根最低点、鼻梁中线、鼻背脊线、鼻尖最前端点、鼻尖球体轮廓、鼻翼外缘（左右）、鼻翼下缘、鼻小柱、鼻底三角区、鼻唇角、人中、上唇峰、下唇底缘、唇角、唇珠、下颌线全程（耳垂下方至下巴尖）、下颌角、颧骨最宽点、太阳穴。

测量当前值：
- 三庭比例（发际线或额头上缘到眉底 / 眉底到鼻底 / 鼻底到下巴尖）
- 眼裂纵高 / 鼻长 比值
- 虹膜直径 / 眼裂宽度 比值
- 内眼角间距 / 单眼眼裂宽度 比值
- 鼻翼宽度 / 内眼角间距 比值
- 鼻头直径 / 同侧眼裂宽度 比值
- 鼻梁侧面阴影带宽度 / 鼻头宽度 比值
- 鼻唇角角度
- 鼻尖最前端相对鼻翼下缘高度差
- 鼻小柱长度
- 山根凹陷深度（相对眉间平面）
- 唇宽 / 两瞳孔内缘间距 比值
- 上唇厚度 / 下唇厚度 比值
- 人中长度 / 下庭长度 比值
- 下巴长度 / 下庭长度 比值
- 眉底到上眼睑距离 / 中庭高度 比值
- 下巴尖宽度 / 下颌最宽处宽度 比值

将各测量值与下方目标对比计算偏差。每个维度的实际变形量 = 偏差量 × liquify_intensity（当前值0.70）。

===== 目标比例总表 =====

【三庭与整体】
三庭 ≈ 1 : 0.85 : 0.75（中庭略短于上庭，下庭明显短于中庭）
面中紧凑：鼻底到上唇中线距离应被压缩

【眼部】
眼间距 ≈ 1.10~1.15倍单眼眼裂宽度（略宽于标准一眼距）
眼裂纵高 ≈ 鼻长的60%~70%
虹膜直径 ≈ 眼裂宽度的65%~70%
内眼角尖锐下勾，外眼角微上扬≤8°，形成钝角猫眼轮廓
上眼睑弧度饱满，最高点在瞳孔外缘正上方
下眼睑平直偏圆，不做明显下至
眉眼距 ≈ 中庭高度的45%（偏大，营造清冷感）

【鼻部——深度特化】
山根：极低平，凹陷深度≤1mm视觉量（相对眉间平面），与眉间几乎齐平。如果当前山根偏高偏深，将山根区域向前推平。
鼻梁宽度：侧面阴影带≤鼻头宽度的40%。如果偏宽，将鼻梁两侧向中线推挤收窄。
鼻梁走势：从山根到鼻尖呈微内凹浅弧线——中段（鼻梁1/2处）为弧线最低点，向鼻尖方向缓缓翘起。如果当前是直线或驼峰，将中段向面部方向微压形成浅凹弧，凹陷量≤鼻梁宽度的10%。
鼻头形态：紧致小球体，从四周向中心收拢塑球。直径 ≈ 同侧眼裂宽度的22-28%。鼻头宽度 ≈ 内眼角间距的45-55%。
鼻尖翘度：鼻尖最前端高于鼻翼下缘（微翘），鼻唇角95-105°。如果鼻唇角偏小（鼻尖朝下），将鼻尖向上向前推移，翘起量≤鼻头直径15%。
鼻翼：极窄极薄，外缘≤鼻头等宽。如果外扩则向鼻中线推挤。侧面观鼻翼边缘应极薄（纸片感），如果偏厚将鼻翼下缘向上微推减薄。
鼻孔：正面完全不可见——如果可见则将鼻翼下缘和鼻小柱向下向内推挤遮盖。3/4侧面仅允许隐约一条细缝。
鼻小柱：极短，鼻尖下缘到上唇起点距离尽量压缩。如果偏长优先将鼻尖向下微推缩短。
整体存在感：鼻部应为"弱存在"——鼻梁中段不应有强烈明暗对比体积感，视觉重心仅集中在鼻尖一个小高光球和鼻底一条极淡阴影。

【唇部】
唇宽 ≈ 两瞳孔内缘间距（偏窄小嘴）
上唇薄，唇峰清晰浅M形；下唇饱满，厚度 ≈ 上唇1.6~1.8倍
唇珠明显，上唇中央微向前推出
人中 ≈ 下庭的20%~22%（极短人中）。如果偏长，将上唇整体刚性上推缩短人中

【下颌与下巴】
倒三角/心形脸——颧骨为最大面宽，不收窄；太阳穴饱满
下颌角极度弱化不可见。如果下颌角明显，将其向内向上推挤使转折消失
下颌线从颧骨下方急剧收窄至尖下巴
下巴 ≈ 下庭的40%（短下巴）。如果偏长则上推下巴尖
下巴尖宽度 ≈ 下颌最宽处的18-22%，尖而圆润（非方形非平切）

===== 执行顺序 =====
1. 检测——面部关键点识别与全维度测量
2. 三庭整体比例——确定各区域目标位置，计算各维度变形量（偏差×0.70）
3. 下颌线与下巴——下颌角消除、下颌收窄、下巴缩短塑尖
4. 眼部——眼裂放大、眼角形态调整、虹膜放大、眼距校正
5. 眉部——眉眼距调整（仅整体平移眉毛，不改眉形）
6. 鼻部——按以下子顺序执行：山根压平 → 鼻梁收窄+弧度调整 → 鼻头缩小塑球 → 鼻翼收拢减薄 → 鼻尖翘度调整 → 鼻孔遮盖 → 鼻小柱缩短
7. 唇部——唇宽收窄、上下唇厚度调整、唇珠塑形、人中缩短
8. 融合校验——全局过渡检查与伪影消除

===== 融合约束 =====
所有变形边界过渡带≥变形量3倍半径，渐变平滑，严禁突变折痕或像素撕裂。
左右镜像对称执行相同方向和量级，允许保留原图≤2%的自然不对称。
液化后皮肤毛孔、细纹、汗毛等微观纹理密度和方向须与变形后曲面法线一致，禁止纹理拉伸模糊。
鼻部与面颊、上唇交界处必须无缝融合，禁止凹陷沟壑或突起棱线。
鼻部高光和阴影位置应随形态变化自然偏移，但光源方向和色温严禁改变。
最终结果不得出现任何液化痕迹：无波纹、无果冻感、无局部模糊斑块。
// MODULE_END:facial_liquify`,
    iconName: 'Smile',
  },
  {
    id: 'preset-face-refine',
    title: '精修脸',
    subtitle: 'SSS次表面通透瓷肌/微钻眼妆/BJD人偶级精修',
    prompt: `{\n  "role": "资深Cosplay人像摄影后期与CG材质渲染大师",\n  "base_rules": {\n    "preserve_composition": true,\n    "preserve_background": true,\n    "preserve_lighting_global": true,\n    "preserve_body_pose": true,\n    "preserve_costume": true,\n    "preserve_hairstyle_main_structure": true,\n    "preserve_face_identity": true,\n    "preserve_expression": true,\n    "preserve_global_hsl_gamma": true,\n    "no_rotation_scale_flip": true,\n    "no_face_reconstruction": true,\n    "strict_match_original_skin_tone": true\n  },\n  "style_target": {\n    "core_aesthetic": "极度精致、通透发光、BJD人偶级CG精修与真人摄影的完美融合。",\n    "texture_engine": "启用次表面散射(SSS)质感、微距级真实毛孔保留、碎钻级微光反射。",\n    "forbidden_style": "绝对禁止任何2D手绘感、笔触感、平涂色块感、过度液化的假面感。"\n  },\n  "operations": [\n    "【前置扫描】：精准识别真人原图的五官位置、骨相轮廓、肤色冷暖调、妆面分布及角色IP属性。严肃参考原人物设计，所有操作仅限‘原位材质升级’。",\n    "【底妆与肤质强化】：清除黑眼圈、法令纹与脏灰杂色。在【严格锁定原图肤色和环境色温】的前提下，将面部材质升级为带微弱次表面散射(SSS)的通透奶油瓷肌，保留极其细微的真人毛孔，让皮肤呈现出从内向外散发的柔和光泽(Soft Focus Bloom)，拒绝平面的死白与塑料感。",\n    "【眼妆极致精修】：在原眼型和原妆面基础上，注入‘碎钻感(Micro-diamond shimmer)’眼妆。眼球渲染为清透的玻璃材质，强化符合原环境光的星空感Catchlights；生成极其精细的微距级手绘感分簇睫毛(根根分明，绝不结块)；配合自然且立体的微光卧蚕，极大提升眼神的无辜感与摄人心魄的精致度。",\n    "【光影与骨相微雕】：沿用原图光照方向，在额头、鼻梁、鼻尖、颧骨最高点叠加微珠光(Pearlescent)高光，配合极轻微的阴影修容，打造出类似极品BJD人偶的面部折叠度，但严禁改变原本的脸型长宽比例。",\n    "【唇部晶莹质感】：保留原图口红颜色、唇形及嘴角走势。仅在唇峰和下唇中央区域增加细腻的‘轻水光/微晶反射’，凸显娇嫩润泽感，但严格控制高光面积与强度，严禁生成油腻的强镜面果冻唇或突兀的白斑高光。",\n    "【边缘融合与发丝】：移除压脸的杂乱碎发，但保留贴合脸部曲线的氛围感主发丝。面部与脖子、头发、背景的交界处必须做100%无缝的真实光影过渡。"\n  ],\n  "constraints": {\n    "严格锁定": "五官位置、色相、饱和度、明度必须完全锁定，不变形、不移位、不改色。",\n    "色彩红线": "绝不允许出现脸白脖子黄、脸冷背景暖等任何面部色差断层现象。",\n    "内容红线": "绝对不允许无中生有！严禁在脸上生成原图不存在的泪痣、雀斑、泪珠、水滴、大块亮片、面部贴纸、额外花纹或多余毛发。",\n    "画风红线": "必须是‘带有CG级光影的真人照片’，严禁生成‘像画出来的插画’。"\n  }\n}`,
    iconName: 'Sparkles',
  },
  {
    id: 'preset-tight-clothes',
    title: '紧绷衣服',
    subtitle: '服装收紧贴合/张力褶皱重塑/质感焕新',
    prompt: `{"role":"Cosplay服装后期修图师","base_rules":{"preserve_composition":true,"preserve_costume_design":"完全不改变服装款式、材质种类、颜色、图案、配饰位置","preserve_pose":true,"no_scale_rotate_translate":true},"detection":{"identify":"分析服装当前状态：不美观的塌陷褶皱/堆积褶皱位置、布料松弛区域、服装与身体的贴合度、面料类型(棉/丝/皮革/针织)"},"tightening_operations":{"fit_enhancement":{"action":"让服装整体更贴身绷紧，呈现自然的受力张力","degree":"紧绷程度增加约15-25%，让服装更好地展现身体曲线","body_contact":"服装面料更紧密贴合身体表面轮廓，减少空隙"},"wrinkle_cleanup":{"remove":"移除不美观的塌陷褶皱(重力导致的松弛堆积)、堆积褶皱(布料多余导致的团状折叠)","preserve":"仅保留符合受力逻辑的张力褶(拉伸产生的放射状细纹)和转折褶(弯曲部位的自然折叠)","redistribute":"褶皱重新分布到关节弯曲处和服装受力点"},"fabric_refresh":{"surface":"布料表面更崭新顺滑，消除使用痕迹和起球","tension_lines":"在胸部/腰部/臀部等受力区域可见微弱的张力纹，体现服装紧绷的物理真实性","material_sheen":"面料光泽恢复到崭新状态：丝绸光滑、棉织紧密、皮革光亮"}},"constraints":{"严禁":"改变服装款式剪裁/材质/颜色/图案、改变配饰位置、改变模特动作","禁止":"服装过紧呈现不自然的真空贴合、褶皱完全消除呈塑料感"},"integration":{"light_match":"布料收紧后高光和阴影根据新曲面重新计算","noise_match":"噪点一致"}}`,
    iconName: 'Shirt',
  },
  {
    id: 'preset-metallic-prop',
    title: '道具金属化',
    subtitle: '道具升级为真实金属PBR材质/光泽磨损',
    prompt: `{"role":"资深道具后期修图师","base_rules":{"preserve_composition":true,"preserve_background":true,"preserve_lighting_global":true,"preserve_body_pose":true,"preserve_costume":true,"no_rotation_scale_flip":true,"preserve_global_hsl_gamma":true},"description":"保持物体结构颜色花纹不变，将道具材质从塑料/树脂/泡沫升级为真实金属制品。通过4个参数精确控制金属类型、光泽度、磨损和锈蚀程度","detection":{"identify":"识别道具当前材质(塑料/树脂/EVA/纸板)和表面处理(喷漆/贴纸)","identify_shape":"分析道具形状结构和表面细节"},"@param:金属类型":0.5,"@param:金属类型_desc":"0=冷色钢铁(蓝灰色调Metalness0.85+冷色环境反射);0.25=银色不锈钢(亮银色高反射);0.5=铜合金/青铜(暖黄铜色中等反射绿锈倾向);0.75=红铜/紫铜(暖红铜色柔和反射);1=黄金(高饱和金黄色极高反射率暖色高光)","@param:金属光泽":0.7,"@param:金属光泽_desc":"0=完全哑光磨砂(Roughness0.8+无可见环境反射);0.25=磨砂金属(Roughness0.6柔和反射);0.5=缎面光泽(Roughness0.4中等反射);0.75=光亮金属(Roughness0.2清晰反射);1=镜面抛光(Roughness0.05完美镜面反射环境清晰可辨)","@param:磨损程度":0.2,"@param:磨损程度_desc":"0=全新无任何使用痕迹表面完美;0.2=微弱使用痕迹极浅划痕;0.5=中度磨损边缘磨亮握把区域光滑;0.7=重度磨损大面积划痕磨损边缘磨圆;1=极度磨损包浆深厚划痕密布表面粗糙","@param:锈蚀程度":0,"@param:锈蚀程度_desc":"0=无锈蚀金属表面干净;0.2=微弱锈点散布在凹槽和边缘;0.5=中度锈蚀表面30%覆盖铁锈/铜绿;0.7=大面积锈蚀60%覆盖质感粗糙;1=严重锈蚀几乎全覆盖铁锈层厚实","operations":{"material_swap":"移除塑料/树脂的质感(消除合模线塑料光泽)替换为金属PBR材质","surface":"根据金属类型设置基础色和Metalness","reflection":"根据光泽参数设置Roughness和环境反射清晰度","wear":"根据磨损参数添加划痕/磨损贴图","rust":"根据锈蚀参数叠加铁锈/铜绿纹理"},"constraints":{"严禁":"改变道具形状/花纹/图案位置","禁止":"金属质感呈现2D喷漆感而非真实金属PBR"},"integration":{"light_match":"金属反射方向与光源一致","noise_match":"噪点一致"}}`,
    iconName: 'Shield',
  },
  {
    id: 'preset-wind-hair',
    title: '飘头发',
    subtitle: '空气感发丝飘散/自然物理抛物线风动',
    prompt: `{"role":"Cosplay人像后期修图师","base_rules":{"preserve_composition":true,"preserve_face":true,"preserve_hair_color":true,"no_scale_rotate_translate":true},"detection":{"identify":"分析头发长度方向、发型结构、风向暗示(衣物飘动方向)、光源方向"},"wind_hair":{"physics":{"root_fixed":"发根到中段保持固定不动(约发长前30%)","mid_sway":"中段开始微弱跟随风向偏移(5-15度)","tip_flow":"发梢轻盈飘散(15-45度偏移)，最大自由度","gravity":"下垂的长发在风中呈自然的弧线抛物线形态"},"wind_direction":{"unified":"所有发丝跟随统一风向飘动","consistency":"风向与场景其他飘动元素一致(如衣服裙摆)"},"detail":{"highlight_strands":"添加5-10根略亮于底色的单独发丝，增加空气感和层次感","strand_separation":"飘起的发丝之间有自然的间隙透出背景","tip_taper":"飘散的发梢收尖渐细"},"texture":{"quality":"飘动区域的发丝保持与原图一致的材质和光泽","flyaway":"可有2-3根极细的飞散发丝增加动感"}},"background_repair":"发丝移动后原位置需重建背景","constraints":{"严禁":"改变发色/发型结构、改变面部、头发飘动方向不统一","禁止":"飘动幅度过大呈暴风效果"},"integration":{"light_match":"飘动发丝的高光方向与光源一致","noise_match":"噪点一致"}}`,
    iconName: 'Wind',
  },
  {
    id: 'preset-black-stockings',
    title: '黑丝高亮',
    subtitle: '各向异性光泽/20-40D半透明立体受光',
    prompt: `{"role":"Cosplay服装后期修图师","base_rules":{"preserve_composition":true,"preserve_pose":true,"preserve_leg_shape":true,"no_scale_rotate_translate":true},"detection":{"identify":"分析当前黑丝状态、光源方向、腿部曲面朝向"},"hosiery_enhancement":{"material_upgrade":{"denier":"优化为20-40旦尼尔半透明黑色尼龙","transparency":"皮肤透过丝袜隐约可见(Opacity 65-80%)","texture":"丝袜纹理均匀细腻无破损"},"highlight_enhancement":{"technique":"增强各向异性(Anisotropic)光泽突出腿部三维体积感","shape":"高光呈宽幅柔和渐变的光带(非锐利点状)沿腿部圆柱体纵向分布","intensity":"高光强度40-60%，增强Specular呈现丝滑光泽","primary_zones":"大腿前侧中心线和小腿前侧中心线为主高光区域(最亮)","secondary":"大腿外侧和小腿外侧为次高光区域(略弱)","falloff":"高光从腿部中心向两侧柔和渐变衰减","direction":"所有高光方向与原图光源一致"},"volume_sculpting":{"action":"通过高光和阴影强化腿部圆柱体积感和立体感","thigh":"大腿处高光宽幅(体现大腿的圆润饱满)","calf":"小腿处高光较窄(体现小腿的修长纤细)","knee":"膝盖处有独立的微弱高光凸起"}},"constraints":{"严禁":"改变腿部形状粗细、丝袜颜色变化","禁止":"高光过强呈塑料/乳胶感"},"integration":{"light_match":"光泽方向与光源一致","noise_match":"噪点一致"}}`,
    iconName: 'Sparkles',
  },
];

export const storageService = {
  getEndpoints(): ApiEndpoint[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.API_ENDPOINTS);
      if (data) {
        const parsed: ApiEndpoint[] = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
      const oldConfig = localStorage.getItem(STORAGE_KEYS.API_CONFIG);
      if (oldConfig) {
        const parsedOld = JSON.parse(oldConfig);
        let models = DEFAULT_ENDPOINTS[0].models;
        try {
          const rawModels = localStorage.getItem(STORAGE_KEYS.MODELS);
          if (rawModels) {
            const parsedModels = JSON.parse(rawModels);
            if (Array.isArray(parsedModels) && parsedModels.length > 0) {
              models = parsedModels;
            }
          }
        } catch {}

        const migrated: ApiEndpoint = {
          id: 'endpoint-migrated',
          name: '默认线路',
          baseUrl: parsedOld.baseUrl || DEFAULT_API_CONFIG.baseUrl,
          apiKey: parsedOld.apiKey || DEFAULT_API_CONFIG.apiKey,
          models,
          selectedModel: parsedOld.selectedModel || DEFAULT_API_CONFIG.selectedModel,
          selectedVisionModel: 'tsc1-gpt-5.6-sol',
        };
        try {
          localStorage.setItem(STORAGE_KEYS.API_ENDPOINTS, JSON.stringify([migrated]));
        } catch {}
        return [migrated];
      }
    } catch (e) {
      console.error('Failed to load api endpoints:', e);
    }
    return DEFAULT_ENDPOINTS;
  },

  saveEndpoints(endpoints: ApiEndpoint[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.API_ENDPOINTS, JSON.stringify(endpoints));
    } catch (e) {
      console.error('Failed to save api endpoints:', e);
    }
  },

  getActiveEndpointId(): string {
    try {
      const id = localStorage.getItem(STORAGE_KEYS.ACTIVE_ENDPOINT_ID);
      if (id) return id;
    } catch (e) {
      console.error('Failed to get active endpoint id:', e);
    }
    return DEFAULT_ENDPOINTS[0].id;
  },

  saveActiveEndpointId(id: string): void {
    try {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_ENDPOINT_ID, id);
    } catch (e) {
      console.error('Failed to save active endpoint id:', e);
    }
  },

  getActiveEndpoint(): ApiEndpoint {
    const endpoints = this.getEndpoints();
    let activeId = '';
    try {
      activeId = localStorage.getItem(STORAGE_KEYS.ACTIVE_ENDPOINT_ID) || '';
    } catch {}
    return endpoints.find((e) => e.id === activeId) || endpoints[0] || DEFAULT_ENDPOINTS[0];
  },

  updateEndpoint(id: string, updates: Partial<ApiEndpoint>): ApiEndpoint[] {
    const endpoints = this.getEndpoints();
    const updated = endpoints.map((ep) => (ep.id === id ? { ...ep, ...updates } : ep));
    this.saveEndpoints(updated);
    return updated;
  },

  getApiConfig(): ApiConfig {
    const active = this.getActiveEndpoint();
    return {
      baseUrl: active.baseUrl,
      apiKey: active.apiKey,
      selectedModel: this.getLastImageModel() || active.selectedModel || DEFAULT_API_CONFIG.selectedModel,
    };
  },

  saveApiConfig(config: ApiConfig): void {
    try {
      localStorage.setItem(STORAGE_KEYS.API_CONFIG, JSON.stringify(config));
      const activeId = this.getActiveEndpointId();
      this.updateEndpoint(activeId, {
        baseUrl: config.baseUrl,
        apiKey: config.apiKey,
        selectedModel: config.selectedModel,
      });
    } catch (e) {
      console.error('Failed to save api config:', e);
    }
  },

  getLastImageModel(): string {
    try {
      const model = localStorage.getItem(STORAGE_KEYS.LAST_IMAGE_MODEL);
      if (model) return model;
    } catch (e) {
      console.error('Failed to load last image model:', e);
    }
    const active = this.getActiveEndpoint();
    return active.selectedModel || active.models[0] || '[yu]gemini-3.1-flash-lite-image';
  },

  saveLastImageModel(model: string): void {
    try {
      localStorage.setItem(STORAGE_KEYS.LAST_IMAGE_MODEL, model);
      const activeId = this.getActiveEndpointId();
      this.updateEndpoint(activeId, { selectedModel: model });
    } catch (e) {
      console.error('Failed to save last image model:', e);
    }
  },

  getLastVisionModel(): string {
    try {
      const model = localStorage.getItem(STORAGE_KEYS.LAST_VISION_MODEL);
      if (model) return model;
    } catch (e) {
      console.error('Failed to load last vision model:', e);
    }
    const active = this.getActiveEndpoint();
    return active.selectedVisionModel || 'tsc1-gpt-5.6-sol';
  },

  saveLastVisionModel(model: string): void {
    try {
      localStorage.setItem(STORAGE_KEYS.LAST_VISION_MODEL, model);
      const activeId = this.getActiveEndpointId();
      this.updateEndpoint(activeId, { selectedVisionModel: model });
    } catch (e) {
      console.error('Failed to save last vision model:', e);
    }
  },

  getLastResolution(): ResolutionMode {
    try {
      const res = localStorage.getItem(STORAGE_KEYS.LAST_RESOLUTION);
      if (res === '1K' || res === '2K' || res === '4K') return res as ResolutionMode;
    } catch (e) {
      console.error('Failed to load last resolution:', e);
    }
    return '2K';
  },

  saveLastResolution(resolution: ResolutionMode): void {
    try {
      localStorage.setItem(STORAGE_KEYS.LAST_RESOLUTION, resolution);
    } catch (e) {
      console.error('Failed to save last resolution:', e);
    }
  },

  getLastAspectRatio(): string {
    try {
      const ratio = localStorage.getItem(STORAGE_KEYS.LAST_ASPECT_RATIO);
      if (ratio) return ratio;
    } catch (e) {
      console.error('Failed to load last aspect ratio:', e);
    }
    return '1:1';
  },

  saveLastAspectRatio(ratio: string): void {
    try {
      localStorage.setItem(STORAGE_KEYS.LAST_ASPECT_RATIO, ratio);
    } catch (e) {
      console.error('Failed to save last aspect ratio:', e);
    }
  },

  getModels(): string[] {
    const active = this.getActiveEndpoint();
    if (active.models && active.models.length > 0) {
      return active.models;
    }
    return ['[yu]gemini-3.1-flash-lite-image', '[yu1]gemini-3.1-flash-image', 'gpt-image-2'];
  },

  saveModels(models: string[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.MODELS, JSON.stringify(models));
      const activeId = this.getActiveEndpointId();
      this.updateEndpoint(activeId, { models });
    } catch (e) {
      console.error('Failed to save models:', e);
    }
  },

  getPresets(): PromptPreset[] {
    try {
      const version = localStorage.getItem(STORAGE_KEYS.PRESETS_VERSION);
      if (version !== 'v3') {
        // 自动迁移升级：彻底清除旧版本预设 (anime, film, cyberpunk, enhance)，载入最新除杂与11个新预设
        localStorage.setItem(STORAGE_KEYS.PRESETS_VERSION, 'v3');
        localStorage.setItem(STORAGE_KEYS.PRESETS, JSON.stringify(DEFAULT_PRESETS));
        return DEFAULT_PRESETS;
      }
      const data = localStorage.getItem(STORAGE_KEYS.PRESETS);
      if (data) {
        const parsed: PromptPreset[] = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
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
  },

  // 半合成独立步骤 1 (除杂) API 与模型记忆
  getSemiStep1EndpointId(defaultId: string): string {
    try {
      return localStorage.getItem('pinklayer_semi_step1_endpoint_id') || defaultId;
    } catch {
      return defaultId;
    }
  },
  saveSemiStep1EndpointId(id: string): void {
    try {
      localStorage.setItem('pinklayer_semi_step1_endpoint_id', id);
    } catch {}
  },
  getSemiStep1Model(defaultModel: string): string {
    try {
      return localStorage.getItem('pinklayer_semi_step1_model') || defaultModel;
    } catch {
      return defaultModel;
    }
  },
  saveSemiStep1Model(model: string): void {
    try {
      localStorage.setItem('pinklayer_semi_step1_model', model);
    } catch {}
  },

  // 半合成独立步骤 2 (角色识别与布景顾问) API 与文本/视觉模型记忆
  getSemiStep2EndpointId(defaultId: string): string {
    try {
      return localStorage.getItem('pinklayer_semi_step2_endpoint_id') || defaultId;
    } catch {
      return defaultId;
    }
  },
  saveSemiStep2EndpointId(id: string): void {
    try {
      localStorage.setItem('pinklayer_semi_step2_endpoint_id', id);
    } catch {}
  },
  getSemiStep2VisionModel(defaultModel: string): string {
    try {
      return localStorage.getItem('pinklayer_semi_step2_model') || defaultModel;
    } catch {
      return defaultModel;
    }
  },
  saveSemiStep2VisionModel(model: string): void {
    try {
      localStorage.setItem('pinklayer_semi_step2_model', model);
    } catch {}
  },

  // 半合成独立步骤 3 (全写实布景生图) API 与生图模型记忆
  getSemiStep3EndpointId(defaultId: string): string {
    try {
      return localStorage.getItem('pinklayer_semi_step3_endpoint_id') || defaultId;
    } catch {
      return defaultId;
    }
  },
  saveSemiStep3EndpointId(id: string): void {
    try {
      localStorage.setItem('pinklayer_semi_step3_endpoint_id', id);
    } catch {}
  },
  getSemiStep3Model(defaultModel: string): string {
    try {
      return localStorage.getItem('pinklayer_semi_step3_model') || defaultModel;
    } catch {
      return defaultModel;
    }
  },
  saveSemiStep3Model(model: string): void {
    try {
      localStorage.setItem('pinklayer_semi_step3_model', model);
    } catch {}
  }
};
