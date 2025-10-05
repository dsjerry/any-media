/**
 * 日志服务 - 提供统一的日志记录功能
 */

// 日志级别
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error'
}

// 日志条目接口
export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  message: string;
  data?: any;
  source?: string;
}

// 日志配置
interface LogConfig {
  minLevel: LogLevel;
  enableConsole: boolean;
  maxLogEntries: number;
}

class LogService {
  private logs: LogEntry[] = [];
  private config: LogConfig = {
    minLevel: LogLevel.DEBUG,
    enableConsole: true,
    maxLogEntries: 1000
  };

  /**
   * 记录调试级别日志
   */
  public debug(message: string, data?: any, source?: string): void {
    this.log(LogLevel.DEBUG, message, data, source);
  }

  /**
   * 记录信息级别日志
   */
  public info(message: string, data?: any, source?: string): void {
    this.log(LogLevel.INFO, message, data, source);
  }

  /**
   * 记录警告级别日志
   */
  public warn(message: string, data?: any, source?: string): void {
    this.log(LogLevel.WARN, message, data, source);
  }

  /**
   * 记录错误级别日志
   */
  public error(message: string, data?: any, source?: string): void {
    this.log(LogLevel.ERROR, message, data, source);
  }

  /**
   * 记录日志
   */
  private log(level: LogLevel, message: string, data?: any, source?: string): void {
    // 检查日志级别
    if (!this.shouldLog(level)) {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      message,
      data,
      source
    };

    // 添加到日志数组
    this.logs.push(entry);

    // 如果超过最大日志条目数，删除最旧的
    if (this.logs.length > this.config.maxLogEntries) {
      this.logs.shift();
    }

    // 输出到控制台
    if (this.config.enableConsole) {
      this.logToConsole(entry);
    }
  }

  /**
   * 输出到控制台
   */
  private logToConsole(entry: LogEntry): void {
    const timestamp = entry.timestamp.toISOString();
    const source = entry.source ? `[${entry.source}]` : '';
    const message = `${timestamp} ${entry.level.toUpperCase()} ${source} ${entry.message}`;

    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(message, entry.data || '');
        break;
      case LogLevel.INFO:
        console.info(message, entry.data || '');
        break;
      case LogLevel.WARN:
        console.warn(message, entry.data || '');
        break;
      case LogLevel.ERROR:
        console.error(message, entry.data || '');
        break;
    }
  }

  /**
   * 检查是否应该记录此级别的日志
   */
  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR];
    const minLevelIndex = levels.indexOf(this.config.minLevel);
    const currentLevelIndex = levels.indexOf(level);
    
    return currentLevelIndex >= minLevelIndex;
  }

  /**
   * 获取所有日志
   */
  public getLogs(): LogEntry[] {
    return [...this.logs];
  }

  /**
   * 获取特定级别的日志
   */
  public getLogsByLevel(level: LogLevel): LogEntry[] {
    return this.logs.filter(log => log.level === level);
  }

  /**
   * 清除所有日志
   */
  public clearLogs(): void {
    this.logs = [];
  }

  /**
   * 设置日志配置
   */
  public setConfig(config: Partial<LogConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * 导出日志为JSON
   */
  public exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }
}

// 创建单例实例
export const logService = new LogService();

// 默认导出
export default logService;
