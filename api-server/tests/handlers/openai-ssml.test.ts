import { Request, Response } from 'express';
import openaiSSMLHandler from '../../handlers/openai-ssml.js';

// 模拟所有依赖模块
jest.mock('../../utils/debug-logger.js');
jest.mock('../../utils/ssml-validator.js');
jest.mock('../../utils/openai-ssml-generator.js');
jest.mock('../../utils/response-builder.js');

import { debugLogger } from '../../utils/debug-logger.js';
import { ssmlValidator } from '../../utils/ssml-validator.js';
import { openaiSSMLGenerator } from '../../utils/openai-ssml-generator.js';
import { responseBuilder } from '../../utils/response-builder.js';

const mockDebugLogger = debugLogger as jest.Mocked<typeof debugLogger>;
const mockSSMLValidator = ssmlValidator as jest.Mocked<typeof ssmlValidator>;
const mockOpenAISSMLGenerator = openaiSSMLGenerator as jest.Mocked<typeof openaiSSMLGenerator>;
const mockResponseBuilder = responseBuilder as jest.Mocked<typeof responseBuilder>;

describe('OpenAI SSML Handler', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockStatus: jest.Mock;
  let mockJson: jest.Mock;

  beforeEach(() => {
    // 重置所有模拟
    jest.clearAllMocks();
    
    // 设置环境变量
    process.env.OPENAI_API_KEY = 'test-api-key';
    
    // 创建模拟的响应对象
    mockStatus = jest.fn().mockReturnThis();
    mockJson = jest.fn().mockReturnThis();
    
    mockRes = {
      status: mockStatus,
      json: mockJson
    };

    // 设置默认的模拟返回值
    mockDebugLogger.clearLogs.mockReturnValue(undefined);
    mockDebugLogger.info.mockReturnValue(undefined);
    mockDebugLogger.error.mockReturnValue(undefined);
    mockDebugLogger.isDebugEnabled.mockReturnValue(false);
    mockDebugLogger.getLogsForResponse.mockReturnValue([]);
    
    mockSSMLValidator.validate.mockReturnValue({
      isValid: true,
      errors: [],
      warnings: [],
      fixedSSML: undefined
    });

    mockOpenAISSMLGenerator.generateSSML.mockResolvedValue({
      ssml: '<speak>测试</speak>',
      rawSSML: '<speak>测试</speak>',
      tokenUsage: { total_tokens: 100 },
      model: 'gpt-4o'
    });

    mockResponseBuilder.buildSuccessResponse.mockReturnValue({
      ssml: '<speak>测试</speak>'
    });

    mockResponseBuilder.buildMethodNotAllowedResponse.mockReturnValue({
      status: 405,
      body: { error: 'Method not allowed' }
    });

    mockResponseBuilder.buildValidationErrorResponse.mockReturnValue({
      status: 400,
      body: { error: 'Validation error' }
    });

    mockResponseBuilder.buildErrorResponse.mockReturnValue({
      status: 500,
      body: { error: 'Internal error' }
    });
  });

  afterEach(() => {
    delete process.env.OPENAI_API_KEY;
  });

  describe('HTTP 方法验证', () => {
    it('应该拒绝非 POST 请求', async () => {
      mockReq = {
        method: 'GET',
        url: '/api/openai-ssml',
        headers: { 'user-agent': 'jest-test' },
        body: {}
      };

      await openaiSSMLHandler(mockReq as Request, mockRes as Response);

      expect(mockDebugLogger.error).toHaveBeenCalledWith('OPENAI-SSML', '方法不允许', { method: 'GET' });
      expect(mockResponseBuilder.buildMethodNotAllowedResponse).toHaveBeenCalledWith('GET');
      expect(mockStatus).toHaveBeenCalledWith(405);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Method not allowed' });
    });

    it('应该接受 POST 请求', async () => {
      mockReq = {
        method: 'POST',
        url: '/api/openai-ssml',
        headers: { 'user-agent': 'jest-test' },
        body: { text: '测试文本' }
      };

      await openaiSSMLHandler(mockReq as Request, mockRes as Response);

      expect(mockDebugLogger.error).not.toHaveBeenCalledWith('OPENAI-SSML', '方法不允许', expect.any(Object));
    });
  });

  describe('参数验证', () => {
    it('应该验证必需的 text 参数', async () => {
      mockReq = {
        method: 'POST',
        url: '/api/openai-ssml',
        headers: { 'user-agent': 'jest-test' },
        body: {}
      };

      await openaiSSMLHandler(mockReq as Request, mockRes as Response);

      expect(mockDebugLogger.error).toHaveBeenCalledWith('OPENAI-SSML', '文本参数无效', expect.any(Object));
      expect(mockResponseBuilder.buildValidationErrorResponse).toHaveBeenCalledWith('Parameter "text" is required.');
      expect(mockStatus).toHaveBeenCalledWith(400);
    });

    it('应该拒绝空的 text 参数', async () => {
      mockReq = {
        method: 'POST',
        url: '/api/openai-ssml',
        headers: { 'user-agent': 'jest-test' },
        body: { text: '' }
      };

      await openaiSSMLHandler(mockReq as Request, mockRes as Response);

      expect(mockDebugLogger.error).toHaveBeenCalledWith('OPENAI-SSML', '文本参数无效', expect.any(Object));
      expect(mockStatus).toHaveBeenCalledWith(400);
    });

    it('应该拒绝只有空格的 text 参数', async () => {
      mockReq = {
        method: 'POST',
        url: '/api/openai-ssml',
        headers: { 'user-agent': 'jest-test' },
        body: { text: '   ' }
      };

      await openaiSSMLHandler(mockReq as Request, mockRes as Response);

      expect(mockDebugLogger.error).toHaveBeenCalledWith('OPENAI-SSML', '文本参数无效', expect.any(Object));
      expect(mockStatus).toHaveBeenCalledWith(400);
    });

    it('应该接受有效的 text 参数', async () => {
      mockReq = {
        method: 'POST',
        url: '/api/openai-ssml',
        headers: { 'user-agent': 'jest-test' },
        body: { text: '有效的测试文本' }
      };

      await openaiSSMLHandler(mockReq as Request, mockRes as Response);

      expect(mockDebugLogger.error).not.toHaveBeenCalledWith('OPENAI-SSML', '文本参数无效', expect.any(Object));
    });
  });

  describe('环境变量验证', () => {
    it('应该验证 OpenAI API 密钥配置', async () => {
      delete process.env.OPENAI_API_KEY;

      mockReq = {
        method: 'POST',
        url: '/api/openai-ssml',
        headers: { 'user-agent': 'jest-test' },
        body: { text: '测试文本' }
      };

      await openaiSSMLHandler(mockReq as Request, mockRes as Response);

      expect(mockDebugLogger.error).toHaveBeenCalledWith('OPENAI-SSML', 'OpenAI API 密钥未配置');
      expect(mockResponseBuilder.buildErrorResponse).toHaveBeenCalledWith('OPENAI_API_KEY is not configured.');
      expect(mockStatus).toHaveBeenCalledWith(500);
    });
  });

  describe('SSML 生成流程', () => {
    beforeEach(() => {
      mockReq = {
        method: 'POST',
        url: '/api/openai-ssml',
        headers: { 'user-agent': 'jest-test' },
        body: { text: '测试文本', voice: 'zh-CN-XiaoxiaoNeural', model: 'gpt-4o' }
      };
    });

    it('应该成功生成 SSML', async () => {
      await openaiSSMLHandler(mockReq as Request, mockRes as Response);

      expect(mockOpenAISSMLGenerator.generateSSML).toHaveBeenCalledWith({
        text: '测试文本',
        voice: 'zh-CN-XiaoxiaoNeural',
        model: 'gpt-4o'
      });

      expect(mockSSMLValidator.validate).toHaveBeenCalledWith('<speak>测试</speak>');
      expect(mockResponseBuilder.buildSuccessResponse).toHaveBeenCalledWith(
        '<speak>测试</speak>',
        expect.any(Object),
        '<speak>测试</speak>',
        { total_tokens: 100 },
        'gpt-4o'
      );

      expect(mockStatus).toHaveBeenCalledWith(200);
    });

    it('应该使用默认参数', async () => {
      mockReq.body = { text: '测试文本' };

      await openaiSSMLHandler(mockReq as Request, mockRes as Response);

      expect(mockOpenAISSMLGenerator.generateSSML).toHaveBeenCalledWith({
        text: '测试文本',
        voice: 'zh-CN-XiaoxiaoNeural', // 默认值
        model: 'gpt-4o' // 默认值
      });
    });

    it('应该记录生成成功日志', async () => {
      await openaiSSMLHandler(mockReq as Request, mockRes as Response);

      // 验证记录了成功日志，但具体内容可能因实现而异
      expect(mockDebugLogger.info).toHaveBeenCalledWith('OPENAI-SSML', 'SSML 生成成功', expect.any(Object));
    });

    it('应该记录验证结果', async () => {
      await openaiSSMLHandler(mockReq as Request, mockRes as Response);

      expect(mockDebugLogger.info).toHaveBeenCalledWith('OPENAI-SSML', 'SSML 验证结果', expect.objectContaining({
        isValid: true,
        errorsCount: 0,
        warningsCount: 0
      }));
    });
  });

  describe('SSML 验证', () => {
    beforeEach(() => {
      mockReq = {
        method: 'POST',
        url: '/api/openai-ssml',
        headers: { 'user-agent': 'jest-test' },
        body: { text: '测试文本' }
      };
    });

    it('应该验证生成的 SSML', async () => {
      await openaiSSMLHandler(mockReq as Request, mockRes as Response);

      expect(mockSSMLValidator.validate).toHaveBeenCalledWith('<speak>测试</speak>');
    });

    it('应该处理验证警告', async () => {
      mockSSMLValidator.validate.mockReturnValue({
        isValid: true,
        errors: [],
        warnings: ['警告1', '警告2'],
        fixedSSML: undefined
      });

      await openaiSSMLHandler(mockReq as Request, mockRes as Response);

      expect(mockDebugLogger.info).toHaveBeenCalledWith('OPENAI-SSML', 'SSML 验证结果', expect.objectContaining({
        warningsCount: 2
      }));
    });

    it('应该处理验证错误', async () => {
      mockSSMLValidator.validate.mockReturnValue({
        isValid: false,
        errors: ['错误1', '错误2'],
        warnings: [],
        fixedSSML: undefined
      });

      await openaiSSMLHandler(mockReq as Request, mockRes as Response);

      expect(mockDebugLogger.info).toHaveBeenCalledWith('OPENAI-SSML', 'SSML 验证结果', expect.objectContaining({
        isValid: false,
        errorsCount: 2
      }));
    });
  });

  describe('错误处理', () => {
    beforeEach(() => {
      mockReq = {
        method: 'POST',
        url: '/api/openai-ssml',
        headers: { 'user-agent': 'jest-test' },
        body: { text: '测试文本' }
      };
    });

    it('应该处理 SSML 生成错误', async () => {
      const error = new Error('OpenAI API 错误');
      mockOpenAISSMLGenerator.generateSSML.mockRejectedValue(error);

      await openaiSSMLHandler(mockReq as Request, mockRes as Response);

      expect(mockDebugLogger.error).toHaveBeenCalledWith('OPENAI-SSML', 'Handler 内部错误', expect.objectContaining({
        error: 'OpenAI API 错误',
        errorType: 'Error'
      }));

      expect(mockResponseBuilder.buildErrorResponse).toHaveBeenCalledWith(
        'Internal server error',
        'OpenAI API 错误'
      );

      expect(mockStatus).toHaveBeenCalledWith(500);
    });

    it('应该处理验证错误', async () => {
      const error = new Error('验证错误');
      mockSSMLValidator.validate.mockImplementation(() => {
        throw error;
      });

      await openaiSSMLHandler(mockReq as Request, mockRes as Response);

      expect(mockDebugLogger.error).toHaveBeenCalledWith('OPENAI-SSML', 'Handler 内部错误', expect.any(Object));
      expect(mockStatus).toHaveBeenCalledWith(500);
    });
  });

  describe('调试模式', () => {
    beforeEach(() => {
      mockReq = {
        method: 'POST',
        url: '/api/openai-ssml',
        headers: { 'user-agent': 'jest-test' },
        body: { text: '测试文本' }
      };
    });

    it('应该在调试模式下记录详细日志', async () => {
      mockDebugLogger.isDebugEnabled.mockReturnValue(true);

      await openaiSSMLHandler(mockReq as Request, mockRes as Response);

      expect(mockDebugLogger.info).toHaveBeenCalledWith('OPENAI-SSML', '请求开始', expect.objectContaining({
        debugMode: true
      }));
    });

    it('应该在非调试模式下不记录详细日志', async () => {
      mockDebugLogger.isDebugEnabled.mockReturnValue(false);

      await openaiSSMLHandler(mockReq as Request, mockRes as Response);

      expect(mockDebugLogger.info).toHaveBeenCalledWith('OPENAI-SSML', '请求开始', expect.objectContaining({
        debugMode: false
      }));
    });
  });

  describe('边界情况', () => {
    it('应该处理非常长的文本', async () => {
      const longText = '测试'.repeat(1000);
      mockReq = {
        method: 'POST',
        url: '/api/openai-ssml',
        headers: { 'user-agent': 'jest-test' },
        body: { text: longText }
      };

      await openaiSSMLHandler(mockReq as Request, mockRes as Response);

      expect(mockOpenAISSMLGenerator.generateSSML).toHaveBeenCalledWith({
        text: longText,
        voice: 'zh-CN-XiaoxiaoNeural',
        model: 'gpt-4o'
      });
    });

    it('应该处理包含特殊字符的文本', async () => {
      const specialText = '测试文本包含特殊字符: !@#$%^&*()_+-=[]{}|;:,.<>?';
      mockReq = {
        method: 'POST',
        url: '/api/openai-ssml',
        headers: { 'user-agent': 'jest-test' },
        body: { text: specialText }
      };

      await openaiSSMLHandler(mockReq as Request, mockRes as Response);

      expect(mockOpenAISSMLGenerator.generateSSML).toHaveBeenCalledWith({
        text: specialText,
        voice: 'zh-CN-XiaoxiaoNeural',
        model: 'gpt-4o'
      });
    });

    it('应该处理空的请求体', async () => {
      mockReq = {
        method: 'POST',
        url: '/api/openai-ssml',
        headers: { 'user-agent': 'jest-test' },
        body: undefined
      };

      await openaiSSMLHandler(mockReq as Request, mockRes as Response);

      // 空的请求体会导致解构错误，应该记录内部错误
      expect(mockDebugLogger.error).toHaveBeenCalledWith('OPENAI-SSML', 'Handler 内部错误', expect.any(Object));
      expect(mockStatus).toHaveBeenCalledWith(500);
    });
  });
});
