<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { message, Modal } from 'ant-design-vue';
import { Icon } from '@iconify/vue';
import { Page } from '@vben/common-ui';
import { processStep, getInstance, getFlow } from '#/api/approval';
import type { ApprovalStep, ApprovalInstance, FlowDetail } from '#/api/approval';
import FlowChart from '../components/FlowChart.vue';
import { formatFieldLabel, formatFieldValue, formatDateTime, getUrgencyConfig } from '../utils/formatters';

const router = useRouter();
const route = useRoute();
const stepId = ref(Number(route.params.stepId));
const instanceId = ref(Number(route.query.instance));

const loading = ref(false);
const submitting = ref(false);
const instance = ref<ApprovalInstance | null>(null);
const flow = ref<FlowDetail | null>(null);
const opinion = ref('');

// 转交对话框
const delegateDialogOpen = ref(false);
const selectedUserId = ref<number | null>(null);
const users = ref<any[]>([]);

// 退回对话框
const returnDialogOpen = ref(false);
const selectedNodeId = ref<number | null>(null);

// 是否已撤销
const isCancelled = computed(() => instance.value?.status === 'CANCELLED');

// 获取申请描述（从表单数据中提取描述字段）
const getApplicationDescription = () => {
  if (!instance.value?.form_data) return '';
  
  const formData = instance.value.form_data;
  
  // 常见的描述字段名
  const descriptionKeys = [
    'description', 'desc', 'reason', 'content', 'remark', 'note', 
    '描述', '说明', '原因', '内容', '备注'
  ];
  
  // 查找描述字段
  for (const key of descriptionKeys) {
    if (formData[key]) {
      return formData[key];
    }
  }
  
  // 如果没有找到描述字段，返回第一个字符串值
  for (const [key, value] of Object.entries(formData)) {
    if (typeof value === 'string' && value.length > 10) {
      return value;
    }
  }
  
  return '';
};

// 加载实例详情
const loadInstance = async () => {
  loading.value = true;
  try {
    instance.value = await getInstance(instanceId.value);
    
    // 加载流程信息（用于退回）
    if (instance.value?.flow_id) {
      flow.value = await getFlow(instance.value.flow_id);
    }
  } catch (error) {
    message.error('加载审批详情失败');
  } finally {
    loading.value = false;
  }
};

// 加载用户列表（用于转交）
const loadUsers = async () => {
  try {
    // TODO: 调用获取用户列表的API
    // const { items } = await getUserList({ page: 1, size: 200 });
    // users.value = items || [];
    users.value = [];
  } catch (error) {
    message.error('加载用户列表失败');
  }
};

// 处理审批
const handleProcess = async (action: string, extraParams?: any) => {
  submitting.value = true;
  try {
    await processStep(stepId.value, {
      action: action as any,
      opinion: opinion.value || undefined,
      ...extraParams,
    });

    const actionText = {
      APPROVE: '同意',
      DELEGATE: '转交',
      REJECT: '拒绝',
      RETURN: '退回',
    }[action];

    message.success(`审批已${actionText}`);
    router.push({ name: 'approval:todo' });
  } catch (error: any) {
    message.error(error.message || '操作失败');
  } finally {
    submitting.value = false;
  }
};

// 同意
const handleApprove = () => {
  Modal.confirm({
    title: '确认同意',
    content: '确定要同意这个审批吗？',
    onOk: () => handleProcess('APPROVE'),
  });
};

// 拒绝
const handleReject = () => {
  if (!opinion.value) {
    message.warning('拒绝时请填写审批意见');
    return;
  }
  Modal.confirm({
    title: '确认拒绝',
    content: '确定要拒绝这个审批吗？',
    onOk: () => handleProcess('REJECT'),
  });
};

// 打开转交对话框
const handleOpenDelegateDialog = () => {
  loadUsers();
  delegateDialogOpen.value = true;
};

// 确认转交
const handleConfirmDelegate = () => {
  if (!selectedUserId.value) {
    message.warning('请选择转交对象');
    return;
  }
  delegateDialogOpen.value = false;
  handleProcess('DELEGATE', { delegate_to: selectedUserId.value });
};

// 打开退回对话框
const handleOpenReturnDialog = () => {
  returnDialogOpen.value = true;
};

// 确认退回
const handleConfirmReturn = () => {
  if (!selectedNodeId.value) {
    message.warning('请选择退回节点');
    return;
  }
  returnDialogOpen.value = false;
  handleProcess('RETURN', { return_to_node: selectedNodeId.value });
};

// 可退回的节点（仅审批节点）
const returnableNodes = computed(() => {
  return flow.value?.nodes?.filter((node) => node.node_type === 'APPROVAL') || [];
});

// 当前节点编号
const currentNodeNo = computed(() => {
  const pendingStep = instance.value?.steps?.find(s => s.status === 'PENDING');
  return pendingStep?.node_no || '';
});

onMounted(() => {
  loadInstance();
});
</script>

<template>
  <Page content-class="flex flex-col" :title="isCancelled ? '审批处理（已撤销）' : '审批处理'">
    <!-- 撤销提示 -->
    <a-alert
      v-if="isCancelled"
      class="mb-4"
      message="该审批已被撤销"
      description="申请人已取消此审批，无法继续处理"
      type="warning"
      show-icon
    />

    <!-- 返回按钮 -->
    <div class="mb-4">
      <a-button @click="router.push({ name: 'approval:todo' })">
        <template #icon>
          <Icon icon="ant-design:arrow-left-outlined" />
        </template>
        返回待办
      </a-button>
    </div>

    <a-spin :spinning="loading">
      <div class="space-y-4">
        <!-- 流程进度（置顶） -->
        <a-card v-if="flow" title="流程进度" class="flow-progress-card">
          <FlowChart
            :nodes="flow.nodes || []"
            :lines="flow.lines || []"
            :steps="instance?.steps || []"
            :current-node-no="currentNodeNo"
          />
        </a-card>

        <!-- 审批信息 -->
        <a-card title="审批信息" class="approval-info-card">
          <a-descriptions bordered :column="2">
            <a-descriptions-item label="审批标题" :span="2">
              <span class="text-lg font-semibold">{{ instance?.title }}</span>
            </a-descriptions-item>
            <a-descriptions-item label="实例编号">
              <span class="font-mono text-sm">{{ instance?.instance_no }}</span>
            </a-descriptions-item>
            <a-descriptions-item label="紧急程度">
              <a-tag
                v-if="instance?.urgency"
                :color="getUrgencyConfig(instance.urgency).color"
              >
                {{ getUrgencyConfig(instance.urgency).text }}
              </a-tag>
            </a-descriptions-item>
            <a-descriptions-item label="发起时间">
              {{ instance?.started_at ? formatDateTime(instance.started_at) : '-' }}
            </a-descriptions-item>
          </a-descriptions>

          <!-- 申请描述 -->
          <a-divider orientation="left">
            <span class="divider-text">
              <Icon icon="ant-design:form-outlined" class="divider-icon" />
              申请内容
            </span>
          </a-divider>
          
          <div v-if="getApplicationDescription()" class="application-content-wrapper">
            <div class="application-content-card">
              <div class="content-header">
                <div class="header-accent"></div>
                <Icon icon="ant-design:file-text-filled" class="content-icon" />
                <span class="content-label">申请详情</span>
              </div>
              <div class="content-body">
                <div class="content-quote-start">"</div>
                <p class="content-text">{{ getApplicationDescription() }}</p>
                <div class="content-quote-end">"</div>
              </div>
              <div class="content-footer">
                <Icon icon="ant-design:clock-circle-outlined" class="footer-icon" />
                <span class="footer-text">{{ formatDateTime(instance?.started_at || '') }}</span>
              </div>
            </div>
          </div>
          
          <div v-else class="empty-content-state">
            <div class="empty-content-icon-wrapper">
              <Icon icon="ant-design:file-search-outlined" class="empty-content-icon" />
            </div>
            <div class="empty-content-text">暂无申请内容</div>
            <div class="empty-content-hint">等待申请人补充详细信息</div>
          </div>
        </a-card>

        <!-- 审批意见 -->
        <a-card title="审批意见">
          <a-textarea
            v-model:value="opinion"
            :rows="6"
            placeholder="请输入审批意见（可选）"
            :disabled="isCancelled"
          />
        </a-card>

        <!-- 操作按钮 -->
        <a-space>
          <a-button
            :loading="submitting"
            :disabled="isCancelled"
            size="large"
            type="primary"
            @click="handleApprove"
          >
            <template #icon>
              <Icon icon="ant-design:check-outlined" />
            </template>
            同意
          </a-button>
          <a-button
            :loading="submitting"
            :disabled="isCancelled"
            danger
            size="large"
            @click="handleReject"
          >
            <template #icon>
              <Icon icon="ant-design:close-outlined" />
            </template>
            拒绝
          </a-button>
          <a-button
            :disabled="isCancelled"
            size="large"
            @click="handleOpenDelegateDialog"
          >
            <template #icon>
              <Icon icon="ant-design:user-add-outlined" />
            </template>
            转交
          </a-button>
          <a-button
            :disabled="isCancelled"
            size="large"
            @click="handleOpenReturnDialog"
          >
            <template #icon>
              <Icon icon="ant-design:rollback-outlined" />
            </template>
            退回
          </a-button>
        </a-space>
      </div>
    </a-spin>

    <!-- 转交对话框 -->
    <a-modal
      v-model:open="delegateDialogOpen"
      title="转交审批"
      @ok="handleConfirmDelegate"
    >
      <div class="py-4">
        <a-form-item label="选择用户">
          <a-select
            v-model:value="selectedUserId"
            placeholder="请选择转交对象"
            show-search
            :filter-option="(input: string, option: any) => {
              return option.label.toLowerCase().includes(input.toLowerCase());
            }"
          >
            <a-select-option
              v-for="user in users"
              :key="user.id"
              :value="user.id"
              :label="`${user.nickname || user.username} (${user.dept?.name || '无部门'})`"
            >
              {{ user.nickname || user.username }} ({{ user.dept?.name || '无部门' }})
            </a-select-option>
          </a-select>
        </a-form-item>
      </div>
    </a-modal>

    <!-- 退回对话框 -->
    <a-modal
      v-model:open="returnDialogOpen"
      title="退回审批"
      @ok="handleConfirmReturn"
    >
      <div class="py-4">
        <a-form-item label="选择节点">
          <a-select
            v-model:value="selectedNodeId"
            placeholder="请选择退回到的节点"
          >
            <a-select-option
              v-for="node in returnableNodes"
              :key="node.id"
              :value="node.id"
            >
              {{ node.name }}
            </a-select-option>
          </a-select>
        </a-form-item>
        <a-alert
          message="提示"
          description="选择退回节点后，流程将从该节点重新开始审批"
          type="info"
          show-icon
        />
      </div>
    </a-modal>
  </Page>
</template>

<style scoped>
/* 流程进度卡片 */
.flow-progress-card {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* 审批信息卡片 */
.approval-info-card {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* ======================
   分割线样式
   ====================== */
.divider-text {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.85);
}

.divider-icon {
  font-size: 18px;
  color: #1890ff;
}

/* ======================
   申请内容包装器
   ====================== */
.application-content-wrapper {
  position: relative;
  padding: 0;
}

/* ======================
   申请内容卡片
   ====================== */
.application-content-card {
  background: linear-gradient(135deg, 
    rgba(24, 144, 255, 0.08) 0%, 
    rgba(82, 196, 26, 0.08) 100%
  );
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 12px;
  padding: 0;
  overflow: hidden;
  backdrop-filter: blur(10px);
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.12),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.application-content-card:hover {
  transform: translateY(-2px);
  box-shadow: 
    0 12px 40px rgba(0, 0, 0, 0.18),
    inset 0 1px 0 rgba(255, 255, 255, 0.15);
  border-color: rgba(24, 144, 255, 0.3);
}

/* 内容头部 */
.content-header {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px 24px;
  background: linear-gradient(90deg, 
    rgba(24, 144, 255, 0.1) 0%, 
    rgba(82, 196, 26, 0.05) 100%
  );
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.header-accent {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  background: linear-gradient(180deg, #1890ff 0%, #52c41a 100%);
}

.content-icon {
  font-size: 22px;
  color: #1890ff;
  filter: drop-shadow(0 2px 4px rgba(24, 144, 255, 0.4));
}

.content-label {
  font-size: 16px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  letter-spacing: 0.5px;
}

/* 内容主体 */
.content-body {
  position: relative;
  padding: 32px 28px;
  background: rgba(0, 0, 0, 0.15);
}

.content-quote-start,
.content-quote-end {
  position: absolute;
  font-size: 80px;
  font-family: Georgia, serif;
  color: rgba(24, 144, 255, 0.15);
  font-weight: bold;
  line-height: 1;
}

.content-quote-start {
  top: 12px;
  left: 12px;
}

.content-quote-end {
  bottom: 12px;
  right: 12px;
}

.content-text {
  font-size: 16px;
  line-height: 2;
  color: rgba(255, 255, 255, 0.9);
  white-space: pre-wrap;
  word-break: break-word;
  margin: 0;
  padding: 0 24px;
  position: relative;
  z-index: 1;
  text-indent: 2em;
  letter-spacing: 0.5px;
}

/* 内容底部 */
.content-footer {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px 24px;
  background: rgba(0, 0, 0, 0.1);
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.footer-icon {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.5);
}

.footer-text {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.6);
  font-style: italic;
}

/* ======================
   空状态
   ====================== */
.empty-content-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 24px;
  background: linear-gradient(135deg, 
    rgba(140, 140, 140, 0.05) 0%, 
    rgba(140, 140, 140, 0.02) 100%
  );
  border-radius: 12px;
  border: 1px dashed rgba(255, 255, 255, 0.15);
}

.empty-content-icon-wrapper {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, 
    rgba(140, 140, 140, 0.1) 0%, 
    rgba(140, 140, 140, 0.05) 100%
  );
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
}

.empty-content-icon {
  font-size: 40px;
  color: rgba(255, 255, 255, 0.3);
}

.empty-content-text {
  font-size: 16px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.5);
  margin-bottom: 8px;
}

.empty-content-hint {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.35);
  font-style: italic;
}

/* ======================
   通用样式
   ====================== */
.text-lg {
  font-size: 16px;
}

.font-semibold {
  font-weight: 600;
}

.text-sm {
  font-size: 13px;
}

.font-mono {
  font-family: 'Courier New', Courier, monospace;
}
</style>
