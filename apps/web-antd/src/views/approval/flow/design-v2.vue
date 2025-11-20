<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { message } from 'ant-design-vue';
import { Page } from '@vben/common-ui';
import { Icon } from '@iconify/vue';
import { createFlow, updateFlow, getFlow } from '#/api/approval';
import { getAllUsers, getAllRoles, getAllDepartments, type User, type Role, type Department } from '#/api/system';

const router = useRouter();
const route = useRoute();
const flowId = ref<number | null>(route.params.flowId ? Number(route.params.flowId) : null);

const loading = ref(false);
const submitting = ref(false);

// 基本信息
const flowForm = ref({
  flow_no: '',
  name: '',
  description: '',
  category: 'general',
  icon: 'ant-design:file-text-outlined',
});

// 节点接口
interface FlowNode {
  node_no: string;
  name: string;
  node_type: 'START' | 'APPROVAL' | 'END';
  approval_type?: 'SINGLE' | 'MULTI_OR' | 'MULTI_AND';
  assignee_type?: 'USER' | 'ROLE' | 'DEPT';
  assignee_value?: string; // 多个ID用逗号分隔
  order_num: number;
  is_first: boolean;
  is_final: boolean;
}

// 节点列表（始终包含开始和结束节点）
const nodes = ref<FlowNode[]>([
  {
    node_no: 'START',
    name: '开始',
    node_type: 'START',
    order_num: 0,
    is_first: true,
    is_final: false,
  },
  {
    node_no: 'END',
    name: '结束',
    node_type: 'END',
    order_num: 999,
    is_first: false,
    is_final: true,
  },
]);

// 节点编辑对话框
const nodeDialogOpen = ref(false);
const editingNodeIndex = ref<number | null>(null);
const currentNode = ref<FlowNode>({
  node_no: '',
  name: '',
  node_type: 'APPROVAL',
  approval_type: 'SINGLE',
  assignee_type: 'ROLE',
  assignee_value: '',
  order_num: 1,
  is_first: false,
  is_final: false,
});

// 审批人选择数据
const users = ref<User[]>([]);
const roles = ref<Role[]>([]);
const departments = ref<Department[]>([]);
const loadingOptions = ref(false);

// 是否为编辑模式
const isEditMode = computed(() => !!flowId.value);

// 加载流程详情
const loadFlow = async () => {
  if (!flowId.value) return;

  loading.value = true;
  try {
    const flow = await getFlow(flowId.value);
    flowForm.value = {
      flow_no: flow.flow_no || '',
      name: flow.name,
      description: flow.description || '',
      category: flow.category || 'general',
      icon: flow.icon || 'ant-design:file-text-outlined',
    };

    // 过滤出审批节点
    const approvalNodes = (flow.nodes || []).filter((n: any) => n.node_type === 'APPROVAL');

    // 重建节点列表：开始 + 审批节点 + 结束
    const startNode: FlowNode = {
      node_no: 'START',
      name: '开始',
      node_type: 'START',
      order_num: 0,
      is_first: true,
      is_final: false,
    };

    const endNode: FlowNode = {
      node_no: 'END',
      name: '结束',
      node_type: 'END',
      order_num: approvalNodes.length + 1,
      is_first: false,
      is_final: true,
    };

    nodes.value = [startNode, ...approvalNodes, endNode];
  } catch (error: any) {
    message.error(error.message || '加载流程失败');
  } finally {
    loading.value = false;
  }
};

// 添加节点
const handleAddNode = () => {
  editingNodeIndex.value = null;
  currentNode.value = {
    node_no: `NODE_${Date.now()}`,
    name: '',
    node_type: 'APPROVAL',
    approval_type: 'SINGLE',
    assignee_type: 'ROLE',
    assignee_value: '',
    order_num: nodes.value.length - 1,
    is_first: false,
    is_final: false,
  };
  nodeDialogOpen.value = true;
};

// 编辑节点
const handleEditNode = (index: number) => {
  editingNodeIndex.value = index;
  currentNode.value = { ...nodes.value[index] };
  nodeDialogOpen.value = true;
};

// 获取选中的ID列表
const getSelectedIds = (): number[] => {
  if (!currentNode.value.assignee_value) return [];
  return currentNode.value.assignee_value.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
};

// 切换选择状态
const toggleSelection = (id: number) => {
  const selectedIds = getSelectedIds();
  const newIds = selectedIds.includes(id)
    ? selectedIds.filter(i => i !== id)
    : [...selectedIds, id];
  currentNode.value.assignee_value = newIds.join(',');
};

// 保存节点
const handleSaveNode = () => {
  if (!currentNode.value.name) {
    message.warning('请填写节点名称');
    return;
  }

  if (!currentNode.value.assignee_value) {
    message.warning('请选择审批人');
    return;
  }

  if (editingNodeIndex.value !== null) {
    // 更新现有节点
    nodes.value[editingNodeIndex.value] = { ...currentNode.value };
  } else {
    // 插入新节点（在结束节点之前）
    nodes.value.splice(nodes.value.length - 1, 0, { ...currentNode.value });
  }

  nodeDialogOpen.value = false;
};

// 删除节点
const handleDeleteNode = (index: number) => {
  const node = nodes.value[index];
  if (node.node_type === 'START' || node.node_type === 'END') {
    message.error('开始和结束节点不能删除');
    return;
  }
  nodes.value.splice(index, 1);
};

// 上移节点
const handleMoveUp = (index: number) => {
  if (index <= 1) return; // 不能移到开始节点之前
  const temp = nodes.value[index];
  nodes.value[index] = nodes.value[index - 1];
  nodes.value[index - 1] = temp;
};

// 下移节点
const handleMoveDown = (index: number) => {
  if (index >= nodes.value.length - 2) return; // 不能移到结束节点之后
  const temp = nodes.value[index];
  nodes.value[index] = nodes.value[index + 1];
  nodes.value[index + 1] = temp;
};

// 保存流程
const handleSave = async () => {
  if (!flowForm.value.flow_no || !flowForm.value.name) {
    message.warning('请填写必填项');
    return;
  }

  // 验证至少有一个审批节点
  const approvalNodes = nodes.value.filter(n => n.node_type === 'APPROVAL');
  if (approvalNodes.length === 0) {
    message.warning('请至少添加一个审批节点');
    return;
  }

  submitting.value = true;
  try {
    // 生成流程线（顺序连接）
    const lines = [];
    for (let i = 0; i < nodes.value.length - 1; i++) {
      lines.push({
        line_no: `LINE_${i}`,
        from_node_id: nodes.value[i].node_no,
        to_node_id: nodes.value[i + 1].node_no,
        condition_type: 'NONE',
        condition_expression: null,
        priority: i,
        label: null,
        settings: null,
      });
    }

    const flowData = {
      ...flowForm.value,
      nodes: nodes.value.map((node, index) => ({
        ...node,
        order_num: index,
      })),
      lines,
      form_schema: null,
      settings: null,
    };

    if (isEditMode.value && flowId.value) {
      await updateFlow(flowId.value, flowData);
      message.success('流程已更新');
    } else {
      await createFlow(flowData);
      message.success('流程已创建');
    }

    router.push({ name: 'approval:flow:manage' });
  } catch (error: any) {
    message.error(error.message || '保存失败');
  } finally {
    submitting.value = false;
  }
};

// 获取节点类型标签
const getNodeTypeBadge = (node: FlowNode) => {
  if (node.node_type === 'START') return { text: '开始', color: 'success' };
  if (node.node_type === 'END') return { text: '结束', color: 'default' };
  if (node.approval_type === 'SINGLE') return { text: '单人审批', color: 'processing' };
  if (node.approval_type === 'MULTI_OR') return { text: '多人或签', color: 'warning' };
  if (node.approval_type === 'MULTI_AND') return { text: '多人会签', color: 'error' };
  return { text: '审批', color: 'default' };
};

// 获取审批人描述
const getAssigneeDescription = (node: FlowNode) => {
  if (node.node_type !== 'APPROVAL') return '';
  const type = node.assignee_type === 'USER' ? '指定用户' :
                node.assignee_type === 'ROLE' ? '指定角色' : '指定部门';
  return `审批人：${type}`;
};

// 加载选择器数据
const loadOptions = async () => {
  // 避免重复加载
  if (users.value.length > 0 || roles.value.length > 0 || departments.value.length > 0) {
    return;
  }

  loadingOptions.value = true;
  try {
    const [usersData, rolesData, deptsData] = await Promise.all([
      getAllUsers(),
      getAllRoles(),
      getAllDepartments(),
    ]);
    users.value = usersData;
    roles.value = rolesData;
    departments.value = deptsData;
  } catch (error) {
    message.error('加载选项失败');
  } finally {
    loadingOptions.value = false;
  }
};

onMounted(() => {
  if (isEditMode.value) {
    loadFlow();
  }
});
</script>

<template>
  <Page
    content-class="flex flex-col"
    :title="isEditMode ? '编辑流程' : '新建流程'"
    description="设计审批流程模板"
  >
    <!-- 返回按钮 -->
    <div class="mb-4">
      <a-button @click="router.push({ name: 'approval:flow:manage' })">
        <template #icon>
          <Icon icon="ant-design:arrow-left-outlined" />
        </template>
        返回列表
      </a-button>
    </div>

    <a-spin :spinning="loading">
      <div class="space-y-4">
        <!-- 基本信息 -->
        <a-card title="基本信息">
          <template #extra>
            <span class="text-gray-400 text-sm">填写流程的基本信息</span>
          </template>
          <a-form :model="flowForm" layout="vertical">
            <a-row :gutter="16">
              <a-col :span="12">
                <a-form-item label="流程编号" required>
                  <a-input v-model:value="flowForm.flow_no" placeholder="例如: LEAVE_001" />
                </a-form-item>
              </a-col>
              <a-col :span="12">
                <a-form-item label="流程名称" required>
                  <a-input v-model:value="flowForm.name" placeholder="例如: 请假审批" />
                </a-form-item>
              </a-col>
            </a-row>
            <a-row :gutter="16">
              <a-col :span="12">
                <a-form-item label="流程分类">
                  <a-select v-model:value="flowForm.category">
                    <a-select-option value="general">通用</a-select-option>
                    <a-select-option value="hr">人事</a-select-option>
                    <a-select-option value="finance">财务</a-select-option>
                    <a-select-option value="purchase">采购</a-select-option>
                    <a-select-option value="other">其他</a-select-option>
                  </a-select>
                </a-form-item>
              </a-col>
              <a-col :span="12">
                <a-form-item label="流程图标">
                  <a-input v-model:value="flowForm.icon" placeholder="图标名称" />
                </a-form-item>
              </a-col>
            </a-row>
            <a-form-item label="流程描述">
              <a-textarea
                v-model:value="flowForm.description"
                :rows="4"
                placeholder="描述这个流程的用途..."
              />
            </a-form-item>
          </a-form>
        </a-card>

        <!-- 流程节点 -->
        <a-card>
          <template #title>
            <div class="flex items-center gap-2">
              <span>流程节点</span>
              <a-tag color="green">自动串联</a-tag>
            </div>
          </template>
          <template #extra>
            <a-button type="primary" @click="handleAddNode">
              <template #icon>
                <Icon icon="ant-design:plus-outlined" />
              </template>
              添加审批节点
            </a-button>
          </template>

          <div class="space-y-3">
            <div
              v-for="(node, index) in nodes"
              :key="node.node_no"
              class="flex items-center gap-3 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <!-- 节点序号 -->
              <div class="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-semibold">
                {{ index + 1 }}
              </div>

              <!-- 节点信息 -->
              <div class="flex-1">
                <div class="flex items-center gap-2 mb-1">
                  <span class="font-medium">{{ node.name }}</span>
                  <a-tag :color="getNodeTypeBadge(node).color">
                    {{ getNodeTypeBadge(node).text }}
                  </a-tag>
                </div>
                <div v-if="node.node_type === 'APPROVAL'" class="text-sm text-gray-500">
                  {{ getAssigneeDescription(node) }}
                </div>
              </div>

              <!-- 操作按钮（只对审批节点显示） -->
              <div v-if="node.node_type === 'APPROVAL'" class="flex-shrink-0 flex items-center gap-1">
                <a-button
                  size="small"
                  type="text"
                  :disabled="index <= 1"
                  @click="handleMoveUp(index)"
                >
                  <template #icon>
                    <Icon icon="ant-design:arrow-up-outlined" />
                  </template>
                </a-button>
                <a-button
                  size="small"
                  type="text"
                  :disabled="index >= nodes.length - 2"
                  @click="handleMoveDown(index)"
                >
                  <template #icon>
                    <Icon icon="ant-design:arrow-down-outlined" />
                  </template>
                </a-button>
                <a-button
                  size="small"
                  type="text"
                  @click="handleEditNode(index)"
                >
                  <template #icon>
                    <Icon icon="ant-design:setting-outlined" />
                  </template>
                </a-button>
                <a-button
                  size="small"
                  type="text"
                  danger
                  @click="handleDeleteNode(index)"
                >
                  <template #icon>
                    <Icon icon="ant-design:delete-outlined" />
                  </template>
                </a-button>
              </div>
            </div>
          </div>
        </a-card>

        <!-- 保存按钮 -->
        <div class="flex justify-end gap-2">
          <a-button size="large" @click="router.push({ name: 'approval:flow:manage' })">
            取消
          </a-button>
          <a-button
            type="primary"
            size="large"
            :loading="submitting"
            @click="handleSave"
          >
            <template #icon>
              <Icon icon="ant-design:save-outlined" />
            </template>
            {{ isEditMode ? '更新流程' : '保存流程' }}
          </a-button>
        </div>
      </div>
    </a-spin>

    <!-- 节点配置对话框 -->
    <a-modal
      v-model:open="nodeDialogOpen"
      :title="editingNodeIndex !== null ? '编辑节点' : '添加审批节点'"
      width="800px"
      @ok="handleSaveNode"
    >
      <div class="py-4 space-y-4">
        <a-form-item label="节点名称" required>
          <a-input v-model:value="currentNode.name" placeholder="例如：部门经理审批" />
        </a-form-item>

        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="审批方式" required>
              <a-select v-model:value="currentNode.approval_type">
                <a-select-option value="SINGLE">单人审批</a-select-option>
                <a-select-option value="MULTI_OR">多人或签（任一通过）</a-select-option>
                <a-select-option value="MULTI_AND">多人会签（全部通过）</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="审批人类型" required>
              <a-select v-model:value="currentNode.assignee_type" @change="loadOptions">
                <a-select-option value="USER">指定用户</a-select-option>
                <a-select-option value="ROLE">指定角色</a-select-option>
                <a-select-option value="DEPT">指定部门</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>

        <a-form-item label="审批人设置" required>
          <template #extra>
            <span v-if="getSelectedIds().length > 0" class="text-xs text-gray-400">
              已选择 {{ getSelectedIds().length }} 项
            </span>
          </template>
          <div class="border rounded p-4" style="max-height: 300px; overflow-y: auto;">
            <a-spin :spinning="loadingOptions">
              <div class="space-y-2">
                <!-- 用户列表 -->
                <template v-if="currentNode.assignee_type === 'USER'">
                  <div v-if="users.length === 0" class="text-center text-gray-400 py-4">
                    暂无用户
                  </div>
                  <div
                    v-for="user in users"
                    :key="user.id"
                    class="flex items-start space-x-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                    @click="toggleSelection(user.id)"
                  >
                    <a-checkbox
                      :checked="getSelectedIds().includes(user.id)"
                      @click.stop="toggleSelection(user.id)"
                    />
                    <div class="flex-1">
                      <div class="flex items-center gap-2">
                        <span class="font-medium">{{ user.nickname || user.username }}</span>
                        <span class="text-xs text-gray-400">@{{ user.username }}</span>
                        <a-tag v-if="user.dept" size="small" color="blue">
                          {{ user.dept.name }}
                        </a-tag>
                      </div>
                      <div v-if="user.email" class="text-xs text-gray-400 mt-0.5">
                        {{ user.email }}
                      </div>
                    </div>
                  </div>
                </template>

                <!-- 角色列表 -->
                <template v-if="currentNode.assignee_type === 'ROLE'">
                  <div v-if="roles.length === 0" class="text-center text-gray-400 py-4">
                    暂无角色
                  </div>
                  <div
                    v-for="role in roles"
                    :key="role.id"
                    class="flex items-start space-x-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                    @click="toggleSelection(role.id)"
                  >
                    <a-checkbox
                      :checked="getSelectedIds().includes(role.id)"
                      @click.stop="toggleSelection(role.id)"
                    />
                    <div class="flex-1">
                      <div class="flex items-center gap-2">
                        <span class="font-medium">{{ role.name }}</span>
                        <span v-if="role.code" class="text-xs text-gray-400">({{ role.code }})</span>
                      </div>
                      <div v-if="role.remark" class="text-xs text-gray-400 mt-0.5">
                        {{ role.remark }}
                      </div>
                    </div>
                  </div>
                </template>

                <!-- 部门列表 -->
                <template v-if="currentNode.assignee_type === 'DEPT'">
                  <div v-if="departments.length === 0" class="text-center text-gray-400 py-4">
                    暂无部门
                  </div>
                  <div
                    v-for="dept in departments"
                    :key="dept.id"
                    class="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                    @click="toggleSelection(dept.id)"
                  >
                    <a-checkbox
                      :checked="getSelectedIds().includes(dept.id)"
                      @click.stop="toggleSelection(dept.id)"
                    />
                    <span class="font-medium">{{ dept.name }}</span>
                  </div>
                </template>
              </div>
            </a-spin>
          </div>
          <div class="text-xs text-gray-400 mt-1">
            提示：支持多选，选中的审批人将根据审批方式并行或串行处理
          </div>
        </a-form-item>
      </div>
    </a-modal>
  </Page>
</template>

<style scoped>
.space-y-3 > * + * {
  margin-top: 12px;
}

.space-y-4 > * + * {
  margin-top: 16px;
}
</style>
