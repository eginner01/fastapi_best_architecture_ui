/**
 * 审批流类型定义
 */

// ==================== 通用类型 ====================
export interface PageParams {
  page: number;
  size: number;
}

export interface PageData<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

// ==================== 流程相关 ====================
export type FlowStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export type NodeType = 'START' | 'APPROVAL' | 'CC' | 'END';
export type AssigneeType = 'USER' | 'ROLE' | 'DEPT';

export interface FlowNode {
  id: number;
  flow_id: number;
  name: string;
  node_type: NodeType;
  assignee_type: AssigneeType;
  assignee_ids: number[];
  position_x: number;
  position_y: number;
  config: Record<string, any>;
  assignee_names?: string[];
}

export interface FlowLine {
  id: number;
  flow_id: number;
  source_node_id: number;
  target_node_id: number;
  condition: string | null;
  priority: number;
}

export interface Flow {
  id: number;
  name: string;
  description: string;
  status: FlowStatus;
  version: number;
  icon?: string;
  business_type?: string;
  form_schema?: Record<string, any>;
  created_by: number;
  created_at: string;
  updated_at: string;
}

export interface FlowDetail extends Flow {
  nodes: FlowNode[];
  lines: FlowLine[];
}

// ==================== 实例相关 ====================
export type InstanceStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
export type Urgency = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

export interface ApprovalInstance {
  id: number;
  instance_no: string;
  flow_id: number;
  flow_name: string;
  title: string;
  status: InstanceStatus;
  urgency: Urgency;
  applicant_id: number;
  applicant_name: string;
  form_data: Record<string, any>;
  started_at: string;
  ended_at?: string;
  business_type?: string;
  steps?: ApprovalStep[];
}

// ==================== 步骤相关 ====================
export type StepStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'DELEGATED' | 'RETURNED' | 'CANCELLED';

export interface ApprovalStep {
  id: number;
  instance_id: number;
  node_id: number;
  node_name: string;
  step_no: string;
  assignee_id: number;
  assignee_name?: string;
  status: StepStatus;
  opinion?: string;
  attachments?: any[];
  started_at: string;
  completed_at?: string;
  delegated_from?: number;
  returned_from?: number;
}

export interface TodoTask {
  step_id: number;
  instance_id: number;
  instance_no: string;
  title: string;
  flow_name: string;
  applicant_name: string;
  status: StepStatus;
  urgency: Urgency;
  started_at: string;
  is_read: boolean;
}

// ==================== 请求参数 ====================
export interface CreateFlowParams {
  name: string;
  description?: string;
  icon?: string;
  business_type?: string;
  form_schema?: Record<string, any>;
}

export interface UpdateFlowParams extends CreateFlowParams {
  nodes: Omit<FlowNode, 'id' | 'flow_id'>[];
  lines: Omit<FlowLine, 'id' | 'flow_id'>[];
}

export interface CreateInstanceParams {
  flow_id: number;
  title: string;
  urgency?: Urgency;
  form_data: Record<string, any>;
  business_type?: string;
  tags?: string[];
  attachments?: any[];
}

export interface ProcessStepParams {
  action: 'APPROVE' | 'REJECT' | 'DELEGATE' | 'RETURN';
  opinion?: string;
  attachments?: any[];
  delegate_to?: number;
  return_to_node?: number;
}

// ==================== 查询参数 ====================
export interface FlowQuery extends PageParams {
  name?: string;
  status?: FlowStatus;
  business_type?: string;
}

export interface InstanceQuery extends PageParams {
  flow_id?: number;
  applicant_id?: number;
  status?: InstanceStatus;
  urgency?: Urgency;
  business_type?: string;
  title?: string;
}

export interface TodoQuery extends PageParams {
  urgency?: Urgency;
  flow_id?: number;
}

export interface InitiatedQuery extends PageParams {
  status?: InstanceStatus;
  urgency?: Urgency;
  flow_id?: number;
}
