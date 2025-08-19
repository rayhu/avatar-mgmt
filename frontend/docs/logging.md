# 前端日志系统

## 概述

前端日志系统提供了统一的日志记录功能，支持不同环境和级别的日志输出，帮助开发者追踪应用状态、调试问题和监控性能。

## 特性

- **环境感知**: 开发环境显示所有日志，生产环境只显示警告和错误
- **级别控制**: 支持 DEBUG、INFO、WARN、ERROR 四个级别
- **结构化日志**: 支持上下文信息，便于调试和分析
- **专用方法**: 针对 API 调用、用户交互、性能监控等场景的专用日志方法
- **组件友好**: 为 Vue 组件提供便捷的日志方法

## 日志级别

### DEBUG (0)

- 详细的调试信息
- 仅在开发环境显示
- 用于追踪内部状态和流程

### INFO (1)

- 一般信息日志
- 记录重要的操作和状态变化
- 开发和生产环境都显示

### WARN (2)

- 警告信息
- 表示潜在问题或非关键错误
- 开发和生产环境都显示

### ERROR (3)

- 错误信息
- 表示严重问题或异常
- 开发和生产环境都显示

## 使用方法

### 基本用法

```typescript
import { logger } from '@/utils/logger';

// 基本日志
logger.debug('调试信息', { context: 'data' });
logger.info('一般信息', { context: 'data' });
logger.warn('警告信息', { context: 'data' });
logger.error('错误信息', { context: 'data' });
```

### API 调用日志

```typescript
// API 调用开始
logger.apiCall('User API', '/api/users', {
  method: 'GET',
  params: { id: 123 },
});

// API 响应
logger.apiResponse('User API', 200, {
  dataSize: 1024,
  duration: 150,
});

// API 错误
logger.apiError('User API', error, {
  url: '/api/users',
  method: 'GET',
});
```

### 用户交互日志

```typescript
// 用户操作
logger.userAction('点击登录按钮', {
  buttonId: 'login-btn',
  timestamp: Date.now(),
});

// 路由跳转
logger.route('/home', '/login', {
  userRole: 'admin',
  isAuthenticated: true,
});
```

### 性能监控

```typescript
// 性能日志
logger.performance('数据加载完成', 150, {
  operation: 'fetch_users',
  itemsCount: 100,
});
```

### 组件日志

```typescript
// 组件信息日志
logger.component('UserProfile', '组件状态更新', {
  method: 'updateProfile',
  newState: { name: 'John' },
});

// 组件调试日志
logger.componentDebug('UserProfile', '内部状态', {
  method: 'internalState',
  state: { mounted: true },
});

// 组件错误日志
logger.componentError('UserProfile', '渲染失败', {
  method: 'render',
  error: 'invalid_props',
});
```

### 状态管理日志

```typescript
// Store 更新
logger.store(
  'UPDATE_USER',
  { name: 'John', role: 'admin' },
  {
    previousState: { name: 'Jane' },
  }
);
```

## 在 Vue 组件中使用

### 组件生命周期日志

```vue
<script setup lang="ts">
import { logger } from '@/utils/logger';
import { onMounted, onUnmounted } from 'vue';

onMounted(() => {
  logger.component('MyComponent', '组件已挂载', {
    props: props,
    timestamp: Date.now(),
  });
});

onUnmounted(() => {
  logger.component('MyComponent', '组件已卸载');
});
</script>
```

### 事件处理日志

```vue
<script setup lang="ts">
import { logger } from '@/utils/logger';

const handleClick = () => {
  logger.userAction('点击按钮', {
    component: 'MyComponent',
    buttonId: 'action-btn',
  });

  // 执行操作...
};
</script>
```

## 配置

### 设置日志级别

```typescript
import { logger, LogLevel } from '@/utils/logger';

// 设置日志级别
logger.setLevel(LogLevel.DEBUG); // 显示所有日志
logger.setLevel(LogLevel.INFO); // 显示 INFO 及以上级别
logger.setLevel(LogLevel.WARN); // 显示 WARN 及以上级别
logger.setLevel(LogLevel.ERROR); // 只显示 ERROR
logger.setLevel(LogLevel.NONE); // 禁用所有日志
```

### 环境变量

```typescript
// 检查是否为开发环境
if (logger.isDev()) {
  // 开发环境特定逻辑
}

// 获取当前日志级别
const currentLevel = logger.getLevel();
```

## 最佳实践

### 1. 日志内容

- **有意义的消息**: 使用清晰、描述性的消息
- **结构化数据**: 使用 context 参数传递相关数据
- **避免敏感信息**: 不要记录密码、token 等敏感信息
- **适度详细**: 提供足够的信息用于调试，但不要过度详细

### 2. 性能考虑

- **避免频繁日志**: 在循环或高频操作中谨慎使用日志
- **条件日志**: 使用适当的日志级别避免不必要的输出
- **异步日志**: 对于耗时操作，考虑异步记录日志

### 3. 错误处理

```typescript
try {
  // 可能出错的操作
} catch (error) {
  logger.error('操作失败', {
    component: 'MyComponent',
    method: 'performAction',
    error: error.message,
    errorType: error.constructor.name,
  });
}
```

### 4. 上下文信息

```typescript
logger.info('用户登录', {
  component: 'LoginForm',
  method: 'handleLogin',
  userId: user.id,
  userRole: user.role,
  loginMethod: 'password',
  timestamp: Date.now(),
});
```

## 测试

### 测试页面

使用 `test-logging.html` 页面测试日志系统：

```bash
# 在浏览器中打开
open frontend/test-logging.html
```

### 测试功能

- 日志级别测试
- API 调用日志测试
- 用户交互日志测试
- 性能日志测试
- 组件日志测试
- 自定义日志测试

## 故障排除

### 常见问题

1. **日志不显示**
   - 检查日志级别设置
   - 确认是否为开发环境
   - 检查浏览器控制台

2. **性能问题**
   - 减少日志频率
   - 使用适当的日志级别
   - 避免在循环中记录日志

3. **日志格式问题**
   - 检查 context 参数格式
   - 确保 JSON 序列化正常
   - 验证时间戳格式

### 调试技巧

1. **临时提高日志级别**

   ```typescript
   logger.setLevel(LogLevel.DEBUG);
   ```

2. **导出日志**
   - 使用浏览器开发者工具
   - 复制控制台输出
   - 使用测试页面的导出功能

3. **监控特定组件**
   ```typescript
   logger.component('TargetComponent', '状态变化', {
     state: currentState,
     props: componentProps,
   });
   ```

## 与后端日志的对比

| 特性     | 前端日志   | 后端日志    |
| -------- | ---------- | ----------- |
| 环境     | 浏览器     | 服务器      |
| 持久化   | 临时       | 文件/数据库 |
| 级别控制 | 运行时     | 启动时      |
| 上下文   | 用户交互   | 请求处理    |
| 性能影响 | 客户端性能 | 服务器性能  |

## 总结

前端日志系统为应用提供了全面的监控和调试能力，通过合理使用不同级别的日志和上下文信息，可以有效地追踪应用状态、调试问题和优化性能。
