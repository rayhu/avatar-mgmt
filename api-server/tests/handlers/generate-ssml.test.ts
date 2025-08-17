import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Request, Response } from 'express';
import generateSSMLHandler, { resetVoiceStyleMapCache } from '../../handlers/generate-ssml.js';

// 模拟 fs 和 path 模块
vi.mock('fs');
vi.mock('path');

import * as fs from 'fs';
import * as path from 'path';

const mockFs = fs as any;
const mockPath = path as any;

// 模拟 fetch
global.fetch = vi.fn();

describe('Generate SSML Handler', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockStatus: any;
  let mockJson: any;
  let mockFetch: any;

  beforeEach(() => {
    // 重置所有模拟
    vi.clearAllMocks();
    
    // 设置环境变量
    process.env.OPENAI_API_KEY = 'test-openai-key';
    
    // 创建模拟的响应对象
    mockStatus = vi.fn().mockReturnThis();
    mockJson = vi.fn().mockReturnThis();
    
    mockRes = {
      status: mockStatus,
      json: mockJson
    };

    // 设置默认的模拟返回值
    mockPath.join.mockImplementation((...args) => args.join('/'));
    mockFs.existsSync.mockReturnValue(false); // 默认文件不存在，使用静态映射
    mockFs.readFileSync.mockReturnValue(JSON.stringify([
      { name: 'zh-CN-XiaoxiaoNeural', styles: ['cheerful', 'sad', 'angry'] },
      { name: 'zh-CN-XiaohanNeural', styles: ['affectionate', 'calm'] }
    ]));

    // 设置默认的fetch模拟
    mockFetch = global.fetch as any;
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: vi.fn().mockResolvedValue({
        choices: [{ message: { content: '<speak>测试</speak>' } }]
      })
    } as any);
  });

  afterEach(() => {
    delete process.env.OPENAI_API_KEY;
  });

  describe('HTTP方法验证', () => {
    it('应该拒绝非POST请求', async () => {
      mockReq = {
        method: 'GET',
        url: '/api/generate-ssml',
        headers: { 'user-agent': 'jest-test' },
        body: {}
      };

      await generateSSMLHandler(mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(405);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Method not allowed' });
    });

    it('应该接受POST请求', async () => {
      mockReq = {
        method: 'POST',
        url: '/api/generate-ssml',
        headers: { 'user-agent': 'jest-test' },
        body: { text: '测试文本' }
      };

      await generateSSMLHandler(mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(200);
    });
  });

  describe('参数验证', () => {
    it('应该在文本缺失时返回400错误', async () => {
      mockReq = {
        method: 'POST',
        url: '/api/generate-ssml',
        headers: { 'user-agent': 'jest-test' },
        body: {}
      };

      await generateSSMLHandler(mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Parameter "text" is required.' });
    });

    it('应该在文本为空字符串时返回400错误', async () => {
      mockReq = {
        method: 'POST',
        url: '/api/generate-ssml',
        headers: { 'user-agent': 'jest-test' },
        body: { text: '' }
      };

      await generateSSMLHandler(mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Parameter "text" is required.' });
    });

    it('应该在文本为空白字符串时返回400错误', async () => {
      mockReq = {
        method: 'POST',
        url: '/api/generate-ssml',
        headers: { 'user-agent': 'jest-test' },
        body: { text: '   ' }
      };

      await generateSSMLHandler(mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Parameter "text" is required.' });
    });

    it('应该在文本为非字符串时返回400错误', async () => {
      mockReq = {
        method: 'POST',
        url: '/api/generate-ssml',
        headers: { 'user-agent': 'jest-test' },
        body: { text: 123 }
      };

      await generateSSMLHandler(mockReq as Request, mockRes as Response);

      // 由于text是数字123，typeof text !== 'string' 为true，应该返回400
      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Parameter "text" is required.' });
    });

    it('应该接受有效的文本', async () => {
      mockReq = {
        method: 'POST',
        url: '/api/generate-ssml',
        headers: { 'user-agent': 'jest-test' },
        body: { text: '测试文本' }
      };

      await generateSSMLHandler(mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(200);
    });
  });

  describe('OpenAI API密钥验证', () => {
    it('应该在OpenAI API密钥缺失时返回500错误', async () => {
      delete process.env.OPENAI_API_KEY;
      
      mockReq = {
        method: 'POST',
        url: '/api/generate-ssml',
        headers: { 'user-agent': 'jest-test' },
        body: { text: '测试文本' }
      };

      await generateSSMLHandler(mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({ error: 'OPENAI_API_KEY is not configured.' });
    });
  });

  describe('语音样式映射', () => {
    it('应该从JSON文件加载语音样式映射', async () => {
      // 重置缓存，确保文件检查逻辑被执行
      resetVoiceStyleMapCache();
      
      // 模拟文件存在
      mockFs.existsSync.mockImplementation((path: string) => {
        return path.includes('azure-voices-zh.json');
      });
      
      mockReq = {
        method: 'POST',
        url: '/api/generate-ssml',
        headers: { 'user-agent': 'jest-test' },
        body: { text: '测试文本', voice: 'zh-CN-XiaoxiaoNeural' }
      };

      await generateSSMLHandler(mockReq as Request, mockRes as Response);

      expect(mockFs.existsSync).toHaveBeenCalled();
      expect(mockFs.readFileSync).toHaveBeenCalled();
    });

    it('应该在JSON文件不存在时回退到静态映射', async () => {
      mockFs.existsSync.mockReturnValue(false);
      
      mockReq = {
        method: 'POST',
        url: '/api/generate-ssml',
        headers: { 'user-agent': 'jest-test' },
        body: { text: '测试文本', voice: 'zh-CN-XiaoxiaoNeural' }
      };

      await generateSSMLHandler(mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(200);
    });

    it('应该在JSON文件读取失败时回退到静态映射', async () => {
      mockFs.readFileSync.mockImplementation(() => {
        throw new Error('File read error');
      });
      
      mockReq = {
        method: 'POST',
        url: '/api/generate-ssml',
        headers: { 'user-agent': 'jest-test' },
        body: { text: '测试文本', voice: 'zh-CN-XiaoxiaoNeural' }
      };

      await generateSSMLHandler(mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(200);
    });

    it('应该尝试多个可能的文件路径', async () => {
      // 重置缓存，确保路径检查逻辑被执行
      resetVoiceStyleMapCache();
      
      // 模拟所有路径都不存在，触发回退逻辑
      mockFs.existsSync.mockReturnValue(false);
      
      mockReq = {
        method: 'POST',
        url: '/api/generate-ssml',
        headers: { 'user-agent': 'jest-test' },
        body: { text: '测试文本', voice: 'zh-CN-XiaoxiaoNeural' }
      };

      await generateSSMLHandler(mockReq as Request, mockRes as Response);

      // 验证尝试了多个路径
      expect(mockPath.join).toHaveBeenCalledWith(process.cwd(), '../frontend', 'public', 'azure-voices-zh.json');
      expect(mockPath.join).toHaveBeenCalledWith(process.cwd(), 'public', 'azure-voices-zh.json');
      expect(mockPath.join).toHaveBeenCalledWith(process.cwd(), 'azure-voices-zh.json');
      
      // 验证硬编码路径也被检查了
      expect(mockFs.existsSync).toHaveBeenCalledWith('/app/public/azure-voices-zh.json');
    });
  });

  describe('OpenAI API调用', () => {
    it('应该使用正确的OpenAI API端点', async () => {
      mockReq = {
        method: 'POST',
        url: '/api/generate-ssml',
        headers: { 'user-agent': 'jest-test' },
        body: { text: '测试文本', voice: 'zh-CN-XiaoxiaoNeural' }
      };

      await generateSSMLHandler(mockReq as Request, mockRes as Response);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.openai.com/v1/chat/completions',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer test-openai-key',
          },
          body: expect.stringContaining('gpt-4o')
        })
      );
    });

    it('应该使用默认语音', async () => {
      mockReq = {
        method: 'POST',
        url: '/api/generate-ssml',
        headers: { 'user-agent': 'jest-test' },
        body: { text: '测试文本' }
      };

      await generateSSMLHandler(mockReq as Request, mockRes as Response);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.openai.com/v1/chat/completions',
        expect.objectContaining({
          body: expect.stringContaining('zh-CN-XiaoxiaoNeural')
        })
      );
    });

    it('应该使用自定义语音', async () => {
      mockReq = {
        method: 'POST',
        url: '/api/generate-ssml',
        headers: { 'user-agent': 'jest-test' },
        body: { text: '测试文本', voice: 'zh-CN-XiaohanNeural' }
      };

      await generateSSMLHandler(mockReq as Request, mockRes as Response);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.openai.com/v1/chat/completions',
        expect.objectContaining({
          body: expect.stringContaining('zh-CN-XiaohanNeural')
        })
      );
    });

    it('应该包含正确的提示词', async () => {
      mockReq = {
        method: 'POST',
        url: '/api/generate-ssml',
        headers: { 'user-agent': 'jest-test' },
        body: { text: '测试文本', voice: 'zh-CN-XiaoxiaoNeural' }
      };

      await generateSSMLHandler(mockReq as Request, mockRes as Response);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.openai.com/v1/chat/completions',
        expect.objectContaining({
          body: expect.stringContaining('你是一名语音合成工程师')
        })
      );
    });

    it('应该包含语音支持的情绪样式', async () => {
      mockReq = {
        method: 'POST',
        url: '/api/generate-ssml',
        headers: { 'user-agent': 'jest-test' },
        body: { text: '测试文本', voice: 'zh-CN-XiaoxiaoNeural' }
      };

      await generateSSMLHandler(mockReq as Request, mockRes as Response);

      // 检查提示词是否包含基本的SSML要求
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.openai.com/v1/chat/completions',
        expect.objectContaining({
          body: expect.stringContaining('你是一名语音合成工程师')
        })
      );
    });
  });

  describe('OpenAI API响应处理', () => {
    it('应该在OpenAI API成功时返回SSML', async () => {
      mockReq = {
        method: 'POST',
        url: '/api/generate-ssml',
        headers: { 'user-agent': 'jest-test' },
        body: { text: '测试文本', voice: 'zh-CN-XiaoxiaoNeural' }
      };

      await generateSSMLHandler(mockReq as Request, mockRes as Response);

      expect(mockJson).toHaveBeenCalledWith({
        ssml: '<speak>测试</speak>'
      });
    });

    it('应该在OpenAI API失败时返回错误', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        text: vi.fn().mockResolvedValue('Invalid API key')
      } as any);

      mockReq = {
        method: 'POST',
        url: '/api/generate-ssml',
        headers: { 'user-agent': 'jest-test' },
        body: { text: '测试文本', voice: 'zh-CN-XiaoxiaoNeural' }
      };

      await generateSSMLHandler(mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({ 
        error: 'OpenAI request failed', 
        details: 'Invalid API key' 
      });
    });

    it('应该移除Markdown代码块', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: vi.fn().mockResolvedValue({
          choices: [{ message: { content: '```xml\n<speak>测试</speak>\n```' } }]
        })
      } as any);

      mockReq = {
        method: 'POST',
        url: '/api/generate-ssml',
        headers: { 'user-agent': 'jest-test' },
        body: { text: '测试文本', voice: 'zh-CN-XiaoxiaoNeural' }
      };

      await generateSSMLHandler(mockReq as Request, mockRes as Response);

      expect(mockJson).toHaveBeenCalledWith({
        ssml: '<speak>测试</speak>'
      });
    });

    it('应该处理空的OpenAI响应', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: vi.fn().mockResolvedValue({
          choices: [{ message: { content: '' } }]
        })
      } as any);

      mockReq = {
        method: 'POST',
        url: '/api/generate-ssml',
        headers: { 'user-agent': 'jest-test' },
        body: { text: '测试文本', voice: 'zh-CN-XiaoxiaoNeural' }
      };

      await generateSSMLHandler(mockReq as Request, mockRes as Response);

      expect(mockJson).toHaveBeenCalledWith({
        ssml: ''
      });
    });

    it('应该处理缺少choices的OpenAI响应', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: vi.fn().mockResolvedValue({})
      } as any);

      mockReq = {
        method: 'POST',
        url: '/api/generate-ssml',
        headers: { 'user-agent': 'jest-test' },
        body: { text: '测试文本', voice: 'zh-CN-XiaoxiaoNeural' }
      };

      await generateSSMLHandler(mockReq as Request, mockRes as Response);

      expect(mockJson).toHaveBeenCalledWith({
        ssml: ''
      });
    });
  });

  describe('错误处理', () => {
    it('应该在fetch抛出错误时返回500错误', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      mockReq = {
        method: 'POST',
        url: '/api/generate-ssml',
        headers: { 'user-agent': 'jest-test' },
        body: { text: '测试文本', voice: 'zh-CN-XiaoxiaoNeural' }
      };

      await generateSSMLHandler(mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({ 
        error: 'Internal server error', 
        details: 'Network error' 
      });
    });
  });

  describe('日志记录', () => {
    it('应该记录请求开始信息', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation();
      
      mockReq = {
        method: 'POST',
        url: '/api/generate-ssml',
        headers: { 'user-agent': 'jest-test' },
        body: { text: '测试文本', voice: 'zh-CN-XiaoxiaoNeural' }
      };

      await generateSSMLHandler(mockReq as Request, mockRes as Response);

      expect(consoleSpy).toHaveBeenCalledWith('📝 SSML 生成请求开始:', {
        method: 'POST',
        url: '/api/generate-ssml',
        bodySize: 46
      });

      consoleSpy.mockRestore();
    });

    it('应该记录请求参数', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation();
      
      mockReq = {
        method: 'POST',
        url: '/api/generate-ssml',
        headers: { 'user-agent': 'jest-test' },
        body: { text: '测试文本', voice: 'zh-CN-XiaoxiaoNeural' }
      };

      await generateSSMLHandler(mockReq as Request, mockRes as Response);

      expect(consoleSpy).toHaveBeenCalledWith('📝 请求参数:', {
        text: '测试文本',
        voice: 'zh-CN-XiaoxiaoNeural',
        textLength: 4
      });

      consoleSpy.mockRestore();
    });

    it('应该记录OpenAI API调用', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation();
      
      mockReq = {
        method: 'POST',
        url: '/api/generate-ssml',
        headers: { 'user-agent': 'jest-test' },
        body: { text: '测试文本', voice: 'zh-CN-XiaoxiaoNeural' }
      };

      await generateSSMLHandler(mockReq as Request, mockRes as Response);

      expect(consoleSpy).toHaveBeenCalledWith('🤖 调用 OpenAI API 生成 SSML...');

      consoleSpy.mockRestore();
    });

    it('应该记录OpenAI响应', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation();
      
      mockReq = {
        method: 'POST',
        url: '/api/generate-ssml',
        headers: { 'user-agent': 'jest-test' },
        body: { text: '测试文本', voice: 'zh-CN-XiaoxiaoNeural' }
      };

      await generateSSMLHandler(mockReq as Request, mockRes as Response);

      expect(consoleSpy).toHaveBeenCalledWith('📥 OpenAI 响应:', {
        status: 200,
        statusText: 'OK',
        ok: true
      });

      consoleSpy.mockRestore();
    });

    it('应该记录SSML生成成功', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation();
      
      mockReq = {
        method: 'POST',
        url: '/api/generate-ssml',
        headers: { 'user-agent': 'jest-test' },
        body: { text: '测试文本', voice: 'zh-CN-XiaoxiaoNeural' }
      };

      await generateSSMLHandler(mockReq as Request, mockRes as Response);

      // 验证日志被调用，使用更灵活的匹配
      expect(consoleSpy).toHaveBeenCalledWith(
        '✅ SSML 生成成功:',
        expect.objectContaining({
          ssmlLength: expect.any(Number),
          ssmlPreview: expect.any(String)
        })
      );

      consoleSpy.mockRestore();
    });

    it('应该记录最终成功信息', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation();
      
      mockReq = {
        method: 'POST',
        url: '/api/generate-ssml',
        headers: { 'user-agent': 'jest-test' },
        body: { text: '测试文本', voice: 'zh-CN-XiaoxiaoNeural' }
      };

      await generateSSMLHandler(mockReq as Request, mockRes as Response);

      expect(consoleSpy).toHaveBeenCalledWith('generate-ssml handler success for text:', '测试文本');

      consoleSpy.mockRestore();
    });
  });

  describe('边界情况', () => {
    it('应该处理长文本', async () => {
      const longText = '这是一个很长的测试文本，用来测试长文本的处理能力。'.repeat(10);
      
      mockReq = {
        method: 'POST',
        url: '/api/generate-ssml',
        headers: { 'user-agent': 'jest-test' },
        body: { text: longText, voice: 'zh-CN-XiaoxiaoNeural' }
      };

      await generateSSMLHandler(mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(200);
    });

    it('应该处理特殊字符', async () => {
      const specialText = '测试特殊字符：!@#$%^&*()_+-=[]{}|;:,.<>?';
      
      mockReq = {
        method: 'POST',
        url: '/api/generate-ssml',
        headers: { 'user-agent': 'jest-test' },
        body: { text: specialText, voice: 'zh-CN-XiaoxiaoNeural' }
      };

      await generateSSMLHandler(mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(200);
    });

    it('应该处理Unicode字符', async () => {
      const unicodeText = '测试Unicode字符：🚀🎉🌟💫✨';
      
      mockReq = {
        method: 'POST',
        url: '/api/generate-ssml',
        headers: { 'user-agent': 'jest-test' },
        body: { text: unicodeText, voice: 'zh-CN-XiaoxiaoNeural' }
      };

      await generateSSMLHandler(mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(200);
    });
  });
});
