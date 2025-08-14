/**
 * Jest 测试设置文件
 * 配置测试环境和全局设置
 */

// 设置测试环境变量
process.env.NODE_ENV = 'test';
process.env.DEBUG_MODE = 'true';

// 模拟环境变量（如果没有设置）
if (!process.env.OPENAI_API_KEY) {
  process.env.OPENAI_API_KEY = 'test-api-key';
}

if (!process.env.AZURE_SPEECH_KEY) {
  process.env.AZURE_SPEECH_KEY = 'test-azure-key';
}

if (!process.env.AZURE_SPEECH_REGION) {
  process.env.AZURE_SPEECH_REGION = 'eastus';
}

// 全局测试超时设置
jest.setTimeout(10000);

// 清理函数
afterEach(() => {
  // 清理所有模拟
  jest.clearAllMocks();
  
  // 清理控制台输出
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

// 全局测试工具函数
global.testUtils = {
  // 创建模拟的 Express 请求对象
  createMockRequest: (overrides: any = {}) => ({
    method: 'POST',
    url: '/api/test',
    headers: {
      'content-type': 'application/json',
      'user-agent': 'jest-test',
      ...(overrides.headers || {}),
    },
    body: {},
    ...overrides,
  }),

  // 创建模拟的 Express 响应对象
  createMockResponse: () => {
    const res: any = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    res.send = jest.fn().mockReturnValue(res);
    res.set = jest.fn().mockReturnValue(res);
    res.header = jest.fn().mockReturnValue(res);
    return res;
  },

  // 等待异步操作完成
  waitFor: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),

  // 创建模拟的错误对象
  createMockError: (message: string, statusCode: number = 500) => {
    const error = new Error(message) as any;
    error.statusCode = statusCode;
    return error;
  },
};

// 全局测试工具函数已移至 setup.d.ts
