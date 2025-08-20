/**
 * Vitest 测试设置文件
 * 配置测试环境和全局设置
 */
import { vi, afterEach } from 'vitest';

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

if (!process.env.DIRECTUS_URL) {
  process.env.DIRECTUS_URL = 'http://localhost:8055';
}

if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'test-jwt-secret';
}

// 清理函数
afterEach(() => {
  // 清理所有模拟
  vi.clearAllMocks();

  // 清理控制台输出
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});
