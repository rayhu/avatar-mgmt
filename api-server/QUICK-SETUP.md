# Azure TTS 快速设置指南

## 🚀 5分钟快速设置

### 1. 获取 Azure Speech Service 凭据

1. 访问 [Azure Portal](https://portal.azure.com)
2. 搜索并创建 "Speech Service" 资源
3. 在资源页面找到 "密钥和终结点"
4. 复制 **密钥 1** 和 **区域**

### 2. 配置环境变量

在 `api-server` 目录下创建 `.env` 文件：

```env
AZURE_SPEECH_KEY=your_azure_speech_key_here
AZURE_SPEECH_REGION=eastasia
```

### 3. 测试配置

```bash
cd api-server
yarn test:simple
```

如果看到 ✅ 成功信息，说明配置正确。

### 4. 启动服务

```bash
yarn dev
```

服务将在 http://localhost:3000 启动。

### 5. 测试 API

```bash
curl -X POST http://localhost:3000/api/azure-tts \
  -H "Content-Type: application/json" \
  -d '{
    "ssml": "<speak version=\"1.0\" xmlns=\"http://www.w3.org/2001/10/synthesis\" xml:lang=\"zh-CN\"><voice name=\"zh-CN-XiaoxiaoNeural\">你好世界</voice></speak>"
  }' \
  --output test.mp3
```

如果生成了 test.mp3 文件，说明 API 工作正常！

## 🔧 故障排除

### 常见问题

1. **"缺少必要的环境变量"**
   - 检查 `.env` 文件是否存在
   - 确认变量名拼写正确

2. **"网络连接失败"**
   - 检查 Azure 密钥是否正确
   - 确认区域名称正确
   - 检查网络连接

3. **"400 错误"**
   - 检查 SSML 格式是否正确
   - 确认语音名称有效

### 调试步骤

1. 运行简单测试：`yarn test:simple`
2. 检查环境变量：`cat .env`
3. 查看服务器日志：`yarn dev`
4. 测试网络连接：`ping eastasia.tts.speech.microsoft.com`

## 📞 支持

如果仍有问题，请检查：

- [Azure Speech Service 文档](https://docs.microsoft.com/en-us/azure/cognitive-services/speech-service/)
- 确保 Azure 账户有足够的配额
- 检查防火墙设置
