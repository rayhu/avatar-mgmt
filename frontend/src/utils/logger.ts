/**
 * 前端统一日志工具
 * 支持开发和生产环境的不同日志级别
 */

export interface LogContext {
  component?: string;
  method?: string;
  url?: string;
  data?: any;
  error?: any;
  duration?: number;
  [key: string]: any;
}

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4
}

class Logger {
  private level: LogLevel;
  private isDevelopment: boolean;

  constructor() {
    this.isDevelopment = import.meta.env.DEV;
    // 开发环境显示所有日志，生产环境只显示 WARN 和 ERROR
    this.level = this.isDevelopment ? LogLevel.DEBUG : LogLevel.WARN;
  }

  private formatMessage(level: string, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const component = context?.component ? `[${context.component}]` : '';
    const contextStr = context ? ` | ${JSON.stringify(context, null, 2)}` : '';
    return `[${timestamp}] ${level} ${component} ${message}${contextStr}`;
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.level;
  }

  debug(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.log(this.formatMessage('DEBUG', message, context));
    }
  }

  info(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.INFO)) {
      console.log(this.formatMessage('INFO', message, context));
    }
  }

  warn(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(this.formatMessage('WARN', message, context));
    }
  }

  error(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      console.error(this.formatMessage('ERROR', message, context));
    }
  }

  // 组件专用日志方法
  component(componentName: string, message: string, context?: LogContext): void {
    this.info(message, { component: componentName, ...context });
  }

  componentDebug(componentName: string, message: string, context?: LogContext): void {
    this.debug(message, { component: componentName, ...context });
  }

  componentError(componentName: string, message: string, context?: LogContext): void {
    this.error(message, { component: componentName, ...context });
  }

  // API 调用日志
  apiCall(apiName: string, url: string, context?: LogContext): void {
    this.info(`🌐 ${apiName} API 调用`, {
      component: 'API',
      method: 'API_CALL',
      url,
      ...context
    });
  }

  apiResponse(apiName: string, status: number, context?: LogContext): void {
    const level = status >= 400 ? 'error' : 'info';
    const message = `📥 ${apiName} API 响应`;
    const logContext = {
      component: 'API',
      method: 'API_RESPONSE',
      status,
      ...context
    };

    if (level === 'error') {
      this.error(message, logContext);
    } else {
      this.info(message, logContext);
    }
  }

  apiError(apiName: string, error: any, context?: LogContext): void {
    this.error(`❌ ${apiName} API 错误`, {
      component: 'API',
      method: 'API_ERROR',
      error: error.message,
      errorType: error.constructor.name,
      stack: error.stack,
      ...context
    });
  }

  // 用户交互日志
  userAction(action: string, context?: LogContext): void {
    this.info(`👤 用户操作: ${action}`, {
      component: 'USER',
      method: 'USER_ACTION',
      ...context
    });
  }

  // 性能日志
  performance(operation: string, duration: number, context?: LogContext): void {
    this.info(`⚡ 性能: ${operation}`, {
      component: 'PERFORMANCE',
      method: 'PERFORMANCE',
      duration,
      ...context
    });
  }

  // 路由日志
  route(from: string, to: string, context?: LogContext): void {
    this.info(`🛣️ 路由跳转: ${from} → ${to}`, {
      component: 'ROUTER',
      method: 'ROUTE_CHANGE',
      from,
      to,
      ...context
    });
  }

  // 状态管理日志
  store(action: string, state: any, context?: LogContext): void {
    this.debug(`📦 Store 更新: ${action}`, {
      component: 'STORE',
      method: 'STORE_UPDATE',
      action,
      state,
      ...context
    });
  }

  // 设置日志级别
  setLevel(level: LogLevel): void {
    this.level = level;
  }

  // 获取当前日志级别
  getLevel(): LogLevel {
    return this.level;
  }

  // 检查是否为开发环境
  isDev(): boolean {
    return this.isDevelopment;
  }
}

// 创建全局日志实例
export const logger = new Logger();

// 导出便捷函数
export const log = logger;

// 导出类型
export type { LogContext }; 
