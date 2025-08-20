/**
 * 统一的日志工具函数
 * 提供一致的日志格式和颜色
 */

export interface LogContext {
  method?: string;
  url?: string;
  headers?: Record<string, string | string[] | undefined>;
  bodySize?: number;
  query?: Record<string, unknown>; // 放宽类型约束，与 RequestInfo 保持一致
  [key: string]: unknown;
}

export interface RequestInfo {
  method: string;
  url: string;
  body?: unknown;
  query?: Record<string, unknown>; // 放宽类型约束，允许任何类型的查询参数
}

export interface ErrorInfo {
  message?: string;
  constructor?: { name: string };
  stack?: string;
}

export class Logger {
  private static formatMessage(level: string, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` | ${JSON.stringify(context)}` : '';
    return `[${timestamp}] ${level} ${message}${contextStr}`;
  }

  static info(message: string, context?: LogContext): void {
    console.log(this.formatMessage('INFO', message, context));
  }

  static warn(message: string, context?: LogContext): void {
    console.warn(this.formatMessage('WARN', message, context));
  }

  static error(message: string, context?: LogContext): void {
    console.error(this.formatMessage('ERROR', message, context));
  }

  static debug(message: string, context?: LogContext): void {
    if (process.env.NODE_ENV === 'development') {
      console.log(this.formatMessage('DEBUG', message, context));
    }
  }

  // 特定于 handler 的日志方法
  static handlerStart(handlerName: string, req: RequestInfo): void {
    this.info(`${handlerName} 请求开始`, {
      method: req.method,
      url: req.url,
      bodySize: req.body ? JSON.stringify(req.body).length : 0,
      query: req.query,
    });
  }

  static handlerSuccess(handlerName: string, context?: LogContext): void {
    this.info(`${handlerName} 处理成功`, context);
  }

  static handlerError(handlerName: string, error: ErrorInfo, context?: LogContext): void {
    this.error(`${handlerName} 处理失败`, {
      error: error.message,
      errorType: error.constructor?.name || 'Unknown',
      stack: error.stack,
      ...context,
    });
  }

  // API 调用日志
  static apiCall(apiName: string, url: string, context?: LogContext): void {
    this.info(`${apiName} API 调用`, {
      url,
      ...context,
    });
  }

  static apiResponse(apiName: string, status: number, context?: LogContext): void {
    const level = status >= 400 ? 'error' : 'info';
    const message = `${apiName} API 响应`;
    const logContext = {
      status,
      ...context,
    };

    if (level === 'error') {
      this.error(message, logContext);
    } else {
      this.info(message, logContext);
    }
  }
}

// 导出便捷函数
export const log = Logger;
