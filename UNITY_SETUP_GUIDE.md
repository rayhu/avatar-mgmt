# Unity WebGL 项目设置详细指南

## 🎯 前提条件

- Unity 2022.3 LTS 或更新版本
- WebGL Build Support 模块已安装
- 你的数字人模型已导入 Unity

## 📁 文件部署

### 1. 创建脚本目录结构

```
YourUnityProject/
└── Assets/
    ├── Scripts/
    │   ├── JsTalker.cs          # 主通信脚本
    │   └── AvatarController.cs  # 数字人控制脚本
    └── Plugins/
        └── vue_unity.jslib      # WebGL 插件
```

### 2. 复制脚本文件

```bash
# 从我生成的文件复制到你的 Unity 项目
cp unity-scripts/JsTalker.cs YourUnityProject/Assets/Scripts/
cp unity-scripts/AvatarController.cs YourUnityProject/Assets/Scripts/
cp unity-scripts/vue_unity.jslib YourUnityProject/Assets/Plugins/
```

## 🎮 Unity 场景配置

### 1. 创建 JsBridge 对象

1. 在 Hierarchy 中右键 → Create Empty
2. 重命名为 "JsBridge"
3. 位置设为 (0, 0, 0)

### 2. 添加脚本组件

1. 选中 JsBridge 对象
2. 在 Inspector 点击 "Add Component"
3. 添加 "Js Talker" 脚本
4. 添加 "Avatar Controller" 脚本

### 3. 配置 JsTalker 参数

```csharp
// Inspector 中设置这些参数：
Avatar Id: "your-avatar-id"           // 数字人标识
Avatar Controller: [拖拽 AvatarController 组件]
Enable Debug Log: ✅                 // 开发时启用
Ready Delay: 2.0                     // 加载完成延迟时间
```

### 4. 配置 AvatarController 参数

```csharp
// 在 Inspector 中设置：
Avatar Animator: [拖拽你的 Animator 组件]
Face Renderer: [拖拽面部 SkinnedMeshRenderer]
Avatar Root: [拖拽数字人根对象]
Main Camera: [拖拽主摄像机]

// 动画设置
Idle Animation Name: "Idle"          // 默认动画名称
Animation Transition Time: 0.5       // 动画过渡时间

// 表情设置
Default Emotion Transition: 0.5      // 表情过渡时间
Emotion Curve: [使用默认的 AnimationCurve]

// 音素设置
Viseme Prefix: "viseme_"             // 音素形变名前缀
Viseme Transition Speed: 10          // 音素切换速度

Enable Debug Log: ✅                 // 开发时启用
```

## 🔧 Unity 项目设置

### 1. Player Settings 配置

```
Edit → Project Settings → Player → WebGL Settings

Company Name: "huayun"               // 与现有配置保持一致
Product Name: "tegaoya"              // 与现有配置保持一致

Resolution and Presentation:
├── Default Canvas Width: 960
├── Default Canvas Height: 600
└── Run In Background: ✅

Publishing Settings:
├── Compression Format: Brotli       // 重要！
├── Name Files As Hashes: ✅
├── Data Caching: ✅
└── Debug Symbols: ❌ (生产环境)

XR Settings:
└── Virtual Reality Supported: ❌
```

### 2. Quality Settings

```
Edit → Project Settings → Quality

选择适合 WebGL 的质量级别：
├── Texture Quality: Full Res
├── Anisotropic Textures: Per Texture
├── Anti Aliasing: 2x Multi Sampling
├── Soft Particles: ✅
├── Realtime Reflection Probes: ❌     // 优化性能
└── Billboards Face Camera Position: ✅
```

### 3. Graphics Settings

```
Edit → Project Settings → Graphics

Built-in Render Pipeline:
├── Always Included Shaders: [添加你使用的 Shaders]
├── Preloaded Shaders: [预加载关键 Shaders]
└── Shader Stripping: [启用未使用变体剥离]
```

## 🏗️ 构建配置

### 1. Build Settings

```
File → Build Settings

Platform: WebGL ✅
Switch Platform (如果还未切换)

Scenes In Build:
└── ✅ Assets/Scenes/YourMainScene.unity

Player Settings... → [按上面配置]
```

### 2. 构建优化设置

```
File → Build Settings → Player Settings → Publishing Settings

Code Optimization:
├── Scripting Backend: IL2CPP
├── Api Compatibility Level: .NET Framework
├── C++ Compiler Configuration: Release
└── Managed Stripping Level: Medium

Memory:
├── Strip Engine Code: ✅
├── Script Call Optimization: Fast but no Exceptions
└── Vertex Compression: Mix
```

### 3. 执行构建

```bash
# 构建输出到你的前端项目
构建目录: /path/to/your/frontend/public/unity_sample/

# 或者构建到临时目录再复制
构建目录: /tmp/unity_build/
然后复制到: frontend/public/unity_sample/
```

## ✅ 构建后验证

### 1. 检查构建文件

```bash
frontend/public/unity_sample/
├── index.html                        # 自动生成（会被我们的版本覆盖）
├── Build/
│   ├── unity_sample.loader.js        # ✅ 加载器
│   ├── unity_sample.framework.js.unityweb  # ✅ 框架（压缩）
│   ├── unity_sample.data.unityweb    # ✅ 数据（压缩）
│   └── unity_sample.wasm.unityweb    # ✅ 你的C#代码（压缩）
├── StreamingAssets/                  # 如果有
└── TemplateData/                     # 样式和图标
    ├── style.css
    ├── favicon.ico
    └── [其他资源]
```

### 2. 替换 index.html

```bash
# Unity 会生成默认的 index.html，但我们需要使用修改版本
cp /path/to/modified/index.html frontend/public/unity_sample/index.html
```

### 3. 本地测试

```bash
# 启动本地服务器测试
cd frontend
npm run dev

# 访问测试
open http://localhost:5173
# 导航到数字人页面，检查：
# 1. Unity 是否正确加载
# 2. 控制台是否输出通信日志
# 3. 数字人是否响应控制
```

## 🐛 常见问题排查

### 问题 1: 构建失败

```bash
# 检查 Console 窗口的错误信息
# 常见原因：
- 脚本编译错误
- 缺少必要的组件引用
- 平台设置不正确
```

### 问题 2: WebGL 加载失败

```bash
# 浏览器 Console 检查：
- 是否有 404 错误（文件路径问题）
- 是否有 MIME 类型错误
- 是否有 CORS 错误
```

### 问题 3: C# 脚本不工作

```csharp
// 检查脚本配置：
1. JsBridge 对象是否存在
2. 脚本组件是否正确添加
3. Inspector 中的引用是否正确配置
4. Debug.Log 输出是否显示在浏览器 Console
```

### 问题 4: 通信失败

```javascript
// 浏览器 Console 调试：
console.log(window.VueUnityBridge); // 检查桥接对象
window.VueUnityBridge.debug = true; // 启用调试模式

// Unity Console 调试：
Debug.Log('[JsTalker] 消息接收测试');
```

## 📊 性能优化建议

### 1. 模型优化

- 面数控制在 50K 以内
- 纹理尺寸不超过 2048x2048
- 使用压缩纹理格式
- 减少 Blend Shape 数量

### 2. 动画优化

- 使用压缩的动画格式
- 移除不必要的动画曲线
- 优化关键帧密度

### 3. 构建优化

- 启用 Shader 剥离
- 使用 Asset Bundle（如果需要）
- 启用增量构建

## 🎉 完成检查清单

构建完成后，确认以下项目：

- [ ] **文件部署**: C# 脚本和 jslib 文件已复制到正确位置
- [ ] **场景配置**: JsBridge 对象已创建并配置脚本组件
- [ ] **构建设置**: WebGL 平台、Brotli 压缩、正确的输出目录
- [ ] **文件验证**: 构建产物完整，包含所有必要文件
- [ ] **index.html**: 已替换为包含桥接脚本的版本
- [ ] **本地测试**: Unity 加载成功，通信正常工作
- [ ] **控制台**: 无错误信息，调试日志正常输出

完成这些步骤后，你的 Unity WebGL 项目就可以与 Vue 应用无缝集成了！

## 🔄 开发工作流

日常开发时的建议流程：

```bash
# 1. 修改 Unity 脚本或场景
# 2. 测试功能（Unity 编辑器中）
# 3. 构建 WebGL（只在有变更时）
# 4. 测试集成（浏览器中）
# 5. 提交代码

# 快速迭代技巧：
# - 只修改 Vue 代码时无需重新构建 Unity
# - 只修改 Unity UI/参数时可能不需要完全重构
# - 使用 Unity 编辑器的 Play 模式测试大部分逻辑
```
