import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { OpenAISSMLGenerator, SSMLGenerationRequest, SSMLGenerationResult } from '../../utils/openai-ssml-generator.js';

// 模拟 voiceStylesManager
vi.mock('../../utils/voice-styles-manager.js', () => ({
  voiceStylesManager: {
    loadFromFile: vi.fn().mockResolvedValue(undefined),
    getStylesForVoice: vi.fn().mockReturnValue(['cheerful', 'sad', 'angry', 'excited']),
    getAllVoiceStyles: vi.fn().mockReturnValue({}),
    isStyleSupported: vi.fn().mockReturnValue(true)
  }
}));

// 模拟 fetch
global.fetch = vi.fn();

import { voiceStylesManager } from '../../utils/voice-styles-manager.js';

const mockVoiceStylesManager = voiceStylesManager as any;
const mockFetch = global.fetch as any;

describe('OpenAISSMLGenerator', () => {
  let generator: OpenAISSMLGenerator;
  const mockRequest: SSMLGenerationRequest = {
    text: '你好世界',
    voice: 'zh-CN-XiaoxiaoNeural',
    model: 'gpt-4o'
  };

  beforeEach(() => {
    generator = new OpenAISSMLGenerator();
    vi.clearAllMocks();
    
    // 设置环境变量
    process.env.OPENAI_API_KEY = 'test-api-key';
    
    // 确保模拟方法返回正确的值
    mockVoiceStylesManager.getStylesForVoice.mockReturnValue(['cheerful', 'sad', 'angry', 'excited']);
  });

  afterEach(() => {
    delete process.env.OPENAI_API_KEY;
  });

  describe('构造函数', () => {
    it('应该初始化默认配置', () => {
      expect(generator).toBeInstanceOf(OpenAISSMLGenerator);
      // 构造函数中会调用 loadFromFile，但由于是异步的，可能不会立即调用
    });

    it('应该确保语音样式配置已加载', () => {
      new OpenAISSMLGenerator();
      expect(mockVoiceStylesManager.loadFromFile).toHaveBeenCalled();
    });
  });

  describe('generateSSML', () => {

    it('应该成功生成 SSML', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: '<speak><voice name="zh-CN-XiaoxiaoNeural">你好世界</voice></speak>'
          }
        }],
        usage: { total_tokens: 100 },
        model: 'gpt-4o'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      } as any);

      const result = await generator.generateSSML(mockRequest);

      expect(result.ssml).toBe('<speak><voice name="zh-CN-XiaoxiaoNeural">你好世界</voice></speak>');
      expect(result.rawSSML).toBe('<speak><voice name="zh-CN-XiaoxiaoNeural">你好世界</voice></speak>');
      expect(result.tokenUsage).toEqual({ total_tokens: 100 });
      expect(result.model).toBe('gpt-4o');
    });

    it('应该使用默认模型', async () => {
      const requestWithoutModel: SSMLGenerationRequest = {
        text: '测试文本',
        voice: 'zh-CN-XiaoxiaoNeural'
      };

      const mockResponse = {
        choices: [{
          message: {
            content: '<speak>测试</speak>'
          }
        }],
        usage: { total_tokens: 50 },
        model: 'gpt-4o'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      } as any);

      const result = await generator.generateSSML(requestWithoutModel);

      expect(result.model).toBe('gpt-4o');
    });

    it('应该获取语音支持的样式', async () => {
      mockVoiceStylesManager.getStylesForVoice.mockReturnValue(['cheerful', 'sad', 'angry']);

      const mockResponse = {
        choices: [{
          message: {
            content: '<speak>测试</speak>'
          }
        }],
        usage: { total_tokens: 50 },
        model: 'gpt-4o'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      } as any);

      await generator.generateSSML(mockRequest);

      expect(mockVoiceStylesManager.getStylesForVoice).toHaveBeenCalledWith('zh-CN-XiaoxiaoNeural');
    });

    it('应该清理 markdown 标记', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: '```xml\n<speak>测试内容</speak>\n```'
          }
        }],
        usage: { total_tokens: 50 },
        model: 'gpt-4o'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      } as any);

      const result = await generator.generateSSML(mockRequest);

      expect(result.rawSSML).toBe('```xml\n<speak>测试内容</speak>\n```');
      expect(result.ssml).toBe('<speak>测试内容</speak>');
    });

    it('应该处理空的 OpenAI 响应', async () => {
      const mockResponse = {
        choices: [],
        usage: { total_tokens: 0 },
        model: 'gpt-4o'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      } as any);

      const result = await generator.generateSSML(mockRequest);

      expect(result.ssml).toBe('');
      expect(result.rawSSML).toBe('');
    });

    it('应该处理 OpenAI API 错误', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        text: () => Promise.resolve('Invalid API key')
      } as any);

      await expect(generator.generateSSML(mockRequest)).rejects.toThrow(
        'OpenAI API request failed: 400 Bad Request - Invalid API key'
      );
    });

    it('应该处理网络错误', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(generator.generateSSML(mockRequest)).rejects.toThrow('Network error');
    });

    it('应该处理缺少 API 密钥', async () => {
      delete process.env.OPENAI_API_KEY;

      await expect(generator.generateSSML(mockRequest)).rejects.toThrow(
        'OPENAI_API_KEY is not configured'
      );
    });

    it('应该处理复杂的 markdown 清理', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: '```\n<speak>内容1</speak>\n```\n```xml\n<speak>内容2</speak>\n```'
          }
        }],
        usage: { total_tokens: 50 },
        model: 'gpt-4o'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      } as any);

      const result = await generator.generateSSML(mockRequest);

      // 验证清理后的内容包含两个 speak 标签
      expect(result.ssml).toContain('<speak>内容1</speak>');
      expect(result.ssml).toContain('<speak>内容2</speak>');
    });
  });

  describe('buildSystemPrompt', () => {
    it('应该构建包含语音样式的系统提示词', async () => {
      mockVoiceStylesManager.getStylesForVoice.mockReturnValue(['cheerful', 'sad', 'angry']);

      const mockResponse = {
        choices: [{
          message: {
            content: '<speak>测试</speak>'
          }
        }],
        usage: { total_tokens: 50 },
        model: 'gpt-4o'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      } as any);

      await generator.generateSSML(mockRequest);

      // 验证 fetch 调用中包含了正确的提示词
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.openai.com/v1/chat/completions',
        expect.objectContaining({
          body: expect.stringContaining('Allowed styles for zh-CN-XiaoxiaoNeural: cheerful, sad, angry')
        })
      );
    });

    it('应该包含正确的语音名称', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: '<speak>测试</speak>'
          }
        }],
        usage: { total_tokens: 50 },
        model: 'gpt-4o'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      } as any);

      await generator.generateSSML(mockRequest);

      // 验证请求体中包含语音名称
      const callArgs = mockFetch.mock.calls[0];
      expect(callArgs[1].body).toContain('zh-CN-XiaoxiaoNeural');
    });
  });

  describe('callOpenAIAPI', () => {
    it('应该使用正确的请求头和参数', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: '<speak>测试</speak>'
          }
        }],
        usage: { total_tokens: 50 },
        model: 'gpt-4o'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      } as any);

      await generator.generateSSML(mockRequest);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.openai.com/v1/chat/completions',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-api-key'
          },
          body: expect.stringContaining('"temperature":0.2')
        })
      );
    });

    it('应该处理 API 响应状态检查', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        text: () => Promise.resolve('Rate limit exceeded')
      } as any);

      await expect(generator.generateSSML(mockRequest)).rejects.toThrow(
        'OpenAI API request failed: 429 Too Many Requests - Rate limit exceeded'
      );
    });
  });

  describe('cleanSSML', () => {
    it('应该移除开头的 markdown 代码块', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: '```xml\n<speak>测试</speak>'
          }
        }],
        usage: { total_tokens: 50 },
        model: 'gpt-4o'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      } as any);

      const result = await generator.generateSSML(mockRequest);

      expect(result.ssml).toBe('<speak>测试</speak>');
    });

    it('应该移除结尾的 markdown 代码块', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: '<speak>测试</speak>\n```'
          }
        }],
        usage: { total_tokens: 50 },
        model: 'gpt-4o'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      } as any);

      const result = await generator.generateSSML(mockRequest);

      expect(result.ssml).toBe('<speak>测试</speak>');
    });

    it('应该处理没有 markdown 的内容', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: '<speak>测试</speak>'
          }
        }],
        usage: { total_tokens: 50 },
        model: 'gpt-4o'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      } as any);

      const result = await generator.generateSSML(mockRequest);

      expect(result.ssml).toBe('<speak>测试</speak>');
    });

    it('应该处理只有 markdown 标记的内容', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: '```\n```'
          }
        }],
        usage: { total_tokens: 50 },
        model: 'gpt-4o'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      } as any);

      const result = await generator.generateSSML(mockRequest);

      expect(result.ssml).toBe('');
    });
  });

  describe('边界情况', () => {
    it('应该处理非常长的文本', async () => {
      const longText = '测试文本'.repeat(1000);
      const requestWithLongText: SSMLGenerationRequest = {
        text: longText,
        voice: 'zh-CN-XiaoxiaoNeural'
      };

      const mockResponse = {
        choices: [{
          message: {
            content: '<speak>长文本</speak>'
          }
        }],
        usage: { total_tokens: 1000 },
        model: 'gpt-4o'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      } as any);

      const result = await generator.generateSSML(requestWithLongText);

      expect(result.ssml).toBe('<speak>长文本</speak>');
    });

    it('应该处理空文本', async () => {
      const requestWithEmptyText: SSMLGenerationRequest = {
        text: '',
        voice: 'zh-CN-XiaoxiaoNeural'
      };

      const mockResponse = {
        choices: [{
          message: {
            content: '<speak></speak>'
          }
        }],
        usage: { total_tokens: 10 },
        model: 'gpt-4o'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      } as any);

      const result = await generator.generateSSML(requestWithEmptyText);

      expect(result.ssml).toBe('<speak></speak>');
    });

    it('应该处理特殊字符', async () => {
      const specialText = '测试文本包含特殊字符: !@#$%^&*()_+-=[]{}|;:,.<>?';
      const requestWithSpecialChars: SSMLGenerationRequest = {
        text: specialText,
        voice: 'zh-CN-XiaoxiaoNeural'
      };

      const mockResponse = {
        choices: [{
          message: {
            content: '<speak>特殊字符</speak>'
          }
        }],
        usage: { total_tokens: 50 },
        model: 'gpt-4o'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      } as any);

      const result = await generator.generateSSML(requestWithSpecialChars);

      expect(result.ssml).toBe('<speak>特殊字符</speak>');
    });
  });
});
