# Unity WebGL 迁移测试程序与验收标准

## 🎯 测试目标

验证从 three.js/GLTFLoader 到 Unity WebGL +
iframe 架构的完整迁移，确保所有功能正常运行，性能达标，安全可靠。

---

## 📋 测试前准备

### Unity 项目设置

1. **C# 脚本部署**

   ```
   Assets/Scripts/JsTalker.cs
   Assets/Scripts/AvatarController.cs
   ```

2. **插件部署**

   ```
   Assets/Plugins/vue_unity.jslib
   ```

3. **场景配置**
   - 创建名为 "JsBridge" 的GameObject
   - 挂载 JsTalker 和 AvatarController 脚本
   - 确保数字人模型正确导入并配置

4. **WebGL 构建设置**
   - Player Settings > WebGL Settings
   - 启用 Data Caching
   - 压缩格式：Brotli
   - 模板：Default

### Vue 项目设置

1. **组件替换**

   ```bash
   # 备份原组件
   mv ModelViewer.vue ModelViewer.three.vue.backup

   # 部署新组件
   cp UnityModelViewer.vue ModelViewer.vue
   ```

2. **环境变量配置**

   ```env
   VITE_UNITY_BASE_URL=/unity_sample
   VITE_ENABLE_UNITY_DEBUG=true
   ```

3. **依赖安装**
   ```bash
   cd frontend
   npm install
   ```

### 服务器设置

1. **Nginx 配置部署**

   ```bash
   sudo cp server-configs/nginx-unity-webgl.conf /etc/nginx/sites-available/
   sudo ln -s /etc/nginx/sites-available/nginx-unity-webgl.conf /etc/nginx/sites-enabled/
   sudo nginx -t && sudo systemctl reload nginx
   ```

2. **Node.js 服务器启动**
   ```bash
   cd server-configs
   npm install
   npm start
   ```

---

## 🧪 功能测试

### Test 1: Unity WebGL 加载测试

**目标**: 验证 Unity WebGL 正确加载并建立通信

**步骤**:

1. 访问 `http://localhost:3000`
2. 导航到数字人展示页面
3. 观察 Unity iframe 加载过程

**预期结果**:

- ✅ Unity 加载进度条正常显示
- ✅ 控制台输出 "Unity ready with avatar: [avatarId]"
- ✅ Vue 组件接收到 `unity-ready` 事件
- ✅ 加载完成后显示数字人模型

**验收标准**:

- 加载时间 < 10秒
- 无 JavaScript 错误
- postMessage 通信正常

---

### Test 2: 动画控制测试

**目标**: 验证 Vue 到 Unity 的动画控制

**步骤**:

1. Unity 加载完成后
2. 在 Vue 界面触发动画播放
3. 测试不同动画类型：idle, wave, dance 等

**预期结果**:

- ✅ Unity 数字人执行相应动画
- ✅ 动画过渡自然流畅
- ✅ 循环/非循环动画按预期工作

**测试代码**:

```javascript
// 在浏览器控制台执行
const modelViewer =
  document.querySelector('unity-model-viewer').__vueParentComponent.exposed;

// 测试动画播放
modelViewer.playAnimation('wave', 3, false);
setTimeout(() => {
  modelViewer.playAnimation('dance', 0, true);
}, 4000);
```

**验收标准**:

- 动画响应时间 < 100ms
- 动画切换无卡顿
- 消息队列机制工作正常

---

### Test 3: 表情控制测试

**目标**: 验证数字人表情控制功能

**步骤**:

1. 测试单一表情切换
2. 测试表情混合功能
3. 测试表情过渡效果

**预期结果**:

- ✅ 单一表情正确显示
- ✅ 表情混合效果自然
- ✅ 过渡动画流畅

**测试代码**:

```javascript
// 单一表情测试
modelViewer.updateEmotion('happy', 0.5);
setTimeout(() => modelViewer.updateEmotion('sad', 1.0), 2000);

// 混合表情测试
modelViewer.blendEmotions([
  { emotion: 'happy', weight: 0.7 },
  { emotion: 'surprised', weight: 0.3 },
]);
```

**验收标准**:

- 表情变化自然
- 过渡时间准确
- 支持实时混合

---

### Test 4: 音素同步测试

**目标**: 验证 TTS 音素同步功能

**步骤**:

1. 播放带音素数据的音频
2. 观察口型变化
3. 测试不同语言的音素

**预期结果**:

- ✅ 口型与音频同步
- ✅ 音素切换自然
- ✅ 支持中文和英文音素

**测试代码**:

```javascript
// 模拟音素序列
const visemeSequence = [0, 1, 3, 7, 12, 8, 0];
visemeSequence.forEach((visemeId, index) => {
  setTimeout(() => {
    modelViewer.updateViseme(visemeId);
  }, index * 200);
});
```

---

### Test 5: 多数字人切换测试

**目标**: 验证不同数字人之间的切换

**步骤**:

1. 加载数字人 A
2. 切换到数字人 B
3. 验证内存释放和新实例创建

**预期结果**:

- ✅ 旧实例正确释放
- ✅ 新实例正常加载
- ✅ 功能无损失

**测试代码**:

```javascript
// 切换数字人
modelViewer.avatarId = 'avatar-b';
```

**验收标准**:

- 切换时间 < 15秒
- 无内存泄漏
- 功能完全正常

---

## 🚀 性能测试

### Test 6: 加载性能测试

**指标**:

- Unity WebGL 初始加载时间
- 首次交互响应时间
- 资源文件大小

**工具**:

- Chrome DevTools Performance 面板
- Lighthouse 性能检测
- Network 面板监控

**验收标准**:

- 初始加载 < 10秒 (3G网络)
- 首次交互 < 2秒
- 总资源大小 < 50MB

### Test 7: 运行时性能测试

**指标**:

- 帧率稳定性 (60fps)
- 内存使用情况
- CPU 占用率

**测试方法**:

```javascript
// 性能监控脚本
const monitor = {
  startTime: performance.now(),
  frameCount: 0,

  measureFPS() {
    requestAnimationFrame(() => {
      this.frameCount++;
      const elapsed = performance.now() - this.startTime;
      if (elapsed >= 1000) {
        const fps = Math.round((this.frameCount * 1000) / elapsed);
        console.log(`FPS: ${fps}`);
        this.frameCount = 0;
        this.startTime = performance.now();
      }
      this.measureFPS();
    });
  },
};
monitor.measureFPS();
```

**验收标准**:

- 平均帧率 ≥ 30fps
- 内存使用 < 200MB
- CPU 使用率 < 50%

---

## 🔒 安全测试

### Test 8: 跨域安全测试

**目标**: 验证 postMessage 安全机制

**测试步骤**:

1. 尝试从非授权域名发送消息
2. 验证 CSP 头部设置
3. 检查 iframe 沙盒限制

**预期结果**:

- ✅ 非授权消息被拒绝
- ✅ CSP 政策生效
- ✅ iframe 安全限制正常

### Test 9: 文件服务安全测试

**检查项目**:

- Unity WebGL 文件的 MIME 类型
- 压缩文件正确传输
- 缓存策略安全性

**验证命令**:

```bash
# 检查 MIME 类型
curl -I http://localhost:3000/unity_sample/Build/unity_sample.wasm.unityweb

# 检查压缩
curl -H "Accept-Encoding: br" -I http://localhost:3000/unity_sample/Build/unity_sample.data.unityweb

# 检查缓存头
curl -I http://localhost:3000/unity_sample/index.html
```

---

## 🌐 兼容性测试

### Test 10: 浏览器兼容性

**测试浏览器**:

- Chrome (最新版本)
- Firefox (最新版本)
- Safari (最新版本)
- Edge (最新版本)

**测试项目**:

- Unity WebGL 加载
- postMessage 通信
- WebAssembly 支持
- 性能表现

### Test 11: 设备兼容性

**测试设备**:

- Windows 桌面 (1920x1080)
- macOS 桌面 (2560x1600)
- iPad (1024x768)
- 移动设备 (375x667)

**注意**: Unity WebGL 在移动设备上的支持有限

---

## 📊 回归测试

### Test 12: 原有功能验证

**目标**: 确保迁移不影响现有功能

**测试清单**:

- [ ] 用户登录/登出
- [ ] 数字人列表展示
- [ ] 音频播放控制
- [ ] 背景图片设置
- [ ] 数据保存/加载
- [ ] 多语言支持
- [ ] 响应式布局

---

## ✅ 验收标准总览

### 必须通过 (Must Pass)

- [ ] Unity WebGL 正确加载并建立通信
- [ ] 所有动画控制功能正常工作
- [ ] 表情系统完全可用
- [ ] 音素同步功能正常
- [ ] 数字人切换无问题
- [ ] 性能指标达到要求
- [ ] 安全机制正常工作
- [ ] 主流浏览器兼容

### 建议通过 (Should Pass)

- [ ] 加载时间优化到位
- [ ] 错误处理机制完善
- [ ] 调试信息完整
- [ ] 代码文档完整
- [ ] 移动端基本可用

### 可选通过 (Could Pass)

- [ ] 高级性能优化
- [ ] 额外的调试工具
- [ ] 自动化测试覆盖

---

## 🐛 问题排查指南

### 常见问题及解决方案

**问题 1: Unity 加载失败**

```javascript
// 检查控制台错误
console.error('Unity loading failed');

// 解决方案
// 1. 检查文件路径
// 2. 验证 MIME 类型设置
// 3. 检查服务器压缩配置
```

**问题 2: postMessage 通信失败**

```javascript
// 调试代码
window.addEventListener('message', event => {
  console.log('Received message:', event);
});

// 解决方案
// 1. 检查消息格式
// 2. 验证发送方和接收方
// 3. 确认安全策略
```

**问题 3: 动画不响应**

```javascript
// 检查 Unity 就绪状态
console.log('Unity ready:', isUnityReady);

// 解决方案
// 1. 确认 Unity 完全加载
// 2. 检查消息队列机制
// 3. 验证 C# 脚本配置
```

---

## 📝 测试报告模板

```markdown
## Unity WebGL 迁移测试报告

**测试日期**: [YYYY-MM-DD] **测试环境**: [浏览器/设备/网络] **测试人员**: [姓名]

### 测试结果摘要

- 通过测试: X/12
- 失败测试: X/12
- 总体评估: [通过/部分通过/失败]

### 详细结果

| 测试项     | 状态  | 备注       |
| ---------- | ----- | ---------- |
| Unity 加载 | ✅/❌ | [详细说明] |
| 动画控制   | ✅/❌ | [详细说明] |
| ...        | ...   | ...        |

### 发现的问题

1. [问题描述]
   - 严重程度: [高/中/低]
   - 重现步骤: [详细步骤]
   - 建议解决方案: [解决方案]

### 性能数据

- 加载时间: Xs
- 平均 FPS: X
- 内存使用: XMB

### 建议

[测试建议和改进意见]
```

---

## 🎉 部署前最终检查

在正式部署前，请确认：

1. **✅ 所有测试通过**
2. **✅ 性能指标达标**
3. **✅ 安全配置正确**
4. **✅ 备份计划准备**
5. **✅ 回滚方案测试**
6. **✅ 监控系统就绪**
7. **✅ 团队培训完成**

---

_此测试程序应在每次迁移实施前执行，确保系统稳定可靠。_
