# 🎮 Unity 数字人项目创建完整指南

从零开始创建支持 Vue 集成的 Unity WebGL 数字人项目。

---

## 📋 准备工作

### 1. Unity 安装要求

- **Unity Hub**: 最新版本
- **Unity Editor**: 2022.3 LTS (推荐) 或 2023.2+
- **WebGL Build Support**: 必须安装此模块

### 2. 检查 WebGL 支持模块

```bash
# 在 Unity Hub 中：
Unity Hub → Installs → [你的Unity版本] → Add Modules
└── ✅ WebGL Build Support (必选)
└── ✅ Documentation (可选)
```

---

## 🚀 步骤 1: 创建新项目

### 1.1 启动 Unity Hub

```
Unity Hub → Projects → New Project
```

### 1.2 选择项目模板

```
Template: 3D (Built-in Render Pipeline)
或
Template: 3D (URP) - 如果你需要更好的渲染效果

项目名称: "DigitalAvatarWebGL" (或你喜欢的名字)
位置: 选择一个合适的目录
```

### 1.3 项目初始设置

```
Unity Version: 2022.3.x LTS
Template: 3D
Location: /path/to/your/projects/DigitalAvatarWebGL
```

点击 **Create project**，等待 Unity 创建和加载项目。

---

## 🏗️ 步骤 2: 项目结构设置

### 2.1 创建文件夹结构

在 Project 窗口中，在 `Assets` 下创建以下文件夹：

```
Assets/
├── Scripts/           # C# 脚本
├── Models/           # 3D 模型文件
├── Animations/       # 动画文件
├── Materials/        # 材质文件
├── Textures/         # 纹理贴图
├── Audio/           # 音频文件
├── Plugins/         # 插件文件 (.jslib)
├── Scenes/          # 场景文件
├── Prefabs/         # 预制件
└── StreamingAssets/ # 流媒体资源(可选)
```

### 2.2 创建文件夹操作

```
右键点击 Assets → Create → Folder
重命名为相应的文件夹名称
```

---

## 📝 步骤 3: 部署脚本文件

### 3.1 复制 C# 脚本

将之前创建的脚本文件放入项目：

```bash
# 方式1: 直接复制文件到文件系统
cp /path/to/unity-scripts/JsTalker.cs /path/to/DigitalAvatarWebGL/Assets/Scripts/
cp /path/to/unity-scripts/AvatarController.cs /path/to/DigitalAvatarWebGL/Assets/Scripts/

# 方式2: 在 Unity Editor 中创建
在 Scripts 文件夹上右键 → Create → C# Script
命名为 "JsTalker"，然后复制代码内容
重复创建 "AvatarController"
```

### 3.2 复制 JavaScript 插件

```bash
cp /path/to/unity-scripts/vue_unity.jslib /path/to/DigitalAvatarWebGL/Assets/Plugins/
```

### 3.3 验证文件导入

在 Project 窗口中确认文件结构：

```
Assets/
├── Scripts/
│   ├── JsTalker.cs       ✅
│   └── AvatarController.cs ✅
└── Plugins/
    └── vue_unity.jslib    ✅
```

---

## 🎭 步骤 4: 导入数字人模型

### 4.1 准备模型文件

你需要准备包含以下内容的数字人模型：

- **GLB/FBX 格式**的 3D 模型
- **骨骼动画**（Idle、Wave、Dance 等）
- **Blend Shapes**（表情变形）
- **Viseme Blend Shapes**（音素口型，命名如 viseme_0, viseme_1...）

### 4.2 导入模型到 Unity

```
方式1: 拖拽导入
将模型文件直接拖到 Assets/Models/ 文件夹

方式2: 菜单导入
Assets → Import New Asset → 选择模型文件
```

### 4.3 配置导入设置

选中导入的模型文件，在 Inspector 中：

```
Model 选项卡:
├── Scale Factor: 1 (根据模型调整)
├── Mesh Compression: Off (保持质量)
├── Read/Write: ✅ (允许脚本访问)
├── Optimize Mesh: ✅
├── Generate Colliders: ❌ (WebGL 性能优化)
└── Import Blend Shapes: ✅ (重要!)

Rig 选项卡:
├── Animation Type: Humanoid (推荐)
├── Avatar Definition: Create From This Model
└── Optimize Game Objects: ✅

Animation 选项卡:
├── Import Animation: ✅
├── Anim. Compression: Keyframe Reduction
└── [配置各个动画片段]
```

点击 **Apply** 应用设置。

---

## 🎬 步骤 5: 创建场景

### 5.1 场景基本设置

```
File → New Scene
保存场景: Ctrl+S → 命名为 "AvatarScene"
保存到: Assets/Scenes/AvatarScene.unity
```

### 5.2 添加数字人到场景

```
从 Models 文件夹拖拽模型到 Hierarchy
位置设置为 (0, 0, 0)
命名为 "DigitalAvatar"
```

### 5.3 设置主摄像机

选中 Main Camera，设置参数：

```
Transform:
├── Position: (0, 1.8, 1.2)  # 参考之前的配置
├── Rotation: (11.5, 180, 0)
└── Scale: (1, 1, 1)

Camera Component:
├── Field of View: 60
├── Clipping Planes:
│   ├── Near: 0.01
│   └── Far: 1000
└── Clear Flags: Solid Color
```

### 5.4 添加基础光照

```
GameObject → Light → Directional Light
命名为 "Main Light"
设置:
├── Intensity: 1
├── Color: 白色 (255, 255, 255)
└── Rotation: (50, 200, 0)  # 参考之前的配置
```

---

## 🔌 步骤 6: 创建通信桥接对象

### 6.1 创建 JsBridge 对象

```
Hierarchy 中右键 → Create Empty
重命名为 "JsBridge"
Position: (0, 0, 0)
```

### 6.2 添加脚本组件

选中 JsBridge 对象，在 Inspector 中：

```
Add Component → Scripts → Js Talker
Add Component → Scripts → Avatar Controller
```

### 6.3 配置 JsTalker 脚本

在 Inspector 中设置 JsTalker 参数：

```
Avatar Id: "avatar-001" (或你的数字人ID)
Avatar Controller: [拖拽同一对象上的 AvatarController 组件]
Enable Debug Log: ✅ (开发时启用)
Ready Delay: 2.0
```

### 6.4 配置 AvatarController 脚本

在 Inspector 中设置 AvatarController 参数：

```
Avatar Components:
├── Avatar Animator: [拖拽数字人对象的 Animator 组件]
├── Face Renderer: [拖拽数字人面部的 SkinnedMeshRenderer]
└── Avatar Root: [拖拽数字人根对象]

Background System:
├── Main Camera: [拖拽 Main Camera]
├── Background Plane: [留空，脚本会自动创建]
└── Background Material: [留空，脚本会自动创建]

Animation Settings:
├── Idle Animation Name: "Idle"
└── Animation Transition Time: 0.5

Emotion Settings:
├── Default Emotion Transition: 0.5
└── Emotion Curve: [使用默认曲线]

Viseme Settings:
├── Viseme Prefix: "viseme_"
└── Viseme Transition Speed: 10

Debug Settings:
└── Enable Debug Log: ✅
```

---

## ⚙️ 步骤 7: 项目设置配置

### 7.1 平台切换到 WebGL

```
File → Build Settings
Platform: WebGL → Switch Platform
等待平台切换完成 (可能需要几分钟)
```

### 7.2 Player Settings 配置

点击 Build Settings 窗口中的 "Player Settings..."

```
Player Settings → WebGL:

Company Name: "huayun"
Product Name: "tegaoya"

Resolution and Presentation:
├── Default Canvas Width: 960
├── Default Canvas Height: 600
└── Run In Background: ✅

Publishing Settings:
├── Compression Format: Brotli ✅ (重要!)
├── Name Files As Hashes: ✅
├── Data Caching: ✅
├── Debug Symbols: ❌ (发布版本)
├── Decompression Fallback: ✅
└── Initial Memory Size: 256 MB

XR Settings:
└── Virtual Reality Supported: ❌
```

### 7.3 Quality Settings 优化

```
Edit → Project Settings → Quality

WebGL Quality Level:
├── Texture Quality: Full Res
├── Anisotropic Textures: Per Texture
├── Anti Aliasing: 2x Multi Sampling
├── Soft Particles: ✅
├── Realtime Reflection Probes: ❌ (性能优化)
└── Shadow Distance: 50
```

---

## 🔨 步骤 8: 测试和构建

### 8.1 Unity 编辑器测试

```
点击 Play 按钮测试场景
检查 Console 窗口的输出信息
确认数字人正确显示和动画播放
```

### 8.2 第一次 WebGL 构建

```
File → Build Settings
Scenes In Build: 确保 AvatarScene 已添加 ✅
Build → 选择输出文件夹: /path/to/frontend/public/unity_sample_test/
等待构建完成 (首次构建需要较长时间)
```

### 8.3 验证构建结果

构建完成后，检查输出文件夹：

```
unity_sample_test/
├── index.html                    ✅
├── Build/
│   ├── [项目名].loader.js        ✅
│   ├── [项目名].framework.js.unityweb ✅
│   ├── [项目名].data.unityweb    ✅
│   └── [项目名].wasm.unityweb    ✅
└── TemplateData/                 ✅
```

### 8.4 本地测试 WebGL 构建

```bash
# 启动本地服务器测试（不能直接双击 index.html）
cd /path/to/unity_sample_test/
python -m http.server 8080
# 或者
npx serve .

# 浏览器访问
open http://localhost:8080
```

---

## 🔄 步骤 9: 集成到 Vue 项目

### 9.1 替换 index.html

构建成功后，用我们修改过的版本替换：

```bash
cp /path/to/modified/index.html /path/to/frontend/public/unity_sample/index.html
```

### 9.2 复制构建文件

```bash
# 复制完整的构建产物到前端项目
cp -r unity_sample_test/* /path/to/frontend/public/unity_sample/
```

### 9.3 启动 Vue 开发服务器

```bash
cd frontend
npm run dev
```

### 9.4 测试完整集成

浏览器访问 Vue 应用，导航到数字人页面，验证：

- Unity WebGL 正确加载
- 控制台显示通信日志
- 数字人响应 Vue 的控制命令

---

## ✅ 完成检查清单

创建项目完成后，确认以下项目都已正确设置：

**Unity 项目结构:**

- [ ] 文件夹结构完整
- [ ] C# 脚本正确放置
- [ ] JavaScript 插件正确放置
- [ ] 数字人模型已导入并配置

**场景设置:**

- [ ] JsBridge 对象已创建
- [ ] 脚本组件已正确挂载和配置
- [ ] 数字人显示正常
- [ ] 摄像机和光照设置合理

**项目配置:**

- [ ] 平台已切换到 WebGL
- [ ] Player Settings 已正确配置
- [ ] 压缩格式设为 Brotli
- [ ] Quality Settings 已优化

**构建和测试:**

- [ ] 首次构建成功
- [ ] 构建文件完整
- [ ] WebGL 版本可以独立运行
- [ ] Vue 集成测试通过

---

## 🐛 常见问题解决

### 问题 1: WebGL Build Support 模块缺失

```
Unity Hub → Installs → [Unity版本] → Add Modules
选择 "WebGL Build Support" → Install
```

### 问题 2: 脚本编译错误

```
检查脚本文件是否完整复制
确认 using 语句和命名空间正确
查看 Console 窗口的具体错误信息
```

### 问题 3: 模型导入问题

```
确认模型文件格式支持 (FBX, GLB, OBJ)
检查 Import Settings 配置
确认 Blend Shapes 已正确导入
```

### 问题 4: 构建失败

```
检查 Console 窗口错误信息
确认所有脚本编译通过
检查项目设置是否正确
清理并重新构建: File → Build Settings → Build
```

### 问题 5: WebGL 加载失败

```
不能直接双击 index.html，必须通过 HTTP 服务器访问
检查浏览器控制台的错误信息
确认文件路径和 MIME 类型正确
```

---

## 🎯 开发技巧

### 快速迭代流程

1. **Unity 编辑器测试** - 验证逻辑和功能
2. **脚本修改** - 只修改脚本时无需重构整个场景
3. **增量构建** - Unity 支持增量构建，后续构建更快
4. **Vue 集成测试** - 定期测试完整集成

### 性能优化建议

- 保持模型面数在合理范围 (< 50K triangles)
- 优化纹理大小和格式
- 减少不必要的 Blend Shapes
- 使用 LOD (Level of Detail) 系统

### 调试建议

- 开发阶段启用所有 Debug Log
- 使用浏览器开发者工具监控性能
- 定期检查内存使用情况

---

**🎉 完成这些步骤后，你就有了一个完整的 Unity 数字人 WebGL 项目，可以与 Vue 应用完美集成！**

记住：第一次设置可能需要一些时间，但一旦建立好基础架构，后续的开发就会非常流畅。
