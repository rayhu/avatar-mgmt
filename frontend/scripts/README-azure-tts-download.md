# Azure TTS Audio Download Script

这个脚本用于从 Azure TTS 服务下载音频文件并保存为 MP3 格式。

## 脚本说明

这是一个直接调用 Azure TTS API 的下载脚本：

- **文件**: `download-azure-tts-direct.js`
- **命令**: `yarn download-tts`
- **特点**: 直接调用 Azure TTS API，使用前端 .env 文件中的凭据
- **优势**: 无需启动后端服务器，更快速、简单

## 功能特性

- 🎤 使用指定的三个语音：Xiaoxiao、Yunxi、Yunjian
- 📝 使用 Animate.vue 中的样本文本
- 🎵 生成高质量的 MP3 音频文件
- 📂 自动创建输出目录
- 📊 提供详细的下载统计信息

## 前置要求

**Azure Speech 凭据配置**

- 在 `frontend/.env` 文件中设置：
  ```bash
  VITE_AZURE_SPEECH_KEY2=your_azure_speech_key
  VITE_AZURE_SPEECH_REGION=your_azure_region
  ```

## 使用方法

```bash
cd frontend
yarn download-tts
```

## 输出文件

脚本会在 `frontend/public/audio-samples/` 目录下生成以下文件：

```
audio-samples/
├── xiaoxiao_empathetic.mp3
├── xiaoxiao_cheerful.mp3
├── xiaoxiao_assistant.mp3
├── xiaoxiao_hopeful.mp3
├── yunxi_empathetic.mp3
├── yunxi_cheerful.mp3
├── yunxi_assistant.mp3
├── yunxi_hopeful.mp3
├── yunjian_empathetic.mp3
├── yunjian_cheerful.mp3
├── yunjian_assistant.mp3
└── yunjian_hopeful.mp3
```

## 样本文本

脚本使用以下样本文本（来自 Animate.vue）：

| 情感       | 文本                                         |
| ---------- | -------------------------------------------- |
| empathetic | 非常抱歉让您有这样的体验                     |
| cheerful   | 哇，太开心啦～感谢您喜欢我们的服务。         |
| assistant  | 别担心，我来啦～我们一起查一下您的情况吧。   |
| hopeful    | 今天也要元气满满哦～祝您天天开心，一切顺利！ |

## 语音配置

脚本使用以下 Azure 语音：

| 标签     | 语音名称             | 描述     |
| -------- | -------------------- | -------- |
| Xiaoxiao | zh-CN-XiaoxiaoNeural | 中文女声 |
| Yunxi    | zh-CN-YunxiNeural    | 中文男声 |
| Yunjian  | zh-CN-YunjianNeural  | 中文男声 |

## 故障排除

### 1. API 连接失败

```
❌ 下载失败 xiaoxiao_empathetic.mp3: API request failed: 500 Internal Server Error
```

**解决方案：**

- 检查后端服务器是否正在运行
- 验证 Azure Speech 凭据是否正确配置
- 检查网络连接

### 2. 权限错误

```
❌ 脚本执行失败: EACCES: permission denied
```

**解决方案：**

```bash
chmod +x scripts/download-azure-tts.js
```

### 3. 输出目录创建失败

```
❌ 脚本执行失败: ENOENT: no such file or directory
```

**解决方案：**

- 确保有写入权限
- 手动创建 `frontend/public/` 目录

## 自定义配置

### 修改目标语音

编辑 `scripts/download-azure-tts.js` 中的 `TARGET_VOICES` 数组：

```javascript
const TARGET_VOICES = [
  { name: 'zh-CN-XiaoxiaoNeural', label: 'Xiaoxiao' },
  { name: 'zh-CN-YunxiNeural', label: 'Yunxi' },
  { name: 'zh-CN-YunjianNeural', label: 'Yunjian' },
  // 添加更多语音...
];
```

### 修改样本文本

编辑 `SAMPLE_TEXTS` 数组：

```javascript
const SAMPLE_TEXTS = [
  { emotion: 'custom', text: '您的自定义文本' },
  // 添加更多样本...
];
```

### 修改输出目录

编辑 `OUTPUT_DIR` 常量：

```javascript
const OUTPUT_DIR = path.join(__dirname, '../your-custom-path');
```

## 性能优化

- 脚本在每次请求之间添加 500ms 延迟，避免 API 限流
- 使用 ArrayBuffer 处理音频数据，提高内存效率
- 提供详细的进度反馈和错误处理

## 注意事项

1. **API 限制**：Azure TTS 有请求频率限制，脚本已添加延迟避免超限
2. **文件大小**：生成的 MP3 文件大小约为 20-50KB（取决于文本长度）
3. **网络依赖**：需要稳定的网络连接访问 Azure 服务
4. **凭据安全**：确保 Azure Speech 密钥安全存储，不要提交到版本控制

## 相关文件

- `scripts/download-azure-tts-direct.js` - 主脚本文件
- `frontend/src/views/Animate.vue` - 样本文本来源
- `frontend/src/api/azureTTS.ts` - 前端 TTS 客户端
