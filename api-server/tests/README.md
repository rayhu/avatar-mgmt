# 🧪 API Server 测试框架

这是一个完整的单元测试框架，确保代码质量并达到 90% 以上的测试覆盖率。

## 📋 目录结构

```
tests/
├── setup.ts                    # 测试设置文件
├── run-tests.sh               # 测试运行脚本
├── README.md                  # 本文档
├── utils/                     # 工具模块测试
│   ├── ssml-validator.test.ts
│   ├── voice-styles-manager.test.ts
│   ├── openai-ssml-generator.test.ts
│   └── response-builder.test.ts
└── handlers/                  # Handler 模块测试
    └── openai-ssml.test.ts
```

## 🚀 快速开始

### 1. 安装依赖

```bash
yarn install
```

### 2. 运行所有测试

```bash
yarn test
```

### 3. 生成覆盖率报告

```bash
yarn test:coverage
```

### 4. 使用测试脚本

```bash
# 运行所有测试
./tests/run-tests.sh

# 生成覆盖率报告
./tests/run-tests.sh --coverage

# 监视模式
./tests/run-tests.sh --watch

# 只运行单元测试
./tests/run-tests.sh --unit

# CI 模式
./tests/run-tests.sh --ci
```

## 🎯 测试策略

### 测试覆盖率目标

- **总体覆盖率**: ≥ 90%
- **分支覆盖率**: ≥ 90%
- **函数覆盖率**: ≥ 90%
- **行覆盖率**: ≥ 90%

### 测试类型

1. **单元测试** (`tests/utils/`)
   - 测试单个函数/类的功能
   - 模拟外部依赖
   - 快速执行

2. **集成测试** (`tests/handlers/`)
   - 测试模块间的交互
   - 测试完整的请求处理流程
   - 验证错误处理

3. **端到端测试** (计划中)
   - 测试完整的 API 端点
   - 验证真实环境下的行为

## 🛠️ 测试工具

### VITEST 配置

- **测试环境**: Node.js
- **模块系统**: ES Modules
- **覆盖率报告**: HTML, LCOV, Text
- **并行执行**: 50% CPU 核心
- **超时设置**: 10 秒

### 模拟策略

- **外部 API**: 模拟 fetch 调用
- **文件系统**: 模拟 fs 模块
- **环境变量**: 测试时设置模拟值
- **依赖模块**: 模拟内部模块

## 📊 覆盖率报告

### 生成报告

```bash
yarn test:coverage
```

### 查看报告

1. **HTML 报告**: `coverage/lcov-report/index.html`
2. **LCOV 报告**: `coverage/lcov.info`
3. **控制台报告**: 测试执行完成后显示

### 覆盖率指标

- **Statements**: 语句覆盖率
- **Branches**: 分支覆盖率
- **Functions**: 函数覆盖率
- **Lines**: 行覆盖率

## 🔧 测试编写指南

### 测试文件命名

- 单元测试: `*.test.ts`
- 集成测试: `*.spec.ts`

### 测试结构

```typescript
describe('模块名称', () => {
  let instance: ClassName;

  beforeEach(() => {
    // 设置测试环境
    instance = new ClassName();
  });

  describe('方法名称', () => {
    it('应该执行预期行为', () => {
      // 准备测试数据
      const input = 'test';

      // 执行被测试的方法
      const result = instance.method(input);

      // 验证结果
      expect(result).toBe('expected');
    });

    it('应该处理错误情况', () => {
      // 测试错误处理
      expect(() => {
        instance.method('invalid');
      }).toThrow('Error message');
    });
  });
});
```

### 断言最佳实践

```typescript
// 基本断言
expect(value).toBe(expected);
expect(value).toEqual(expected);
expect(value).toBeDefined();
expect(value).toBeUndefined();

// 数组断言
expect(array).toHaveLength(3);
expect(array).toContain(item);
expect(array).toEqual(expect.arrayContaining([item1, item2]));

// 对象断言
expect(object).toHaveProperty('key');
expect(object).toEqual(expect.objectContaining({ key: 'value' }));

// 函数断言
expect(fn).toHaveBeenCalled();
expect(fn).toHaveBeenCalledWith(arg1, arg2);
expect(fn).toHaveBeenCalledTimes(3);

// 异步断言
await expect(asyncFunction()).resolves.toBe(expected);
await expect(asyncFunction()).rejects.toThrow('Error');
```

### 模拟最佳实践

```typescript
// 模拟模块
vi.mock('../utils/module');

// 模拟函数
const mockFn = vi.fn().mockReturnValue('mocked');
const mockFn = vi.fn().mockResolvedValue('async mocked');
const mockFn = vi.fn().mockRejectedValue(new Error('error'));

// 模拟实现
vi.fn().mockImplementation(arg => {
  return arg.toUpperCase();
});

// 清理模拟
beforeEach(() => {
  vi.clearAllMocks();
});
```

## 🚨 常见问题

### 1. 测试失败

**问题**: 测试运行时失败 **解决**:

- 检查环境变量设置
- 验证依赖是否正确安装
- 查看错误日志

### 2. 覆盖率不达标

**问题**: 覆盖率低于 90% **解决**:

- 添加边界情况测试
- 测试错误处理路径
- 检查未覆盖的代码分支

### 3. 模拟不工作

**问题**: 模拟函数没有按预期工作 **解决**:

- 检查模拟设置顺序
- 验证模拟函数名称
- 确保在测试前设置模拟

### 4. 异步测试失败

**问题**: 异步测试超时或失败 **解决**:

- 使用 `async/await`
- 正确模拟异步函数
- 设置适当的超时时间

## 📈 持续改进

### 定期检查

- 每周检查测试覆盖率
- 每月审查测试质量
- 每季度更新测试策略

### 测试维护

- 重构代码时更新测试
- 添加新功能时编写测试
- 修复 bug 时添加回归测试

### 性能优化

- 并行执行测试
- 优化模拟策略
- 减少测试执行时间

## 🔗 相关链接

- [Vitest 官方文档](https://vitest.dev/)
- [TypeScript 测试指南](https://www.typescriptlang.org/docs/handbook/testing.html)
- [Node.js 测试最佳实践](https://nodejs.org/en/docs/guides/testing-and-debugging/)

## 📞 支持

如果您在测试过程中遇到问题，请：

1. 查看本文档
2. 检查 Vitest 错误日志
3. 联系开发团队

---

**记住**: 好的测试是代码质量的保证，也是重构时的安全网！
