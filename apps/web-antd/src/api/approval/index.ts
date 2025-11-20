/**
 * 审批流API
 */

import { requestClient } from '#/api/request';

import type {
  CreateFlowParams,
  CreateInstanceParams,
  Flow,
  FlowDetail,
  FlowQuery,
  InitiatedQuery,
  InstanceQuery,
  PageData,
  ProcessStepParams,
  TodoQuery,
  UpdateFlowParams,
} from './types';

export * from './types';

// ==================== 流程管理API ====================

/**
 * 获取流程列表
 */
export async function getFlowList(params: FlowQuery) {
  return requestClient.get<PageData<Flow>>('/api/v1/approval/flows', { params });
}

/**
 * 获取流程详情
 */
export async function getFlow(flowId: number) {
  return requestClient.get<FlowDetail>(`/api/v1/approval/flows/${flowId}`);
}

/**
 * 创建流程
 */
export async function createFlow(data: CreateFlowParams) {
  return requestClient.post<Flow>('/api/v1/approval/flows', data);
}

/**
 * 更新流程
 */
export async function updateFlow(flowId: number, data: UpdateFlowParams) {
  return requestClient.put<Flow>(`/api/v1/approval/flows/${flowId}`, data);
}

/**
 * 删除流程
 */
export async function deleteFlow(flowId: number) {
  return requestClient.delete(`/api/v1/approval/flows/${flowId}`);
}

/**
 * 发布流程
 */
export async function publishFlow(flowId: number) {
  return requestClient.post<Flow>(`/api/v1/approval/flows/${flowId}/publish`);
}

/**
 * 取消发布流程
 */
export async function unpublishFlow(flowId: number) {
  return requestClient.post<Flow>(`/api/v1/approval/flows/${flowId}/unpublish`);
}

// ==================== 流程实例API ====================

/**
 * 获取流程实例列表
 */
export async function getInstanceList(params: InstanceQuery) {
  return requestClient.get<PageData<any>>('/api/v1/approval/instances', {
    params,
  });
}

/**
 * 获取流程实例详情
 */
export async function getInstance(instanceId: number) {
  return requestClient.get<any>(`/api/v1/approval/instances/${instanceId}`);
}

/**
 * 创建流程实例（发起审批）
 */
export async function createInstance(data: CreateInstanceParams) {
  return requestClient.post<any>('/api/v1/approval/instances', data);
}

/**
 * 取消流程实例
 */
export async function cancelInstance(instanceId: number) {
  return requestClient.post(`/api/v1/approval/instances/${instanceId}/cancel`);
}

/**
 * 删除流程实例
 */
export async function deleteInstance(instanceId: number) {
  return requestClient.delete(`/api/v1/approval/instances/${instanceId}`);
}

// ==================== 审批步骤API ====================

/**
 * 处理审批步骤
 */
export async function processStep(stepId: number, data: ProcessStepParams) {
  return requestClient.post(
    `/api/v1/approval/steps/${stepId}/process`,
    data,
  );
}

// ==================== 我的任务API ====================

/**
 * 获取我的待办
 */
export async function getMyTodo(params: TodoQuery) {
  return requestClient.get<PageData<any>>('/api/v1/approval/my/todo', { params });
}

/**
 * 获取我发起的
 */
export async function getMyInitiated(params: InitiatedQuery) {
  return requestClient.get<PageData<any>>('/api/v1/approval/my/initiated', {
    params,
  });
}

/**
 * 获取我的已办
 */
export async function getMyDone(params: TodoQuery) {
  return requestClient.get<PageData<any>>('/api/v1/approval/my/done', { params });
}

/**
 * 获取我的抄送
 */
export async function getMyCc(params: TodoQuery) {
  return requestClient.get<PageData<any>>('/api/v1/approval/my/cc', { params });
}
