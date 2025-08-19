import type { Request, Response } from 'express';
import { debugLogger } from '../utils/debug-logger.js';
import { ssmlValidator } from '../utils/ssml-validator.js';
import { openaiSSMLGenerator } from '../utils/openai-ssml-generator.js';
import { responseBuilder } from '../utils/response-builder.js';

// POST /api/openai-ssml
// Body: { text: string; voice?: string; model?: string }
// Returns: { ssml: string }

export default async function handler(req: Request, res: Response) {
  debugLogger.clearLogs();
  debugLogger.info('OPENAI-SSML', '请求开始', {
    method: req.method,
    url: req.url,
    userAgent: req.headers['user-agent'],
    contentLength: req.headers['content-length'],
    bodySize: req.body ? JSON.stringify(req.body).length : 0,
    debugMode: debugLogger.isDebugEnabled()
  });

  if (req.method !== 'POST') {
    debugLogger.error('OPENAI-SSML', '方法不允许', { method: req.method });
    const errorResponse = responseBuilder.buildMethodNotAllowedResponse(req.method);
    return res.status(errorResponse.status).json(errorResponse.body);
  }

  try {
    const { text, voice = 'zh-CN-XiaoxiaoNeural', model = 'gpt-4o' } = req.body as {
      text?: string;
      voice?: string;
      model?: string;
    };

    debugLogger.info('OPENAI-SSML', '请求参数解析', {
      text: text?.slice(0, 100) + (text && text.length > 100 ? '...' : ''),
      voice,
      model,
      textLength: text?.length || 0,
      hasText: !!text
    });

    // 验证必需参数
    if (!text || typeof text !== 'string' || !text.trim()) {
      debugLogger.error('OPENAI-SSML', '文本参数无效', { 
        text, 
        type: typeof text,
        isEmpty: !text?.trim() 
      });
      const errorResponse = responseBuilder.buildValidationErrorResponse('Parameter "text" is required.');
      return res.status(errorResponse.status).json(errorResponse.body);
    }

    // 验证 OpenAI API 密钥
    if (!process.env.OPENAI_API_KEY) {
      debugLogger.error('OPENAI-SSML', 'OpenAI API 密钥未配置');
      const errorResponse = responseBuilder.buildErrorResponse('OPENAI_API_KEY is not configured.');
      return res.status(errorResponse.status).json(errorResponse.body);
    }

    debugLogger.info('OPENAI-SSML', '准备调用 OpenAI API 生成 SSML');

    // 生成 SSML
    const generationResult = await openaiSSMLGenerator.generateSSML({
      text: text.trim(),
      voice,
      model
    });

    debugLogger.info('OPENAI-SSML', 'SSML 生成成功', {
      ssmlLength: generationResult.ssml.length,
      model: generationResult.model,
      voice,
      inputTextLength: text.length,
      tokensUsed: generationResult.tokenUsage?.total_tokens || 'unknown',
      processingComplete: true
    });

    // 验证生成的 SSML
    const validationResult = ssmlValidator.validate(generationResult.ssml);
    debugLogger.info('OPENAI-SSML', 'SSML 验证结果', {
      isValid: validationResult.isValid,
      errorsCount: validationResult.errors.length,
      warningsCount: validationResult.warnings.length,
      errors: validationResult.errors,
      warnings: validationResult.warnings
    });

    // 构建响应
    const response = responseBuilder.buildSuccessResponse(
      generationResult.ssml,
      validationResult,
      generationResult.rawSSML,
      generationResult.tokenUsage,
      generationResult.model
    );

    return res.status(200).json(response);

  } catch (error: any) {
    debugLogger.error('OPENAI-SSML', 'Handler 内部错误', {
      error: error.message,
      errorType: error.constructor.name,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    
    const errorResponse = responseBuilder.buildErrorResponse(
      'Internal server error',
      error.message
    );
    
    return res.status(errorResponse.status).json(errorResponse.body);
  }
} 
