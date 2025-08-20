interface DebugLog {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  module: string;
  message: string;
  data?: unknown;
}

class DebugLogger {
  private logs: DebugLog[] = [];
  private readonly isDebugMode: boolean;
  private readonly maxLogs = 100;

  constructor() {
    this.isDebugMode = process.env.DEBUG_MODE === 'true';
  }

  log(level: 'info' | 'warn' | 'error' | 'debug', module: string, message: string, data?: unknown) {
    const logEntry: DebugLog = {
      timestamp: new Date().toISOString(),
      level,
      module,
      message,
      data,
    };

    this.logs.push(logEntry);

    // 限制日志数量
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // 控制台输出
    const emoji = this.getLevelEmoji(level);
    console.log(`${emoji} [${module}] ${message}`, data ? JSON.stringify(data, null, 2) : '');
  }

  info(module: string, message: string, data?: unknown) {
    this.log('info', module, message, data);
  }

  warn(module: string, message: string, data?: unknown) {
    this.log('warn', module, message, data);
  }

  error(module: string, message: string, data?: unknown) {
    this.log('error', module, message, data);
  }

  debug(module: string, message: string, data?: unknown) {
    this.log('debug', module, message, data);
  }

  private getLevelEmoji(level: string): string {
    const emojis = {
      info: '📝',
      warn: '⚠️',
      error: '❌',
      debug: '🔍',
    };
    return emojis[level] || '📝';
  }

  /**
   * 获取所有日志
   */
  getLogs(): DebugLog[] {
    return [...this.logs];
  }

  /**
   * 清空日志
   */
  clearLogs(): void {
    this.logs = [];
  }

  /**
   * 获取特定级别的日志
   */
  getLogsByLevel(level: 'info' | 'warn' | 'error' | 'debug'): DebugLog[] {
    return this.logs.filter(log => log.level === level);
  }

  /**
   * 检查是否启用调试模式
   */
  isDebugEnabled(): boolean {
    return this.isDebugMode;
  }

  /**
   * 获取响应用的日志
   */
  getLogsForResponse(): string[] {
    return this.logs.map(log => `[${log.level.toUpperCase()}] ${log.message}`);
  }
}

// 导出实例和类型
export const debugLogger = new DebugLogger();
export type { DebugLog };
