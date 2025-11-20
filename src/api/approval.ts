/**
 * 审批流API调用
 */

import { ApiClient } from '@/api/client';

// ==================== 类型定义 ====================
export interface FlowNode {
  node_no: string;
  name: string;
  node_type: string;
  approval_type?: string;
  assignee_type?: string;
  assignee_value?: string;
  form_permissions?: Record<string, any>;
  operation_permissions?: Record<string, any>;
  position_x?: number;
  position_y?: number;
  order_num: number;
  is_first: boolean;
  is_final: boolean;
  settings?: Record<string, any>;
}

export interface FlowLine {
  line_no: string;
  from_node_id: string;
  to_node_id: string;
  condition_type?: string;
  condition_expression?: string;
  priority: number;
  label?: string;
  settings?: Record<string, any>;
}

export interface Flow {
  id: number;
  flow_no: string;
  name: string;
  description?: string;
  icon?: string;
  category?: string;
  is_active: boolean;
  version: number;
  is_published: boolean;
  form_schema?: Record<string, any>;
  settings?: Record<string, any>;
  created_by: number;
  created_time: string;
  updated_time?: string;
  nodes?: FlowNode[];
  lines?: FlowLine[];
}

export interface Instance {
  id: number;
  instance_no: string;
  flow_id: number;
  flow_version: number;
  applicant_id: number;
  title: string;
  status: string;
  current_node_id?: number;
  business_key?: string;
  business_type?: string;
  form_data?: Record<string, any>;
  started_at: string;
  ended_at?: string;
  duration?: number;
  urgency: string;
  tags?: string[];
  attachments?: any[];
  created_time: string;
  updated_time?: string;
  steps?: Step[];
}

export interface Step {
  id: number;
  step_no: string;
  assignee_id: number;
  assignee_name?: string;
  status: string;
  action?: string;
  opinion?: string;
  attachments?: any[];
  started_at: string;
  completed_at?: string;
  duration?: number;
  is_read: boolean;
}

// ==================== 流程管理API ====================

/**
 * 获取流程列表
 */
export const getFlowList = (params?: {
  name?: string;
  category?: string;
  is_active?: boolean;
  is_published?: boolean;
  page?: number;
  size?: number;
}) => {
  return ApiClient.get('/v1/approval/flows', { params });
};

/**
 * 获取流程详情
 */
export const getFlow = (flowId: number) => {
  return ApiClient.get(`/v1/approval/flows/${flowId}`);
};

/**
 * 创建流程
 */
export const createFlow = (data: {
  flow_no: string;
  name: string;
  description?: string;
  icon?: string;
  category?: string;
  form_schema?: Record<string, any>;
  nodes: FlowNode[];
  lines: FlowLine[];
  settings?: Record<string, any>;
}) => {
  return ApiClient.post('/v1/approval/flows', data);
};

/**
 * 更新流程
 */
export const updateFlow = (flowId: number, data: Partial<Flow>) => {
  return ApiClient.put(`/v1/approval/flows/${flowId}`, data);
};

/**
 * 删除流程
 */
export const deleteFlow = (flowId: number) => {
  return ApiClient.delete(`/v1/approval/flows/${flowId}`);
};

/**
 * 发布流程
 */
export const publishFlow = (flowId: number) => {
  return ApiClient.post(`/v1/approval/flows/${flowId}/publish`);
};

/**
 * 取消发布流程
 */
export const unpublishFlow = (flowId: number) => {
  return ApiClient.post(`/v1/approval/flows/${flowId}/unpublish`);
};

// ==================== 流程实例API ====================

/**
 * 获取流程实例列表
 */
export const getInstanceList = (params?: {
  flow_id?: number;
  applicant_id?: number;
  status?: string;
  urgency?: string;
  business_type?: string;
  title?: string;
  page?: number;
  size?: number;
}) => {
  return ApiClient.get('/v1/approval/instances', { params });
};

/**
 * 获取流程实例详情
 */
export const getInstance = (instanceId: number) => {
  return ApiClient.get(`/v1/approval/instances/${instanceId}`);
};

/**
 * 发起审批
 */
export const createInstance = (data: {
  flow_id: number;
  title: string;
  business_key?: string;
  business_type?: string;
  form_data: Record<string, any>;
  urgency?: string;
  tags?: string[];
  attachments?: any[];
}) => {
  return ApiClient.post('/v1/approval/instances', data);
};

/**
 * 处理审批步骤
 */
export const processStep = (stepId: number, data: {
  action: string;  // APPROVE/REJECT/DELEGATE/RETURN
  opinion?: string;
  attachments?: any[];
  delegate_to?: number;
  return_to_node?: number;
}) => {
  return ApiClient.post(`/v1/approval/steps/${stepId}/process`, data);
};

/**
 * 处理审批
 */
export const processInstance = (stepId: number, data: {
  action: 'APPROVE' | 'REJECT' | 'DELEGATE' | 'RETURN';
  opinion?: string;
  attachments?: any[];
  delegate_to?: number;
  return_to_node?: number;
}) => {
  return ApiClient.post(`/v1/approval/instances/${stepId}/process`, data);
};

/**
 * 取消审批
 */
export const cancelInstance = (instanceId: number) => {
  return ApiClient.post(`/v1/approval/instances/${instanceId}/cancel`);
};

/**
 * 删除审批实例
 */
export const deleteInstance = (instanceId: number) => {
  return ApiClient.delete(`/v1/approval/instances/${instanceId}`);
};

// ==================== 我的任务API ====================

/**
 * 我发起的
 */
export const getMyInitiated = (params?: { page?: number; size?: number }) => {
  return ApiClient.get('/v1/approval/my/initiated', { params });
};

/**
 * 我的待办
 */
export const getMyTodo = (params?: { page?: number; size?: number }) => {
  return ApiClient.get('/v1/approval/my/todo', { params });
};

/**
 * 我的已办
 */
export const getMyDone = (params?: { page?: number; size?: number }) => {
  return ApiClient.get('/v1/approval/my/done', { params });
};
