import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Request, Response } from 'express';
import azureTTSHandler from '../../handlers/azure-tts.js';

// 模拟所有依赖模块
vi.mock('../../utils/debug-logger.js');
vi.mock('../../utils/ssml-validator.js');

import { debugLogger } from '../../utils/debug-logger.js';
import { ssmlValidator } from '../../utils/ssml-validator.js';

const mockDebugLogger = debugLogger as any;
const mockSSMLValidator = ssmlValidator as any;

// 模拟 fetch
global.fetch = vi.fn();

describe('Azure TTS Handler', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockStatus: any;
  let mockJson: any;
  let mockSend: any;
  let mockSetHeader: any;
  let mockFetch: any;

  beforeEach(() => {
    // 重置所有模拟
    vi.clearAllMocks();

    // 设置环境变量
    process.env.AZURE_SPEECH_KEY = 'test-azure-key';
    process.env.AZURE_SPEECH_REGION = 'eastus';

    // 创建模拟的响应对象
    mockStatus = vi.fn().mockReturnThis();
    mockJson = vi.fn().mockReturnThis();
    mockSend = vi.fn().mockReturnThis();
    mockSetHeader = vi.fn().mockReturnThis();

    mockRes = {
      status: mockStatus,
      json: mockJson,
      send: mockSend,
      setHeader: mockSetHeader,
    };

    // 设置默认的模拟返回值
    mockDebugLogger.clearLogs.mockReturnValue(undefined);
    mockDebugLogger.info.mockReturnValue(undefined);
    mockDebugLogger.error.mockReturnValue(undefined);
    mockDebugLogger.warn.mockReturnValue(undefined);
    mockDebugLogger.debug.mockReturnValue(undefined);
    mockDebugLogger.isDebugEnabled.mockReturnValue(false);
    mockDebugLogger.getLogsForResponse.mockReturnValue([]);

    mockSSMLValidator.validate.mockReturnValue({
      isValid: true,
      errors: [],
      warnings: [],
      fixedSSML: undefined,
    });

    // 设置默认的fetch模拟
    mockFetch = global.fetch as any;
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      headers: new Map([
        ['content-type', 'audio/mpeg'],
        ['content-length', '1024'],
      ]),
      arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(1024)),
    } as any);
  });

  afterEach(() => {
    delete process.env.AZURE_SPEECH_KEY;
    delete process.env.AZURE_SPEECH_REGION;
  });

  describe('HTTP方法验证', () => {
    it('应该拒绝非POST请求', async () => {
      mockReq = {
        method: 'GET',
        url: '/api/azure-tts',
        headers: { 'user-agent': 'jest-test' },
        body: {},
      };

      await azureTTSHandler(mockReq as Request, mockRes as Response);

      expect(mockDebugLogger.error).toHaveBeenCalledWith('AZURE-TTS', '方法不允许', {
        method: 'GET',
      });
      expect(mockStatus).toHaveBeenCalledWith(405);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'Method not allowed',
        debugLogs: [],
      });
    });

    it('应该接受POST请求', async () => {
      mockReq = {
        method: 'POST',
        url: '/api/azure-tts',
        headers: { 'user-agent': 'jest-test' },
        body: { ssml: '<speak>测试</speak>' },
      };

      await azureTTSHandler(mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(200);
    });
  });

  describe('参数验证', () => {
    it('应该在SSML缺失时返回400错误', async () => {
      mockReq = {
        method: 'POST',
        url: '/api/azure-tts',
        headers: { 'user-agent': 'jest-test' },
        body: {},
      };

      await azureTTSHandler(mockReq as Request, mockRes as Response);

      expect(mockDebugLogger.error).toHaveBeenCalledWith('AZURE-TTS', 'SSML 参数无效', {
        ssml: undefined,
        type: 'undefined',
        isEmpty: true,
      });
      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'Parameter "ssml" is required.',
        debugLogs: [],
      });
    });

    it('应该在SSML为空字符串时返回400错误', async () => {
      mockReq = {
        method: 'POST',
        url: '/api/azure-tts',
        headers: { 'user-agent': 'jest-test' },
        body: { ssml: '' },
      };

      await azureTTSHandler(mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'Parameter "ssml" is required.',
        debugLogs: [],
      });
    });

    it('应该在SSML为空白字符串时返回400错误', async () => {
      mockReq = {
        method: 'POST',
        url: '/api/azure-tts',
        headers: { 'user-agent': 'jest-test' },
        body: { ssml: '   ' },
      };

      await azureTTSHandler(mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'Parameter "ssml" is required.',
        debugLogs: [],
      });
    });

    it('应该在SSML为非字符串时返回400错误', async () => {
      // 确保环境变量已设置
      process.env.AZURE_SPEECH_KEY = 'test-azure-key';
      process.env.AZURE_SPEECH_REGION = 'eastus';

      mockReq = {
        method: 'POST',
        url: '/api/azure-tts',
        headers: { 'user-agent': 'jest-test' },
        body: { ssml: 123 },
      };

      await azureTTSHandler(mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'Parameter "ssml" is required.',
        debugLogs: [],
      });

      // 验证SSML验证器没有被调用，因为参数验证应该提前返回
      expect(mockSSMLValidator.validate).not.toHaveBeenCalled();
    });

    it('应该接受有效的SSML', async () => {
      mockReq = {
        method: 'POST',
        url: '/api/azure-tts',
        headers: { 'user-agent': 'jest-test' },
        body: { ssml: '<speak>测试</speak>' },
      };

      await azureTTSHandler(mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(200);
    });
  });

  describe('SSML验证', () => {
    it('应该在SSML验证失败时返回400错误', async () => {
      mockSSMLValidator.validate.mockReturnValue({
        isValid: false,
        errors: ['Invalid SSML format'],
        warnings: [],
        fixedSSML: undefined,
      });

      mockReq = {
        method: 'POST',
        url: '/api/azure-tts',
        headers: { 'user-agent': 'jest-test' },
        body: { ssml: '<speak>测试</speak>' },
      };

      await azureTTSHandler(mockReq as Request, mockRes as Response);

      expect(mockDebugLogger.error).toHaveBeenCalledWith('AZURE-TTS', 'SSML 验证失败', {
        errors: ['Invalid SSML format'],
        warnings: [],
        ssml: '<speak>测试</speak>',
      });
      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'Invalid SSML format',
        details: ['Invalid SSML format'],
        warnings: [],
        debugLogs: [],
      });
    });

    it('应该处理SSML验证警告', async () => {
      mockSSMLValidator.validate.mockReturnValue({
        isValid: true,
        errors: [],
        warnings: ['Minor warning'],
        fixedSSML: undefined,
      });

      mockReq = {
        method: 'POST',
        url: '/api/azure-tts',
        headers: { 'user-agent': 'jest-test' },
        body: { ssml: '<speak>测试</speak>' },
      };

      await azureTTSHandler(mockReq as Request, mockRes as Response);

      expect(mockDebugLogger.warn).toHaveBeenCalledWith('AZURE-TTS', 'SSML 验证警告', {
        warnings: ['Minor warning'],
      });
      expect(mockStatus).toHaveBeenCalledWith(200);
    });
  });

  describe('Azure凭据验证', () => {
    it('应该在Azure密钥缺失时返回500错误', async () => {
      delete process.env.AZURE_SPEECH_KEY;

      mockReq = {
        method: 'POST',
        url: '/api/azure-tts',
        headers: { 'user-agent': 'jest-test' },
        body: { ssml: '<speak>测试</speak>' },
      };

      await azureTTSHandler(mockReq as Request, mockRes as Response);

      expect(mockDebugLogger.error).toHaveBeenCalledWith('AZURE-TTS', 'Azure 凭据未配置', {
        hasKey: false,
        hasRegion: true,
        keyLength: 0,
      });
      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'Azure Speech credentials are not configured.',
        debugLogs: [],
      });
    });

    it('应该在Azure区域缺失时返回500错误', async () => {
      delete process.env.AZURE_SPEECH_REGION;

      mockReq = {
        method: 'POST',
        url: '/api/azure-tts',
        headers: { 'user-agent': 'jest-test' },
        body: { ssml: '<speak>测试</speak>' },
      };

      await azureTTSHandler(mockReq as Request, mockRes as Response);

      expect(mockDebugLogger.error).toHaveBeenCalledWith('AZURE-TTS', 'Azure 凭据未配置', {
        hasKey: true,
        hasRegion: false,
        keyLength: 14,
      });
      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'Azure Speech credentials are not configured.',
        debugLogs: [],
      });
    });
  });

  describe('Azure API调用', () => {
    it('应该使用正确的Azure API端点', async () => {
      mockReq = {
        method: 'POST',
        url: '/api/azure-tts',
        headers: { 'user-agent': 'jest-test' },
        body: { ssml: '<speak>测试</speak>' },
      };

      await azureTTSHandler(mockReq as Request, mockRes as Response);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://eastus.tts.speech.microsoft.com/cognitiveservices/v1',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Ocp-Apim-Subscription-Key': 'test-azure-key',
            'Content-Type': 'application/ssml+xml',
            'X-MICROSOFT-OUTPUTFORMAT': 'audio-24khz-48kbitrate-mono-mp3',
            'User-Agent': 'avatar-mgmt-v1',
          }),
          body: '<speak>测试</speak>',
        })
      );
    });

    it('应该使用默认语音', async () => {
      mockReq = {
        method: 'POST',
        url: '/api/azure-tts',
        headers: { 'user-agent': 'jest-test' },
        body: { ssml: '<speak>测试</speak>' },
      };

      await azureTTSHandler(mockReq as Request, mockRes as Response);

      expect(mockDebugLogger.info).toHaveBeenCalledWith('AZURE-TTS', '请求参数解析', {
        voice: 'zh-CN-XiaoxiaoNeural',
        ssmlLength: 17,
        ssmlPreview: '<speak>测试</speak>',
        hasSSML: true,
      });
    });

    it('应该使用自定义语音', async () => {
      mockReq = {
        method: 'POST',
        url: '/api/azure-tts',
        headers: { 'user-agent': 'jest-test' },
        body: { ssml: '<speak>测试</speak>', voice: 'en-US-JennyNeural' },
      };

      await azureTTSHandler(mockReq as Request, mockRes as Response);

      expect(mockDebugLogger.info).toHaveBeenCalledWith('AZURE-TTS', '请求参数解析', {
        voice: 'en-US-JennyNeural',
        ssmlLength: 17,
        ssmlPreview: '<speak>测试</speak>',
        hasSSML: true,
      });
    });
  });

  describe('Azure API响应处理', () => {
    it('应该在Azure API成功时返回音频数据', async () => {
      const audioBuffer = new ArrayBuffer(2048);
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Map([
          ['content-type', 'audio/mpeg'],
          ['content-length', '2048'],
        ]),
        arrayBuffer: vi.fn().mockResolvedValue(audioBuffer),
      } as any);

      mockReq = {
        method: 'POST',
        url: '/api/azure-tts',
        headers: { 'user-agent': 'jest-test' },
        body: { ssml: '<speak>测试</speak>' },
      };

      await azureTTSHandler(mockReq as Request, mockRes as Response);

      expect(mockSetHeader).toHaveBeenCalledWith('Content-Type', 'audio/mpeg');
      expect(mockSetHeader).toHaveBeenCalledWith('Content-Length', '2048');
      expect(mockSetHeader).toHaveBeenCalledWith('Cache-Control', 'public, max-age=3600');
      expect(mockSend).toHaveBeenCalledWith(Buffer.from(audioBuffer));
    });

    it('应该在Azure API失败时返回错误', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        headers: new Map(),
        text: vi.fn().mockResolvedValue('Invalid SSML'),
      } as any);

      mockReq = {
        method: 'POST',
        url: '/api/azure-tts',
        headers: { 'user-agent': 'jest-test' },
        body: { ssml: '<speak>测试</speak>' },
      };

      await azureTTSHandler(mockReq as Request, mockRes as Response);

      expect(mockDebugLogger.error).toHaveBeenCalledWith('AZURE-TTS', 'Azure TTS API 请求失败', {
        status: 400,
        statusText: 'Bad Request',
        errorBody: 'Invalid SSML',
        headers: {},
        requestSSML: '<speak>测试</speak>',
        voice: 'zh-CN-XiaoxiaoNeural',
      });
      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'Azure TTS request failed',
        details: 'Invalid SSML',
        requestInfo: {
          voice: 'zh-CN-XiaoxiaoNeural',
          ssmlLength: 17,
          region: 'eastus',
        },
        debugLogs: [],
      });
    });

    it('应该处理Azure API的JSON错误响应', async () => {
      const errorResponse = { error: { code: 'InvalidSSML', message: 'Invalid SSML format' } };
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        headers: new Map(),
        text: vi.fn().mockResolvedValue(JSON.stringify(errorResponse)),
      } as any);

      mockReq = {
        method: 'POST',
        url: '/api/azure-tts',
        headers: { 'user-agent': 'jest-test' },
        body: { ssml: '<speak>测试</speak>' },
      };

      await azureTTSHandler(mockReq as Request, mockRes as Response);

      expect(mockJson).toHaveBeenCalledWith({
        error: 'Azure TTS request failed',
        details: errorResponse,
        requestInfo: {
          voice: 'zh-CN-XiaoxiaoNeural',
          ssmlLength: 17,
          region: 'eastus',
        },
        debugLogs: [],
      });
    });
  });

  describe('调试模式', () => {
    it('应该在调试模式下添加调试响应头', async () => {
      mockDebugLogger.isDebugEnabled.mockReturnValue(true);

      mockReq = {
        method: 'POST',
        url: '/api/azure-tts',
        headers: { 'user-agent': 'jest-test' },
        body: { ssml: '<speak>测试</speak>' },
      };

      await azureTTSHandler(mockReq as Request, mockRes as Response);

      expect(mockSetHeader).toHaveBeenCalledWith(
        'X-Debug-Info',
        JSON.stringify({
          ssmlLength: 17,
          voice: 'zh-CN-XiaoxiaoNeural',
          region: 'eastus',
          audioSize: 1024,
        })
      );
    });

    it('应该在非调试模式下不添加调试响应头', async () => {
      mockDebugLogger.isDebugEnabled.mockReturnValue(false);

      mockReq = {
        method: 'POST',
        url: '/api/azure-tts',
        headers: { 'user-agent': 'jest-test' },
        body: { ssml: '<speak>测试</speak>' },
      };

      await azureTTSHandler(mockReq as Request, mockRes as Response);

      expect(mockSetHeader).not.toHaveBeenCalledWith('X-Debug-Info', expect.any(String));
    });
  });

  describe('错误处理', () => {
    it('应该在fetch抛出错误时返回500错误', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      mockReq = {
        method: 'POST',
        url: '/api/azure-tts',
        headers: { 'user-agent': 'jest-test' },
        body: { ssml: '<speak>测试</speak>' },
      };

      await azureTTSHandler(mockReq as Request, mockRes as Response);

      expect(mockDebugLogger.error).toHaveBeenCalledWith('AZURE-TTS', 'Handler 内部错误', {
        error: 'Network error',
        errorType: 'Error',
        stack: expect.any(String),
        timestamp: expect.any(String),
      });
      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'Internal server error',
        details: 'Network error',
        timestamp: expect.any(String),
        debugLogs: [],
      });
    });
  });

  describe('日志记录', () => {
    it('应该记录请求开始信息', async () => {
      mockReq = {
        method: 'POST',
        url: '/api/azure-tts',
        headers: { 'user-agent': 'jest-test', 'content-length': '100' },
        body: { ssml: '<speak>测试</speak>' },
      };

      await azureTTSHandler(mockReq as Request, mockRes as Response);

      expect(mockDebugLogger.info).toHaveBeenCalledWith('AZURE-TTS', '请求开始', {
        method: 'POST',
        url: '/api/azure-tts',
        userAgent: 'jest-test',
        contentLength: '100',
        bodySize: 28, // 实际计算的值：{"ssml":"<speak>测试</speak>"} 的长度
        debugMode: false,
      });
    });

    it('应该记录Azure API调用信息', async () => {
      mockReq = {
        method: 'POST',
        url: '/api/azure-tts',
        headers: { 'user-agent': 'jest-test' },
        body: { ssml: '<speak>测试</speak>' },
      };

      await azureTTSHandler(mockReq as Request, mockRes as Response);

      expect(mockDebugLogger.info).toHaveBeenCalledWith('AZURE-TTS', '准备调用 Azure TTS API', {
        region: 'eastus',
        voice: 'zh-CN-XiaoxiaoNeural',
        keyLength: 14,
        ssmlLength: 17,
        endpoint: 'https://eastus.tts.speech.microsoft.com/cognitiveservices/v1',
      });
    });

    it('应该记录音频生成成功信息', async () => {
      mockReq = {
        method: 'POST',
        url: '/api/azure-tts',
        headers: { 'user-agent': 'jest-test' },
        body: { ssml: '<speak>测试</speak>' },
      };

      await azureTTSHandler(mockReq as Request, mockRes as Response);

      expect(mockDebugLogger.info).toHaveBeenCalledWith('AZURE-TTS', '音频生成成功', {
        bufferSize: 1024,
        audioSizeKB: '1.00',
        audioSizeMB: '0.001',
        contentType: 'audio/mpeg',
        durationEstimate: '~0.1s',
      });
    });

    it('应该记录请求处理完成信息', async () => {
      mockReq = {
        method: 'POST',
        url: '/api/azure-tts',
        headers: { 'user-agent': 'jest-test' },
        body: { ssml: '<speak>测试</speak>' },
      };

      await azureTTSHandler(mockReq as Request, mockRes as Response);

      expect(mockDebugLogger.info).toHaveBeenCalledWith('AZURE-TTS', '请求处理完成', {
        success: true,
        responseSize: 1024,
        processingComplete: true,
      });
    });
  });
});
