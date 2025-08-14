# Azure TTS 调试模式设置

## 概述

新增了详细的日志系统来帮助排查 Azure TTS 400 错误和 OpenAI 生成的 SSML 问题。

## 环境变量设置

### 启用调试模式

在你的环境变量文件（`.env` 或部署配置）中添加：

```env
DEBUG_MODE=true
```

### 关闭调试模式（默认）

```env
DEBUG_MODE=false
```

或者完全不设置这个变量。

## 调试模式功能

### 启用时 (DEBUG_MODE=true)

1. **详细日志返回前端**: 所有错误响应都会包含 `debugLogs` 字段
2. **SSML 完整记录**: 记录 OpenAI 返回的原始和处理后的 SSML
3. **请求响应详情**: 记录所有 API 调用的详细信息
4. **SSML 验证**: 详细的 SSML 格式验证和错误报告
5. **响应头信息**: Azure TTS 成功时会添加 `X-Debug-Info` 响应头

### 关闭时 (DEBUG_MODE=false 或未设置)

1. **简洁日志**: 只在控制台输出关键信息
2. **前端保护**: 不向前端返回敏感调试信息
3. **性能优化**: 减少日志处理开销

## 调试信息字段说明

### OpenAI SSML 生成接口 (`/api/openai-ssml`)

调试模式下的响应格式：

```json
{
  "ssml": "<speak>...</speak>",
  "debugInfo": {
    "validation": {
      "isValid": true,
      "errors": [],
      "warnings": ["警告信息"]
    },
    "tokenUsage": {
      "prompt_tokens": 456,
      "completion_tokens": 123,
      "total_tokens": 579
    },
    "model": "gpt-4o",
    "originalSSML": "```xml\n<speak>...</speak>\n```",
    "processingSteps": {
      "markdownRemoved": true,
      "originalLength": 200,
      "finalLength": 180
    }
  },
  "debugLogs": [
    {
      "timestamp": "2025-08-07T...",
      "level": "info",
      "module": "OPENAI-SSML",
      "message": "请求开始",
      "data": {...}
    }
  ]
}
```

### Azure TTS 接口 (`/api/azure-tts`)

成功时的响应头（调试模式）：

```
X-Debug-Info: {"ssmlLength":300,"voice":"zh-CN-XiaoxiaoNeural","region":"eastus","audioSize":25600}
```

错误时的响应体（调试模式）：

```json
{
  "error": "Azure TTS request failed",
  "details": {...},
  "requestInfo": {
    "voice": "zh-CN-XiaoxiaoNeural",
    "ssmlLength": 300,
    "region": "eastus"
  },
  "debugLogs": [...]
}
```

## 日志模块说明

- `OPENAI-SSML`: OpenAI SSML 生成相关日志
- `AZURE-TTS`: Azure TTS API 调用相关日志
- `SSML-VALIDATOR`: SSML 格式验证相关日志

## 常见错误排查

### SSML 验证失败

查看 `debugLogs` 中 `SSML-VALIDATOR` 模块的错误信息：
- `缺少 <speak> 根元素`
- `可能存在未闭合的 XML 标签`
- `使用了 mstts:express-as 但缺少 mstts 命名空间`

### Azure TTS 400 错误

查看错误响应中的 `details` 和 `requestInfo` 字段：
- 检查 SSML 格式是否正确
- 确认 voice 是否支持使用的样式
- 查看 Azure 返回的具体错误信息

## 生产环境建议

- **生产环境**: 设置 `DEBUG_MODE=false` 或不设置
- **测试环境**: 可以启用 `DEBUG_MODE=true` 进行问题排查
- **开发环境**: 建议启用调试模式