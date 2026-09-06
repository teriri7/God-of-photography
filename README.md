# PinkLayer Studio - 移动端 AI 图层创作工作台

> 精致现代的粉色磨砂玻璃（Pink Glassmorphism）风格移动端 AI 图生图与类 PS 图层编辑应用。
> 支持 Windows 本地快速调试（内置手机视口模拟器），并集成 GitHub Actions 自动化流水线，一键自动编译 Android APK。

---

## 🌟 核心功能特色

1. **精致粉色磨砂玻璃 UI（Pink Glassmorphism）**
   - 采用柔粉樱花色系、毛玻璃半透明容器（`backdrop-blur`）、细腻圆角、流光按钮与平滑微动效。
   - 响应式设计：手机端沉浸铺满，电脑端自动加载逼真的 iPhone 手机模拟器外框。

2. **类 Photoshop 专业图层系统**
   - **多图层堆叠**：支持图层上下顺序拖拽与移动、图层显隐（眼睛图标）、复制图层、删除图层。
   - **不透明度调整**：支持 0% ~ 100% 细粒度滑块控制。
   - **非破坏性实时调色**：
     - **一级色彩**：白平衡（色温冷暖、色调偏绿/偏洋红）、色彩饱和度、亮度、对比度。
     - **二级高级影调抽屉**：阴影细节（Shadows）、高光压制与增强（Highlights）、曝光度（Exposure）、色相旋转（Hue Shift）。
   - **全分辨率复合导出**：合成所有可见图层与调色矩阵，导出高质量 PNG 图片到手机相册或电脑。

3. **智能多模态图生图（已实测完美适配 NewAPI / momoapi）**
   - 预置中转站地址：`https://api.momoapi.icu/` 与专属 Key。
   - 支持 **一键拉取模型列表**，实时拉取并持久化保存 30+ 款可用模型。
   - 默认选中高质量图像模型 `[yu]gemini-3.1-flash-lite-image`。
   - 智能解析 Markdown `![image](data:...)`、HTML、Base64 与 URL 图片。
   - **处理完成自动载入图层**：生成的新图会自动作为顶层图层加入图层面板，方便继续叠加、微调与对比。

4. **2×2 创意提示词预设网格**
   - 预置 4 种高频图生图风格卡片：
     1. **二次元立绘**（清透少女/赛璐璐风）
     2. **胶片写真**（复古暖调/梦幻光影）
     3. **赛博霓虹**（未来科幻/绚丽光斑）
     4. **极简高级**（高清重绘/清透质感）
   - 支持实时修改预设词并本地保存，下方带有自由补充提示词输入框。

---

## 🚀 极速上手使用指南

### 一、在 Windows 电脑上本地调试（推荐日常使用）

无需安装庞大的 Android Studio 或模拟器，直接在浏览器上以 1:1 手机比例体验：

```bash
# 1. 启动本地开发服务
npm run dev
```

终端将输出本地服务地址，例如：
```text
➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

在 Chrome / Edge 浏览器打开 `http://localhost:5173/`：
- 默认展示逼真的 **手机外壳模拟器（包含灵动岛、信号栏、Home Bar）**。
- 可点击右上角的「切换全屏/模拟器」按钮自由切换视图。
- 点击「打开图片」上传图片，选择模型与提示词预设，点击「开始生成」即可立即测试！

---

### 二、如何上传到 GitHub 并自动打包出 Android APK（安装到手机）

本项目已预先配置好 `.github/workflows/build-apk.yml` 自动化打包脚本。**你不需要在电脑上配置 Android SDK 或 Java，只要把代码推送到 GitHub，GitHub 会在云端自动编译出 APK 文件供你下载！**

#### 步骤说明：

1. **在 GitHub 上新建一个仓库**（例如命名为 `pinklayer-studio`）。
2. **在本地项目目录下执行 Git 提交并推送**：
   ```bash
   git init
   git add .
   git commit -m "feat: initial commit of PinkLayer Studio"
   git branch -M main
   git remote add origin https://github.com/你的用户名/你的仓库名.git
   git push -u origin main
   ```
3. **下载编译好的 APK**：
   - 打开你的 GitHub 仓库页面，点击顶部的 **Actions** 标签。
   - 你会看到一个名为 `自动构建 Android APK` 的工作流正在自动运行（通常耗时约 2~4 分钟）。
   - 构建完成后，点击该工作流记录，在最底部的 **Artifacts（构建产物）** 列表中即可直接下载 `PinkLayer-Studio-latest.apk`！
   - 把 APK 发送到手机（微信/QQ/网盘/数据线）直接点击安装即可。

---

## 🛠️ 项目常用脚本说明

| 命令 | 说明 |
| :--- | :--- |
| `npm run dev` | 启动本地 Vite 开发服务器（支持热重载） |
| `npm run build` | 编译前端 TypeScript 与 React 生产包到 `dist` 目录 |
| `npm run cap:sync` | 编译并将最新的前端资源同步到 Android 原生工程 |
| `npm run cap:open` | （可选）用本地 Android Studio 打开 Android 原生工程 |

---

## 📱 技术栈一览

- **前端核心**：React 18 + TypeScript + Vite
- **UI & 样式**：Tailwind CSS v4 + Lucide Icons + 磨砂玻璃拟态
- **图层渲染引擎**：HTML5 Canvas 2D + 独立色彩矩阵运算（色温/色调/影调/曝光）
- **移动端原生容器**：Capacitor 8 (Android)
- **CI/CD**：GitHub Actions (Ubuntu + OpenJDK 17 + Android SDK)
