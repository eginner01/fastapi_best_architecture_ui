/**
 * 审批流格式化工具函数
 */

import dayjs from 'dayjs';

import type { Urgency } from '#/api/approval';

// ==================== 字段格式化 ====================

/**
 * 格式化字段标签
 */
export function formatFieldLabel(key: string): string {
  const labelMap: Record<string, string> = {
    amount: '申请金额',
    attachment: '附件',
    content: '内容',
    date: '申请日期',
    department: '申请部门',
    description: '申请描述',
    reason: '申请原因',
    remark: '备注',
    title: '标题',
    type: '申请类型',
  };
  return labelMap[key] || key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

/**
 * 格式化字段值
 */
export function formatFieldValue(value: any): string {
  if (value === null || value === undefined || value === '') {
    return '-';
  }
  if (typeof value === 'boolean') {
    return value ? '是' : '否';
  }
  if (typeof value === 'object') {
    return JSON.stringify(value, null, 2);
  }
  return String(value);
}

// ==================== 日期格式化 ====================

/**
 * 格式化日期时间
 */
export function formatDateTime(date: string | Date): string {
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss');
}

/**
 * 计算已过时间
 */
export function getElapsedTime(startedAt: string | Date): string {
  const now = dayjs();
  const start = dayjs(startedAt);
  const diff = now.diff(start, 'minute');

  if (diff < 60) return `${diff}分钟前`;
  if (diff < 1440) return `${Math.floor(diff / 60)}小时前`;
  return `${Math.floor(diff / 1440)}天前`;
}

// ==================== 紧急程度 ====================

export interface UrgencyConfig {
  color: string;
  text: string;
  badge: string;
}

/**
 * 获取紧急程度配置
 */
export function getUrgencyConfig(urgency: Urgency): UrgencyConfig {
  const map: Record<Urgency, UrgencyConfig> = {
    HIGH: { badge: 'warning', color: 'orange', text: '高' },
    LOW: { badge: 'default', color: 'default', text: '低' },
    NORMAL: { badge: 'processing', color: 'blue', text: '普通' },
    URGENT: { badge: 'error', color: 'red', text: '紧急' },
  };
  return map[urgency] || map.NORMAL;
}

// ==================== 状态标签 ====================

export interface StatusConfig {
  color: string;
  text: string;
}

/**
 * 获取实例状态配置
 */
export function getInstanceStatusConfig(status: string): StatusConfig {
  const map: Record<string, StatusConfig> = {
    APPROVED: { color: 'success', text: '已通过' },
    CANCELLED: { color: 'default', text: '已取消' },
    PENDING: { color: 'processing', text: '审批中' },
    REJECTED: { color: 'error', text: '已拒绝' },
  };
  return map[status] || { color: 'default', text: status };
}

/**
 * 获取步骤状态配置
 */
export function getStepStatusConfig(status: string): StatusConfig {
  const map: Record<string, StatusConfig> = {
    APPROVED: { color: 'success', text: '已通过' },
    CANCELLED: { color: 'default', text: '已取消' },
    DELEGATED: { color: 'warning', text: '已转交' },
    PENDING: { color: 'processing', text: '待处理' },
    REJECTED: { color: 'error', text: '已拒绝' },
    RETURNED: { color: 'warning', text: '已退回' },
  };
  return map[status] || { color: 'default', text: status };
}

/**
 * 获取流程状态配置
 */
export function getFlowStatusConfig(status: string): StatusConfig {
  const map: Record<string, StatusConfig> = {
    ARCHIVED: { color: 'default', text: '已归档' },
    DRAFT: { color: 'default', text: '草稿' },
    PUBLISHED: { color: 'success', text: '已发布' },
  };
  return map[status] || { color: 'default', text: status };
}

// ==================== 节点类型 ====================

export interface NodeTypeConfig {
  color: string;
  icon: string;
  text: string;
}

/**
 * 获取节点类型配置
 */
export function getNodeTypeConfig(nodeType: string): NodeTypeConfig {
  const map: Record<string, NodeTypeConfig> = {
    APPROVAL: { color: '#1890ff', icon: 'ant-design:check-circle-outlined', text: '审批节点' },
    CC: { color: '#52c41a', icon: 'ant-design:info-circle-outlined', text: '抄送节点' },
    END: { color: '#f5222d', icon: 'ant-design:stop-outlined', text: '结束节点' },
    START: { color: '#52c41a', icon: 'ant-design:play-circle-outlined', text: '开始节点' },
  };
  return map[nodeType] || { color: '#666', icon: 'ant-design:question-circle-outlined', text: nodeType };
}
