# API Server 日志系统

## 概述

所有 API handlers 现在都使用统一的日志格式，提供详细的请求处理信息和错误追踪。

## 日志格式

### 标准日志格式

```
[时间戳] 级别 消息 | 上下文信息
```

### 示例

```
[2024-01-15T10:30:45.123Z] INFO 🖼️ Avatars 请求开始 | {"method":"GET","url":"/api/avatars","bodySize":0}
[2024-01-15T10:30:45.456Z] INFO ✅ Avatars 查询成功 | {"avatarCount":5,"baseUrl":"http://localhost:5173"}
```

## Handlers 日志详情

### 1. Avatars Handler (`/api/avatars`)

- **开始日志**: 请求方法、URL、请求头、查询参数
- **配置检查**: Directus URL 和 Token 配置状态
- **API 调用**: Directus API 调用信息
- **响应日志**: 响应状态、数据条数
- **成功日志**: 返回的 avatar 数量
- **错误日志**: 详细的错误信息和类型

### 2. Azure TTS Handler (`/api/azure-tts`)

- **开始日志**: 请求参数、语音配置
- **配置检查**: Azure 区域和密钥配置
- **API 调用**: Azure TTS API 调用信息
- **响应日志**: 响应状态、响应头
- **成功日志**: 音频缓冲区大小、内容类型
- **错误日志**: 详细的错误信息和响应内容

### 3. Generate SSML Handler (`/api/generate-ssml`)

- **开始日志**: 请求参数、文本长度
- **配置检查**: OpenAI API 密钥配置
- **语音样式**: 支持的语音样式列表
- **API 调用**: OpenAI API 调用信息
- **响应日志**: 响应状态、生成结果
- **成功日志**: SSML 长度、预览内容
- **错误日志**: 详细的错误信息和堆栈

### 4. OpenAI SSML Handler (`/api/openai-ssml`)

- **开始日志**: 请求参数、模型配置
- **配置检查**: OpenAI API 密钥配置
- **语音样式**: 支持的语音样式配置
- **API 调用**: OpenAI API 调用信息
- **响应日志**: 响应状态、生成结果
- **成功日志**: SSML 长度、预览内容
- **错误日志**: 详细的错误信息和堆栈

## 日志级别

### INFO (信息)

- 请求开始和结束
- 配置检查结果
- API 调用成功
- 处理结果

### WARN (警告)

- 配置缺失但使用默认值
- 非关键错误

### ERROR (错误)

- API 调用失败
- 配置错误
- 处理异常

### DEBUG (调试)

- 仅在开发环境显示
- 详细的调试信息

## 测试日志

运行以下命令测试所有 handlers 的日志：

```bash
# 启动 API 服务器
yarn dev

# 在另一个终端运行测试
yarn test:all
```

## 日志工具

### Logger 类

提供了统一的日志方法：

```typescript
import { Logger } from './utils/logger';

// 基本日志
Logger.info('消息', { context: 'data' });
Logger.warn('警告', { context: 'data' });
Logger.error('错误', { context: 'data' });
Logger.debug('调试', { context: 'data' });

// Handler 专用方法
Logger.handlerStart('HandlerName', req);
Logger.handlerSuccess('HandlerName', { result: 'data' });
Logger.handlerError('HandlerName', error, { context: 'data' });

// API 调用日志
Logger.apiCall('API Name', 'https://api.example.com', { params: 'data' });
Logger.apiResponse('API Name', 200, { response: 'data' });
```

## 最佳实践

1. **一致性**: 所有 handlers 使用相同的日志格式
2. **详细性**: 记录关键步骤和错误信息
3. **安全性**: 不记录敏感信息（如 API 密钥）
4. **可读性**: 使用表情符号和清晰的描述
5. **上下文**: 提供足够的上下文信息用于调试

## 故障排除

### 常见问题

1. **日志不显示**: 检查 NODE_ENV 环境变量
2. **错误信息不完整**: 确保捕获完整的错误对象
3. **性能影响**: 在生产环境中考虑日志级别

### 调试技巧

1. 使用 `yarn test:all` 测试所有 handlers
2. 检查控制台输出的日志格式
3. 验证错误处理是否正确记录
4. 确认配置检查是否正常工作
