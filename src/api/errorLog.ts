import { ApiClient } from './client';

/**
 * 错误日志类型
 */
export type ErrorType = 
  | 'HTTP_ERROR'           // HTTP请求错误
  | 'RUNTIME_ERROR'        // 运行时错误
  | 'NETWORK_ERROR'        // 网络错误
  | 'RESOURCE_ERROR'       // 资源加载错误
  | 'PROMISE_ERROR'        // Promise未捕获错误
  | 'CUSTOM_ERROR';        // 自定义错误

/**
 * 错误严重程度
 */
export type ErrorSeverity = 
  | 'LOW'         // 低
  | 'MEDIUM'      // 中
  | 'HIGH'        // 高
  | 'CRITICAL';   // 严重

/**
 * 错误日志参数
 */
export interface ErrorLogParams {
  type: ErrorType;                    // 错误类型
  severity: ErrorSeverity;            // 严重程度
  message: string;                    // 错误消息
  stack?: string;                     // 错误堆栈
  url?: string;                       // 发生错误的URL
  user_agent?: string;                // 用户代理
  timestamp?: number;                 // 时间戳
  meta?: Record<string, any>;         // 额外元数据
}

/**
 * 错误日志响应
 */
export interface ErrorLogResponse {
  log_id: string;                     // 日志ID
  created_at: string;                 // 创建时间
}

/**
 * 上报错误日志
 */
export const reportErrorLogApi = (params: ErrorLogParams) => {
  return ApiClient.post<ErrorLogResponse>('/v1/logs/errors', {
    ...params,
    timestamp: params.timestamp || Date.now(),
    url: params.url || window.location.href,
    user_agent: params.user_agent || navigator.userAgent,
  });
};

/**
 * 批量上报错误日志
 */
export const reportBatchErrorLogsApi = (logs: ErrorLogParams[]) => {
  return ApiClient.post<{ count: number }>('/v1/logs/errors/batch', {
    logs: logs.map(log => ({
      ...log,
      timestamp: log.timestamp || Date.now(),
      url: log.url || window.location.href,
      user_agent: log.user_agent || navigator.userAgent,
    })),
  });
};
