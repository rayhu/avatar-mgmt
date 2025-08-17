import { debugLogger } from './debug-logger.js';
import { SSMLValidationResult } from './ssml-validator.js';

export interface DebugInfo {
  validation: SSMLValidationResult;
  tokenUsage?: any;
  model?: string;
  originalSSML: string;
  processingSteps: {
    markdownRemoved: boolean;
    originalLength: number;
    finalLength: number;
  };
}

export interface SSMLResponse {
  ssml: string;
  debugInfo?: DebugInfo;
  debugLogs?: any[];
}

/**
 * 响应构建器
 * 负责构建 HTTP 响应和调试信息
 */
export class ResponseBuilder {
  /**
   * 构建成功的 SSML 响应
   */
  buildSuccessResponse(
    ssml: string,
    validationResult: SSMLValidationResult,
    rawSSML: string,
    tokenUsage?: any,
    model?: string
  ): SSMLResponse {
    const response: SSMLResponse = { ssml };
    
    // 在调试模式下添加详细信息
    if (debugLogger.isDebugEnabled()) {
      response.debugInfo = {
        validation: validationResult,
        tokenUsage,
        model,
        originalSSML: rawSSML,
        processingSteps: {
          markdownRemoved: rawSSML.length !== ssml.length,
          originalLength: rawSSML.length,
          finalLength: ssml.length
        }
      };
      response.debugLogs = debugLogger.getLogsForResponse();
    } else {
      // 在非调试模式下，debugLogs 为空数组
      response.debugLogs = [];
    }

    return response;
  }

  /**
   * 构建错误响应
   */
  buildErrorResponse(
    error: string,
    details?: string,
    statusCode: number = 500
  ): { status: number; body: any } {
    const body: any = { error };
    
    if (details) {
      body.details = details;
    }
    
    // 始终添加 debugLogs 字段，在非调试模式下为空数组
    if (debugLogger.isDebugEnabled()) {
      body.debugLogs = debugLogger.getLogsForResponse();
    } else {
      body.debugLogs = [];
    }

    return {
      status: statusCode,
      body
    };
  }

  /**
   * 构建参数验证错误响应
   */
  buildValidationErrorResponse(
    error: string,
    details?: any
  ): { status: number; body: any } {
    return this.buildErrorResponse(error, details ? JSON.stringify(details) : undefined, 400);
  }

  /**
   * 构建方法不允许错误响应
   */
  buildMethodNotAllowedResponse(method: string): { status: number; body: any } {
    return this.buildErrorResponse('Method not allowed', `Method ${method} is not supported`, 405);
  }
}

// 导出单例实例
export const responseBuilder = new ResponseBuilder();
