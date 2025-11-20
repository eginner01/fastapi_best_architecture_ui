<script setup lang="ts">
import { computed } from 'vue';
import { Icon } from '@iconify/vue';

/**
 * 流程节点接口
 */
interface FlowNode {
  id: number;
  node_no: string;
  name: string;
  node_type: 'START' | 'END' | 'APPROVAL' | 'CC';
  order_num: number;
  is_first: boolean;
  is_final: boolean;
}

/**
 * 审批步骤接口
 */
interface ApprovalStep {
  id: number;
  node_no: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'RETURNED' | 'CANCELLED';
  assignee_name?: string;
  completed_at?: string;
  opinion?: string;
}

/**
 * 组件属性
 */
interface Props {
  nodes: FlowNode[];
  lines?: any[];
  steps?: ApprovalStep[];
  currentNodeNo?: string;
}

const props = withDefaults(defineProps<Props>(), {
  lines: () => [],
  steps: () => [],
  currentNodeNo: '',
});

/**
 * 节点状态类型
 */
type NodeStatus = 'waiting' | 'active' | 'completed' | 'rejected' | 'returned' | 'cancelled';

/**
 * 排序节点：开始 → 审批节点(按order_num) → 结束
 */
const sortedNodes = computed(() => {
  if (!props.nodes || props.nodes.length === 0) return [];
  
  const sorted = [...props.nodes].sort((a, b) => {
    // START节点始终在最前
    if (a.node_type === 'START') return -1;
    if (b.node_type === 'START') return 1;
    
    // END节点始终在最后
    if (a.node_type === 'END') return 1;
    if (b.node_type === 'END') return -1;
    
    // 其他节点按order_num排序
    return a.order_num - b.order_num;
  });
  
  return sorted;
});

/**
 * 获取节点的审批步骤信息
 */
const getStepInfo = (nodeNo: string): ApprovalStep | undefined => {
  return props.steps.find(s => s.node_no === nodeNo);
};

/**
 * 获取节点状态
 */
const getNodeStatus = (nodeNo: string): NodeStatus => {
  // START和END节点的特殊处理
  const node = props.nodes.find(n => n.node_no === nodeNo);
  if (!node) return 'waiting';
  
  if (node.node_type === 'START') return 'completed'; // 开始节点默认已完成
  if (node.node_type === 'END') {
    // 所有审批节点都完成时，END节点才完成
    const allCompleted = props.steps.every(s => s.status === 'APPROVED');
    return allCompleted ? 'completed' : 'waiting';
  }
  
  // 查找对应的审批步骤
  const step = getStepInfo(nodeNo);
  if (!step) return 'waiting';
  
  // 根据步骤状态判断节点状态
  switch (step.status) {
    case 'APPROVED':
      return 'completed';
    case 'REJECTED':
      return 'rejected';
    case 'RETURNED':
      return 'returned';
    case 'CANCELLED':
      return 'cancelled';
    case 'PENDING':
      return 'active';
    default:
      return 'waiting';
  }
};

/**
 * 获取节点图标
 */
const getNodeIcon = (nodeType: string, status: NodeStatus): string => {
  // 优先根据状态显示图标
  if (status === 'completed') return 'ant-design:check-circle-filled';
  if (status === 'rejected') return 'ant-design:close-circle-filled';
  if (status === 'active') return 'ant-design:clock-circle-filled';
  if (status === 'returned') return 'ant-design:rollback-outlined';
  
  // 根据节点类型显示图标
  const iconMap: Record<string, string> = {
    'START': 'ant-design:play-circle-outlined',
    'END': 'ant-design:check-circle-outlined',
    'APPROVAL': 'ant-design:audit-outlined',
    'CC': 'ant-design:mail-outlined',
  };
  
  return iconMap[nodeType] || 'ant-design:file-outlined';
};

/**
 * 获取状态文本
 */
const getStatusText = (status: NodeStatus): string => {
  const textMap: Record<NodeStatus, string> = {
    'completed': '已完成',
    'active': '进行中',
    'rejected': '已拒绝',
    'returned': '已退回',
    'cancelled': '已取消',
    'waiting': '等待中',
  };
  
  return textMap[status] || '未知';
};

/**
 * 检查节点是否需要显示连接线
 */
const shouldShowConnector = (index: number): boolean => {
  return index < sortedNodes.value.length - 1;
};
</script>

<template>
  <div class="approval-flow-chart">
    <!-- 流程节点容器 -->
    <div class="flow-nodes-container">
      <template v-for="(node, index) in sortedNodes" :key="node.id">
        <!-- 流程节点 -->
        <div 
          class="flow-node"
          :class="[
            `node-status-${getNodeStatus(node.node_no)}`,
            `node-type-${node.node_type.toLowerCase()}`
          ]"
        >
          <!-- 节点卡片 -->
          <div class="node-card">
            <!-- 状态指示器 -->
            <div class="status-indicator"></div>
            
            <!-- 卡片头部 -->
            <div class="card-header">
              <Icon 
                :icon="getNodeIcon(node.node_type, getNodeStatus(node.node_no))" 
                class="node-icon" 
              />
              <div class="node-title">{{ node.name }}</div>
            </div>
            
            <!-- 卡片内容 -->
            <div class="card-content">
              <template v-if="getStepInfo(node.node_no)">
                <div class="node-assignee">
                  <Icon icon="ant-design:user-outlined" class="icon-small" />
                  <span>{{ getStepInfo(node.node_no)?.assignee_name }}</span>
                </div>
                <div v-if="getStepInfo(node.node_no)?.completed_at" class="node-time">
                  <Icon icon="ant-design:clock-circle-outlined" class="icon-small" />
                  <span>{{ new Date(getStepInfo(node.node_no)!.completed_at!).toLocaleString('zh-CN') }}</span>
                </div>
              </template>
              <div v-else class="node-placeholder">
                {{ getStatusText(getNodeStatus(node.node_no)) }}
              </div>
            </div>
          </div>
        </div>
        
        <!-- 连接箭头 -->
        <div 
          v-if="shouldShowConnector(index)" 
          class="flow-connector"
          :class="`connector-${getNodeStatus(node.node_no)}`"
        >
          <div class="connector-line"></div>
          <div class="connector-arrow"></div>
        </div>
      </template>
    </div>
    
    <!-- 图例 -->
    <div class="flow-legend">
      <div class="legend-title">流程状态</div>
      <div class="legend-items">
        <div class="legend-item">
          <span class="legend-dot completed"></span>
          <span class="legend-text">已完成</span>
        </div>
        <div class="legend-item">
          <span class="legend-dot active"></span>
          <span class="legend-text">进行中</span>
        </div>
        <div class="legend-item">
          <span class="legend-dot rejected"></span>
          <span class="legend-text">已拒绝</span>
        </div>
        <div class="legend-item">
          <span class="legend-dot returned"></span>
          <span class="legend-text">已退回</span>
        </div>
        <div class="legend-item">
          <span class="legend-dot waiting"></span>
          <span class="legend-text">等待中</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ======================
   主容器
   ====================== */
.approval-flow-chart {
  width: 100%;
  background: linear-gradient(135deg, rgba(15, 23, 42, 0.6) 0%, rgba(30, 41, 59, 0.6) 100%);
  border-radius: 12px;
  padding: 40px 32px 32px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
}

/* ======================
   节点容器
   ====================== */
.flow-nodes-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0;
  overflow-x: auto;
  padding-bottom: 20px;
}

/* ======================
   流程节点
   ====================== */
.flow-node {
  flex: 0 0 auto;
  position: relative;
}

/* 节点卡片 */
.node-card {
  min-width: 160px;
  max-width: 200px;
  background: rgba(255, 255, 255, 0.04);
  border: 2px solid rgba(255, 255, 255, 0.15);
  border-radius: 10px;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  position: relative;
}

/* 状态指示器（左侧色条） */
.status-indicator {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  background: rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;
}

/* 卡片头部 */
.card-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px;
  background: rgba(255, 255, 255, 0.02);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.node-icon {
  font-size: 20px;
  flex-shrink: 0;
  transition: all 0.3s ease;
}

.node-title {
  font-size: 14px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  line-height: 1.4;
  flex: 1;
}

/* 卡片内容 */
.card-content {
  padding: 12px 16px;
  min-height: 50px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.node-assignee,
.node-time {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
}

.icon-small {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.5);
}

.node-placeholder {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  text-align: center;
  padding: 8px 0;
}

/* ======================
   不同状态的节点样式
   ====================== */
/* 已完成状态 */
.node-status-completed .status-indicator {
  background: #52c41a;
}

.node-status-completed .node-card {
  border-color: #52c41a;
  box-shadow: 0 4px 16px rgba(82, 196, 26, 0.25);
}

.node-status-completed .node-icon {
  color: #52c41a;
}

/* 进行中状态 */
.node-status-active .status-indicator {
  background: #1890ff;
}

.node-status-active .node-card {
  border-color: #1890ff;
  box-shadow: 0 4px 16px rgba(24, 144, 255, 0.3);
  animation: pulse-active 2s ease-in-out infinite;
}

.node-status-active .node-icon {
  color: #1890ff;
}

@keyframes pulse-active {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-3px);
  }
}

/* 已拒绝状态 */
.node-status-rejected .status-indicator {
  background: #ff4d4f;
}

.node-status-rejected .node-card {
  border-color: #ff4d4f;
  box-shadow: 0 4px 16px rgba(255, 77, 79, 0.25);
}

.node-status-rejected .node-icon {
  color: #ff4d4f;
}

/* 已退回状态 */
.node-status-returned .status-indicator {
  background: #fa8c16;
}

.node-status-returned .node-card {
  border-color: #fa8c16;
  box-shadow: 0 4px 16px rgba(250, 140, 22, 0.25);
}

.node-status-returned .node-icon {
  color: #fa8c16;
}

/* 等待中状态 */
.node-status-waiting .status-indicator,
.node-status-cancelled .status-indicator {
  background: rgba(255, 255, 255, 0.15);
}

.node-status-waiting .node-icon,
.node-status-cancelled .node-icon {
  color: rgba(255, 255, 255, 0.4);
}

/* 悬停效果 */
.flow-node:hover .node-card {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
}

.flow-node:hover .node-title {
  color: #fff;
}

/* ======================
   连接器（箭头）
   ====================== */
.flow-connector {
  flex: 1 1 auto;
  min-width: 50px;
  display: flex;
  align-items: center;
  position: relative;
  padding: 0 8px;
}

.connector-line {
  flex: 1;
  height: 2px;
  background: rgba(255, 255, 255, 0.25);
  position: relative;
}

.connector-arrow {
  width: 0;
  height: 0;
  border-left: 8px solid rgba(255, 255, 255, 0.25);
  border-top: 5px solid transparent;
  border-bottom: 5px solid transparent;
  margin-left: -1px;
}

/* 不同状态的连接器颜色 */
.connector-completed .connector-line,
.connector-completed .connector-arrow {
  background: #52c41a;
  border-left-color: #52c41a;
}

.connector-active .connector-line {
  background: linear-gradient(90deg, #52c41a 0%, #1890ff 100%);
}

.connector-active .connector-arrow {
  border-left-color: #1890ff;
}

/* ======================
   图例
   ====================== */
.flow-legend {
  margin-top: 28px;
  padding-top: 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.legend-title {
  font-size: 13px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.7);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.legend-items {
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
  justify-content: center;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;
  cursor: default;
}

.legend-item:hover {
  transform: translateY(-1px);
}

.legend-dot {
  width: 12px;
  height: 12px;
  border-radius: 3px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
  transition: all 0.3s ease;
}

.legend-item:hover .legend-dot {
  transform: scale(1.15);
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.3);
}

.legend-dot.completed { background: #52c41a; }
.legend-dot.active { background: #1890ff; }
.legend-dot.rejected { background: #ff4d4f; }
.legend-dot.returned { background: #fa8c16; }
.legend-dot.waiting { background: rgba(255, 255, 255, 0.3); }

.legend-text {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
  font-weight: 500;
}

/* ======================
   响应式设计
   ====================== */
@media (max-width: 768px) {
  .approval-flow-chart {
    padding: 24px 20px;
  }
  
  .node-card {
    min-width: 140px;
    max-width: 160px;
  }
  
  .card-header {
    padding: 12px;
  }
  
  .card-content {
    padding: 10px 12px;
  }
  
  .legend-items {
    gap: 16px;
  }
  
  .legend-item {
    font-size: 11px;
  }
}
</style>
