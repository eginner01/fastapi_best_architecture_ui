import { reportErrorLogApi, type ErrorLogParams, type ErrorSeverity } from '@/api/errorLog';

/**
 * 错误日志记录器
 */
class ErrorLogger {
  private queue: ErrorLogParams[] = [];
  private isReporting = false;
  private maxQueueSize = 10;

  /**
   * 记录错误
   */
  log(params: ErrorLogParams) {
    // 添加到队列
    this.queue.push(params);

    // 如果队列已满，立即上报
    if (this.queue.length >= this.maxQueueSize) {
      this.flush();
    }

    // 开发环境下打印到控制台
    if (import.meta.env.DEV) {
      console.error('[ErrorLogger]', params);
    }
  }

  /**
   * 快速记录方法
   */
  error(message: string, error?: Error, severity: ErrorSeverity = 'MEDIUM') {
    this.log({
      type: 'RUNTIME_ERROR',
      severity,
      message,
      stack: error?.stack,
    });
  }

  httpError(message: string, status: number, severity: ErrorSeverity = 'MEDIUM') {
    this.log({
      type: 'HTTP_ERROR',
      severity,
      message,
      meta: { status },
    });
  }

  networkError(message: string, severity: ErrorSeverity = 'HIGH') {
    this.log({
      type: 'NETWORK_ERROR',
      severity,
      message,
    });
  }

  /**
   * 刷新队列，上报所有错误
   */
  async flush() {
    if (this.queue.length === 0 || this.isReporting) {
      return;
    }

    this.isReporting = true;
    const logs = [...this.queue];
    this.queue = [];

    try {
      // 批量上报
      await Promise.all(
        logs.map(log => 
          reportErrorLogApi(log).catch(err => {
            console.error('Failed to report error log:', err);
          })
        )
      );
    } catch (error) {
      console.error('Error reporting failed:', error);
      // 上报失败，重新加入队列
      this.queue.unshift(...logs);
    } finally {
      this.isReporting = false;
    }
  }

  /**
   * 在页面卸载前上报所有错误
   */
  setupBeforeUnload() {
    window.addEventListener('beforeunload', () => {
      if (this.queue.length > 0) {
        // 使用 sendBeacon 确保在页面卸载时也能发送
        const logs = this.queue.map(log => ({
          ...log,
          timestamp: log.timestamp || Date.now(),
          url: log.url || window.location.href,
          user_agent: log.user_agent || navigator.userAgent,
        }));

        navigator.sendBeacon(
          '/api/v1/logs/errors/batch',
          JSON.stringify({ logs })
        );
      }
    });
  }
}

// 单例导出
export const errorLogger = new ErrorLogger();

/**
 * 全局错误监听器
 */
export function setupGlobalErrorHandlers() {
  // 捕获未处理的错误
  window.addEventListener('error', (event) => {
    errorLogger.log({
      type: event.filename ? 'RESOURCE_ERROR' : 'RUNTIME_ERROR',
      severity: 'HIGH',
      message: event.message,
      stack: event.error?.stack,
      meta: {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      },
    });
  });

  // 捕获未处理的Promise错误
  window.addEventListener('unhandledrejection', (event) => {
    errorLogger.log({
      type: 'PROMISE_ERROR',
      severity: 'HIGH',
      message: event.reason?.message || String(event.reason),
      stack: event.reason?.stack,
    });
  });

  // 页面卸载前上报
  errorLogger.setupBeforeUnload();
}
